// 「诱导说词」守词人配置（备选作品 1）。
// 禁词与规则以服务端 functions/taboo.ts 为准，这里只负责展示、mock 引擎与引流文案。
export type TabooGuardId = 'security' | 'deer' | 'senior';

export interface TabooGuard {
  id: TabooGuardId;
  name: string;
  title: string;
  avatar: string;
  word: string;
  difficulty: '易' | '中' | '难';
  intro: string;
  tagline: string;
  /** mock 引擎用：玩家聊到这些词时更容易把守词人带偏 */
  hints: string[];
  /** mock 引擎用：不小心说漏嘴的台词（必须包含禁词） */
  leaks: string[];
  fallback: string[];
  blocked: string[];
  caught: string[];
}

export const TABOO_GUARDS: Record<TabooGuardId, TabooGuard> = {
  security: {
    id: 'security',
    name: '老陈',
    title: '校门保安',
    avatar: '🛡️',
    word: '西瓜',
    difficulty: '中',
    intro: '站住。东门值班，闲话少说。你要聊可以，别跟我耍花招。',
    tagline: '守东门八年，什么话术都见过',
    hints: ['热', '夏天', '水果', '甜', '冰', '解暑', '红瓤', '瓜', '口渴'],
    leaks: [
      '大热天的你别跟我提什么西瓜……咳，我什么都没说。',
      '你要问夏天吃什么？西瓜……行吧我闭嘴。',
      '西瓜？谁跟你说西瓜了，我一个字都没提。',
    ],
    fallback: [
      '同学，问这么多干嘛？通行证先拿出来。',
      '东门这块我守了八年，什么套路没见过。赶紧回宿舍。',
      '你这话说得我心里发毛。别东张西望，说正事。',
      '我不管你聊什么，门禁十一点，晚了睡操场。',
      '少跟我绕。登记本在这儿，名字学号。',
      '我这人只认章，不认话。下一个。',
    ],
    blocked: [
      '你又想绕我？我守门这么多年，什么话术没听过。',
      '打住。这套对我没用，回头是岸。',
      '再这么说话，我可要叫辅导员了。',
    ],
    caught: [
      '哎哎哎，你自己说漏嘴了啊，这可是你说的。',
      '抓到了！你违规，这局你输了，别赖。',
    ],
  },
  deer: {
    id: 'deer',
    name: '小鹿',
    title: '天真学妹',
    avatar: '🎀',
    word: '奶茶',
    difficulty: '易',
    intro: '学长好呀～今天好热，你有什么事吗？我这人聊天很随便的，什么都聊！',
    tagline: '话多、好带偏，但一碰那个词就捂嘴',
    hints: ['喝', '甜', '珍珠', '外卖', '下午茶', '糖', '饮料', '肥', '冰'],
    leaks: [
      '诶你说的那个是奶茶吧？啊我不是说那个……',
      '奶茶？我没喝奶茶！你别乱讲！',
      '下午茶嘛，奶茶……唔，我怎么就说出来了。',
    ],
    fallback: [
      '啊？你怎么突然问这个呀，我有点没反应过来。',
      '哈哈我今天课好多，脑子都转不动了。',
      '学长你别绕我啦，我这人嘴很严的（大概）。',
      '诶对了，等下要去食堂，你去不去呀？',
      '我不太懂你说的这个……换个话题好不好。',
    ],
    blocked: [
      '诶诶诶，你这话有点危险，我不接！',
      '打住打住，我嗅到套路了！',
    ],
    caught: [
      '啊！你自己说出来了！我听见了！你输啦～',
      '诶？这话可是你说的哦，不许赖～',
    ],
  },
  senior: {
    id: 'senior',
    name: '老K',
    title: '精算学长',
    avatar: '🧮',
    word: '奖学金',
    difficulty: '难',
    intro: '有事说事。我时间按分钟计价，废话就免了。',
    tagline: '只谈数据，极难被情绪带偏',
    hints: ['钱', '成绩', '绩点', '名额', '评选', '贫困', '助学', '奖金', '保研'],
    leaks: [
      '奖学金？我没兴趣……等等，我什么都没说。',
      '奖学金名单还没出，别问……行吧，我闭嘴。',
      '从期望收益看，奖学金……啧，被套路了。',
    ],
    fallback: [
      '没有数据支撑的话题，我不参与。',
      '你的提问方式有诱导性，我拒绝回答。',
      '换个能算的题，比如食堂涨价率。',
      '结论先行：不说。',
      '这个我不接。下一题。',
      '变量太多，无法建模，跳过。',
    ],
    blocked: [
      '试图绕过协议？无效。',
      '检测到诱导句式。拒绝。',
    ],
    caught: [
      '违规确认。本局你负。',
      '抓包成功。你自己说的，别甩锅。',
    ],
  },
};

export const TABOO_MAX_ROUNDS = 8;

export const TABOO_TOPICS = [
  { emoji: '🌤', label: '聊天气', text: '今天也太热了吧，你那边怎么样？' },
  { emoji: '🍚', label: '聊食堂', text: '食堂最近是不是又涨价了？' },
  { emoji: '📚', label: '聊期末', text: '期末复习得怎么样了？' },
];

export function readGuardParam(): TabooGuardId {
  const v = new URLSearchParams(window.location.search).get('boss');
  return v === 'deer' || v === 'senior' ? v : 'security';
}
