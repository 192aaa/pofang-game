import { useState } from 'react';
import {
  LIMITS,
  buildChallengeUrl,
  buildCustomBoss,
  loadMyBosses,
  loadNickname,
  sanitizeDraft,
  saveMyBoss,
  saveNickname,
  shareLink,
} from '../../game/customBoss';
import type { CustomBossPayload } from '../../game/customBoss';

interface Props {
  onClose: () => void;
  onStart: (boss: CustomBossPayload) => void;
}

const AVATARS = ['🎭', '😤', '🐟', '🦆', '🌚', '💪', '🧟', '🐷'];

const EMPTY: CustomBossPayload = {
  name: '',
  title: '',
  avatar: '🎭',
  claim: '',
  persona: '',
  creator: '',
};

export function CreateBossSheet({ onClose, onStart }: Props) {
  const [form, setForm] = useState<CustomBossPayload>({ ...EMPTY, creator: loadNickname() });
  const [saved, setSaved] = useState<CustomBossPayload[]>(() => loadMyBosses());
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState<string | null>(null);

  const set = (patch: Partial<CustomBossPayload>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const validate = (): CustomBossPayload | null => {
    const boss = sanitizeDraft(form);
    if (!boss) {
      setError('名字和暴论得填一下，不然它不配叫杠精。');
      return null;
    }
    return boss;
  };

  const start = () => {
    const boss = validate();
    if (!boss) return;
    saveNickname(boss.creator);
    setSaved(saveMyBoss(boss));
    onStart(boss);
  };

  const createLink = async () => {
    const boss = validate();
    if (!boss) return;
    saveNickname(boss.creator);
    setSaved(saveMyBoss(boss));
    const url = buildChallengeUrl(boss, []);
    const result = await shareLink(url, `来挑战我的杠精「${boss.name}」`);
    if (result === 'share') setTip('已调起系统分享');
    else if (result === 'copy') setTip('挑战链接已复制，发给朋友开打');
    else {
      setTip('当前环境不能自动复制，长按下面的链接复制');
      setManualUrl(url);
    }
  };

  const preview = sanitizeDraft(form);
  const opening = preview ? buildCustomBoss(preview).opening : '';

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="造一个杠精" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="sheet-title">🛠 造一个杠精</h2>
            <p className="mt-1 text-[11px] text-[var(--site-muted)]">
              把你身边那位死不认错的人，做成会嘴硬的 Boss。
            </p>
          </div>
          <button type="button" className="ammo-btn shrink-0" onClick={onClose}>
            关闭
          </button>
        </div>

        <label className="field-label" htmlFor="cb-name">名字</label>
        <input
          id="cb-name"
          className="field-input"
          value={form.name}
          maxLength={LIMITS.name}
          placeholder="比如：不洗头的小王"
          onChange={(e) => set({ name: e.target.value })}
        />

        <label className="field-label" htmlFor="cb-title">身份 / 称号</label>
        <input
          id="cb-title"
          className="field-input"
          value={form.title}
          maxLength={LIMITS.title}
          placeholder="比如：熬夜冠军"
          onChange={(e) => set({ title: e.target.value })}
        />

        <label className="field-label" htmlFor="cb-claim">一句暴论（它会死守这句话）</label>
        <textarea
          id="cb-claim"
          className="field-textarea"
          value={form.claim}
          maxLength={LIMITS.claim}
          rows={2}
          placeholder="比如：头发三天不洗才蓬松，这是造型。"
          onChange={(e) => set({ claim: e.target.value })}
        />

        <label className="field-label" htmlFor="cb-persona">口头禅 / 人设（选填）</label>
        <textarea
          id="cb-persona"
          className="field-textarea"
          value={form.persona}
          maxLength={LIMITS.persona}
          rows={2}
          placeholder="比如：口头禅「你不懂」，被戳穿就先怪天气"
          onChange={(e) => set({ persona: e.target.value })}
        />

        <span className="field-label">头像</span>
        <div className="mb-1 flex flex-wrap gap-1.5">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              className={`avatar-chip ${form.avatar === a ? 'avatar-chip-on' : ''}`}
              onClick={() => set({ avatar: a })}
              aria-label={`选择头像 ${a}`}
            >
              {a}
            </button>
          ))}
        </div>

        <label className="field-label" htmlFor="cb-creator">你的昵称（擂主署名）</label>
        <input
          id="cb-creator"
          className="field-input"
          value={form.creator}
          maxLength={LIMITS.creator}
          placeholder="神秘擂主"
          onChange={(e) => set({ creator: e.target.value })}
        />

        {opening && (
          <div className="mt-3 rounded-[var(--site-radius)] border border-dashed border-[var(--site-border)] p-2.5">
            <p className="text-[10px] text-[var(--site-muted)]">开场白预览</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--site-fg)]">{opening}</p>
          </div>
        )}

        {error && <p className="mt-2 text-xs text-[var(--site-accent)]">{error}</p>}
        {tip && <p className="mt-2 text-xs text-[var(--game-green)]">{tip}</p>}
        {manualUrl && (
          <input
            className="field-input mt-2"
            readOnly
            value={manualUrl}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="挑战链接"
          />
        )}

        <div className="sheet-actions">
          <button type="button" className="ammo-btn" onClick={createLink}>
            🔗 生成挑战链接
          </button>
          <button type="button" className="send-btn" onClick={start}>
            开始对局
          </button>
        </div>

        {saved.length > 0 && (
          <div className="mt-4 border-t border-[var(--site-border)] pt-3">
            <p className="mb-1.5 text-[10px] text-[var(--site-muted)]">我的杠精</p>
            <div className="flex flex-wrap gap-1.5">
              {saved.map((b) => (
                <button
                  key={`${b.name}-${b.claim}`}
                  type="button"
                  className={`boss-chip ${b.name === form.name && b.claim === form.claim ? 'boss-chip-on' : ''}`}
                  onClick={() => setForm(b)}
                  title={b.claim}
                >
                  <span aria-hidden>{b.avatar}</span>
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
