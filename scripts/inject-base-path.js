/**
 * 子目录部署引导脚本注入器
 *
 * 用法：node scripts/inject-base-path.js <index.html 路径> [basePath，默认 /myToDo]
 *
 * ── 为什么必须在 HTML 里做 ──────────────────────────────────────────────
 * expo-router 在挂载那一刻就用 window.location.pathname 匹配路由表。等 React 组件
 * 开始执行（无论模块作用域还是 useEffect）时，路由可能已经匹配过一轮并渲染成
 * "Page could not be found"；而 history.replaceState 是静默的，不会触发重新匹配，
 * 页面就永久卡在 Unmatched。
 * 内联脚本位于 <head>，在带 defer 的 bundle 之前同步执行，此时路由还没开始工作。
 *
 * ── 为什么要包 history 而不是在 React 里补前缀 ──────────────────────────
 * 试过在 usePathname 的 effect 里补 /myToDo，结果被 expo-router 内部的
 * history.replaceState 覆盖回无前缀路径（它在我们之后执行），两边抢地址栏。
 * 因此在源头包一层：任何写入地址栏的路径自动加前缀，只有一个写入口，没有竞争。
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

const snippet = `<script>(function(){var b=${JSON.stringify(base)};var p=location.pathname;if(p.indexOf(b)!==0)return;window.__BASE_PATH__=b;var rp=history.pushState.bind(history),rr=history.replaceState.bind(history);function fix(u){if(typeof u!=="string")return u;if(u===b||u.indexOf(b+"/")===0)return u;if(u.charAt(0)!=="/")return u;return b+u;}history.pushState=function(s,t,u){return rp(s,t,fix(u));};history.replaceState=function(s,t,u){return rr(s,t,fix(u));};var r=p.slice(b.length)||"/";rr(history.state,"",r+location.search+location.hash);})();</script>`;

if (!html.includes('<head>')) {
  console.error('未找到 <head> 标签，无法注入');
  process.exit(1);
}

html = html.replace('<head>', `<head>${snippet}`);
fs.writeFileSync(file, html);
console.log(`已注入 basePath=${base} → ${file}`);
