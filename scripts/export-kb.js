/**
 * 导出 AI 友好的知识库（Knowledge Base）
 *
 * 目的：把散落在多个模块里的数据（渠道 / 话术 / 法律法规 / 分类）合并成一份
 *      结构统一、带 schema 版本、带显式关系表的 JSON，供：
 *      - 后续接入 AI（RAG / 向量库 / 大模型）直接消费
 *      - 数据备份与跨端复用
 *
 * 用法：node scripts/export-kb.js
 * 输出：data/knowledge-base.json（不参与小程序打包，无包体影响）
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../data/knowledge-base.json');

// 需要 data.loadAllData() 初始化
const data = require('../miniprogram/utils/data.js');
data.loadAllData();

const channels = data.getChannels() || [];
const scripts = data.getScripts() || [];
// 法律法规在 detail 分包，主包 data.getLaws() 取不到；导出脚本运行在 node 环境，可直接 require
let laws = [];
try { laws = require('../miniprogram/detail/data/laws.js') || []; } catch (e) { laws = []; }

// ---- 1. 实体（精简字段，去掉运行时冗余）----
const channelEntities = channels.map(c => ({
  id: c.id,
  type: 'channel',
  name: c.name || '',
  phone: c.phone || '',
  website: c.website || '',
  regulator: c.regulator || '',
  scope: c.scope || '',
  precondition: c.precondition || '',
  tips: c.tips || '',
  category_l1: c.category_l1 || '',
  category_l2: c.category_l2 || '',
  category_user: c.category_user || '',
  issue_types: c.issue_types || [],
  tags: c.tags || [],
  channel_type: c.channel_type || '',
  hot_level: typeof c.hot_level === 'number' ? c.hot_level : 0
}));

const scriptEntities = scripts.map(s => ({
  id: s.id,
  type: 'script',
  scene_name: s.scene_name || '',
  applicable: s.applicable || '',
  category: s.category || '',
  keywords: s.keywords || [],
  is_general: !!s.is_general,
  hot_level: typeof s.hot_level === 'number' ? s.hot_level : 0,
  // 正文较长，AI 场景按需取用
  phone_script: s.phone_script || '',
  written_template: s.written_template || ''
}));

const lawEntities = laws.map(l => ({
  id: l.id,
  type: 'law',
  name: l.name || '',
  full_name: l.full_name || '',
  category: l.category || [],
  // 条文很长，这里只存摘要，完整条文可回查 detail/data/laws.js
  article_excerpt: String(l.article || l.content || '').slice(0, 300)
}));

// ---- 2. 显式关系表（知识库的核心：渠道 ↔ 话术 ↔ 法条）----
const relations = [];

// 渠道 → 话术
channels.forEach(c => {
  if (c.related_script_id) {
    relations.push({
      from: c.id, to: c.related_script_id, rel: 'has_script'
    });
  }
});

// 话术 → 渠道（反向也建一份，便于双向检索）
scripts.forEach(s => {
  if (s.related_channel_id) {
    relations.push({
      from: s.id, to: s.related_channel_id, rel: 'belongs_to_channel'
    });
  }
});

// 渠道 → 法条
channels.forEach(c => {
  const ids = c.law_ids || (c.law_id ? [c.law_id] : []);
  ids.forEach(id => relations.push({ from: c.id, to: id, rel: 'cites_law' }));
});

// ---- 3. 分类体系 ----
const categories = {
  category_l1: [...new Set(channels.map(c => c.category_l1).filter(Boolean))],
  category_user: [...new Set(channels.map(c => c.category_user).filter(Boolean))],
  issue_types: [...new Set([].concat(...channels.map(c => c.issue_types || [])))]
};

const kb = {
  schema_version: '1.0.0',
  generated_at: new Date().toISOString(),
  source: 'source/*.docx（原始文档）→ miniprogram/data/*.js（运行时数据）→ 本文件（AI 知识库）',
  stats: {
    channels: channelEntities.length,
    scripts: scriptEntities.length,
    laws: lawEntities.length,
    relations: relations.length
  },
  entities: [...channelEntities, ...scriptEntities, ...lawEntities],
  relations,
  categories
};

fs.writeFileSync(OUT, JSON.stringify(kb, null, 2), 'utf8');

const size = fs.statSync(OUT).size;
console.log('✅ 已导出知识库 → data/knowledge-base.json (' + Math.round(size / 1024) + 'KB)');
console.log('   实体: ' + kb.entities.length + '（渠道 ' + kb.stats.channels +
  ' / 话术 ' + kb.stats.scripts + ' / 法条 ' + kb.stats.laws + '）');
console.log('   关系: ' + kb.relations.length + ' 条');
console.log('   分类: ' + kb.categories.category_l1.length + ' 个一级分类、' +
  kb.categories.category_user.length + ' 个用户分类、' +
  kb.categories.issue_types.length + ' 种问题类型');
