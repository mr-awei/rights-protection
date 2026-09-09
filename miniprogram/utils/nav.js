// utils/nav.js
// 跨分包跳转统一封装
// 背景：页面下沉到分包后，首次跳转需要先下载对应分包（detail 约 667KB）。
// 下载期间 navigateTo 不会立即返回，用户会感觉"点了没反应"。
// 这里对跨分包跳转统一加 loading，下载完成后自动关闭；同包/主包跳转不做处理，零开销。

const SUBPKG_PREFIXES = ['/detail/', '/subpages/'];

function isSubpackageUrl(url) {
  return typeof url === 'string' && SUBPKG_PREFIXES.some(prefix => url.indexOf(prefix) === 0);
}

// 全局导航锁：防止双击/事件冒泡导致同一页面被 push 两次
let navigating = false;

function navigateTo(options) {
  if (!options) {
    return wx.navigateTo(options);
  }

  // 正在导航中，忽略本次调用
  if (navigating) {
    return;
  }
  navigating = true;

  const userSuccess = options.success;
  const userFail = options.fail;

  const reset = () => {
    navigating = false;
    wx.hideLoading();
  };

  options.success = function (res) {
    // 保留一段锁定时长，覆盖页面转场动画期间，防止手势/快速连点重复入栈
    setTimeout(reset, 400);
    if (typeof userSuccess === 'function') userSuccess(res);
  };
  options.fail = function (err) {
    reset();
    if (typeof userFail === 'function') {
      userFail(err);
    } else {
      // 未自定义 fail 时给出兜底提示，避免分包下载失败后毫无反馈
      wx.showToast({ title: '加载失败，请检查网络', icon: 'none' });
    }
  };

  if (!isSubpackageUrl(options.url)) {
    return wx.navigateTo(options);
  }

  wx.showLoading({ title: '加载中...', mask: true });
  return wx.navigateTo(options);
}

module.exports = {
  navigateTo,
  isSubpackageUrl
};
