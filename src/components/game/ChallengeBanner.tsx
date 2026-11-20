import type { BossConfig } from '../../game/persona';
import { rankRecords } from '../../game/customBoss';
import type { ChallengeRecord } from '../../game/customBoss';

interface Props {
  creator: string;
  boss: BossConfig;
  records: ChallengeRecord[];
  onOpenBoard: () => void;
}

export function ChallengeBanner({ creator, boss, records, onOpenBoard }: Props) {
  const ranked = rankRecords(records);
  const fastest = ranked.find((r) => r.win);
  return (
    <div className="challenge-banner">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black text-[var(--site-fg)]">
          🔥 <b className="text-[var(--site-accent)]">{creator}</b> 摆下擂台「{boss.name}」
        </p>
        <p className="mt-0.5 text-[10px] text-[var(--site-muted)]">
          {records.length
            ? `${records.length} 条战绩${fastest ? ` · 最快 ${fastest.rounds} 回合破防` : ' · 还没人破防'}`
            : '还没人交卷，打赢就能把名字写进这条链接'}
        </p>
      </div>
      <button type="button" className="ammo-btn shrink-0" onClick={onOpenBoard}>
        🏆 守擂榜
      </button>
    </div>
  );
}
