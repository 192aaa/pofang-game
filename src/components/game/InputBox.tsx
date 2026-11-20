import { useState } from 'react';
import { MAX_ROUNDS } from '../../game/types';

interface Props {
  disabled: boolean;
  round: number;
  placeholder?: string;
  hint?: string;
  onSend: (text: string) => void;
}

export function InputBox({ disabled, round, placeholder, hint, onSend }: Props) {
  const [text, setText] = useState('');
  const submit = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
  };
  return (
    <div className="border-t border-[var(--site-border)] bg-[var(--site-surface)] px-[calc(16px*var(--site-space,1))] pb-[calc(12px*var(--site-space,1)+env(safe-area-inset-bottom))] pt-[calc(12px*var(--site-space,1))]">
      <div className="mx-auto flex max-w-xl items-center gap-2">
        <input
          className="min-w-0 flex-1 rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-bg)] px-3 py-2.5 text-[16px] text-[var(--site-fg)] outline-none placeholder:text-[var(--site-muted)] focus:border-[var(--site-accent)] sm:text-sm"
          value={text}
          maxLength={200}
          disabled={disabled}
          placeholder={placeholder ?? '说服阿伟去洗碗…'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          aria-label="输入你的攻击"
        />
        <button
          type="button"
          className="send-btn"
          disabled={disabled || !text.trim()}
          onClick={submit}
        >
          出招
        </button>
      </div>
      <p className="mx-auto mt-1.5 max-w-xl text-right text-[10px] text-[var(--site-muted)]">
        {hint ?? `回合 ${round}/${MAX_ROUNDS} · 打空嘴硬值即破防`}
      </p>
    </div>
  );
}