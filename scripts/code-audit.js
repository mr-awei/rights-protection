/**
 * 代码审计：检查未引用的组件 / 数据文件、console 调用、大文件等
 * 用法：node scripts/code-audit.js
 */
const fs = require('fs');
const path = require('path');

function walk(dir, exts, out = []) {
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const e of items) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!/node_modules|\.git|\.codebuddy|_tmp|^_/.test(e.name)) walk(p, exts, out);
    } else if (exts.some(x => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; } };

console.log('========== 1. 组件引用检查 ==========');
const viewFiles = walk('miniprogram', ['.wxml', '.json']);
const viewSrc = viewFiles.map(read).join('\n');
const comps = fs.readdirSync('miniprogram/components');
const unusedComps = [];
comps.forEach(c => {
  const used = viewSrc.includes('components/' + c + '/' + c) || viewSrc.includes('"' + c + '"');
  console.log((used ? '  ✅ 已引用   ' : '  ❌ 未引用   ') + 'components/' + c);
  if (!used) unusedComps.push(c);
});

console.log('\n========== 2. miniprogram/data 引用检查 ==========');
const jsFiles = walk('miniprogram', ['.js']);
const jsSrc = jsFiles.map(read).join('\n');
const unusedData = [];
fs.readdirSync('miniprogram/data').forEach(f => {
  const base = f.replace(/\.js$/, '');
  const used = jsSrc.includes(base);
  console.log((used ? '  ✅ 已引用   ' : '  ❌ 未引用   ') + 'miniprogram/data/' + f);
  if (!used) unusedData.push(f);
});

console.log('\n========== 3. 根目录 data/*.json 引用检查 ==========');
const projectFiles = walk('.', ['.js', '.py', '.json', '.md']).filter(f => !f.includes('node_modules'));
const projSrc = projectFiles.map(read).join('\n');
const unusedJson = [];
fs.readdirSync('data').forEach(f => {
  const used = projSrc.includes('data/' + f);
  console.log((used ? '  ✅ 已引用   ' : '  ❌ 未引用   ') + 'data/' + f);
  if (!used) unusedJson.push(f);
});

console.log('\n========== 4. console 调用统计 ==========');
let total = 0;
const byFile = [];
jsFiles.forEach(f => {
  const c = read(f);
  const n = (c.match(/console\.(log|warn|error|info)/g) || []).length;
  if (n > 0) { total += n; byFile.push({ f, n }); }
});
byFile.sort((a, b) => b.n - a.n);
console.log('  console 调用总数: ' + total + '（' + byFile.length + ' 个文件）');
byFile.slice(0, 12).forEach(x => console.log('    ' + x.n + '  ' + x.f));

console.log('\n========== 5. 较大的源码文件（>20KB）==========');
jsFiles.concat(walk('miniprogram', ['.wxml'])).forEach(f => {
  const size = fs.statSync(f).size;
  if (size > 20 * 1024) console.log('  ' + Math.round(size / 1024) + 'KB  ' + f);
});

console.log('\n========== 6. 汇总 ==========');
console.log('  未引用组件: ' + (unusedComps.join(', ') || '无'));
console.log('  未引用数据文件: ' + (unusedData.join(', ') || '无'));
console.log('  未引用根目录 json: ' + (unusedJson.join(', ') || '无'));
console.log('  console 调用: ' + total);
