// media-exposure.js - 媒体曝光路径（第四条维权路径）
const mediaData = require('../../data/media_exposure.js');

Page({
  data: {
    mediaList: mediaData,
    // 合规边界（严格）：与官方/监管/法律三类并列，作为补充手段
    compliance: [
      '媒体曝光属舆论监督 / 社会监督，非官方受理渠道，不替代行政、司法或监管程序。',
      '推荐顺序：优先走官方 / 监管 / 法律渠道；仅当法定渠道已穷尽仍无结果、或事件具公共性 / 典型性、或主体明显推诿踢皮球时，再考虑媒体曝光。',
      '必须基于真实、完整事实与证据，严禁夸大、捏造、断章取义。',
      '不得泄露商业秘密与个人隐私（含未成年人信息）；不得侮辱、诽谤、人肉搜索。',
      '如为自媒体曝光须注明「据本人掌握证据如实陈述，以官方调查为准」。'
    ]
  },

  onCopyUrl(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.setClipboardData({
      data: url,
      success: () => wx.showToast({ title: '已复制入口信息', icon: 'none' })
    });
  }
});
