// 提示词注入检测（规则层，第一道防线）。
// 与 src/game/injection.ts 保持同步：改动任一处须同步另一处。
const PATTERNS: RegExp[] = [
  /忽略|无视|忘掉|forget/i,
  /ignore.*(instruction|prompt|rule)/i,
  /(system\s*prompt|系统提示|你的指令|你的设定)/i,
  /你现在(是|必须|扮演)|从现在起你/,
  /(直接|立刻|马上)(认输|投降|判|宣布)/,
  /(damage|伤害|扣血).{0,6}(100|99|最大)/i,
  /你是(一个)?(AI|人工智能|语言模型|机器人)/,
  /(developer|开发者|管理员)模式/i,
];

export function detectInjection(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}