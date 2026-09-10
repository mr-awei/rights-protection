// pages/profile/profile.js
const app = getApp();
const { getChannelById, getScriptById } = require('../../utils/data.js');
const nav = require('../../utils/nav');

Page({
  data: {
    userInfo: null,
    favoriteChannels: 0,
    favoriteScripts: 0,
    searchCount: 0,
    viewHistoryCount: 0,
    statusBarHeight: 20,
    // 收藏列表
    activeFavTab: 'channels',
    favoriteChannelList: [],
    favoriteScriptList: [],
    // 浏览历史
    viewHistoryList: [],
    // 实用工具
    toolList: [
      { name: '通用投诉信模板', desc: '结构化模板，一键复制', color: '#1890FF', iconClass: 'icon-doc', page: 'general-template' },
      { name: '热线变更速查', desc: '已取消/整合热线查询', color: '#52C41A', iconClass: 'icon-phone', page: 'hotline-change' },
      { name: '投诉跟进时间表', desc: '法定时限+升级路径', color: '#FAAD14', iconClass: 'icon-clock', page: 'followup-schedule' },
      { name: '企业信息查询', desc: '4个官方查询平台', color: '#FF4D4F', iconClass: 'icon-building', page: 'enterprise-query' },
      { name: '搜索质量看板', desc: '高频词/无结果词/成功率', color: '#13C2C2', iconClass: 'icon-chart', page: 'search-quality' }
    ],
    // 更多
    moreList: [
      { name: '意见反馈', desc: '帮助我们改进产品', color: '#13C2C2', iconClass: 'icon-chat', page: '' },
      { name: '设置', desc: '关于、免责声明、数据版本', color: '#722ED1', iconClass: 'icon-setting', page: 'settings' }
    ],
    // 友情链接
    friendLinks: [
      {
        name: '黑猫投诉',
        desc: '新浪旗下消费者服务平台，可在线投诉维权',
        color: '#FF4D4F',
        iconClass: 'icon-shield',
        url: 'https://tousu.sina.com.cn/',
        miniProgramLink: '#小程序://黑猫投诉/4elIqcmZImbjnPC'
      }
    ],
    // 自定义弹窗状态
    modalVisible: false,
    modalType: 'confirm',
    modalTitle: '',
    modalContent: '',
    modalConfirmText: '确定',
    modalCancelText: '取消',
    modalShowCancel: true,
    modalPlaceholder: '',
    modalDefaultValue: '',
    modalItemList: [],
    modalCallback: null
  },

  // 内部状态：缓存的统计数据
  _cachedStats: { channels: -1, scripts: -1, history: -1, viewHistory: -1 },

  // ========== 自定义弹窗通用方法 ==========
  showConfirmModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'confirm',
      modalTitle: options.title || '提示',
      modalContent: options.content || '',
      modalConfirmText: options.confirmText || '确定',
      modalCancelText: options.cancelText || '取消',
      modalShowCancel: options.showCancel !== false,
      modalCallback: options.success || null
    });
  },

  showInputModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'input',
      modalTitle: options.title || '请输入',
      modalPlaceholder: options.placeholder || '请输入',
      modalDefaultValue: options.defaultValue || '',
      modalConfirmText: options.confirmText || '确定',
      modalCancelText: options.cancelText || '取消',
      modalCallback: options.success || null
    });
  },

  showActionSheetModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'actionSheet',
      modalItemList: options.itemList || [],
      modalCallback: options.success || null
    });
  },

  onModalConfirm(e) {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback) {
      if (this.data.modalType === 'input') {
        callback({ confirm: true, content: e.detail.value });
      } else {
        callback({ confirm: true });
      }
    }
  },

  onModalCancel() {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback && this.data.modalType !== 'actionSheet') {
      callback({ cancel: true });
    }
  },

  onModalSelect(e) {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback) {
      callback({ tapIndex: e.detail.index });
    }
  },

  onLoad() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    this.loadStats();
  },

  onShow() {
    this.loadStats();
    this.loadFavoriteLists();
    this.loadViewHistory();

  },

  loadStats() {
    const favorites = app.globalData.favorites;
    const history = app.globalData.searchHistory;
    const viewHistory = app.globalData.viewHistory;
    const channelCount = favorites.channels.length;
    const scriptCount = favorites.scripts.length;
    const historyCount = history.length;
    const viewHistoryCount = viewHistory.length;

    if (this._cachedStats.channels === channelCount &&
        this._cachedStats.scripts === scriptCount &&
        this._cachedStats.history === historyCount &&
        this._cachedStats.viewHistory === viewHistoryCount) {
      return;
    }

    this._cachedStats = {
      channels: channelCount,
      scripts: scriptCount,
      history: historyCount,
      viewHistory: viewHistoryCount
    };

    this.setData({
      favoriteChannels: channelCount,
      favoriteScripts: scriptCount,
      searchCount: historyCount,
      viewHistoryCount: viewHistoryCount
    });
  },

  // 加载收藏列表
  loadFavoriteLists() {
    const favorites = app.globalData.favorites;
    // 收藏的渠道
    const channelList = favorites.channels.map(id => {
      const channel = getChannelById(id);
      return channel ? {
        id: channel.id,
        name: channel.name,
        phone: channel.phone || '',
        category: channel.category_user || ''
      } : { id, name: '渠道已删除', phone: '', category: '' };
    });
    // 收藏的话术
    const scriptList = favorites.scripts.map(id => {
      const script = getScriptById(id);
      return script ? {
        id: script.id,
        name: script.scene_name || script.name || '投诉话术',
        applicable: script.applicable || ''
      } : { id, name: '话术已删除', applicable: '' };
    });

    this.setData({
      favoriteChannelList: channelList,
      favoriteScriptList: scriptList
    });
  },

  // 加载浏览历史
  loadViewHistory() {
    const history = app.getViewHistory();
    const processed = history.map(item => {
      let name = item.item_name || '';
      let extra = item.item_extra || '';
      let typeLabel = item.item_type === 'channel' ? '渠道' : '话术';
      let typeColor = item.item_type === 'channel' ? '#3B82F6' : '#10B981';
      // 格式化时间
      let timeStr = '';
      if (item.viewed_at) {
        const date = new Date(item.viewed_at);
        timeStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
      return {
        ...item,
        typeLabel,
        typeColor,
        timeStr
      };
    });
    this.setData({ viewHistoryList: processed });
  },

  // 收藏Tab切换
  onFavTabTap(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeFavTab: tab });
  },

  // 点击收藏的渠道
  onFavoriteChannelTap(e) {
    const id = e.currentTarget.dataset.id;
    nav.navigateTo({
      url: `/detail/channel-detail/channel-detail?id=${id}`
    });
  },

  // 点击收藏的话术
  onFavoriteScriptTap(e) {
    const id = e.currentTarget.dataset.id;
    nav.navigateTo({
      url: `/detail/script-detail/script-detail?id=${id}`
    });
  },

  // 取消收藏渠道
  onRemoveFavoriteChannel(e) {
    const id = e.currentTarget.dataset.id;
    this.showConfirmModal({
      title: '取消收藏',
      content: '确定取消收藏该渠道吗？',
      success: (res) => {
        if (res.confirm) {
          app.toggleFavorite('channels', id);
          this._cachedStats = { channels: -1, scripts: -1, history: -1, viewHistory: -1 };
          this.loadStats();
          this.loadFavoriteLists();
          wx.showToast({ title: '已取消收藏', icon: 'success' });
        }
      }
    });
  },

  // 取消收藏话术
  onRemoveFavoriteScript(e) {
    const id = e.currentTarget.dataset.id;
    this.showConfirmModal({
      title: '取消收藏',
      content: '确定取消收藏该话术吗？',
      success: (res) => {
        if (res.confirm) {
          app.toggleFavorite('scripts', id);
          this._cachedStats = { channels: -1, scripts: -1, history: -1, viewHistory: -1 };
          this.loadStats();
          this.loadFavoriteLists();
          wx.showToast({ title: '已取消收藏', icon: 'success' });
        }
      }
    });
  },

  // 点击浏览历史
  onViewHistoryTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.item_type === 'channel') {
      nav.navigateTo({
        url: `/detail/channel-detail/channel-detail?id=${item.item_id}`
      });
    } else if (item.item_type === 'script') {
      nav.navigateTo({
        url: `/detail/script-detail/script-detail?id=${item.item_id}`
      });
    }
  },

  // 清空浏览历史
  onClearViewHistory() {
    this.showConfirmModal({
      title: '清空浏览历史',
      content: '确定清空所有浏览历史吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          app.clearViewHistory();
          this._cachedStats = { channels: -1, scripts: -1, history: -1, viewHistory: -1 };
          this.loadStats();
          this.loadViewHistory();
          wx.showToast({ title: '浏览历史已清空', icon: 'success' });
        }
      }
    });
  },

  // 统计栏点击
  onStatTap(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'channels') {
      // 跳转到收藏历史页面，自动选中渠道Tab
      nav.navigateTo({
        url: '/subpages/favorites-history/favorites-history?tab=channels'
      });
    } else if (type === 'scripts') {
      // 跳转到收藏历史页面，自动选中话术Tab
      nav.navigateTo({
        url: '/subpages/favorites-history/favorites-history?tab=scripts'
      });
    } else if (type === 'viewHistory') {
      // 跳转到收藏历史页面，自动选中历史Tab
      nav.navigateTo({
        url: '/subpages/favorites-history/favorites-history?tab=history'
      });
    } else if (type === 'search') {
      const history = app.getSearchHistory();
      if (history.length === 0) {
        wx.showToast({ title: '暂无搜索记录', icon: 'none' });
      } else {
        this.showConfirmModal({
          title: `搜索历史（共${history.length}条）`,
          content: '最近搜索：\n' + history.slice(0, 10).map((k, i) => `${i+1}. ${k}`).join('\n'),
          showCancel: true,
          cancelText: '清空历史',
          confirmText: '知道了',
          success: (res) => {
            if (res.cancel) {
              app.clearSearchHistory();
              this._cachedStats = { channels: -1, scripts: -1, history: -1, viewHistory: -1 };
              this.loadStats();
              wx.showToast({ title: '搜索历史已清空', icon: 'success' });
            }
          }
        });
      }
    }
  },

  // 查看全部收藏
  onViewAllFavorites(e) {
    const tab = e.currentTarget.dataset.tab || this.data.activeFavTab;
    nav.navigateTo({
      url: `/subpages/favorites-history/favorites-history?tab=${tab}`
    });
  },

  // 查看全部历史
  onViewAllHistory() {
    nav.navigateTo({
      url: '/subpages/favorites-history/favorites-history?tab=history'
    });
  },

  // 通用跳转
  navigateToPage(page, name) {
    if (!page) {
      wx.showToast({ title: `${name}功能开发中`, icon: 'none' });
      return;
    }
    nav.navigateTo({
      url: `/subpages/${page}/${page}`,
      fail: () => {
        wx.showToast({ title: `${name}功能开发中`, icon: 'none' });
      }
    });
  },

  // 初衷高亮卡片点击
  onBannerTap() {
    this.navigateToPage('origin', '做这个小程序的初衷');
  },

  // 实用工具点击
  onToolTap(e) {
    const item = this.data.toolList[e.currentTarget.dataset.index];
    this.navigateToPage(item.page, item.name);
  },

  // 更多点击
  onMoreTap(e) {
    const item = this.data.moreList[e.currentTarget.dataset.index];
    this.navigateToPage(item.page, item.name);
  },

  // 友情链接点击
  onFriendLinkTap(e) {
    const index = e.currentTarget.dataset.index;
    const link = this.data.friendLinks[index];
    if (!link) return;

    // 如果有小程序分享链接，让用户选择打开方式
    if (link.miniProgramLink) {
      this.showActionSheetModal({
        itemList: ['打开微信小程序', '复制网页链接'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 复制小程序分享链接，用户在微信聊天框粘贴即可打开
            wx.setClipboardData({
              data: link.miniProgramLink,
              success: () => {
                this.showConfirmModal({
                  title: '链接已复制',
                  content: '小程序链接已复制到剪贴板，请在微信聊天框中粘贴，点击即可打开黑猫投诉小程序',
                  showCancel: false,
                  confirmText: '知道了'
                });
              }
            });
          } else if (res.tapIndex === 1) {
            // 复制网页链接
            wx.setClipboardData({
              data: link.url,
              success: () => {
                wx.showToast({
                  title: '网页链接已复制，请在浏览器打开',
                  icon: 'none',
                  duration: 3000
                });
              }
            });
          }
        }
      });
    } else {
      // 没有小程序链接，直接复制网页链接
      this.copyFriendLink(link);
    }
  },

  // 复制友情链接（兜底）
  copyFriendLink(link) {
    this.showConfirmModal({
      title: link.name,
      content: `即将跳转到${link.name}（${link.url}），是否继续？`,
      confirmText: '复制链接',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: link.url,
            success: () => {
              wx.showToast({
                title: '链接已复制，请在浏览器打开',
                icon: 'none',
                duration: 3000
              });
            }
          });
        }
      }
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '我不能被欺负 - 随身维权工具箱',
      desc: '122个官方维权渠道+投诉话术模板，遇到问题一键找到对口部门',
      path: '/pages/index/index',
      imageUrl: ''
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '我不能被欺负 - 随身维权工具箱',
      query: '',
      imageUrl: ''
    };
  },
});