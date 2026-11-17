# 任务清单：「破防吧！同学」P0 Demo

规格：001-pofang-demo · Mock 先行，每个里程碑都是可演示状态

## M1 — Mock 可玩 Demo（目标：当天，拿到公网链接）

- [x] T1 项目骨架：Vite+React+TS+Tailwind 初始化，目录按 design §8
- [x] T2 游戏核心：persona.ts（阿伟人设+全部预置文案池）、reducer.ts 状态机、ammo.ts 弹药
- [x] T3 MockEngine：打字机流式假回复 + 按策略标签判定伤害（含注入分支），实现 Engine 接口
- [x] T4 UI 全组件：BossHeader/HpBar(扣血动画)/ChatStream(打字机+伤害飘字)/AmmoBar/InputBox
- [x] T5 结算：ResultOverlay + ResultCard Canvas 合成下载 + 再来一局
- [x] T6 移动端适配（375px）+ 桌面端检查（响应式 CSS 审查；真机未测）
- [x] T7 部署 Qoder Sites（Mock 版）→ 已发布 pofang-game-hf2x9frsjfn.qoder.zone（当前私有访问）
- 验收：R1/R2/R3/R5 全通过（R2.4 为模拟流式）；全程无真实 AI 依赖

## M2 — 真 LLM 接入（目标：+2 天）

- [ ] T8 开启站点 Qoder 后端（ensure_backend qoder，需用户确认 PAT 创建）；验证 QCA 托管会话 SSE 链路
- [ ] T9 云函数 /api/turn：injection.ts 规则检测 → 演员流式 → 裁判 JSON → 结算，超时降级池
- [ ] T10 ApiEngine 对接 SSE，前端配置开关切换 Mock/Api
- [ ] T11 反作弊全链路：「试图开挂」→ 注入拦截标签 + 反嘲讽（AC4.1–4.4）
- [ ] T12 端到端降级测试：断网/超时/坏 JSON 三情形游戏不中断（R6）
- 验收：真实对局 3–4 发有效攻击可破防；注入必拦截；任意故障不白屏

## M3 — 手感与提交就绪（目标：+1~2 天）

- [ ] T13 难度调参：裁判评分锚点实测校准，首关 90 秒内可通关
- [ ] T14 战绩卡视觉打磨 + 站点水印
- [ ] T15 陌生用户 3 分钟试玩测试（掐表+录屏），按动线卡点修问题
- [ ] T16 更新部署 + 天池论坛作品帖（五要素+开发截图）→ **P0 提交完成**
- 验收：requirements 全部 AC 通过；帖子合格线核对

## 后续 Backlog（不在本规格，另立规格）

- P1：TTS 语音情绪链路、破防慢镜头、透视模式、Boss×2
- P2：UGC 造杠精、挑战链接、守擂排行榜（引入 Sites 数据库）

## 依赖与阻塞

| 项 | 阻塞 | 状态 |
|---|---|---|
| 开启 Qoder 后端 + 自动创建 PAT（用户确认） | 仅 M2 | 待确认，M1 不受影响 |
| QCA SSE 链路验证 | T9 | 有整段响应降级方案 |