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
    categoryCount: 10
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
    wx.showModal({
      title: '开源协议',
      content: '本项目采用 MIT 开源协议\n\nMIT License\n\nCopyright (c) 2026 我不能被欺负\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 查看免责声明
  onViewDisclaimer() {
    wx.showModal({
      title: '免责声明',
      content: '1. 本工具为便民信息汇总，非政府官方应用，所有信息仅供参考，不构成法律意见。\n\n2. 具体投诉流程、受理范围和联系方式以各监管部门官方公布为准。\n\n3. 本工具收集的信息均来源于政府官网公开渠道，如有变动请以官方最新公告为准。\n\n4. 用户在使用本工具过程中产生的任何直接或间接损失，本工具不承担任何责任。\n\n5. 投诉应当基于真实事实，不得捏造、歪曲事实，不得诬告陷害他人，否则将承担相应法律责任。',
      showCancel: false,
      confirmText: '我已阅读'
    });
  },

  // 返回
  onBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/profile/profile' }) });
  }
});
