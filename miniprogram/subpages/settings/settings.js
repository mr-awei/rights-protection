// subpages/settings/settings.js
const app = getApp();
const { getChannels, getScripts, getConfig } = require('../../utils/data');

Page({
  data: {
    appVersion: '1.1.2',
    dataVersion: '2026.09.4',
    dataVerifiedAt: '2026-09-09',
    channelCount: 122,
    scriptCount: 19,
    lawCount: 42,
    showChangelog: false,
    changelogData: null
  },

  onLoad() {
    this.loadDataStats();
  },

  // 加载数据统计
  loadDataStats() {
    try {
      // 统计优先取 config 中的静态值：避免为了计数去加载 laws.js(148KB) 等重数据
      // 渠道/话术本身已在内存，仍按实际数量显示
      const config = getConfig();
      const stats = config.data_stats || {};

      this.setData({
        channelCount: stats.channels || (getChannels() || []).length,
        scriptCount: stats.scripts || (getScripts() || []).length,
        lawCount: stats.laws || 0,
        dataVersion: config.dataVersion || '2026.09.4',
        dataVerifiedAt: config.dataVerifiedAt || '2026-08-30'
      });
    } catch (e) {
      console.error('[设置] 加载数据统计失败:', e);
    }
  },

  // 关于我们
  onAboutTap() {
    wx.navigateTo({ url: '/subpages/about/about' });
  },

  // 免责声明
  onDisclaimerTap() {
    wx.navigateTo({ url: '/subpages/about/about?tab=disclaimer' });
  },

  // 更新日志
  onChangelogTap() {
    try {
      const config = getConfig();
      const changelog = config.changelog || [];
      if (changelog.length === 0) {
        wx.showToast({ title: '暂无更新日志', icon: 'none' });
        return;
      }
      this.setData({
        showChangelog: true,
        changelogData: changelog[0]
      });
    } catch (e) {
      console.error('[设置] 加载更新日志失败:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 关闭更新日志
  onCloseChangelog() {
    this.setData({ showChangelog: false });
  },
});
