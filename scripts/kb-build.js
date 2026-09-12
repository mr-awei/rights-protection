/**
 * 知识库构建：kb/*.md（唯一数据源） → 小程序运行时数据
 *
 * 设计原则：Markdown 是人维护的 SSOT，JS 数据一律由本脚本生成，**不要再手工编辑 miniprogram/data/*.js**。
 *
 * 用法：
 *   node scripts/kb-build.js          校验模式（只对比，不写文件）
 *   node scripts/kb-build.js --write  写入模式（校验通过后才覆盖）
 */
const fs = require('fs');
const path = require('path');

const KB = path.join(__dirname, '../kb');
const WRITE = process.argv.includes('--write');

// ============ 极简 YAML front-matter 解析（本项目格式固定，不引第三方库）============
function unquote(v) {
  let s = String(v).trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
  } else if (s === '[]') return [];
  return s;
}

function parseFrontMatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: content };
  const data = {};
  let key = null;
  m[1].split(/\r?\n/).forEach(line => {
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && key) {
      if (!Array.isArray(data[key])) data[key] = [];
      data[key].push(unquote(item[1]));
      return;
    }
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) { key = kv[1]; data[key] = unquote(kv[2]); }
  });
  return { data, body: content.slice(m[0].length) };
}

// 从正文按 "## 标题" 提取小节
function section(body, title) {
  const re = new RegExp('##\\s*' + title + '\\s*\\r?\\n([\\s\\S]*?)(?=\\n##\\s|$)');
  const m = body.match(re);
  if (!m) return '';
  const t = m[1].trim();
  return (t === '（无）' || t === '（待补充）') ? '' : t;
}

function readDir(dir) {
  const p = path.join(KB, dir);
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p).filter(f => f.endsWith('.md')).map(f => {
    const raw = fs.readFileSync(path.join(p, f), 'utf8');
    const { data, body } = parseFrontMatter(raw);
    return { data, body, file: dir + '/' + f };
  });
}

// ============ 读取知识库 ============
const channels = readDir('channels').map(x => {
  const d = x.data;
  return {
    id: d.id, name: d.name, phone: d.phone, website: d.website, regulator: d.regulator,
    category_l1: d.category_l1, category_l2: d.category_l2,
    category_user: d.category_user, category_user_l2: d.category_user_l2,
    issue_types: d.issue_types || [], tags: d.tags || [],
    channel_type: d.channel_type, hot_level: Number(d.hot_level || 0),
    related_script_id: d.related_script_id || '', law_ids: d.law_ids || [],
    scope: section(x.body, '适用范围'),
    precondition: section(x.body, '前置条件'),
    tips: section(x.body, '实用提示')
  };
}).sort((a, b) => String(a.id).localeCompare(String(b.id)));

const scripts = readDir('scripts').map(x => ({
  id: x.data.id, scene_name: x.data.scene_name, category: x.data.category,
  applicable: x.data.applicable, is_general: x.data.is_general === 'true' || x.data.is_general === true,
  hot_level: Number(x.data.hot_level || 0), keywords: x.data.keywords || [],
  phone_script: section(x.body, '电话版话术'),
  written_template: section(x.body, '书面版话术')
})).sort((a, b) => String(a.id).localeCompare(String(b.id)));

const laws = readDir('laws').map(x => ({
  id: x.data.id, name: x.data.name, full_name: x.data.full_name,
  category: x.data.category || [], article: x.body.trim()
})).sort((a, b) => String(a.id).localeCompare(String(b.id)));

console.log('知识库读取: 渠道 ' + channels.length + ' / 话术 ' + scripts.length + ' / 法规 ' + laws.length);

// ============ 与现有运行时数据对比 ============
function norm(v) {
  return JSON.stringify(v, Object.keys(v || {}).sort ? Object.keys(v || {}).sort() : null);
}

// law_ids / issue_types 等可能是逗号分隔的字符串（历史脏数据），统一转数组再比较
function normIds(v) {
  if (Array.isArray(v)) return v.filter(x => x !== undefined && x !== null && String(x).trim() !== '');
  if (typeof v === 'string' && v.trim()) return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

const existingParts = ['channels_part_1', 'channels_part_2', 'channels_part_3'].reduce((acc, f) => {
  try {
    const a = require('../miniprogram/detail/data/' + f + '.js');
    if (Array.isArray(a)) acc = acc.concat(a);
  } catch (e) { /* ignore */ }
  return acc;
}, []).sort((a, b) => String(a.id).localeCompare(String(b.id)));

console.log('现有分片数据: ' + existingParts.length + ' 条');

if (existingParts.length !== channels.length) {
  console.log('\n❌ 数量不一致，终止。请检查 kb/channels 是否有遗漏。');
  process.exit(1);
}

// 逐条比对关键字段
const diffs = [];
existingParts.forEach((old, i) => {
  const cur = channels[i];
  if (!cur || old.id !== cur.id) { diffs.push({ id: old.id, field: 'id', old: old.id, cur: cur && cur.id }); return; }
  ['name', 'phone', 'website', 'regulator', 'category_l1', 'category_l2', 'category_user', 'related_script_id', 'scope', 'precondition', 'tips'].forEach(k => {
    const a = String(old[k] || '').trim();
    const b = String(cur[k] || '').trim();
    if (a !== b) diffs.push({ id: old.id, field: k, old: a.slice(0, 40), cur: b.slice(0, 40) });
  });
  // law_ids 在历史数据里是逗号分隔字符串，知识库统一为数组；比较时都规范化为数组
  const oldLaw = JSON.stringify(normIds(old.law_ids));
  const curLaw = JSON.stringify(normIds(cur.law_ids));
  if (oldLaw !== curLaw) diffs.push({ id: old.id, field: 'law_ids', old: oldLaw, cur: curLaw });
});

if (diffs.length) {
  console.log('\n⚠️ 发现 ' + diffs.length + ' 处差异（前 15 条）:');
  diffs.slice(0, 15).forEach(d => {
    console.log('  [' + d.id + '] ' + d.field);
    console.log('      现有: ' + d.old);
    console.log('      知识库: ' + d.cur);
  });
  if (!WRITE) {
    console.log('\n这是校验模式，未写入任何文件。确认差异无误后加 --write 生成。');
    process.exit(0);
  }
  console.log('\n⚠️ 写入模式：将按知识库覆盖现有数据');
} else {
  console.log('\n✅ 知识库与现有运行时数据完全一致');
}

// ============ 写入（仅 --write 且校验通过）============
if (!WRITE) {
  console.log('\n（校验模式结束，未写入）');
  process.exit(0);
}

// 生成渠道索引（13 字段）与分片（完整）
const indexFields = ['id', 'name', 'phone', 'tags', 'category_l1', 'category_l2', 'category_user',
  'category_user_l2', 'issue_types', 'related_script_id', 'channel_type', 'hot_level'];

const indexArr = channels.map((c, i) => {
  const o = {};
  indexFields.forEach(k => { o[k] = c[k]; });
  o.part_num = i < 50 ? 1 : (i < 100 ? 2 : 3);
  return o;
});

function toJs(arr, varName) {
  return '// 本文件由 scripts/kb-build.js 从 kb/ 自动生成，请勿手工编辑\n' +
    'module.exports = ' + JSON.stringify(arr, null, 2) + ';\n';
}

fs.writeFileSync(path.join(__dirname, '../miniprogram/data/channels_index.js'), toJs(indexArr), 'utf8');

const p1 = channels.slice(0, 50), p2 = channels.slice(50, 100), p3 = channels.slice(100);
const oldByid = {};
existingParts.forEach(o => { oldByid[o.id] = o; });
// 分片保留原文件里未纳入 kb 的扩展字段（如 effect_rating / materials 等），避免信息丢失
function merge(oldArr, newArr) {
  return newArr.map(n => Object.assign({}, oldByid[n.id] || {}, n));
}
fs.writeFileSync(path.join(__dirname, '../miniprogram/detail/data/channels_part_1.js'), toJs(merge(p1, p1)), 'utf8');
fs.writeFileSync(path.join(__dirname, '../miniprogram/detail/data/channels_part_2.js'), toJs(merge(p2, p2)), 'utf8');
fs.writeFileSync(path.join(__dirname, '../miniprogram/detail/data/channels_part_3.js'), toJs(merge(p3, p3)), 'utf8');

fs.writeFileSync(path.join(__dirname, '../miniprogram/data/scripts.js'), toJs(scripts), 'utf8');
fs.writeFileSync(path.join(__dirname, '../miniprogram/detail/data/laws.js'), toJs(laws), 'utf8');

console.log('\n✅ 已生成:');
console.log('   miniprogram/data/channels_index.js (' + indexArr.length + ' 条索引)');
console.log('   miniprogram/detail/data/channels_part_1/2/3.js (50/50/' + p3.length + ')');
console.log('   miniprogram/data/scripts.js (' + scripts.length + ' 条)');
console.log('   miniprogram/detail/data/laws.js (' + laws.length + ' 条)');
