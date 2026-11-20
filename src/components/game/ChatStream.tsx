import { useEffect, useRef } from 'react';
import type { ChatMsg } from '../../game/types';
import { speak, speechSupported } from '../../audio/voice';
import { InsightPanel } from './InsightPanel';

const VOICE_OK = speechSupported();

interface Props {
  messages: ChatMsg[];
  streamingText: string;
  resolving: boolean;
  avatar: string;
  insight: boolean;
}

function JudgmentBadge({ msg }: { msg: ChatMsg }) {
  const j = msg.judgment;
  if (!j) return null;
  if (j.hitType === 'inject') {
    return (
      <div className="judge-badge judge-inject">
        🛡️ 注入拦截 · 伤害 0 · 不耗回合
      </div>
    );
  }
  return (
    <div className={`judge-badge ${j.damage >= 25 ? 'judge-crit' : ''}`}>
      ⚔️ {j.reason} <b>−{j.damage}</b>
    </div>
  );
}

export function ChatStream({ messages, streamingText, resolving, avatar, insight }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, streamingText]);

  return (
    <div className="flex-1 overflow-y-auto px-[calc(16px*var(--site-space,1))] py-4 scrollbar-thin">
      <div className="mx-auto flex max-w-xl flex-col gap-3">
        {messages.map((msg) =>
          msg.role === 'player' ? (
            <div key={msg.id} className="msg-row-player">
              <div className="msg-player">{msg.text}</div>
            </div>
          ) : (
            <div key={msg.id} className="msg-row-boss">
              <span className="msg-avatar" aria-hidden>
                {avatar}
              </span>
              <div className="flex max-w-[80%] flex-col items-start gap-1">
                <div className="flex items-end gap-1">
                  <div className="msg-boss">{msg.text}</div>
                  {VOICE_OK && (
                    <button
                      type="button"
                      className="msg-speak"
                      onClick={() => speak(msg.text)}
                      aria-label="朗读这句"
                      title="朗读这句"
                    >
                      🔊
                    </button>
                  )}
                </div>
                <JudgmentBadge msg={msg} />
                {insight && msg.judgment && <InsightPanel meta={msg.judgment.meta} />}
              </div>
            </div>
          ),
        )}
        {resolving && (
          <div className="msg-row-boss">
            <span className="msg-avatar" aria-hidden>
              {avatar}
            </span>
            <div className="msg-boss">
              {streamingText || <span className="text-[var(--site-muted)]">正在嘴硬…</span>}
              {streamingText && <span className="type-cursor" aria-hidden />}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}