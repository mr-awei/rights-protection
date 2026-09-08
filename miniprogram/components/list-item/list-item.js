// list-item.js - 通用列表项组件
Component({
  options: {
    styleIsolation: 'apply-shared'
  },
  properties: {
    // 左侧图标类名
    icon: {
      type: String,
      value: ''
    },
    // 图标背景色
    iconBg: {
      type: String,
      value: ''
    },
    // 图标颜色
    iconColor: {
      type: String,
      value: ''
    },
    // 标题
    title: {
      type: String,
      value: ''
    },
    // 副标题/描述
    desc: {
      type: String,
      value: ''
    },
    // 右侧文字
    rightText: {
      type: String,
      value: ''
    },
    // 是否显示右箭头
    showArrow: {
      type: Boolean,
      value: true
    },
    // 是否显示分割线
    showDivider: {
      type: Boolean,
      value: true
    },
    // 是否可点击
    hover: {
      type: Boolean,
      value: true
    }
  },

  methods: {
    // 点击列表项
    onItemTap() {
      if (this.data.hover) {
        this.triggerEvent('tap');
      }
    }
  }
});
