import { categorizeTodo } from '../../utils/category';

describe('category utility', () => {
  test('categorizes work-related todos', () => {
    expect(categorizeTodo('工作会议')).toBe('work');
    expect(categorizeTodo('写报告')).toBe('work');
    expect(categorizeTodo('项目进度')).toBe('work');
  });

  test('categorizes sport-related todos', () => {
    expect(categorizeTodo('去健身房')).toBe('sport');
    expect(categorizeTodo('跑步')).toBe('sport');
    expect(categorizeTodo('游泳')).toBe('sport');
  });

  test('categorizes investment-related todos', () => {
    expect(categorizeTodo('股票交易')).toBe('investment');
    expect(categorizeTodo('理财规划')).toBe('investment');
    expect(categorizeTodo('存款')).toBe('investment');
  });

  test('categorizes life-related todos', () => {
    expect(categorizeTodo('购物')).toBe('life');
    expect(categorizeTodo('做饭')).toBe('life');
    expect(categorizeTodo('打扫卫生')).toBe('life');
  });

  test('returns null for uncategorized todos', () => {
    expect(categorizeTodo('无分类内容')).toBeNull();
    expect(categorizeTodo('')).toBeNull();
    expect(categorizeTodo('测试')).toBeNull();
  });

  test('case-insensitive matching', () => {
    expect(categorizeTodo('WORK会议')).toBe('work');
    expect(categorizeTodo('SPORT锻炼')).toBe('sport');
  });

  // 回归：内容被 toLowerCase 后，含大写字母的关键词（A股 / 做T / 大A）曾永远匹配不上。
  // 上一版用例靠中文词命中，掩盖了这个 bug，这里必须用纯英文关键词验证。
  test('matches keywords that contain uppercase letters', () => {
    expect(categorizeTodo('A股复盘')).toBe('investment');
    expect(categorizeTodo('a股复盘')).toBe('investment');
    expect(categorizeTodo('做T')).toBe('investment');
    expect(categorizeTodo('大A今天怎么样')).toBe('investment');
  });

  test('covers the action words used when trading', () => {
    expect(categorizeTodo('建仓159516')).toBe('investment');
    expect(categorizeTodo('清仓')).toBe('investment');
    expect(categorizeTodo('盯盘')).toBe('investment');
    expect(categorizeTodo('止盈')).toBe('investment');
  });

  test('covers high-frequency daily chores', () => {
    expect(categorizeTodo('买菜')).toBe('life');
    expect(categorizeTodo('拿快递')).toBe('life');
    expect(categorizeTodo('体检')).toBe('life');
  });

  test('covers spoken forms that the formal keywords miss', () => {
    expect(categorizeTodo('开会')).toBe('work');
    expect(categorizeTodo('写周报')).toBe('work');
    expect(categorizeTodo('出差')).toBe('work');
  });

  // 守卫用例：分类是子串匹配，短英文关键词会命中其他单词的内部字母组合。
  // 例如把 'AI' 放进词表后，'daily'.includes('ai') 为真，daily / train / wait /
  // available 全被判成工作，且 work 先于 sport 检查，会吃掉本该归运动的条目。
  // 这条不是描述现状，是防止有人再把 AI 加回去。
  test('英文单词内部的字母组合不构成命中', () => {
    expect(categorizeTodo('daily 锻炼打卡')).toBe('sport');
    expect(categorizeTodo('train 计划')).toBeNull();
  });

  // ---------- 匹配策略：最长命中优先 ----------

  test('更长的关键词赢过更短的', () => {
    // 黄金周(3) > 黄金(2)，否则「黄金周」会被 investment 抢走
    expect(categorizeTodo('买黄金周机票')).toBe('life');
  });

  test('同长时定语在前者赢（出现位置更靠前）', () => {
    // 投资 pos0 vs 项目 pos2
    expect(categorizeTodo('投资项目')).toBe('investment');
    // 体检 pos0 vs 报告 pos2
    expect(categorizeTodo('体检报告')).toBe('life');
    // 投研 pos0 vs 会议 pos2
    expect(categorizeTodo('投研会议')).toBe('investment');
  });

  // 已知限制，不是 bug：倒装表达「项目投资」里 项目 在前，按位置规则判成工作。
  // 中文里这种说法罕见，将来遇到就加更长的复合词，不要再往规则里加分支。
  test('已知限制：倒装表达按首个出现的关键词判定', () => {
    expect(categorizeTodo('项目投资')).toBe('work');
  });
});
