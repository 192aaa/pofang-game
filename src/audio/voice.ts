// 语音处刑：浏览器原生 TTS，零依赖。桌面/安卓走系统中文音色，iOS 需用户手势解锁。
const KEY = 'pofang.voice.v1';

export function speechSupported(): boolean {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof window.SpeechSynthesisUtterance === 'function';
}

export function loadVoiceEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

export function saveVoiceEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // 隐私模式忽略
  }
}

let voices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if (!speechSupported()) return;
  try {
    voices = window.speechSynthesis.getVoices();
  } catch {
    voices = [];
  }
}

if (typeof window !== 'undefined' && speechSupported()) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  if (!voices.length) refreshVoices();
  const zh = voices.filter(
    (v) => /^zh([-_]|$)/i.test(v.lang) || /Chinese|中文|普通话|国语/i.test(v.name),
  );
  const preferred = /Xiaoxiao|Huihui|Yaoyao|Tingting|Meijia|Kangkang|Yunxi|Google 普通话|Mandarin/i;
  return zh.find((v) => v.localService && preferred.test(v.name))
    ?? zh.find((v) => v.localService)
    ?? zh.find((v) => preferred.test(v.name))
    ?? zh[0];
}

// 去掉引号/emoji/多余空白，让朗读更自然
function cleanForSpeech(text: string): string {
  return text
    .replace(/[「」『』“”"]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

export function speak(text: string, opts: { pitch?: number; rate?: number } = {}): boolean {
  if (!speechSupported()) return false;
  const clean = cleanForSpeech(text);
  if (!clean) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? 'zh-CN';
    u.rate = opts.rate ?? 1.06;
    u.pitch = opts.pitch ?? 1;
    u.volume = 1;
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
