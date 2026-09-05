// utils/data.js
// 数据管理（加载、查询、分类）

let channelsData = null;
let scriptsData = null;
let lawsData = null;
let categoriesData = null;
let configData = null;

/**
 * 加载所有数据
 */
function loadAllData() {
  if (channelsData && scriptsData && lawsData && categoriesData) return;

  try {
    const channels = require('../data/channels.json');
    channelsData = channels.channels || channels || [];
  } catch (e) { channelsData = []; }

  try {
    const scripts = require('../data/scripts.json');
    scriptsData = scripts.scripts || scripts || [];
  } catch (e) { scriptsData = []; }

  try {
    const laws = require('../data/laws.json');
    lawsData = laws.laws || laws || [];
  } catch (e) { lawsData = []; }

  try {
    categoriesData = require('../data/categories.json');
  } catch (e) { categoriesData = []; }

  try {
    configData = require('../data/config.json');
  } catch (e) { configData = {}; }
}

/**
 * 获取所有渠道
 */
function getChannels() {
  loadAllData();
  return channelsData;
}

/**
 * 获取所有话术
 */
function getScripts() {
  loadAllData();
  return scriptsData;
}

/**
 * 获取所有法律
 */
function getLaws() {
  loadAllData();
  return lawsData;
}

/**
 * 获取分类树
 */
function getCategories() {
  loadAllData();
  return categoriesData;
}

/**
 * 获取配置
 */
function getConfig() {
  loadAllData();
  return configData;
}

/**
 * 根据ID获取渠道
 */
function getChannelById(id) {
  loadAllData();
  return channelsData.find(c => c.id === id);
}

/**
 * 根据ID获取话术
 */
function getScriptById(id) {
  loadAllData();
  return scriptsData.find(s => s.id === id);
}

/**
 * 根据ID获取法律
 */
function getLawById(id) {
  loadAllData();
  return lawsData.find(l => l.id === id);
}

/**
 * 根据分类获取渠道
 */
function getChannelsByCategory(category) {
  loadAllData();
  return channelsData.filter(c => {
    const cats = c.category || c.categories || [];
    return cats.includes(category) || c.primary_category === category;
  });
}

/**
 * 获取热门渠道（按使用频率排序，取前N个）
 */
function getHotChannels(limit = 10) {
  loadAllData();
  // 简化：按ID排序取前N个，实际应按使用频率
  return channelsData.slice(0, limit);
}

/**
 * 获取热门话术
 */
function getHotScripts(limit = 3) {
  loadAllData();
  return scriptsData.slice(0, limit);
}

/**
 * 根据渠道ID获取关联话术
 */
function getRelatedScripts(channelId) {
  loadAllData();
  return scriptsData.filter(s => {
    const channels = s.channels || s.related_channels || [];
    return channels.includes(channelId);
  });
}

/**
 * 根据话术ID获取关联渠道
 */
function getRelatedChannels(scriptId) {
  loadAllData();
  const script = scriptsData.find(s => s.id === scriptId);
  if (!script) return [];
  const channelIds = script.channels || script.related_channels || [];
  return channelsData.filter(c => channelIds.includes(c.id));
}

/**
 * 根据法律ID获取关联渠道
 */
function getChannelsByLaw(lawId) {
  loadAllData();
  return channelsData.filter(c => {
    const laws = c.legal_basis || c.laws || [];
    return laws.includes(lawId) || (c.legal_basis_ids && c.legal_basis_ids.includes(lawId));
  });
}

/**
 * 搜索渠道（简单名称匹配）
 */
function searchChannels(keyword) {
  loadAllData();
  if (!keyword) return channelsData;
  const kw = keyword.toLowerCase();
  return channelsData.filter(c =>
    (c.name && c.name.toLowerCase().includes(kw)) ||
    (c.desc && c.desc.toLowerCase().includes(kw)) ||
    (c.tags && c.tags.some(t => t.toLowerCase().includes(kw)))
  );
}

/**
 * 搜索话术
 */
function searchScripts(keyword) {
  loadAllData();
  if (!keyword) return scriptsData;
  const kw = keyword.toLowerCase();
  return scriptsData.filter(s =>
    (s.name && s.name.toLowerCase().includes(kw)) ||
    (s.desc && s.desc.toLowerCase().includes(kw)) ||
    (s.tags && s.tags.some(t => t.toLowerCase().includes(kw)))
  );
}

module.exports = {
  loadAllData,
  getChannels,
  getScripts,
  getLaws,
  getCategories,
  getConfig,
  getChannelById,
  getScriptById,
  getLawById,
  getChannelsByCategory,
  getHotChannels,
  getHotScripts,
  getRelatedScripts,
  getRelatedChannels,
  getChannelsByLaw,
  searchChannels,
  searchScripts
};
