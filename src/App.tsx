import { useReducer, useRef, useState } from 'react';
import { reducer, initialState } from './game/reducer';
import type { Strategy } from './game/types';
import { engine } from './engine';
import type { Ammo } from './game/ammo';
import { BossHeader } from './components/game/BossHeader';
import { ChatStream } from './components/game/ChatStream';
import { AmmoBar } from './components/game/AmmoBar';
import { InputBox } from './components/game/InputBox';
import { ResultOverlay } from './components/game/ResultOverlay';

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const send = (text: string, strategy?: Strategy) => {
    if (stateRef.current.phase !== 'playing') return;
    const snapshot = stateRef.current;
    setError(null);
    setStreamText('');
    dispatch({ type: 'SEND', text, strategy });
    engine
      .sendTurn(
        {
          playerText: text,
          strategy,
          history: snapshot.messages.map((m) => ({ role: m.role, text: m.text })),
          hp: snapshot.hp,
          round: snapshot.round,
        },
        {
          onToken: (t) => setStreamText((prev) => prev + t),
          onJudgment: (j, fullText) => {
            setStreamText('');
            dispatch({ type: 'RESOLVE', bossText: fullText, judgment: j });
          },
          onError: () => {
            setStreamText('');
            setError('对方网络嘴硬超时，这回合不算，再出一招试试。');
            dispatch({ type: 'RETRY' });
          },
        },
      )
      .catch(() => {
        setStreamText('');
        setError('对方网络嘴硬超时，这回合不算，再出一招试试。');
        dispatch({ type: 'RETRY' });
      });
  };

  const onPickAmmo = (a: Ammo) => send(a.text, a.strategy);
  const resolving = state.phase === 'resolving';
  const finished = state.phase === 'victory' || state.phase === 'defeat';

  return (
    <main className="game-shell">
      <BossHeader hp={state.hp} lastDamage={state.lastDamage} />
      <ChatStream
        messages={state.messages}
        streamingText={streamText}
        resolving={resolving}
      />
      {error && (
        <p className="px-4 pb-1 text-center text-xs text-[var(--site-accent)]" role="alert">
          {error}
        </p>
      )}
      <AmmoBar disabled={resolving || finished} onPick={onPickAmmo} />
      <InputBox disabled={resolving || finished} round={state.round} onSend={send} />
      {finished && (
        <ResultOverlay state={state} onRestart={() => dispatch({ type: 'RESET' })} />
      )}
    </main>
  );
}