/**
 * 知识库构建：kb/*.md（唯一数据源） → 小程序运行时数据
 *
 * kb 按「一级分类」聚合成 7 个文件（便于人工阅读与交接）：
 *   kb/channels/<一级分类>.md（5 个）、kb/scripts/投诉话术.md、kb/laws/法律法规.md
 * 每个实体用 "## id · 名称" 分节，字段用 "- key: value"，长文本用 **小节名** 段落。
 *
 * 用法：
 *   node scripts/kb-build.js          校验模式（只对比，不写文件）
 *   node scripts/kb-build.js --write  写入模式
 */
const fs = require('fs');
const path = require('path');

const KB = path.join(__dirname, '../kb');
const WRITE = process.argv.includes('--write');

// ---------- 解析 ----------
function parseSection(line) {
  const m = line.match(/^\*\*(.+?)\*\*\s*$/);
  return m ? m[1] : null;
}

function parseEntities(file, longSections) {
  const raw = fs.readFileSync(file, 'utf8');
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  const chunks = body.split(/^##\s+/m).filter(s => s.trim());
  return chunks.map(chunk => {
    const lines = chunk.split(/\r?\n/);
    const heading = lines[0].trim();
    const data = {};
    let cur = null;
    lines.slice(1).forEach(line => {
      const item = line.match(/^-\s+(\w+):\s*(.*)$/);
      if (item) { data[item[1]] = String(item[2]).trim(); cur = null; return; }
      const sec = parseSection(line.trim());
      if (sec && longSections.includes(sec)) { cur = sec; data['§' + sec] = [];
        return;
      }
      if (cur) {
        const t = line.trim();
        if (t) data['§' + cur].push(t);
      }
    });
    longSections.forEach(s => { data['§' + s] = (data['§' + s] || []).join('\n').trim(); });
    return { heading, data };
  });
}

function ids(v) {
  if (Array.isArray(v)) return v.filter(x => x !== undefined && x !== null && String(x).trim() !== '');
  if (typeof v === 'string' && v.trim()) return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function clean(v) {
  const s = String(v || '').trim();
  return (s === '（无）' || s === '（待补充）') ? '' : s;
}

/**
 * 递归扫描目录下的所有 md（含子目录）。
 * 现在按一级分类是单文件；将来某分类条数过多时，可把该分类拆成「目录 + 按二级分类的多个 md」，脚本无需改动即可继续工作。
 */
function listDir(dir) {
  const p = path.join(KB, dir);
  const out = [];
  if (!fs.existsSync(p)) return out;
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.name.endsWith('.md')) out.push(fp);
    }
  })(p);
  return out.sort();
}

// ---------- 法条切片 / 引用关系辅助 ----------
function sliceArticles(text) {
  if (!text) return [];
  const re = /(第[一二三四五六七八九十百千零0-9]+条)/g;
  const ms = [...text.matchAll(re)];
  if (ms.length === 0) return [];
  const out = [];
  for (let i = 0; i < ms.length; i++) {
    const no = ms[i][1];
    const start = ms[i].index + no.length;
    const end = i + 1 < ms.length ? ms[i + 1].index : text.length;
    const content = text.slice(start, end).trim();
    if (content) out.push({ no, content });
  }
  return out;
}
function buildLawNameMap() {
  const map = {};
  listDir('laws').forEach(f => {
    const raw = fs.readFileSync(f, 'utf8');
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
    body.split(/^##\s+/m).filter(s => s.trim()).forEach(chunk => {
      const idm = chunk.split(/\r?\n/)[0].trim().match(/^(law_\w+)/);
      if (!idm) return;
      const id = idm[1];
      const nm = chunk.match(/^-\s+name:\s*(.+)$/m);
      const fn = chunk.match(/^-\s+full_name:\s*(.+)$/m);
      [nm && nm[1], fn && fn[1]].filter(Boolean).forEach(s => {
        const n = String(s).trim();
        map[n] = id;
        map[n.replace('中华人民共和国', '')] = id;
      });
    });
  });
  return map;
}
const LAW_NAME_MAP = buildLawNameMap();
/** 从文本提取「引用的法条」（可到条文级 law_id#条） */
function extractLawRefs(text, map) {
  const out = new Set();
  if (!text) return [];
  const re = /《([^》]{2,30})》/g;
  let m;
  while ((m = re.exec(text))) {
    const book = m[1].trim();
    const lawId = map[book] || map[book.replace('中华人民共和国', '')];
    if (!lawId) continue;
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 40);
    const artM = after.match(/第([一二三四五六七八九十百千零0-9]+)条/);
    out.add(artM ? lawId + '#' + artM[1] : lawId);
  }
  return [...out];
}
// ---------- 读取知识库 ----------
const CH_KEYS = ['id', 'name', 'phone', 'website', 'regulator', 'category_l2', 'category_user',
  'category_user_l2', 'channel_type', 'hot_level', 'related_script_id', 'law_ids', 'issue_types', 'tags'];
const CH_SECS = ['适用范围', '前置条件', '实用提示'];
let channels = [];
listDir('channels').forEach(f => {
  parseEntities(f, CH_SECS).forEach(e => {
    const d = e.data;
    if (!d.id) return;
    channels.push({
      id: d.id, name: clean(d.name), phone: clean(d.phone), website: clean(d.website),
      regulator: clean(d.regulator), category_l2: clean(d.category_l2),
      category_user: clean(d.category_user), category_user_l2: clean(d.category_user_l2),
      channel_type: clean(d.channel_type), hot_level: Number(d.hot_level || 0),
      related_script_id: clean(d.related_script_id),
      law_ids: [...new Set([...ids(d.law_ids), ...extractLawRefs([clean(d.scope), clean(d.precondition), clean(d.tips), clean(d.name)].join(' '), LAW_NAME_MAP)])],
      issue_types: ids(d.issue_types), tags: ids(d.tags),
      scope: clean(d['§适用范围']), precondition: clean(d['§前置条件']), tips: clean(d['§实用提示']),
      category_l1: (fs.readFileSync(f, 'utf8').match(/^category_l1:\s*(.+)$/m) || [])[1] || '',
      file: path.basename(f)
    });
  });
});
channels.sort((a, b) => String(a.id).localeCompare(String(b.id)));

const SC_SECS = ['电话版话术', '书面版话术'];
let scripts = [];
listDir('scripts').forEach(f => {
  parseEntities(f, SC_SECS).forEach(e => {
    const d = e.data;
    if (!d.id) return;
    scripts.push({
      id: d.id, scene_name: clean(d.scene_name), category: clean(d.category),
      applicable: clean(d.applicable),
      is_general: String(d.is_general) === 'true',
      hot_level: Number(d.hot_level || 0), keywords: ids(d.keywords),
      law_ids: extractLawRefs([clean(d.applicable), clean(d['§电话版话术']), clean(d['§书面版话术']), clean(d.scene_name)].join(' '), LAW_NAME_MAP),
      phone_script: clean(d['§电话版话术']), written_template: clean(d['§书面版话术'])
    });
  });
});
scripts.sort((a, b) => String(a.id).localeCompare(String(b.id)));

let laws = [];
listDir('laws').forEach(f => {
  const raw = fs.readFileSync(f, 'utf8');
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  body.split(/^##\s+/m).filter(s => s.trim()).forEach(chunk => {
    const lines = chunk.split(/\r?\n/);
    const idm = lines[0].trim().match(/^(law_\w+)/);
    if (!idm) return;
    const d = {};
    const articleLines = [];
    lines.slice(1).forEach(line => {
      const item = line.match(/^-\s+(\w+):\s*(.*)$/);
      if (item) { d[item[1]] = String(item[2]).trim(); return; }
      if (/^#\s/.test(line.trim())) return; // 跳过重复的 H1 法规名
      const t = line.trim();
      if (t) articleLines.push(t);
    });
    const article = articleLines.join('\n').trim();
    laws.push({
      id: idm[1], name: clean(d.name), full_name: clean(d.full_name),
      category: ids(d.category), article, articles: sliceArticles(article)
    });
  });
});
laws.sort((a, b) => String(a.id).localeCompare(String(b.id)));

// 反向引用：法条 → 被哪些渠道/话术引用（含条文级）
const citedBy = {};
const reg = (lawRef, type, id, name) => {
  const lid = String(lawRef).split('#')[0];
  (citedBy[lid] = citedBy[lid] || []).push({ type, id, name });
};
channels.forEach(c => (c.law_ids || []).forEach(l => reg(l, 'channel', c.id, c.name)));
scripts.forEach(s => (s.law_ids || []).forEach(l => reg(l, 'script', s.id, s.scene_name)));
laws.forEach(l => { l.cited_by = citedBy[l.id] || []; });

console.log('知识库读取: 渠道 ' + channels.length + ' / 话术 ' + scripts.length + ' / 法规 ' + laws.length);

// ---------- 与现有数据对比 ----------
const existing = ['channels_part_1', 'channels_part_2', 'channels_part_3'].reduce((acc, f) => {
  try {
    const a = require('../miniprogram/detail/data/' + f + '.js');
    if (Array.isArray(a)) acc = acc.concat(a);
  } catch (e) { /* ignore */ }
  return acc;
}, []).sort((a, b) => String(a.id).localeCompare(String(b.id)));

console.log('现有分片数据: ' + existing.length + ' 条');

if (existing.length !== channels.length) {
  console.log('\n❌ 数量不一致（现有 ' + existing.length + ' / 知识库 ' + channels.length + '），终止。');
  process.exit(1);
}

const diffs = [];
existing.forEach((old, i) => {
  const cur = channels[i];
  if (!cur || old.id !== cur.id) { diffs.push({ id: old.id, field: 'id', old: old.id, cur: cur && cur.id }); return; }
  ['name', 'phone', 'website', 'regulator', 'category_l1', 'category_l2', 'category_user',
    'related_script_id', 'scope', 'precondition', 'tips'].forEach(k => {
      const a = String(old[k] || '').trim();
      const b = String(cur[k] || '').trim();
      if (a !== b) diffs.push({ id: old.id, field: k, old: a.slice(0, 45), cur: b.slice(0, 45) });
    });
  if (JSON.stringify(ids(old.law_ids)) !== JSON.stringify(ids(cur.law_ids))) {
    diffs.push({ id: old.id, field: 'law_ids', old: JSON.stringify(ids(old.law_ids)), cur: JSON.stringify(ids(cur.law_ids)) });
  }
});

if (diffs.length) {
  console.log('\n⚠️ 发现 ' + diffs.length + ' 处差异（前 15 条）:');
  diffs.slice(0, 15).forEach(d => {
    console.log('  [' + d.id + '] ' + d.field);
    console.log('      现有: ' + d.old);
    console.log('      知识库: ' + d.cur);
  });
} else {
  console.log('\n✅ 知识库与现有运行时数据完全一致');
}

if (!WRITE) { console.log('\n（校验模式，未写入）'); process.exit(0); }

// ---------- 写入 ----------
const indexFields = ['id', 'name', 'phone', 'tags', 'category_l1', 'category_l2', 'category_user',
  'category_user_l2', 'issue_types', 'related_script_id', 'channel_type', 'hot_level'];
const indexArr = channels.map((c, i) => {
  const o = {};
  indexFields.forEach(k => { o[k] = c[k]; });
  o.part_num = i < 50 ? 1 : (i < 100 ? 2 : 3);
  return o;
});

const HEAD = '// 本文件由 scripts/kb-build.js 从 kb/ 自动生成，请勿手工编辑\n';
const toJs = arr => HEAD + 'module.exports = ' + JSON.stringify(arr, null, 2) + ';\n';

const oldById = {};
existing.forEach(o => { oldById[o.id] = o; });
// 保留 kb 未覆盖的扩展字段（effect_rating / materials 等），避免信息丢失
const merge = arr => arr.map(n => Object.assign({}, oldById[n.id] || {}, n));

fs.writeFileSync(path.join(__dirname, '../miniprogram/data/channels_index.js'), toJs(indexArr), 'utf8');
['channels_part_1', 'channels_part_2', 'channels_part_3'].forEach((f, i) => {
  const slice = channels.slice(i * 50, i * 50 + 50);
  fs.writeFileSync(path.join(__dirname, '../miniprogram/detail/data/' + f + '.js'), toJs(merge(slice)), 'utf8');
});
fs.writeFileSync(path.join(__dirname, '../miniprogram/data/scripts.js'), toJs(scripts), 'utf8');
fs.writeFileSync(path.join(__dirname, '../miniprogram/detail/data/laws.js'), toJs(laws), 'utf8');

console.log('\n✅ 已生成:');
console.log('   channels_index.js (' + indexArr.length + ')');
console.log('   channels_part_1/2/3.js (50/50/' + channels.slice(100).length + ')');
console.log('   scripts.js (' + scripts.length + ') | laws.js (' + laws.length + ')');
