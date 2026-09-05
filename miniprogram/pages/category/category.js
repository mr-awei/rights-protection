// pages/category/category.js
const { getCategories, getChannelsByCategory } = require('../../utils/data');

Page({
  data: {
    categories: [],
    activeCategory: 0,
    channels: []
  },

  onLoad() {
    this.loadCategories();
  },

  onShow() {
    // 页面显示时刷新
  },

  loadCategories() {
    const categories = getCategories();
    // 如果没有分类数据，使用默认分类
    const defaultCategories = [
      { name: '交通物流', icon: '🚄' },
      { name: '电信运营', icon: '📱' },
      { name: '消费购物', icon: '🛒' },
      { name: '金融保险', icon: '💰' },
      { name: '房产物业', icon: '🏠' },
      { name: '劳动用工', icon: '💼' },
      { name: '医疗教育', icon: '🏥' },
      { name: '环保城管', icon: '🌿' },
      { name: '政务纪检', icon: '⚖️' },
      { name: '网络安全', icon: '🛡️' }
    ];

    const cats = categories.length > 0 ? categories : defaultCategories;
    this.setData({ categories: cats });
    this.loadChannels(0);
  },

  onCategoryTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeCategory: index });
    this.loadChannels(index);
  },

  loadChannels(index) {
    const { categories } = this.data;
    const category = categories[index];
    if (!category) return;

    const categoryName = category.name || category;
    const channels = getChannelsByCategory(categoryName);

    // 如果按分类没找到，显示所有渠道的前20条
    if (channels.length === 0) {
      const { getChannels } = require('../../utils/data');
      const allChannels = getChannels();
      this.setData({ channels: allChannels.slice(0, 20) });
    } else {
      this.setData({ channels });
    }
  },

  onChannelTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/channel-detail/channel-detail?id=${id}`
    });
  }
});
