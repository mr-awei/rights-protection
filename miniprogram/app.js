// app.js
const { tracker } = require('./utils/tracker');

App({
  globalData: {
    userInfo: null,
    searchHistory: [],
    viewHistory: [],
    favorites: {
      channels: [],
      scripts: []
    },
    searchLogs: [],
    dataVersion: '2026.09.4',
    pendingCategory: null,
    tracker: tracker
  },

  // 全局埋点方法
  trackEvent(type, params = {}) {
    try {
      tracker.track(type, params);
    } catch (e) {
      console.warn('[埋点] 记录失败:', e);
    }
  },

  trackPageView(pagePath, extra = {}) {
    try {
      tracker.trackPageView(pagePath, extra);
    } catch (e) {
      console.warn('[埋点] 页面浏览记录失败:', e);
    }
  },

  onLaunch() {
    // 启动性能监控
    const startTime = Date.now();
    this.globalData._launchStartTime = startTime;

    // 启动埋点
    try {
      tracker.track('app_launch', {
        launch_time: Date.now(),
        data_version: this.globalData.dataVersion
      });
    } catch (e) {
      console.warn('[埋点] 启动记录失败:', e);
    }

    // ========== 核心初始化（同步，必须立即完成）==========

    // 加载收藏（核心功能，首页需要）
    try {
      const favorites = wx.getStorageSync('favorites') || { channels: [], scripts: [] };
      this.globalData.favorites = favorites;
    } catch (e) {
      console.error('[启动] 加载收藏失败:', e);
      this.globalData.favorites = { channels: [], scripts: [] };
    }

    // 加载搜索历史（搜索页需要，轻量）
    try {
      const history = wx.getStorageSync('searchHistory') || [];
      this.globalData.searchHistory = history;
    } catch (e) {
      console.error('[启动] 加载搜索历史失败:', e);
      this.globalData.searchHistory = [];
    }

    // 检查数据版本（轻量）
    try {
      const savedVersion = wx.getStorageSync('dataVersion');
      if (savedVersion !== this.globalData.dataVersion) {
        wx.setStorageSync('dataVersion', this.globalData.dataVersion);
        this.globalData._showChangelog = true;

      }
    } catch (e) {
      console.error('[启动] 检查数据版本失败:', e);
    }

    // 离线模式：检测网络状态
    this._initNetworkStatus();

    // 离线模式：预加载核心数据到内存（提升离线体验）
    this._preloadCoreData();

    // ========== 非核心初始化（异步延迟，不阻塞启动）==========

    setTimeout(() => {
      // 加载搜索日志（用于后续搜索优化，非核心）
      try {
        const searchLogs = wx.getStorageSync('searchLogs') || [];
        this.globalData.searchLogs = searchLogs;
      } catch (e) {
        console.error('[启动] 加载搜索日志失败:', e);
        this.globalData.searchLogs = [];
      }

      // 加载浏览历史（含数据迁移，较重，延迟执行）
      try {
        const rawViewHistory = wx.getStorageSync('viewHistory') || [];
        // 数据迁移：确保浏览历史格式统一，兼容旧格式
        const viewHistory = rawViewHistory.map(item => {
          if (!item) return null;
          // 新格式：直接使用
          if (item.item_type && item.item_id) {
            return {
              item_type: item.item_type,
              item_id: item.item_id,
              item_name: item.item_name || '',
              item_extra: item.item_extra || '',
              viewed_at: item.viewed_at || Date.now()
            };
          }
          // 旧格式兼容：尝试从各种可能的字段名中获取数据
          const itemType = item.item_type || item.type || '';
          const itemId = item.item_id || item.id || '';
          const itemName = item.item_name || item.name || item.title || '';
          const viewedAt = item.viewed_at || item.time || item.create_time || Date.now();
          // 如果没有类型和ID，说明是无效数据，跳过
          if (!itemType || !itemId) return null;
          return {
            item_type: itemType,
            item_id: itemId,
            item_name: itemName,
            item_extra: item.item_extra || item.extra || '',
            viewed_at: viewedAt
          };
        }).filter(item => item !== null);
        this.globalData.viewHistory = viewHistory;
        // 如果数据有变化，保存回storage
        if (JSON.stringify(viewHistory) !== JSON.stringify(rawViewHistory)) {
          wx.setStorageSync('viewHistory', viewHistory);
        }
      } catch (e) {
        console.error('[启动] 加载浏览历史失败:', e);
        this.globalData.viewHistory = [];
      }

      // 记录启动完成时间
      const launchDuration = Date.now() - startTime;
      this.globalData._launchDuration = launchDuration;

    }, 0);
  },

  // ========== 性能监控 ==========

  // 获取启动耗时（毫秒）
  getLaunchDuration() {
    return this.globalData._launchDuration || 0;
  },

  // 页面性能打点
  markPageLoad(pageName) {
    if (!this.globalData._pageLoadTimes) {
      this.globalData._pageLoadTimes = {};
    }
    this.globalData._pageLoadTimes[pageName] = Date.now();
  },

  // 记录页面加载完成
  markPageLoaded(pageName) {
    if (this.globalData._pageLoadTimes && this.globalData._pageLoadTimes[pageName]) {
      const duration = Date.now() - this.globalData._pageLoadTimes[pageName];

      delete this.globalData._pageLoadTimes[pageName];
      return duration;
    }
    return 0;
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

  // 记录搜索日志（匿名，用于后续搜索优化）
  logSearch(keyword, resultCount, searchType) {
    if (!keyword || !keyword.trim()) return;
    const log = {
      keyword: keyword.trim(),
      result_count: resultCount || 0,
      search_type: searchType || 'search',
      searched_at: Date.now()
    };
    const logs = this.globalData.searchLogs;
    logs.unshift(log);
    // 最多保留100条
    if (logs.length > 100) {
      logs.length = 100;
    }
    this.globalData.searchLogs = logs;
    wx.setStorageSync('searchLogs', logs);
  },

  // 获取搜索日志
  getSearchLogs() {
    return this.globalData.searchLogs || [];
  },

  // 清空搜索日志
  clearSearchLogs() {
    this.globalData.searchLogs = [];
    wx.setStorageSync('searchLogs', []);
  },
  // ========== 搜索日志分析与标签优化 ==========

  /**
   * 分析搜索日志，返回统计结果
   * 用于优化热门搜索词、渠道标签、无结果引导
   */
  analyzeSearchLogs() {
    const logs = this.globalData.searchLogs || [];
    if (logs.length === 0) {
      return {
        total: 0,
        topKeywords: [],
        noResultKeywords: [],
        avgResultCount: 0,
        searchTypeDistribution: {}
      };
    }

    // 统计关键词出现次数
    const keywordCount = {};
    const noResultKeywords = [];
    let totalResults = 0;
    const typeDistribution = {};

    logs.forEach(log => {
      const kw = log.keyword || '';
      if (kw) {
        keywordCount[kw] = (keywordCount[kw] || 0) + 1;
        totalResults += log.result_count || 0;
        if (log.result_count === 0) {
          noResultKeywords.push(kw);
        }
        const type = log.search_type || 'all';
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      }
    });

    // 按出现次数排序，取Top 20
    const topKeywords = Object.keys(keywordCount)
      .map(kw => ({ keyword: kw, count: keywordCount[kw] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // 无结果搜索词去重并统计
    const noResultCount = {};
    noResultKeywords.forEach(kw => {
      noResultCount[kw] = (noResultCount[kw] || 0) + 1;
    });
    const noResultTop = Object.keys(noResultCount)
      .map(kw => ({ keyword: kw, count: noResultCount[kw] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: logs.length,
      topKeywords: topKeywords,
      noResultKeywords: noResultTop,
      avgResultCount: totalResults / logs.length,
      searchTypeDistribution: typeDistribution
    };
  },

  /**
   * 基于搜索日志优化热门搜索词
   * 将高频搜索词加入热门搜索列表（去重，最多20个）
   */
  optimizeHotSearchWords() {
    const analysis = this.analyzeSearchLogs();
    if (analysis.topKeywords.length === 0) return [];

    // 获取当前热门搜索词
    const config = require('./data/config.js');
    const currentHot = config.hot_search_words || [];

    // 合并：高频搜索词优先，然后是原有热门词，去重
    const merged = [];
    const seen = new Set();

    // 先加高频搜索词（搜索次数>=2的）
    analysis.topKeywords.forEach(item => {
      if (item.count >= 2 && !seen.has(item.keyword)) {
        merged.push(item.keyword);
        seen.add(item.keyword);
      }
    });

    // 再加原有热门词
    currentHot.forEach(kw => {
      if (!seen.has(kw)) {
        merged.push(kw);
        seen.add(kw);
      }
    });

    return merged.slice(0, 20);
  },

  /**
   * 获取无结果搜索词的推荐引导
   * 用于无结果页面的推荐优化
   */
  getNoResultSuggestions(keyword) {
    const analysis = this.analyzeSearchLogs();
    // 如果当前搜索词是高频无结果词，推荐相关热门搜索
    const isNoResult = analysis.noResultKeywords.some(item => item.keyword === keyword);

    if (isNoResult) {
      // 返回高频搜索词作为推荐
      return analysis.topKeywords.slice(0, 8).map(item => item.keyword);
    }
    return [];
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

  // ========== 收藏分组管理 ==========

  // 获取所有收藏分组
  getFavoriteGroups() {
    if (!this.globalData.favorites.groups) {
      this.globalData.favorites.groups = [
        { id: 'default', name: '默认分组', type: 'system', created_at: Date.now() }
      ];
      wx.setStorageSync('favorites', this.globalData.favorites);
    }
    return this.globalData.favorites.groups || [];
  },

  // 创建收藏分组
  createFavoriteGroup(name) {
    if (!name || !name.trim()) {
      this.showErrorToast('分组名称不能为空');
      return null;
    }
    const groups = this.getFavoriteGroups();
    const groupId = 'group_' + Date.now();
    groups.push({
      id: groupId,
      name: name.trim(),
      type: 'custom',
      items: [],
      created_at: Date.now()
    });
    this.globalData.favorites.groups = groups;
    wx.setStorageSync('favorites', this.globalData.favorites);
    return groupId;
  },

  // 删除收藏分组
  deleteFavoriteGroup(groupId) {
    if (groupId === 'default') {
      this.showErrorToast('默认分组不能删除');
      return false;
    }
    const groups = this.getFavoriteGroups();
    const index = groups.findIndex(g => g.id === groupId);
    if (index > -1) {
      groups.splice(index, 1);
      this.globalData.favorites.groups = groups;
      wx.setStorageSync('favorites', this.globalData.favorites);
      return true;
    }
    return false;
  },

  // 重命名收藏分组
  renameFavoriteGroup(groupId, newName) {
    if (!newName || !newName.trim()) {
      this.showErrorToast('分组名称不能为空');
      return false;
    }
    if (groupId === 'default') {
      this.showErrorToast('默认分组不能重命名');
      return false;
    }
    const groups = this.getFavoriteGroups();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.name = newName.trim();
      group.updated_at = Date.now();
      this.globalData.favorites.groups = groups;
      wx.setStorageSync('favorites', this.globalData.favorites);
      return true;
    }
    return false;
  },

  // 分组排序（上移/下移/置顶）
  moveFavoriteGroup(groupId, direction) {
    const groups = this.getFavoriteGroups();
    const index = groups.findIndex(g => g.id === groupId);
    if (index === -1) return false;

    // 默认分组始终在第一位
    if (groupId === 'default') return false;

    let newIndex = index;
    if (direction === 'up') {
      newIndex = Math.max(1, index - 1); // 不能移到默认分组前面
    } else if (direction === 'down') {
      newIndex = Math.min(groups.length - 1, index + 1);
    } else if (direction === 'top') {
      newIndex = 1; // 移到默认分组后面
    }

    if (newIndex === index) return false;

    // 移动元素
    const [removed] = groups.splice(index, 1);
    groups.splice(newIndex, 0, removed);

    this.globalData.favorites.groups = groups;
    wx.setStorageSync('favorites', this.globalData.favorites);
    return true;
  },

  // 批量移动收藏到指定分组
  batchMoveFavorites(itemKeys, targetGroupId) {
    if (!itemKeys || itemKeys.length === 0) {
      this.showErrorToast('请选择要移动的收藏');
      return false;
    }
    const groups = this.getFavoriteGroups();
    const targetGroup = groups.find(g => g.id === targetGroupId);
    if (!targetGroup) {
      this.showErrorToast('目标分组不存在');
      return false;
    }
    if (!targetGroup.items) targetGroup.items = [];

    // 从所有分组中移除这些item，然后添加到目标分组
    groups.forEach(group => {
      if (!group.items) return;
      if (group.id === targetGroupId) return; // 跳过目标分组
      group.items = group.items.filter(item => !itemKeys.includes(item));
    });

    // 添加到目标分组（去重）
    itemKeys.forEach(itemKey => {
      if (targetGroup.items.indexOf(itemKey) === -1) {
        targetGroup.items.push(itemKey);
      }
    });

    this.globalData.favorites.groups = groups;
    wx.setStorageSync('favorites', this.globalData.favorites);
    return true;
  },

  // 批量删除收藏
  batchDeleteFavorites(itemKeys) {
    if (!itemKeys || itemKeys.length === 0) {
      this.showErrorToast('请选择要删除的收藏');
      return false;
    }
    const groups = this.getFavoriteGroups();
    groups.forEach(group => {
      if (!group.items) return;
      group.items = group.items.filter(item => !itemKeys.includes(item));
    });
    this.globalData.favorites.groups = groups;
    wx.setStorageSync('favorites', this.globalData.favorites);
    return true;
  },

  // 添加收藏到指定分组
  addToFavoriteGroup(type, id, groupId) {
    const groups = this.getFavoriteGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      this.showErrorToast('分组不存在');
      return false;
    }
    if (!group.items) group.items = [];
    const itemKey = type + ':' + id;
    if (group.items.indexOf(itemKey) === -1) {
      group.items.push(itemKey);
      this.globalData.favorites.groups = groups;
      wx.setStorageSync('favorites', this.globalData.favorites);
    }
    return true;
  },

  // 从分组移除收藏
  removeFromFavoriteGroup(type, id, groupId) {
    const groups = this.getFavoriteGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.items) return false;
    const itemKey = type + ':' + id;
    const index = group.items.indexOf(itemKey);
    if (index > -1) {
      group.items.splice(index, 1);
      this.globalData.favorites.groups = groups;
      wx.setStorageSync('favorites', this.globalData.favorites);
      return true;
    }
    return false;
  },

  // 获取分组下的收藏列表
  getFavoritesByGroup(groupId) {
    const groups = this.getFavoriteGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.items) return [];
    return group.items.map(item => {
      const [type, id] = item.split(':');
      return { type, id };
    });
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
  },

  // 删除单条浏览历史
  removeViewHistory(itemType, itemId) {
    if (!itemType || !itemId) return;
    const history = this.globalData.viewHistory || [];
    const index = history.findIndex(h => h.item_type === itemType && h.item_id === itemId);
    if (index > -1) {
      history.splice(index, 1);
      this.globalData.viewHistory = history;
      wx.setStorageSync('viewHistory', history);
    }
  },

  // ========== 离线模式优化 ==========

  // 初始化网络状态监听
  _initNetworkStatus() {
    try {
      // 获取当前网络状态
      wx.getNetworkType({
        success: (res) => {
          this.globalData._networkType = res.networkType;
          this.globalData._isOffline = res.networkType === 'none';

        }
      });

      // 监听网络状态变化
      wx.onNetworkStatusChange((res) => {
        const wasOffline = this.globalData._isOffline;
        this.globalData._networkType = res.networkType;
        this.globalData._isOffline = !res.isConnected;

        // 从离线恢复在线时，提示用户
        if (wasOffline && !this.globalData._isOffline) {
          wx.showToast({
            title: '网络已恢复',
            icon: 'success',
            duration: 1500
          });
        }
        // 进入离线状态时，提示用户
        else if (!wasOffline && this.globalData._isOffline) {
          wx.showToast({
            title: '当前为离线模式',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } catch (e) {
      console.error('[离线] 网络状态初始化失败:', e);
    }
  },

  // 预加载核心数据到内存（提升离线体验和启动速度）
  _preloadCoreData() {
    try {
      // 延迟预加载，不阻塞启动
      setTimeout(() => {
        const data = require('./utils/data');
        // 预加载渠道索引（核心数据）- loadAllData是同步函数
        try {
          data.loadAllData();

        } catch (e) {
          console.error('[离线] 核心数据预加载失败:', e);
        }
      }, 500);
    } catch (e) {
      console.error('[离线] 预加载初始化失败:', e);
    }
  },

  // 获取当前网络状态
  getNetworkStatus() {
    return {
      isOffline: this.globalData._isOffline === true,
      networkType: this.globalData._networkType || 'unknown'
    };
  },

  // 检查是否离线
  isOffline() {
    return this.globalData._isOffline === true;
  },

  // ========== 全局自定义弹窗方法 ==========
  // 全局弹窗：优先调用当前页面的自定义弹窗，否则降级使用原生弹窗
  showGlobalModal(options) {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    if (currentPage && typeof currentPage.showConfirmModal === 'function') {
      currentPage.showConfirmModal(options);
    } else {
      // 降级使用原生弹窗
      wx.showModal({
        title: options.title || '提示',
        content: options.content || '',
        showCancel: options.showCancel !== false,
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        success: (res) => {
          if (res.confirm && options.success) options.success({ confirm: true });
          if (res.cancel && options.success) options.success({ cancel: true });
        }
      });
    }
  },

  // 离线模式提示（在需要网络的功能前调用）
  showOfflineTip() {
    if (this.isOffline()) {
      this.showGlobalModal({
        title: '当前为离线模式',
        content: '该功能需要网络连接，请检查网络设置后重试。核心查询功能仍可离线使用。',
        showCancel: false,
        confirmText: '知道了'
      });
      return true;
    }
    return false;
  },

  // ========== 全局错误处理 ==========

  // 显示错误提示
  showError(title, content) {
    this.showGlobalModal({
      title: title || '出错了',
      content: content || '抱歉，操作失败，请稍后重试',
      showCancel: false,
      confirmText: '知道了'
    });
  },
  // ========== 数据更新提示（Changelog）==========

  // 检查是否需要展示更新日志
  shouldShowChangelog() {
    return this.globalData._showChangelog === true;
  },

  // 展示更新日志弹窗
  showChangelog(callback) {
    try {
      const data = require('./data/config.js');
      const changelog = data.changelog || [];
      if (changelog.length === 0) {
        if (callback) callback();
        return;
      }

      const latest = changelog[0];
      const itemsText = latest.items.map((item, index) => `${index + 1}. ${item}`).join('\n');

      this.showGlobalModal({
        title: latest.title || '数据更新',
        content: `版本：${latest.version}\n日期：${latest.date}\n\n本次更新：\n${itemsText}`,
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          this.globalData._showChangelog = false;
          if (callback) callback();
        }
      });
    } catch (e) {
      console.error('[更新日志] 展示失败:', e);
      this.globalData._showChangelog = false;
      if (callback) callback();
    }
  },

  // 获取完整更新日志
  getChangelog() {
    try {
      const data = require('./data/config.js');
      return data.changelog || [];
    } catch (e) {
      console.error('[更新日志] 获取失败:', e);
      return [];
    }
  },

  // 显示轻量错误提示（toast）
  showErrorToast(msg) {
    wx.showToast({
      title: msg || '操作失败',
      icon: 'none',
      duration: 2000
    });
  },

  // 显示加载中
  showLoading(title) {
    wx.showLoading({
      title: title || '加载中...',
      mask: true
    });
  },

  // 隐藏加载中
  hideLoading() {
    wx.hideLoading();
  },

  // 安全执行函数，自动捕获错误并提示
  safeExecute(fn, errorMsg) {
    try {
      return fn();
    } catch (e) {
      console.error('[safeExecute] 错误:', e);
      if (errorMsg) {
        this.showErrorToast(errorMsg);
      }
      return null;
    }
  },

  // 安全的异步执行
  async safeExecuteAsync(fn, errorMsg) {
    try {
      return await fn();
    } catch (e) {
      console.error('[safeExecuteAsync] 错误:', e);
      if (errorMsg) {
        this.showErrorToast(errorMsg);
      }
      return null;
    }
  },

  // ========== 全局错误监听 ==========

  // 全局错误监听（小程序发生未捕获错误时触发）
  onError(error) {
    console.error('[全局错误]', error);
    try {
      // 记录错误埋点
      if (this.globalData.tracker) {
        this.globalData.tracker.trackError('global_error', String(error).substring(0, 500));
      }
    } catch (e) {
      console.warn('[全局错误] 埋点记录失败:', e);
    }
  },

  // 全局未处理的Promise拒绝监听
  onUnhandledRejection(res) {
    console.error('[全局Promise拒绝]', res);
    try {
      const reason = res.reason ? String(res.reason).substring(0, 500) : 'unknown';
      if (this.globalData.tracker) {
        this.globalData.tracker.trackError('unhandled_promise_rejection', reason);
      }
    } catch (e) {
      console.warn('[全局Promise拒绝] 埋点记录失败:', e);
    }
  }
});
