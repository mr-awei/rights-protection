// utils/data.js
// 数据管理（加载、查询、分类）

// 预设分类与关键词映射（用于分类页匹配渠道）
const CATEGORY_KEYWORDS = {
  '快递物流': ['快递', '邮政', '物流', '包裹', '12305'],
  '电信运营': ['电信', '通信', '话费', '流量', '宽带', '运营商', '12300', '工信部'],
  '消费购物': ['消费', '市场监管', '12315', '工商', '质量', '食品', '药品', '价格'],
  '金融保险': ['金融', '银行', '保险', '证券', '12378', '12363', '银保监', '证监会'],
  '房产物业': ['物业', '房产', '住建', '12345', '供水', '燃气', '供热', '房屋'],
  '劳动用工': ['劳动', '人社', '12333', '欠薪', '工资', '社保', '公积金'],
  '医疗教育': ['医疗', '卫生', '12320', '教育', '学校', '培训', '医院'],
  '环保城管': ['环保', '12369', '城管', '污染', '噪音', '噪声'],
  '政务纪检': ['政务', '12345', '纪检', '12388', '信访', '督查', '监察'],
  '网络安全': ['反诈', '96110', '110', '网络', '12321', '诈骗', '个人信息']
};

let channelsData = null;
let scriptsData = null;
let lawsData = null;
let categoriesData = null;
let configData = null;

/**
 * 加载所有数据
 */
function loadAllData() {
  if (channelsData && scriptsData) return;

  try {
    channelsData = require('../data/channels.json');
  } catch (e) {
    console.error('[data] 加载channels失败:', e);
    channelsData = [];
  }

  try {
    scriptsData = require('../data/scripts.json');
  } catch (e) {
    console.error('[data] 加载scripts失败:', e);
    scriptsData = [];
  }

  try {
    lawsData = require('../data/laws.json');
  } catch (e) {
    lawsData = [];
  }

  try {
    categoriesData = require('../data/categories.json');
  } catch (e) {
    categoriesData = [];
  }

  try {
    configData = require('../data/config.json');
  } catch (e) {
    configData = {};
  }
}

/**
 * 获取所有渠道
 */
function getChannels() {
  loadAllData();
  return channelsData || [];
}

/**
 * 获取所有话术
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
 * 获取分类树
 */
function getCategories() {
  // 返回预设的10个分类
  return Object.keys(CATEGORY_KEYWORDS).map(name => ({
    name: name,
    icon: getCategoryIcon(name)
  }));
}

function getCategoryIcon(name) {
  const icons = {
    '快递物流': '📦',
    '电信运营': '📱',
    '消费购物': '🛒',
    '金融保险': '💰',
    '房产物业': '🏠',
    '劳动用工': '💼',
    '医疗教育': '🏥',
    '环保城管': '🌿',
    '政务纪检': '⚖️',
    '网络安全': '🛡️'
  };
  return icons[name] || '📋';
}

/**
 * 获取配置
 */
function getConfig() {
  loadAllData();
  return configData || {};
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
 * 根据分类获取渠道（用关键词匹配渠道名称和scope）
 */
function getChannelsByCategory(category) {
  loadAllData();
  const keywords = CATEGORY_KEYWORDS[category] || [];
  if (keywords.length === 0) return [];

  return channelsData.filter(c => {
    const name = c.name || '';
    const scope = c.scope || '';
    const tags = (c.tags || []).join(' ');
    const text = name + ' ' + scope + ' ' + tags;
    return keywords.some(kw => text.includes(kw));
  });
}

/**
 * 获取热门渠道
 */
function getHotChannels(limit = 10) {
  loadAllData();
  // 按hot_level排序，没有的按原顺序
  const sorted = [...channelsData].sort((a, b) => {
    const ha = a.hot_level || 0;
    const hb = b.hot_level || 0;
    return hb - ha;
  });
  return sorted.slice(0, limit);
}

/**
 * 获取热门话术
 */
function getHotScripts(limit = 3) {
  loadAllData();
  // 所有话术都是热门，直接返回前N条
  return scriptsData.slice(0, limit);
}

/**
 * 根据渠道ID获取关联话术
 * 由于related_channel_id字段为空，用话术名称中的关键词匹配渠道
 */
function getRelatedScripts(channelId) {
  loadAllData();
  const channel = channelsData.find(c => c.id === channelId);
  if (!channel) return [];

  const channelName = channel.name || '';
  const channelPhone = channel.phone || '';

  return scriptsData.filter(s => {
    const sceneName = s.scene_name || '';
    // 匹配话术名称中是否包含渠道电话或名称关键词
    if (channelPhone && sceneName.includes(channelPhone.replace(/[^0-9]/g, ''))) {
      return true;
    }
    // 匹配关键词
    const keywords = ['12305', '12300', '12315', '12378', '12345', '12333'];
    for (const kw of keywords) {
      if (channelPhone.includes(kw) && sceneName.includes(kw)) {
        return true;
      }
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
  if (!script) return [];

  const sceneName = script.scene_name || '';

  return channelsData.filter(c => {
    const phone = c.phone || '';
    const name = c.name || '';
    // 匹配电话
    const phones = ['12305', '12300', '12315', '12378', '12345', '12333', '96110', '12321'];
    for (const p of phones) {
      if (phone.includes(p) && sceneName.includes(p)) {
        return true;
      }
    }
    return false;
  });
}

/**
 * 根据法律ID获取关联渠道
 */
function getChannelsByLaw(lawId) {
  loadAllData();
  return channelsData.filter(c => {
    const lawIds = c.law_ids || [];
    return lawIds.includes(lawId);
  });
}

/**
 * 搜索渠道
 */
function searchChannels(keyword) {
  loadAllData();
  if (!keyword) return channelsData;
  const kw = keyword.toLowerCase();
  return channelsData.filter(c =>
    (c.name && c.name.toLowerCase().includes(kw)) ||
    (c.scope && c.scope.toLowerCase().includes(kw)) ||
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
  searchScripts,
  getScriptPhoneContent,
  getScriptWrittenContent
};
