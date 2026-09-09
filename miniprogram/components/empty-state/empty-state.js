// empty-state.js - 空状态组件
Component({
  options: {
    styleIsolation: 'apply-shared'
  },
  properties: {
    // 空状态标题
    title: {
      type: String,
      value: '暂无数据'
    },
    // 空状态描述
    desc: {
      type: String,
      value: ''
    },
    // 图标类型（可选：empty、search、favorite、history、network）
    iconType: {
      type: String,
      value: 'empty'
    },
    // 操作按钮文字（为空则不显示按钮）
    actionText: {
      type: String,
      value: ''
    },
    // 自定义图标类名（覆盖iconType）
    iconClass: {
      type: String,
      value: ''
    },
    // 尺寸模式：normal（默认，完整模式）/ simple（简单模式，小图标+紧凑布局）
    size: {
      type: String,
      value: 'normal'
    }
  },

  methods: {
    // 点击操作按钮
    onActionTap() {
      this.triggerEvent('action');
    }
  }
});
