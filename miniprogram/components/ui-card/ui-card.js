// ui-card.js - 通用卡片组件
Component({
  properties: {
    // 卡片标题
    title: {
      type: String,
      value: ''
    },
    // 卡片副标题
    subtitle: {
      type: String,
      value: ''
    },
    // 是否显示点击效果
    hover: {
      type: Boolean,
      value: false
    },
    // 卡片内边距大小（small/medium/large）
    paddingSize: {
      type: String,
      value: 'medium'
    },
    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    }
  },

  data: {
    paddingClass: 'ui-card-padding-md'
  },

  observers: {
    'paddingSize': function(size) {
      const paddingMap = {
        small: 'ui-card-padding-sm',
        medium: 'ui-card-padding-md',
        large: 'ui-card-padding-lg'
      };
      this.setData({
        paddingClass: paddingMap[size] || 'ui-card-padding-md'
      });
    }
  },

  methods: {
    // 点击卡片
    onCardTap() {
      if (this.data.hover) {
        this.triggerEvent('tap');
      }
    }
  }
});
