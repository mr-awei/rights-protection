// loading-state.js - 加载状态组件
Component({
  properties: {
    // 加载提示文字
    text: {
      type: String,
      value: '加载中...'
    },
    // 是否显示文字
    showText: {
      type: Boolean,
      value: true
    },
    // 加载图标大小（small/medium/large）
    size: {
      type: String,
      value: 'medium'
    }
  },

  data: {
    spinnerSize: 48
  },

  observers: {
    'size': function(size) {
      const sizeMap = {
        small: 32,
        medium: 48,
        large: 64
      };
      this.setData({
        spinnerSize: sizeMap[size] || 48
      });
    }
  }
});
