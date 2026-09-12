// subpages/disclaimer/disclaimer.js
const { getStatusBarHeight } = require('../../utils/layout');
Page({
  data: {
    statusBarHeight: 20
  },

  onLoad() {

    this.setData({ statusBarHeight: getStatusBarHeight() });
  },

  onBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/profile/profile' })
    });
  }
});
