import type { BossConfig } from '../../game/persona';
import { BOSSES } from '../../game/persona';
import type { BossId } from '../../game/types';
import { ENGINE_MODE } from '../../engine';
import { HpBar } from './HpBar';

interface Props {
  boss: BossConfig;
  hp: number;
  lastDamage: number | null;
  insight: boolean;
  onToggleInsight: () => void;
  onSelectBoss: (id: BossId) => void;
  onCreateBoss: () => void;
  voiceOn: boolean;
  voiceAvailable: boolean;
  onToggleVoice: () => void;
  sfxOn: boolean;
  sfxAvailable: boolean;
  onToggleSfx: () => void;
}

export function BossHeader({
  boss,
  hp,
  lastDamage,
  insight,
  onToggleInsight,
  onSelectBoss,
  onCreateBoss,
  voiceOn,
  voiceAvailable,
  onToggleVoice,
  sfxOn,
  sfxAvailable,
  onToggleSfx,
}: Props) {
  return (
    <header className="border-b border-[var(--site-border)] bg-[var(--site-surface)] px-[calc(16px*var(--site-space,1))] py-[calc(12px*var(--site-space,1))]">
      <div className="mb-2 flex items-center gap-3">
        <div className="boss-avatar" aria-hidden>
          {boss.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-black text-[var(--site-fg)]">
              {boss.name}
            </h1>
            <span className="shrink-0 whitespace-nowrap rounded-full border border-[var(--site-border)] px-2 py-0.5 text-[10px] text-[var(--site-muted)]">
              {boss.title}
            </span>
          </div>
          <p className="truncate text-xs text-[var(--site-muted)]">
            「{boss.claim}」
          </p>
        </div>
        {ENGINE_MODE === 'mock' && (
          <span className="hidden shrink-0 rounded border border-dashed border-[var(--site-muted)] px-1.5 py-0.5 text-[10px] text-[var(--site-muted)] sm:inline-block">
            演示引擎
          </span>
        )}
        {sfxAvailable && (
          <button
            type="button"
            className={`insight-toggle ${sfxOn ? 'insight-on' : ''}`}
            onClick={onToggleSfx}
            aria-pressed={sfxOn}
            aria-label={sfxOn ? '关闭打击音效' : '开启打击音效'}
            title={sfxOn ? '关闭打击音效' : '开启打击音效'}
          >
            {sfxOn ? '🎵' : '🔕'}
          </button>
        )}
        {voiceAvailable && (
          <button
            type="button"
            className={`insight-toggle ${voiceOn ? 'insight-on' : ''}`}
            onClick={onToggleVoice}
            aria-pressed={voiceOn}
            aria-label={voiceOn ? '关闭语音处刑' : '开启语音处刑'}
            title={voiceOn ? '关闭语音处刑' : '开启语音处刑'}
          >
            {voiceOn ? '🔊' : '🔇'}
          </button>
        )}
        <button
          type="button"
          className={`insight-toggle ${insight ? 'insight-on' : ''}`}
          onClick={onToggleInsight}
          aria-pressed={insight}
        >
          👁 透视
        </button>
      </div>
      <div className="boss-switcher" role="tablist" aria-label="选择 Boss">
        {boss.id === 'custom' && (
          <button type="button" role="tab" aria-selected className="boss-chip boss-chip-on">
            <span aria-hidden>{boss.avatar}</span>
            {boss.name}
          </button>
        )}
        {Object.values(BOSSES).map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={b.id === boss.id}
            className={`boss-chip ${b.id === boss.id ? 'boss-chip-on' : ''}`}
            onClick={() => onSelectBoss(b.id as BossId)}
          >
            <span aria-hidden>{b.avatar}</span>
            {b.name}
          </button>
        ))}
        <button type="button" className="boss-chip boss-chip-new" onClick={onCreateBoss}>
          ＋ 造杠精
        </button>
      </div>
      <HpBar hp={hp} lastDamage={lastDamage} />
    </header>
  );
}