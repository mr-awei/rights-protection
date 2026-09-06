// pages/enterprise-query/enterprise-query.js
const { getEnterpriseQueries } = require('../../utils/data');

Page({
  data: {
    list: [],
    statusBarHeight: 20
  },

  onLoad() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    this.loadData();
  },

  loadData() {
    const list = getEnterpriseQueries() || [];
    this.setData({ list });
  },

  onCopyUrl(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '网址已复制，请用外部浏览器打开', icon: 'none', duration: 2000 });
      }
    });
  },

  onItemTap(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.list[index];
    if (item && item.description) {
      wx.showModal({
        title: item.name,
        content: item.description,
        showCancel: true,
        cancelText: '复制网址',
        confirmText: '知道了',
        success: (res) => {
          if (res.cancel && item.url) {
            this.onCopyUrl({ currentTarget: { dataset: { url: item.url } } });
          }
        }
      });
    }
  }
});
