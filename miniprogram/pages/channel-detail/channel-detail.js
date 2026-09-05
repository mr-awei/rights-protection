// pages/channel-detail/channel-detail.js
const app = getApp();
const { getChannelById, getRelatedScripts, getLaws } = require('../../utils/data');

Page({
  data: {
    channelId: '',
    channel: null,
    relatedScripts: [],
    laws: [],
    isFavorite: false,
    contactItems: []
  },

  onLoad(options) {
    const id = options.id;
    this.setData({ channelId: id });
    this.loadChannel(id);
  },

  loadChannel(id) {
    const channel = getChannelById(id);
    if (!channel) {
      wx.showToast({ title: '渠道不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    const relatedScripts = getRelatedScripts(id);
    const laws = getLaws();

    // 构建联系方式列表
    const contactItems = this.buildContactItems(channel);

    this.setData({
      channel,
      relatedScripts,
      laws: laws.slice(0, 3),
      contactItems,
      isFavorite: app.isFavorite('channels', id)
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({ title: channel.name || '渠道详情' });
  },

  buildContactItems(channel) {
    const items = [];
    if (channel.phone) {
      items.push({ icon: '📞', label: '投诉电话', value: channel.phone, action: 'call' });
    }
    if (channel.website || channel.url) {
      items.push({ icon: '🌐', label: '官方网站', value: channel.website || channel.url, action: 'visit' });
    }
    if (channel.work_time || channel.service_time) {
      items.push({ icon: '⏰', label: '工作时间', value: channel.work_time || channel.service_time, action: '' });
    }
    if (channel.address) {
      items.push({ icon: '📍', label: '办公地址', value: channel.address, action: '' });
    }
    return items;
  },

  onContactAction(e) {
    const item = e.currentTarget.dataset.item;
    if (item.action === 'call') {
      wx.makePhoneCall({
        phoneNumber: item.value.replace(/[^0-9-]/g, ''),
        fail: () => {
          wx.showToast({ title: '拨打失败', icon: 'none' });
        }
      });
    } else if (item.action === 'visit') {
      wx.setClipboardData({
        data: item.value,
        success: () => {
          wx.showToast({ title: '网址已复制', icon: 'success' });
        }
      });
    }
  },

  onScriptTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/script-detail/script-detail?id=${id}`
    });
  },

  onToggleFavorite() {
    const { channelId } = this.data;
    const isFavorite = app.toggleFavorite('channels', channelId);
    this.setData({ isFavorite });
    wx.showToast({
      title: isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  onComplain() {
    const { channel } = this.data;
    if (channel && channel.phone) {
      wx.makePhoneCall({
        phoneNumber: channel.phone.replace(/[^0-9-]/g, ''),
        fail: () => {
          wx.showToast({ title: '拨打失败，请手动拨打', icon: 'none' });
        }
      });
    } else {
      wx.showToast({ title: '暂无电话，请通过网站投诉', icon: 'none' });
    }
  },

  onBack() {
    wx.navigateBack();
  }
});
