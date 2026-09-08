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
let hotlineChangeData = null;  // 热线变更数据
let followupScheduleData = null; // 跟进时间表数据
let enterpriseQueryData = null;  // 企业查询数据
let generalTemplateData = null;  // 通用投诉信模板数据
let platformsData = null;        // 高层级诉求平台数据（独立表）

/**
 * 初始化：加载索引和轻量数据（启动时调用，速度快）
 * 包含索引自动同步机制：检测到索引与分片不一致时，自动从分片在内存中重建索引
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

  // 3. 索引自动同步检测：检查索引是否包含必要字段
  // 如果索引缺少issue_types等新字段，说明索引文件过时，自动从分片重建
  if (channelIndex && channelIndex.length > 0) {
    const firstItem = channelIndex[0];
    const indexNeedsRebuild = !firstItem.issue_types || 
                               !firstItem.category_user_l2 ||
                               !firstItem.related_script_id;
    
    if (indexNeedsRebuild) {
      console.warn('[data] 检测到索引文件缺少必要字段（issue_types/category_user_l2等），自动从分片重建索引...');
      try {
        const rebuiltIndex = [];
        const numParts = (shardConfig && shardConfig.num_parts) || 3;
        for (let i = 1; i <= numParts; i++) {
          try {
            const part = require(`../data/channels_part_${i}.js`);
            channelParts[i] = part;
            part.forEach(c => {
              rebuiltIndex.push({
                id: c.id,
                name: c.name,
                phone: c.phone || '',
                tags: c.tags || [],
                category_l1: c.category_l1 || '',
                category_l2: c.category_l2 || '',
                category_user: c.category_user || '',
                category_user_l2: c.category_user_l2 || '',
                issue_types: c.issue_types || [],
                related_script_id: c.related_script_id || '',
                channel_type: c.channel_type || 'official',
                hot_level: c.hot_level || 0,
                part_num: i
              });
            });
          } catch (e) {
            console.warn('[data] 加载分片' + i + '失败:', e.message);
          }
        }
        if (rebuiltIndex.length > 0) {
          channelIndex = rebuiltIndex;

        }
      } catch (e) {
        console.error('[data] 自动重建索引失败:', e);
      }
    }
  }

  // 4. 如果索引不存在，回退到完整数据模式（兼容旧版本）
  if (!channelIndex) {
    try {
      const fullData = require('../data/channels.js');
      // 将完整数据转换为索引格式
      channelIndex = fullData.map(c => ({
        id: c.id,
        name: c.name,
        category_l1: c.category_l1,
        category_l2: c.category_l2,
        category_user_l2: c.category_user_l2 || c.category_l2,
        issue_types: c.issue_types || [],
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
  try { hotlineChangeData = require('../data/hotline_change.js'); } catch (e) { hotlineChangeData = []; }
  try { followupScheduleData = require('../data/followup_schedule.js'); } catch (e) { followupScheduleData = []; }
  try { enterpriseQueryData = require('../data/enterprise_query.js'); } catch (e) { enterpriseQueryData = []; }
  try { generalTemplateData = require('../data/general_template.js'); } catch (e) { generalTemplateData = null; }
  try { platformsData = require('../data/platforms.js'); } catch (e) { platformsData = []; }
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
 * 从索引中获取渠道基本信息（轻量，不加载分片，用于预加载和快速判断）
 */
function getChannelIndexItem(id) {
  loadAllData();
  if (!channelIndex) return null;
  return channelIndex.find(c => c.id === id) || null;
}

/**
 * 预加载渠道分片（在列表页点击时调用，跳转后直接使用缓存）
 */
function preloadChannelPart(id) {
  const idxItem = getChannelIndexItem(id);
  if (!idxItem) return false;
  const partNum = idxItem.part_num || 1;
  if (partNum > 0) {
    loadPart(partNum);
    return true;
  }
  return false;
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
    { name: '交通物流', icon: 'icon-train' },
    { name: '电信运营', icon: 'icon-mobile' },
    { name: '消费购物', icon: 'icon-shop' },
    { name: '金融保险', icon: 'icon-coin' },
    { name: '房产物业', icon: 'icon-home' },
    { name: '劳动用工', icon: 'icon-briefcase' },
    { name: '医疗教育', icon: 'icon-medical' },
    { name: '环保城管', icon: 'icon-leaf' },
    { name: '政务纪检', icon: 'icon-law' },
    { name: '网络安全', icon: 'icon-shield' }
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

  // 三级匹配：先匹配category_l2（二级分类），再匹配category_l1（一级分类），最后匹配category_user（兼容旧字段）
  return channelIndex.filter(c => {
    if (c.category_l2 === category) return true;
    if (c.category_l1 === category) return true;
    if (c.category_user === category) return true;
    if (c.category_user_l2 === category) return true;
    return false;
  });
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
 * 优先使用显式关联字段，降级到电话号码匹配
 */
function getRelatedScripts(channelId) {
  loadAllData();
  const channel = getChannelById(channelId);
  if (!channel) return [];

  // 1. 优先使用渠道的 related_script_id 显式关联
  if (channel.related_script_id) {
    const ids = Array.isArray(channel.related_script_id)
      ? channel.related_script_id
      : String(channel.related_script_id).split(',').map(s => s.trim()).filter(Boolean);
    const explicit = (scriptsData || []).filter(s => ids.includes(s.id));
    if (explicit.length > 0) return explicit;
  }

  // 2. 其次使用话术的 related_channel_id 显式关联
  const byScriptField = (scriptsData || []).filter(s => {
    if (!s.related_channel_id) return false;
    const ids = String(s.related_channel_id).split(',').map(x => x.trim()).filter(Boolean);
    return ids.includes(channelId);
  });
  if (byScriptField.length > 0) return byScriptField;

  // 3. 降级：电话号码模糊匹配
  const channelPhone = channel.phone || '';
  const byPhone = (scriptsData || []).filter(s => {
    const sceneName = s.scene_name || '';
    const phones = ['12305', '12300', '12315', '12378', '12345', '12333'];
    for (const p of phones) {
      if (channelPhone.includes(p) && sceneName.includes(p)) return true;
    }
    return false;
  });
  if (byPhone.length > 0) return byPhone;

  // 4. 兜底：返回通用话术（适用于没有专门话术的渠道）
  const generalScripts = (scriptsData || []).filter(s => s.is_general === true);
  return generalScripts;
}

/**
 * 根据话术ID获取关联渠道
 * 优先使用显式关联字段，降级到电话号码匹配
 */
function getRelatedChannels(scriptId) {
  loadAllData();
  const script = scriptsData.find(s => s.id === scriptId);
  if (!script || !channelIndex) return [];

  // 1. 优先使用话术的 related_channel_id 显式关联
  if (script.related_channel_id) {
    const ids = String(script.related_channel_id).split(',').map(s => s.trim()).filter(Boolean);
    const explicit = channelIndex.filter(c => ids.includes(c.id));
    if (explicit.length > 0) return explicit;
  }

  // 2. 其次使用渠道的 related_script_id 显式关联
  const byChannelField = channelIndex.filter(c => {
    if (!c.related_script_id) return false;
    const ids = Array.isArray(c.related_script_id)
      ? c.related_script_id
      : String(c.related_script_id).split(',').map(x => x.trim()).filter(Boolean);
    return ids.includes(scriptId);
  });
  if (byChannelField.length > 0) return byChannelField;

  // 3. 降级：电话号码模糊匹配
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

/**
 * 获取热线变更数据
 */
function getHotlineChanges() {
  loadAllData();
  return hotlineChangeData || [];
}

/**
 * 获取跟进时间表数据
 */
function getFollowupSchedule() {
  loadAllData();
  return followupScheduleData || [];
}

/**
 * 获取企业查询数据
 */
function getEnterpriseQueries() {
  loadAllData();
  return enterpriseQueryData || [];
}

/**
 * 获取通用投诉信模板
 */
function getGeneralTemplate() {
  loadAllData();
  return generalTemplateData;
}

/**
 * 获取所有高层级诉求平台
 */
function getPlatforms() {
  loadAllData();
  return platformsData || [];
}

/**
 * 根据ID获取高层级平台
 */
function getPlatformById(id) {
  loadAllData();
  if (!platformsData) return null;
  return platformsData.find(p => p.id === id) || null;
}

/**
 * 搜索高层级平台
 */
function searchPlatforms(keyword) {
  loadAllData();
  if (!keyword || !platformsData) return platformsData || [];
  const kw = keyword.toLowerCase();
  return platformsData.filter(p =>
    (p.name && p.name.toLowerCase().includes(kw)) ||
    (p.phone && p.phone.toLowerCase().includes(kw)) ||
    (p.scope && p.scope.toLowerCase().includes(kw)) ||
    (p.tags && p.tags.some(t => t.toLowerCase().includes(kw))) ||
    (p.platform_category && p.platform_category.toLowerCase().includes(kw))
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
  getChannelIndexItem,
  preloadChannelPart,
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
  loadPart,
  getHotlineChanges,
  getFollowupSchedule,
  getEnterpriseQueries,
  getGeneralTemplate,
  getPlatforms,
  getPlatformById,
  searchPlatforms,
  normalizeChannel,
  getChannelCategoryL1,
  getChannelUserCategory,
  getCategoryL1List,
  getUserCategoryList,
  getChannelsByCategoryL1,
  CATEGORY_L1_TO_USER
};

// ============================================================
// 分类体系统一 + 数据字段规范（兼容层）
// 说明：现有数据使用 category_user（用户视角，10个分类），
//       PRD定义使用 category_l1/category_l2（5大分类）。
//       本兼容层同时支持两种字段，未来可平滑迁移。
// ============================================================

const CATEGORY_L1_TO_USER = {
  '消费维权': ['消费购物', '金融保险', '交通物流'],
  '公共服务': ['电信运营', '房产物业', '医疗教育', '环保城管'],
  '劳动保障': ['劳动用工'],
  '政务监督': ['政务纪检', '网络安全'],
  '其他': []
};

const USER_TO_CATEGORY_L1 = {};
Object.keys(CATEGORY_L1_TO_USER).forEach(function(l1) {
  CATEGORY_L1_TO_USER[l1].forEach(function(userCat) {
    USER_TO_CATEGORY_L1[userCat] = l1;
  });
});

function normalizeChannel(channel) {
  if (!channel) return null;
  const normalized = Object.assign({}, channel);
  const userCat = channel.category_user || channel.category_l1 || '';
  const userCatL2 = channel.category_user_l2 || channel.category_l2 || '';
  normalized.category_user = userCat;
  normalized.category_user_l2 = userCatL2;
  normalized.category_l1 = channel.category_l1 || USER_TO_CATEGORY_L1[userCat] || '其他';
  normalized.category_l2 = channel.category_l2 || userCatL2;
  normalized.name = channel.name || '';
  normalized.phone = channel.phone || '';
  normalized.website = channel.website || '';
  normalized.scope = channel.scope || channel.description || '';
  normalized.legal_basis = channel.legal_basis || '';
  normalized.source = channel.source || '';
  normalized.tags = channel.tags || [];
  return normalized;
}

function getChannelCategoryL1(channel) {
  if (!channel) return '其他';
  if (channel.category_l1) return channel.category_l1;
  const userCat = channel.category_user || '';
  return USER_TO_CATEGORY_L1[userCat] || '其他';
}

function getChannelUserCategory(channel) {
  if (!channel) return '';
  return channel.category_user || channel.category_l1 || '';
}

function getCategoryL1List() {
  return Object.keys(CATEGORY_L1_TO_USER);
}

function getUserCategoryList() {
  if (!categoriesData) return [];
  return categoriesData.map(function(c) { return c.name; });
}

function getChannelsByCategoryL1(categoryL1) {
  loadAllData();
  const userCats = CATEGORY_L1_TO_USER[categoryL1] || [];
  if (!channelIndex) return [];
  return channelIndex.filter(function(c) {
    const userCat = c.category_user || c.category_l1 || '';
    return userCats.indexOf(userCat) > -1;
  });
}
