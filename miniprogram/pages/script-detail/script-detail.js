// pages/script-detail/script-detail.js
const app = getApp();
const { getScriptById, getRelatedChannels } = require('../../utils/data');

Page({
  data: {
    scriptId: '',
    script: null,
    relatedChannels: [],
    activeTab: 'phone',
    isFavorite: false,
    phoneContent: '',
    writtenContent: ''
  },

  onLoad(options) {
    const id = options.id;
    this.setData({ scriptId: id });
    this.loadScript(id);
  },

  loadScript(id) {
    const script = getScriptById(id);
    if (!script) {
      wx.showToast({ title: '话术不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    const relatedChannels = getRelatedChannels(id);

    // 处理话术内容，高亮占位符
    const phoneContent = this.highlightPlaceholders(script.phone_version || script.content || '');
    const writtenContent = this.highlightPlaceholders(script.written_version || script.written_content || '');

    this.setData({
      script,
      relatedChannels,
      phoneContent,
      writtenContent,
      isFavorite: app.isFavorite('scripts', id)
    });

    wx.setNavigationBarTitle({ title: script.name || '话术详情' });
  },

  highlightPlaceholders(text) {
    if (!text) return '';
    // 高亮 [占位符] 格式
    return text.replace(/\[([^\]]+)\]/g, '<span class="placeholder">[$1]</span>');
  },

  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  onCopyScript() {
    const { activeTab, script } = this.data;
    const content = activeTab === 'phone'
      ? (script.phone_version || script.content || '')
      : (script.written_version || script.written_content || '');

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '话术已复制', icon: 'success' });
      }
    });
  },

  onToggleFavorite() {
    const { scriptId } = this.data;
    const isFavorite = app.toggleFavorite('scripts', scriptId);
    this.setData({ isFavorite });
    wx.showToast({
      title: isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  onChannelTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/channel-detail/channel-detail?id=${id}`
    });
  },

  onBack() {
    wx.navigateBack();
  }
});
