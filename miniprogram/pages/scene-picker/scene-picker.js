// pages/scene-picker/scene-picker.js
const { search } = require('../../utils/search');

Page({
  data: {
    keyword: '',
    keywords: [],
    scenes: []
  },

  onLoad(options) {
    const keyword = decodeURIComponent(options.keyword || '');
    this.setData({ keyword });
    this.processSearch(keyword);
  },

  processSearch(keyword) {
    if (!keyword) {
      wx.showToast({ title: '搜索内容为空', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    const result = search(keyword);
    console.log('[场景选项卡] 关键词:', result.keywords, '场景数:', result.scenes.length);

    this.setData({
      keywords: result.keywords,
      scenes: result.scenes
    });

    // 如果只有1个场景，直接跳转
    if (result.scenes.length === 1) {
      const scene = result.scenes[0];
      this.navigateToScene(scene);
    }
  },

  onSceneTap(e) {
    const scene = e.currentTarget.dataset.scene;
    this.navigateToScene(scene);
  },

  navigateToScene(scene) {
    if (scene.channels && scene.channels.length > 0) {
      wx.redirectTo({
        url: `/pages/channel-detail/channel-detail?id=${scene.channels[0]}`
      });
    } else if (scene.scripts && scene.scripts.length > 0) {
      wx.redirectTo({
        url: `/pages/script-detail/script-detail?id=${scene.scripts[0]}`
      });
    } else {
      wx.showToast({ title: '该场景暂无关联渠道', icon: 'none' });
    }
  },

  onKeywordRemove(e) {
    const keyword = e.currentTarget.dataset.keyword;
    wx.showToast({ title: `已移除：${keyword}`, icon: 'none' });
    // 简化：移除关键词后返回上一页
    setTimeout(() => wx.navigateBack(), 500);
  },

  onShowAllCategories() {
    wx.switchTab({ url: '/pages/category/category' });
  },

  onBack() {
    wx.navigateBack();
  }
});
