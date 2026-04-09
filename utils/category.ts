export const CATEGORIES = {
  work: '工作',
  sport: '运动',
  investment: '投资',
  life: '生活',
} as const;

export const CATEGORY_KEYWORDS: Record<keyof typeof CATEGORIES, string[]> = {
  work: ['工作', '会议', '报告', '项目', '邮件', '加班', 'deadline', '任务'],
  sport: ['运动', '健身', '跑步', '游泳', '瑜伽', '篮球', '足球', '锻炼'],
  investment: ['投资', '股票', '基金', '理财', '存款', '财务', '账单'],
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
