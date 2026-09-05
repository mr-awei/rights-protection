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
    contactItems: [],
    tipsText: '',
    preconditionText: ''
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
      tipsText: channel.tips || '',
      preconditionText: channel.precondition || '',
      isFavorite: app.isFavorite('channels', id)
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({ title: channel.name || '渠道详情' });
  },

  buildContactItems(channel) {
    const items = [];
    if (channel.phone) {
      // 提取第一个纯电话号码
      const phoneMatch = channel.phone.match(/\d{3,4}-?\d{7,8}|\d{10,11}/);
      const cleanPhone = phoneMatch ? phoneMatch[0] : channel.phone.replace(/[^0-9-]/g, '');
      items.push({ icon: '📞', label: '投诉电话', value: channel.phone, cleanPhone: cleanPhone, action: 'call' });
    }
    if (channel.website || channel.url) {
      items.push({ icon: '🌐', label: '官方网站', value: channel.website || channel.url, action: 'visit' });
    }
    if (channel.regulator) {
      items.push({ icon: '🏛️', label: '主管单位', value: channel.regulator, action: '' });
    }
    if (channel.phone_note) {
      items.push({ icon: 'ℹ️', label: '电话说明', value: channel.phone_note, action: '' });
    }
    return items;
  },

  onContactAction(e) {
    const item = e.currentTarget.dataset.item;
    if (item.action === 'call') {
      wx.makePhoneCall({
        phoneNumber: item.cleanPhone || item.value.replace(/[^0-9-]/g, ''),
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
    const { channel, contactItems } = this.data;
    const phoneItem = contactItems.find(i => i.action === 'call');
    if (phoneItem) {
      wx.makePhoneCall({
        phoneNumber: phoneItem.cleanPhone,
        fail: () => {
          wx.showToast({ title: '拨打失败，请手动拨打', icon: 'none' });
        }
      });
    } else if (channel && channel.website) {
      wx.setClipboardData({
        data: channel.website,
        success: () => {
          wx.showToast({ title: '网址已复制，请浏览器打开', icon: 'success' });
        }
      });
    } else {
      wx.showToast({ title: '暂无联系方式', icon: 'none' });
    }
  },

  onBack() {
    wx.navigateBack();
  }
});
