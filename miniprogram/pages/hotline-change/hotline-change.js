// pages/hotline-change/hotline-change.js
const { getHotlineChanges } = require('../../utils/data');

Page({
  data: {
    list: [],
    statusBarHeight: 20,
    activeFilter: 'all',
    searchKeyword: '',
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

  applyFilter() {
    const { list, activeFilter, searchKeyword } = this.data;
    let result = list;
    if (activeFilter !== 'all') {
      result = result.filter(item => item.status === activeFilter);
    }
    if (searchKeyword && searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter(item =>
        (item.original_name && item.original_name.toLowerCase().includes(kw)) ||
        (item.original && item.original.toLowerCase().includes(kw)) ||
        (item.replacement_name && item.replacement_name.toLowerCase().includes(kw)) ||
        (item.replacement && item.replacement.toLowerCase().includes(kw)) ||
        (item.note && item.note.toLowerCase().includes(kw))
      );
    }
    this.setData({ filteredList: result });
  },

  onFilterTap(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ activeFilter: filter });
    this.applyFilter();
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.applyFilter();
  },

  onClearSearch() {
    this.setData({ searchKeyword: '' });
    this.applyFilter();
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
