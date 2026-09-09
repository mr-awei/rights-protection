// subsubsubpages/about/about.js
const app = getApp();

Page({
  data: {
    statusBarHeight: 20,
    version: '1.1.3',
    dataVersion: '2026.09.4',
    channelCount: 122,
    scriptCount: 19,
    lawCount: 90,
    categoryCount: 5,
    navTitle: '关于我们',
    showLicense: false
  },

  onLoad() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
  },

  // 复制联系方式
  onCopyContact(e) {
    const text = e.currentTarget.dataset.text;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 查看开源协议
  onViewLicense() {
    this.setData({ showLicense: true });
  },

  // 关闭开源协议
  onCloseLicense() {
    this.setData({ showLicense: false });
  },

  // 复制商业授权邮箱
  onCopyEmail() {
    wx.setClipboardData({
      data: 'new_mr_awei@163.com',
      success: () => {
        wx.showToast({ title: '邮箱已复制', icon: 'success' });
      }
    });
  },

  // 查看免责声明（独立页面）
  onViewDisclaimer() {
    wx.navigateTo({ url: '/subpages/disclaimer/disclaimer' });
  },

  // 返回
  onBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/profile/profile' }) });
  }
});
