// layout.js - 布局相关的共享工具
// 状态栏高度用缓存：wx.getSystemInfoSync() 是同步 API，13 个页面各自调用一次会拖慢启动，
// 这里只取一次并缓存，页面统一复用。
let cachedStatusBarHeight = null;

function getStatusBarHeight() {
  if (cachedStatusBarHeight !== null) return cachedStatusBarHeight;
  try {
    const info = wx.getSystemInfoSync();
    cachedStatusBarHeight = (info && info.statusBarHeight) || 20;
  } catch (e) {
    cachedStatusBarHeight = 20;
  }
  return cachedStatusBarHeight;
}

module.exports = { getStatusBarHeight };
