// materials-checklist.js - 所需材料清单 + 自检表（渠道/话术详情通用组件）
Component({
  options: {
    styleIsolation: 'apply-shared'
  },
  properties: {
    // 材料数组：[{ name, required: Boolean, desc }]
    materials: {
      type: Array,
      value: []
    },
    // 卡片标题
    title: {
      type: String,
      value: '所需材料清单'
    }
  },
  data: {
    checked: {},        // index -> bool
    requiredTotal: 0,   // 必带项总数
    requiredDone: 0,    // 已勾选必带项
    allDone: false      // 必带项是否全部勾选
  },
  observers: {
    'materials': function (list) {
      const arr = list || [];
      const requiredTotal = arr.filter(m => m && m.required).length;
      this.setData({ checked: {}, requiredTotal, requiredDone: 0, allDone: false });
    }
  },
  methods: {
    onToggle(e) {
      const idx = e.currentTarget.dataset.index;
      if (idx === undefined || idx === null) return;
      const checked = Object.assign({}, this.data.checked);
      checked[idx] = !checked[idx];

      let requiredDone = 0;
      (this.data.materials || []).forEach((m, i) => {
        if (m && m.required && checked[i]) requiredDone++;
      });
      const allDone = this.data.requiredTotal > 0 && requiredDone >= this.data.requiredTotal;
      this.setData({ checked, requiredDone, allDone });
    }
  }
});
