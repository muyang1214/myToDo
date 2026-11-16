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
});
