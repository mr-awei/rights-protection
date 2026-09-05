// pages/script-detail/script-detail.js
const app = getApp();
const { getScriptById, getRelatedChannels, getScriptPhoneContent, getScriptWrittenContent } = require('../../utils/data');

Page({
  data: {
    scriptId: '',
    script: null,
    relatedChannels: [],
    activeTab: 'phone',
    isFavorite: false,
    phoneContent: '',
    writtenContent: '',
    evidenceList: [],
    applicableText: ''
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

    // 获取话术内容
    const phoneRaw = getScriptPhoneContent(script);
    const writtenRaw = getScriptWrittenContent(script);

    // 高亮占位符
    const phoneContent = this.highlightPlaceholders(phoneRaw);
    const writtenContent = this.highlightPlaceholders(writtenRaw);

    // 证据清单
    const evidenceList = script.evidence_list || [];

    this.setData({
      script,
      relatedChannels,
      phoneContent,
      writtenContent,
      evidenceList,
      applicableText: script.applicable || '',
      isFavorite: app.isFavorite('scripts', id)
    });

    wx.setNavigationBarTitle({ title: script.scene_name || '话术详情' });
  },

  highlightPlaceholders(text) {
    if (!text) return '';
    // 高亮 【占位符】 格式
    let result = text.replace(/【([^】]+)】/g, '<span class="placeholder">【$1】</span>');
    // 高亮 [占位符] 格式
    result = result.replace(/\[([^\]]+)\]/g, '<span class="placeholder">[$1]</span>');
    // 换行转 <br>
    result = result.replace(/\n/g, '<br/>');
    return result;
  },

  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  onCopyScript() {
    const { activeTab, script } = this.data;
    const content = activeTab === 'phone'
      ? getScriptPhoneContent(script)
      : getScriptWrittenContent(script);

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
