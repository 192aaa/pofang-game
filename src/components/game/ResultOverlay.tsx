import { useMemo } from 'react';
import type { GameState } from '../../game/reducer';
import { BOSS } from '../../game/persona';
import { drawResultCard } from '../../card/resultCard';

interface Props {
  state: GameState;
  onRestart: () => void;
}

export function ResultOverlay({ state, onRestart }: Props) {
  const victory = state.phase === 'victory';
  const cardUrl = useMemo(
    () =>
      drawResultCard({
        victory,
        rounds: state.round,
        hpLeft: state.hp,
        bestHit: state.bestHit,
        bossName: `${BOSS.name} · ${BOSS.title}`,
        bossClaim: BOSS.claim,
      }),
    // 仅在进入结算时生成一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.phase],
  );

  return (
    <div className="result-overlay" role="dialog" aria-modal="true" aria-label="对局结算">
      <div className="result-panel">
        <img
          src={cardUrl}
          alt={victory ? '破防成功战绩卡' : '挑战失败战绩卡'}
          className="result-img"
        />
        <div className="mt-3 flex w-full gap-2">
          <a className="send-btn flex-1 text-center" href={cardUrl} download="破防战报.png">
            保存战绩卡
          </a>
          <button type="button" className="ammo-btn flex-1 justify-center" onClick={onRestart}>
            🔄 再来一局
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-[var(--site-muted)]">
          手机端可长按图片保存 · 发到群里挑衅朋友
        </p>
      </div>
    </div>
  );
}