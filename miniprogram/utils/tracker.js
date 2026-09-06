/**
 * 统一埋点接口（Tracker）
 * MVP版本：本地存储埋点数据，支持后续扩展为服务器上报
 * 设计原则：统一接口、异步非阻塞、可扩展、不影响主流程性能
 */

const STORAGE_KEY = 'tracker_events';
const MAX_EVENTS = 500; // 最多存储500条事件
const BATCH_SIZE = 50; // 批量上报大小

// 事件类型枚举
const EVENT_TYPES = {
  PAGE_VIEW: 'page_view',           // 页面浏览
  BUTTON_CLICK: 'button_click',     // 按钮点击
  SEARCH: 'search',                  // 搜索行为
  SEARCH_RESULT: 'search_result',    // 搜索结果点击
  FAVORITE: 'favorite',              // 收藏行为
  UNFAVORITE: 'unfavorite',          // 取消收藏
  SHARE: 'share',                    // 分享行为
  CALL_PHONE: 'call_phone',          // 拨打电话
  COPY: 'copy',                      // 复制内容
  VIEW_DETAIL: 'view_detail',        // 查看详情
  ERROR: 'error',                    // 错误事件
  CUSTOM: 'custom'                   // 自定义事件
};

// 页面名称映射
const PAGE_NAMES = {
  'pages/index/index': '首页',
  'pages/category/category': '分类页',
  'pages/profile/profile': '我的页',
  'pages/search/search': '搜索页',
  'pages/search-result/search-result': '搜索结果页',
  'pages/scene-picker/scene-picker': '场景选择页',
  'pages/channel-detail/channel-detail': '渠道详情页',
  'pages/script-detail/script-detail': '话术详情页',
  'pages/general-template/general-template': '通用投诉信模板',
  'pages/hotline-change/hotline-change': '热线变更速查',
  'pages/followup-schedule/followup-schedule': '投诉跟进时间表',
  'pages/enterprise-query/enterprise-query': '企业查询指引'
};

class Tracker {
  constructor() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.enabled = true; // 埋点开关，可通过配置关闭
    this.reportUrl = ''; // 服务器上报地址（后续扩展）
    this.isReporting = false;
    this.loadEvents();
  }

  /**
   * 生成会话ID
   */
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 从本地存储加载事件
   */
  loadEvents() {
    try {
      const data = wx.getStorageSync(STORAGE_KEY);
      if (data && Array.isArray(data)) {
        this.events = data;
      }
    } catch (e) {
      console.warn('[Tracker] 加载埋点数据失败:', e);
      this.events = [];
    }
  }

  /**
   * 保存事件到本地存储
   */
  saveEvents() {
    try {
      // 超过最大数量时，保留最新的事件
      if (this.events.length > MAX_EVENTS) {
        this.events = this.events.slice(-MAX_EVENTS);
      }
      wx.setStorageSync(STORAGE_KEY, this.events);
    } catch (e) {
      console.warn('[Tracker] 保存埋点数据失败:', e);
    }
  }

  /**
   * 记录事件（核心方法）
   * @param {string} type - 事件类型
   * @param {object} params - 事件参数
   */
  track(type, params = {}) {
    if (!this.enabled) return;

    try {
      const event = {
        event_id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        event_type: type,
        session_id: this.sessionId,
        timestamp: Date.now(),
        timestamp_str: new Date().toISOString(),
        page: this.getCurrentPage(),
        page_name: this.getCurrentPageName(),
        ...params
      };

      this.events.push(event);
      this.saveEvents();

      // 调试模式下打印日志
      if (params.debug) {
        console.log('[Tracker] 事件:', event);
      }

      // 后续扩展：达到批量大小时上报服务器
      // if (this.events.length >= BATCH_SIZE && this.reportUrl) {
      //   this.reportBatch();
      // }
    } catch (e) {
      console.warn('[Tracker] 记录事件失败:', e);
    }
  }

  /**
   * 页面浏览埋点
   * @param {string} pagePath - 页面路径
   * @param {object} extra - 额外参数
   */
  trackPageView(pagePath, extra = {}) {
    this.track(EVENT_TYPES.PAGE_VIEW, {
      page_path: pagePath,
      ...extra
    });
  }

  /**
   * 按钮点击埋点
   * @param {string} buttonName - 按钮名称
   * @param {object} extra - 额外参数
   */
  trackButtonClick(buttonName, extra = {}) {
    this.track(EVENT_TYPES.BUTTON_CLICK, {
      button_name: buttonName,
      ...extra
    });
  }

  /**
   * 搜索埋点
   * @param {string} keyword - 搜索关键词
   * @param {object} extra - 额外参数
   */
  trackSearch(keyword, extra = {}) {
    this.track(EVENT_TYPES.SEARCH, {
      keyword,
      keyword_length: keyword ? keyword.length : 0,
      ...extra
    });
  }

  /**
   * 搜索结果点击埋点
   * @param {string} keyword - 搜索关键词
   * @param {string} resultType - 结果类型（channel/script）
   * @param {string} resultId - 结果ID
   * @param {number} position - 位置
   */
  trackSearchResult(keyword, resultType, resultId, position = 0) {
    this.track(EVENT_TYPES.SEARCH_RESULT, {
      keyword,
      result_type: resultType,
      result_id: resultId,
      position
    });
  }

  /**
   * 收藏埋点
   * @param {string} itemType - 收藏类型（channel/script）
   * @param {string} itemId - 收藏ID
   * @param {string} itemName - 收藏名称
   */
  trackFavorite(itemType, itemId, itemName = '') {
    this.track(EVENT_TYPES.FAVORITE, {
      item_type: itemType,
      item_id: itemId,
      item_name: itemName
    });
  }

  /**
   * 取消收藏埋点
   */
  trackUnfavorite(itemType, itemId, itemName = '') {
    this.track(EVENT_TYPES.UNFAVORITE, {
      item_type: itemType,
      item_id: itemId,
      item_name: itemName
    });
  }

  /**
   * 拨打电话埋点
   * @param {string} phone - 电话号码
   * @param {string} channelName - 渠道名称
   */
  trackCallPhone(phone, channelName = '') {
    this.track(EVENT_TYPES.CALL_PHONE, {
      phone,
      channel_name: channelName
    });
  }

  /**
   * 复制内容埋点
   * @param {string} contentType - 内容类型
   * @param {string} contentId - 内容ID
   */
  trackCopy(contentType, contentId = '') {
    this.track(EVENT_TYPES.COPY, {
      content_type: contentType,
      content_id: contentId
    });
  }

  /**
   * 查看详情埋点
   * @param {string} detailType - 详情类型（channel/script）
   * @param {string} detailId - 详情ID
   * @param {string} detailName - 详情名称
   */
  trackViewDetail(detailType, detailId, detailName = '') {
    this.track(EVENT_TYPES.VIEW_DETAIL, {
      detail_type: detailType,
      detail_id: detailId,
      detail_name: detailName
    });
  }

  /**
   * 错误埋点
   * @param {string} errorType - 错误类型
   * @param {string} errorMessage - 错误信息
   * @param {object} extra - 额外参数
   */
  trackError(errorType, errorMessage, extra = {}) {
    this.track(EVENT_TYPES.ERROR, {
      error_type: errorType,
      error_message: errorMessage,
      ...extra
    });
  }

  /**
   * 获取当前页面路径
   */
  getCurrentPage() {
    try {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        return pages[pages.length - 1].route || '';
      }
    } catch (e) {
      // ignore
    }
    return '';
  }

  /**
   * 获取当前页面名称
   */
  getCurrentPageName() {
    const page = this.getCurrentPage();
    return PAGE_NAMES[page] || page || '未知页面';
  }

  /**
   * 获取所有埋点事件
   */
  getEvents() {
    return this.events;
  }

  /**
   * 获取事件统计
   */
  getStats() {
    const stats = {
      total_events: this.events.length,
      session_id: this.sessionId,
      session_duration: Date.now() - this.startTime,
      event_types: {},
      page_views: {}
    };

    for (const event of this.events) {
      // 按事件类型统计
      stats.event_types[event.event_type] = (stats.event_types[event.event_type] || 0) + 1;
      // 按页面统计
      if (event.event_type === EVENT_TYPES.PAGE_VIEW) {
        const pageName = event.page_name || '未知';
        stats.page_views[pageName] = (stats.page_views[pageName] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * 清空所有埋点事件
   */
  clearEvents() {
    this.events = [];
    this.saveEvents();
  }

  /**
   * 启用/禁用埋点
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * 设置上报地址（后续扩展）
   */
  setReportUrl(url) {
    this.reportUrl = url;
  }

  /**
   * 批量上报（后续扩展）
   */
  async reportBatch() {
    if (!this.reportUrl || this.isReporting || this.events.length === 0) return;

    this.isReporting = true;
    try {
      const batch = this.events.splice(0, BATCH_SIZE);
      // 后续实现服务器上报逻辑
      // await wx.request({ url: this.reportUrl, method: 'POST', data: { events: batch } });
      this.saveEvents();
    } catch (e) {
      console.warn('[Tracker] 上报失败:', e);
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * 导出埋点数据（用于调试）
   */
  exportData() {
    return JSON.stringify({
      session_id: this.sessionId,
      start_time: this.startTime,
      events: this.events
    }, null, 2);
  }
}

// 创建单例
const tracker = new Tracker();

module.exports = {
  tracker,
  EVENT_TYPES,
  PAGE_NAMES
};
