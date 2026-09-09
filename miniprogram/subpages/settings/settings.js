// subsubsubpages/settings/settings.js
const app = getApp();

Page({
  data: {
    appVersion: '1.0.0',
    dataVersion: '2026.09',
    dataVerifiedAt: '2026-08-30',
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
      // 从数据文件获取真实统计
      const channels = require('../../data/channels_part_1.js').concat(
        require('../../data/channels_part_2.js'),
        require('../../data/channels_part_3.js')
      );
      const scripts = require('../../data/scripts.js');
      const laws = require('../../data/laws.js');
      const config = require('../../data/config.js');

      this.setData({
        channelCount: channels.length,
        scriptCount: scripts.length,
        lawCount: laws.length,
        dataVersion: config.dataVersion || '2026.09',
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
      const config = require('../../data/config.js');
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
