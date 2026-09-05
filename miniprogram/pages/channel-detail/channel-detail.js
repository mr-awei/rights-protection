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
    preconditionText: '',
    loading: true  // 加载状态
  },

  onLoad(options) {
    const id = options.id;
    this.setData({ channelId: id, loading: true });
    // 异步加载数据，避免阻塞页面渲染
    // 列表页点击时已经预加载了分片，这里通常可以直接从缓存读取
    setTimeout(() => {
      this.loadChannel(id);
    }, 16);
  },

  loadChannel(id) {
    const channel = getChannelById(id);
    if (!channel) {
      wx.showToast({ title: '渠道不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    // 第一批：先设置关键信息（标题、联系方式），让用户快速看到核心内容
    const contactItems = this.buildContactItems(channel);
    this.setData({
      channel,
      contactItems,
      loading: false,
      isFavorite: app.isFavorite('channels', id)
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({ title: channel.name || '渠道详情' });

    // 第二批：异步加载关联内容（话术、法律依据），不阻塞首屏渲染
    setTimeout(() => {
      const relatedScripts = getRelatedScripts(id);
      const laws = getLaws();
      this.setData({
        relatedScripts,
        laws: laws.slice(0, 3),
        tipsText: channel.tips || '',
        preconditionText: channel.precondition || ''
      });
    }, 50);
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
      // 电话点击 → 跳转拨号页
      wx.makePhoneCall({
        phoneNumber: item.cleanPhone || item.value.replace(/[^0-9-]/g, ''),
        fail: () => {
          wx.showToast({ title: '拨打失败，请手动拨打', icon: 'none' });
        }
      });
    } else if (item.action === 'visit') {
      // 网站点击 → 复制网址 + 提示用外部浏览器打开
      wx.setClipboardData({
        data: item.value,
        success: () => {
          wx.showModal({
            title: '网址已复制',
            content: '官方网站地址已复制到剪贴板。\n\n由于微信小程序限制，无法直接打开外部网站，请复制后在手机浏览器（如Safari、Chrome、QQ浏览器等）中粘贴打开。',
            showCancel: false,
            confirmText: '知道了',
            confirmColor: '#3B82F6'
          });
        },
        fail: () => {
          wx.showToast({ title: '复制失败，请手动复制', icon: 'none' });
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
