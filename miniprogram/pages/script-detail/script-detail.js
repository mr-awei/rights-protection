// pages/script-detail/script-detail.js
const app = getApp();
const { getScriptById, getRelatedChannels, getScriptPhoneContent, getScriptWrittenContent, preloadChannelPart } = require('../../utils/data');

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
    applicableText: '',
    loading: true
  },

  onLoad(options) {
    const id = options.id;
    this.setData({ scriptId: id, loading: true });
    // 异步加载数据，避免阻塞页面渲染
    setTimeout(() => {
      this.loadScript(id);
    }, 16);
  },

  loadScript(id) {
    const script = getScriptById(id);
    if (!script) {
      wx.showToast({ title: '话术不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    // 获取话术内容
    const phoneRaw = getScriptPhoneContent(script);
    const writtenRaw = getScriptWrittenContent(script);
    const phoneContent = this.highlightPlaceholders(phoneRaw);
    const writtenContent = this.highlightPlaceholders(writtenRaw);
    const evidenceList = script.evidence_list || [];

    // 第一批：先设置核心内容（话术基本信息+内容）
    this.setData({
      script,
      phoneContent,
      writtenContent,
      evidenceList,
      applicableText: script.applicable || '',
      isFavorite: app.isFavorite('scripts', id),
      loading: false
    });

    wx.setNavigationBarTitle({ title: script.scene_name || '话术详情' });

    // 第二批：异步加载关联渠道（非核心内容，不阻塞首屏渲染）
    setTimeout(() => {
      const relatedChannels = getRelatedChannels(id);
      this.setData({ relatedChannels });
    }, 50);
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
    // 预加载分片，跳转后直接使用缓存
    preloadChannelPart(id);
    wx.navigateTo({
      url: `/pages/channel-detail/channel-detail?id=${id}`
    });
  },

  onBack() {
    wx.navigateBack();
  }
});
