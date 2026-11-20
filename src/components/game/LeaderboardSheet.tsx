import { rankRecords } from '../../game/customBoss';
import type { ChallengeRecord } from '../../game/customBoss';

interface Props {
  bossName: string;
  creator: string;
  records: ChallengeRecord[];
  onClose: () => void;
}

export function LeaderboardSheet({ bossName, creator, records, onClose }: Props) {
  const ranked = rankRecords(records);
  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="守擂榜" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <h2 className="sheet-title">🏆 守擂榜</h2>
            <p className="mt-1 text-[11px] text-[var(--site-muted)]">
              「{bossName}」擂台 · 擂主 {creator} · 共 {records.length} 条战绩
            </p>
          </div>
          <button type="button" className="ammo-btn shrink-0" onClick={onClose}>
            关闭
          </button>
        </div>

        {ranked.length === 0 ? (
          <p className="board-empty">
            还没有人交卷。打完一局，把战绩写进链接，再传给下一个人。
          </p>
        ) : (
          <ol className="board-list">
            {ranked.map((r, i) => (
              <li key={`${r.name}-${i}`} className="board-row">
                <span className="board-rank">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-xs text-[var(--site-fg)]">{r.name}</b>
                  <span className="text-[10px] text-[var(--site-muted)]">
                    {r.win ? `破防成功 · ${r.rounds} 回合 · 最佳 −${r.best}` : `没破防 · 最佳 −${r.best}`}
                  </span>
                </span>
                <span className={`text-xs font-black ${r.win ? 'text-[var(--game-gold)]' : 'text-[var(--site-muted)]'}`}>
                  {r.win ? '胜' : '败'}
                </span>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-3 text-[10px] leading-relaxed text-[var(--site-muted)]">
          规则：榜单跟着挑战链接走。你交卷后会生成一条新链接，把它发回群里，下一位挑战者就能看到全部战绩。只保留最近 20 条。
        </p>
      </div>
    </div>
  );
}
