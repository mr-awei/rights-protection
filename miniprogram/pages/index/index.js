// pages/index/index.js
const app = getApp();
const { search } = require('../../utils/search');
const { getHotScripts, getConfig } = require('../../utils/data');

Page({
  data: {
    searchKeyword: '',
    statusBarHeight: 0,
    hotSearches: [],
    emergencyPhones: [],
    sceneEntries: [
      { label: '快递丢了/坏了', desc: '12305邮政申诉', color: '#E6F4FF', textColor: '#1890FF', iconClass: 'icon-box', searchKeyword: '快递', issueType: 'quality' },
      { label: '运营商乱扣费', desc: '12300工信部申诉', color: '#F6FFED', textColor: '#52C41A', iconClass: 'icon-mobile', searchKeyword: '运营商', issueType: 'overcharge' },
      { label: '商家不退款', desc: '12315平台投诉', color: '#FFFBE6', textColor: '#FAAD14', iconClass: 'icon-shop', searchKeyword: '退款', issueType: 'no_refund' },
      { label: '物业不作为', desc: '12345住建投诉', color: '#FFF2F0', textColor: '#FF4D4F', iconClass: 'icon-home', searchKeyword: '物业', issueType: 'inaction' },
      { label: '银行/保险坑人', desc: '12378金融监管', color: '#E6FFFB', textColor: '#13C2C2', iconClass: 'icon-coin', searchKeyword: '金融', issueType: 'fraud' },
      { label: '老板欠薪', desc: '劳动监察投诉', color: '#F9F0FF', textColor: '#722ED1', iconClass: 'icon-briefcase', searchKeyword: '劳动', issueType: 'overcharge' },
      { label: '医院/学校乱收费', desc: '12320/12391投诉', color: '#FFF0F6', textColor: '#EB2F96', iconClass: 'icon-medical', searchKeyword: '收费', issueType: 'overcharge' },
      { label: '被骗了/诈骗', desc: '96110反诈报警', color: '#F0F5FF', textColor: '#2F54EB', iconClass: 'icon-shield', searchKeyword: '诈骗', issueType: 'fraud' }
    ],
    hotScripts: [],
    displayScripts: [],
    recentViews: [],
    noticeExpanded: false,
    // 工具箱快捷入口
    toolEntries: [
      { label: '通用投诉信', desc: '一键生成', iconClass: 'icon-doc', color: '#E6F4FF', textColor: '#1890FF', url: '/pages/general-template/general-template' },
      { label: '投诉跟进表', desc: '时间轴管理', iconClass: 'icon-list', color: '#F6FFED', textColor: '#52C41A', url: '/pages/followup-schedule/followup-schedule' },
      { label: '热线变更', desc: '速查最新', iconClass: 'icon-mobile', color: '#FFFBE6', textColor: '#FAAD14', url: '/pages/hotline-change/hotline-change' },
      { label: '企业查询', desc: '工商信息', iconClass: 'icon-shop', color: '#FFF2F0', textColor: '#FF4D4F', url: '/pages/enterprise-query/enterprise-query' }
    ],
    // 愿景弹窗
    showVisionModal: false,
    visionCountdown: 5,
    visionCanClose: false,
    dontShowAgain: false
  },

  onLoad() {
    // 动态获取状态栏高度，用于自定义导航栏适配
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    // 从配置文件读取热门搜索和紧急电话
    const config = getConfig();
    const hotSearches = config.hot_search_words || [];
    const emergencyPhones = (config.emergency_phones || []).map(p => ({
      name: p.phone,
      label: p.name.replace(/[0-9]/g, ''),
      color: p.phone === '110' ? '#FF4D4F' : p.phone === '119' ? '#FA8C16' : p.phone === '120' ? '#EB2F96' : '#722ED1'
    }));
    this.setData({ hotSearches, emergencyPhones });
    this.loadHotScripts();
    this.loadRecentViews();
    // 检查是否需要展示愿景弹窗
    this.checkVisionModal();
  },

  // 检查是否需要展示愿景弹窗
  checkVisionModal() {
    try {
      const dontShow = wx.getStorageSync('vision_modal_dont_show');
      if (!dontShow) {
        this.setData({ showVisionModal: true, visionCountdown: 5, visionCanClose: false });
        this.startVisionCountdown();
      }
    } catch (e) {
      // 存储异常时默认展示
      this.setData({ showVisionModal: true, visionCountdown: 5, visionCanClose: false });
      this.startVisionCountdown();
    }
  },

  // 开始愿景弹窗倒计时
  startVisionCountdown() {
    this.visionTimer = setInterval(() => {
      let countdown = this.data.visionCountdown - 1;
      if (countdown <= 0) {
        clearInterval(this.visionTimer);
        this.setData({ visionCountdown: 0, visionCanClose: true });
      } else {
        this.setData({ visionCountdown: countdown });
      }
    }, 1000);
  },

  // 关闭愿景弹窗
  closeVisionModal() {
    if (!this.data.visionCanClose) {
      return;
    }
    if (this.visionTimer) {
      clearInterval(this.visionTimer);
    }
    if (this.data.dontShowAgain) {
      try {
        wx.setStorageSync('vision_modal_dont_show', true);
      } catch (e) {}
    }
    this.setData({ showVisionModal: false });
  },

  // 切换"以后不再展示"
  toggleDontShowAgain() {
    this.setData({ dontShowAgain: !this.data.dontShowAgain });
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
    const scripts = getHotScripts(8);
    // 预处理话术数据，生成预览文本，移除"场景X："前缀
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
      // 移除"场景X："前缀，只显示场景名称
      let displayName = s.scene_name || s.name || '';
      displayName = displayName.replace(/^场景\d+：/, '');
      return {
        ...s,
        preview: preview,
        displayName: displayName
      };
    });
    this.setData({ 
      hotScripts: processed,
      displayScripts: processed.slice(0, 5)
    });
  },

  // 工具箱入口点击
  onToolEntryTap(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url: url });
    }
  },

  // 查看全部话术
  onViewAllScripts() {
    wx.switchTab({ url: '/pages/script-list/script-list' });
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

    // 搜索埋点
    try {
      app.trackEvent('search', { keyword, source: 'home' });
    } catch (e) {}

    // 统一跳转到搜索结果页，体验一致
    wx.navigateTo({
      url: `/pages/search-result/search-result?keyword=${encodeURIComponent(keyword)}`
    });
  },

  onHotSearchTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ searchKeyword: keyword });

    // 热门搜索点击埋点
    try {
      app.trackEvent('hot_search_click', { keyword, source: 'home' });
    } catch (e) {}

    this.doSearch();
  },

  onSceneEntryTap(e) {
    const searchKeyword = e.currentTarget.dataset.keyword || '';
    const issueType = e.currentTarget.dataset.issuetype || '';
    // 跳转到搜索结果页，传递关键词和问题类型筛选
    wx.navigateTo({
      url: '/pages/search-result/search-result?keyword=' + encodeURIComponent(searchKeyword) + '&issue_type=' + issueType
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
    wx.switchTab({ url: '/pages/script-list/script-list' });
  },

  // 维权须知折叠/展开
  onNoticeToggle() {
    this.setData({
      noticeExpanded: !this.data.noticeExpanded
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '我不能被欺负 - 维权投诉渠道大全',
      path: '/pages/index/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '我不能被欺负 - 维权投诉渠道大全'
    };
  },
});