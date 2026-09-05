// pages/search-result/search-result.js
const { search, highlightKeywords } = require('../../utils/search');

Page({
  data: {
    keyword: '',
    activeTab: 'all',
    results: [],
    filteredResults: [],
    resultCount: 0
  },

  onLoad(options) {
    const keyword = decodeURIComponent(options.keyword || '');
    this.setData({ keyword });
    this.doSearch(keyword);
  },

  doSearch(keyword) {
    if (!keyword) {
      this.setData({ results: [], filteredResults: [], resultCount: 0 });
      return;
    }

    const result = search(keyword);
    let results = result.results || [];

    // 如果倒排索引没有结果，用简单名称匹配兜底
    if (results.length === 0) {
      results = this.fallbackSearch(keyword);
    }

    // 高亮关键词
    const highlighted = results.map(item => ({
      ...item,
      highlightedName: highlightKeywords(item.name, result.keywords),
      highlightedDesc: highlightKeywords(item.desc, result.keywords)
    }));

    this.setData({
      results: highlighted,
      resultCount: highlighted.length
    });
    this.filterResults('all');
  },

  fallbackSearch(keyword) {
    // 简单名称匹配兜底
    const { searchChannels, searchScripts } = require('../../utils/data');
    const channels = searchChannels(keyword).map(c => ({
      type: 'channel',
      id: c.id,
      name: c.name,
      desc: c.desc || c.description || '',
      score: 1
    }));
    const scripts = searchScripts(keyword).map(s => ({
      type: 'script',
      id: s.id,
      name: s.name,
      desc: s.desc || s.description || '',
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
