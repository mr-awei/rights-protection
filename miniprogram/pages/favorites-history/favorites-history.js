// pages/favorites-history/favorites-history.js
const app = getApp();
const { getChannelById, getScriptById } = require('../../utils/data');

const PAGE_SIZE = 10; // 每页加载10条

Page({
  data: {
    activeTab: 'channels', // channels: 收藏渠道, scripts: 收藏话术, history: 浏览历史
    statusBarHeight: 0,
    // 列表数据
    channelList: [],
    scriptList: [],
    historyList: [],
    // 分页状态
    channelPage: 1,
    scriptPage: 1,
    historyPage: 1,
    channelHasMore: true,
    scriptHasMore: true,
    historyHasMore: true,
    // 加载状态
    loading: false,
    // 总数
    channelTotal: 0,
    scriptTotal: 0,
    historyTotal: 0
  },

  onLoad(options) {
    // 动态获取状态栏高度
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }

    // 从参数中获取初始Tab
    if (options.tab) {
      this.setData({ activeTab: options.tab });
    }

    this.loadAllData();
  },

  onShow() {
    // 页面显示时刷新数据（可能从详情页返回收藏状态变化）
    this.refreshCurrentTab();
  },

  // 加载所有数据的总数
  loadAllData() {
    const favorites = app.getFavorites() || { channels: [], scripts: [] };
    const viewHistory = app.getViewHistory() || [];

    this.setData({
      channelTotal: favorites.channels.length,
      scriptTotal: favorites.scripts.length,
      historyTotal: viewHistory.length
    });

    // 加载当前Tab的第一页
    this.loadCurrentTab(1);
  },

  // 刷新当前Tab
  refreshCurrentTab() {
    const favorites = app.getFavorites() || { channels: [], scripts: [] };
    const viewHistory = app.getViewHistory() || [];

    this.setData({
      channelTotal: favorites.channels.length,
      scriptTotal: favorites.scripts.length,
      historyTotal: viewHistory.length
    });

    this.loadCurrentTab(1);
  },

  // 加载当前Tab的数据
  loadCurrentTab(page) {
    const tab = this.data.activeTab;
    if (tab === 'channels') {
      this.loadChannels(page);
    } else if (tab === 'scripts') {
      this.loadScripts(page);
    } else if (tab === 'history') {
      this.loadHistory(page);
    }
  },

  // 加载收藏渠道
  loadChannels(page) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const favorites = app.getFavorites() || { channels: [] };
    const allIds = favorites.channels || [];
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageIds = allIds.slice(start, end);

    const list = pageIds.map(id => {
      try {
        return getChannelById(id) || { id, name: '未知渠道', category: '已删除' };
      } catch (e) {
        return { id, name: '未知渠道', category: '已删除' };
      }
    });

    const newList = page === 1 ? list : [...this.data.channelList, ...list];

    this.setData({
      channelList: newList,
      channelPage: page,
      channelHasMore: end < allIds.length,
      loading: false
    });
  },

  // 加载收藏话术
  loadScripts(page) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const favorites = app.getFavorites() || { scripts: [] };
    const allIds = favorites.scripts || [];
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageIds = allIds.slice(start, end);

    const list = pageIds.map(id => {
      try {
        return getScriptById(id) || { id, name: '未知话术', applicable: '已删除' };
      } catch (e) {
        return { id, name: '未知话术', applicable: '已删除' };
      }
    });

    const newList = page === 1 ? list : [...this.data.scriptList, ...list];

    this.setData({
      scriptList: newList,
      scriptPage: page,
      scriptHasMore: end < allIds.length,
      loading: false
    });
  },

  // 加载浏览历史
  loadHistory(page) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    const allHistory = app.getViewHistory() || [];
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageList = allHistory.slice(start, end);

    const newList = page === 1 ? pageList : [...this.data.historyList, ...pageList];

    this.setData({
      historyList: newList,
      historyPage: page,
      historyHasMore: end < allHistory.length,
      loading: false
    });
  },

  // Tab切换
  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;

    this.setData({ activeTab: tab });
    this.loadCurrentTab(1);
  },

  // 点击收藏渠道
  onChannelTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/channel-detail/channel-detail?id=${id}`
    });
  },

  // 点击收藏话术
  onScriptTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/script-detail/script-detail?id=${id}`
    });
  },

  // 点击浏览历史
  onHistoryTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.type === 'channel') {
      wx.navigateTo({
        url: `/pages/channel-detail/channel-detail?id=${item.item_id}`
      });
    } else if (item.type === 'script') {
      wx.navigateTo({
        url: `/pages/script-detail/script-detail?id=${item.item_id}`
      });
    }
  },

  // 取消收藏渠道
  onRemoveChannel(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏这个渠道吗？',
      confirmText: '取消收藏',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          app.removeFavorite('channels', id);
          wx.showToast({ title: '已取消收藏', icon: 'success' });
          this.refreshCurrentTab();
        }
      }
    });
  },

  // 取消收藏话术
  onRemoveScript(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏这个话术吗？',
      confirmText: '取消收藏',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          app.removeFavorite('scripts', id);
          wx.showToast({ title: '已取消收藏', icon: 'success' });
          this.refreshCurrentTab();
        }
      }
    });
  },

  // 清空浏览历史
  onClearHistory() {
    wx.showModal({
      title: '清空历史',
      content: '确定要清空所有浏览历史吗？此操作不可恢复。',
      confirmText: '清空',
      cancelText: '取消',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          app.clearViewHistory();
          wx.showToast({ title: '已清空历史', icon: 'success' });
          this.refreshCurrentTab();
        }
      }
    });
  },

  // 滚动到底部加载更多
  onReachBottom() {
    const tab = this.data.activeTab;
    let hasMore = false;
    let nextPage = 1;

    if (tab === 'channels') {
      hasMore = this.data.channelHasMore;
      nextPage = this.data.channelPage + 1;
    } else if (tab === 'scripts') {
      hasMore = this.data.scriptHasMore;
      nextPage = this.data.scriptPage + 1;
    } else if (tab === 'history') {
      hasMore = this.data.historyHasMore;
      nextPage = this.data.historyPage + 1;
    }

    if (hasMore && !this.data.loading) {
      this.loadCurrentTab(nextPage);
    }
  },

  // 返回
  onBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/profile/profile' });
      }
    });
  }
});
