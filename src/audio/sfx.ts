// 打击音效：WebAudio 实时合成，零音频素材。首次播放需由用户手势触发。
const KEY = 'pofang.sfx.v1';

export function sfxSupported(): boolean {
  return typeof window !== 'undefined'
    && !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
}

export function loadSfxEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

export function saveSfxEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // 隐私模式忽略
  }
}

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (!sfxSupported()) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext
        ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

let unlocked = false;

// 移动端音频解锁：必须在用户手势里创建/唤醒 AudioContext，异步判定后的音效才不会被静音
export function unlockAudio() {
  if (unlocked) return;
  const c = ac();
  if (!c) return;
  try {
    if (c.state === 'suspended') void c.resume();
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
    unlocked = true;
  } catch {
    // 忽略：部分环境不支持 WebAudio
  }
}

if (typeof window !== 'undefined') {
  const onGesture = () => {
    if (!loadSfxEnabled()) return;
    unlockAudio();
    if (unlocked) {
      window.removeEventListener('pointerdown', onGesture, true);
      window.removeEventListener('keydown', onGesture, true);
    }
  };
  window.addEventListener('pointerdown', onGesture, true);
  window.addEventListener('keydown', onGesture, true);
}

function envelope(g: GainNode, t0: number, attack: number, decay: number, peak: number) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

// 低通白噪声：拳拳到肉的撞击层
function noiseBurst(c: AudioContext, t0: number, dur: number, peak: number, cutoff: number) {
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(cutoff, t0);
  lp.frequency.exponentialRampToValueAtTime(Math.max(120, cutoff * 0.3), t0 + dur);
  const g = c.createGain();
  envelope(g, t0, 0.005, dur, peak);
  src.connect(lp).connect(g).connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

// 下滑正弦：重量感低频
function thump(c: AudioContext, t0: number, from: number, to: number, dur: number, peak: number) {
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = c.createGain();
  envelope(g, t0, 0.008, dur, peak);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function tone(
  c: AudioContext,
  t0: number,
  freq: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  endFreq?: number,
) {
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
  const g = c.createGain();
  envelope(g, t0, 0.01, dur, peak);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// 命中：伤害越高，低频越沉、噪声越重
export function playHit(damage: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const power = Math.min(1, Math.max(0.35, damage / 40));
  noiseBurst(c, t, 0.09 + power * 0.08, 0.14 * power, 2400);
  thump(c, t, 90 + 160 * power, 46, 0.16 + power * 0.1, 0.2 * power);
}

// 攻击被拦截：两声短促下滑提示
export function playBlocked() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(c, t, 330, 0.09, 'square', 0.07, 220);
  tone(c, t + 0.11, 260, 0.12, 'square', 0.055, 150);
}

// 胜利：上行三音 + 收尾和弦
export function playVictory() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + 0.45;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    tone(c, t + i * 0.11, f, 0.2, 'triangle', 0.11);
  });
  [523.25, 659.25, 1046.5].forEach((f) => {
    tone(c, t + 0.36, f, 0.5, 'triangle', 0.07);
  });
}

// 失败：下行四音
export function playDefeat() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + 0.3;
  [392, 329.63, 261.63, 196].forEach((f, i) => {
    tone(c, t + i * 0.16, f, 0.32, 'sine', 0.12, f * 0.94);
  });
}
