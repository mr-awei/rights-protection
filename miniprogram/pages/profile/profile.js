// pages/profile/profile.js
const app = getApp();
const { getChannelById, getScriptById } = require('../../utils/data.js');

Page({
  data: {
    userInfo: null,
    favoriteChannels: 0,
    favoriteScripts: 0,
    searchCount: 0,
    viewHistoryCount: 0,
    statusBarHeight: 20,
    // 收藏列表
    activeFavTab: 'channels',
    favoriteChannelList: [],
    favoriteScriptList: [],
    // 浏览历史
    viewHistoryList: [],
    // 工具箱
    toolList: [
      { icon: '📝', name: '通用投诉信模板', desc: '结构化模板，一键复制', color: '#E6F4FF', page: 'general-template' },
      { icon: '🔄', name: '热线变更速查', desc: '已取消/整合热线查询', color: '#F6FFED', page: 'hotline-change' },
      { icon: '⏰', name: '投诉跟进时间表', desc: '法定时限+升级路径', color: '#FFFBE6', page: 'followup-schedule' },
      { icon: '🏢', name: '企业信息查询', desc: '4个官方查询平台', color: '#FFF2F0', page: 'enterprise-query' },
      { icon: '⚖️', name: '法律法规库', desc: '查询相关法律条文', color: '#F9F0FF', page: '' },
      { icon: '💬', name: '意见反馈', desc: '帮助我们改进', color: '#E6FFFB', page: '' },
      { icon: 'ℹ️', name: '关于我们', desc: '版本信息与免责声明', color: '#F0F5FF', page: 'about' }
    ]
  },

  // 内部状态：缓存的统计数据
  _cachedStats: { channels: -1, scripts: -1, history: -1, viewHistory: -1 },

  onLoad() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    this.loadStats();
  },

  onShow() {
    this.loadStats();
    this.loadFavoriteLists();
    this.loadViewHistory();
  },

  loadStats() {
    const favorites = app.globalData.favorites;
    const history = app.globalData.searchHistory;
    const viewHistory = app.globalData.viewHistory;
    const channelCount = favorites.channels.length;
    const scriptCount = favorites.scripts.length;
    const historyCount = history.length;
    const viewHistoryCount = viewHistory.length;

    if (this._cachedStats.channels === channelCount &&
        this._cachedStats.scripts === scriptCount &&
        this._cachedStats.history === historyCount &&
        this._cachedStats.viewHistory === viewHistoryCount) {
      return;
    }

    this._cachedStats = {
      channels: channelCount,
      scripts: scriptCount,
      history: historyCount,
      viewHistory: viewHistoryCount
    };

    this.setData({
      favoriteChannels: channelCount,
      favoriteScripts: scriptCount,
      searchCount: historyCount,
      viewHistoryCount: viewHistoryCount
    });
  },

  // 加载收藏列表
  loadFavoriteLists() {
    const favorites = app.globalData.favorites;
    // 收藏的渠道
    const channelList = favorites.channels.map(id => {
      const channel = getChannelById(id);
      return channel ? {
        id: channel.id,
        name: channel.name,
        phone: channel.phone || '',
        category: channel.category_user || ''
      } : { id, name: '渠道已删除', phone: '', category: '' };
    });
    // 收藏的话术
    const scriptList = favorites.scripts.map(id => {
      const script = getScriptById(id);
      return script ? {
        id: script.id,
        name: script.scene_name || script.name || '投诉话术',
        applicable: script.applicable || ''
      } : { id, name: '话术已删除', applicable: '' };
    });

    this.setData({
      favoriteChannelList: channelList,
      favoriteScriptList: scriptList
    });
  },

  // 加载浏览历史
  loadViewHistory() {
    const history = app.getViewHistory();
    const processed = history.map(item => {
      let name = item.item_name || '';
      let extra = item.item_extra || '';
      let typeLabel = item.item_type === 'channel' ? '渠道' : '话术';
      let typeColor = item.item_type === 'channel' ? '#3B82F6' : '#10B981';
      // 格式化时间
      let timeStr = '';
      if (item.viewed_at) {
        const date = new Date(item.viewed_at);
        timeStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
      return {
        ...item,
        typeLabel,
        typeColor,
        timeStr
      };
    });
    this.setData({ viewHistoryList: processed });
  },

  // 收藏Tab切换
  onFavTabTap(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeFavTab: tab });
  },

  // 点击收藏的渠道
  onFavoriteChannelTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/channel-detail/channel-detail?id=${id}`
    });
  },

  // 点击收藏的话术
  onFavoriteScriptTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/script-detail/script-detail?id=${id}`
    });
  },

  // 取消收藏渠道
  onRemoveFavoriteChannel(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消收藏',
      content: '确定取消收藏该渠道吗？',
      success: (res) => {
        if (res.confirm) {
          app.toggleFavorite('channels', id);
          this._cachedStats = { channels: -1, scripts: -1, history: -1, viewHistory: -1 };
          this.loadStats();
          this.loadFavoriteLists();
          wx.showToast({ title: '已取消收藏', icon: 'success' });
        }
      }
    });
  },

  // 取消收藏话术
  onRemoveFavoriteScript(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消收藏',
      content: '确定取消收藏该话术吗？',
      success: (res) => {
        if (res.confirm) {
          app.toggleFavorite('scripts', id);
          this._cachedStats = { channels: -1, scripts: -1, history: -1, viewHistory: -1 };
          this.loadStats();
          this.loadFavoriteLists();
          wx.showToast({ title: '已取消收藏', icon: 'success' });
        }
      }
    });
  },

  // 点击浏览历史
  onViewHistoryTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.item_type === 'channel') {
      wx.navigateTo({
        url: `/pages/channel-detail/channel-detail?id=${item.item_id}`
      });
    } else if (item.item_type === 'script') {
      wx.navigateTo({
        url: `/pages/script-detail/script-detail?id=${item.item_id}`
      });
    }
  },

  // 清空浏览历史
  onClearViewHistory() {
    wx.showModal({
      title: '清空浏览历史',
      content: '确定清空所有浏览历史吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          app.clearViewHistory();
          this._cachedStats = { channels: -1, scripts: -1, history: -1, viewHistory: -1 };
          this.loadStats();
          this.loadViewHistory();
          wx.showToast({ title: '浏览历史已清空', icon: 'success' });
        }
      }
    });
  },

  // 统计栏点击
  onStatTap(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'channels') {
      // 跳转到收藏历史页面，自动选中渠道Tab
      wx.navigateTo({
        url: '/pages/favorites-history/favorites-history?tab=channels'
      });
    } else if (type === 'scripts') {
      // 跳转到收藏历史页面，自动选中话术Tab
      wx.navigateTo({
        url: '/pages/favorites-history/favorites-history?tab=scripts'
      });
    } else if (type === 'viewHistory') {
      // 跳转到收藏历史页面，自动选中历史Tab
      wx.navigateTo({
        url: '/pages/favorites-history/favorites-history?tab=history'
      });
    } else if (type === 'search') {
      const history = app.getSearchHistory();
      if (history.length === 0) {
        wx.showToast({ title: '暂无搜索记录', icon: 'none' });
      } else {
        wx.showModal({
          title: `搜索历史（共${history.length}条）`,
          content: '最近搜索：\n' + history.slice(0, 10).map((k, i) => `${i+1}. ${k}`).join('\n'),
          showCancel: true,
          cancelText: '清空历史',
          confirmText: '知道了',
          success: (res) => {
            if (res.cancel) {
              app.clearSearchHistory();
              this._cachedStats = { channels: -1, scripts: -1, history: -1, viewHistory: -1 };
              this.loadStats();
              wx.showToast({ title: '搜索历史已清空', icon: 'success' });
            }
          }
        });
      }
    }
  },

  // 查看全部收藏
  onViewAllFavorites(e) {
    const tab = e.currentTarget.dataset.tab || this.data.activeFavTab;
    wx.navigateTo({
      url: `/pages/favorites-history/favorites-history?tab=${tab}`
    });
  },

  // 查看全部历史
  onViewAllHistory() {
    wx.navigateTo({
      url: '/pages/favorites-history/favorites-history?tab=history'
    });
  },

  // 工具箱点击
  onToolTap(e) {
    const index = e.currentTarget.dataset.index;
    const tool = this.data.toolList[index];

    if (tool.page === 'about') {
      wx.navigateTo({ url: '/pages/about/about' });
    } else if (tool.page === '') {
      wx.showToast({ title: `${tool.name}功能开发中`, icon: 'none' });
    } else {
      wx.navigateTo({
        url: `/pages/${tool.page}/${tool.page}`,
        fail: () => {
          wx.showToast({ title: `${tool.name}功能开发中`, icon: 'none' });
        }
      });
    }
  }
});
