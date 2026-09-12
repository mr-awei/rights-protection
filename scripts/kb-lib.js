/**
 * kb 解析共享库（kb-build.js 与 kb-split.js 共用，避免解析逻辑重复。
 * md 格式变更只改这里。
 */
const fs = require('fs');
const path = require('path');

const KB = path.join(__dirname, '../kb');
const SECTIONS = ['适用范围', '前置条件', '实用提示', '电话版话术', '书面版话术'];

function listMd(dir) {
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

function parseEntities(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const meta = {};
  if (fm) {
    fm[1].split(/\r?\n/).forEach(line => {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (kv) meta[kv[1]] = String(kv[2]).trim();
    });
  }
  const body = fm ? raw.slice(fm[0].length) : raw;
  return body.split(/^##\s+/m).filter(s => s.trim()).map(chunk => {
    const lines = chunk.split(/\r?\n/);
    const heading = lines[0].trim();
    const data = {};
    let cur = null;
    lines.slice(1).forEach(line => {
      const item = line.match(/^-\s+(\w+):\s*(.*)$/);
      if (item) { data[item[1]] = String(item[2]).trim(); cur = null; return; }
      const sec = line.trim().match(/^\*\*(.+?)\*\*\s*$/);
      if (sec && SECTIONS.includes(sec[1])) { cur = sec[1]; data['§' + sec[1]] = []; return; }
      if (cur) { const t = line.trim(); if (t) data['§' + cur].push(t); }
    });
    SECTIONS.forEach(s => { data['§' + s] = (data['§' + s] || []).join('\n').trim(); });
    return { heading, data, meta, file };
  });
}

function ids(v) {
  if (Array.isArray(v)) return v.filter(x => x !== undefined && x !== null && String(x).trim() !== '');
  if (typeof v === 'string' && v.trim()) return v.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  return [];
}

function clean(v) {
  const s = String(v || '').trim();
  return (s === '（无）' || s === '（待补充）') ? '' : s;
}

// 生成分组文件内容（文件头 + 实体分节）
function buildGroupFile(meta, entities, fields, sections) {
  const parts = ['---'];
  Object.keys(meta).forEach(k => { parts.push(k + ': ' + meta[k]); });
  parts.push('count: ' + entities.length);
  parts.push('---', '');
  const title = [meta.category_l1, meta.category_l2].filter(Boolean).join(' · ') || '渠道';
  parts.push('# ' + title + '（' + entities.length + ' 条）', '');
  entities.forEach(e => {
    const d = e.data;
    parts.push('## ' + (d.id || '') + ' · ' + (d.name || ''));
    parts.push('');
    fields.forEach(k => { if (d[k] !== undefined) parts.push('- ' + k + ': ' + String(d[k]).trim()); });
    parts.push('');
    (sections || ['适用范围', '前置条件', '实用提示']).forEach(s => {
      parts.push('**' + s + '**', '');
      parts.push(d['§' + s] || '（无）');
      parts.push('');
    });
  });
  return parts.join('\n');
}

module.exports = { KB, SECTIONS, listMd, parseEntities, ids, clean, buildGroupFile };
