// pages/search/search.js
const app = getApp();
const { searchChannels, searchScripts, getChannels, getScripts } = require('../../utils/data');

Page({
  data: {
    keyword: '',
    searchHistory: [],
    hotSearches: [
      '快递丢失', '运营商乱扣费', '商家不退款', '物业不作为',
      '银行乱收费', '医疗纠纷', '教育机构跑路', '噪音扰民',
      '食品安全', '劳动纠纷'
    ],
    suggestions: [],
    showSuggestions: false,
    statusBarHeight: 20
  },

  onLoad() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    this.loadSearchHistory();
  },

  onShow() {
    this.loadSearchHistory();
  },

  loadSearchHistory() {
    const history = app.getSearchHistory() || [];
    this.setData({ searchHistory: history });
  },

  // 输入变化
  onInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });

    if (keyword.trim().length > 0) {
      this.getSuggestions(keyword);
      this.setData({ showSuggestions: true });
    } else {
      this.setData({ showSuggestions: false, suggestions: [] });
    }
  },

  // 获取联想建议
  getSuggestions(keyword) {
    const channelResults = searchChannels(keyword, 5);
    const scriptResults = searchScripts(keyword, 3);

    const suggestions = [
      ...channelResults.map(item => ({
        type: 'channel',
        id: item.id,
        name: item.name,
        phone: item.phone || ''
      })),
      ...scriptResults.map(item => ({
        type: 'script',
        id: item.id,
        name: item.scene_name || item.name,
        phone: ''
      }))
    ].slice(0, 8);

    this.setData({ suggestions });
  },

  // 点击联想项
  onSuggestionTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.type === 'channel') {
      this.doSearch(item.name);
      wx.navigateTo({
        url: `/pages/channel-detail/channel-detail?id=${item.id}`
      });
    } else if (item.type === 'script') {
      this.doSearch(item.name);
      wx.navigateTo({
        url: `/pages/script-detail/script-detail?id=${item.id}`
      });
    }
  },

  // 执行搜索
  doSearch(keyword) {
    const kw = keyword || this.data.keyword;
    if (!kw.trim()) return;

    app.addSearchHistory(kw);
    this.loadSearchHistory();

    wx.navigateTo({
      url: `/pages/search-result/search-result?keyword=${encodeURIComponent(kw)}`
    });
  },

  // 点击搜索按钮
  onSearch() {
    this.doSearch();
  },

  // 点击历史/热门词
  onKeywordTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.doSearch(keyword);
  },

  // 删除单条历史
  onDeleteHistory(e) {
    const keyword = e.currentTarget.dataset.keyword;
    app.removeSearchHistory(keyword);
    this.loadSearchHistory();
  },

  // 清空搜索历史
  onClearHistory() {
    wx.showModal({
      title: '清空搜索历史',
      content: '确定清空所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearSearchHistory();
          this.loadSearchHistory();
          wx.showToast({ title: '搜索历史已清空', icon: 'success' });
        }
      }
    });
  },

  // 返回上一页
  onBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) });
  },

  // 清空输入
  onClearInput() {
    this.setData({ keyword: '', showSuggestions: false, suggestions: [] });
  }
});
