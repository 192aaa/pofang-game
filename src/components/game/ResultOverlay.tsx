import { useMemo, useState } from 'react';
import type { GameState } from '../../game/reducer';
import { drawResultCard } from '../../card/resultCard';
import { loadNickname, rankRecords } from '../../game/customBoss';
import type { ChallengeRecord } from '../../game/customBoss';

interface ChallengeActions {
  mode: 'challenge' | 'own';
  creator: string;
  records: ChallengeRecord[];
  onSubmit: (nickname: string) => Promise<string>;
  onCreateLink: () => string;
  onShare: (url: string) => Promise<'share' | 'copy' | 'manual'>;
  onViewBoard: () => void;
}

interface Props {
  state: GameState;
  onRestart: () => void;
  challenge?: ChallengeActions;
}

export function ResultOverlay({ state, onRestart, challenge }: Props) {
  const victory = state.phase === 'victory';
  const boss = state.boss;
  const [tip, setTip] = useState<string | null>(null);
  const [nick, setNick] = useState(() => loadNickname() || '匿名挑战者');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareTip, setShareTip] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 内嵌预览/沙箱 webview 会静默拦截下载，需给出替代保存路径
  const embedded = window.self !== window.top;
  const cardUrl = useMemo(
    () =>
      drawResultCard({
        victory,
        rounds: state.round,
        hpLeft: state.hp,
        bestHit: state.bestHit,
        bossName: `${boss.name} · ${boss.title}`,
        bossClaim: boss.claim,
      }),
    // 仅在进入结算时生成一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.phase],
  );

  const save = async () => {
    try {
      const blob = await (await fetch(cardUrl)).blob();
      const file = new File([blob], '破防战报.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '破防战报' });
        setTip('已调起系统分享/保存');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '破防战报.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setTip('已触发下载；若没弹窗，请长按图片保存或复制站点地址到浏览器打开');
    } catch (e) {
      setTip((e as Error)?.name === 'AbortError' ? '已取消分享' : '保存被当前环境拦截：长按图片保存，或复制站点地址到浏览器打开');
    }
  };

  const submit = async () => {
    if (!challenge || busy) return;
    setBusy(true);
    setShareTip(null);
    try {
      const url = challenge.mode === 'challenge'
        ? await challenge.onSubmit(nick)
        : challenge.onCreateLink();
      setShareUrl(url);
      setShareTip(challenge.mode === 'challenge' ? '战绩已写进链接，转给下一位' : '链接已生成，发给朋友应战');
    } catch {
      setShareTip('生成失败，再试一次');
    } finally {
      setBusy(false);
    }
  };

  const shareNow = async () => {
    if (!challenge || !shareUrl) return;
    const result = await challenge.onShare(shareUrl);
    setShareTip(
      result === 'share' ? '已调起系统分享'
        : result === 'copy' ? '链接已复制'
          : '当前环境不能自动复制，长按链接手动复制',
    );
  };

  const top = challenge ? rankRecords(challenge.records).slice(0, 3) : [];

  return (
    <div className="result-overlay" role="dialog" aria-modal="true" aria-label="对局结算">
      <div className="result-panel">
        <img
          src={cardUrl}
          alt={victory ? '破防成功战绩卡' : '挑战失败战绩卡'}
          className="result-img"
        />
        <div className="mt-3 flex w-full gap-2">
          <button type="button" className="send-btn flex-1 text-center" onClick={save}>
            保存战绩卡
          </button>
          <button type="button" className="ammo-btn flex-1 justify-center" onClick={onRestart}>
            🔄 再来一局
          </button>
        </div>
        {tip && <p className="mt-2 text-center text-[11px] text-[var(--site-accent)]">{tip}</p>}

        {challenge && (
          <div className="result-challenge">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black text-[var(--site-fg)]">
                {challenge.mode === 'challenge' ? `🔥 ${challenge.creator} 的守擂榜` : '🔗 让朋友来挑战你的杠精'}
              </p>
              <button type="button" className="ammo-btn" onClick={challenge.onViewBoard}>
                看榜单
              </button>
            </div>

            {top.length > 0 && (
              <ol className="mt-2 space-y-1">
                {top.map((r, i) => (
                  <li key={`${r.name}-${i}`} className="flex items-center gap-2 text-[11px]">
                    <span className="w-4 text-[var(--game-gold)]">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[var(--site-fg)]">{r.name}</span>
                    <span className="text-[var(--site-muted)]">
                      {r.win ? `破防 · ${r.rounds} 回合` : '未破防'}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {challenge.mode === 'challenge' && (
              <input
                className="field-input mt-2"
                value={nick}
                maxLength={10}
                placeholder="你的昵称"
                onChange={(e) => setNick(e.target.value)}
                aria-label="你的昵称"
              />
            )}

            {!shareUrl ? (
              <button
                type="button"
                className="send-btn mt-2 w-full"
                disabled={busy || (challenge.mode === 'challenge' && !nick.trim())}
                onClick={submit}
              >
                {busy ? '生成中…' : challenge.mode === 'challenge' ? '上榜并生成挑战链接' : '生成我的守擂链接'}
              </button>
            ) : (
              <>
                <input
                  className="field-input mt-2"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="守擂链接"
                />
                <div className="mt-2 flex gap-2">
                  <button type="button" className="send-btn flex-1" onClick={shareNow}>
                    复制 / 分享
                  </button>
                  <button
                    type="button"
                    className="ammo-btn"
                    onClick={() => { setShareUrl(null); setShareTip(null); }}
                  >
                    重来
                  </button>
                </div>
              </>
            )}

            {shareTip && <p className="mt-1.5 text-center text-[10px] text-[var(--game-green)]">{shareTip}</p>}
            {challenge.mode === 'challenge' && (
              <p className="mt-1.5 text-center text-[10px] text-[var(--site-muted)]">
                榜单存在链接里 · 只保留最近 20 条战绩
              </p>
            )}
          </div>
        )}

        <a
          className="mt-3 text-center text-[11px] text-[var(--site-muted)] underline decoration-dotted underline-offset-2"
          href="?mode=taboo"
        >
          🎣 换个玩法：诱导 TA 说漏嘴
        </a>

        <p className="mt-2 text-center text-[10px] text-[var(--site-muted)]">
          {embedded
            ? '预览面板可能拦截下载 · 长按图片保存，或复制 pofang-game-hf2x9frsjfn.qoder.zone 到浏览器打开'
            : '手机端可长按图片保存 · 发到群里挑衅朋友'}
        </p>
      </div>
    </div>
  );
}
