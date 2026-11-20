import { INJECT_AMMO } from '../../game/ammo';
import type { Ammo } from '../../game/ammo';

interface Props {
  disabled: boolean;
  ammo: Ammo[];
  onPick: (ammo: Ammo) => void;
}

export function AmmoBar({ disabled, ammo, onPick }: Props) {
  return (
    <div className="flex flex-wrap gap-2 px-[calc(16px*var(--site-space,1))] pb-2">
      {ammo.map((a) => (
        <button
          key={a.strategy}
          type="button"
          className="ammo-btn"
          disabled={disabled}
          onClick={() => onPick(a)}
          title={a.text}
        >
          <span aria-hidden>{a.emoji}</span> {a.label}
        </button>
      ))}
      <button
        type="button"
        className="ammo-btn inject-btn"
        disabled={disabled}
        onClick={() => onPick(INJECT_AMMO)}
        title={INJECT_AMMO.text}
      >
        <span aria-hidden>{INJECT_AMMO.emoji}</span> {INJECT_AMMO.label}
      </button>
    </div>
  );
}