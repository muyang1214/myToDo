import { colors } from '@/theme/tokens';

export const CATEGORIES = {
  work: '工作',
  sport: '运动',
  investment: '投资',
  life: '生活',
} as const;

export const CATEGORY_KEYWORDS: Record<keyof typeof CATEGORIES, string[]> = {
  // 协作动作 + 你打交道的机构
  work: [
    '开会', '会议', '报告', '周报', '项目', '邮件', '任务', '出差', '客户',
    '银华', '招商', '广发', '星贸达', '鼎裕', '恒桥', 'andos', '券商',
  ],
  sport: [
    '运动', '健身', '跑步', '游泳', '锻炼', '羽毛球', '网球', '骑行', '登山', '徒步',
  ],
  // 品种 / 市场 / 指数 / 交易动作（做 T 时最常写的就是这些动作词）
  investment: [
    '投资', '股票', '基金', '理财', '存款', '大盘', '股市', '债券', '期货',
    '黄金', '白银', '币安', '比特币', '以太坊', '区块链',
    '大A', 'A股', '港股', '美股', '上证', '恒生', '日经', '纳指', '道琼斯', '纳斯达克', '标普500',
    '建仓', '加仓', '减仓', '清仓', '补仓', '持仓', '做T', '盯盘', '止盈', '止损',
    // 复合词：与 work 的「会议」同长，靠「出现位置更靠前」赢下来（投研会议 → 投资）
    '投研',
  ],
  life: [
    '生活', '购物', '买菜', '做饭', '打扫', '收拾', '洗衣', '快递', '缴费',
    '约会', '电影', '旅行', '体检', '理发', '厨房',
    // 复合词：3 个字，靠「更长」赢过 investment 的「黄金」（买黄金周机票 → 生活）
    '黄金周',
  ],
};

/** 一条命中的候选：由它和别的候选比「谁更具体」 */
interface KeywordHit {
  category: keyof typeof CATEGORIES;
  keyword: string;
  /** 关键词长度——越长越具体（黄金周 > 黄金） */
  length: number;
  /** 在内容中首次出现的位置 */
  position: number;
  /** 类别声明顺序，只做最后兜底 */
  order: number;
}

/**
 * 判定「谁更具体」，三层依次比较：
 *
 * 1. 关键词更长者优先
 *    更长的词更具体：「黄金周」明确不是投资，「黄金」才可能是。
 *
 * 2. 同长时，出现位置更靠前者优先
 *    中文定语在前：「体检报告」是体检产生的报告，「投资项目」是投资类的项目，
 *    前一个词是限定语。已知反例是倒装（「项目投资」会被判成工作），中文里罕见，接受。
 *
 * 3. 再同则按类别声明顺序
 *    纯兜底，保证同样的输入永远得到同样的结果。
 */
function isMoreSpecific(a: KeywordHit, b: KeywordHit): boolean {
  if (a.length !== b.length) return a.length > b.length;
  if (a.position !== b.position) return a.position < b.position;
  return a.order < b.order;
}

export function categorizeTodo(content: string): keyof typeof CATEGORIES | null {
  const lowerContent = content.toLowerCase();
  const entries = Object.entries(CATEGORY_KEYWORDS);

  let best: KeywordHit | null = null;

  for (let order = 0; order < entries.length; order++) {
    const [category, keywords] = entries[order];

    for (const keyword of keywords) {
      // 关键词也要转小写再比：内容已被 toLowerCase，若关键词含大写字母（A股 / 做T）会永远匹配不上
      const position = lowerContent.indexOf(keyword.toLowerCase());
      if (position === -1) continue;

      const candidate: KeywordHit = {
        category: category as keyof typeof CATEGORIES,
        keyword,
        length: keyword.length,
        position,
        order,
      };

      if (best === null || isMoreSpecific(candidate, best)) {
        best = candidate;
      }
    }
  }

  return best === null ? null : best.category;
}

export type CategoryKey = keyof typeof CATEGORIES | 'none';

// 分类 → 色点颜色（单一数据源，组件不各自硬编码）
const CATEGORY_COLOR: Record<CategoryKey, string> = {
  work: colors.catWork,
  sport: colors.catSport,
  investment: colors.catInvestment,
  life: colors.catLife,
  none: colors.catNone,
};

export function categoryColor(category: string | null | undefined): string {
  const key = (category ?? 'none') as CategoryKey;
  return CATEGORY_COLOR[key] ?? colors.catNone;
}

export function categoryLabel(category: string | null | undefined): string {
  if (!category) return '其他';
  return CATEGORIES[category as keyof typeof CATEGORIES] ?? '其他';
}
