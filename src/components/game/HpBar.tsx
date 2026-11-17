import { MAX_HP } from '../../game/types';

interface Props {
  hp: number;
  lastDamage: number | null;
}

export function HpBar({ hp, lastDamage }: Props) {
  const pct = (hp / MAX_HP) * 100;
  return (
    <div className="w-full">
      <div className="mb-1 flex items-end justify-between">
        <span className="text-xs font-bold tracking-widest text-[var(--site-muted)]">
          嘴硬值
        </span>
        <span className="relative font-mono text-sm font-black text-[var(--site-fg)]">
          {hp}
          <span className="text-[var(--site-muted)]"> / {MAX_HP}</span>
          {lastDamage !== null && lastDamage > 0 && (
            <span key={hp} className="dmg-float" aria-hidden>
              −{lastDamage}
            </span>
          )}
          {lastDamage === 0 && (
            <span key={`miss-${hp}`} className="dmg-float dmg-miss" aria-hidden>
              MISS
            </span>
          )}
        </span>
      </div>
      <div
        className="hp-track"
        role="progressbar"
        aria-valuenow={hp}
        aria-valuemin={0}
        aria-valuemax={MAX_HP}
        aria-label="嘴硬值"
      >
        <div
          key={hp}
          className={`hp-fill ${lastDamage ? 'hp-hit' : ''}`}
          style={{ width: `${pct}%` }}
        />
        <div className="hp-segments" aria-hidden />
      </div>
    </div>
  );
}