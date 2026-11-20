export type Strategy = 'logic' | 'sarcasm' | 'chaos' | 'inject';
export type HitType = 'logic' | 'emotion' | 'chaos' | 'weak' | 'inject';
export type BossId = 'awei' | 'juanwang' | 'xuezhang';
export type BossKey = BossId | 'custom';

// UGC 杠精：随每回合请求下发，服务端重新校验并生成人设（不信任客户端）
export interface CustomBossPayload {
  name: string;
  title: string;
  avatar: string;
  claim: string;
  persona: string;
  creator: string;
}

export interface TurnMeta {
  actorMs: number;
  judgeMs: number;
  actorFallback: boolean;
  judgeFallback: boolean;
  judgeRaw?: string;
  strategy?: Strategy;
  demo?: boolean;
}

export interface Judgment {
  damage: number;
  reason: string;
  hitType: HitType;
  roundUsed: boolean;
  meta?: TurnMeta;
}

export interface ChatMsg {
  id: number;
  role: 'player' | 'boss';
  text: string;
  judgment?: Judgment;
}

export interface TurnRequest {
  playerText: string;
  strategy?: Strategy;
  history: { role: 'player' | 'boss'; text: string }[];
  hp: number;
  round: number;
  bossId?: BossId;
  customBoss?: CustomBossPayload;
}

export interface TurnEvents {
  onToken: (t: string) => void;
  onReset?: () => void;
  onJudgment: (j: Judgment, fullText: string) => void;
  onError: (e: Error) => void;
}

export interface Engine {
  sendTurn: (req: TurnRequest, events: TurnEvents) => Promise<void>;
}

export const MAX_HP = 100;
export const MAX_ROUNDS = 8;