/**
 * 初始化知识库：从现有运行时数据反向生成 Markdown（一次性迁移）
 *
 * 结构：按「一级分类」聚合成少量文件（便于人工阅读与交接），而不是一实体一文件。
 *   - 渠道：按 category_l1 分成 5 个文件
 *   - 话术：1 个文件
 *   - 法规：1 个文件
 * 每个实体用 "## id · 名称" 分节，字段用 "- key: value" 列表，长文本用 **小节名** 段落。
 *
 * 用法：node scripts/kb-init.js
 */
const fs = require('fs');
const path = require('path');

const KB = path.join(__dirname, '../kb');
const data = require('../miniprogram/utils/data.js');
data.loadAllData();

const PART_FILES = ['channels_part_1', 'channels_part_2', 'channels_part_3'];
let channels = [];
PART_FILES.forEach(f => {
  try {
    const a = require('../miniprogram/detail/data/' + f + '.js');
    if (Array.isArray(a)) channels = channels.concat(a);
  } catch (e) { /* ignore */ }
});
if (!channels.length) channels = data.getChannels() || [];

let laws = [];
try { laws = require('../miniprogram/detail/data/laws.js') || []; } catch (e) { laws = []; }

// ---------- 工具 ----------
function yamlStr(v) {
  const s = String(v === undefined || v === null ? '' : v).replace(/\r?\n/g, ' ').trim();
  return s;
}
function toIdArray(v) {
  if (Array.isArray(v)) return v.filter(x => x !== undefined && x !== null && String(x).trim() !== '');
  if (typeof v === 'string' && v.trim()) return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}
function safeFileName(s) {
  return String(s || '未分类').replace(/[\\/:*?"<>|]/g, '_').trim();
}
function writeFile(relPath, content) {
  const p = path.join(KB, relPath);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  if (fs.existsSync(p)) { console.log('  ⏭  已存在，跳过: ' + relPath); return false; }
  fs.writeFileSync(p, content, 'utf8');
  return true;
}

// ---------- 渠道：按一级分类分组 ----------
const byCat = {};
channels.forEach(c => {
  const k = c.category_l1 || '未分类';
  if (!byCat[k]) byCat[k] = [];
  byCat[k].push(c);
});

let nChannelFile = 0, nChannel = 0;
Object.keys(byCat).sort().forEach(cat => {
  const list = byCat[cat].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const parts = [
    '---',
    'type: channel-group',
    'category_l1: ' + yamlStr(cat),
    'count: ' + list.length,
    '---',
    '',
    '# ' + cat + '（' + list.length + ' 条）',
    ''
  ];
  list.forEach(c => {
    parts.push('## ' + c.id + ' · ' + (c.name || ''));
    parts.push('');
    const fields = [
      ['id', c.id], ['name', c.name], ['phone', c.phone], ['website', c.website],
      ['regulator', c.regulator], ['category_l2', c.category_l2],
      ['category_user', c.category_user], ['category_user_l2', c.category_user_l2],
      ['channel_type', c.channel_type], ['hot_level', c.hot_level === undefined ? 0 : c.hot_level],
      ['related_script_id', c.related_script_id || ''],
      ['law_ids', toIdArray(c.law_ids).join(', ')],
      ['issue_types', toIdArray(c.issue_types).join(', ')],
      ['tags', toIdArray(c.tags).join(', ')]
    ];
    fields.forEach(([k, v]) => { parts.push('- ' + k + ': ' + yamlStr(v)); });
    parts.push('');
    ['适用范围', '前置条件', '实用提示'].forEach(sec => {
      const val = { '适用范围': c.scope, '前置条件': c.precondition, '实用提示': c.tips }[sec];
      parts.push('**' + sec + '**');
      parts.push('');
      parts.push(String(val || '').trim() || '（无）');
      parts.push('');
    });
  });
  const rel = 'channels/' + safeFileName(cat) + '.md';
  if (writeFile(rel, parts.join('\n'))) nChannelFile++;
  nChannel += list.length;
});

// ---------- 话术：1 个文件 ----------
const scripts = (data.getScripts() || []).sort((a, b) => String(a.id).localeCompare(String(b.id)));
{
  const parts = ['---', 'type: script-group', 'count: ' + scripts.length, '---', '', '# 投诉话术（' + scripts.length + ' 条）', ''];
  scripts.forEach(s => {
    parts.push('## ' + s.id + ' · ' + (s.scene_name || ''));
    parts.push('');
    [['id', s.id], ['scene_name', s.scene_name], ['category', s.category],
    ['applicable', s.applicable], ['is_general', s.is_general ? 'true' : 'false'],
    ['hot_level', s.hot_level === undefined ? 0 : s.hot_level],
    ['keywords', toIdArray(s.keywords).join(', ')]
    ].forEach(([k, v]) => { parts.push('- ' + k + ': ' + yamlStr(v)); });
    parts.push('');
    [['电话版话术', s.phone_script], ['书面版话术', s.written_template]].forEach(([sec, val]) => {
      parts.push('**' + sec + '**');
      parts.push('');
      parts.push(String(val || '').trim() || '（无）');
      parts.push('');
    });
  });
  writeFile('scripts/投诉话术.md', parts.join('\n'));
}

// ---------- 法规：1 个文件 ----------
{
  const list = laws.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const parts = ['---', 'type: law-group', 'count: ' + list.length, '---', '', '# 法律法规（' + list.length + ' 条）', ''];
  list.forEach(l => {
    parts.push('## ' + l.id + ' · ' + (l.name || ''));
    parts.push('');
    [['id', l.id], ['name', l.name], ['full_name', l.full_name],
    ['category', toIdArray(l.category).join(', ')]
    ].forEach(([k, v]) => { parts.push('- ' + k + ': ' + yamlStr(v)); });
    parts.push('');
    parts.push(String(l.article || l.content || '').trim() || '（待补充）');
    parts.push('');
  });
  writeFile('laws/法律法规.md', parts.join('\n'));
}

console.log('\n✅ 知识库初始化完成 → kb/');
console.log('   渠道: ' + nChannel + ' 条，分 ' + nChannelFile + ' 个文件（按一级分类）');
console.log('   话术: ' + scripts.length + ' 条（1 个文件）');
console.log('   法规: ' + laws.length + ' 条（1 个文件）');
