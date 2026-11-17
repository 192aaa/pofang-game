import type { Engine } from '../game/types';
import { mockEngine } from './mockEngine';

// M2 在此接入 apiEngine（SSE → 云函数 → 双 LLM），通过配置切换。
// Demo v0 固定 Mock，界面明确标注"演示引擎"。
export const ENGINE_MODE: 'mock' | 'api' = 'mock';

export const engine: Engine = mockEngine;