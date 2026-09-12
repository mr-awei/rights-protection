// subsubsubpages/followup-schedule/followup-schedule.js
const { getFollowupSchedule } = require('../../utils/data');
const { getStatusBarHeight } = require('../../utils/layout');

Page({
  data: {
    list: [],
    statusBarHeight: 20,
    expandedIndex: -1
  },

  onLoad() {

    this.setData({ statusBarHeight: getStatusBarHeight() });
    this.loadData();
  },

  loadData() {
    const list = getFollowupSchedule() || [];
    this.setData({ list });
  },

  onItemTap(e) {
    const index = e.currentTarget.dataset.index;
    const currentExpanded = this.data.expandedIndex;
    // 点击已展开的节点则收起，点击其他节点则展开新节点
    const newExpanded = currentExpanded === index ? -1 : index;
    this.setData({ expandedIndex: newExpanded });
  }
});
