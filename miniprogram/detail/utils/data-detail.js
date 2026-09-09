// detail/utils/data-detail.js
// detail 分包专用数据层：渠道完整详情、法律法规、高层级平台
// 说明：渠道分片(268KB)、laws(148KB)、platforms(24KB) 已下沉到 detail/data/，
//      主包不能跨包引用，因此这些能力必须由分包内部持有；
//      索引、话术、分类、配置等基础数据仍复用主包 utils/data.js。

const data = require('../../utils/data');

// 已加载的分片缓存 { part_num: [channels] }
const channelParts = {};

let lawsData = null;
let platformsData = null;

/**
 * 渠道分片模块的静态声明（必须写成字面量 require，便于依赖分析）
 * 小程序模块在首次 require 时才执行，所以依然是按需加载
 */
function loadPartModule(partNum) {
  switch (partNum) {
    case 1:
      return require('../data/channels_part_1.js');
    case 2:
      return require('../data/channels_part_2.js');
    case 3:
      return require('../data/channels_part_3.js');
    default:
      throw new Error('未知的渠道分片: ' + partNum);
  }
}

/**
 * 按需加载指定分片
 */
function loadPart(partNum) {
  if (channelParts[partNum]) return channelParts[partNum];
  if (partNum === 0) return channelParts[0] || [];

  try {
    const part = loadPartModule(partNum);
    channelParts[partNum] = part;
    return part;
  } catch (e) {
    console.error(`[data-detail] 加载分片 ${partNum} 失败:`, e);
    return [];
  }
}

/**
 * 预加载指定渠道所在分片（跳转详情页前调用，避免进入后同步加载造成卡顿）
 */
function preloadChannelPart(channelId) {
  try {
    const idxItem = data.getChannelIndexItem(channelId);
    if (!idxItem) return;
    const partNum = idxItem.part_num || 1;
    loadPart(partNum);
  } catch (e) {
    console.warn('[data-detail] 预加载分片失败:', e);
  }
}

/**
 * 索引自愈：主包索引若缺失关键字段（构建产物过旧），由分包从分片重建后写回
 * 只在首次访问详情时检测一次，正常构建下不会触发
 */
let indexChecked = false;
function rebuildIndexIfNeeded() {
  if (indexChecked) return;
  indexChecked = true;
  try {
    const idx = data.getChannels() || [];
    if (idx.length === 0) return;
    const first = idx[0];
    const broken = !first.issue_types || !first.category_user_l2 ||
                   !first.related_script_id || first.part_num === undefined;
    if (!broken) return;

    console.warn('[data-detail] 索引缺少关键字段，从分片重建...');
    const rebuilt = [];
    for (let i = 1; i <= 3; i++) {
      const part = loadPartModule(i);
      channelParts[i] = part;
      part.forEach(c => {
        rebuilt.push({
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
    }
    if (rebuilt.length > 0) {
      data.setChannelIndex(rebuilt);
      console.warn('[data-detail] 索引重建完成，共 ' + rebuilt.length + ' 条');
    }
  } catch (e) {
    console.error('[data-detail] 索引重建失败:', e);
  }
}

/**
 * 根据ID获取渠道完整信息（按需加载分片）
 */
function getChannelById(id) {
  if (!id) return null;
  rebuildIndexIfNeeded();
  const idxItem = data.getChannelIndexItem(id);
  if (!idxItem) return null;

  // 完整数据模式（索引项自带完整对象）
  if (idxItem._full) return idxItem._full;

  const partNum = idxItem.part_num || 1;
  const part = loadPart(partNum);
  return part.find(c => c.id === id) || null;
}

/**
 * 获取所有法律法规（首次调用时才加载 laws.js）
 */
function getLaws() {
  if (lawsData === null) {
    try {
      lawsData = require('../data/laws.js');
    } catch (e) {
      console.error('[data-detail] 加载法律法规失败:', e);
      lawsData = [];
    }
  }
  return lawsData || [];
}

/**
 * 根据ID获取法律
 */
function getLawById(id) {
  return getLaws().find(l => l.id === id) || null;
}

/**
 * 获取所有高层级诉求平台（首次调用时才加载 platforms.js）
 */
function getPlatforms() {
  if (platformsData === null) {
    try {
      platformsData = require('../data/platforms.js');
    } catch (e) {
      console.error('[data-detail] 加载高层级平台失败:', e);
      platformsData = [];
    }
  }
  return platformsData || [];
}

/**
 * 根据ID获取高层级平台
 */
function getPlatformById(id) {
  return getPlatforms().find(p => p.id === id) || null;
}

/**
 * 搜索高层级平台
 */
function searchPlatforms(keyword) {
  const list = getPlatforms();
  if (!keyword || !list.length) return list;
  const kw = keyword.toLowerCase();
  return list.filter(p =>
    (p.name && p.name.toLowerCase().includes(kw)) ||
    (p.phone && p.phone.toLowerCase().includes(kw)) ||
    (p.scope && p.scope.toLowerCase().includes(kw)) ||
    (p.tags && p.tags.some(t => t.toLowerCase().includes(kw))) ||
    (p.platform_category && p.platform_category.toLowerCase().includes(kw))
  );
}

/**
 * 分片加载情况（调试用）
 */
function getShardStats() {
  return {
    total: (data.getChannels() || []).length,
    loadedParts: Object.keys(channelParts).length
  };
}

module.exports = {
  getChannelById,
  getLaws,
  getLawById,
  getPlatforms,
  getPlatformById,
  searchPlatforms,
  preloadChannelPart,
  loadPart,
  getShardStats
};
