import { BOSS } from '../../game/persona';
import { ENGINE_MODE } from '../../engine';
import { HpBar } from './HpBar';

interface Props {
  hp: number;
  lastDamage: number | null;
}

export function BossHeader({ hp, lastDamage }: Props) {
  return (
    <header className="border-b border-[var(--site-border)] bg-[var(--site-surface)] px-[calc(16px*var(--site-space,1))] py-[calc(12px*var(--site-space,1))]">
      <div className="mb-2 flex items-center gap-3">
        <div className="boss-avatar" aria-hidden>
          {BOSS.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-[var(--site-fg)]">
              {BOSS.name}
            </h1>
            <span className="rounded-full border border-[var(--site-border)] px-2 py-0.5 text-[10px] text-[var(--site-muted)]">
              {BOSS.title}
            </span>
          </div>
          <p className="truncate text-xs text-[var(--site-muted)]">
            「{BOSS.claim}」
          </p>
        </div>
        {ENGINE_MODE === 'mock' && (
          <span className="shrink-0 rounded border border-dashed border-[var(--site-muted)] px-1.5 py-0.5 text-[10px] text-[var(--site-muted)]">
            演示引擎
          </span>
        )}
      </div>
      <HpBar hp={hp} lastDamage={lastDamage} />
    </header>
  );
}