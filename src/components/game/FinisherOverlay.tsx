import { useEffect } from 'react';

interface Props {
  text: string;
  damage: number;
  onDone: () => void;
}

export function FinisherOverlay({ text, damage, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    const key = () => onDone();
    window.addEventListener('keydown', key);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', key);
    };
  }, [onDone]);

  return (
    <div className="finisher" onClick={onDone} role="presentation" aria-label="破防慢镜头">
      <div className="finisher-flash" aria-hidden />
      <div className="finisher-body">
        <p className="finisher-quote">「{text}」</p>
        <div className="finisher-damage">−{damage}</div>
        <div className="finisher-stamp">破防！</div>
      </div>
      <p className="finisher-hint">点击或按任意键跳过</p>
    </div>
  );
}