import type { Engine } from '../game/types';
import { mockEngine } from './mockEngine';
import { apiEngine } from './apiEngine';

// 默认走真 LLM 云函数；?engine=mock 切回演示引擎（离线演示/开发，AC6.4）。
const params = new URLSearchParams(window.location.search);
export const ENGINE_MODE: 'mock' | 'api' = params.get('engine') === 'mock' ? 'mock' : 'api';

export const engine: Engine = ENGINE_MODE === 'mock' ? mockEngine : apiEngine;