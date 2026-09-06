// pages/general-template/general-template.js
const app = getApp();
const { getGeneralTemplate } = require('../../utils/data');

Page({
  data: {
    template: null,
    sections: [],
    statusBarHeight: 20
  },

  onLoad() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    this.loadTemplate();
  },

  loadTemplate() {
    const template = getGeneralTemplate();
    if (!template) {
      wx.showToast({ title: '模板加载失败', icon: 'none' });
      return;
    }
    const sections = template.sections || [];
    this.setData({ template, sections });
  },

  // 复制单个分块
  onCopySection(e) {
    const section = e.currentTarget.dataset.section;
    if (!section) return;
    wx.setClipboardData({
      data: section.content,
      success: () => {
        wx.showToast({ title: `${section.title}已复制`, icon: 'success' });
      }
    });
  },

  // 复制全部
  onCopyAll() {
    const { sections } = this.data;
    if (sections.length === 0) return;
    const fullText = sections.map(s => `【${s.title}】\n${s.content}`).join('\n\n');
    wx.setClipboardData({
      data: fullText,
      success: () => {
        wx.showToast({ title: '完整模板已复制', icon: 'success' });
      }
    });
  },

  // 返回首页
  onBackHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
