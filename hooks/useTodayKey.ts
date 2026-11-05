import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { toLocalDateKey } from '@/utils/date';

/**
 * 返回「今天」的本地日期键 YYYY-MM-DD，跨过 0 点会自动更新。
 *
 * 为什么需要这个 hook：
 * `new Date()` 只在 render 那一刻算一次。页面一直开着过了 0 点，
 * 「今天 / 昨天」的判定会停在前一天 —— 而这类"数据悄悄过期"的 bug
 * 最伤信任（用户看到的数字是错的，却没有任何提示）。
 *
 * 三重触发，覆盖所有回前台的方式：
 *  1. 每分钟轮询（页面一直开着没动，靠它跨天）
 *  2. AppState 变 active（移动端从后台切回来）
 *  3. document visibilitychange（Web 端切标签页 / 切窗口）
 *
 * 用法：
 * ```tsx
 * const todayKey = useTodayKey();
 * // 以 todayKey 为依赖重算「此刻」，跨天时所有「今天」判定才会跟着变
 * const referenceNow = useMemo(() => new Date(), [todayKey]);
 * ```
 */
export function useTodayKey(): string {
  const [todayKey, setTodayKey] = useState(() => toLocalDateKey(new Date()));

  useEffect(() => {
    const sync = () => {
      const next = toLocalDateKey(new Date());
      // 相等就返回原值，避免 React 每次都判定「变了」而重渲染
      setTodayKey((prev) => (prev === next ? prev : next));
    };

    const timer = setInterval(sync, 60 * 1000);
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });

    // Web 专属：RN 的 AppState 在 web 上不监听标签页切换
    const doc: any = (globalThis as any).document;
    if (doc?.addEventListener) doc.addEventListener('visibilitychange', sync);

    return () => {
      clearInterval(timer);
      appSub.remove();
      if (doc?.removeEventListener) doc.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return todayKey;
}
