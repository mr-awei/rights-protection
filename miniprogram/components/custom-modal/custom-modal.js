// components/custom-modal/custom-modal.js
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    type: {
      type: String,
      value: 'confirm' // confirm / actionSheet / input
    },
    title: {
      type: String,
      value: '提示'
    },
    content: {
      type: String,
      value: ''
    },
    confirmText: {
      type: String,
      value: '确定'
    },
    cancelText: {
      type: String,
      value: '取消'
    },
    showCancel: {
      type: Boolean,
      value: true
    },
    placeholder: {
      type: String,
      value: '请输入'
    },
    defaultValue: {
      type: String,
      value: ''
    },
    itemList: {
      type: Array,
      value: []
    }
  },

  data: {
    inputValue: ''
  },

  observers: {
    'visible': function(val) {
      if (val && this.data.type === 'input') {
        this.setData({ inputValue: this.data.defaultValue });
      }
    }
  },

  methods: {
    onConfirm() {
      if (this.data.type === 'input') {
        this.triggerEvent('confirm', { value: this.data.inputValue });
      } else {
        this.triggerEvent('confirm');
      }
    },

    onCancel() {
      this.triggerEvent('cancel');
    },

    onItemTap(e) {
      const index = e.currentTarget.dataset.index;
      this.triggerEvent('select', { index: index, item: this.data.itemList[index] });
    },

    onInput(e) {
      this.setData({ inputValue: e.detail.value });
    },

    onMaskTap() {
      // 点击遮罩不关闭，避免误操作
    },

    noop() {}
  }
});
