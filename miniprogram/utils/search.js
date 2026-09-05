// utils/search.js
// 搜索逻辑（倒排索引搜索、结果排序）

const { extractKeywords } = require('./keyword-extractor');

// 数据缓存
let channelsData = null;
let scriptsData = null;
let searchIndex = null;
let suggestTrie = null;

/**
 * 加载数据
 */
function loadData() {
  if (channelsData && scriptsData && searchIndex) return;

  try {
    channelsData = require('../data/channels.json');
    scriptsData = require('../data/scripts.json');
    searchIndex = require('../data/search_index.json');
    suggestTrie = require('../data/suggest_trie.json');
  } catch (e) {
    console.error('[搜索] 数据加载失败:', e);
    channelsData = channelsData || [];
    scriptsData = scriptsData || [];
    searchIndex = searchIndex || { terms: {}, docs: [] };
    suggestTrie = suggestTrie || {};
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

  // 3. 无场景匹配 → 倒排索引搜索
  const results = invertedSearch(query, keywords);
  if (results.length === 0) {
    return { type: 'empty', scenes: [], results: [], keywords: keywords };
  }
  return { type: 'search', scenes: [], results: results, keywords: keywords };
}

/**
 * 倒排索引搜索
 */
function invertedSearch(query, keywords) {
  loadData();

  const docScores = {};
  const queryTerms = [query, ...keywords];

  // 遍历查询词
  for (const term of queryTerms) {
    if (!term || term.length < 2) continue;

    // 在倒排索引中查找
    const termKey = term.toLowerCase();
    const postings = searchIndex.terms[termKey];
    if (!postings) continue;

    // 计算每个文档的得分
    for (const posting of postings) {
      const docId = posting.doc_id;
      const tf = posting.tf || 1;
      const fieldBoost = getFieldBoost(posting.field);

      if (!docScores[docId]) {
        docScores[docId] = { score: 0, matchedTerms: [] };
      }
      docScores[docId].score += tf * fieldBoost;
      if (!docScores[docId].matchedTerms.includes(term)) {
        docScores[docId].matchedTerms.push(term);
      }
    }
  }

  // 转换为结果列表并排序
  const results = [];
  for (const [docId, data] of Object.entries(docScores)) {
    const doc = searchIndex.docs[docId];
    if (!doc) continue;

    let item = null;
    if (doc.type === 'channel') {
      const channel = findChannelById(doc.id);
      if (channel) {
        item = {
          type: 'channel',
          id: channel.id,
          name: channel.name,
          scope: channel.scope,
          desc: channel.scope || '',
          score: data.score,
          matchedTerms: data.matchedTerms
        };
      }
    } else if (doc.type === 'script') {
      const script = findScriptById(doc.id);
      if (script) {
        item = {
          type: 'script',
          id: script.id,
          scene_name: script.scene_name,
          name: script.scene_name || '',
          applicable: script.applicable,
          desc: script.applicable || '',
          score: data.score,
          matchedTerms: data.matchedTerms
        };
      }
    }

    if (item) {
      results.push(item);
    }
  }

  // 按得分排序
  return results.sort((a, b) => b.score - a.score);
}

/**
 * 字段权重
 */
function getFieldBoost(field) {
  const boosts = {
    'name': 5.0,
    'scene_name': 5.0,
    'tags': 3.0,
    'category': 2.0,
    'category_l1': 2.0,
    'category_l2': 2.0,
    'desc': 1.5,
    'description': 1.5,
    'scope': 1.5,
    'applicable': 1.5,
    'legal_basis': 1.0,
    'default': 1.0
  };
  return boosts[field] || boosts['default'];
}

/**
 * 查找渠道
 */
function findChannelById(id) {
  loadData();
  const list = channelsData.channels || channelsData || [];
  return list.find(c => c.id === id);
}

/**
 * 查找话术
 */
function findScriptById(id) {
  loadData();
  const list = scriptsData.scripts || scriptsData || [];
  return list.find(s => s.id === id);
}

/**
 * 搜索联想
 */
function suggest(prefix) {
  loadData();
  if (!prefix || prefix.length < 1) return [];

  const results = [];
  const prefixLower = prefix.toLowerCase();

  // 遍历Trie树
  function traverse(node, currentPrefix) {
    if (node.isEnd) {
      results.push(currentPrefix);
    }
    for (const [char, child] of Object.entries(node.children || {})) {
      traverse(child, currentPrefix + char);
    }
  }

  // 找到前缀对应的节点
  let node = suggestTrie;
  for (const char of prefixLower) {
    if (node.children && node.children[char]) {
      node = node.children[char];
    } else {
      return results;
    }
  }

  traverse(node, prefixLower);
  return results.slice(0, 10);
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
  loadData
};
