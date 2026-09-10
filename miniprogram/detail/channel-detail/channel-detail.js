// detail/channel-detail/channel-detail.js
const app = getApp();
// 通过 Repository 抽象访问数据（TDD §3/§6），页面不再直接依赖数据模块
const { channels: channelRepo, laws: lawRepo } = require('../repositories').createRepositories();
const { convertSourceToName } = require('../utils/source-utils');

// 所需材料清单：通用基线（多数投诉适用）+ 按二级分类的场景化补充（PRD §9.3.2）
const DEFAULT_MATERIALS = [
  { name: '身份与关系证明', required: true, desc: '本人身份证、与对方的关系证明（如劳动合同、会员信息）' },
  { name: '交易与合同凭证', required: true, desc: '订单、支付记录、合同、发票等证明交易关系' },
  { name: '沟通记录', required: true, desc: '聊天记录、通话录音、邮件等证明协商与诉求' },
  { name: '侵权证据', required: true, desc: '照片、视频、质检报告、录屏、物流单等证明侵权事实' },
  { name: '时间线说明', required: false, desc: '按时间顺序梳理事发经过，条理清晰' },
  { name: '诉求与损失证明', required: false, desc: '退款 / 赔偿计算、损失凭证等' }
];

const CONSUMER_MATERIALS = [
  { name: '订单与支付凭证', required: true, desc: '订单截图、支付记录、发票' },
  { name: '商品 / 服务问题证据', required: true, desc: '照片、视频、质检报告、录屏' },
  { name: '与商家协商记录', required: true, desc: '聊天记录、通话录音，证明已先企业内部投诉' },
  { name: '诉求说明', required: true, desc: '退款、赔偿、换货等具体诉求' },
  { name: '本人身份信息', required: false, desc: '实名投诉所需' }
];

const LABOR_MATERIALS = [
  { name: '劳动合同', required: true, desc: '证明劳动关系与权利义务' },
  { name: '工资流水', required: true, desc: '银行流水、工资条，证明欠薪 / 克扣' },
  { name: '考勤记录', required: true, desc: '打卡、排班，证明出勤与加班' },
  { name: '解除 / 辞退通知', required: true, desc: '辞退证明、解除协议' },
  { name: '社保 / 公积金记录', required: false, desc: '社保、公积金缴存明细' },
  { name: '本人身份证明', required: false, desc: '身份证等实名材料' }
];

const PROPERTY_MATERIALS = [
  { name: '物业 / 租房合同', required: true, desc: '证明服务关系与约定' },
  { name: '缴费凭证', required: true, desc: '物业费、水电费等票据' },
  { name: '报修 / 投诉记录', required: true, desc: '报修单、与物业沟通记录' },
  { name: '现场照片 / 视频', required: true, desc: '房屋质量、设施损坏等证据' },
  { name: '沟通记录', required: false, desc: '与物业协商过程' }
];

const FINANCE_MATERIALS = [
  { name: '合同 / 协议', required: true, desc: '理财、保险、贷款等协议文本' },
  { name: '营销页截图', required: true, desc: '销售宣传、承诺截图，证明误导' },
  { name: '扣费流水', required: true, desc: '银行流水、扣款记录' },
  { name: '销售录音 / 聊天', required: true, desc: '销售过程沟通记录' },
  { name: '本人身份证明', required: false, desc: '身份证、保单信息等' }
];

const TELECOM_MATERIALS = [
  { name: '账单 / 套餐截图', required: true, desc: '证明订购与收费' },
  { name: '扣费记录', required: true, desc: '异常扣费明细' },
  { name: '与运营商沟通记录', required: true, desc: '客服聊天 / 通话，证明已投诉' },
  { name: '本人身份证明', required: false, desc: '实名办理所需' }
];

// 维权路径类型标签（path_type 枚举，media 为第四条路径）
const PATH_TYPE_LABELS = {
  gov: '政府部门',
  legal: '法律渠道',
  regulator: '监管部门',
  media: '媒体曝光'
};

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
    statusInfo: null,
    loading: true,  // 加载状态
    showLawModal: false,
    currentLaw: null,
    sourceName: '',
    materialsList: [],     // 所需材料清单（渠道自带 / 场景化 / 通用基线）
    pathTypeLabel: ''      // 维权路径标签（政府部门/法律渠道/监管部门/媒体曝光）
  },

  // ========== 自定义弹窗通用方法 ==========
  showConfirmModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'confirm',
      modalTitle: options.title || '提示',
      modalContent: options.content || '',
      modalConfirmText: options.confirmText || '确定',
      modalCancelText: options.cancelText || '取消',
      modalShowCancel: options.showCancel !== false,
      modalCallback: options.success || null
    });
  },

  showInputModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'input',
      modalTitle: options.title || '请输入',
      modalPlaceholder: options.placeholder || '请输入',
      modalDefaultValue: options.defaultValue || '',
      modalConfirmText: options.confirmText || '确定',
      modalCancelText: options.cancelText || '取消',
      modalCallback: options.success || null
    });
  },

  showActionSheetModal(options) {
    this.setData({
      modalVisible: true,
      modalType: 'actionSheet',
      modalItemList: options.itemList || [],
      modalCallback: options.success || null
    });
  },

  onModalConfirm(e) {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback) {
      if (this.data.modalType === 'input') {
        callback({ confirm: true, content: e.detail.value });
      } else {
        callback({ confirm: true });
      }
    }
  },

  onModalCancel() {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback && this.data.modalType !== 'actionSheet') {
      callback({ cancel: true });
    }
  },

  onModalSelect(e) {
    const callback = this.data.modalCallback;
    this.setData({ modalVisible: false, modalCallback: null });
    if (callback) {
      callback({ tapIndex: e.detail.index });
    }
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
    const channel = channelRepo.getChannelDetail(id);
    if (!channel) {
      wx.showToast({ title: '渠道不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    // 写入浏览历史
    app.addViewHistory('channel', id, channel.name, channel.phone || '');

    // 第一批：先设置关键信息（标题、联系方式），让用户快速看到核心内容
    const contactItems = this.buildContactItems(channel);
    const statusInfo = this.buildStatusInfo(channel);
    
    // 把issue_types转换成可读标签
    const config = require('../../data/config.js');
    const issueTypesConfig = config.issue_types || {};
    const issueTypeLabels = (channel.issue_types || []).map(key => ({
      key: key,
      name: issueTypesConfig[key] ? issueTypesConfig[key].name : key
    }));
    
    // 转换信息来源：网址转网站名
    const sourceName = convertSourceToName(channel.source || '');
    const materialsList = this.buildMaterialsList(channel);
    const pathTypeLabel = PATH_TYPE_LABELS[channel.path_type] || '';
    this.setData({
      channel,
      contactItems,
      statusInfo,
      issueTypeLabels,
      loading: false,
      isFavorite: app.isFavorite('channels', id),
      sourceName,
      materialsList,
      pathTypeLabel
    });

    // 第二批：异步加载关联内容（话术、法律依据），不阻塞首屏渲染
    setTimeout(() => {
      const relatedScripts = channelRepo.getRelatedScripts(id);
      const allLaws = lawRepo.getLaws();
      
      // 根据渠道分类筛选相关法律法规
      const categoryLaws = this.getLawsByCategory(channel, allLaws);
      
      this.setData({
        relatedScripts,
        laws: categoryLaws,
        tipsText: channel.tips || '',
        preconditionText: channel.precondition || ''
      });
    }, 50);
  },

  // 构建所需材料清单：渠道自带 > 按二级分类场景化 > 通用基线
  buildMaterialsList(channel) {
    if (channel.materials && channel.materials.length > 0) return channel.materials;
    const l2 = channel.category_l2 || '';
    if (l2.indexOf('劳动') >= 0 || l2.indexOf('社保') >= 0) return LABOR_MATERIALS;
    if (l2.indexOf('物业') >= 0 || l2.indexOf('房地产') >= 0) return PROPERTY_MATERIALS;
    if (l2.indexOf('银行') >= 0 || l2.indexOf('保险') >= 0 || l2.indexOf('证券') >= 0 || l2.indexOf('金融') >= 0) return FINANCE_MATERIALS;
    if (l2.indexOf('电信') >= 0) return TELECOM_MATERIALS;
    if (l2.indexOf('电商') >= 0 || l2.indexOf('消费者权益') >= 0 || l2.indexOf('网购') >= 0) return CONSUMER_MATERIALS;
    return DEFAULT_MATERIALS;
  },

  // 根据渠道分类筛选相关法律法规（优先使用渠道自带的legal_basis_with_articles字段）
  getLawsByCategory(channel, allLaws) {
    // 优先使用渠道自带的法律依据+条款字段（精确匹配，只展示该渠道用到的条款）
    if (channel.legal_basis_with_articles && channel.legal_basis_with_articles.length > 0) {
      const matchedLaws = [];
      
      channel.legal_basis_with_articles.forEach(item => {
        // 从本地法律库查找法律
        let matchedLaw = null;
        if (item.law_id) {
          matchedLaw = allLaws.find(law => law.id === item.law_id);
        }
        if (!matchedLaw && item.law_name) {
          matchedLaw = allLaws.find(law => {
            const localName = (law.name || law.title || '').trim();
            return localName === item.law_name || 
                   localName.replace('中华人民共和国', '').trim() === item.law_name.replace('中华人民共和国', '').trim();
          });
        }
        
        if (matchedLaw) {
          // 只展示该渠道引用的条款
          let articles = [];
          if (item.article_ids && item.article_ids.length > 0 && matchedLaw.articles) {
            articles = matchedLaw.articles.filter(art => item.article_ids.includes(art.id));
          }
          
          matchedLaws.push({
            id: matchedLaw.id,
            name: matchedLaw.name || matchedLaw.title,
            article: matchedLaw.article || matchedLaw.description || '',
            description: matchedLaw.description || matchedLaw.article || '',
            articles: articles,
            isChannelBuiltin: true
          });
        } else {
          // 本地库没有匹配到，只展示名称
          matchedLaws.push({
            id: 'law_' + item.law_name,
            name: item.law_name,
            article: '',
            description: '该法律详细条款待补充',
            articles: [],
            isChannelBuiltin: true
          });
        }
      });
      
      return matchedLaws.slice(0, 5);
    }
    
    // 回退：使用旧的legal_basis字段（解析《...》格式）
    if (channel.legal_basis && channel.legal_basis.trim()) {
      const matchedLaws = [];
      const seenNames = new Set();
      
      const lawMatches = channel.legal_basis.match(/《([^》]+)》/g);
      if (lawMatches) {
        lawMatches.forEach(match => {
          const lawName = match.replace(/[《》]/g, '').trim();
          if (seenNames.has(lawName)) return;
          seenNames.add(lawName);
          
          let matchedLaw = allLaws.find(law => {
            const localName = (law.name || law.title || '').trim();
            if (localName === lawName) return true;
            const localShort = localName.replace('中华人民共和国', '').trim();
            const inputShort = lawName.replace('中华人民共和国', '').trim();
            if (localShort === inputShort) return true;
            if (localName.includes(lawName) || lawName.includes(localName)) return true;
            if (localShort.includes(inputShort) || inputShort.includes(localShort)) return true;
            return false;
          });
          
          if (matchedLaw) {
            matchedLaws.push({
              id: matchedLaw.id,
              name: matchedLaw.name || matchedLaw.title,
              article: matchedLaw.article || matchedLaw.description || '',
              description: matchedLaw.description || matchedLaw.article || '',
              articles: matchedLaw.articles || [],
              isChannelBuiltin: true
            });
          } else {
            matchedLaws.push({
              id: 'law_' + lawName,
              name: lawName,
              article: '',
              description: '该法律条款待补充',
              articles: [],
              isChannelBuiltin: true
            });
          }
        });
      }
      
      if (matchedLaws.length === 0) {
        matchedLaws.push({
          id: 'channel_legal_basis',
          name: channel.legal_basis.length > 30 ? channel.legal_basis.substring(0, 30) + '...' : channel.legal_basis,
          description: channel.legal_basis,
          article: channel.legal_basis,
          articles: [],
          isChannelBuiltin: true
        });
      }
      
      return matchedLaws.slice(0, 5);
    }
  },

  // 构建渠道状态信息（已整合/停用提示）
  buildStatusInfo(channel) {
    const status = channel.status || 'active';
    if (status === 'active') return null;

    let info = {
      type: status,
      title: '',
      message: '',
      replacementName: '',
      replacementPhone: '',
      replacementId: ''
    };

    if (status === 'merged') {
      info.title = '该热线已整合';
      info.message = '该热线已整合至其他渠道，建议直接拨打替代渠道';
    } else if (status === 'discontinued') {
      info.title = '该渠道已停用';
      info.message = '该渠道已停止使用，请使用以下替代渠道';
    } else if (status === 'merging') {
      info.title = '该热线正在整合';
      info.message = '该热线正在逐步整合，部分地区可能已无法使用，建议优先使用替代渠道';
    }

    // 查找替代渠道
    if (channel.merged_to) {
      const replacement = channelRepo.getChannelDetail(channel.merged_to);
      if (replacement) {
        info.replacementName = replacement.name;
        info.replacementPhone = replacement.phone || '';
        info.replacementId = replacement.id;
      }
    }

    return info;
  },

  // 打开法律详情弹窗
  openLawModal(e) {
    const law = e.currentTarget.dataset.law;
    if (law) {
      // 格式化条款内容，添加合理换行
      const formattedLaw = this.formatLawArticles(law);
      this.setData({
        currentLaw: formattedLaw,
        showLawModal: true
      });
    }
  },

  // 格式化法律条款内容，添加合理换行
  formatLawArticles(law) {
    if (!law.articles || law.articles.length === 0) {
      return law;
    }
    const formattedArticles = law.articles.map(article => {
      let text = article.content;
      // 1. 条款编号后换行
      text = text.replace(/^(第[一二三四五六七八九十百零千]+条)/, '$1' + String.fromCharCode(10));
      // 2. 中文数字分项前换行
      text = text.replace(/（[一二三四五六七八九十]+）/g, function(match, offset) {
        return offset > 0 ? String.fromCharCode(10) + match : match;
      });
      // 3. 阿拉伯数字分项前换行
      text = text.replace(/（\d+）/g, function(match, offset) {
        return offset > 0 ? String.fromCharCode(10) + match : match;
      });
      // 4. 去除多余连续换行
      text = text.replace(/\n{3,}/g, String.fromCharCode(10) + String.fromCharCode(10));
      // 5. 去除首尾空格
      text = text.trim();
      return {
        id: article.id,
        content: text
      };
    });
    return {
      id: law.id,
      name: law.name,
      article: law.article,
      description: law.description,
      articles: formattedArticles
    };
  },

  // 关闭法律详情弹窗
  closeLawModal() {
    this.setData({
      showLawModal: false,
      currentLaw: null
    });
  },

  // 阻止弹窗内容区域的点击事件冒泡
  preventModalBubble() {
    // 空方法，用于阻止冒泡
  },

  // 复制法律条款
  onLawTap(e) {
    const law = e.currentTarget.dataset.law;
    if (law) {
      let copyContent = law.name + '\n\n';
      if (law.articles && law.articles.length > 0) {
        law.articles.forEach(function(art, index) {
          copyContent += art.content;
          if (index < law.articles.length - 1) {
            copyContent += '\n\n';
          }
        });
      } else if (law.article) {
        copyContent += law.article;
      } else if (law.description) {
        copyContent += law.description;
      }
      wx.setClipboardData({
        data: copyContent,
        success: function() {
          wx.showToast({ title: '法律条款已复制', icon: 'success' });
        }
      });
    }
  },

  buildContactItems(channel) {
    const items = [];
    if (channel.phone) {
      // 提取第一个有效的电话号码
      // 支持：5位短号码(12305/12315)、带区号号码(010-12345678)、11位手机号
      const phoneMatch = channel.phone.match(/\d{5}|\d{3,4}-?\d{7,8}|\d{11}/);
      let cleanPhone = '';
      if (phoneMatch) {
        cleanPhone = phoneMatch[0];
      } else {
        // 回退逻辑：提取第一个连续的数字序列（至少3位），避免把所有数字拼在一起
        const firstNumMatch = channel.phone.match(/\d{3,}/);
        cleanPhone = firstNumMatch ? firstNumMatch[0] : channel.phone.replace(/[^0-9-]/g, '');
      }
      items.push({ type: 'phone', label: '投诉电话', value: channel.phone, cleanPhone: cleanPhone, action: 'call' });
    }
    if (channel.website || channel.url) {
      items.push({ type: 'website', label: '官方网站', value: channel.website || channel.url, action: 'visit' });
    }
    if (channel.regulator) {
      items.push({ type: 'other', label: '主管单位', value: channel.regulator, action: '' });
    }
    if (channel.phone_note) {
      items.push({ type: 'other', label: '电话说明', value: channel.phone_note, action: '' });
    }
    return items;
  },

  // 点击替代渠道跳转
  onReplacementTap() {
    const { statusInfo } = this.data;
    if (statusInfo && statusInfo.replacementId) {
      wx.redirectTo({
        url: `/detail/channel-detail/channel-detail?id=${statusInfo.replacementId}`
      });
    }
  },

  onContactAction(e) {
    const item = e.currentTarget.dataset.item;
    if (item.action === 'call') {
      // 电话点击 → 二次确认后跳转拨号页
      let phoneNumber = item.cleanPhone;
      if (!phoneNumber) {
        const match = item.value.match(/\d{5}|\d{3,4}-?\d{7,8}|\d{11}/);
        phoneNumber = match ? match[0] : item.value.replace(/[^0-9-]/g, '');
      }
      this.showConfirmModal({
        title: '确认拨打',
        content: `确认拨打投诉电话 ${phoneNumber}？`,
        confirmText: '确认拨打',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.makePhoneCall({
              phoneNumber: phoneNumber,
              fail: () => {
                wx.showToast({ title: '拨打失败，请手动拨打', icon: 'none' });
              }
            });
          }
        }
      });
    } else if (item.action === 'visit') {
      // 网站点击 → 复制网址 + 提示用外部浏览器打开
      wx.setClipboardData({
        data: item.value,
        success: () => {
          this.showConfirmModal({
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
      url: `/detail/script-detail/script-detail?id=${id}`
    });
  },

  onFavoriteTap() {
    const { channelId } = this.data;
    const isFavorite = app.toggleFavorite('channels', channelId);
    this.setData({ isFavorite });
    wx.showToast({
      title: isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  onShareTap() {
    // 分享功能：调用小程序原生分享
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    wx.showToast({ title: '点击右上角分享', icon: 'none' });
  },

  onCallTap() {
    const { channel, contactItems } = this.data;
    const phoneItem = contactItems.find(i => i.action === 'call');
    if (phoneItem) {
      this.showConfirmModal({
        title: '确认拨打',
        content: `确认拨打投诉电话 ${phoneItem.cleanPhone}？`,
        confirmText: '确认拨打',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.makePhoneCall({
              phoneNumber: phoneItem.cleanPhone,
              fail: () => {
                wx.showToast({ title: '拨打失败，请手动拨打', icon: 'none' });
              }
            });
          }
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

  onBackTap() {
    wx.navigateBack();
  },

  // 分享给朋友
  onShareAppMessage() {
    const { channel } = this.data;
    return {
      title: channel ? channel.name : '我不能被欺负 - 官方投诉渠道大全',
      path: '/pages/index/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { channel } = this.data;
    return {
      title: channel ? channel.name : '我不能被欺负 - 官方投诉渠道大全'
    };
  },

  onShow() {
  },
});
