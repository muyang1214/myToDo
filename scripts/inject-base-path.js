/**
 * Web 产物后处理：子目录路径引导 + PWA 标签注入
 *
 * 用法：node scripts/inject-base-path.js <index.html 路径> [basePath，默认 /myToDo]
 *
 * 本脚本在 `expo export --platform web` 之后、`sed` 修正资源路径之前执行，负责两件事：
 *   ① 注入 basePath 引导脚本（解决子目录路由匹配）
 *   ② 注入 PWA 的 meta / link 标签（解决"添加到主屏幕"后的全屏与图标）
 *
 * ── ① 为什么必须在 HTML 里做 ──────────────────────────────────────────
 * expo-router 在挂载那一刻就用 window.location.pathname 匹配路由表。等 React 组件
 * 开始执行（无论模块作用域还是 useEffect）时，路由可能已经匹配过一轮并渲染成
 * "Page could not be found"；而 history.replaceState 是静默的，不会触发重新匹配，
 * 页面就永久卡在 Unmatched。
 * 内联脚本位于 <head>，在带 defer 的 bundle 之前同步执行，此时路由还没开始工作。
 *
 * ── ① 为什么要包 history 而不是在 React 里补前缀 ──────────────────────
 * 试过在 usePathname 的 effect 里补 /myToDo，结果被 expo-router 内部的
 * history.replaceState 覆盖回无前缀路径（它在我们之后执行），两边抢地址栏。
 * 因此在源头包一层：任何写入地址栏的路径自动加前缀，只有一个写入口，没有竞争。
 *
 * ── ② 为什么不写在 app/+html.tsx ─────────────────────────────────────
 * +html.tsx 只在静态渲染（app.json 的 web.output: "static"）下接管 HTML 外壳。
 * 本项目是 "single"（SPA）模式，该文件会被完全忽略——试过，产物 HTML 依旧是
 * Expo 默认模板，一个 manifest link 都没有。所以改在这里注入。
 *
 * ── 为什么 PWA 资源的 href 要带前缀，而 manifest 内部可以用相对路径 ──
 * HTML 里的 href 会被浏览器按「当前文档 URL」解析，SPA 深链 /myToDo/protected/archive
 * 会把相对路径解析成 /myToDo/protected/manifest.json（404）；而 manifest.json 里的
 * start_url / scope / icons.src 是按「manifest 自身 URL」解析的，写成 "./" 反而能在
 * 本地根路径和 /myToDo/ 子目录下同时正确，无需任何改写。
 *
 * ── 保留标记 ─────────────────────────────────────────────────────────
 * window.__BASE_PATH__ 供应用判断当前是否子目录部署（本地开发/Vercel 根路径没有它）。
 */
const fs = require('fs');

const [, , file, baseArg] = process.argv;

// Git Bash / MSYS 会把以 / 开头的参数自动转成 Windows 路径（/myToDo → D:/.../myToDo），
// 这里统一归一化，保证只保留最后一段并补上前导斜杠。
function normalizeBase(raw) {
  const v = String(raw || '').trim();
  if (!v) return '/myToDo';
  if (v.startsWith('/')) return v.replace(/\/+$/, '') || '/myToDo';
  const last = v.split(/[\\/]/).filter(Boolean).pop();
  return '/' + (last || 'myToDo');
}

const base = normalizeBase(baseArg);

if (!file) {
  console.error('usage: node scripts/inject-base-path.js <index.html> [basePath]');
  process.exit(1);
}

let html = fs.readFileSync(file, 'utf8');

if (html.includes('__BASE_PATH__')) {
  console.log('已存在引导脚本，跳过注入');
  process.exit(0);
}

// ② PWA 外观：manifest + 图标 + 主屏幕标题
// iOS Safari 不读 manifest 的 display 字段，必须靠 apple-mobile-web-app-* 才能全屏。
const pwaHead = [
  `<meta name="theme-color" content="#F8FAFC"/>`,
  `<meta name="description" content="轻量待办清单：随手记录，一键打勾，按日归档。"/>`,
  `<meta name="mobile-web-app-capable" content="yes"/>`,
  `<meta name="apple-mobile-web-app-capable" content="yes"/>`,
  `<meta name="apple-mobile-web-app-status-bar-style" content="default"/>`,
  `<meta name="apple-mobile-web-app-title" content="MyToDo"/>`,
  `<link rel="manifest" href="${base}/manifest.json"/>`,
  `<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png"/>`,
  `<link rel="icon" type="image/png" href="${base}/favicon.png"/>`,
].join('');

// ① 子目录引导：剥离前缀进路由 + 给 history 写入打补丁补回前缀
const bootstrap = `<script>(function(){var b=${JSON.stringify(base)};var p=location.pathname;if(p.indexOf(b)!==0)return;window.__BASE_PATH__=b;var rp=history.pushState.bind(history),rr=history.replaceState.bind(history);function fix(u){if(typeof u!=="string")return u;if(u===b||u.indexOf(b+"/")===0)return u;if(u.charAt(0)!=="/")return u;return b+u;}history.pushState=function(s,t,u){return rp(s,t,fix(u));};history.replaceState=function(s,t,u){return rr(s,t,fix(u));};var r=p.slice(b.length)||"/";rr(history.state,"",r+location.search+location.hash);})();</script>`;

if (!html.includes('<head>')) {
  console.error('未找到 <head> 标签，无法注入');
  process.exit(1);
}

html = html.replace('<head>', `<head>${bootstrap}${pwaHead}`);
// Expo 默认模板是 lang="en"，改成中文对屏幕阅读器和浏览器的字体回退都更准
html = html.replace('<html lang="en">', '<html lang="zh-CN">');

fs.writeFileSync(file, html);
console.log(`已注入 basePath=${base} + PWA 标签 → ${file}`);
