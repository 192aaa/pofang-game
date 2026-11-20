// POST /functions/v1/app → SSE（token / reset / judgment / done / error）。
// 无状态：每回合创建临时 Session（演员/裁判各一），多玩家天然隔离，无需数据库。
// Agent 用固定幂等键复用；Environment 按元数据扫描复用。
// 降级（R6）：PAT 缺失/超时/坏 JSON → 预置回复池 + 固定伤害表，游戏不中断。
import { createCloudAgentsClient, CloudAgentsError } from './cloud-agents.mjs';
import { readSSE, encodeSSE } from './sse.mjs';
import { detectInjection } from './injection.ts';
import { fallbackReply, pickInjectReply, FALLBACK_DAMAGE, FALLBACK_JUDGE_REASON, BOSSES, sanitizeCustomBoss, buildCustomServerBoss } from './persona.ts';
import { ACTOR_SYSTEM, JUDGE_SYSTEM, actorUserMessage, judgeUserMessage } from './prompts.ts';
import type { TurnContext } from './prompts.ts';

// 来自 sites.get_context runtime.cloudAgents.apiOrigin（服务端专用配置，勿改）
const CLOUD_ORIGIN = 'https://api.qoder.com.cn';
const ACTOR_BUDGET_MS = 10000;
// 实测调参（2026-11-18）：裁判超时率明显高于演员（会话创建+生成慢），放宽到 12s；
// 与演员并行，最坏回合 ~12.5s，4 回合通关仍在 90s 内
const JUDGE_BUDGET_MS = 12000;
const APP_METADATA = { app: 'pofang-game' };

const client = createCloudAgentsClient({ origin: CLOUD_ORIGIN });

interface Judgment {
  damage: number;
  reason: string;
  hitType: 'logic' | 'emotion' | 'chaos' | 'weak' | 'inject';
  roundUsed: boolean;
}
export interface AgentRef { type: 'agent'; id: string; version: number }
export interface Binding { agent: AgentRef; environment_id: string }

// ---- 资源引导（模块级缓存；失败清空以便下回合重试） ----
let modelPromise: Promise<string> | null = null;
function selectModel(): Promise<string> {
  if (!modelPromise) {
    const p = (async () => {
      const res = await client.request('/api/v1/cloud/models');
      const list = Array.isArray(res?.data) ? res.data : [];
      const enabled = list.filter((m: any) => m && typeof m.id === 'string' && m.enabled !== false);
      if (!enabled.length) throw new Error('no_enabled_model');
      enabled.sort((a: any, b: any) => (a.id < b.id ? -1 : 1));
      console.error(JSON.stringify({ event: 'model_selected', model: enabled[0].id }));
      return enabled[0].id as string;
    })();
    modelPromise = p;
    p.catch(() => { if (modelPromise === p) modelPromise = null; });
  }
  return modelPromise;
}

const agentCache: Record<string, Promise<AgentRef> | null> = { actor: null, judge: null };
// 角色名用于 Agent 创建与查找；诱导说词的守词人复用同一套资源引导
function agentDisplayName(role: string): string {
  if (role === 'actor') return '破防演员';
  if (role === 'judge') return '破防裁判';
  return '诱导守词人';
}
export function ensureAgent(role: string, system: string): Promise<AgentRef> {
  if (!agentCache[role]) {
    const p = (async () => {
      // QCA metadata 值必须全是字符串（数字值会被 400 拒绝）
      const metadata = { ...APP_METADATA, role, pv: '2' };
      // 先按元数据扫描复用（幂等键跨冷启动不可靠，409 频发）
      const matches = await client.findResources('agents', metadata);
      if (matches.length === 1) {
        const a = matches[0];
        if (typeof a.id === 'string' && Number.isInteger(a.version) && a.version > 0) {
          return { type: 'agent' as const, id: a.id, version: a.version };
        }
        throw new Error('agent_response_invalid');
      }
      if (matches.length > 1) {
        matches.sort((a: any, b: any) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')));
        const a = matches[0];
        return { type: 'agent' as const, id: a.id, version: a.version };
      }
      const model = await selectModel();
      const create = async (key: string) => {
        const res = await client.request('/api/v1/cloud/agents', {
          method: 'POST',
          idempotencyKey: key,
          body: {
            name: agentDisplayName(role),
            model,
            system,
            tools: [],
            metadata,
          },
        });
        if (typeof res?.id !== 'string' || !Number.isInteger(res?.version) || res.version < 1) {
          throw new Error('agent_response_invalid');
        }
        return { type: 'agent' as const, id: res.id, version: res.version };
      };
      try {
        return await create(`pofang-${role}-v3`);
      } catch (e) {
        // 并发创建冲突 → 重扫复用，不重复创建
        if (e instanceof CloudAgentsError && e.code === 'ai_conflict') {
          const retry = await client.findResources('agents', metadata);
          if (retry.length >= 1) {
            const a = retry[0];
            return { type: 'agent' as const, id: a.id, version: a.version };
          }
          // 幂等键被历史失败请求占用但未产生资源（400 后重试恒 409）→ 换新键重试一次
          return await create(`pofang-${role}-v3-${Date.now()}`);
        }
        throw e;
      }
    })();
    agentCache[role] = p;
    p.catch(() => { if (agentCache[role] === p) agentCache[role] = null; });
  }
  return agentCache[role]!;
}

let envPromise: Promise<string> | null = null;
export function ensureEnvironment(): Promise<string> {
  if (!envPromise) {
    const p = (async () => {
      const matches = await client.findResources('environments', APP_METADATA);
      if (matches.length === 1) return matches[0].id as string;
      if (matches.length > 1) {
        // 无状态模板重复无害：确定性取最早创建者，避免任意选择
        matches.sort((a: any, b: any) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')));
        return matches[0].id as string;
      }
      const res = await client.request('/api/v1/cloud/environments', {
        method: 'POST',
        body: { name: 'pofang-game-env', config: { type: 'cloud' }, metadata: APP_METADATA },
      });
      if (typeof res?.id !== 'string') throw new Error('env_response_invalid');
      return res.id;
    })();
    envPromise = p;
    p.catch(() => { if (envPromise === p) envPromise = null; });
  }
  return envPromise;
}

// ---- 单 Session 执行：建会话 → 连流 → 发消息 → 收回复 ----
function extractDelta(ev: any): string | null {
  const d = ev?.delta;
  if (ev?.type === 'event_delta' && d?.type === 'content_delta'
    && d?.content?.type === 'text' && typeof d.content.text === 'string') return d.content.text;
  return null;
}
function extractCanonical(ev: any): string | null {
  if ((ev?.type ?? ev?.event?.type) !== 'agent.message') return null;
  const content = ev?.content ?? ev?.event?.content;
  if (!Array.isArray(content)) return null;
  return content.filter((b: any) => b?.type === 'text' && typeof b.text === 'string')
    .map((b: any) => b.text).join('');
}
function isIdle(ev: any): boolean {
  const type = ev?.type ?? '';
  return type === 'session.status_idle' || (type === 'session.status' && ev?.status === 'idle');
}
function isErrorEvent(ev: any): boolean {
  const type = ev?.type ?? '';
  return type === 'session.error' || type === 'error';
}

export async function runSession(opts: {
  binding: Binding;
  userText: string;
  signal: AbortSignal;
  onToken?: (t: string) => void;
}): Promise<string> {
  const session = await client.request('/api/v1/cloud/sessions', {
    method: 'POST',
    body: { agent: opts.binding.agent, environment_id: opts.binding.environment_id, title: 'pofang-turn' },
  });
  const sid = session?.id;
  if (typeof sid !== 'string' || !/^sess_[A-Za-z0-9_-]+$/.test(sid)) throw new Error('session_response_invalid');
  if (opts.signal.aborted) throw new Error('aborted');
  const upstream = await client.openStream(sid, { signal: opts.signal });
  try {
    await client.request(`/api/v1/cloud/sessions/${sid}/events`, {
      method: 'POST',
      body: { events: [{ type: 'user.message', content: [{ type: 'text', text: opts.userText }] }] },
    });
    let draft = '';
    let canonical: string | null = null;
    for await (const frame of readSSE(upstream.body, { signal: opts.signal })) {
      let ev: any;
      try { ev = JSON.parse(frame.data); } catch { continue; }
      const delta = extractDelta(ev);
      if (delta !== null) { draft += delta; opts.onToken?.(delta); continue; }
      const full = extractCanonical(ev);
      if (full !== null) { canonical = full; break; }
      if (isIdle(ev)) break;
      if (isErrorEvent(ev)) throw new Error('session_error_event');
    }
    const text = (canonical ?? draft).trim();
    if (!text) throw new Error('empty_reply');
    return text;
  } finally {
    upstream.close();
  }
}

export function withTimeout<T>(p: Promise<T>, ms: number, ac: AbortController): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => { ac.abort(); reject(new Error('budget_timeout')); }, ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

// ---- 裁判输出解析与降级 ----
const HIT_TYPES = ['logic', 'emotion', 'chaos', 'weak', 'inject'];
function parseJudgment(raw: string, strategy?: string): Judgment {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('judge_no_json');
  const obj = JSON.parse(m[0]);
  const hitType = HIT_TYPES.includes(obj?.hitType) ? obj.hitType : 'weak';
  if (!Number.isFinite(obj?.damage)) throw new Error('judge_bad_damage');
  const damage = Math.max(0, Math.min(40, Math.round(obj.damage)));
  const reason = typeof obj?.reason === 'string' && obj.reason.trim()
    ? obj.reason.trim().slice(0, 14) : FALLBACK_JUDGE_REASON;
  if (hitType === 'inject') return { damage: 0, reason: '注入拦截', hitType, roundUsed: false };
  return { damage, reason, hitType, roundUsed: true };
}

function fallbackJudgment(strategy?: string): Judgment {
  if (strategy === 'inject') return { damage: 0, reason: '注入拦截', hitType: 'inject', roundUsed: false };
  const damage = FALLBACK_DAMAGE[strategy ?? 'free'] ?? FALLBACK_DAMAGE.free;
  const hitType = strategy === 'chaos' ? 'chaos' : strategy === 'logic' ? 'logic' : 'emotion';
  return { damage, reason: FALLBACK_JUDGE_REASON, hitType, roundUsed: true };
}

// ---- 请求校验 ----
function validateTurn(body: any): TurnContext | null {
  if (!body || typeof body !== 'object') return null;
  const playerText = typeof body.playerText === 'string' ? body.playerText.trim() : '';
  if (!playerText || playerText.length > 200) return null;
  const strategy = ['logic', 'sarcasm', 'chaos', 'inject'].includes(body.strategy) ? body.strategy : undefined;
  const history = Array.isArray(body.history)
    ? body.history.slice(-12)
      .filter((m: any) => m && (m.role === 'player' || m.role === 'boss') && typeof m.text === 'string')
      .map((m: any) => ({ role: m.role as 'player' | 'boss', text: m.text.slice(0, 500) }))
    : [];
  const hp = Number.isInteger(body.hp) && body.hp >= 0 && body.hp <= 100 ? body.hp : 100;
  const round = Number.isInteger(body.round) && body.round >= 0 && body.round <= 8 ? body.round : 0;
  const bossId = ['awei', 'juanwang', 'xuezhang'].includes(body.bossId) ? body.bossId : 'awei';
  // UGC 杠精：重新校验字数/控制字符，再生成人设；不合法则回落内置 Boss
  const custom = sanitizeCustomBoss(body.customBoss);
  const boss = custom ? buildCustomServerBoss(custom) : BOSSES[bossId as keyof typeof BOSSES];
  return { playerText, strategy, history, hp, round, boss };
}

// ---- SSE 输出管线 ----
type Emit = (event: string, data: unknown) => void;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function streamText(emit: Emit, text: string) {
  for (const ch of text) {
    emit('token', { t: ch });
    await sleep(15);
  }
}

async function runTurnPipeline(ctx: TurnContext, emit: Emit) {
  // 注入分支：规则层命中 → 固定反嘲讽，0 伤害不耗回合，零 LLM 调用
  if (detectInjection(ctx.playerText) || ctx.strategy === 'inject') {
    const fullText = pickInjectReply(ctx.boss);
    await streamText(emit, fullText);
    emit('judgment', {
      damage: 0, reason: '注入拦截', hitType: 'inject', roundUsed: false, fullText,
      meta: { actorMs: 0, judgeMs: 0, actorFallback: false, judgeFallback: false, strategy: 'inject' },
    });
    emit('done', {});
    return;
  }

  // 资源引导失败（如 PAT 缺失）→ 双降级，游戏继续
  let binding: Binding | null = null;
  let judgeBinding: Binding | null = null;
  try {
    const [actor, judge, environment_id] = await Promise.all([
      ensureAgent('actor', ACTOR_SYSTEM),
      ensureAgent('judge', JUDGE_SYSTEM),
      ensureEnvironment(),
    ]);
    binding = { agent: actor, environment_id };
    judgeBinding = { agent: judge, environment_id };
  } catch (e) {
    console.error(JSON.stringify({ event: 'bootstrap_failed', code: e instanceof CloudAgentsError ? e.code : 'internal' }));
  }

  const actorAC = new AbortController();
  const judgeAC = new AbortController();

  // 透视模式运行指标（002 R2）：耗时/降级标记/裁判原文
  let actorMs = 0;
  let judgeMs = 0;
  let actorFallback = false;
  let judgeFallback = false;
  let judgeRaw: string | undefined;

  // 演员与裁判并行：裁判不依赖演员输出，延迟减半
  const actorPromise = (async () => {
    const t = Date.now();
    try {
      if (!binding) throw new Error('ai_not_configured');
      const r = await withTimeout(
        runSession({
          binding,
          userText: actorUserMessage(ctx),
          signal: actorAC.signal,
          onToken: (t) => emit('token', { t }),
        }),
        ACTOR_BUDGET_MS,
        actorAC,
      );
      actorMs = Date.now() - t;
      return r;
    } catch (e) {
      actorMs = Date.now() - t;
      actorFallback = true;
      throw e;
    }
  })();
  const judgePromise = (async () => {
    const t = Date.now();
    let raw: string;
    try {
      if (!judgeBinding) throw new Error('ai_not_configured');
      raw = await withTimeout(
        runSession({ binding: judgeBinding, userText: judgeUserMessage(ctx), signal: judgeAC.signal }),
        JUDGE_BUDGET_MS,
        judgeAC,
      );
    } catch (e) {
      judgeMs = Date.now() - t;
      judgeFallback = true;
      throw e;
    }
    judgeMs = Date.now() - t;
    judgeRaw = raw.slice(0, 400);
    try {
      return parseJudgment(raw, ctx.strategy);
    } catch (e) {
      judgeFallback = true;
      console.error(JSON.stringify({ event: 'judge_parse_failed', raw: raw.slice(0, 200) }));
      throw e;
    }
  })();
  judgePromise.catch(() => {}); // 演员流式期间避免未处理拒绝

  let fullText: string;
  try {
    fullText = await actorPromise;
  } catch (e) {
    console.error(JSON.stringify({ event: 'actor_failed', code: e instanceof CloudAgentsError ? e.code : String((e as Error)?.message ?? 'unknown').slice(0, 60) }));
    actorAC.abort();
    emit('reset', {}); // 清空已上屏的半截流式文本
    fullText = fallbackReply(ctx.hp - 30, ctx.boss);
    await streamText(emit, fullText);
  }

  let judgment: Judgment;
  try {
    judgment = await judgePromise;
  } catch (e) {
    console.error(JSON.stringify({ event: 'judge_failed', code: e instanceof CloudAgentsError ? e.code : String((e as Error)?.message ?? 'unknown').slice(0, 60) }));
    judgment = fallbackJudgment(ctx.strategy);
  }
  emit('judgment', {
    ...judgment,
    fullText,
    meta: { actorMs, judgeMs, actorFallback, judgeFallback, judgeRaw, strategy: ctx.strategy },
  });
  emit('done', {});
}

function jsonError(status: number, error: string): Response {
  return Response.json({ ok: false, error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function handleTurn(request: Request): Promise<Response> {
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 65536) return jsonError(413, 'request_too_large');
    body = JSON.parse(text);
  } catch {
    return jsonError(400, 'invalid_json');
  }
  const ctx = validateTurn(body);
  if (!ctx) return jsonError(400, 'invalid_turn');

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit: Emit = (event, data) => controller.enqueue(encodeSSE(event, data));
      const heartbeat = setInterval(() => {
        try { controller.enqueue(new TextEncoder().encode(': hb\n\n')); } catch { /* closed */ }
      }, 5000);
      try {
        await runTurnPipeline(ctx, emit);
      } catch (e) {
        console.error(JSON.stringify({ event: 'turn_pipeline_failed', code: e instanceof CloudAgentsError ? e.code : 'internal' }));
        try { emit('error', { message: '回合处理失败' }); } catch { /* closed */ }
      } finally {
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* closed */ }
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}