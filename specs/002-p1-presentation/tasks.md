# 任务清单 002：P1 演出冲奖（M4）

规格：002-p1-presentation · Mock 先行，每步可演示

- [x] T17 规格三件套（本目录）+ persona.ts BossConfig 重构（三 Boss 文案池一次到位，旧常量全迁移无别名残留）
- [x] T18 破防慢镜头：FinisherOverlay + keyframes + 跳过/自动结束 + reduced-motion；mock 实测演出→印章→结算卡、点击跳过 54ms 生效
- [x] T19 透视模式：TurnMeta + mock 模拟 meta + InsightPanel + 头部开关；服务端 meta（耗时/降级/裁判原文≤400）；本地无 PAT 实测降级 chip 正确（修复早退 throw 漏标记）
- [x] T20 三 Boss：BossSwitcher + ?boss= + 服务端白名单/人设随回合下发（Agent 共享，pv=2）+ 按 Boss 降级池 + 主题弹药 + 战绩卡随 Boss；mock 卷王/主席通关、api 无 PAT 卷王降级池实测
- [x] T21 部署 + 验收：mock 三 Boss 各通关一局 ✅（本地）；线上卷王局 4 回合 21.1s 通关，裁判 4/4 真值 −34/−28/−35/−31（logic 锚点内）、演员 4/4 即兴无降级、judgeRaw 可见、慢镜头处刑+跳过、注入回归 0 伤害不耗回合、战绩卡「卷王·装懒室友」−35 bestHit 目验 ✅（dev/card-live-juanwang.png）。首版线上全降级 bug 已修：QCA metadata 值必须全字符串（pv 数字→400），且失败请求占用幂等键致后续恒 409 → pv 改字符串 '2'、幂等键 bump v3、409 重扫无资源时换键重试一次；修复版 action bb478f9c-79c6-4751-a110-f60d15a9b7d5 published:true
- [x] T22 文档同步：README（M4 版本行/玩法/动线/档位表/排期/文档索引）+ 001 tasks Backlog 交叉引用 002 + submission-post 玩法复核（3 Boss/透视/慢镜头入 5 步、M4 实测数据、卷王卡素材；复读表述改「判低伤」与裁判 weak 锚点一致）

验收：002 全部 AC + 001 R6 回归（注入拦截/降级/复读反作弊各抽一局）