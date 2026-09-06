// pages/hotline-change/hotline-change.js
const { getHotlineChanges } = require('../../utils/data');

Page({
  data: {
    list: [],
    statusBarHeight: 20,
    activeFilter: 'all',
    filteredList: []
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
    const list = getHotlineChanges() || [];
    this.setData({ list, filteredList: list });
  },

  onFilterTap(e) {
    const filter = e.currentTarget.dataset.filter;
    const { list } = this.data;
    let filteredList = list;
    if (filter !== 'all') {
      filteredList = list.filter(item => item.status === filter);
    }
    this.setData({ activeFilter: filter, filteredList });
  },

  onCopyPhone(e) {
    const phone = e.currentTarget.dataset.phone;
    if (!phone) return;
    wx.setClipboardData({
      data: phone,
      success: () => {
        wx.showToast({ title: '号码已复制', icon: 'success' });
      }
    });
  },

  onCallPhone(e) {
    const phone = e.currentTarget.dataset.phone;
    if (!phone) return;
    wx.makePhoneCall({ phoneNumber: phone });
  }
});
