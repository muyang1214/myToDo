import { colors } from '@/theme/tokens';

export const CATEGORIES = {
  work: '工作',
  sport: '运动',
  investment: '投资',
  life: '生活',
} as const;

export const CATEGORY_KEYWORDS: Record<keyof typeof CATEGORIES, string[]> = {
  work: ['工作', '会议', '报告', '项目', '邮件', '加班', 'deadline', '任务','银华','招商','广发'],
  sport: ['运动', '健身', '跑步', '游泳', '瑜伽', '篮球', '足球', '锻炼','羽毛球', 
    '网球', '高尔夫', '滑雪', '滑板', '骑行', '登山', '徒步', '马拉松', '铁人三项', '拳击', '摔跤', '柔道', '跆拳道', '武术'],
  investment: ['投资', '股票', '基金', '理财', '存款', '财务', '账单', '大盘',
    '收益', '亏损', '资产', '负债', '现金流', '风险', '回报', '股市', '债券', '期货', '外汇',
    '房地产', '黄金', '白银', '加密货币', '比特币', '以太坊', '区块链', '投资组合', '分散投资', '风险管理',
    '投资策略', '市场分析', '经济指标', '通货膨胀', '利率', '货币政策', '财政政策', '宏观经济', '微观经济',
    'A股', 'B股', '港股', '美股', '日经指数', '道琼斯指数', '纳斯达克指数', '标普500指数', '恒生指数', '上证指数',
  ],
  life: ['生活', '购物', '做饭', '打扫', '洗衣', '约会', '电影', '旅行'],
};

export function categorizeTodo(content: string): keyof typeof CATEGORIES | null {
  const lowerContent = content.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lowerContent.includes(keyword))) {
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
