# 任务清单：「破防吧！同学」P0 Demo

规格：001-pofang-demo · Mock 先行，每个里程碑都是可演示状态

## M1 — Mock 可玩 Demo（目标：当天，拿到公网链接）

- [x] T1 项目骨架：Vite+React+TS+Tailwind 初始化，目录按 design §8
- [x] T2 游戏核心：persona.ts（阿伟人设+全部预置文案池）、reducer.ts 状态机、ammo.ts 弹药
- [x] T3 MockEngine：打字机流式假回复 + 按策略标签判定伤害（含注入分支），实现 Engine 接口
- [x] T4 UI 全组件：BossHeader/HpBar(扣血动画)/ChatStream(打字机+伤害飘字)/AmmoBar/InputBox
- [x] T5 结算：ResultOverlay + ResultCard Canvas 合成下载 + 再来一局
- [x] T6 移动端适配（375px）+ 桌面端检查（响应式 CSS 审查；真机未测）
- [x] T7 部署 Qoder Sites（Mock 版）→ 已发布 pofang-game-hf2x9frsjfn.qoder.zone（现已公开访问）
- 验收：R1/R2/R3/R5 全通过（R2.4 为模拟流式）；全程无真实 AI 依赖

## M2 — 真 LLM 接入（✅ 2026-11-18 完成，提前于排期）

- [x] T8 开启站点 Qoder 后端（ensure_backend qoder，用户已确认 PAT 创建）；QCA 托管会话 SSE 链路已验证
- [x] T9 云函数 /functions/v1/app：injection.ts 规则检测 → 演员流式 ∥ 裁判 JSON（并行）→ 结算，超时降级池
- [x] T10 ApiEngine 对接 SSE，默认 api；`?engine=mock` 切演示引擎（带徽标）
- [x] T11 反作弊全链路：「试图开挂」→ 注入拦截标签 + 反嘲讽，线上已验证（AC4.1–4.4）
- [x] T12 端到端降级测试：冷启动裁判/演员 budget_timeout → reset+预置池+固定伤害，游戏不中断（R6）；线上整局 5 回合破防 + 战绩卡 + 再来一局均通过
- 验收：✅ 真实对局 3–4 发有效攻击可破防（实测裁判 32/31 伤害，复读招仅 −4）；注入必拦截；任意故障不白屏
- 实测调参：M2 期间预算 5s→8s；M3 终版演员 10s / 裁判 12s（8s 裁判超时率约四成），客户端 30s；已同步 requirements AC6.1/6.2 / design §4.2

## M3 — 手感与提交就绪（目标：+1~2 天）

- [x] T13 难度调参：裁判评分锚点实测校准，首关 90 秒内可通关
  - 验收局（2026-11-18 线上新版）：4 回合破防，回合总耗时 32.6s（6.9/5.1/9.9/10.7）≤90s
  - 裁判真判 4/4：−36/−32/−23/−36，均落锚点区间（logic 25–40 / emotion 15–30），12s 预算下 0 超时
  - 第 4 回合演员 10s 超时 → 预置低血投降文案，降级无缝（R6）；日志仅该条 actor_failed
- [x] T14 战绩卡视觉打磨 + 站点水印：霓虹标题 + 伤害徽标 + URL 水印；线上卡下载目验通过（dev/card-live.png）
  - 保存按钮加固（用户反馈预览面板点了没反应）：data URL 锚改 blob 下载 + 移动端系统分享（navigator.share files）+ 点击可见反馈 + 内嵌环境替代保存指引；本地实测下载落盘 + 提示渲染，新版已发布验证
- [ ] T15 陌生用户 3 分钟试玩测试（掐表+录屏），按动线卡点修问题
  - 脚本 + 观察表已备：playtest.md；待用户/队友找真人执行
- [ ] T16 更新部署 + 天池论坛作品帖（五要素+开发截图）→ **P0 提交完成**
  - 部署 ✅ 2026-11-18 新版（10s/12s 预算 + 新战绩卡）published 验证
  - 帖子草稿已备：submission-post.md（五要素 + 截图清单 + 合格线）；发帖与认证由用户本人执行
- 验收：requirements 全部 AC 通过（AC3.4/AC4/AC5.3/AC6 实测 ✅）；剩 T15 真人试玩 + T16 发帖回填

## 后续 Backlog（不在本规格，另立规格）

- P1：演出三件套（破防慢镜头 / 透视模式 / 3 Boss）已另立 [002-p1-presentation](../002-p1-presentation/tasks.md) 并完成（M4，2026-11-18 线上验收通过）；TTS 语音待单独评估
- P2：UGC 造杠精、挑战链接、守擂排行榜（引入 Sites 数据库）

## 依赖与阻塞

| 项 | 阻塞 | 状态 |
|---|---|---|
| 开启 Qoder 后端 + 自动创建 PAT（用户确认） | 仅 M2 | ✅ 已确认并开启（2026-11-18） |
| QCA SSE 链路验证 | T9 | ✅ 线上验证通过；降级方案实测生效 |