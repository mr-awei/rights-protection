// pages/category/category.js
const { getCategories, getChannelsByCategory } = require('../../utils/data.js');
const nav = require('../../utils/nav');
const config = require('../../data/config.js');

Page({
  data: {
    categories: [],           // 一级分类树（含children）
    activeCategory: 0,        // 当前选中的一级分类索引
    activeSubCategory: 0,     // 当前选中的二级分类索引
    subCategories: [],        // 当前一级分类下的二级分类列表
    channels: [],             // 当前二级分类下的渠道列表
    loading: false,
    // 问题类型筛选
    issueTypes: [],           // 问题类型列表
    activeIssueType: 'all'    // 当前选中的问题类型，all表示全部
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
    // 加载问题类型列表
    const issueTypesConfig = config.issue_types || {};
    const issueTypes = [
      { key: 'all', name: '全部问题' },
      ...Object.keys(issueTypesConfig).map(key => ({
        key: key,
        name: issueTypesConfig[key].name
      }))
    ];
    this.setData({
      categories: categories,
      issueTypes: issueTypes
    }, () => {
      this.loadSubCategories(0);
    });
  },

  // 加载当前一级分类下的二级分类（动态过滤掉空分类）
  loadSubCategories(categoryIndex) {
    const cat = this.data.categories[categoryIndex];
    const allSubCats = cat && cat.children ? cat.children : [];
    
    // 获取该一级分类下的所有渠道
    const l1Name = cat ? cat.name : '';
    const allChannels = l1Name ? getChannelsByCategory(l1Name) : [];
    
    // 动态过滤：只保留有渠道数据的二级分类
    const subCats = allSubCats.filter(sub => {
      const count = allChannels.filter(c => c.category_user_l2 === sub.name).length;
      return count > 0;
    });
    
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
    const { categories, activeCategory, activeSubCategory, subCategories, activeIssueType } = this.data;
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
    let filtered = allChannels.filter(c => c.category_user_l2 === l2Name);

    // 动态计算当前二级分类下有哪些问题类型有数据
    const availableIssueTypes = new Set();
    filtered.forEach(c => {
      (c.issue_types || []).forEach(t => availableIssueTypes.add(t));
    });

    // 构建问题类型列表：全部问题 + 有数据的问题类型
    const issueTypesConfig = config.issue_types || {};
    const newIssueTypes = [
      { key: 'all', name: '全部问题' },
      ...Object.keys(issueTypesConfig)
        .filter(key => availableIssueTypes.has(key))
        .map(key => ({
          key: key,
          name: issueTypesConfig[key].name
        }))
    ];

    // 如果当前选中的问题类型在新分类下没有数据，自动切换回全部
    let newActiveIssueType = activeIssueType;
    if (activeIssueType && activeIssueType !== 'all' && !availableIssueTypes.has(activeIssueType)) {
      newActiveIssueType = 'all';
    }

    // 按问题类型筛选
    if (newActiveIssueType && newActiveIssueType !== 'all') {
      filtered = filtered.filter(c => {
        const issueTypes = c.issue_types || [];
        return issueTypes.includes(newActiveIssueType);
      });
    }

    this.setData({ 
      channels: filtered,
      issueTypes: newIssueTypes,
      activeIssueType: newActiveIssueType
    }, () => {
      this._dataLoaded = true;
      this._lastCategoryIndex = activeCategory;
      this._lastSubCategoryIndex = activeSubCategory;
    });
  },

  // 点击问题类型筛选
  onIssueTypeTap(e) {
    const issueType = e.currentTarget.dataset.type;
    if (issueType === this.data.activeIssueType) return;
    this.setData({ activeIssueType: issueType }, () => {
      this.loadChannels();
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
    // 注：分片预加载已随详情页下沉到 detail 分包，主包不再触碰分片数据
    nav.navigateTo({
      url: `/detail/channel-detail/channel-detail?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadChannels();
    wx.stopPullDownRefresh();
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '维权渠道分类大全',
      path: '/pages/category/category'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '维权渠道分类大全'
    };
  },
});