// pages/profile/profile.js
const app = getApp();

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

  onLoad() {
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  loadStats() {
    const favorites = app.globalData.favorites;
    const history = app.globalData.searchHistory;
    this.setData({
      favoriteChannels: favorites.channels.length,
      favoriteScripts: favorites.scripts.length,
      searchCount: history.length
    });
  },

  onToolTap(e) {
    const index = e.currentTarget.dataset.index;
    const tool = this.data.toolList[index];

    if (tool.name === '我的收藏') {
      wx.showToast({ title: '收藏功能开发中', icon: 'none' });
    } else if (tool.name === '关于我们') {
      wx.showModal({
        title: '关于维权通',
        content: '维权通 v1.0.0 MVP版\n\n一款帮助消费者快速找到官方投诉渠道的工具。\n\n数据来源：公开官方信息\n免责声明：本工具仅供参考，具体投诉以官方渠道为准。',
        showCancel: false,
        confirmText: '知道了'
      });
    } else {
      wx.showToast({ title: `${tool.name}开发中`, icon: 'none' });
    }
  },

  onFavoriteTap() {
    wx.showToast({ title: '收藏功能开发中', icon: 'none' });
  }
});
