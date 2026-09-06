// pages/followup-schedule/followup-schedule.js
const { getFollowupSchedule } = require('../../utils/data');

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
    const list = getFollowupSchedule() || [];
    this.setData({ list });
  },

  onItemTap(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.list[index];
    if (item && item.detail) {
      wx.showModal({
        title: item.title,
        content: item.detail,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  }
});
