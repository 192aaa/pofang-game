export type Strategy = 'logic' | 'sarcasm' | 'chaos' | 'inject';
export type HitType = 'logic' | 'emotion' | 'chaos' | 'weak' | 'inject';

export interface Judgment {
  damage: number;
  reason: string;
  hitType: HitType;
  roundUsed: boolean;
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
}

export interface TurnEvents {
  onToken: (t: string) => void;
  onJudgment: (j: Judgment, fullText: string) => void;
  onError: (e: Error) => void;
}

export interface Engine {
  sendTurn: (req: TurnRequest, events: TurnEvents) => Promise<void>;
}

export const MAX_HP = 100;
export const MAX_ROUNDS = 8;