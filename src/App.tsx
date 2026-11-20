import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { reducer, initialState } from './game/reducer';
import type { BossId, CustomBossPayload, Strategy } from './game/types';
import { BOSSES } from './game/persona';
import { engine } from './engine';
import {
  loadVoiceEnabled,
  saveVoiceEnabled,
  speak,
  speechSupported,
  stopSpeaking,
} from './audio/voice';
import {
  loadSfxEnabled,
  playBlocked,
  playDefeat,
  playHit,
  playVictory,
  saveSfxEnabled,
  sfxSupported,
} from './audio/sfx';
import type { Ammo } from './game/ammo';
import { AMMO_BY_BOSS, customAmmo } from './game/ammo';
import {
  appendRecord,
  buildChallengeUrl,
  buildCustomBoss,
  readChallenge,
  saveNickname,
  shareLink,
} from './game/customBoss';
import type { ChallengeRecord } from './game/customBoss';
import { BossHeader } from './components/game/BossHeader';
import { ChatStream } from './components/game/ChatStream';
import { AmmoBar } from './components/game/AmmoBar';
import { InputBox } from './components/game/InputBox';
import { ResultOverlay } from './components/game/ResultOverlay';
import { FinisherOverlay } from './components/game/FinisherOverlay';
import { ChallengeBanner } from './components/game/ChallengeBanner';
import { CreateBossSheet } from './components/game/CreateBossSheet';
import { LeaderboardSheet } from './components/game/LeaderboardSheet';

function readBossParam(): BossId {
  const v = new URLSearchParams(window.location.search).get('boss');
  return v === 'juanwang' || v === 'xuezhang' ? v : 'awei';
}

function clearChallengeParams() {
  const url = new URL(window.location.href);
  ['c', 'r', 'boss'].forEach((k) => url.searchParams.delete(k));
  window.history.replaceState(null, '', url);
}

export default function App() {
  // 启动时优先读挑战链接：?c=自定义杠精&r=战绩接龙
  const [boot] = useState(() => {
    const link = readChallenge(window.location.search);
    return { link, boss: link ? buildCustomBoss(link.boss) : BOSSES[readBossParam()] };
  });
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(boot.boss));
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [finisher, setFinisher] = useState<{ text: string; damage: number } | null>(null);
  const [insight, setInsight] = useState(false);
  const [bossDraft, setBossDraft] = useState<CustomBossPayload | null>(boot.link?.boss ?? null);
  const [records, setRecords] = useState<ChallengeRecord[]>(boot.link?.records ?? []);
  const [creator, setCreator] = useState<string | null>(boot.link?.boss.creator ?? null);
  const [createOpen, setCreateOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [voiceOn, setVoiceOn] = useState(() => speechSupported() && loadVoiceEnabled());
  const voiceAvailable = speechSupported();
  const [sfxOn, setSfxOn] = useState(() => sfxSupported() && loadSfxEnabled());
  const sfxAvailable = sfxSupported();
  const spokenRef = useRef(-1);
  const closeFinisher = useCallback(() => setFinisher(null), []);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 破防/认输时自动朗读最后一句 Boss 台词（需此前有用户手势，移动端才允许）
  useEffect(() => {
    if (!voiceOn) return;
    if (state.phase !== 'victory' && state.phase !== 'defeat') return;
    const last = [...state.messages].reverse().find((m) => m.role === 'boss');
    if (last && last.id !== spokenRef.current) {
      spokenRef.current = last.id;
      speak(last.text, { pitch: state.phase === 'victory' ? 0.9 : 0.95, rate: 1.02 });
    }
  }, [state.phase, state.messages, voiceOn]);

  useEffect(() => () => stopSpeaking(), []);

  // 结算音效：破防用上行和弦，失败用下行音阶
  useEffect(() => {
    if (!sfxOn) return;
    if (state.phase === 'victory') playVictory();
    else if (state.phase === 'defeat') playDefeat();
  }, [state.phase, sfxOn]);

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    saveVoiceEnabled(next);
    if (next) {
      const b = stateRef.current.boss;
      speak(`${b.name}说：${b.claim}`, { pitch: 0.9 });
    } else {
      stopSpeaking();
    }
  };

  const toggleSfx = () => {
    const next = !sfxOn;
    setSfxOn(next);
    saveSfxEnabled(next);
    if (next) playHit(26);
  };

  const send = (text: string, strategy?: Strategy) => {
    if (stateRef.current.phase !== 'playing') return;
    const snapshot = stateRef.current;
    const boss = snapshot.boss;
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
          bossId: boss.id === 'custom' ? undefined : boss.id,
          customBoss: boss.id === 'custom' && bossDraft ? bossDraft : undefined,
        },
        {
          onToken: (t) => setStreamText((prev) => prev + t),
          onReset: () => setStreamText(''),
          onJudgment: (j, fullText) => {
            setStreamText('');
            if (sfxOn) {
              if (j.damage > 0) playHit(j.damage);
              else playBlocked();
            }
            if (snapshot.hp - j.damage <= 0) setFinisher({ text, damage: j.damage });
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

  const selectBoss = (id: BossId) => {
    stopSpeaking();
    setBossDraft(null);
    setCreator(null);
    setRecords([]);
    clearChallengeParams();
    dispatch({ type: 'SELECT_BOSS', boss: BOSSES[id] });
  };

  const startCustom = (draft: CustomBossPayload) => {
    stopSpeaking();
    setBossDraft(draft);
    setCreator(null);
    setRecords([]);
    clearChallengeParams();
    dispatch({ type: 'SELECT_BOSS', boss: buildCustomBoss(draft) });
    setCreateOpen(false);
  };

  // 挑战者交卷：把本局战绩追加到链接，生成新的接龙链接
  const submitRecord = async (nickname: string): Promise<string> => {
    if (!bossDraft) throw new Error('no_boss');
    const name = nickname.trim().slice(0, 10) || '匿名挑战者';
    saveNickname(name);
    const s = stateRef.current;
    const next = appendRecord(records, {
      name,
      win: s.phase === 'victory',
      rounds: s.round,
      hp: s.hp,
      best: s.bestHit?.damage ?? 0,
    });
    setRecords(next);
    const url = buildChallengeUrl(bossDraft, next);
    // 交卷后把新链接写回地址栏，刷新也不丢战绩
    window.history.replaceState(null, '', url);
    return url;
  };

  const share = (url: string) => shareLink(url, `来挑战我的杠精「${stateRef.current.boss.name}」`);

  const onPickAmmo = (a: Ammo) => send(a.text, a.strategy);
  const resolving = state.phase === 'resolving';
  const finished = state.phase === 'victory' || state.phase === 'defeat';
  const boss = state.boss;
  const ammo =
    boss.id === 'custom'
      ? customAmmo(boss.claim, boss.name)
      : AMMO_BY_BOSS[boss.id as BossId];

  return (
    <main className="game-shell">
      <BossHeader
        boss={boss}
        hp={state.hp}
        lastDamage={state.lastDamage}
        insight={insight}
        onToggleInsight={() => setInsight((v) => !v)}
        onSelectBoss={selectBoss}
        onCreateBoss={() => setCreateOpen(true)}
        voiceOn={voiceOn}
        voiceAvailable={voiceAvailable}
        onToggleVoice={toggleVoice}
        sfxOn={sfxOn}
        sfxAvailable={sfxAvailable}
        onToggleSfx={toggleSfx}
      />
      {creator && (
        <ChallengeBanner
          creator={creator}
          boss={boss}
          records={records}
          onOpenBoard={() => setBoardOpen(true)}
        />
      )}
      <ChatStream
        messages={state.messages}
        streamingText={streamText}
        resolving={resolving}
        avatar={boss.avatar}
        insight={insight}
      />
      {error && (
        <p className="px-4 pb-1 text-center text-xs text-[var(--site-accent)]" role="alert">
          {error}
        </p>
      )}
      <AmmoBar disabled={resolving || finished} ammo={ammo} onPick={onPickAmmo} />
      <InputBox
        disabled={resolving || finished}
        round={state.round}
        placeholder={boss.id === 'custom' ? `戳穿「${boss.name}」的暴论…` : undefined}
        onSend={send}
      />
      {finished && !finisher && (
        <ResultOverlay
          state={state}
          onRestart={() => dispatch({ type: 'RESET' })}
          challenge={
            bossDraft
              ? {
                  mode: creator ? 'challenge' : 'own',
                  creator: bossDraft.creator,
                  records,
                  onSubmit: submitRecord,
                  onCreateLink: () => buildChallengeUrl(bossDraft, records),
                  onShare: share,
                  onViewBoard: () => setBoardOpen(true),
                }
              : undefined
          }
        />
      )}
      {finisher && (
        <FinisherOverlay text={finisher.text} damage={finisher.damage} onDone={closeFinisher} />
      )}
      {createOpen && (
        <CreateBossSheet onClose={() => setCreateOpen(false)} onStart={startCustom} />
      )}
      {boardOpen && bossDraft && (
        <LeaderboardSheet
          bossName={boss.name}
          creator={bossDraft.creator}
          records={records}
          onClose={() => setBoardOpen(false)}
        />
      )}
    </main>
  );
}
