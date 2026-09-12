/**
 * 分包体积分析：统计主包与各分包的大小、文件构成，检查是否接近 2MB 限制
 * 用法：node scripts/pkg-size.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'miniprogram';
const LIMIT = 2 * 1024 * 1024; // 单包 2MB

function walk(dir, out = []) {
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const e of items) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push({ p, size: fs.statSync(p).size });
  }
  return out;
}

const all = walk(ROOT);
const group = { main: [], detail: [], subpages: [] };
all.forEach(f => {
  const rel = f.p.replace(/\\/g, '/').replace(ROOT + '/', '');
  if (rel.startsWith('detail/')) group.detail.push(f);
  else if (rel.startsWith('subpages/')) group.subpages.push(f);
  else group.main.push(f);
});

const sum = arr => arr.reduce((a, b) => a + b.size, 0);
const kb = n => (n / 1024).toFixed(1) + 'KB';
const pct = n => ((n / LIMIT) * 100).toFixed(1) + '%';

console.log('========== 分包体积（微信小程序单包上限 2MB）==========\n');
Object.entries(group).forEach(([k, arr]) => {
  const s = sum(arr);
  const warn = s > LIMIT ? '  ❌ 超限' : (s > LIMIT * 0.7 ? '  ⚠️ 接近上限' : '  ✅ 正常');
  console.log((k === 'main' ? '【主包】' : '【分包: ' + k + '】') + ' ' + kb(s) + '（' + arr.length + ' 个文件，占上限 ' + pct(s) + '）' + warn);
});

console.log('\n========== 主包构成明细 ==========');
const byDirMain = {};
group.main.forEach(f => {
  const rel = f.p.replace(/\\/g, '/').replace(ROOT + '/', '');
  const top = rel.includes('/') ? rel.split('/')[0] : '(根目录)';
  byDirMain[top] = (byDirMain[top] || 0) + f.size;
});
Object.entries(byDirMain).sort((a, b) => b[1] - a[1]).forEach(([d, s]) => {
  console.log('  ' + kb(s).padStart(10) + '   ' + d);
});

console.log('\n========== 主包中最大的 12 个文件 ==========');
group.main.slice().sort((a, b) => b.size - a.size).slice(0, 12).forEach(f => {
  console.log('  ' + kb(f.size).padStart(10) + '   ' + f.p.replace(/\\/g, '/'));
});

console.log('\n========== detail 分包构成 ==========');
const byDirDetail = {};
group.detail.forEach(f => {
  const rel = f.p.replace(/\\/g, '/').replace(ROOT + '/detail/', '');
  const top = rel.includes('/') ? rel.split('/')[0] : '(根目录)';
  byDirDetail[top] = (byDirDetail[top] || 0) + f.size;
});
Object.entries(byDirDetail).sort((a, b) => b[1] - a[1]).forEach(([d, s]) => {
  console.log('  ' + kb(s).padStart(10) + '   ' + d);
});

console.log('\n========== subpages 分包构成（按页面）==========');
const byPage = {};
group.subpages.forEach(f => {
  const rel = f.p.replace(/\\/g, '/').replace(ROOT + '/subpages/', '');
  const top = rel.includes('/') ? rel.split('/')[0] : '(根目录)';
  byPage[top] = (byPage[top] || 0) + f.size;
});
Object.entries(byPage).sort((a, b) => b[1] - a[1]).forEach(([d, s]) => {
  console.log('  ' + kb(s).padStart(10) + '   ' + d);
});

console.log('\n========== 建议 ==========');
const mainSize = sum(group.main);
if (mainSize > LIMIT) {
  console.log('  ❌ 主包已超过 2MB，必须拆分！');
} else if (mainSize > LIMIT * 0.7) {
  console.log('  ⚠️ 主包已用 ' + pct(mainSize) + '，建议把非首屏必需的内容（如数据文件、低频页面）迁到分包');
} else {
  console.log('  ✅ 主包体积健康（' + kb(mainSize) + '，占上限 ' + pct(mainSize) + '）');
}
const bigData = group.main.filter(f => /data\/.*\.js$/.test(f.p.replace(/\\/g, '/'))).sort((a, b) => b.size - a.size);
if (bigData.length) {
  console.log('\n  主包内的数据文件（可考虑迁入分包）:');
  bigData.forEach(f => console.log('    ' + kb(f.size).padStart(10) + '   ' + f.p.replace(/\\/g, '/')));
}
