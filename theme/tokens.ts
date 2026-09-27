/**
 * MyToDo v1.5 设计 Token —— 白蓝科技风
 *
 * 集中管理颜色 / 间距 / 圆角 / 字号 / 字体。改主题只动这里，
 * 全站使用同一套 token，避免散落硬编码色值。
 */
import { Platform } from 'react-native';

export const colors = {
  // 背景层
  bg: '#F8FAFC', // 页面冷灰底 (slate-50)
  surface: '#FFFFFF', // 卡片 / 表面

  // 主色：科技蓝（不是 iOS 默认蓝 #007AFF）
  primary: '#2563EB', // 主蓝 (blue-600)
  primarySoft: '#EFF6FF', // 浅蓝底 (blue-50)
  primaryBorder: '#BFDBFE', // 蓝描边 (blue-200)

  // 文字
  text: '#0F172A', // 主文字 (slate-900)
  textSecondary: '#64748B', // 次文字 (slate-500)
  textMuted: '#94A3B8', // 弱文字 (slate-400)

  // 描边 / 分隔
  border: '#E2E8F0', // 卡片描边 (slate-200)
  divider: '#F1F5F9', // 分隔线 (slate-100)

  // 状态
  danger: '#EF4444', // 删除 / 危险 (red-500)

  // 分类色点
  catWork: '#2563EB', // 工作 - 蓝
  catSport: '#06B6D4', // 运动 - 青
  catInvestment: '#F59E0B', // 投资 - 琥珀
  catLife: '#8B5CF6', // 生活 - 紫
  catNone: '#94A3B8', // 未分类 - 灰
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 11,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
} as const;

// 等宽字体（极客味：统计数字 / 日期等宽对齐，出 terminal 味）
export const fontMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  web: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}) as string;

// 无衬线（正文）
export const fontSans = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: '-apple-system, system-ui, sans-serif',
}) as string;

// 卡片基础样式：白底 + 0.5px 描边（不用阴影，更克制、更现代）
export const cardBase = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
} as const;

// Web 端内容最大宽度（限宽居中，避免宽屏列表拉散，这是"不像产品"的主因）
export const CONTENT_MAX_WIDTH = 640;
