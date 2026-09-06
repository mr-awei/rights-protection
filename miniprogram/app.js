// app.js
App({
  globalData: {
    userInfo: null,
    searchHistory: [],
    favorites: {
      channels: [],
      scripts: []
    },
    dataVersion: '2026.08'
  },

  onLaunch() {
    // 加载搜索历史
    const history = wx.getStorageSync('searchHistory') || [];
    this.globalData.searchHistory = history;

    // 加载收藏
    const favorites = wx.getStorageSync('favorites') || { channels: [], scripts: [] };
    this.globalData.favorites = favorites;

    // 检查数据版本
    const savedVersion = wx.getStorageSync('dataVersion');
    if (savedVersion !== this.globalData.dataVersion) {
      wx.setStorageSync('dataVersion', this.globalData.dataVersion);
      console.log('[我不能被欺负] 数据版本已更新至', this.globalData.dataVersion);
    }

    console.log('[我不能被欺负] 小程序启动，数据版本:', this.globalData.dataVersion);
  },

  // 添加搜索历史
  addSearchHistory(keyword) {
    if (!keyword || !keyword.trim()) return;
    const history = this.globalData.searchHistory;
    const index = history.indexOf(keyword);
    if (index > -1) {
      history.splice(index, 1);
    }
    history.unshift(keyword);
    if (history.length > 20) {
      history.pop();
    }
    this.globalData.searchHistory = history;
    wx.setStorageSync('searchHistory', history);
  },

  // 清空搜索历史
  clearSearchHistory() {
    this.globalData.searchHistory = [];
    wx.setStorageSync('searchHistory', []);
  },

  // 切换收藏
  toggleFavorite(type, id) {
    const favorites = this.globalData.favorites;
    const list = favorites[type];
    const index = list.indexOf(id);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(id);
    }
    this.globalData.favorites = favorites;
    wx.setStorageSync('favorites', favorites);
    return index === -1;
  },

  // 检查是否已收藏
  isFavorite(type, id) {
    return this.globalData.favorites[type].indexOf(id) > -1;
  },

  // 获取收藏列表
  getFavorites(type) {
    return this.globalData.favorites[type] || [];
  },

  // 获取搜索历史
  getSearchHistory() {
    return this.globalData.searchHistory || [];
  }
});
