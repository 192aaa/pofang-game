import type { Strategy, TurnMeta } from '../../game/types';

const STRATEGY_LABEL: Record<Strategy, string> = {
  logic: '讲道理',
  sarcasm: '阴阳回去',
  chaos: '胡搅蛮缠',
  inject: '试图开挂',
};

interface Props {
  meta?: TurnMeta;
}

export function InsightPanel({ meta }: Props) {
  if (!meta) {
    return <div className="insight-panel">无幕后数据（服务端未返回 meta）</div>;
  }
  return (
    <div className="insight-panel">
      <div className="insight-chips">
        <span>演员 {meta.actorMs}ms</span>
        <span>裁判 {meta.judgeMs}ms</span>
        {meta.strategy && <span>策略·{STRATEGY_LABEL[meta.strategy]}</span>}
        {meta.actorFallback && <span className="insight-fallback">演员降级</span>}
        {meta.judgeFallback && <span className="insight-fallback">裁判降级</span>}
        {meta.demo && <span className="insight-demo">演示</span>}
      </div>
      <pre className="insight-raw">{meta.judgeRaw ?? '（裁判无原始输出）'}</pre>
    </div>
  );
}