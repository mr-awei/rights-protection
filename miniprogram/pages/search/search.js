// pages/search/search.js
const app = getApp();
const { searchChannels, searchScripts, getChannels, getScripts, getConfig } = require('../../utils/data');

Page({
  data: {
    keyword: '',
    searchHistory: [],
    hotSearches: [],
    suggestions: [],
    showSuggestions: false,
    statusBarHeight: 20
  },

  // ========== 自定义弹窗通用方法 ==========
  showConfirmModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'confirm',
      modalTitle: options.title || '提示',
      modalContent: options.content || '',
      modalConfirmText: options.confirmText || '确定',
      modalCancelText: options.cancelText || '取消',
      modalShowCancel: options.showCancel !== false,
      modalCallback: options.success || null
    });
  },

  showInputModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'input',
      modalTitle: options.title || '请输入',
      modalPlaceholder: options.placeholder || '请输入',
      modalDefaultValue: options.defaultValue || '',
      modalConfirmText: options.confirmText || '确定',
      modalCancelText: options.cancelText || '取消',
      modalCallback: options.success || null
    });
  },

  showActionSheetModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'actionSheet',
      modalItemList: options.itemList || [],
      modalCallback: options.success || null
    });
  },

  onModalConfirm(e) {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback) {
      if (this.data.modalType === 'input') {
        callback({ confirm: true, content: e.detail.value });
      } else {
        callback({ confirm: true });
      }
    }
  },

  onModalCancel() {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback && this.data.modalType !== 'actionSheet') {
      callback({ cancel: true });
    }
  },

  onModalSelect(e) {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback) {
      callback({ tapIndex: e.detail.index });
    }
  },

  onLoad() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    // 从配置文件读取热门搜索
    const config = getConfig();
    this.setData({ hotSearches: config.hot_search_words || [] });
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
    this.showConfirmModal({
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
