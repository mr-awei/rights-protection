// pages/search-result/search-result.js
const { search, highlightKeywords } = require('../../utils/search');
const { getChannelById, getScriptById } = require('../../utils/data');

Page({
  data: {
    keyword: '',
    searchInput: '',
    activeTab: 'all',
    results: [],
    filteredResults: [],
    resultCount: 0,
    statusBarHeight: 20
  },

  onLoad(options) {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    const keyword = decodeURIComponent(options.keyword || '');
    this.setData({ keyword, searchInput: keyword });
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
  },

  /**
   * 统一渠道和话术的字段映射
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
    const { results } = this.data;
    let filtered = results;
    if (tab === 'channel') {
      filtered = results.filter(r => r.type === 'channel');
    } else if (tab === 'script') {
      filtered = results.filter(r => r.type === 'script');
    }
    this.setData({ filteredResults: filtered });
  },

  onResultTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.type === 'channel') {
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
  }
});
