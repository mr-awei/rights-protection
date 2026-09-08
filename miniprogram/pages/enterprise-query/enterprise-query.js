// pages/enterprise-query/enterprise-query.js
const { getEnterpriseQueries } = require('../../utils/data');

Page({
  data: {
    list: [],
    statusBarHeight: 20,
    isLoading: true
  },

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
    this.loadData();
  },

  loadData() {
    this.setData({ isLoading: true });
    const rawList = getEnterpriseQueries() || [];
    const iconMap = {
      'eq_001': 'icon-building',
      'eq_002': 'icon-star',
      'eq_003': 'icon-law',
      'eq_004': 'icon-shield'
    };
    const list = rawList.map(item => ({
      ...item,
      iconClass: iconMap[item.id] || 'icon-info',
      description: item.tips || '',
      url: item.website || ''
    }));
    this.setData({ list, isLoading: false });
  },

  onCopyUrl(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '网址已复制，请用外部浏览器打开', icon: 'none', duration: 2000 });
      }
    });
  },

  onItemTap(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.list[index];
    if (item && item.description) {
      this.showConfirmModal({
        title: item.name,
        content: item.description,
        showCancel: true,
        cancelText: '复制网址',
        confirmText: '知道了',
        success: (res) => {
          if (res.cancel && item.url) {
            this.onCopyUrl({ currentTarget: { dataset: { url: item.url } } });
          }
        }
      });
    }
  }
});
