// pages/search-quality/search-quality.js
const app = getApp();

Page({
  data: {
    analysis: {
      total: 0,
      topKeywords: [],
      noResultKeywords: [],
      avgResultCount: 0,
      searchTypeDistribution: {}
    },
    successRate: 0
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
    this.loadAnalysis();
  },

  onShow() {
    this.loadAnalysis();

  },

  // 加载分析数据
  loadAnalysis() {
    try {
      const analysis = app.analyzeSearchLogs ? app.analyzeSearchLogs() : {
        total: 0,
        topKeywords: [],
        noResultKeywords: [],
        avgResultCount: 0,
        searchTypeDistribution: {}
      };

      // 计算搜索成功率（有结果的搜索占比）
      let successRate = 0;
      if (analysis.total > 0) {
        const noResultTotal = analysis.noResultKeywords.reduce((sum, item) => sum + item.count, 0);
        successRate = Math.round(((analysis.total - noResultTotal) / analysis.total) * 100);
      }

      // 计算高频词的百分比（用于进度条）
      const maxCount = analysis.topKeywords.length > 0 ? analysis.topKeywords[0].count : 1;
      const topKeywordsWithPercent = analysis.topKeywords.map(item => ({
        ...item,
        percent: Math.round((item.count / maxCount) * 100)
      }));

      this.setData({
        analysis: {
          ...analysis,
          topKeywords: topKeywordsWithPercent
        },
        successRate
      });
    } catch (e) {
      console.error('[搜索质量] 加载分析数据失败:', e);
    }
  },

  // 添加标签
  onAddTag(e) {
    const keyword = e.currentTarget.dataset.keyword;
    if (!keyword) return;

    this.showConfirmModal({
      title: '添加渠道标签',
      content: `将关键词"${keyword}"作为标签添加到相关渠道？\n\n注意：此功能需要手动编辑数据文件，当前仅提供建议。`,
      confirmText: '复制关键词',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: keyword,
            success: () => {
              wx.showToast({ title: '关键词已复制', icon: 'success' });
            }
          });
        }
      }
    });
  },

  // 添加同义词
  onAddSynonym(e) {
    const keyword = e.currentTarget.dataset.keyword;
    if (!keyword) return;

    this.showConfirmModal({
      title: '添加同义词',
      content: `将关键词"${keyword}"添加到同义词典？\n\n注意：此功能需要手动编辑数据文件，当前仅提供建议。`,
      confirmText: '复制关键词',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: keyword,
            success: () => {
              wx.showToast({ title: '关键词已复制', icon: 'success' });
            }
          });
        }
      }
    });
  },

  // 一键优化热门搜索词
  onOptimizeHotSearch() {
    try {
      if (app.optimizeHotSearchWords) {
        const result = app.optimizeHotSearchWords();
        if (result && result.length > 0) {
          this.showConfirmModal({
            title: '优化完成',
            content: `已基于搜索日志优化热门搜索词，共${result.length}个词。\n\n热门搜索词将在下次搜索时生效。`,
            showCancel: false,
            confirmText: '知道了'
          });
        } else {
          wx.showToast({ title: '暂无足够数据优化', icon: 'none' });
        }
      } else {
        wx.showToast({ title: '功能暂不可用', icon: 'none' });
      }
    } catch (e) {
      console.error('[搜索质量] 优化热门搜索词失败:', e);
      wx.showToast({ title: '优化失败', icon: 'none' });
    }
  },

  // 清空搜索日志
  onClearLogs() {
    this.showConfirmModal({
      title: '确认清空',
      content: '确定要清空所有搜索日志吗？此操作不可恢复。',
      confirmText: '清空',
      success: (res) => {
        if (res.confirm) {
          if (app.clearSearchLogs) {
            app.clearSearchLogs();
          }
          this.loadAnalysis();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },
});