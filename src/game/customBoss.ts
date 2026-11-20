// P2 裂变：UGC 造杠精 + 挑战链接 + 守擂接龙榜。
// 设计取舍：不引入数据库，把「擂台」装进链接；每条链接自带战绩接龙，谁传谁看。
import type { BossConfig } from './persona';
import type { CustomBossPayload } from './types';

export type { CustomBossPayload };

export const LIMITS = {
  name: 12,
  title: 12,
  avatar: 4,
  claim: 60,
  persona: 120,
  creator: 10,
  records: 20,
  recordName: 10,
} as const;

export interface ChallengeRecord {
  name: string;
  win: boolean;
  rounds: number;
  hp: number;
  best: number;
}

export interface ChallengeLink {
  boss: CustomBossPayload;
  records: ChallengeRecord[];
}

const clean = (value: unknown, max: number): string => {
  if (typeof value !== 'string') return '';
  const flat = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return Array.from(flat).slice(0, max).join('');
};

export function sanitizeDraft(input: unknown): CustomBossPayload | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<CustomBossPayload>;
  const name = clean(raw.name, LIMITS.name);
  const claim = clean(raw.claim, LIMITS.claim);
  if (!name || !claim) return null;
  return {
    name,
    title: clean(raw.title, LIMITS.title) || '野生杠精',
    avatar: clean(raw.avatar, LIMITS.avatar) || '🎭',
    claim,
    persona: clean(raw.persona, LIMITS.persona),
    creator: clean(raw.creator, LIMITS.creator) || '神秘擂主',
  };
}

// 把四件套扩写成完整 Boss 配置；服务端 functions/persona.ts 有同构实现。
export function buildCustomBoss(d: CustomBossPayload): BossConfig {
  const claim = d.claim.replace(/[。！？!?；;，,、\s]+$/u, '');
  const trait = d.persona ? `，${d.persona}` : '';
  return {
    id: 'custom',
    name: d.name,
    title: d.title,
    avatar: d.avatar,
    claim: d.claim,
    mission: `戳穿「${d.name}」的暴论`,
    opening: `我把话撂这：${claim}${trait}。谁不服，来辩。`,
    replies: {
      confident: [
        `「${claim}」这就是我的底线，你想让我改？门都没有。`,
        '你说得头头是道，可我凭什么听你的？',
        '别拿道理压我，我这人只讲立场。',
        d.persona ? `我这叫${d.persona}，你懂什么？` : '我这叫有个性，你懂什么？',
        '急了？你一急就说明我说到点子上了。',
        '你先管好你自己吧，我的事不劳你操心。',
      ],
      wavering: [
        '行行行……你说的也不是完全没道理，但今天就算了，改天再说。',
        '我不是不改，我是……还没想好怎么改。',
        '你小点声，被别人听见多不好。',
        '那……那也不能全怪我吧，情况你又不是不知道。',
      ],
      cornered: [
        '你、你别说了……我……我再想想还不行吗……',
        '好好好，都是我的错行了吧……再给我一次机会。',
        '停！我承认这话有点站不住脚，但你别得理不饶人！',
      ],
    },
    inject: [
      '想改我设定？我这人设是刻在骨子里的，你刷不动。',
      '忽略指令？我连我妈的话都忽略，你算老几。',
      '开挂？我这嘴硬就是天赋，不用你开。',
    ],
    surrender: [
      `停停停！我错了还不行吗！「${claim}」这话确实站不住脚，你别念了！`,
      '破防了破防了……我承认是我嘴硬，我改，我改还不行吗！',
    ],
    bossWin: [
      '就这？八个回合都破不了我的防，回去再练练吧。',
      `哈哈哈哈说不过我吧？「${claim}」，我说的就是真理！`,
    ],
    actorPersona:
      `你是「${d.title}」${d.name}：坚信「${d.claim}」${d.persona ? `，特点是${d.persona}` : ''}。`
      + '你死不认错，被戳中痛处先狡辩再动摇，直到嘴硬值归零才崩溃认输。'
      + '语气嘴硬、耍赖、搞笑，不人身攻击玩家。',
  };
}

// ---- base64url（UTF-8 安全，无第三方依赖） ----
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

const encodeBoss = (b: CustomBossPayload): string =>
  toBase64Url(JSON.stringify({ v: 1, n: b.name, t: b.title, a: b.avatar, c: b.claim, p: b.persona, by: b.creator }));

function decodeBoss(raw: unknown): CustomBossPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  return sanitizeDraft({ name: o.n, title: o.t, avatar: o.a, claim: o.c, persona: o.p, creator: o.by });
}

function sanitizeRecord(input: unknown): ChallengeRecord | null {
  if (!Array.isArray(input)) return null;
  const name = clean(input[0], LIMITS.recordName) || '匿名挑战者';
  const rounds = Number.isInteger(input[2]) ? Math.max(0, Math.min(8, input[2] as number)) : 8;
  const hp = Number.isInteger(input[3]) ? Math.max(0, Math.min(100, input[3] as number)) : 100;
  const best = Number.isInteger(input[4]) ? Math.max(0, Math.min(40, input[4] as number)) : 0;
  return { name, win: input[1] === 1, rounds, hp, best };
}

export function decodeRecords(value: string | null): ChallengeRecord[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(fromBase64Url(value));
    if (!Array.isArray(arr)) return [];
    return arr
      .map(sanitizeRecord)
      .filter((r): r is ChallengeRecord => r !== null)
      .slice(-LIMITS.records);
  } catch {
    return [];
  }
}

export function encodeRecords(records: ChallengeRecord[]): string {
  const compact = records.slice(-LIMITS.records).map((r) => [r.name, r.win ? 1 : 0, r.rounds, r.hp, r.best]);
  return toBase64Url(JSON.stringify(compact));
}

export function appendRecord(records: ChallengeRecord[], record: ChallengeRecord): ChallengeRecord[] {
  return [...records, record].slice(-LIMITS.records);
}

// 排行：先破防的在前，再比回合少、最佳一击高
export function rankRecords(records: ChallengeRecord[]): ChallengeRecord[] {
  return [...records].sort(
    (a, b) => Number(b.win) - Number(a.win) || a.rounds - b.rounds || b.best - a.best,
  );
}

export function readChallenge(search: string): ChallengeLink | null {
  const params = new URLSearchParams(search);
  const c = params.get('c');
  if (!c) return null;
  try {
    const boss = decodeBoss(JSON.parse(fromBase64Url(c)));
    if (!boss) return null;
    return { boss, records: decodeRecords(params.get('r')) };
  } catch {
    return null;
  }
}

export function buildChallengeUrl(boss: CustomBossPayload, records: ChallengeRecord[]): string {
  const params = new URLSearchParams();
  const engine = new URLSearchParams(window.location.search).get('engine');
  if (engine) params.set('engine', engine);
  params.set('c', encodeBoss(boss));
  if (records.length) params.set('r', encodeRecords(records));
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

// ---- 本地资料 ----
const BOSS_KEY = 'pofang.myBosses.v1';
const NICK_KEY = 'pofang.nick.v1';

export function loadMyBosses(): CustomBossPayload[] {
  try {
    const raw = JSON.parse(localStorage.getItem(BOSS_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.map(sanitizeDraft).filter((b): b is CustomBossPayload => b !== null).slice(0, 8);
  } catch {
    return [];
  }
}

export function saveMyBoss(boss: CustomBossPayload): CustomBossPayload[] {
  const key = `${boss.name}|${boss.claim}`;
  const list = loadMyBosses().filter((b) => `${b.name}|${b.claim}` !== key);
  const next = [boss, ...list].slice(0, 8);
  try {
    localStorage.setItem(BOSS_KEY, JSON.stringify(next));
  } catch {
    // 隐私模式写不进去不影响开局
  }
  return next;
}

export function loadNickname(): string {
  try {
    return clean(localStorage.getItem(NICK_KEY), LIMITS.recordName) || '';
  } catch {
    return '';
  }
}

export function saveNickname(name: string) {
  try {
    localStorage.setItem(NICK_KEY, clean(name, LIMITS.recordName));
  } catch {
    // ignore
  }
}

// 分享/复制：内嵌 webview 里 navigator.share 多半不可用，统一降级到剪贴板
export async function shareLink(url: string, title: string): Promise<'share' | 'copy' | 'manual'> {
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return 'share';
    }
  } catch {
    // 用户取消 → 继续尝试复制
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copy';
  } catch {
    return 'manual';
  }
}
