import type { Engine, TurnRequest, TurnEvents, Judgment } from '../game/types';
import { consumeSSE } from './sse';

// ApiEngine：与 MockEngine 同构。消费云函数 SSE（token/reset/judgment/done/error）。
// 客户端总预算 30s（服务端演员/裁判各 8s 并行 + 引导开销）；失败 → onError → 前端重试。
const CLIENT_BUDGET_MS = 30000;

export const apiEngine: Engine = {
  async sendTurn(req: TurnRequest, events: TurnEvents) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_BUDGET_MS);
    let draft = '';
    let judgment: (Judgment & { fullText?: string }) | null = null;
    try {
      const resp = await fetch('/functions/v1/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(req),
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
          } else if (frame.event === 'judgment') {
            judgment = JSON.parse(frame.data);
          } else if (frame.event === 'done') {
            return true;
          } else if (frame.event === 'error') {
            throw new Error('turn_failed');
          }
          return false;
        },
        { signal: controller.signal },
      );
      const result = judgment as (Judgment & { fullText?: string }) | null;
      if (!result) throw new Error('no_judgment');
      const { fullText, ...j } = result;
      events.onJudgment(j, fullText ?? draft);
    } catch (e) {
      events.onError(e instanceof Error ? e : new Error('turn_failed'));
    } finally {
      clearTimeout(timer);
    }
  },
};