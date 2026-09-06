// pages/profile/profile.js
const app = getApp();
const { getChannelById, getScriptById } = require('../../utils/data.js');

Page({
  data: {
    userInfo: null,
    favoriteChannels: 0,
    favoriteScripts: 0,
    searchCount: 0,
    toolList: [
      { icon: '📋', name: '我的投诉记录', desc: '查看投诉进度', color: '#E6F4FF' },
      { icon: '⭐', name: '我的收藏', desc: '收藏的渠道和话术', color: '#F6FFED' },
      { icon: '📝', name: '证据管理', desc: '保存投诉证据', color: '#FFFBE6' },
      { icon: '⏰', name: '投诉进度提醒', desc: '重要节点提醒', color: '#FFF2F0' },
      { icon: '⚖️', name: '法律法规库', desc: '查询相关法律', color: '#F9F0FF' },
      { icon: '💬', name: '意见反馈', desc: '帮助我们改进', color: '#E6FFFB' },
      { icon: 'ℹ️', name: '关于我们', desc: '版本信息', color: '#F0F5FF' }
    ]
  },

  // 内部状态：缓存的统计数据（避免tab切换时重复setData）
  _cachedStats: { channels: -1, scripts: -1, history: -1 },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  loadStats() {
    const favorites = app.globalData.favorites;
    const history = app.globalData.searchHistory;
    const channelCount = favorites.channels.length;
    const scriptCount = favorites.scripts.length;
    const historyCount = history.length;

    // 只有在数据真正变化时才setData，避免不必要的渲染
    if (this._cachedStats.channels === channelCount &&
        this._cachedStats.scripts === scriptCount &&
        this._cachedStats.history === historyCount) {
      return;
    }

    this._cachedStats = {
      channels: channelCount,
      scripts: scriptCount,
      history: historyCount
    };

    this.setData({
      favoriteChannels: channelCount,
      favoriteScripts: scriptCount,
      searchCount: historyCount
    });
  },

  onToolTap(e) {
    const index = e.currentTarget.dataset.index;
    const tool = this.data.toolList[index];

    if (tool.name === '我的收藏') {
      wx.showToast({ title: '收藏功能开发中', icon: 'none' });
    } else if (tool.name === '关于我们') {
      wx.showModal({
        title: '关于我不能被欺负',
        content: '我不能被欺负 v1.0.0 MVP版\n\n一款帮助消费者快速找到官方投诉渠道的工具。\n\n数据来源：公开官方信息\n免责声明：本工具仅供参考，具体投诉以官方渠道为准。',
        showCancel: false,
        confirmText: '知道了'
      });
    } else {
      wx.showToast({ title: `${tool.name}开发中`, icon: 'none' });
    }
  },

  onFavoriteTap() {
    wx.showToast({ title: '收藏功能开发中', icon: 'none' });
  },

  // 统计栏点击
  onStatTap(e) {
    const type = e.currentTarget.dataset.type;
    
    if (type === 'channels') {
      const favorites = app.getFavorites('channels');
      if (favorites.length === 0) {
        wx.showToast({ title: '暂无收藏渠道', icon: 'none' });
      } else {
        // 获取渠道实际名称
        const channelNames = favorites.map((id, i) => {
          const channel = getChannelById(id);
          return `${i+1}. ${channel ? channel.name : '渠道ID: ' + id}`;
        }).join('\n');
        
        wx.showModal({
          title: `收藏的渠道（${favorites.length}个）`,
          content: channelNames,
          showCancel: false,
          confirmText: '知道了'
        });
      }
    } else if (type === 'scripts') {
      const favorites = app.getFavorites('scripts');
      if (favorites.length === 0) {
        wx.showToast({ title: '暂无收藏话术', icon: 'none' });
      } else {
        // 获取话术实际名称
        const scriptNames = favorites.map((id, i) => {
          const script = getScriptById(id);
          return `${i+1}. ${script ? script.title || script.name : '话术ID: ' + id}`;
        }).join('\n');
        
        wx.showModal({
          title: `收藏的话术（${favorites.length}个）`,
          content: scriptNames,
          showCancel: false,
          confirmText: '知道了'
        });
      }
    } else if (type === 'search') {
      const history = app.getSearchHistory();
      if (history.length === 0) {
        wx.showToast({ title: '暂无搜索记录', icon: 'none' });
      } else {
        wx.showModal({
          title: `搜索历史（共${this.data.searchCount}条）`,
          content: '最近搜索：\n' + history.slice(0, 10).map((k, i) => `${i+1}. ${k}`).join('\n'),
          showCancel: true,
          cancelText: '清空历史',
          confirmText: '知道了',
          success: (res) => {
            if (res.cancel) {
              app.clearSearchHistory();
              this._cachedStats = { channels: -1, scripts: -1, history: -1 };
              this.onShow();
              wx.showToast({ title: '搜索历史已清空', icon: 'success' });
            }
          }
        });
      }
    }
  },
});
