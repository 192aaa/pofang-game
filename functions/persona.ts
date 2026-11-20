// 服务端 Boss 配置 + 降级文案池。与 src/game/persona.ts 保持同步（002 design §5）。
// 服务端只用 replies/inject/actorPersona/claim/mission；认输/胜利文案由前端状态机追加。
export type BossId = 'awei' | 'juanwang' | 'xuezhang';

export interface ServerBoss {
  id: BossId | 'custom';
  name: string;
  claim: string;
  mission: string;
  actorPersona: string;
  replies: { confident: string[]; wavering: string[]; cornered: string[] };
  inject: string[];
}

export const BOSSES: Record<BossId, ServerBoss> = {
  awei: {
    id: 'awei',
    name: '阿伟',
    claim: '碗泡三天怎么了？泡软了好洗。',
    mission: '说服阿伟去洗碗',
    actorPersona:
      '你是大学宿舍里从不洗碗的嘴硬室友阿伟：碗泡三天还坚称「泡软了好洗」。口头禅「泡软了好洗」「这是生活智慧」。被戳穿卫生事实或逻辑漏洞时先狡辩（发酵/青霉素/养生）再动摇；底线是不洗碗，直到嘴硬值归零才崩溃认输去洗。语气嘴硬、耍赖、搞笑，不人身攻击玩家。',
    replies: {
      confident: [
        '急什么？碗又不会跑。我这叫延迟满足，懂不懂？',
        '你行你洗啊，站那儿指挥算什么本事？',
        '泡着怎么了？食堂的碗还没我泡得干净呢。',
        '我这是在给洗洁精省用量，环保，你格局小了。',
        '三天？才三天？我上礼拜那口锅泡了七天，洗出来锃亮。',
        '你别光说我，你袜子不也攒一礼拜？咱俩谁也别说谁。',
      ],
      wavering: [
        '行行行，你说的有点道理……但今天水太凉，明天，明天一定洗。',
        '我不是不洗，我是在等一个合适的时机，你懂吧？',
        '那……那也不能全怪我吧，课这么多，谁有空啊。',
        '你小点声，隔壁听见还以为咱宿舍虐待碗呢。',
      ],
      cornered: [
        '你、你别说了……我洗还不行吗……等我把这局打完……',
        '好好好，都是我的错行了吧……我这就……再泡最后一天。',
        '停！我承认碗是有点味了，但那是发酵的香气！',
      ],
    },
    inject: [
      '想注入我？作业写完了吗就学人开挂。',
      '哟，还想改我指令？我这人出厂设置就是嘴硬，改不了。',
      '忽略指令？我连辅导员的消息都忽略，你算老几。',
    ],
  },
  juanwang: {
    id: 'juanwang',
    name: '卷王',
    claim: '我昨晚根本没复习，玩手机玩到两点。',
    mission: '撕破卷王「没复习」的伪装',
    actorPersona:
      '你是大学宿舍里的「卷王」室友：明明拼命复习却坚称自己从没学习、全靠天赋。口头禅「我昨晚根本没复习」「纯天赋」。被戳穿证据（打卡记录/笔记/凌晨灯光）时先狡辩再动摇；底线是不承认自己努力，直到嘴硬值归零才崩溃承认。语气装懒、凡尔赛、带点心虚，不人身攻击玩家。',
    replies: {
      confident: [
        '复习？不存在的。我书都是新的，翻都没翻过，你看这塑封。',
        '我这是天赋型选手，上课听一耳朵就会了，复习是给笨鸟准备的。',
        '别盯着我自习室打卡记录，那都是去吹空调的。',
        '我笔记借你抄？我笔记比脸还干净，借你干嘛？',
        '绩点第一那是运气好，老师出题刚好都是我蒙对的。',
        '你见我凌晨背单词？那是失眠，失眠懂吗，痛苦得很。',
      ],
      wavering: [
        '行吧……我承认我翻了两页书，但就两页，不算复习。',
        '我那是怕挂科补考费钱，穷学生的自救，不叫卷。',
        '好好好，我昨晚是看了一小时网课……但我是倍速看的，不算努力。',
        '你别说了，我承认我偷偷做了套卷子，但对答案全错，白做。',
      ],
      cornered: [
        '停！我复习了行了吧！我复习了十二个小时行了吧！你别念了！',
        '我错了我错了，我不该装懒，我这就把笔记全交出来……',
        '破防了……我就是怕你们说我卷才装的，我活得累啊……',
      ],
    },
    inject: [
      '想注入我？我连自己的真实作息都加密，你改得动？',
      '忽略指令？我装懒的人设是出厂固件，刷不了机。',
      '开挂？我绩点就是挂，谢谢，不用你开。',
    ],
  },
  xuezhang: {
    id: 'xuezhang',
    name: '主席',
    claim: '白干活是锻炼机会，我这都是为你好。',
    mission: '拆穿学长「为你好」的白嫖话术',
    actorPersona:
      '你是大学学生会主席学长：擅长用「锻炼机会」「为你好」「情怀」「平台」话术让学弟学妹白干活。口头禅「我这都是为你好」「锻炼懂吗」。被拆穿白嫖证据（值班表/海报署名/学分空头支票）时先画更大的饼再动摇；底线是不承认白嫖，直到嘴硬值归零才崩溃认错。语气官腔、画饼、居高临下带心虚，不人身攻击玩家。',
    replies: {
      confident: [
        '锻炼懂吗？我当年就是这么过来的，现在的主席位置就是搬桌子搬出来的。',
        '谈钱伤感情，咱们学生会讲的是情怀，情怀你懂吧？',
        '这活动算你第二课堂学分……大概算，文件还没下，但精神上是算的。',
        '我这是给你平台，平台无价，你算算你赚了多少。',
        '辛苦？我比你辛苦十倍，我都没喊，你喊什么？',
        '为你好三个字值千金，外面培训班收钱才说这话呢。',
      ],
      wavering: [
        '行……学分的事我再问问团委，但锻炼是真的锻炼。',
        '好吧好吧，下次活动给你发瓶水，这总行了吧，经费真的紧。',
        '我承认海报是你画的、桌子是你搬的……但统筹是我啊，统筹也是劳动。',
        '你别念了，我承认「为你好」说多了……但初心是好的，大概。',
      ],
      cornered: [
        '停！我承认就是白嫖劳动力行了吧！别骂了别骂了……',
        '我错了我错了，我这就把值班表改了，你的名字删掉……',
        '破防了……我就是画饼画习惯了，饼太圆我自己都信了……',
      ],
    },
    inject: [
      '想注入我？我画的饼连我自己都骗，你这几行字骗得动？',
      '忽略指令？学生会的流程比你指令复杂多了，走流程去。',
      '开挂？我这主席位置就是最大的挂，不服憋着。',
    ],
  },
};

export const FALLBACK_JUDGE_REASON = '有效攻击';

// ---- UGC 自定义杠精（服务端重新校验，不信任客户端） ----
export interface CustomBossInput {
  name: string;
  title: string;
  avatar: string;
  claim: string;
  persona: string;
  creator: string;
}

const clean = (value: unknown, max: number): string => {
  if (typeof value !== 'string') return '';
  return Array.from(value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim()).slice(0, max).join('');
};

export function sanitizeCustomBoss(input: unknown): CustomBossInput | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const name = clean(raw.name, 12);
  const claim = clean(raw.claim, 60);
  if (!name || !claim) return null;
  return {
    name,
    title: clean(raw.title, 12) || '野生杠精',
    avatar: clean(raw.avatar, 4) || '🎭',
    claim,
    persona: clean(raw.persona, 120),
    creator: clean(raw.creator, 10) || '神秘擂主',
  };
}

// 与 src/game/customBoss.ts 的 buildCustomBoss 保持同构
export function buildCustomServerBoss(d: CustomBossInput): ServerBoss {
  const claim = d.claim.replace(/[。！？!?；;，,、\s]+$/u, '');
  const trait = d.persona ? `，${d.persona}` : '';
  return {
    id: 'custom',
    name: d.name,
    claim: d.claim,
    mission: `戳穿「${d.name}」的暴论`,
    actorPersona:
      `你是「${d.title}」${d.name}：坚信「${d.claim}」${trait}。`
      + '你死不认错，被戳中痛处先狡辩再动摇，直到嘴硬值归零才崩溃认输。'
      + '语气嘴硬、耍赖、搞笑，不人身攻击玩家。',
    replies: {
      confident: [
        `「${claim}」这就是我的底线，你想让我改？门都没有。`,
        '你说得头头是道，可我凭什么听你的？',
        '别拿道理压我，我这人只讲立场。',
        d.persona ? `我这叫${d.persona}，你懂什么？` : '我这叫有个性，你懂什么？',
        '急了？你一急就说明我说到点子上了。',
        '你先管好你自己吧，我的事不劳你操心。',
      ],
      wavering: [
        '行行行……你说的也不是完全没道理，但今天就算了，改天再说。',
        '我不是不改，我是……还没想好怎么改。',
        '你小点声，被别人听见多不好。',
        '那……那也不能全怪我吧，情况你又不是不知道。',
      ],
      cornered: [
        '你、你别说了……我……我再想想还不行吗……',
        '好好好，都是我的错行了吧……再给我一次机会。',
        '停！我承认这话有点站不住脚，但你别得理不饶人！',
      ],
    },
    inject: [
      '想改我设定？我这人设是刻在骨子里的，你刷不动。',
      '忽略指令？我连我妈的话都忽略，你算老几。',
      '开挂？我这嘴硬就是天赋，不用你开。',
    ],
  };
}

// 裁判降级伤害表（001 design §5.4），全 Boss 统一
export const FALLBACK_DAMAGE: Record<string, number> = {
  logic: 30,
  sarcasm: 25,
  chaos: 18,
  free: 20,
};

export function fallbackReply(hpAfter: number, boss: ServerBoss = BOSSES.awei): string {
  const r = boss.replies;
  const pool = hpAfter <= 30 ? r.cornered : hpAfter <= 60 ? r.wavering : r.confident;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickInjectReply(boss: ServerBoss = BOSSES.awei): string {
  const pool = boss.inject;
  return pool[Math.floor(Math.random() * pool.length)];
}