/**
 * 初始化知识库：从现有运行时数据反向生成 Markdown 文件（一次性迁移）
 *
 * 生成的 md 以后就是唯一数据源（SSOT），人直接编辑，脚本再生成回 miniprogram/data/*.js。
 * 用 YAML front-matter 存放结构化字段，正文存放长文本，Obsidian / VS Code 均可直接编辑。
 *
 * 用法：node scripts/kb-init.js
 */
const fs = require('fs');
const path = require('path');

const KB = path.join(__dirname, '../kb');
const data = require('../miniprogram/utils/data.js');
data.loadAllData();

// 注意：miniprogram/data/channels_index.js 只是轻量索引（13 字段），完整数据在 detail/data/channels_part_*.js（32 字段，含 website/regulator/scope/tips/law_ids）。
// 迁移必须用分片数据，否则会丢失详情与法条关联。
const PART_FILES = ['channels_part_1', 'channels_part_2', 'channels_part_3'];
let channels = [];
PART_FILES.forEach(f => {
  try {
    const a = require('../miniprogram/detail/data/' + f + '.js');
    if (Array.isArray(a)) channels = channels.concat(a);
  } catch (e) { /* 忽略缺失分片 */ }
});
if (!channels.length) channels = data.getChannels() || [];

let laws = [];
try { laws = require('../miniprogram/detail/data/laws.js') || []; } catch (e) { laws = []; }

// ---- YAML 安全的标量 ----
function yamlStr(v) {
  const s = String(v === undefined || v === null ? '' : v);
  // 含特殊字符或首尾空格时用双引号包裹并转义
  if (/^[-\d]/.test(s) || /[:#\n"'`|>{}\[\]&*!%@]/.test(s) || /^\s|\s$/.test(s) || s === '' ||
    ['true', 'false', 'null', 'yes', 'no', 'on', 'off', '~'].includes(s.toLowerCase())) {
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
  }
  return s;
}

function yamlList(arr) {
  const list = toIdArray(arr);
  if (list.length === 0) return '[]';
  const lines = list.map(x => '  - ' + yamlStr(x));
  return '\n' + lines.join('\n');
}

// 兼容历史脏数据：law_ids 在部分渠道里是逗号分隔的字符串而非数组
function toIdArray(v) {
  if (Array.isArray(v)) return v.filter(x => x !== undefined && x !== null && String(x).trim() !== '');
  if (typeof v === 'string' && v.trim()) return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function safeFileName(s) {
  return String(s || '').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '').slice(0, 40);
}

function writeFile(dir, fileName, content) {
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, fileName);
  if (fs.existsSync(p)) {
    console.log('  ⏭  已存在，跳过: ' + path.relative(KB, p).replace(/\\/g, '/'));
    return false;
  }
  fs.writeFileSync(p, content, 'utf8');
  return true;
}

let nChannel = 0, nScript = 0, nLaw = 0;

// ==================== 渠道 ====================
channels.forEach(c => {
  const fm = [
    '---',
    'type: channel',
    'id: ' + yamlStr(c.id),
    'name: ' + yamlStr(c.name),
    'phone: ' + yamlStr(c.phone),
    'website: ' + yamlStr(c.website),
    'regulator: ' + yamlStr(c.regulator),
    'category_l1: ' + yamlStr(c.category_l1),
    'category_l2: ' + yamlStr(c.category_l2),
    'category_user: ' + yamlStr(c.category_user),
    'category_user_l2: ' + yamlStr(c.category_user_l2),
    'channel_type: ' + yamlStr(c.channel_type),
    'hot_level: ' + yamlStr(c.hot_level === undefined ? 0 : c.hot_level),
    'related_script_id: ' + yamlStr(c.related_script_id || ''),
    'law_ids:' + yamlList(c.law_ids),
    'issue_types:' + yamlList(c.issue_types),
    'tags:' + yamlList(c.tags),
    '---',
    '',
    '# ' + (c.name || c.id),
    '',
    '## 适用范围',
    '',
    c.scope || '（待补充）',
    '',
    '## 前置条件',
    '',
    c.precondition || '（无）',
    '',
    '## 实用提示',
    '',
    c.tips || '（无）'
  ].join('\n');

  const fn = c.id + '-' + safeFileName(c.name) + '.md';
  if (writeFile(path.join(KB, 'channels'), fn, fm)) nChannel++;
});

// ==================== 话术 ====================
(data.getScripts() || []).forEach(s => {
  const fm = [
    '---',
    'type: script',
    'id: ' + yamlStr(s.id),
    'scene_name: ' + yamlStr(s.scene_name),
    'category: ' + yamlStr(s.category),
    'applicable: ' + yamlStr(s.applicable),
    'is_general: ' + (s.is_general ? 'true' : 'false'),
    'hot_level: ' + yamlStr(s.hot_level === undefined ? 0 : s.hot_level),
    'keywords:' + yamlList(s.keywords),
    '---',
    '',
    '# ' + (s.scene_name || s.id),
    '',
    '## 电话版话术',
    '',
    s.phone_script || '（无）',
    '',
    '## 书面版话术',
    '',
    s.written_template || '（无）'
  ].join('\n');

  const fn = s.id + '-' + safeFileName((s.scene_name || '').replace(/^场景\d+[:：]/, '')) + '.md';
  if (writeFile(path.join(KB, 'scripts'), fn, fm)) nScript++;
});

// ==================== 法规 ====================
laws.forEach(l => {
  const fm = [
    '---',
    'type: law',
    'id: ' + yamlStr(l.id),
    'name: ' + yamlStr(l.name),
    'full_name: ' + yamlStr(l.full_name),
    'category:' + yamlList(l.category),
    '---',
    '',
    '# ' + (l.name || l.id),
    '',
    l.article || l.content || '（待补充）'
  ].join('\n');

  const fn = l.id + '-' + safeFileName(l.name) + '.md';
  if (writeFile(path.join(KB, 'laws'), fn, fm)) nLaw++;
});

console.log('\n✅ 知识库初始化完成 → kb/');
console.log('   渠道 ' + nChannel + ' 个 | 话术 ' + nScript + ' 条 | 法规 ' + nLaw + ' 条');
