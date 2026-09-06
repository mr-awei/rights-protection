// app.js
App({
  globalData: {
    userInfo: null,
    searchHistory: [],
    viewHistory: [],
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

    // 加载浏览历史
    const viewHistory = wx.getStorageSync('viewHistory') || [];
    this.globalData.viewHistory = viewHistory;

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

  // 取消收藏
  removeFavorite(type, id) {
    const list = this.globalData.favorites[type] || [];
    const index = list.indexOf(id);
    if (index > -1) {
      list.splice(index, 1);
      this.globalData.favorites[type] = list;
      wx.setStorageSync('favorites', this.globalData.favorites);
    }
    return true;
  },

  // 获取搜索历史
  getSearchHistory() {
    return this.globalData.searchHistory || [];
  },

  // 添加浏览历史
  addViewHistory(itemType, itemId, itemName, itemExtra) {
    if (!itemType || !itemId) return;
    const history = this.globalData.viewHistory;
    // 去重：同一类型同一ID只保留最新一条
    const existingIndex = history.findIndex(h => h.item_type === itemType && h.item_id === itemId);
    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }
    // 插入到最前面
    history.unshift({
      item_type: itemType,
      item_id: itemId,
      item_name: itemName || '',
      item_extra: itemExtra || '',
      viewed_at: Date.now()
    });
    // 最多保留20条
    if (history.length > 20) {
      history.length = 20;
    }
    this.globalData.viewHistory = history;
    wx.setStorageSync('viewHistory', history);
  },

  // 获取浏览历史
  getViewHistory() {
    return this.globalData.viewHistory || [];
  },

  // 清空浏览历史
  clearViewHistory() {
    this.globalData.viewHistory = [];
    wx.setStorageSync('viewHistory', []);
  }
});
