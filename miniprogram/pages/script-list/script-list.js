// pages/script-list/script-list.js
const app = getApp();
const { getScripts, searchScripts } = require('../../utils/data');
const nav = require('../../utils/nav');

Page({
  data: {
    statusBarHeight: 20,
    searchKeyword: '',
    allScripts: [],
    filteredScripts: [],
    favoriteIds: []
  },

  onLoad() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    this.loadScripts();
  },

  onShow() {
    // 刷新收藏状态
    this.refreshFavorites();

  },

  loadScripts() {
    const scripts = getScripts() || [];
    const processed = scripts.map(s => {
      let displayName = s.scene_name || s.name || '投诉话术';
      displayName = displayName.replace(/^场景\d+：/, '');
      let preview = '点击查看完整话术';
      if (s.phone_script && typeof s.phone_script === 'string') {
        let text = s.phone_script.replace(/^["']|["']$/g, '');
        if (text.length > 60) {
          preview = text.substring(0, 60) + '...';
        } else {
          preview = text;
        }
      }
      return {
        ...s,
        displayName: displayName,
        preview: preview,
        hasPhone: !!(s.phone_script || s.phone_version),
        hasWritten: !!(s.written_complainant || s.written_request || s.written_facts || s.written_template)
      };
    });
    this.setData({
      allScripts: processed,
      filteredScripts: processed
    });
    this.refreshFavorites();
  },

  refreshFavorites() {
    const favScripts = app.getFavorites('scripts') || [];
    this.setData({ favoriteIds: favScripts });
  },

  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });
    if (!keyword) {
      this.setData({ filteredScripts: this.data.allScripts });
      return;
    }
    const results = searchScripts(keyword);
    const filtered = this.data.allScripts.filter(s =>
      results.some(r => r.id === s.id)
    );
    this.setData({ filteredScripts: filtered });
  },

  onSearchConfirm() {
    // 搜索已实时过滤，确认时不做额外操作
  },

  onClearSearch() {
    this.setData({ searchKeyword: '', filteredScripts: this.data.allScripts });
  },

  onScriptTap(e) {
    const id = e.currentTarget.dataset.id;
    nav.navigateTo({
      url: `/detail/script-detail/script-detail?id=${id}`
    });
  },

  onFavoriteTap(e) {
    const id = e.currentTarget.dataset.id;
    const isFav = app.toggleFavorite('scripts', id);
    this.refreshFavorites();
    wx.showToast({
      title: isFav ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  onCopyPhone(e) {
    const id = e.currentTarget.dataset.id;
    const script = this.data.allScripts.find(s => s.id === id);
    if (!script) return;
    const content = script.phone_script || script.phone_version || '';
    if (!content) {
      wx.showToast({ title: '暂无电话版话术', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '电话版话术已复制', icon: 'success' });
      }
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '投诉话术模板 - 一键复制直接用',
      path: '/pages/script-list/script-list'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '投诉话术模板 - 一键复制直接用'
    };
  },
});