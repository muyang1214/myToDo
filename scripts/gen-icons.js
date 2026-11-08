/**
 * PWA / App 图标生成器（零依赖）
 *
 * 设计：方案 B「清单打勾」+ 方案 A 的科技蓝渐变 (#3B82F6 → #1D4ED8)
 *   - 两条白色横线（第二条 65% 透明度，暗示"待办项"）
 *   - 一个白色大对勾（"完成"）
 *
 * 为什么自己渲染：
 *   本地没有 ImageMagick / sharp / PIL，pngjs 又只是 expo 的传递依赖不保证存在。
 *   所以 PNG 编码直接用 Node 内置 zlib 手写（IHDR/IDAT/IEND + CRC32），
 *   抗锯齿用「有符号距离场（SDF）」算覆盖率——比超采样更快，边缘更干净。
 *
 * 用法: node scripts/gen-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');

// ─── 设计常量（全部基于 160 单位的逻辑画布，改色/改形只动这里） ───────────────
const DESIGN = {
  canvas: 160,
  gradientFrom: [0x3b, 0x82, 0xf6], // #3B82F6 blue-500
  gradientTo: [0x1d, 0x4e, 0xd8], // #1D4ED8 blue-700
  bars: [
    // 与预览稿一致的形状；y 已重排，使整体上下留白对称、且与勾留出 10 单位间隙
    { x: 40, y: 23.5, w: 80, h: 13, alpha: 1 },
    { x: 40, y: 46.5, w: 58, h: 13, alpha: 0.65 },
  ],
  check: { points: [[44, 108], [64, 128], [120, 78]], width: 17 },
  // 内容已几何居中（bbox 23.5 ~ 136.5，中心正好 80），不再额外偏移
  offsetY: 0,
};

// ─── PNG 编码 ────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── 有符号距离场 ────────────────────────────────────────────────────────
/** 圆角矩形的有符号距离（< 0 在内部） */
function sdRoundBox(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r;
}

/** 点到线段的距离（胶囊体覆盖 = 该距离 - 半宽） */
function sdSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return Math.sqrt(dx * dx + dy * dy);
}

/** 折线（多段胶囊）的最小距离 */
function sdPolyline(px, py, points, halfWidth) {
  let d = Infinity;
  for (let i = 0; i < points.length - 1; i += 1) {
    d = Math.min(d, sdSegment(px, py, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]));
  }
  return d - halfWidth;
}

/** 距离 → 覆盖率（1px 宽的带状过渡即抗锯齿） */
function coverage(distancePx) {
  return Math.min(1, Math.max(0, 0.5 - distancePx));
}

// ─── 渲染 ────────────────────────────────────────────────────────────────
/**
 * @param {number} size         输出边长（像素）
 * @param {number} contentScale 前景内容缩放（maskable 用 0.82 躲进安全圆）
 */
function renderIcon(size, contentScale) {
  const { canvas, gradientFrom, gradientTo, bars, check, offsetY } = DESIGN;
  // 小尺寸放大 4 倍再降采样，保证 32/48px 下边缘不糊
  const ss = size <= 256 ? 4 : 2;
  const W = size * ss;
  const unitToPx = W / canvas;
  const buf = Buffer.alloc(W * W * 4);

  for (let y = 0; y < W; y += 1) {
    for (let x = 0; x < W; x += 1) {
      // 像素中心 → 逻辑坐标
      const ux = ((x + 0.5) / unitToPx);
      const uy = ((y + 0.5) / unitToPx);
      // 反变换到「内容坐标系」（maskable 时内容被缩小居中）
      const cx = canvas / 2 + (ux - canvas / 2) / contentScale;
      const cy = canvas / 2 + (uy - canvas / 2) / contentScale;
      const pxPerUnit = unitToPx * contentScale;

      let [r, g, b] = gradientAt(ux / canvas, uy / canvas);

      for (const bar of bars) {
        const d = sdRoundBox(
          cx,
          cy,
          bar.x + bar.w / 2,
          bar.y + offsetY + bar.h / 2,
          bar.w / 2,
          bar.h / 2,
          bar.h / 2,
        );
        const a = coverage(d * pxPerUnit) * bar.alpha;
        if (a > 0) {
          r = r + (255 - r) * a;
          g = g + (255 - g) * a;
          b = b + (255 - b) * a;
        }
      }

      const checkD = sdPolyline(cx, cy, check.points.map(([px2, py2]) => [px2, py2 + offsetY]), check.width / 2);
      const ca = coverage(checkD * pxPerUnit);
      if (ca > 0) {
        r = r + (255 - r) * ca;
        g = g + (255 - g) * ca;
        b = b + (255 - b) * ca;
      }

      const o = (y * W + x) * 4;
      buf[o] = Math.round(r);
      buf[o + 1] = Math.round(g);
      buf[o + 2] = Math.round(b);
      buf[o + 3] = 255;
    }
  }

  return downsample(buf, W, size, ss);
}

/** 135° 对角线性渐变 */
function gradientAt(tx, ty) {
  const { gradientFrom: from, gradientTo: to } = DESIGN;
  const t = Math.min(1, Math.max(0, (tx + ty) / 2));
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}

/** 方形盒式降采样（超采样 → 目标尺寸） */
function downsample(src, srcSize, dstSize, ss) {
  if (ss === 1) return src;
  const dst = Buffer.alloc(dstSize * dstSize * 4);
  const samples = ss * ss;
  for (let y = 0; y < dstSize; y += 1) {
    for (let x = 0; x < dstSize; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let dy = 0; dy < ss; dy += 1) {
        for (let dx = 0; dx < ss; dx += 1) {
          const o = ((y * ss + dy) * srcSize + (x * ss + dx)) * 4;
          r += src[o];
          g += src[o + 1];
          b += src[o + 2];
        }
      }
      const o = (y * dstSize + x) * 4;
      dst[o] = Math.round(r / samples);
      dst[o + 1] = Math.round(g / samples);
      dst[o + 2] = Math.round(b / samples);
      dst[o + 3] = 255;
    }
  }
  return dst;
}

// ─── 输出清单 ────────────────────────────────────────────────────────────
const TARGETS = [
  // 原生构建用（app.json 的 icon 字段），顺带更新成同一套视觉
  { file: 'assets/icon.png', size: 1024, scale: 1 },
  // PWA：主图标
  { file: 'public/icon-512.png', size: 512, scale: 1 },
  { file: 'public/icon-192.png', size: 192, scale: 1 },
  // PWA：Android 自适应图标，内容需缩进中心安全圆内（否则被裁成畸形）
  { file: 'public/icon-maskable-512.png', size: 512, scale: 0.82 },
  // iOS 添加到主屏幕
  { file: 'public/apple-touch-icon.png', size: 180, scale: 1 },
  // 浏览器标签页
  { file: 'public/favicon.png', size: 48, scale: 1 },
];

fs.mkdirSync(path.join(ROOT, 'public'), { recursive: true });

for (const target of TARGETS) {
  const abs = path.join(ROOT, target.file);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const started = Date.now();
  const png = encodePNG(target.size, target.size, renderIcon(target.size, target.scale));
  fs.writeFileSync(abs, png);
  console.log(
    `${target.file.padEnd(36)} ${String(target.size).padStart(4)}px  ${(png.length / 1024).toFixed(1).padStart(7)} KB  ${Date.now() - started}ms`,
  );
}

console.log('\n完成。改色改形只改 DESIGN 常量后重跑本脚本。');
