// final-checklist.js - 投诉前最终自检清单（通用 12 项，勾选状态本地持久化）
Component({
  options: {
    styleIsolation: 'apply-shared'
  },
  data: {
    items: [
      '我已先向企业/商家内部投诉，留有记录',
      '我已准备好身份证明和联系方式',
      '我已整理好交易/合同/支付凭证',
      '我已保存完整的沟通记录（聊天/通话/邮件）',
      '我已收集侵权证据（照片/视频/报告/录屏）',
      '我已按时间线整理事件经过',
      '我的诉求具体、明确、有金额和时限',
      '我已计算损失金额并有依据',
      '我选择的投诉渠道与问题类型匹配',
      '我承诺投诉内容真实，不夸大、不捏造',
      '我了解恶意投诉、虚假举报的法律后果',
      '我已备份所有证据材料（云端+本地）'
    ],
    checked: [],     // index -> bool（持久化到本地存储）
    doneCount: 0,
    percent: 0,
    allDone: false
  },
  lifetimes: {
    attached() {
      this.loadState();
    }
  },
  methods: {
    loadState() {
      let saved = null;
      try {
        saved = wx.getStorageSync('final_checklist_state');
      } catch (e) { /* 忽略读取失败 */ }
      const checked = Array.isArray(saved) && saved.length === this.data.items.length
        ? saved
        : this.data.items.map(() => false);
      this.applyState(checked);
    },
    applyState(checked) {
      const doneCount = checked.filter(Boolean).length;
      const total = this.data.items.length;
      const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
      const allDone = doneCount >= total;
      this.setData({ checked, doneCount, percent, allDone });
    },
    onToggle(e) {
      const idx = e.currentTarget.dataset.index;
      if (idx === undefined || idx === null) return;
      const checked = this.data.checked.slice();
      checked[idx] = !checked[idx];
      try {
        wx.setStorageSync('final_checklist_state', checked);
      } catch (e) { /* 忽略写入失败 */ }
      this.applyState(checked);
    },
    onReset() {
      const checked = this.data.items.map(() => false);
      try {
        wx.setStorageSync('final_checklist_state', checked);
      } catch (e) { /* 忽略写入失败 */ }
      this.applyState(checked);
      wx.showToast({ title: '已重置', icon: 'none' });
    }
  }
});
