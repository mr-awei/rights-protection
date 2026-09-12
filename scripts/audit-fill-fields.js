// 临时脚本：审计话术填充表单的全部占位符字段，找出可优化项
const fs = require('fs');
const path = require('path');
const data = require('../miniprogram/utils/data.js');
data.loadAllData();
const scripts = data.getScripts();

// 读取 script-detail.js 里的 SELECT_OPTIONS 与 label 映射
const jsSrc = fs.readFileSync(path.join(__dirname, '../miniprogram/detail/script-detail/script-detail.js'), 'utf8');
const optBlock = jsSrc.match(/const SELECT_OPTIONS = \{([\s\S]*?)\n\};/)[1];
const SELECT_OPTIONS = {};
[...optBlock.matchAll(/'([^']+)':\s*\[([\s\S]*?)\]/g)].forEach(m => {
  SELECT_OPTIONS[m[1]] = [...m[2].matchAll(/'([^']*)'/g)].map(x => x[1]).filter(Boolean);
});
const labelBlock = jsSrc.match(/const labels = \{([\s\S]*?)\n    \};/);
const LABELS = {};
if (labelBlock) [...labelBlock[1].matchAll(/'([^']+)':\s*'([^']*)'/g)].forEach(m => { LABELS[m[1]] = m[2]; });

// 统计占位符
const fields = new Map();
scripts.forEach(s => {
  const t = String(s.phone_script || '') + '\n' + String(s.written_template || '');
  [...t.matchAll(/【([^】]+)】/g)].forEach(m => {
    const n = m[1];
    if (!fields.has(n)) fields.set(n, { count: 0, scenes: new Set() });
    const e = fields.get(n);
    e.count++;
    e.scenes.add((s.scene_name || s.id).replace(/^场景/, '场景').slice(0, 12));
  });
});

// 类型判定（与页面逻辑一致）
const hasOptions = n => (SELECT_OPTIONS[n] || []).length;
function typeOf(n) {
  const label = LABELS[n] || (n.length <= 10 && !n.includes('X') ? n : (n.includes('X') ? n : '投诉事由'));
  if (/X点|点钟|小时/.test(n + '|' + label)) return 'text';
  if (label === '日期' || label === '完整日期') return 'date';
  if (/^X年X月X日$/.test(n) || /^X月X日$/.test(n)) return 'date';
  if (hasOptions(n)) return 'select';
  if (/城市|地址|地区|所在地/.test(n + '|' + label)) return 'region';
  if (!/诉求/.test(n + '|' + label) && /金额|元|分贝|天数|课时|次数|月数|年限|持续/.test(n + '|' + label)) return 'number';
  return 'text';
}

const rows = [...fields.entries()].map(([n, e]) => ({
  name: n,
  count: e.count,
  scenes: [...e.scenes].join(','),
  type: typeOf(n),
  opts: hasOptions(n),
  label: LABELS[n] || '(自动)',
  len: n.length
}));
rows.sort((a, b) => b.count - a.count);

console.log('占位符总数: ' + rows.length + '\n');
console.log('字段 | 频次 | 类型 | 候选数 | 所属场景');
console.log('─'.repeat(90));
rows.forEach(r => {
  console.log(
    (r.name + '                ').slice(0, 20) +
    ('  ' + r.count).slice(-3) + '  | ' +
    (r.type + '      ').slice(0, 7) + ' | ' +
    ('  ' + r.opts).slice(-3) + '  | ' + r.scenes
  );
});

console.log('\n=== 分类汇总 ===');
const byType = {};
rows.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });
console.log(byType);

console.log('\n=== 已升级为可选（select）的字段 ===');
rows.filter(r => r.type === 'select').forEach(r => {
  console.log('  【' + r.name + '】候选 ' + r.opts + ' 项 | 标签: ' + r.label + ' | ' + r.count + ' 次');
});

console.log('\n=== 数字键盘（number）的字段 ===');
rows.filter(r => r.type === 'number').forEach(r => {
  console.log('  【' + r.name + '】标签: ' + r.label + ' | ' + r.count + ' 次');
});

console.log('\n=== 高频 text 字段（频次≥3 且当前为纯文本输入，最值得加候选/优化）===');
rows.filter(r => r.type === 'text' && r.count >= 3).forEach(r => {
  console.log('  【' + r.name + '】 出现 ' + r.count + ' 次 | 场景: ' + r.scenes);
});

console.log('\n=== 名称过长（>12 字，表单可能显示为「投诉事由」）===');
rows.filter(r => r.len > 12).forEach(r => {
  console.log('  【' + r.name + '】(' + r.len + '字) 出现 ' + r.count + ' 次');
});
