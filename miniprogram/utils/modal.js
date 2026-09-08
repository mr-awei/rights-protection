/**
 * 通用自定义弹窗工具
 * 统一替换 wx.showModal 和 wx.showActionSheet
 */

/**
 * 显示确认弹窗（替代 wx.showModal）
 * @param {Object} options - 配置项
 * @param {string} options.title - 标题
 * @param {string} options.content - 内容
 * @param {string} options.confirmText - 确认按钮文字（默认"确定"）
 * @param {string} options.cancelText - 取消按钮文字（默认"取消"）
 * @param {boolean} options.showCancel - 是否显示取消按钮（默认true）
 * @param {Function} options.success - 确认回调
 * @param {Function} options.cancel - 取消回调
 */
function showConfirm(options = {}) {
  const {
    title = '提示',
    content = '',
    confirmText = '确定',
    cancelText = '取消',
    showCancel = true,
    success = null,
    cancel = null
  } = options;

  // 使用页面级自定义弹窗
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  
  if (currentPage && currentPage.setData) {
    currentPage.setData({
      customModal: {
        visible: true,
        type: 'confirm',
        title: title,
        content: content,
        confirmText: confirmText,
        cancelText: cancelText,
        showCancel: showCancel,
        onConfirm: success,
        onCancel: cancel
      }
    });
  } else {
    // 降级使用原生弹窗
    wx.showModal({
      title: title,
      content: content,
      confirmText: confirmText,
      cancelText: cancelText,
      showCancel: showCancel,
      success: (res) => {
        if (res.confirm && success) success();
        if (res.cancel && cancel) cancel();
      }
    });
  }
}

/**
 * 显示操作菜单（替代 wx.showActionSheet）
 * @param {Object} options - 配置项
 * @param {Array} options.itemList - 菜单项列表
 * @param {Function} options.success - 选择回调，返回选中的index
 * @param {Function} options.cancel - 取消回调
 */
function showActionSheet(options = {}) {
  const {
    itemList = [],
    success = null,
    cancel = null
  } = options;

  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  
  if (currentPage && currentPage.setData) {
    currentPage.setData({
      customModal: {
        visible: true,
        type: 'actionSheet',
        itemList: itemList,
        onSelect: success,
        onCancel: cancel
      }
    });
  } else {
    // 降级使用原生弹窗
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        if (success) success(res.tapIndex);
      },
      fail: () => {
        if (cancel) cancel();
      }
    });
  }
}

/**
 * 关闭自定义弹窗
 */
function closeModal() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  
  if (currentPage && currentPage.setData) {
    currentPage.setData({
      'customModal.visible': false
    });
  }
}

/**
 * 显示输入弹窗（替代 wx.showModal 的 editable 模式）
 * @param {Object} options - 配置项
 * @param {string} options.title - 标题
 * @param {string} options.placeholder - 输入框占位符
 * @param {string} options.defaultValue - 默认值
 * @param {string} options.confirmText - 确认按钮文字
 * @param {Function} options.success - 确认回调，返回输入的值
 */
function showInputModal(options = {}) {
  const {
    title = '请输入',
    placeholder = '请输入',
    defaultValue = '',
    confirmText = '确定',
    success = null
  } = options;

  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  
  if (currentPage && currentPage.setData) {
    currentPage.setData({
      customModal: {
        visible: true,
        type: 'input',
        title: title,
        placeholder: placeholder,
        inputValue: defaultValue,
        confirmText: confirmText,
        onConfirm: success
      }
    });
  } else {
    // 降级使用原生弹窗
    wx.showModal({
      title: title,
      editable: true,
      placeholderText: placeholder,
      content: defaultValue,
      confirmText: confirmText,
      success: (res) => {
        if (res.confirm && success) success(res.content || '');
      }
    });
  }
}

module.exports = {
  showConfirm,
  showActionSheet,
  showInputModal,
  closeModal
};
