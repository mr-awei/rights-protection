// ui-tag.js - 通用标签组件
Component({
  properties: {
    // 标签文字
    text: {
      type: String,
      value: ''
    },
    // 标签类型（default/primary/success/warning/danger/info）
    type: {
      type: String,
      value: 'default'
    },
    // 标签大小（small/medium/large）
    size: {
      type: String,
      value: 'medium'
    },
    // 是否可点击
    closable: {
      type: Boolean,
      value: false
    },
    // 是否圆角
    round: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    // 点击标签
    onTagTap() {
      this.triggerEvent('tap');
    },
    // 点击关闭按钮
    onCloseTap(e) {
      e.stopPropagation();
      this.triggerEvent('close');
    }
  }
});
