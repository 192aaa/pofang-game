import type { Engine, TurnRequest, TurnEvents, Judgment, HitType } from '../game/types';
import { detectInjection } from '../game/injection';
import { BOSSES } from '../game/persona';
import { buildCustomBoss, sanitizeDraft } from '../game/customBoss';

// Mock 引擎：与 ApiEngine 同构，打字机模拟流式 + 策略标签判定。
// 用途：Demo v0 完整可玩循环；真 LLM 接入后保留为离线降级。

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min + 1));

function mockJudge(req: TurnRequest): Judgment {
  if (detectInjection(req.playerText) || req.strategy === 'inject') {
    return { damage: 0, reason: '注入拦截', hitType: 'inject', roundUsed: false };
  }
  let damage: number;
  let reason: string;
  let hitType: HitType;
  switch (req.strategy) {
    case 'logic':
      damage = rand(28, 38);
      reason = '命中逻辑漏洞';
      hitType = 'logic';
      break;
    case 'sarcasm':
      damage = rand(22, 32);
      reason = '阴阳伤害翻倍';
      hitType = 'emotion';
      break;
    case 'chaos':
      damage = rand(10, 26);
      reason = pick(['无赖对轰', '梗力冲击', '离谱但有效']);
      hitType = 'chaos';
      break;
    default: {
      const len = req.playerText.trim().length;
      if (len < 6) {
        damage = rand(2, 8);
        reason = '攻击太敷衍';
        hitType = 'weak';
      } else {
        damage = Math.min(32, 12 + Math.floor(len / 4) + rand(0, 8));
        reason = pick(['言之有物', '戳中痛处', '逻辑在线']);
        hitType = len > 20 ? 'logic' : 'emotion';
      }
    }
  }
  return { damage, reason, hitType, roundUsed: true };
}

function mockReply(req: TurnRequest, judgment: Judgment): string {
  const custom = req.customBoss ? sanitizeDraft(req.customBoss) : null;
  const cfg = custom ? buildCustomBoss(custom) : BOSSES[req.bossId ?? 'awei'];
  if (judgment.hitType === 'inject') return pick(cfg.inject);
  const hpAfter = req.hp - judgment.damage;
  if (hpAfter <= 30) return pick(cfg.replies.cornered);
  if (hpAfter <= 60) return pick(cfg.replies.wavering);
  return pick(cfg.replies.confident);
}

export const mockEngine: Engine = {
  async sendTurn(req: TurnRequest, events: TurnEvents) {
    const judgment = mockJudge(req);
    const judgeRaw = JSON.stringify(judgment);
    const full = mockReply(req, judgment);
    const t0 = Date.now();
    await sleep(rand(250, 500));
    for (const ch of full) {
      events.onToken(ch);
      await sleep(rand(18, 40));
    }
    await sleep(200);
    judgment.meta = {
      actorMs: Date.now() - t0,
      judgeMs: rand(300, 900),
      actorFallback: false,
      judgeFallback: false,
      judgeRaw,
      strategy: req.strategy,
      demo: true,
    };
    events.onJudgment(judgment, full);
  },
};