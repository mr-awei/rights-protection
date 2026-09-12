/**
 * 搜索索引构建：kb 生成的运行时数据 → 瘦身 BM25 倒排索引 + 联想 Trie
 *
 * 前置：先跑 `node scripts/kb-build.js --write` 生成 miniprogram/data/*.js 与 detail/data/*.js
 * 产物（放到 miniprogram/detail/data/，主包不可跨包引用，符合瘦身目标）：
 *   - search_index.json  BM25 倒排（渠道/话术/平台/法条/条文 统一打分）
 *   - suggest_trie.json  联想前缀树（渠道名/话术场景/法条名）
 *
 * 用法：node scripts/build-search-index.js
 */
const fs = require('fs');
const path = require('path');

const D = path.join(__dirname, '../miniprogram/detail/data');
const M = path.join(__dirname, '../miniprogram/data');
const load = p => require(path.join(p));

// ---------- 读取已生成的运行时数据 ----------
const idx = load(M + '/channels_index.js');
const parts = ['channels_part_1', 'channels_part_2', 'channels_part_3']
  .map(f => load(D + '/' + f + '.js'))
  .reduce((a, b) => a.concat(b), []);
const chMap = {};
parts.forEach(c => { chMap[c.id] = c; });
const channels = idx.map(c => Object.assign({}, chMap[c.id] || {}, c));
const scripts = load(M + '/scripts.js');
const laws = load(D + '/laws.js');
let platforms = [];
try { platforms = load(D + '/platforms.js'); } catch (e) { /* ignore */ }

// ---------- 中文 bigram 分词（无分词库时的轻量方案） ----------
function tokenize(text) {
  if (!text) return [];
  const t = String(text).toLowerCase();
  const tokens = [];
  const en = t.match(/[a-z0-9]+/g);
  if (en) tokens.push(...en);
  const cn = t.replace(/[a-z0-9\s]/g, '');
  if (cn.length === 1) tokens.push(cn);
  for (let i = 0; i < cn.length - 1; i++) tokens.push(cn[i] + cn[i + 1]);
  return tokens;
}

// ---------- 组装文档集合 ----------
const docs = [];
channels.forEach(c => docs.push({
  id: c.id, type: 'channel', title: c.name, phone: c.phone,
  body: [c.name, c.phone, (c.tags || []).join(' '), c.category_user, c.category_l2, c.category_l1,
    c.scope, c.precondition, c.tips, (c.law_ids || []).join(' ')].filter(Boolean).join(' ')
}));
scripts.forEach(s => docs.push({
  id: s.id, type: 'script', title: s.scene_name, phone: '',
  body: [s.scene_name, s.applicable, (s.keywords || []).join(' '), s.phone_script, s.written_template,
    (s.law_ids || []).join(' ')].filter(Boolean).join(' ')
}));
platforms.forEach(p => docs.push({
  id: p.id, type: 'platform', title: p.name, phone: p.phone,
  body: [p.name, p.phone, p.scope, (p.tags || []).join(' '), p.platform_category].filter(Boolean).join(' ')
}));
laws.forEach(l => {
  docs.push({
    id: l.id, type: 'law', title: l.name, phone: '',
    body: [l.name, l.full_name, (l.category || []).join(' '),
      (l.articles || []).map(a => a.content).join(' '),
      (l.cited_by || []).map(x => x.name).join(' ')].filter(Boolean).join(' ')
  });
  (l.articles || []).forEach(a => docs.push({
    id: l.id + '#' + a.no, type: 'law_article', title: l.name + a.no, law_id: l.id, phone: '', body: a.content
  }));
});

// ---------- BM25 倒排 ----------
const N = docs.length;
const termDocs = {};
docs.forEach((d, i) => {
  const toks = tokenize(d.body);
  d._len = toks.length;
  const tf = {};
  toks.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  Object.keys(tf).forEach(t => { (termDocs[t] = termDocs[t] || []).push({ i, tf: tf[t] }); });
});
const avgdl = docs.reduce((s, d) => s + d._len, 0) / N;
const terms = {};
Object.keys(termDocs).forEach(t => {
  const post = termDocs[t];
  const df = post.length;
  const idf = Math.log((N - df + 0.5) / (df + 0.5)) + 1;
  terms[t] = { idf: +idf.toFixed(4), d: post.map(p => [p.i, p.tf]) };
});
const metaDocs = docs.map(d => {
  const o = { id: d.id, type: d.type, title: d.title, len: d._len };
  if (d.phone) o.phone = d.phone;
  if (d.law_id) o.law_id = d.law_id;
  return o;
});
const index = { version: 1, k1: 1.5, b: 0.75, avgdl: +avgdl.toFixed(2), N, docs: metaDocs, terms };
const indexFile = path.join(D, 'search_index.json');
fs.writeFileSync(indexFile, JSON.stringify(index));
console.log('search_index.json: docs=' + N + ' terms=' + Object.keys(terms).length +
  ' avgdl=' + index.avgdl + ' size=' + (fs.statSync(indexFile).size / 1024).toFixed(1) + 'KB');

// ---------- 联想 Trie ----------
const candidates = [];
channels.forEach(c => candidates.push({ type: 'channel', id: c.id, name: c.name, phone: c.phone || '' }));
scripts.forEach(s => candidates.push({ type: 'script', id: s.id, name: s.scene_name, phone: '' }));
laws.forEach(l => candidates.push({ type: 'law', id: l.id, name: l.name, phone: '' }));
const trie = {};
candidates.forEach(c => {
  if (!c.name) return;
  let node = trie;
  for (const ch of c.name) node = node[ch] = node[ch] || {};
  (node._ = node._ || []).push(c.id);
});
const candDocs = {};
candidates.forEach(c => { candDocs[c.id] = c; });
const trieFile = path.join(D, 'suggest_trie.json');
fs.writeFileSync(trieFile, JSON.stringify({ trie, docs: candDocs }));
console.log('suggest_trie.json: candidates=' + candidates.length +
  ' size=' + (fs.statSync(trieFile).size / 1024).toFixed(1) + 'KB');
