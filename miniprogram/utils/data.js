// utils/data.js
// 数据管理（分片加载 + 内存缓存 + 按需查询）
// 设计目标：支持扩展到几千条数据，单文件不超过500KB，启动速度快

// 数据缓存
let channelIndex = null;      // 轻量索引（启动时加载）
let channelParts = {};        // 已加载的分片缓存 {part_num: [channels]}
let scriptsData = null;
let lawsData = null;
let categoriesData = null;
let configData = null;
let shardConfig = null;       // 分片配置

/**
 * 初始化：加载索引和轻量数据（启动时调用，速度快）
 */
function loadAllData() {
  if (channelIndex && scriptsData) return;

  // 1. 加载渠道索引（轻量，约50-100KB）
  try {
    channelIndex = require('../data/channels_index.js');
  } catch (e) {
    console.warn('[data] 渠道索引不存在，回退到完整数据模式:', e.message);
    channelIndex = null;
  }

  // 2. 加载分片配置
  try {
    shardConfig = require('../data/channels_config.js');
  } catch (e) {
    shardConfig = null;
  }

  // 3. 如果索引不存在，回退到完整数据模式（兼容旧版本）
  if (!channelIndex) {
    try {
      const fullData = require('../data/channels.js');
      // 将完整数据转换为索引格式
      channelIndex = fullData.map(c => ({
        id: c.id,
        name: c.name,
        category_l1: c.category_l1,
        category_l2: c.category_l2,
        tags: c.tags || [],
        hot_level: c.hot_level || 0,
        phone: c.phone || '',
        part_num: 0,
        _full: c  // 缓存完整数据
      }));
      // 同时缓存完整数据到part 0
      channelParts[0] = fullData;
    } catch (e) {
      console.error('[data] 加载渠道数据失败:', e);
      channelIndex = [];
    }
  }

  // 4. 加载话术（数量少，直接加载完整数据）
  try {
    scriptsData = require('../data/scripts.js');
  } catch (e) {
    console.error('[data] 加载话术失败:', e);
    scriptsData = [];
  }

  // 5. 加载其他轻量数据
  try { lawsData = require('../data/laws.js'); } catch (e) { lawsData = []; }
  try { categoriesData = require('../data/categories.js'); } catch (e) { categoriesData = []; }
  try { configData = require('../data/config.js'); } catch (e) { configData = {}; }
}

/**
 * 按需加载指定分片（点击详情时调用）
 */
function loadPart(partNum) {
  if (channelParts[partNum]) return channelParts[partNum];
  if (partNum === 0) return channelParts[0] || [];

  try {
    const part = require(`../data/channels_part_${partNum}.js`);
    channelParts[partNum] = part;
    console.log(`[data] 已加载分片 ${partNum}，共 ${part.length} 条`);
    return part;
  } catch (e) {
    console.error(`[data] 加载分片 ${partNum} 失败:`, e);
    return [];
  }
}

/**
 * 根据ID获取渠道详细信息（按需加载分片）
 */
function getChannelById(id) {
  loadAllData();
  if (!channelIndex) return null;

  // 1. 从索引中查找
  const idxItem = channelIndex.find(c => c.id === id);
  if (!idxItem) return null;

  // 2. 如果是完整数据模式（part_num=0且有_full），直接返回
  if (idxItem._full) return idxItem._full;

  // 3. 按需加载对应分片
  const partNum = idxItem.part_num || 1;
  const part = loadPart(partNum);
  return part.find(c => c.id === id) || null;
}

/**
 * 获取所有渠道索引（用于列表展示，轻量快速）
 */
function getChannels() {
  loadAllData();
  return channelIndex || [];
}

/**
 * 获取所有话术（数量少，完整数据）
 */
function getScripts() {
  loadAllData();
  return scriptsData || [];
}

/**
 * 获取所有法律
 */
function getLaws() {
  loadAllData();
  return lawsData || [];
}

/**
 * 获取分类树（从categories.js读取用户视角分类配置）
 */
function getCategories() {
  loadAllData();
  if (categoriesData && categoriesData.length > 0) {
    return categoriesData;
  }
  // 兜底默认分类
  return [
    { name: '交通物流', icon: '🚄' },
    { name: '电信运营', icon: '📱' },
    { name: '消费购物', icon: '🛒' },
    { name: '金融保险', icon: '💰' },
    { name: '房产物业', icon: '🏠' },
    { name: '劳动用工', icon: '💼' },
    { name: '医疗教育', icon: '🏥' },
    { name: '环保城管', icon: '🌿' },
    { name: '政务纪检', icon: '⚖️' },
    { name: '网络安全', icon: '🛡️' }
  ];
}

/**
 * 获取配置
 */
function getConfig() {
  loadAllData();
  return configData || {};
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
 * 根据分类获取渠道索引（用category_user字段精准匹配，100%准确）
 */
function getChannelsByCategory(category) {
  loadAllData();
  if (!channelIndex || !category) return [];

  // 用category_user字段精准匹配
  return channelIndex.filter(c => c.category_user === category);
}

/**
 * 获取热门渠道（按hot_level排序，返回索引数据）
 */
function getHotChannels(limit = 10) {
  loadAllData();
  if (!channelIndex) return [];
  const sorted = [...channelIndex].sort((a, b) => (b.hot_level || 0) - (a.hot_level || 0));
  return sorted.slice(0, limit);
}

/**
 * 获取热门话术
 */
function getHotScripts(limit = 3) {
  loadAllData();
  return (scriptsData || []).slice(0, limit);
}

/**
 * 根据渠道ID获取关联话术
 */
function getRelatedScripts(channelId) {
  loadAllData();
  const channel = getChannelById(channelId);
  if (!channel) return [];

  const channelPhone = channel.phone || '';
  return (scriptsData || []).filter(s => {
    const sceneName = s.scene_name || '';
    const phones = ['12305', '12300', '12315', '12378', '12345', '12333'];
    for (const p of phones) {
      if (channelPhone.includes(p) && sceneName.includes(p)) return true;
    }
    return false;
  });
}

/**
 * 根据话术ID获取关联渠道
 */
function getRelatedChannels(scriptId) {
  loadAllData();
  const script = scriptsData.find(s => s.id === scriptId);
  if (!script || !channelIndex) return [];

  const sceneName = script.scene_name || '';
  return channelIndex.filter(c => {
    const phone = c.phone || '';
    const phones = ['12305', '12300', '12315', '12378', '12345', '12333', '96110', '12321'];
    for (const p of phones) {
      if (phone.includes(p) && sceneName.includes(p)) return true;
    }
    return false;
  });
}

/**
 * 搜索渠道（用索引数据，轻量快速）
 */
function searchChannels(keyword) {
  loadAllData();
  if (!keyword || !channelIndex) return channelIndex || [];
  const kw = keyword.toLowerCase();
  return channelIndex.filter(c =>
    (c.name && c.name.toLowerCase().includes(kw)) ||
    (c.phone && c.phone.toLowerCase().includes(kw)) ||
    (c.tags && c.tags.some(t => t.toLowerCase().includes(kw)))
  );
}

/**
 * 搜索话术
 */
function searchScripts(keyword) {
  loadAllData();
  if (!keyword) return scriptsData || [];
  const kw = keyword.toLowerCase();
  return (scriptsData || []).filter(s =>
    (s.scene_name && s.scene_name.toLowerCase().includes(kw)) ||
    (s.applicable && s.applicable.toLowerCase().includes(kw)) ||
    (s.keywords && s.keywords.some(k => k.toLowerCase().includes(kw)))
  );
}

/**
 * 获取话术的电话版内容
 */
function getScriptPhoneContent(script) {
  return script.phone_script || script.phone_version || '';
}

/**
 * 获取话术的书面版内容（组合多个字段）
 */
function getScriptWrittenContent(script) {
  const parts = [];
  if (script.written_complainant) parts.push('投诉人：' + script.written_complainant);
  if (script.written_respondent) parts.push('被投诉人：' + script.written_respondent);
  if (script.written_request) parts.push('投诉请求：\n' + script.written_request);
  if (script.written_facts) parts.push('事实与理由：\n' + script.written_facts);
  if (script.written_evidence) parts.push('证据清单：\n' + script.written_evidence);
  return parts.join('\n\n');
}

/**
 * 获取分片统计信息（用于调试）
 */
function getShardStats() {
  loadAllData();
  return {
    total: channelIndex ? channelIndex.length : 0,
    loadedParts: Object.keys(channelParts).length,
    partConfig: shardConfig
  };
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
  searchChannels,
  searchScripts,
  getScriptPhoneContent,
  getScriptWrittenContent,
  getShardStats,
  loadPart
};
