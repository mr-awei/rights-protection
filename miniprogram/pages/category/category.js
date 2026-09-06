// pages/category/category.js
const { getCategories, getChannelsByCategory, preloadChannelPart } = require('../../utils/data.js');

Page({
  data: {
    categories: [],           // 一级分类树（含children）
    activeCategory: 0,        // 当前选中的一级分类索引
    activeSubCategory: 0,     // 当前选中的二级分类索引
    subCategories: [],        // 当前一级分类下的二级分类列表
    channels: [],             // 当前二级分类下的渠道列表
    loading: false
  },

  // 内部状态：数据是否已加载（避免tab切换时重复加载）
  _dataLoaded: false,
  _lastCategoryIndex: -1,
  _lastSubCategoryIndex: -1,

  onLoad() {
    this.loadCategories();
  },

  onShow() {
    // 检查是否有待选中的分类（从首页常见场景跳转过来）
    const app = getApp();
    const pendingCategory = app.globalData.pendingCategory;
    if (pendingCategory && this.data.categories.length > 0) {
      // 找到对应的分类索引
      const categoryIndex = this.data.categories.findIndex(c => c.name === pendingCategory);
      if (categoryIndex >= 0 && categoryIndex !== this.data.activeCategory) {
        this.loadSubCategories(categoryIndex);
      }
      // 清除待选中的分类
      app.globalData.pendingCategory = null;
      return;
    }

    // 只有在分类真正变化时才重新加载数据
    // tab切换时如果分类没变，直接使用缓存数据，避免重复渲染导致卡顿
    if (this._dataLoaded &&
        this._lastCategoryIndex === this.data.activeCategory &&
        this._lastSubCategoryIndex === this.data.activeSubCategory) {
      return;
    }
    if (this.data.categories.length > 0) {
      this.loadChannels();
    }
  },

  // 加载分类树
  loadCategories() {
    const categories = getCategories();
    // 兜底默认分类
    const defaultCategories = [
      { name: '交通物流', icon: '🚄', color: '#3B82F6', children: [{name:'快递邮政'},{name:'铁路民航'},{name:'公路水运'},{name:'城市公交'}] },
      { name: '电信运营', icon: '📱', color: '#8B5CF6', children: [{name:'电信申诉'}] },
      { name: '消费购物', icon: '🛒', color: '#F59E0B', children: [{name:'市场监管'},{name:'食品药品'},{name:'旅游服务'},{name:'农业商务'},{name:'境外消费'}] },
      { name: '金融保险', icon: '💰', color: '#10B981', children: [{name:'银行保险'},{name:'证券基金'},{name:'互联网金融'},{name:'反垄断'},{name:'境外金融'},{name:'地方金融'}] },
      { name: '房产物业', icon: '🏠', color: '#EF4444', children: [{name:'住建物业'},{name:'供水燃气'},{name:'电力能源'},{name:'工程质量'}] },
      { name: '劳动用工', icon: '💼', color: '#6366F1', children: [{name:'人社社保'},{name:'公积金'},{name:'欠薪维权'},{name:'税务工会'}] },
      { name: '医疗教育', icon: '🏥', color: '#EC4899', children: [{name:'医疗卫生'},{name:'医保服务'},{name:'教育科研'},{name:'地方卫生'}] },
      { name: '环保城管', icon: '🌿', color: '#14B8A6', children: [{name:'环境保护'},{name:'城市管理'}] },
      { name: '政务纪检', icon: '⚖️', color: '#64748B', children: [{name:'政务服务'},{name:'纪检监察'},{name:'司法公安'},{name:'安全生产'},{name:'自然资源'},{name:'民政民生'},{name:'财税审计'}] },
      { name: '网络安全', icon: '🛡️', color: '#0EA5E9', children: [{name:'反诈预警'},{name:'网络举报'},{name:'违法犯罪'}] }
    ];

    const cats = categories.length > 0 ? categories : defaultCategories;
    this.setData({ categories: cats }, () => {
      this.loadSubCategories(0);
    });
  },

  // 加载当前一级分类下的二级分类
  loadSubCategories(categoryIndex) {
    const cat = this.data.categories[categoryIndex];
    const subCats = cat && cat.children ? cat.children : [];
    this.setData({
      activeCategory: categoryIndex,
      activeSubCategory: 0,
      subCategories: subCats
    }, () => {
      this.loadChannels();
    });
  },

  // 加载当前二级分类下的渠道
  loadChannels() {
    const { categories, activeCategory, activeSubCategory, subCategories } = this.data;
    if (!categories[activeCategory] || !subCategories[activeSubCategory]) {
      this.setData({ channels: [] }, () => {
        this._dataLoaded = true;
        this._lastCategoryIndex = activeCategory;
        this._lastSubCategoryIndex = activeSubCategory;
      });
      return;
    }

    const l1Name = categories[activeCategory].name;
    const l2Name = subCategories[activeSubCategory].name;

    // 获取该一级分类下的所有渠道，然后按二级分类过滤
    const allChannels = getChannelsByCategory(l1Name);
    const filtered = allChannels.filter(c => c.category_user_l2 === l2Name);

    this.setData({ channels: filtered }, () => {
      this._dataLoaded = true;
      this._lastCategoryIndex = activeCategory;
      this._lastSubCategoryIndex = activeSubCategory;
    });
  },

  // 点击一级分类
  onCategoryTap(e) {
    const index = e.currentTarget.dataset.index;
    if (index === this.data.activeCategory) return;
    this.loadSubCategories(index);
  },

  // 点击二级分类
  onSubCategoryTap(e) {
    const index = e.currentTarget.dataset.index;
    if (index === this.data.activeSubCategory) return;
    this.setData({ activeSubCategory: index }, () => {
      this.loadChannels();
    });
  },

  // 点击渠道
  onChannelTap(e) {
    const id = e.currentTarget.dataset.id;
    // 预加载分片（轻量操作，只加载约60KB的分片文件，不做完整数据处理）
    // 这样跳转后详情页可以直接使用缓存，避免同步加载导致的卡顿
    preloadChannelPart(id);
    wx.navigateTo({
      url: `/pages/channel-detail/channel-detail?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadChannels();
    wx.stopPullDownRefresh();
  }
});
