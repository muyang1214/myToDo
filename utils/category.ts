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
  ],
  life: [
    '生活', '购物', '买菜', '做饭', '打扫', '收拾', '洗衣', '快递', '缴费',
    '约会', '电影', '旅行', '体检', '理发', '厨房',
  ],
};

export function categorizeTodo(content: string): keyof typeof CATEGORIES | null {
  const lowerContent = content.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // 关键词也要转小写再比：内容已被 toLowerCase，若关键词含大写字母（A股 / 做T）会永远匹配不上
    if (keywords.some((keyword) => lowerContent.includes(keyword.toLowerCase()))) {
      return category as keyof typeof CATEGORIES;
    }
  }

  return null;
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
