import { categorizeTodo } from '../utils/category';

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
});
