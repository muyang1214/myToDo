/**
 * 本地时区日期工具
 *
 * 为什么需要这个文件：Supabase 存的是 UTC 的 ISO 字符串（如 2026-09-28T18:00:00Z）。
 * 上海是 UTC+8，当地时间 23:00 完成会被存成 2026-09-28T15:00:00Z。
 * 如果直接 `iso.slice(0, 10)` 取日期，会得到 2026-09-28，把本该归到「今天」的待办
 * 错误塞进「昨天」。所有分组/判断都必须走「本地时区 getter」，绝不用 UTC 切片。
 */

/** 归一为 Date：支持 Date / ISO 字符串 / 时间戳 */
function toDate(input: Date | string | number): Date {
  return input instanceof Date ? input : new Date(input);
}

/**
 * 取「本地时区」的 YYYY-MM-DD，作为分组主键。
 * 关键：用 getFullYear/getMonth/getDate（本地时区），而不是 toISOString().slice(0,10)（UTC）。
 */
export function toLocalDateKey(input: Date | string | number): string {
  const d = toDate(input);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 两个时间是否落在同一个「本地日期」 */
export function isSameLocalDate(a: Date | string | number, b: Date | string | number): boolean {
  return toLocalDateKey(a) === toLocalDateKey(b);
}

/** 是否「今天」（本地时区）。now 可注入，便于测试与确定性渲染 */
export function isToday(input: Date | string | number, now: Date = new Date()): boolean {
  return toLocalDateKey(input) === toLocalDateKey(now);
}

/** 是否「昨天」（本地时区）。now 可注入 */
export function isYesterday(input: Date | string | number, now: Date = new Date()): boolean {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return toLocalDateKey(input) === toLocalDateKey(yesterday);
}

/** 把 YYYY-MM-DD 键转成中文区头（MM月DD日），避免用 new Date(key) 再被时区解释 */
function labelFromKey(key: string): string {
  const [, month, day] = key.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

export interface DateSection<T> {
  /** 本地日期主键 YYYY-MM-DD */
  key: string;
  /** 区头标签：今天 / 昨天 / MM月DD日 */
  label: string;
  /** 该日期下的数据（组内按时间倒序：最近的在前） */
  data: T[];
}

/**
 * 按「本地完成日」把数据分组，直接供 SectionList 使用。
 *
 * @param items     待分组数组
 * @param getDate   取分组日期的 selector（返回 Date | 字符串 | null）。返回 null/undefined 的项会被过滤
 * @param now       参考「今天」，默认 new Date()，可注入便于测试
 *
 * 行为：
 *  - 段间按日期倒序（新的日期在前）
 *  - 段内按完成时间倒序（最近的在前）
 *  - 自动生成「今天 / 昨天 / MM月DD日」中文区头
 */
export function groupByLocalDate<T>(
  items: T[],
  getDate: (item: T) => Date | string | number | null | undefined,
  now: Date = new Date(),
): DateSection<T>[] {
  const nowKey = toLocalDateKey(now);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday);

  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const d = getDate(item);
    if (d == null) continue; // 未完成 / 无日期 → 过滤
    const key = toLocalDateKey(d);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(item);
  }

  return Array.from(buckets.entries())
    .map(([key, data]) => {
      const sorted = [...data].sort((a, b) => {
        const da = toDate(getDate(a)!).getTime();
        const db = toDate(getDate(b)!).getTime();
        return db - da; // 同组倒序
      });
      const label =
        key === nowKey ? '今天' : key === yesterdayKey ? '昨天' : labelFromKey(key);
      return { key, label, data: sorted };
    })
    .sort((a, b) => (a.key < b.key ? 1 : -1)); // 段间倒序（新的在前）
}
