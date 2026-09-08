// pages/about/about.js
const app = getApp();

Page({
  data: {
    statusBarHeight: 20,
    version: '1.0.0',
    dataVersion: '2026.08.30',
    channelCount: 122,
    scriptCount: 6,
    lawCount: 36,
    categoryCount: 10,
    navTitle: '关于我们',
    showDisclaimer: false,
    fromSettings: false,
    showLicense: false
  },

  onLoad(options) {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }

    // 处理从设置页面跳转过来的tab参数
    if (options && options.tab === 'disclaimer') {
      this.setData({ 
        navTitle: '免责声明',
        fromSettings: true
      });
      // 延迟一点显示免责声明，确保页面加载完成
      setTimeout(() => {
        this.onViewDisclaimer();
      }, 300);
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

  // 查看免责声明
  onViewDisclaimer() {
    this.setData({ showDisclaimer: true });
  },

  // 关闭免责声明
  onCloseDisclaimer() {
    this.setData({ showDisclaimer: false });
    // 如果是从设置页面跳转过来的，关闭后自动返回
    if (this.data.fromSettings) {
      setTimeout(() => {
        wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/profile/profile' }) });
      }, 200);
    }
  },

  // 返回
  onBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/profile/profile' }) });
  }
});
