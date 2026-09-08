// pages/search-result/search-result.js
const { search, highlightKeywords } = require('../../utils/search');
const { getChannelById, getScriptById, getConfig } = require('../../utils/data');
const config = require('../../data/config.js');

Page({
  data: {
    keyword: '',
    searchInput: '',
    activeTab: 'all',
    results: [],
    filteredResults: [],
    displayResults: [],
    resultCount: 0,
    statusBarHeight: 20,
    hotSearches: [],
    currentPage: 1,
    hasMore: true,
    loadingMore: false,
    // 问题类型筛选
    issueTypes: [],
    activeIssueType: 'all',
    guideCategories: [
      { name: '交通物流', icon: 'icon-train' },
      { name: '电信运营', icon: 'icon-mobile' },
      { name: '消费购物', icon: 'icon-shop' },
      { name: '金融保险', icon: 'icon-coin' },
      { name: '房产物业', icon: 'icon-home' },
      { name: '劳动用工', icon: 'icon-briefcase' },
      { name: '医疗教育', icon: 'icon-medical' },
      { name: '政务纪检', icon: 'icon-law' }
    ]
  },

  onLoad(options) {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    // 从配置文件读取热门搜索
    const appConfig = getConfig();
    this.setData({ hotSearches: appConfig.hot_search_words || [] });
    
    // 加载问题类型列表
    const issueTypesConfig = appConfig.issue_types || {};
    const issueTypes = [
      { key: 'all', name: '全部' },
      ...Object.keys(issueTypesConfig).map(key => ({
        key: key,
        name: issueTypesConfig[key].name
      }))
    ];
    
    const keyword = decodeURIComponent(options.keyword || '');
    const issueType = options.issue_type || 'all';
    this.setData({ 
      keyword, 
      searchInput: keyword,
      issueTypes: issueTypes,
      activeIssueType: issueType
    });
    this.doSearch(keyword);

  },

  // 搜索框输入
  onSearchInput(e) {
    this.setData({ searchInput: e.detail.value });
  },

  // 搜索框确认
  onSearchConfirm() {
    const keyword = this.data.searchInput.trim();
    if (!keyword) return;
    this.setData({ keyword });
    this.doSearch(keyword);
  },

  // 返回上一页
  onBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) });
  },

  // 点击搜索按钮
  onSearchButtonTap() {
    this.onSearchConfirm();
  },

  // 点击搜索框（聚焦时不跳转，允许修改）
  onSearchBoxTap() {
    // 搜索结果页的搜索框允许直接编辑
  },

  doSearch(keyword) {
    if (!keyword) {
      this.setData({ results: [], filteredResults: [], resultCount: 0 });
      return;
    }

    const result = search(keyword);
    let results = result.results || [];

    // 如果有场景匹配结果，把场景中的渠道和话术也加入结果
    if (result.scenes && result.scenes.length > 0) {
      const sceneResults = [];
      result.scenes.forEach(scene => {
        // 添加场景中的渠道
        if (scene.channels && scene.channels.length > 0) {
          scene.channels.forEach(channelId => {
            // 检查是否已经存在
            if (!sceneResults.find(r => r.id === channelId && r.type === 'channel')) {
              const channel = getChannelById(channelId);
              if (channel) {
                sceneResults.push({
                  ...channel,
                  id: channelId,
                  type: 'channel',
                  sceneName: scene.name,
                  matchRatio: scene.matchRatio || 100
                });
              }
            }
          });
        }
        // 添加场景中的话术
        if (scene.scripts && scene.scripts.length > 0) {
          scene.scripts.forEach(scriptId => {
            // 检查是否已经存在
            if (!sceneResults.find(r => r.id === scriptId && r.type === 'script')) {
              const script = getScriptById(scriptId);
              if (script) {
                sceneResults.push({
                  ...script,
                  id: scriptId,
                  type: 'script',
                  sceneName: scene.name,
                  matchRatio: scene.matchRatio || 100
                });
              }
            }
          });
        }
      });
      // 场景匹配结果优先显示
      results = [...sceneResults, ...results];
    }

    // 如果还是没有结果，用简单名称匹配兜底
    if (results.length === 0) {
      results = this.fallbackSearch(keyword);
    }

    // 统一字段映射 + 高亮关键词
    const highlighted = results.map(item => {
      const normalized = this.normalizeItem(item);
      return {
        ...normalized,
        highlightedName: highlightKeywords(normalized.name, result.keywords),
        highlightedDesc: highlightKeywords(normalized.desc, result.keywords)
      };
    });

    this.setData({
      results: highlighted,
      resultCount: highlighted.length
    });
    this.filterResults('all');

    // 记录搜索日志（匿名，用于后续搜索优化）
    try {
      const app = getApp();
      if (app && app.logSearch) {
        app.logSearch(keyword, highlighted.length, result.type || 'search');
      }
    } catch (e) {
      // 搜索日志记录失败不影响主流程
    }
  },

  /**
   * 统一渠道、话术和平台的字段映射
   */
  normalizeItem(item) {
    if (item.type === 'channel') {
      return {
        ...item,
        name: item.name || '',
        desc: item.scope || item.desc || item.description || ''
      };
    } else if (item.type === 'script') {
      return {
        ...item,
        name: item.scene_name || item.name || '',
        desc: item.applicable || item.desc || item.description || ''
      };
    } else if (item.type === 'platform') {
      return {
        ...item,
        name: item.name || '',
        desc: item.scope || item.desc || item.description || ''
      };
    }
    return item;
  },

  fallbackSearch(keyword) {
    // 简单名称匹配兜底
    const { searchChannels, searchScripts } = require('../../utils/data');
    const channels = searchChannels(keyword).map(c => ({
      type: 'channel',
      id: c.id,
      name: c.name,
      scope: c.scope,
      score: 1
    }));
    const scripts = searchScripts(keyword).map(s => ({
      type: 'script',
      id: s.id,
      scene_name: s.scene_name,
      applicable: s.applicable,
      score: 1
    }));
    return [...channels, ...scripts];
  },

  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.filterResults(tab);
  },

  filterResults(tab) {
    const { results, activeIssueType } = this.data;
    let filtered = results;
    if (tab === 'channel') {
      filtered = results.filter(r => r.type === 'channel');
    } else if (tab === 'script') {
      filtered = results.filter(r => r.type === 'script');
    } else if (tab === 'platform') {
      filtered = results.filter(r => r.type === 'platform');
    }
    
    // 动态计算当前结果中有哪些问题类型有数据（仅看渠道类型）
    const availableIssueTypes = new Set();
    filtered.forEach(r => {
      if (r.type === 'channel') {
        (r.issue_types || []).forEach(t => availableIssueTypes.add(t));
      }
    });

    // 构建问题类型列表：全部 + 有数据的问题类型
    const issueTypesConfig = config.issue_types || {};
    const newIssueTypes = [
      { key: 'all', name: '全部' },
      ...Object.keys(issueTypesConfig)
        .filter(key => availableIssueTypes.has(key))
        .map(key => ({
          key: key,
          name: issueTypesConfig[key].name
        }))
    ];

    // 如果当前选中的问题类型在新结果中没有数据，自动切换回全部
    let newActiveIssueType = activeIssueType;
    if (activeIssueType && activeIssueType !== 'all' && !availableIssueTypes.has(activeIssueType)) {
      newActiveIssueType = 'all';
    }

    // 按问题类型筛选（仅对渠道类型生效）
    if (newActiveIssueType && newActiveIssueType !== 'all') {
      filtered = filtered.filter(r => {
        if (r.type !== 'channel') return true; // 话术和平台不筛选
        const issueTypes = r.issue_types || [];
        return issueTypes.includes(newActiveIssueType);
      });
    }
    
    this.setData({ 
      filteredResults: filtered,
      displayResults: filtered.slice(0, 20),
      currentPage: 1,
      hasMore: filtered.length > 20,
      issueTypes: newIssueTypes,
      activeIssueType: newActiveIssueType
    });
  },

  // 点击问题类型筛选
  onIssueTypeTap(e) {
    const issueType = e.currentTarget.dataset.type;
    if (issueType === this.data.activeIssueType) return;
    this.setData({ activeIssueType: issueType }, () => {
      this.filterResults(this.data.activeTab);
    });
  },

  onResultTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.type === 'channel' || item.type === 'platform') {
      // 预加载分片，跳转后直接使用缓存
      const { preloadChannelPart } = require('../../utils/data');
      preloadChannelPart(item.id);
      wx.navigateTo({
        url: `/pages/channel-detail/channel-detail?id=${item.id}`
      });
    } else {
      wx.navigateTo({
        url: `/pages/script-detail/script-detail?id=${item.id}`
      });
    }
  },

  onBack() {
    wx.navigateBack();
  },

  // 点击热门搜索词
  onHotSearchTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword, searchInput: keyword });
    this.doSearch(keyword);
  },

  // 点击分类推荐
  onGuideCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    const app = getApp();
    app.globalData.pendingCategory = category;
    wx.switchTab({ url: '/pages/category/category' });
  },

  // 分享给朋友
  onShareAppMessage() {
    const kw = this.data.keyword || '';
    return {
      title: kw ? ('搜索"' + kw + '" - 维权投诉渠道') : '维权投诉渠道大全',
      path: '/pages/index/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '维权投诉渠道大全'
    };
  },

  // 上拉加载更多
  onReachBottom() {
    const { filteredResults, displayResults, hasMore, loadingMore, currentPage } = this.data;
    if (!hasMore || loadingMore) return;

    this.setData({ loadingMore: true });

    setTimeout(() => {
      const PAGE_SIZE = 20;
      const nextPage = currentPage + 1;
      const start = (nextPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const newItems = filteredResults.slice(start, end);
      const newDisplay = displayResults.concat(newItems);

      this.setData({
        displayResults: newDisplay,
        currentPage: nextPage,
        hasMore: end < filteredResults.length,
        loadingMore: false
      });
    }, 300);
  },

  onShow() {
  },
});