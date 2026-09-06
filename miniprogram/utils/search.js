// utils/search.js
// 搜索逻辑（关键词提取+场景匹配+名称匹配兜底）
// 使用data.js的分片加载，支持扩展到几千条数据

const { extractKeywords, KEYWORDS } = require('./keyword-extractor');
const data = require('./data');

// 关键词词库引用（用于领域/问题匹配加权）
const KEYWORDS_REF = KEYWORDS;

/**
 * 搜索流程入口
 * @param {string} query - 用户搜索词
 * @returns {Object} { type, scenes, results, keywords }
 * type: 'single' | 'multi' | 'search' | 'empty'
 */
function search(query) {
  data.loadAllData();

  if (!query || !query.trim()) {
    return { type: 'empty', scenes: [], results: [], keywords: [] };
  }

  // 1. 关键词提取
  const kwResult = extractKeywords(query);
  const keywords = kwResult.allKeywords;
  const scenes = kwResult.scenes;
  const domains = kwResult.domains || [];
  const issues = kwResult.issues || [];

  console.log('[搜索] 提取关键词:', keywords, '领域:', domains, '问题:', issues, '匹配场景:', scenes.length);

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

  // 3. 无场景匹配 → 名称匹配搜索（兜底，用索引数据，轻量快速）
  const results = fallbackSearch(query, keywords, domains, issues);
  if (results.length === 0) {
    return { type: 'empty', scenes: [], results: [], keywords: keywords };
  }
  return { type: 'search', scenes: [], results: results, keywords: keywords };
}

/**
 * 名称匹配搜索（兜底方案，用索引数据，不加载详细内容）
 * @param {string} query - 用户搜索词
 * @param {Array} keywords - 提取的关键词
 * @param {Array} domains - 匹配的领域分类
 * @param {Array} issues - 匹配的问题分类
 */
function fallbackSearch(query, keywords, domains = [], issues = []) {
  data.loadAllData();
  const results = [];
  const queryLower = query.toLowerCase();

  // 领域关键词集合（用于判断渠道是否属于用户搜索的领域）
  const domainKeywords = new Set();
  domains.forEach(d => {
    if (KEYWORDS_REF.domain[d]) {
      KEYWORDS_REF.domain[d].forEach(w => domainKeywords.add(w.toLowerCase()));
    }
  });

  // 搜索渠道（用索引数据，只有name/phone/tags，轻量快速）
  const channels = data.getChannels();
  for (const channel of channels) {
    let score = 0;
    const name = (channel.name || '').toLowerCase();
    const phone = (channel.phone || '').toLowerCase();
    const tags = (channel.tags || []).join(' ').toLowerCase();
    const categoryUser = (channel.category_user || '').toLowerCase();
    const categoryUserL2 = (channel.category_user_l2 || '').toLowerCase();

    // 完整查询词匹配（权重最高）
    if (name.includes(queryLower)) score += 15;
    if (phone.includes(queryLower)) score += 8;
    if (tags.includes(queryLower)) score += 8;
    if (categoryUser.includes(queryLower)) score += 10;
    if (categoryUserL2.includes(queryLower)) score += 8;

    // 关键词匹配（区分领域关键词和问题关键词）
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      let kwWeight = 3; // 默认权重

      // 检查是否是领域关键词（权重更高）
      if (domainKeywords.has(kwLower)) {
        kwWeight = 8;
      }

      if (name.includes(kwLower)) score += kwWeight + 2;
      if (phone.includes(kwLower)) score += kwWeight;
      if (tags.includes(kwLower)) score += kwWeight;
      if (categoryUser.includes(kwLower)) score += kwWeight + 3;
      if (categoryUserL2.includes(kwLower)) score += kwWeight + 2;
    }

    // 领域匹配加权：如果渠道的分类属于用户搜索的领域，额外加分
    if (domains.length > 0) {
      for (const domain of domains) {
        const domainLower = domain.toLowerCase();
        if (categoryUser.includes(domainLower) || categoryUserL2.includes(domainLower)) {
          score += 20; // 领域匹配大幅加分
          break;
        }
        // 检查tags中是否包含该领域的关键词
        const domainWords = KEYWORDS_REF.domain[domain] || [];
        for (const dw of domainWords) {
          if (tags.includes(dw.toLowerCase()) || name.includes(dw.toLowerCase())) {
            score += 10;
            break;
          }
        }
      }
    }

    // 问题匹配加权：如果渠道的tags中包含用户搜索的问题关键词，额外加分
    if (issues.length > 0) {
      for (const issue of issues) {
        const issueWords = KEYWORDS_REF.issue[issue] || [];
        for (const iw of issueWords) {
          if (tags.includes(iw.toLowerCase()) || name.includes(iw.toLowerCase())) {
            score += 8;
            break;
          }
        }
      }
    }

    if (score > 0) {
      results.push({
        type: 'channel',
        id: channel.id,
        name: channel.name,
        phone: channel.phone,
        desc: channel.name + ' ' + (channel.phone || ''),
        score: score,
        matchedTerms: keywords
      });
    }
  }

  // 搜索话术
  const scripts = data.getScripts();
  for (const script of scripts) {
    let score = 0;
    const sceneName = (script.scene_name || '').toLowerCase();
    const applicable = (script.applicable || '').toLowerCase();
    const keywords_list = (script.keywords || []).join(' ').toLowerCase();

    if (sceneName.includes(queryLower)) score += 15;
    if (applicable.includes(queryLower)) score += 5;
    if (keywords_list.includes(queryLower)) score += 8;

    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      let kwWeight = 3;

      // 检查是否是领域关键词（权重更高）
      if (domainKeywords.has(kwLower)) {
        kwWeight = 8;
      }

      if (sceneName.includes(kwLower)) score += kwWeight + 2;
      if (applicable.includes(kwLower)) score += kwWeight;
      if (keywords_list.includes(kwLower)) score += kwWeight + 1;
    }

    // 领域匹配加权：如果话术的场景名称属于用户搜索的领域，额外加分
    if (domains.length > 0) {
      for (const domain of domains) {
        const domainLower = domain.toLowerCase();
        if (sceneName.includes(domainLower) || applicable.includes(domainLower)) {
          score += 25; // 领域匹配大幅加分
          break;
        }
        // 检查场景名称中是否包含该领域的关键词
        const domainWords = KEYWORDS_REF.domain[domain] || [];
        for (const dw of domainWords) {
          if (sceneName.includes(dw.toLowerCase()) || applicable.includes(dw.toLowerCase())) {
            score += 12;
            break;
          }
        }
      }
    }

    // 问题匹配加权
    if (issues.length > 0) {
      for (const issue of issues) {
        const issueWords = KEYWORDS_REF.issue[issue] || [];
        for (const iw of issueWords) {
          if (sceneName.includes(iw.toLowerCase()) || applicable.includes(iw.toLowerCase())) {
            score += 10;
            break;
          }
        }
      }
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
 * 查找渠道详细信息（按需加载分片）
 */
function findChannelById(id) {
  return data.getChannelById(id);
}

/**
 * 查找话术
 */
function findScriptById(id) {
  return data.getScriptById(id);
}

/**
 * 搜索联想（简单前缀匹配，用索引数据）
 */
function suggest(prefix) {
  data.loadAllData();
  if (!prefix || prefix.length < 1) return [];

  const results = [];
  const prefixLower = prefix.toLowerCase();

  const channels = data.getChannels();
  for (const channel of channels) {
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
  fallbackSearch
};
