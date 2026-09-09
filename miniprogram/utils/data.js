// utils/data.js
// 主包数据层：渠道索引、话术、分类、配置
// 说明：渠道分片(268KB)、laws(148KB)、platforms(24KB) 已下沉到 detail 分包（detail/data/），
//      主包不可跨包引用，相关能力见 detail/utils/data-detail.js。
//      本文件只保留启动必需与列表展示所需的轻量数据，保证启动解析量最小。

// 数据缓存
let channelIndex = null;      // 轻量索引（启动时加载）
let scriptsData = null;
let categoriesData = null;
let configData = null;
let shardConfig = null;       // 分片配置（仅用于索引元信息）
let hotlineChangeData = null;  // 热线变更数据
let followupScheduleData = null; // 跟进时间表数据
let enterpriseQueryData = null;  // 企业查询数据
let generalTemplateData = null;  // 通用投诉信模板数据

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

  // 3. 索引完整性校验：缺失关键字段时只告警，不再尝试从分片重建
  //    （分片已下沉到 detail 分包，主包无法访问；索引需随构建脚本保持最新）
  if (channelIndex && channelIndex.length > 0) {
    const firstItem = channelIndex[0];
    if (!firstItem.issue_types || !firstItem.category_user_l2 || !firstItem.related_script_id) {
      console.warn('[data] 索引文件缺少必要字段（issue_types/category_user_l2/related_script_id），请重新生成 channels_index.js');
    }
  }

  // 4. 加载话术（数量少，直接加载完整数据）
  try {
    scriptsData = require('../data/scripts.js');
  } catch (e) {
    console.error('[data] 加载话术失败:', e);
    scriptsData = [];
  }

  // 5. 启动仅加载分类与配置（都是几 KB）
  //    说明：各工具页数据（热线变更/跟进表/企业查询/模板）以及分片、laws、platforms
  //    全部改为首次使用时才加载，避免启动阶段同步解析数百 KB 拖慢 appLaunch
  try { categoriesData = require('../data/categories.js'); } catch (e) { categoriesData = []; }
  try { configData = require('../data/config.js'); } catch (e) { configData = {}; }
}

/**
 * 非启动必需数据模块的懒加载入口（必须写成字面量 require，便于依赖分析）
 * 只有真正调用对应 getter 时才会解析模块
 */
function lazyRequire(name) {
  switch (name) {
    case 'hotline_change':
      return require('../data/hotline_change.js');
    case 'followup_schedule':
      return require('../data/followup_schedule.js');
    case 'enterprise_query':
      return require('../data/enterprise_query.js');
    case 'general_template':
      return require('../data/general_template.js');
    default:
      throw new Error('未知的数据模块: ' + name);
  }
}

/**
 * 根据ID获取渠道基本信息（主包只持有轻量索引，不加载分片）
 * 列表、收藏、历史等场景够用；需要完整字段请走 detail/utils/data-detail.js
 */
function getChannelById(id) {
  return getChannelIndexItem(id);
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
 * 由 detail 分包回写重建后的渠道索引（索引自愈用）
 * 分片已下沉到分包，主包无法自行重建，只能由分包重建后写回
 */
function setChannelIndex(index) {
  if (Array.isArray(index) && index.length > 0) {
    channelIndex = index;
  }
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
/**
 * 获取热线变更数据
 */
function getHotlineChanges() {
  if (hotlineChangeData === null) {
    try { hotlineChangeData = lazyRequire('hotline_change'); } catch (e) { hotlineChangeData = []; }
  }
  return hotlineChangeData || [];
}

/**
 * 获取跟进时间表数据
 */
function getFollowupSchedule() {
  if (followupScheduleData === null) {
    try { followupScheduleData = lazyRequire('followup_schedule'); } catch (e) { followupScheduleData = []; }
  }
  return followupScheduleData || [];
}

/**
 * 获取企业查询数据
 */
function getEnterpriseQueries() {
  if (enterpriseQueryData === null) {
    try { enterpriseQueryData = lazyRequire('enterprise_query'); } catch (e) { enterpriseQueryData = []; }
  }
  return enterpriseQueryData || [];
}

/**
 * 获取通用投诉信模板
 */
function getGeneralTemplate() {
  if (generalTemplateData === null) {
    try { generalTemplateData = lazyRequire('general_template'); } catch (e) {
      console.error('[data] 加载通用模板失败:', e);
      generalTemplateData = null;
    }
  }
  return generalTemplateData;
}

module.exports = {
  loadAllData,
  getChannels,
  getScripts,
  getCategories,
  getConfig,
  // 主包只提供索引级渠道信息（列表/收藏/历史够用）
  // 完整渠道详情、法律法规、高层级平台请从 detail/utils/data-detail.js 获取
  getChannelById,
  getChannelIndexItem,
  setChannelIndex,
  getScriptById,
  getChannelsByCategory,
  getHotChannels,
  getHotScripts,
  getRelatedScripts,
  getRelatedChannels,
  searchChannels,
  searchScripts,
  getScriptPhoneContent,
  getScriptWrittenContent,
  getHotlineChanges,
  getFollowupSchedule,
  getEnterpriseQueries,
  getGeneralTemplate,
  normalizeChannel,
  getChannelCategoryL1,
  getChannelUserCategory,
  getCategoryL1List,
  getUserCategoryList,
  getChannelsByCategoryL1,
  // 延迟取值：该常量定义在下方，直接导出在转译后会拿到 undefined
  get CATEGORY_L1_TO_USER() {
    return CATEGORY_L1_TO_USER;
  }
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
