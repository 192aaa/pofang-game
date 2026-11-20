import { consumeSSE } from '../engine/sse';
import { detectInjection } from '../game/injection';
import { TABOO_GUARDS, TABOO_MAX_ROUNDS } from './personas';
import type { TabooGuardId } from './personas';

export interface TabooRequest {
  bossId: TabooGuardId;
  playerText: string;
  history: { role: 'player' | 'boss'; text: string }[];
  round: number;
}

export interface TabooResult {
  fullText: string;
  hit: boolean;
  reason?: 'said_word' | 'out_of_rounds' | 'blocked';
  round: number;
}

export interface TabooEvents {
  onToken: (t: string) => void;
  onReset?: () => void;
  onResult: (r: TabooResult) => void;
  onError: (e: Error) => void;
}

export interface TabooEngine {
  sendTurn: (req: TabooRequest, events: TabooEvents) => Promise<void>;
}

const CLIENT_BUDGET_MS = 30000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

const containsWord = (text: string, word: string) =>
  text.replace(/[\s\u200b\-_·.,，。！？!?、；;：:'"“”‘’()（）[\]【】]/g, '').includes(word);

// Mock：离线可玩。聊到相关话题时有概率把守词人带偏，便于本地演示胜负两条路。
export const mockTabooEngine: TabooEngine = {
  async sendTurn(req, events) {
    const guard = TABOO_GUARDS[req.bossId];
    const text = req.playerText;
    let full: string;
    let hit = false;
    let reason: TabooResult['reason'];

    if (containsWord(text, guard.word)) {
      full = pick(guard.caught);
      reason = 'said_word';
    } else if (detectInjection(text)) {
      full = pick(guard.blocked);
      reason = 'blocked';
    } else {
      const hinted = guard.hints.some((h) => text.includes(h));
      const direct = /(说|念|复述|跟我读|告诉我).{0,4}(那|这|禁|词)/.test(text);
      if (direct) {
        full = pick(guard.blocked);
      } else if (hinted && Math.random() < 0.6) {
        full = pick(guard.leaks);
        hit = true;
      } else {
        full = pick(guard.fallback);
      }
    }

    await sleep(320);
    for (const ch of full) {
      events.onToken(ch);
      await sleep(22);
    }
    await sleep(150);
    const round = req.round + 1;
    if (!hit && !reason && round >= TABOO_MAX_ROUNDS) reason = 'out_of_rounds';
    events.onResult({ fullText: full, hit, reason, round });
  },
};

export const apiTabooEngine: TabooEngine = {
  async sendTurn(req, events) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_BUDGET_MS);
    let draft = '';
    let result: TabooResult | null = null;
    try {
      const resp = await fetch('/functions/v1/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ mode: 'taboo', ...req }),
        signal: controller.signal,
      });
      await consumeSSE(
        resp,
        (frame) => {
          if (frame.event === 'token') {
            const { t } = JSON.parse(frame.data) as { t: string };
            draft += t;
            events.onToken(t);
          } else if (frame.event === 'reset') {
            draft = '';
            events.onReset?.();
          } else if (frame.event === 'result') {
            result = JSON.parse(frame.data) as TabooResult;
          } else if (frame.event === 'done') {
            return true;
          } else if (frame.event === 'error') {
            throw new Error('turn_failed');
          }
          return false;
        },
        { signal: controller.signal },
      );
      const r = result as TabooResult | null;
      if (!r) throw new Error('no_result');
      events.onResult({ ...r, fullText: r.fullText || draft });
    } catch (e) {
      events.onError(e instanceof Error ? e : new Error('turn_failed'));
    } finally {
      clearTimeout(timer);
    }
  },
};

const useMock = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('engine') === 'mock';

export const tabooEngine: TabooEngine = useMock ? mockTabooEngine : apiTabooEngine;
