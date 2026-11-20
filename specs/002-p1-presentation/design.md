# 技术设计 002：P1 演出冲奖

## 1. 状态与数据流

- `GameState` 增 `bossId: BossId`；`initialState(bossId)`；新 Action `SELECT_BOSS { bossId }`（等价 RESET 但换人设，seq+1）。
- `Judgment` 增可选 `meta?: TurnMeta`：
  ```ts
  interface TurnMeta {
    actorMs: number; judgeMs: number;
    actorFallback: boolean; judgeFallback: boolean;
    judgeRaw?: string;      // 裁判原始输出（≤400 字截断）
    strategy?: Strategy;    // 本回合策略标签
    demo?: boolean;         // mock 引擎模拟 meta 标记
  }
  ```
- `TurnRequest` 增 `bossId?: BossId`（服务端白名单校验，缺省 awei）。
- 慢镜头不改 reducer：App 监听 phase→victory 边沿，本地 `finisher` state 控制演出层，1.8s 定时或点击跳过后再挂 ResultOverlay。

## 2. SSE 契约扩展（向后兼容）

`judgment` 事件 payload 增 `meta`（可选）：`{ damage, reason, hitType, roundUsed, fullText, meta? }`。
服务端在演员/裁判各自 settle 时记录耗时与降级标记；judgeRaw 仅裁判成功时附带（parse 前原文截断 400）。
旧前端忽略未知字段；新前端 meta 缺失 → 透视卡「无幕后数据」。

## 3. 组件

```
App
├─ BossHeader      + BossSwitcher(3 chips, 当前高亮, 切换=SELECT_BOSS)
│                  + 透视开关（小按钮，眼睛图标）
├─ ChatStream      boss 消息下挂 InsightPanel（仅透视开 && 有 judgment）
├─ FinisherOverlay 新增：遮罩+最后一击原文+−N 放大+「破防！」印章；CSS keyframes
│                  （flash 120ms → shake 300ms → stamp scale 2.2→1 定格）；点击跳过
└─ ResultOverlay   不变（boss 信息改读 state.bossId 配置）
```

- InsightPanel：等宽字体 JSON 块 + 耗时 chips（演员 x ms / 裁判 y ms）+ 降级红 chip + demo 灰 chip；`<button>` 折叠展开默认展开。
- BossSwitcher 放 BossHeader 第二行；375px 下 chips 横排不换行溢出（avatar+短名）。

## 4. 人设配置（persona.ts 重构）

```ts
interface BossConfig {
  id: 'awei' | 'juanwang' | 'xuezhang';
  name; title; avatar; claim; mission;
  opening: string;
  replies: { confident: string[]; wavering: string[]; cornered: string[] };
  inject: string[]; surrender: string[]; bossWin: string[];
  actorPersona: string;   // 服务端演员 system 的人设段（性格/口头禅/底线）
}
export const BOSSES: Record<BossId, BossConfig>;
```
现有阿伟池原样迁入；新增卷王/主席各池（confident 6 / wavering 4 / cornered 3 / inject 3 / surrender 2 / bossWin 2）。
兼容导出：`BOSS/OPENING/SURRENDER/...` 旧常量改为 awei 别名过渡（本规格内完成迁移后删除）。

## 5. 服务端（functions/）

- `persona.ts`：导入共享配置？functions 与 src 不共享打包 → **functions/persona.ts 内维护同构 BossConfig 表**（文案与 src 一致，单源约定：以 src/game/persona.ts 为准，改动同步两处，tasks 勾选时核对）。
- `prompts.ts`：ACTOR_SYSTEM/JUDGE_SYSTEM 为通用纪律（不含具体人设）；**人设/暴论/目标随回合 user message 下发**（actorUserMessage/judgeUserMessage 读 BOSSES[ctx.bossId]），三 Boss 共享同一演员/裁判 Agent，避免按 Boss 膨胀 Agent 数量。通用纪律变更 → ensureAgent 元数据 `pv` 与幂等键同步 bump（当前 pv='2'、键 v3），旧 Agent 经元数据扫描自然淘汰。**QCA metadata 值必须全为字符串**（数字值创建被 400 拒绝）；被拒请求仍会占用幂等键（后续恒 409 且扫描无资源），故 409 重扫无资源时换新键重试一次。
- `turn.ts`：validateTurn 增 bossId 白名单（非法回退 awei）；runTurnPipeline 记录 actorMs/judgeMs/fallback 标记（binding 缺失的早退也在 try 内，保证降级标记不漏）；judgment emit 附 meta；注入分支 meta 全零 + strategy:'inject'。
- 降级池按 boss 取（fallbackReply/pickInjectReply 带 bossId 参数）；FALLBACK_DAMAGE 全 Boss 统一。

## 6. Mock 引擎

- mockReply/mockJudge 按 req.bossId 取池；meta 模拟：actorMs=实测流式耗时、judgeMs=rand(300,900)、fallback=false、judgeRaw=JSON.stringify(judgment)、demo:true。

## 7. 视觉与动效

- 慢镜头 keyframes 写 index.css：`finisher-flash / finisher-shake / finisher-stamp`；印章红底白字旋转 −8deg；伤害数字 96px 霓虹金。
- 透视卡深色底 #1a1f33 同战绩卡面板色；降级 chip 红 #ff4d5e。
- 全部动画 `prefers-reduced-motion` 降级为直接定格（无障碍）。

## 8. 不做

TTS、破防二维码、Boss 专属弹药、排行榜。透视不暴露 prompt 原文。