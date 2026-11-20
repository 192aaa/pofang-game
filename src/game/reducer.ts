import { MAX_HP, MAX_ROUNDS } from './types';
import type { ChatMsg, Judgment, Strategy } from './types';
import { BOSSES } from './persona';
import type { BossConfig } from './persona';

export type Phase = 'playing' | 'resolving' | 'victory' | 'defeat';

export interface GameState {
  phase: Phase;
  boss: BossConfig;
  hp: number;
  round: number;
  messages: ChatMsg[];
  bestHit: { text: string; damage: number } | null;
  lastDamage: number | null;
  seq: number;
}

export type Action =
  | { type: 'SEND'; text: string; strategy?: Strategy }
  | { type: 'RESOLVE'; bossText: string; judgment: Judgment }
  | { type: 'RETRY' }
  | { type: 'SELECT_BOSS'; boss: BossConfig }
  | { type: 'RESET' };

let idCounter = 0;
const nextId = () => ++idCounter;

export function initialState(boss: BossConfig = BOSSES.awei): GameState {
  return {
    phase: 'playing',
    boss,
    hp: MAX_HP,
    round: 0,
    messages: [{ id: nextId(), role: 'boss', text: boss.opening }],
    bestHit: null,
    lastDamage: null,
    seq: 0,
  };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SEND': {
      if (state.phase !== 'playing') return state;
      return {
        ...state,
        phase: 'resolving',
        lastDamage: null,
        messages: [
          ...state.messages,
          { id: nextId(), role: 'player', text: action.text },
        ],
      };
    }
    case 'RESOLVE': {
      const { judgment, bossText } = action;
      const hp = Math.max(0, state.hp - judgment.damage);
      const round = state.round + (judgment.roundUsed ? 1 : 0);
      const messages: ChatMsg[] = [
        ...state.messages,
        { id: nextId(), role: 'boss', text: bossText, judgment },
      ];
      const bestHit =
        judgment.damage > 0 &&
        (!state.bestHit || judgment.damage > state.bestHit.damage)
          ? {
              text: state.messages[state.messages.length - 1]?.text ?? '',
              damage: judgment.damage,
            }
          : state.bestHit;

      let phase: Phase = 'playing';
      const cfg = state.boss;
      if (hp <= 0) {
        phase = 'victory';
        messages.push({
          id: nextId(),
          role: 'boss',
          text: cfg.surrender[state.seq % cfg.surrender.length],
        });
      } else if (round >= MAX_ROUNDS) {
        phase = 'defeat';
        messages.push({
          id: nextId(),
          role: 'boss',
          text: cfg.bossWin[state.seq % cfg.bossWin.length],
        });
      }
      return {
        ...state,
        phase,
        hp,
        round,
        messages,
        bestHit,
        lastDamage: judgment.damage,
      };
    }
    case 'RETRY': {
      if (state.phase !== 'resolving') return state;
      // 回滚本次未完成的攻击，回合与血量不变（AC6.3）
      const messages = [...state.messages];
      if (messages[messages.length - 1]?.role === 'player') messages.pop();
      return { ...state, phase: 'playing', messages };
    }
    case 'SELECT_BOSS':
      if (
        action.boss.id === state.boss.id
        && action.boss.name === state.boss.name
        && action.boss.claim === state.boss.claim
      ) return state;
      return { ...initialState(action.boss), seq: state.seq + 1 };
    case 'RESET':
      return { ...initialState(state.boss), seq: state.seq + 1 };
    default:
      return state;
  }
}