// detail/channel-detail/channel-detail.js
const app = getApp();
// 通过 Repository 抽象访问数据（TDD §3/§6），页面不再直接依赖数据模块
const { channels: channelRepo, laws: lawRepo } = require('../repositories').createRepositories();
const { convertSourceToName } = require('../utils/source-utils');

// 所需材料清单：通用基线（多数投诉适用）+ 按二级分类/名称/问题类型的场景化补充（PRD §9.3.2）
const DEFAULT_MATERIALS = [
  { name: '身份与关系证明', required: true, desc: '本人身份证、手机号、与被投诉方的关系证明（如劳动合同、会员信息）' },
  { name: '交易与合同凭证', required: true, desc: '订单截图、支付记录、合同/协议、发票、收据等证明交易关系' },
  { name: '沟通记录', required: true, desc: '聊天记录截图、通话录音、邮件往来、客服工单等证明协商过程' },
  { name: '侵权证据', required: true, desc: '问题照片/视频、质检报告、录屏、物流单、诊断证明等证明侵权事实' },
  { name: '时间线说明', required: false, desc: '按日期整理的事件经过，帮助受理方快速了解案情' },
  { name: '诉求与损失证明', required: false, desc: '具体诉求清单、损失金额计算依据、就医/维修票据' }
];

const CONSUMER_MATERIALS = [
  { name: '订单与支付凭证', required: true, desc: '订单截图、支付记录、发票、收据' },
  { name: '商品 / 服务问题证据', required: true, desc: '照片、视频、质检报告、录屏' },
  { name: '与商家协商记录', required: true, desc: '聊天记录、通话录音，证明已先企业内部投诉' },
  { name: '诉求说明', required: true, desc: '退款、赔偿、换货等具体诉求' },
  { name: '本人身份信息', required: false, desc: '实名投诉所需' }
];

const EXPRESS_MATERIALS = [
  { name: '快递单号截图', required: true, desc: '运单号、物流信息' },
  { name: '物品价值证明', required: true, desc: '发票、购买记录等证明内件价值' },
  { name: '企业投诉记录', required: true, desc: '与快递公司客服沟通记录、投诉工单编号' },
  { name: '物品损坏 / 丢失证据', required: true, desc: '物品破损/丢失照片、视频' },
  { name: '保价凭证', required: false, desc: '如有保价，提供保价记录' },
  { name: '损失金额计算', required: false, desc: '索赔金额计算说明' }
];

const TELECOM_MATERIALS = [
  { name: '手机号和身份信息', required: true, desc: '被收费号码、身份证后四位/实名信息' },
  { name: '话费账单截图', required: true, desc: '含扣费明细的账单' },
  { name: '业务开通记录', required: true, desc: '套餐/增值业务开通记录' },
  { name: '未确认开通证据', required: false, desc: '从未同意开通业务的截图/录音' },
  { name: '企业投诉记录', required: true, desc: '与运营商客服沟通记录、投诉工单编号' },
  { name: '累计扣费金额计算', required: false, desc: '多扣费用汇总' }
];

const MERCHANT_MATERIALS = [
  { name: '订单截图和支付凭证', required: true, desc: '订单、支付记录' },
  { name: '商品宣传页面截图', required: true, desc: '宣传承诺、价格、功能说明' },
  { name: '收到商品照片 / 视频', required: true, desc: '货不对板、假货、破损等证据' },
  { name: '与商家沟通记录', required: true, desc: '聊天记录、通话录音' },
  { name: '商品问题鉴定报告', required: false, desc: '如有质检/鉴定报告' },
  { name: '损失金额计算', required: false, desc: '退款/赔偿金额计算' }
];

const BANK_MATERIALS = [
  { name: '合同 / 保单原件', required: true, desc: '理财、保险、贷款等协议文本' },
  { name: '支付凭证和扣费流水', required: true, desc: '银行流水、扣款记录' },
  { name: '产品宣传材料截图', required: true, desc: '销售宣传、承诺截图，证明误导' },
  { name: '风险测评记录', required: true, desc: '风险承受能力测评结果' },
  { name: '销售过程录音 / 聊天', required: false, desc: '销售过程沟通记录' },
  { name: '损失金额计算', required: false, desc: '具体损失金额' }
];

const PROPERTY_MATERIALS = [
  { name: '物业服务合同', required: true, desc: '证明服务关系与约定' },
  { name: '物业费缴费凭证', required: true, desc: '物业费、水电费等票据' },
  { name: '报修 / 投诉记录', required: true, desc: '报修单、与物业沟通记录' },
  { name: '问题现场照片 / 视频', required: true, desc: '房屋质量、设施损坏、乱收费等证据' },
  { name: '违规收费依据对比', required: false, desc: '收费标准与实际收费对比' },
  { name: '损失金额计算', required: false, desc: '多收费用/损失金额' }
];

const LABOR_MATERIALS = [
  { name: '劳动合同 / 入职证明', required: true, desc: '劳动合同、工牌、工服、入职通知等证明劳动关系' },
  { name: '工资条 / 银行流水', required: true, desc: '工资条、银行流水，证明欠薪/克扣' },
  { name: '考勤记录', required: true, desc: '打卡、排班，证明出勤与加班' },
  { name: '催要工资沟通记录', required: true, desc: '聊天记录、通话录音' },
  { name: '社保 / 公积金记录', required: false, desc: '社保、公积金缴存明细' },
  { name: '拖欠金额和月份明细', required: false, desc: '欠薪月份、金额汇总' }
];

const MEDICAL_MATERIALS = [
  { name: '门诊 / 住院病历', required: true, desc: '病历、诊断证明' },
  { name: '收费清单和发票', required: true, desc: '医疗费票据、收费明细' },
  { name: '检查报告 / 用药清单', required: true, desc: '检验报告、影像资料、用药清单' },
  { name: '与医院沟通记录', required: true, desc: '投诉、协商记录' },
  { name: '损害后果证明', required: false, desc: '诊断/鉴定、后续治疗证明' },
  { name: '就诊时间线', required: false, desc: '按日期整理就诊经过' }
];

const EDUCATION_MATERIALS = [
  { name: '培训合同 / 协议', required: true, desc: '培训合同、补充协议' },
  { name: '缴费凭证', required: true, desc: '转账记录、发票、收据' },
  { name: '上课记录 / 考勤', required: true, desc: '课时记录、签到记录' },
  { name: '与机构沟通记录', required: true, desc: '退费协商聊天记录、通话录音' },
  { name: '剩余课时 / 金额计算', required: true, desc: '应退金额计算' },
  { name: '机构停课 / 跑路证据', required: false, desc: '现场照片、通知、其他学员联合维权材料' }
];

const RENTAL_MATERIALS = [
  { name: '房屋租赁合同', required: true, desc: '租赁合同、补充协议' },
  { name: '押金 / 租金支付凭证', required: true, desc: '转账记录、收据' },
  { name: '房屋交接清单和照片', required: true, desc: '入住/退租时房屋状态' },
  { name: '与房东 / 中介沟通记录', required: true, desc: '聊天记录、通话录音' },
  { name: '房屋设施损坏证明', required: false, desc: '如有争议，提供损坏证据' },
  { name: '退租通知记录', required: false, desc: '提前退租通知、押金退还要求' }
];

const FOOD_MATERIALS = [
  { name: '订单截图和支付凭证', required: true, desc: '外卖/餐饮订单、支付记录' },
  { name: '问题食品照片 / 视频', required: true, desc: '异物、变质、过期等证据' },
  { name: '与商家 / 平台沟通记录', required: true, desc: '聊天记录、投诉记录' },
  { name: '就餐时间和地点', required: true, desc: '订单时间、门店/商家' },
  { name: '就医诊断证明和医疗费票据', required: false, desc: '如身体不适就医' },
  { name: '剩余食品保留', required: false, desc: '建议保留问题食品备查' }
];

const RIDE_MATERIALS = [
  { name: '行程记录 / 订单截图', required: true, desc: '网约车/出租车订单' },
  { name: '司机 / 车辆信息', required: true, desc: '车牌号、司机信息' },
  { name: '支付凭证', required: true, desc: '实际支付金额' },
  { name: '行驶路线对比图', required: true, desc: '实际路线与合理路线对比' },
  { name: '与平台 / 司机沟通记录', required: false, desc: '投诉、协商记录' },
  { name: '车内录音 / 录像', required: false, desc: '如有录音录像' }
];

const PREPAID_MATERIALS = [
  { name: '会员卡 / 合同', required: true, desc: '健身卡/美容卡合同、会员协议' },
  { name: '充值 / 付款凭证', required: true, desc: '转账记录、发票、收据' },
  { name: '消费记录', required: true, desc: '剩余卡值/次数计算依据' },
  { name: '与商家沟通记录', required: true, desc: '退费协商记录' },
  { name: '商家关门 / 失联证据', required: false, desc: '现场照片、通知、其他消费者联合维权材料' }
];

const RENOVATION_MATERIALS = [
  { name: '装修合同及附件', required: true, desc: '装修合同、报价单、设计图' },
  { name: '付款凭证', required: true, desc: '转账记录、发票' },
  { name: '施工质量问题照片 / 视频', required: true, desc: '偷工减料、质量问题证据' },
  { name: '工程进度记录', required: true, desc: '约定进度与实际进度' },
  { name: '延期天数和违约金计算', required: false, desc: '延期赔偿计算' },
  { name: '第三方检测报告', required: false, desc: '如有空气质量、工程质量检测' }
];

const NOISE_MATERIALS = [
  { name: '噪音录音 / 视频', required: true, desc: '录制噪音发生时的音频/视频' },
  { name: '噪音发生时间记录', required: true, desc: '记录噪音发生的日期、时段' },
  { name: '噪音源位置照片', required: true, desc: '噪音来源位置' },
  { name: '报警 / 投诉记录', required: false, desc: '110 报警、12345/物业投诉记录' },
  { name: '受影响证明', required: false, desc: '就医记录、失眠记录、邻居联名证明' },
  { name: '与对方 / 物业沟通记录', required: false, desc: '协商记录' }
];

const ONLINE_SHOPPING_MATERIALS = [
  { name: '订单截图和支付凭证', required: true, desc: '订单、支付记录' },
  { name: '商家发货承诺截图', required: true, desc: '承诺发货时间、库存说明' },
  { name: '物流信息截图', required: true, desc: '无记录或异常的物流信息' },
  { name: '申请退款记录', required: true, desc: '平台退款申请记录' },
  { name: '商品宣传页面截图', required: false, desc: '宣传承诺、价格' },
  { name: '与商家 / 平台沟通记录', required: false, desc: '聊天记录、平台介入记录' }
];

const CAR_MATERIALS = [
  { name: '购车合同 / 发票', required: true, desc: '购车合同、发票、车辆合格证' },
  { name: '付款凭证', required: true, desc: '首付款/贷款/全款凭证' },
  { name: '维修记录', required: true, desc: '4S 店维修、保养记录' },
  { name: '车辆质量问题照片 / 视频', required: true, desc: '故障、损坏、强制消费证据' },
  { name: '强制消费证据', required: false, desc: '合同条款、录音、加装/服务费明细' },
  { name: '第三方检测报告', required: false, desc: '如有质量检测/鉴定' }
];

const LOCKER_MATERIALS = [
  { name: '快递单号和物流信息', required: true, desc: '运单号、物流状态' },
  { name: '取件收费截图 / 金额记录', required: true, desc: '收费金额、收费页面' },
  { name: '未经同意存放证据', required: true, desc: '未授权投放截图、短信' },
  { name: '快递柜 / 驿站现场照片', required: true, desc: '现场取件收费照片' },
  { name: '与快递员 / 客服沟通记录', required: true, desc: '投诉、沟通记录' },
  { name: '多次违规记录', required: false, desc: '多次被违规收费的截图/记录' }
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

  // 构建所需材料清单：渠道自带 > 按二级分类/名称/问题类型场景化 > 通用基线
  buildMaterialsList(channel) {
    if (channel.materials && channel.materials.length > 0) return channel.materials;
    const l2 = channel.category_l2 || '';
    const name = (channel.name || '').toLowerCase();
    const scope = (channel.scope || '').toLowerCase();
    const issues = (channel.issue_types || []).join(',').toLowerCase();
    const text = (l2 + '|' + name + '|' + scope + '|' + issues).toLowerCase();

    if (/快递柜|驿站违规收费/.test(text)) return LOCKER_MATERIALS;
    if (/快递|邮政|驿站/.test(text)) return EXPRESS_MATERIALS;
    if (/电信|运营商|话费|宽带|移动通信/.test(text)) return TELECOM_MATERIALS;
    if (/外卖|餐饮食品|食品安全/.test(text)) return FOOD_MATERIALS;
    if (/网约车|出租车|拒载|绕路/.test(text)) return RIDE_MATERIALS;
    if (/汽车|4S|购车|车辆/.test(text)) return CAR_MATERIALS;
    if (/装修|装潢|施工|延期|偷工减料/.test(text)) return RENOVATION_MATERIALS;
    if (/噪音|噪声/.test(text)) return NOISE_MATERIALS;
    if (/网购|不发货|虚假发货/.test(text)) return ONLINE_SHOPPING_MATERIALS;
    if (/健身|美容|预付卡|预付费|跑路/.test(text)) return PREPAID_MATERIALS;
    if (/租房|房东|押金|租赁/.test(text)) return RENTAL_MATERIALS;
    if (/教育培训|退费|培训机构|学校/.test(text)) return EDUCATION_MATERIALS;
    if (/医疗|医院|医生|收费/.test(text)) return MEDICAL_MATERIALS;
    if (/劳动|社保|欠薪|工资|仲裁/.test(text)) return LABOR_MATERIALS;
    if (/物业|房地产|房产|业委会/.test(text)) return PROPERTY_MATERIALS;
    if (/银行|保险|证券|基金|理财|金融/.test(text)) return BANK_MATERIALS;
    if (/消费者|12315|电商|商家|退款|假货|虚假宣传/.test(text)) return MERCHANT_MATERIALS;
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

  // 跳转媒体曝光指南页
  onMediaExposureTap() {
    wx.navigateTo({
      url: '/subpages/media-exposure/media-exposure'
    });
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
