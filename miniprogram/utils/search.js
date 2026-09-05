// utils/search.js
// 搜索逻辑（关键词提取+场景匹配+名称匹配兜底）

const { extractKeywords } = require('./keyword-extractor');

// 数据缓存
let channelsData = null;
let scriptsData = null;

/**
 * 加载数据（只用JS文件，确保100%加载成功）
 */
function loadData() {
  if (channelsData && scriptsData) return;

  try {
    channelsData = require('../data/channels.js');
  } catch (e) {
    console.error('[搜索] 加载channels失败:', e);
    channelsData = [];
  }

  try {
    scriptsData = require('../data/scripts.js');
  } catch (e) {
    console.error('[搜索] 加载scripts失败:', e);
    scriptsData = [];
  }
}

/**
 * 搜索流程入口
 * @param {string} query - 用户搜索词
 * @returns {Object} { type, scenes, results, keywords }
 * type: 'single' | 'multi' | 'search' | 'empty'
 */
function search(query) {
  loadData();

  if (!query || !query.trim()) {
    return { type: 'empty', scenes: [], results: [], keywords: [] };
  }

  // 1. 关键词提取
  const kwResult = extractKeywords(query);
  const keywords = kwResult.allKeywords;
  const scenes = kwResult.scenes;

  console.log('[搜索] 提取关键词:', keywords, '匹配场景:', scenes.length);

  // 2. 场景匹配
  if (scenes.length === 1) {
    // 单个场景 → 直接跳转
    return {
      type: 'single',
      scene: scenes[0],
      scenes: scenes,
      results: [],
      keywords: keywords
    };
  } else if (scenes.length >= 2) {
    // 多个场景 → 场景选项卡
    return {
      type: 'multi',
      scenes: scenes.slice(0, 5),
      results: [],
      keywords: keywords
    };
  }

  // 3. 无场景匹配 → 名称匹配搜索（兜底）
  const results = fallbackSearch(query, keywords);
  if (results.length === 0) {
    return { type: 'empty', scenes: [], results: [], keywords: keywords };
  }
  return { type: 'search', scenes: [], results: results, keywords: keywords };
}

/**
 * 名称匹配搜索（兜底方案，不依赖倒排索引）
 */
function fallbackSearch(query, keywords) {
  loadData();
  const results = [];
  const queryLower = query.toLowerCase();

  // 搜索渠道
  for (const channel of channelsData) {
    let score = 0;
    const name = (channel.name || '').toLowerCase();
    const scope = (channel.scope || '').toLowerCase();
    const tags = (channel.tags || []).join(' ').toLowerCase();

    // 完整查询词匹配（权重最高）
    if (name.includes(queryLower)) score += 10;
    if (scope.includes(queryLower)) score += 3;
    if (tags.includes(queryLower)) score += 5;

    // 关键词匹配
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      if (name.includes(kwLower)) score += 5;
      if (scope.includes(kwLower)) score += 1;
      if (tags.includes(kwLower)) score += 3;
    }

    if (score > 0) {
      results.push({
        type: 'channel',
        id: channel.id,
        name: channel.name,
        scope: channel.scope,
        desc: channel.scope || '',
        score: score,
        matchedTerms: keywords
      });
    }
  }

  // 搜索话术
  for (const script of scriptsData) {
    let score = 0;
    const sceneName = (script.scene_name || '').toLowerCase();
    const applicable = (script.applicable || '').toLowerCase();
    const keywords_list = (script.keywords || []).join(' ').toLowerCase();

    if (sceneName.includes(queryLower)) score += 10;
    if (applicable.includes(queryLower)) score += 3;
    if (keywords_list.includes(queryLower)) score += 5;

    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      if (sceneName.includes(kwLower)) score += 5;
      if (applicable.includes(kwLower)) score += 1;
      if (keywords_list.includes(kwLower)) score += 3;
    }

    if (score > 0) {
      results.push({
        type: 'script',
        id: script.id,
        scene_name: script.scene_name,
        name: script.scene_name || '',
        applicable: script.applicable,
        desc: script.applicable || '',
        score: score,
        matchedTerms: keywords
      });
    }
  }

  // 按得分排序
  return results.sort((a, b) => b.score - a.score);
}

/**
 * 查找渠道
 */
function findChannelById(id) {
  loadData();
  return channelsData.find(c => c.id === id);
}

/**
 * 查找话术
 */
function findScriptById(id) {
  loadData();
  return scriptsData.find(s => s.id === id);
}

/**
 * 搜索联想（简单前缀匹配）
 */
function suggest(prefix) {
  loadData();
  if (!prefix || prefix.length < 1) return [];

  const results = [];
  const prefixLower = prefix.toLowerCase();

  // 从渠道名称中提取
  for (const channel of channelsData) {
    const name = channel.name || '';
    if (name.toLowerCase().includes(prefixLower)) {
      results.push(name);
      if (results.length >= 10) break;
    }
  }

  return results;
}

/**
 * 高亮关键词
 */
function highlightKeywords(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return text;
  let result = text;
  for (const kw of keywords) {
    if (kw.length >= 2) {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, `<span class="highlight">${kw}</span>`);
    }
  }
  return result;
}

module.exports = {
  search,
  suggest,
  findChannelById,
  findScriptById,
  highlightKeywords,
  loadData,
  fallbackSearch
};
