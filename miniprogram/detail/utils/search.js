// utils/search.js
// 搜索逻辑（关键词提取+场景匹配+名称匹配兜底）
// 使用data.js的分片加载，支持扩展到几千条数据

const { extractKeywords, KEYWORDS } = require('./keyword-extractor');
const { correctTypos, fuzzyMatch, getPinyinInitials } = require('./search-enhance');
const data = require('../../utils/data');
const dataDetail = require('./data-detail');

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

  // 0. 错别字自动纠正
  const correctedQuery = correctTypos(query);
  if (correctedQuery !== query) {

  }

  // 1. 同义词扩展：用config里的synonyms对查询进行扩展，增加匹配概率
  const config = data.getConfig();
  const synonyms = config.synonyms || {};
  let expandedQuery = correctedQuery;
  let expandedKeywords = [];
  Object.keys(synonyms).forEach(origin => {
    if (correctedQuery.includes(origin)) {
      const target = synonyms[origin];
      // 跳过自映射（如「物业」→「物业」）与查询中已包含的目标，
      // 避免产生「物业 物业」这类冗余扩展干扰后续场景匹配。
      if (!target || target === origin || correctedQuery.includes(target)) return;
      expandedQuery = expandedQuery + ' ' + target;
      expandedKeywords.push(target);
    }
  });

  // 2. 关键词提取（用扩展后的查询）
  const kwResult = extractKeywords(expandedQuery);
  const keywords = [...new Set([...kwResult.allKeywords, ...expandedKeywords])];
  const scenes = kwResult.scenes;
  const domains = kwResult.domains || [];
  const issues = kwResult.issues || [];

  // 3. 场景匹配
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

  // 4. 无场景匹配 → 名称匹配搜索（兜底，用索引数据，轻量快速）
  const results = fallbackSearch(correctedQuery, keywords, domains, issues);
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
    const categoryL1 = (channel.category_l1 || '').toLowerCase();
    const categoryL2 = (channel.category_l2 || '').toLowerCase();

    // 完整查询词匹配（权重最高）
    if (name.includes(queryLower)) score += 15;
    if (phone.includes(queryLower)) score += 8;
    if (tags.includes(queryLower)) score += 12; // 标签匹配权重提升
    if (categoryUser.includes(queryLower)) score += 10;
    if (categoryUserL2.includes(queryLower)) score += 8;
    if (categoryL1.includes(queryLower)) score += 10; // 新增category_l1匹配
    if (categoryL2.includes(queryLower)) score += 8;  // 新增category_l2匹配

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
      if (tags.includes(kwLower)) score += kwWeight + 2; // 标签匹配权重提升
      if (categoryUser.includes(kwLower)) score += kwWeight + 3;
      if (categoryUserL2.includes(kwLower)) score += kwWeight + 2;
      if (categoryL1.includes(kwLower)) score += kwWeight + 3; // 新增category_l1匹配
      if (categoryL2.includes(kwLower)) score += kwWeight + 2;  // 新增category_l2匹配
    }

    // 领域匹配加权：如果渠道的分类明确属于用户搜索的领域，额外加分
    // 仅看 category_user / category_l1 / category_l2 是否包含领域名，
    // 不再遍历领域词库给 tags/name 宽泛加分，避免“公司”等高频词导致泛滥匹配。
    if (domains.length > 0) {
      for (const domain of domains) {
        const domainLower = domain.toLowerCase();
        if (categoryUser.includes(domainLower) || categoryUserL2.includes(domainLower) ||
            categoryL1.includes(domainLower) || categoryL2.includes(domainLower)) {
          score += 20; // 领域匹配大幅加分
          break;
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
    } else {
      // 拼音首字母匹配 + 编辑距离模糊匹配（兜底）
      const queryInitials = getPinyinInitials(queryLower);
      const nameInitials = getPinyinInitials(name);

      // 拼音首字母匹配：要求输入≥3个字符且名称首字母以输入首字母开头，
      // 避免“ld”等两字母子串匹配到大量无关结果。
      if (queryInitials.length >= 3 && nameInitials.startsWith(queryInitials)) {
        results.push({
          type: 'channel',
          id: channel.id,
          name: channel.name,
          phone: channel.phone,
          desc: channel.name + ' ' + (channel.phone || ''),
          score: 50,
          matchedTerms: ['拼音匹配:' + queryInitials]
        });
        continue;
      }

      // 编辑距离模糊匹配（相似度≥0.7）
      const fuzzyResult = fuzzyMatch(queryLower, name, 0.7);
      if (fuzzyResult.matched && fuzzyResult.score > 0) {
        results.push({
          type: 'channel',
          id: channel.id,
          name: channel.name,
          phone: channel.phone,
          desc: channel.name + ' ' + (channel.phone || ''),
          score: fuzzyResult.score,
          matchedTerms: ['模糊匹配:' + fuzzyResult.type]
        });
      }
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

    // 领域匹配加权：如果话术的场景名称/applicable 明确包含用户搜索的领域名，额外加分
    // 不再遍历领域词库做宽泛扩展，避免“公司”“老板”等词导致无关场景被召回。
    if (domains.length > 0) {
      for (const domain of domains) {
        const domainLower = domain.toLowerCase();
        if (sceneName.includes(domainLower) || applicable.includes(domainLower)) {
          score += 25; // 领域匹配大幅加分
          break;
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

  // 搜索高层级平台
  const platforms = dataDetail.getPlatforms();
  for (const platform of platforms) {
    let score = 0;
    const name = (platform.name || '').toLowerCase();
    const phone = (platform.phone || '').toLowerCase();
    const scope = (platform.scope || '').toLowerCase();
    const tags = (platform.tags || []).join(' ').toLowerCase();
    const platCategory = (platform.platform_category || '').toLowerCase();

    if (name.includes(queryLower)) score += 20;
    if (phone.includes(queryLower)) score += 10;
    if (scope.includes(queryLower)) score += 6;
    if (tags.includes(queryLower)) score += 8;
    if (platCategory.includes(queryLower)) score += 10;

    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      if (name.includes(kwLower)) score += 8;
      if (phone.includes(kwLower)) score += 5;
      if (tags.includes(kwLower)) score += 5;
      if (scope.includes(kwLower)) score += 3;
    }

    if (score > 0) {
      results.push({
        type: 'platform',
        id: platform.id,
        name: platform.name,
        phone: platform.phone,
        desc: platform.scope || platform.name,
        platform_category: platform.platform_category,
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
