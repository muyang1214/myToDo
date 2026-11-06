// 固定时区，保证测试在任意 CI 机器上结果一致（上海 = UTC+8）
process.env.TZ = 'Asia/Shanghai';

import {
  toLocalDateKey,
  toLocalTimeLabel,
  isToday,
  isYesterday,
  groupByLocalDate,
} from '../../utils/date';

describe('toLocalDateKey - 本地时区分组', () => {
  test('普通本地时间按本地日期取 YYYY-MM-DD', () => {
    // 上海本地 2026-09-29 14:30
    expect(toLocalDateKey(new Date(2026, 8, 29, 14, 30))).toBe('2026-09-29');
  });

  test('时区陷阱：凌晨完成的待办必须归到「今天」而不是「昨天」', () => {
    // 上海 2026-09-29 02:00 完成 = UTC 2026-09-28 18:00
    const localEarlyMorning = new Date(Date.UTC(2026, 8, 28, 18, 0, 0));

    // 本地时区分组 → 正确归到 9/29
    expect(toLocalDateKey(localEarlyMorning)).toBe('2026-09-29');

    // 反例：naive 的 UTC 切片会得到 9/28（错误），这正是我们要避免的写法
    expect(localEarlyMorning.toISOString().slice(0, 10)).toBe('2026-09-28');
  });

  test('跨午夜：本地 23:00 完成（UTC 仍是前一天）也归到本地当天', () => {
    // 上海 2026-09-29 23:00 = UTC 2026-09-29 15:00
    const lateNight = new Date(Date.UTC(2026, 8, 29, 15, 0, 0));
    expect(toLocalDateKey(lateNight)).toBe('2026-09-29');
  });
});

describe('toLocalTimeLabel - 今日完成时间戳', () => {
  test('按本地时区取 HH:mm，个位数补零', () => {
    expect(toLocalTimeLabel(new Date(2026, 8, 29, 9, 5))).toBe('09:05');
    expect(toLocalTimeLabel(new Date(2026, 8, 29, 23, 59))).toBe('23:59');
    expect(toLocalTimeLabel(new Date(2026, 8, 29, 0, 0))).toBe('00:00');
  });

  test('时区陷阱：UTC 18:00 在上海应显示为次日 02:00', () => {
    const localEarlyMorning = new Date(Date.UTC(2026, 8, 28, 18, 0, 0));
    expect(toLocalTimeLabel(localEarlyMorning)).toBe('02:00');
    // 反例：切 ISO 串会得到 UTC 的 18:00（错误写法）
    expect(localEarlyMorning.toISOString().slice(11, 16)).toBe('18:00');
  });
});

describe('isToday / isYesterday', () => {
  const now = new Date(2026, 8, 29, 10, 0); // 上海 9/29 10:00

  test('isToday', () => {
    expect(isToday(new Date(2026, 8, 29, 2, 0), now)).toBe(true);
    expect(isToday(new Date(2026, 8, 28, 23, 0), now)).toBe(false);
  });

  test('isYesterday', () => {
    expect(isYesterday(new Date(2026, 8, 28, 23, 0), now)).toBe(true);
    expect(isYesterday(new Date(2026, 8, 27, 23, 0), now)).toBe(false);
    expect(isYesterday(new Date(2026, 8, 29, 1, 0), now)).toBe(false);
  });
});

describe('groupByLocalDate - 归档分组', () => {
  interface Item {
    id: string;
    completedAt: Date | null;
  }

  const now = new Date(2026, 8, 29, 10, 0); // 参考「今天」= 9/29

  test('同一本地日期、不同 UTC 日的两个待办必须分进同一个「今天」段', () => {
    // 上海 9/29 02:00（UTC 8/28 18:00）与 9/29 23:00（UTC 9/29 15:00）
    // 用 UTC 切片会被拆成两天，用本地时区必须合为同一天
    const items: Item[] = [
      { id: 'a', completedAt: new Date(Date.UTC(2026, 8, 28, 18, 0, 0)) },
      { id: 'b', completedAt: new Date(Date.UTC(2026, 8, 29, 15, 0, 0)) },
    ];

    const sections = groupByLocalDate(items, (i) => i.completedAt, now);
    expect(sections).toHaveLength(1);
    expect(sections[0].key).toBe('2026-09-29');
    expect(sections[0].label).toBe('今天');
    expect(sections[0].data.map((d) => d.id)).toEqual(['b', 'a']); // 组内按时间倒序
  });

  test('过滤未完成 + 多日期倒序 + 中文区头', () => {
    const items: Item[] = [
      { id: 'today', completedAt: new Date(2026, 8, 29, 9, 0) },
      { id: 'yesterday', completedAt: new Date(2026, 8, 28, 9, 0) },
      { id: 'twoDaysAgo', completedAt: new Date(2026, 8, 27, 9, 0) },
      { id: 'pending', completedAt: null }, // 应被过滤
    ];

    const sections = groupByLocalDate(items, (i) => i.completedAt, now);
    expect(sections).toHaveLength(3);

    expect(sections[0]).toMatchObject({ key: '2026-09-29', label: '今天' });
    expect(sections[1]).toMatchObject({ key: '2026-09-28', label: '昨天' });
    expect(sections[2]).toMatchObject({ key: '2026-09-27', label: '9月27日' });

    // 未完成项被过滤
    const allIds = sections.flatMap((s) => s.data.map((d) => d.id));
    expect(allIds).not.toContain('pending');
  });
});
