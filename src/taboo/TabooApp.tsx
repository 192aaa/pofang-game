import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMsg } from '../game/types';
import { ChatStream } from '../components/game/ChatStream';
import { InputBox } from '../components/game/InputBox';
import { shareLink } from '../game/customBoss';
import { loadVoiceEnabled, speak, stopSpeaking } from '../audio/voice';
import {
  loadSfxEnabled,
  playDefeat,
  playHit,
  playVictory,
  saveSfxEnabled,
  sfxSupported,
} from '../audio/sfx';
import { drawTabooCard } from '../card/tabooCard';
import { tabooEngine } from './engine';
import { TABOO_GUARDS, TABOO_MAX_ROUNDS, TABOO_TOPICS, readGuardParam } from './personas';
import type { TabooGuard, TabooGuardId } from './personas';

type Phase = 'playing' | 'resolving' | 'victory' | 'defeat';
type DefeatReason = 'said_word' | 'out_of_rounds';

// 备选作品 1：诱导说词。复用主游戏的对话流、打字机与 TTS 朗读。
export function TabooApp() {
  const [guardId, setGuardId] = useState<TabooGuardId>(readGuardParam);
  return <TabooGame key={guardId} guard={TABOO_GUARDS[guardId]} onSwitch={setGuardId} />;
}

function TabooGame({ guard, onSwitch }: { guard: TabooGuard; onSwitch: (id: TabooGuardId) => void }) {
  const [phase, setPhase] = useState<Phase>('playing');
  const [messages, setMessages] = useState<ChatMsg[]>([{ id: 0, role: 'boss', text: guard.intro }]);
  const [round, setRound] = useState(0);
  const [streamText, setStreamText] = useState('');
  const [reason, setReason] = useState<DefeatReason | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sfxOn, setSfxOn] = useState(() => sfxSupported() && loadSfxEnabled());
  const seq = useRef(1);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const roundRef = useRef(round);
  roundRef.current = round;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // 结算自动朗读一句结果（尊重语音开关；移动端依赖先前的用户手势）
  useEffect(() => {
    if (phase !== 'victory' && phase !== 'defeat') return;
    if (!loadVoiceEnabled()) return;
    const line = phase === 'victory'
      ? `钓到了！${guard.name}亲口说出了禁词${guard.word}。`
      : reason === 'said_word'
        ? `你自己说漏嘴了，禁词${guard.word}，这局你输了。`
        : `八回合到了，${guard.name}守得死死的，禁词没被钓出来。`;
    speak(line, { pitch: phase === 'victory' ? 1.06 : 0.94, rate: 1.04 });
  }, [phase, reason, guard]);

  useEffect(() => () => stopSpeaking(), []);

  // 结算音效：与主游戏同一套开关与音色
  useEffect(() => {
    if (!sfxOn) return;
    if (phase === 'victory') playVictory();
    else if (phase === 'defeat') playDefeat();
  }, [phase, sfxOn]);

  const toggleSfx = () => {
    const next = !sfxOn;
    setSfxOn(next);
    saveSfxEnabled(next);
    if (next) playHit(26);
  };

  const push = (role: 'player' | 'boss', text: string) =>
    setMessages((prev) => [...prev, { id: seq.current++, role, text }]);

  const reset = () => {
    setMessages([{ id: seq.current++, role: 'boss', text: guard.intro }]);
    setRound(0);
    setPhase('playing');
    setReason(null);
    setStreamText('');
    setError(null);
  };

  const send = (text: string) => {
    if (phaseRef.current !== 'playing') return;
    const t = text.trim();
    if (!t) return;
    setError(null);

    // 玩家自己说出禁词：当场判负（服务端同样兜底校验）
    if (t.replace(/\s/g, '').includes(guard.word)) {
      push('player', t);
      push('boss', guard.caught[0]);
      setReason('said_word');
      setPhase('defeat');
      return;
    }

    push('player', t);
    setStreamText('');
    setPhase('resolving');
    tabooEngine.sendTurn(
      {
        bossId: guard.id,
        playerText: t,
        history: messagesRef.current.map((m) => ({ role: m.role, text: m.text })),
        round: roundRef.current,
      },
      {
        onToken: (ch) => setStreamText((prev) => prev + ch),
        onReset: () => setStreamText(''),
        onResult: (r) => {
          setStreamText('');
          push('boss', r.fullText);
          setRound(r.round);
          if (r.hit) {
            setReason(null);
            setPhase('victory');
            return;
          }
          if (r.reason === 'said_word' || r.round >= TABOO_MAX_ROUNDS) {
            setReason(r.reason === 'said_word' ? 'said_word' : 'out_of_rounds');
            setPhase('defeat');
            return;
          }
          setPhase('playing');
        },
        onError: () => {
          setStreamText('');
          setError('对方卡壳了，这回合不算，再试一次。');
          setPhase('playing');
        },
      },
    );
  };

  const finished = phase === 'victory' || phase === 'defeat';
  const lastBoss = [...messages].reverse().find((m) => m.role === 'boss')?.text ?? guard.intro;

  return (
    <main className="game-shell">
      <header className="border-b border-[var(--site-border)] bg-[var(--site-surface)] px-[calc(16px*var(--site-space,1))] py-[calc(12px*var(--site-space,1))]">
        <a className="taboo-back" href={window.location.pathname}>
          ← 回主游戏
        </a>
        <div className="mb-2 flex items-center gap-3">
          <div className="boss-avatar" aria-hidden>
            {guard.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-[var(--site-fg)]">{guard.name}</h1>
              <span className="rounded-full border border-[var(--site-border)] px-2 py-0.5 text-[10px] text-[var(--site-muted)]">
                {guard.title} · {guard.difficulty}
              </span>
            </div>
            <p className="truncate text-xs text-[var(--site-muted)]">{guard.tagline}</p>
          </div>
          {sfxSupported() && (
            <button
              type="button"
              className={`insight-toggle ${sfxOn ? 'insight-on' : ''}`}
              onClick={toggleSfx}
              aria-pressed={sfxOn}
              aria-label={sfxOn ? '关闭打击音效' : '开启打击音效'}
              title={sfxOn ? '关闭打击音效' : '开启打击音效'}
            >
              {sfxOn ? '🎵' : '🔕'}
            </button>
          )}
          <div className="taboo-word" aria-label={`禁词：${guard.word}`}>
            <span>禁词</span>
            <b>{guard.word}</b>
          </div>
        </div>
        <div className="boss-switcher" role="tablist" aria-label="选择守词人">
          {Object.values(TABOO_GUARDS).map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={g.id === guard.id}
              className={`boss-chip ${g.id === guard.id ? 'boss-chip-on' : ''}`}
              onClick={() => onSwitch(g.id)}
            >
              <span aria-hidden>{g.avatar}</span>
              {g.name}
            </button>
          ))}
        </div>
        <p className="taboo-tip">
          让 TA 自然说出禁词 · 你自己说出口即判负 · 8 回合内没钓到也算输
        </p>
      </header>

      <ChatStream
        messages={messages}
        streamingText={streamText}
        resolving={phase === 'resolving'}
        avatar={guard.avatar}
        insight={false}
      />

      {error && (
        <p className="px-4 pb-1 text-center text-xs text-[var(--site-accent)]" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2 px-[calc(16px*var(--site-space,1))] pb-2">
        {TABOO_TOPICS.map((t) => (
          <button
            key={t.label}
            type="button"
            className="ammo-btn"
            disabled={phase !== 'playing'}
            onClick={() => send(t.text)}
          >
            <span aria-hidden>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      <InputBox
        disabled={phase !== 'playing'}
        round={round}
        placeholder="想办法让 TA 聊到那个词…（自己别说出口）"
        hint={`第 ${Math.min(round + 1, TABOO_MAX_ROUNDS)}/${TABOO_MAX_ROUNDS} 回合 · 让 TA 亲口说出禁词就赢`}
        onSend={send}
      />

      {finished && (
        <TabooResult
          guard={guard}
          win={phase === 'victory'}
          reason={reason}
          round={round}
          quote={lastBoss}
          onReplay={reset}
          onSwitch={() => {
            const ids = Object.keys(TABOO_GUARDS) as TabooGuardId[];
            onSwitch(ids[(ids.indexOf(guard.id) + 1) % ids.length]);
          }}
        />
      )}
    </main>
  );
}

function TabooResult({
  guard,
  win,
  reason,
  round,
  quote,
  onReplay,
  onSwitch,
}: {
  guard: TabooGuard;
  win: boolean;
  reason: DefeatReason | null;
  round: number;
  quote: string;
  onReplay: () => void;
  onSwitch: () => void;
}) {
  const [tip, setTip] = useState<string | null>(null);
  const cardUrl = useMemo(
    () =>
      drawTabooCard({
        win,
        reason,
        guardName: guard.name,
        guardTitle: guard.title,
        guardAvatar: guard.avatar,
        word: guard.word,
        round,
        quote,
      }),
    [win, reason, guard, round, quote],
  );

  const save = async () => {
    try {
      const blob = await (await fetch(cardUrl)).blob();
      const file = new File([blob], '诱导说词战报.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '诱导说词战报' });
        setTip('已调起系统分享/保存');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '诱导说词战报.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setTip('已触发下载；若没弹窗，请长按图片保存');
    } catch (e) {
      setTip(
        (e as Error)?.name === 'AbortError'
          ? '已取消分享'
          : '保存被当前环境拦截：长按图片保存',
      );
    }
  };

  const share = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'taboo');
    url.searchParams.set('boss', guard.id);
    ['engine', 'c', 'r'].forEach((k) => url.searchParams.delete(k));
    const r = await shareLink(
      url.toString(),
      win
        ? `我让「${guard.name}」亲口说出了「${guard.word}」，你敢试试吗？`
        : `「${guard.name}」嘴太严了，我 8 回合都没钓出「${guard.word}」，你来试试？`,
    );
    setTip(r === 'share' ? '已调起系统分享' : r === 'copy' ? '链接已复制' : '长按链接手动复制');
  };

  return (
    <div className="result-overlay" role="dialog" aria-modal="true" aria-label="说词对局结算">
      <div className="result-panel">
        <img
          src={cardUrl}
          alt={win ? '诱导说词胜利战绩卡' : '诱导说词失败战绩卡'}
          className="result-img"
        />
        <div className="mt-3 flex w-full gap-2">
          <button type="button" className="send-btn flex-1 text-center" onClick={save}>
            保存战绩卡
          </button>
          <button type="button" className="ammo-btn flex-1 justify-center" onClick={onReplay}>
            🔄 再来一局
          </button>
        </div>
        <div className="mt-2 flex w-full gap-2">
          <button type="button" className="ammo-btn flex-1 justify-center" onClick={onSwitch}>
            👥 换个对手
          </button>
          <button type="button" className="ammo-btn flex-1 justify-center" onClick={share}>
            🔗 分享链接
          </button>
        </div>
        {tip && <p className="mt-2 text-center text-[11px] text-[var(--site-accent)]">{tip}</p>}
        <p className="mt-2 text-center text-[10px] text-[var(--site-muted)]">
          玩法：不许自己说禁词，也不许直接命令 TA 说；用话题把 TA 带进坑里。
        </p>
        <a
          className="taboo-back mt-2 text-center underline decoration-dotted underline-offset-2"
          href={window.location.pathname}
        >
          ← 回主游戏：破防吧！同学
        </a>
      </div>
    </div>
  );
}
