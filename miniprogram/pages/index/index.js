// pages/index/index.js
const app = getApp();
const { search } = require('../../utils/search');
const { getHotScripts } = require('../../utils/data');

Page({
  data: {
    searchKeyword: '',
    statusBarHeight: 0,
    hotSearches: ['快递丢失', '商家不退款', '话费乱扣', '老板欠薪', '物业乱收费', '电信诈骗', '噪音扰民', '医院乱收费', '出租车拒载', '个人信息泄露'],
    emergencyPhones: [
      { name: '110', label: '报警', color: '#FF4D4F' },
      { name: '119', label: '火警', color: '#FA8C16' },
      { name: '120', label: '急救', color: '#EB2F96' },
      { name: '96110', label: '反诈', color: '#722ED1' }
    ],
    sceneEntries: [
      { short: '快', label: '快递问题', color: '#E6F4FF', textColor: '#1890FF', keyword: '快递丢失' },
      { short: '手', label: '手机宽带', color: '#F6FFED', textColor: '#52C41A', keyword: '话费乱扣' },
      { short: '消', label: '消费购物', color: '#FFFBE6', textColor: '#FAAD14', keyword: '商家不退款' },
      { short: '房', label: '房产物业', color: '#FFF2F0', textColor: '#FF4D4F', keyword: '物业不作为' },
      { short: '劳', label: '劳动工资', color: '#F9F0FF', textColor: '#722ED1', keyword: '老板欠薪' },
      { short: '金', label: '金融保险', color: '#E6FFFB', textColor: '#13C2C2', keyword: '银行误导' },
      { short: '医', label: '医疗教育', color: '#FFF0F6', textColor: '#EB2F96', keyword: '医院乱收费' },
      { short: '骗', label: '被骗举报', color: '#F0F5FF', textColor: '#2F54EB', keyword: '电信诈骗' }
    ],
    hotScripts: [],
    recentViews: [],
    noticeExpanded: false
  },

  onLoad() {
    // 动态获取状态栏高度，用于自定义导航栏适配
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    this.loadHotScripts();
    this.loadRecentViews();
  },

  onShow() {
    // 页面显示时刷新最近浏览
    this.loadRecentViews();
  },

  // 加载最近浏览
  loadRecentViews() {
    const history = app.getViewHistory() || [];
    const recent = history.slice(0, 5).map(item => ({
      ...item,
      typeLabel: item.item_type === 'channel' ? '渠道' : '话术',
      typeColor: item.item_type === 'channel' ? '#3B82F6' : '#10B981'
    }));
    this.setData({ recentViews: recent });
  },

  // 点击最近浏览项
  onRecentViewTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.item_type === 'channel') {
      wx.navigateTo({
        url: `/pages/channel-detail/channel-detail?id=${item.item_id}`
      });
    } else if (item.item_type === 'script') {
      wx.navigateTo({
        url: `/pages/script-detail/script-detail?id=${item.item_id}`
      });
    }
  },

  loadHotScripts() {
    const scripts = getHotScripts(5);
    // 预处理话术数据，生成预览文本
    const processed = scripts.map(s => {
      let preview = '点击查看完整话术';
      if (s.phone_script && typeof s.phone_script === 'string') {
        // 去除首尾引号，截取前50个字符
        let text = s.phone_script.replace(/^["']|["']$/g, '');
        if (text.length > 50) {
          preview = text.substring(0, 50) + '...';
        } else {
          preview = text;
        }
      }
      return {
        ...s,
        preview: preview
      };
    });
    this.setData({ hotScripts: processed });
  },

  // 点击搜索框跳转到搜索态页面
  onSearchBoxTap() {
    wx.navigateTo({ url: '/pages/search/search' });
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
    // 添加搜索历史
    app.addSearchHistory(keyword);
    // 统一跳转到搜索结果页，让用户看到该领域的所有相关渠道/话术
    wx.navigateTo({
      url: `/pages/search-result/search-result?keyword=${encodeURIComponent(keyword)}`
    });
  },

  onEmergencyCall(e) {
    const phone = e.currentTarget.dataset.phone;
    const label = e.currentTarget.dataset.label;
    if (!phone) return;
    wx.showModal({
      title: '确认拨打',
      content: `确认拨打${label}电话 ${phone}？\n\n紧急情况请直接拨打，本工具仅提供快捷入口。`,
      confirmText: '确认拨打',
      cancelText: '取消',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: phone,
            fail: () => {
              wx.showToast({ title: `拨打失败，请手动拨打${phone}`, icon: 'none' });
            }
          });
        }
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
  },

  // 维权须知折叠/展开
  onNoticeToggle() {
    this.setData({
      noticeExpanded: !this.data.noticeExpanded
    });
  }
});
