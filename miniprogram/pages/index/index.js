// pages/index/index.js
const app = getApp();
const { search } = require('../../utils/search');
const { getHotScripts } = require('../../utils/data');

Page({
  data: {
    searchKeyword: '',
    hotSearches: ['快递丢失', '商家不退款', '话费乱扣', '老板欠薪'],
    sceneEntries: [
      { icon: '📦', label: '快递问题', color: '#E6F4FF', keyword: '快递丢失' },
      { icon: '📱', label: '手机宽带', color: '#F6FFED', keyword: '话费乱扣' },
      { icon: '🛒', label: '消费购物', color: '#FFFBE6', keyword: '商家不退款' },
      { icon: '🏠', label: '房产物业', color: '#FFF2F0', keyword: '物业不作为' },
      { icon: '💼', label: '劳动工资', color: '#F9F0FF', keyword: '老板欠薪' },
      { icon: '💰', label: '金融保险', color: '#E6FFFB', keyword: '银行误导' },
      { icon: '🏥', label: '医疗教育', color: '#FFF0F6', keyword: '医院乱收费' },
      { icon: '🛡️', label: '被骗举报', color: '#F0F5FF', keyword: '电信诈骗' }
    ],
    hotScripts: []
  },

  onLoad() {
    this.loadHotScripts();
  },

  onShow() {
    // 页面显示时刷新
  },

  loadHotScripts() {
    const scripts = getHotScripts(3);
    this.setData({ hotScripts: scripts });
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm() {
    this.doSearch();
  },

  onSearchButtonTap() {
    this.doSearch();
  },

  doSearch() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' });
      return;
    }

    // 添加搜索历史
    app.addSearchHistory(keyword);

    // 执行搜索
    const result = search(keyword);
    console.log('[首页搜索] 结果类型:', result.type, '关键词:', result.keywords);

    if (result.type === 'single' && result.scene) {
      // 单个场景 → 直接跳转渠道详情
      const scene = result.scene;
      if (scene.channels && scene.channels.length > 0) {
        wx.navigateTo({
          url: `/pages/channel-detail/channel-detail?id=${scene.channels[0]}`
        });
      } else if (scene.scripts && scene.scripts.length > 0) {
        wx.navigateTo({
          url: `/pages/script-detail/script-detail?id=${scene.scripts[0]}`
        });
      }
    } else if (result.type === 'multi' && result.scenes.length > 0) {
      // 多个场景 → 场景选项卡
      wx.navigateTo({
        url: `/pages/scene-picker/scene-picker?keyword=${encodeURIComponent(keyword)}`
      });
    } else {
      // 搜索结果页
      wx.navigateTo({
        url: `/pages/search-result/search-result?keyword=${encodeURIComponent(keyword)}`
      });
    }
  },

  onHotSearchTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ searchKeyword: keyword });
    this.doSearch();
  },

  onSceneEntryTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ searchKeyword: keyword });
    this.doSearch();
  },

  onEmergencyCall() {
    wx.makePhoneCall({
      phoneNumber: '110',
      fail: () => {
        wx.showToast({ title: '拨打失败，请手动拨打110', icon: 'none' });
      }
    });
  },

  onScriptTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/script-detail/script-detail?id=${id}`
    });
  },

  onMoreScriptsTap() {
    wx.switchTab({ url: '/pages/category/category' });
  }
});
