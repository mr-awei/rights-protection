// utils/nav.js
// 跨分包跳转统一封装
// 背景：页面下沉到分包后，首次跳转需要先下载对应分包（detail 约 667KB）。
// 下载期间 navigateTo 不会立即返回，用户会感觉"点了没反应"。
// 这里对跨分包跳转统一加 loading，下载完成后自动关闭；同包/主包跳转不做处理，零开销。

const SUBPKG_PREFIXES = ['/detail/', '/subpages/'];

function isSubpackageUrl(url) {
  return typeof url === 'string' && SUBPKG_PREFIXES.some(prefix => url.indexOf(prefix) === 0);
}

/**
 * 跳转（仅在目标属于分包时显示加载态）
 */
function navigateTo(options) {
  if (!options || !isSubpackageUrl(options.url)) {
    return wx.navigateTo(options);
  }

  wx.showLoading({ title: '加载中...', mask: true });
  const userSuccess = options.success;
  const userFail = options.fail;

  options.success = function (res) {
    wx.hideLoading();
    if (typeof userSuccess === 'function') userSuccess(res);
  };
  options.fail = function (err) {
    wx.hideLoading();
    if (typeof userFail === 'function') {
      userFail(err);
    } else {
      // 未自定义 fail 时给出兜底提示，避免分包下载失败后毫无反馈
      wx.showToast({ title: '加载失败，请检查网络', icon: 'none' });
    }
  };

  return wx.navigateTo(options);
}

module.exports = {
  navigateTo,
  isSubpackageUrl
};
