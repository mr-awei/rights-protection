// detail/script-detail/script-detail.js
const app = getApp();
// 通过 Repository 抽象访问数据（TDD §3/§6），页面不再直接依赖数据模块
const { channels: channelRepo, scripts: scriptRepo, laws: lawRepo } = require('../repositories').createRepositories();

// 常见平台/公司类字段的候选选项（行业集中度高、常见就那几家）。
// 表单仍保留文本输入：用户可直接手输，也可点「选择」快速填入。
const SELECT_OPTIONS = {
  // 外卖 / 餐饮点餐平台（场景 10 用于说明在哪家平台点的餐；
  // 注意：达达快送/顺丰同城/闪送/UU跑腿属于跑腿配送平台，不是点餐平台，勿混入）
  '外卖平台': [
    '美团外卖', '饿了么', '京东外卖', '抖音外卖', '淘宝闪购',
    '肯德基宅急送', '麦当劳麦乐送', '必胜客宅享送', '商家自营外卖'
  ],
  // 快递公司（按国内业务量/常见度排序）
  '快递公司名称': [
    '顺丰速运', '中通快递', '圆通速递', '申通快递', '韵达快递',
    '极兔速递', '京东物流', '邮政EMS', '德邦快递', '菜鸟速递',
    '天天快递', '宅急送', '苏宁物流', '跨越速运', '安能物流',
    '顺心捷达', '壹米滴答', '中铁快运',
    'DHL', 'FedEx', 'UPS'
  ],
  // 电商 / 购物平台（场景 15 网购商家不发货；美团、饿了么属本地生活，不列入此处）
  '平台名称': [
    '淘宝', '天猫', '京东', '拼多多', '抖音商城', '快手小店',
    '小红书', '唯品会', '苏宁易购', '得物', '闲鱼', '微店',
    '网易严选', '亚马逊', '盒马', '山姆会员商店',
    '天猫超市', '京东自营'
  ],
  // 基础电信运营商（仅 4 家）
  '运营商名称': ['中国移动', '中国联通', '中国电信', '中国广电'],
  // 快递柜 / 驿站品牌
  '快递柜或驿站名称': [
    '丰巢', '菜鸟驿站', '中邮速递易', '京东快递柜', '妈妈驿站',
    '兔喜快递超市', '驿收发', '快宝驿站', '多多驿站', '邮政便民服务站'
  ]
};

// 所需材料清单：通用基线 + 按话术场景名称/关键词的场景化补充（PRD §9.3.2）
const DEFAULT_MATERIALS = [
  { name: '身份与关系证明', required: true, desc: '本人身份证、手机号、与对方的关系证明' },
  { name: '交易与合同凭证', required: true, desc: '订单截图、支付记录、合同/协议、发票、收据等证明交易关系' },
  { name: '沟通记录', required: true, desc: '聊天记录截图、通话录音、邮件往来、客服工单等证明协商过程' },
  { name: '侵权证据', required: true, desc: '问题照片/视频、质检报告、录屏、物流单、诊断证明等证明侵权事实' },
  { name: '时间线说明', required: false, desc: '按日期整理的事件经过，帮助受理方快速了解案情' },
  { name: '诉求与损失证明', required: false, desc: '具体诉求清单、损失金额计算依据、就医/维修票据' }
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

Page({
  data: {
    scriptId: '',
    script: null,
    relatedChannels: [],
    laws: [],
    activeTab: 'phone',
    isFavorite: false,
    phoneContent: '',
    writtenContent: '',
    writtenSections: [],
    evidenceList: [],
    applicableText: '',
    legalBasisText: '',
    loading: true,
    // 占位符填充功能
    showFillForm: false,
    placeholders: [],
    formData: {},
    formErrors: {},
    customPhoneContent: '',
    customWrittenContent: '',
    customPhoneText: '',
    customWrittenText: '',
    hasCustomContent: false,
    materialsList: []
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
    this.setData({ scriptId: id, loading: true });
    // 异步加载数据，避免阻塞页面渲染
    setTimeout(() => {
      this.loadScript(id);
    }, 16);

  },

  loadScript(id) {
    const script = scriptRepo.getScriptById(id);
    if (!script) {
      wx.showToast({ title: '话术不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    // 写入浏览历史
    app.addViewHistory('script', id, script.scene_name || script.name || '投诉话术', '');

    // 获取话术内容
    const phoneRaw = scriptRepo.getScriptPhoneContent(script);
    const writtenRaw = scriptRepo.getScriptWrittenContent(script);
    const phoneContent = this.highlightPlaceholders(phoneRaw);
    const writtenContent = this.highlightPlaceholders(writtenRaw);
    const evidenceList = script.evidence_list || [];
    const writtenSections = this.buildWrittenSections(script);
    const laws = this.getRelatedLaws(script);
    // 提取所有占位符
    const placeholders = this.extractPlaceholders(phoneRaw + '\n' + writtenRaw);
    // 初始化表单数据
    const formData = {};
    placeholders.forEach(p => { formData[p.name] = ''; });

    // 第一批：先设置核心内容（话术基本信息+内容）
    this.setData({
      script,
      phoneContent,
      writtenContent,
      writtenSections,
      evidenceList,
      applicableText: script.applicable || '',
      legalBasisText: script.legal_basis || '',
      laws,
      placeholders,
      formData,
      formErrors: {},
      isFavorite: app.isFavorite('scripts', id),
      loading: false,
      materialsList: this.buildMaterialsList(script)
    });

    wx.setNavigationBarTitle({ title: script.scene_name || '话术详情' });

    // 第二批：异步加载关联渠道（非核心内容，不阻塞首屏渲染）
    setTimeout(() => {
      const relatedChannels = scriptRepo.getRelatedChannels(id);
      this.setData({ relatedChannels });
    }, 50);
  },

  // 构建所需材料清单：脚本自带 > 按场景名称/关键词场景化 > 通用基线
  buildMaterialsList(script) {
    if (script.materials && script.materials.length > 0) return script.materials;
    const sceneName = (script.scene_name || '').toLowerCase();
    const keywords = (script.keywords || []).join(',').toLowerCase();
    const text = sceneName + '|' + keywords;

    if (/快递柜|驿站违规收费/.test(text)) return LOCKER_MATERIALS;
    if (/快递|邮政|驿站/.test(text)) return EXPRESS_MATERIALS;
    if (/电信|运营商|话费|宽带/.test(text)) return TELECOM_MATERIALS;
    if (/外卖|餐饮|食品安全/.test(text)) return FOOD_MATERIALS;
    if (/网约车|出租车|拒载|绕路/.test(text)) return RIDE_MATERIALS;
    if (/汽车|4S|购车|车辆/.test(text)) return CAR_MATERIALS;
    if (/装修|装潢|施工|延期|偷工减料/.test(text)) return RENOVATION_MATERIALS;
    if (/噪音|噪声/.test(text)) return NOISE_MATERIALS;
    if (/网购|不发货|虚假发货/.test(text)) return ONLINE_SHOPPING_MATERIALS;
    if (/健身|美容|预付卡|预付费|跑路/.test(text)) return PREPAID_MATERIALS;
    if (/租房|房东|押金|租赁/.test(text)) return RENTAL_MATERIALS;
    if (/教育|培训|退费|学校/.test(text)) return EDUCATION_MATERIALS;
    if (/医疗|医院|医生|收费/.test(text)) return MEDICAL_MATERIALS;
    if (/劳动|社保|欠薪|工资|仲裁/.test(text)) return LABOR_MATERIALS;
    if (/物业|房产|房地产/.test(text)) return PROPERTY_MATERIALS;
    if (/银行|保险|证券|基金|理财|金融/.test(text)) return BANK_MATERIALS;
    if (/消费者|12315|电商|商家|退款|假货|虚假宣传/.test(text)) return MERCHANT_MATERIALS;
    return DEFAULT_MATERIALS;
  },

  // 构建书面版分块
  buildWrittenSections(script) {
    const sections = [];
    
    // 新版：统一的written_template字段
    if (script.written_template) {
      sections.push({
        id: 'written_full',
        title: '书面投诉模板（可复制到投诉网站）',
        content: script.written_template
      });
      return sections;
    }
    
    // 旧版：分块字段（兼容）
    if (script.written_complainant) {
      sections.push({ id: 'complainant', title: '投诉人信息', content: script.written_complainant });
    }
    if (script.written_respondent) {
      sections.push({ id: 'respondent', title: '被投诉人信息', content: script.written_respondent });
    }
    if (script.written_request) {
      sections.push({ id: 'request', title: '投诉请求', content: script.written_request });
    }
    if (script.written_facts) {
      sections.push({ id: 'facts', title: '事实与理由', content: script.written_facts });
    }
    if (script.written_evidence) {
      sections.push({ id: 'evidence', title: '证据清单', content: script.written_evidence });
    }
    return sections;
  },

  // 获取相关法律法规
  getRelatedLaws(script) {
    const allLaws = lawRepo.getLaws();
    const keywords = script.keywords || [];
    const sceneName = script.scene_name || '';

    // 根据关键词匹配法律
    let matched = allLaws.filter(law => {
      const lawName = law.name || '';
      const lawTags = law.tags || [];
      // 匹配关键词
      for (const kw of keywords) {
        if (lawName.includes(kw) || lawTags.includes(kw)) return true;
      }
      // 匹配场景名称中的关键词
      if (sceneName.includes('快递') && lawName.includes('快递')) return true;
      if (sceneName.includes('运营商') && (lawName.includes('电信') || lawName.includes('通信'))) return true;
      if (sceneName.includes('商家') && (lawName.includes('消费者') || lawName.includes('产品质量'))) return true;
      if (sceneName.includes('银行') && (lawName.includes('银行') || lawName.includes('保险') || lawName.includes('金融'))) return true;
      if (sceneName.includes('物业') && (lawName.includes('物业') || lawName.includes('民法典'))) return true;
      return false;
    });

    // 如果匹配不到，用通用法律
    if (matched.length === 0) {
      matched = allLaws.filter(law => law.category && law.category.includes('通用'));
    }

    return matched.slice(0, 3);
  },

  // 复制书面版单个分块
  onCopySection(e) {
    const section = e.currentTarget.dataset.section;
    if (!section) return;
    // 已生成个性化话术时，优先复制替换后的纯文本，避免复制到带【占位符】的原始模板
    const { hasCustomContent, customWrittenText } = this.data;
    const content = (hasCustomContent && customWrittenText) ? customWrittenText : section.content;
    this.copyText(content, (section.title || '内容') + '已复制');
  },

  highlightPlaceholders(text) {
    if (!text) return '';
    // rich-text 不加载外部 class，占位符高亮必须用内联 style；
    // 同时转义 HTML 特殊字符，避免用户填写内容里的 < > & 破坏渲染。
    const escaped = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const style = 'style="color:#FA8C16;font-weight:600;"';
    // 高亮 【占位符】 格式
    let result = escaped.replace(/【([^】]+)】/g, '<span ' + style + '>【$1】</span>');
    // 高亮 [占位符] 格式
    result = result.replace(/\[([^\]]+)\]/g, '<span ' + style + '>[$1]</span>');
    // 换行转 <br>
    result = result.replace(/\n/g, '<br/>');
    return result;
  },

  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  onCopyScript() {
    const { activeTab, script, hasCustomContent, customPhoneText, customWrittenText } = this.data;
    // 如果有个性化内容，优先复制个性化内容（纯文本）
    let content;
    if (hasCustomContent) {
      content = activeTab === 'phone' ? customPhoneText : customWrittenText;
    } else {
      content = activeTab === 'phone'
        ? scriptRepo.getScriptPhoneContent(script)
        : scriptRepo.getScriptWrittenContent(script);
    }
    this.copyText(content, hasCustomContent ? '个性化话术已复制' : '话术已复制');
  },

  // ===== 占位符自动填充功能 =====

  /**
   * 提取文本中的所有占位符【】，并附带填写说明
   */
  extractPlaceholders(text) {
    if (!text) return [];
    const regex = /【([^】]+)】/g;
    const placeholders = new Set();
    let match;
    while ((match = regex.exec(text)) !== null) {
      placeholders.add(match[1]);
    }
    // 转换为带说明的对象数组
    return Array.from(placeholders).map(name => ({
      name: name,
      label: this.getPlaceholderLabel(name),
      guide: this.getPlaceholderGuide(name),
      example: this.getPlaceholderExample(name),
      type: this.getPlaceholderType(name),
      options: this.getPlaceholderOptions(name),
      rule: this.getPlaceholderRule(name)
    }));
  },

  /**
   * 根据占位符名称获取友好的显示标签
   */
  getPlaceholderLabel(name) {
    const labels = {
      'XXXX': '身份证后四位',
      'XX元': '金额（元）',
      'X月X日': '日期',
      'X年X月X日': '完整日期',
      'X月': '月份',
      'X个月': '持续月数',
      'X天': '天数',
      'X': '数字',
      'X课时': '课时数',
      'X次': '次数',
      'X年': '年份',
      'X点至X点': '时间段',
      'XX分贝': '分贝数',
      'X天内发货': '发货期限',
      'X天': '天数',
      // —— 以下为各场景「选项类/复合类」占位符的友好标签 ——
      // 这些占位符名较长，若不映射会被统一显示为「投诉事由」，用户无从填写。
      '电梯长期故障不修/公共区域照明损坏/垃圾清理不及时/擅自上涨物业费/收取未公示的停车费': '物业问题类型',
      'X年X月': '年/月',
      '停课/更换老师/缩减课时/负责人失联': '机构违约情形',
      '拒绝退款/拖延处理/联系不上': '机构处理态度',
      '房东姓名/中介公司名称': '房东/中介名称',
      'X年X月至X年X月': '租期起止',
      '租期届满/提前解除合同': '合同状态',
      'X月X日X时': '日期时间',
      '出租车公司或网约车平台名称': '出租车公司/平台',
      '拒载/绕道行驶/不打表/乱收费/态度恶劣/中途甩客': '司机违规行为',
      '健身卡/美容卡/会员卡': '卡类型',
      'X次/X年': '次数/年限',
      '关门停业/负责人失联/转让后不承认原会员卡': '商家违约情形',
      'X次/X个月': '剩余次数/月数',
      'X月X日至X月X日': '日期范围',
      '偷工减料/施工质量不合格/无故延期/未经同意增项加价': '装修公司违规情形',
      '质量不达标/已延期X天/仍未完工': '工程现状',
      '夜间施工/高音喇叭/装修噪音/车辆鸣笛': '噪音类型',
      '每天X点至X点': '噪音时段',
      '无法休息/影响学习/身体健康受损': '造成的损害',
      'X天内发货/预售X月X日前发货': '发货承诺',
      '不回复/拒绝退款/拖延处理': '商家处理态度',
      '强制捆绑保险/装潢/上牌服务/加价提车/售后以次充好/车辆质量问题推诿': '4S店违规情形',
      '具体描述问题，如服务态度差/乱收费/未按约定履行/质量问题等': '问题描述',
      '未得到解决/处理结果不满意/对方态度恶劣': '此前处理情况',
      '具体诉求一，如退款/赔偿/整改/道歉': '诉求一',
      '具体诉求一，如退还费用XX元/赔偿损失XX元/立即整改/书面道歉': '诉求一',
      '办理业务/购买商品/接受服务': '事项类型',
      '具体描述问题，如未按约定履行/乱收费/服务态度差/质量不合格等': '问题描述',
      '详细说明时间、地点、人物、经过': '详细经过',
      '相关法律法规名称，如《消费者权益保护法》《民法典》等': '法律依据',
      '证据一，如合同/订单/发票': '证据一',
      '证据三，如照片/视频/录音': '证据三',
      '证据四，如与被投诉人沟通记录': '证据四',
      '具体描述违法行为，如价格欺诈/虚假宣传/无证经营/安全生产隐患/偷税漏税等': '违法行为描述',
      '详细说明时间、地点、经过': '详细经过',
      '消费者权益/公共利益/市场秩序': '侵害的法益',
      '证据说明，如照片/视频/票据/证人': '证据说明',
      '证据清单，如照片/视频/票据/合同/证人证言': '证据清单',
      '消费者权益/市场秩序/公共利益': '侵害的法益'
    };
    if (labels[name]) return labels[name];
    // 如果名称已经是友好的（不含X且长度<=10），直接返回
    if (!name.includes('X') && name.length <= 10) return name;
    // 长文本描述类占位符（不含X且长度>10），统一显示为"投诉事由"
    if (!name.includes('X') && name.length > 10) return '投诉事由';
    // 否则返回原名称
    return name;
  },

  /**
   * 根据占位符名称获取填写说明
   */
  getPlaceholderGuide(name) {
    const guides = {
      '姓名': '您的真实姓名',
      '手机号': '您的联系电话，方便受理单位回电',
      '身份证号后四位': '身份证最后4位，用于身份核验',
      '身份证号': '完整身份证号，涉及金融/实名投诉时填写',
      '单号': '快递单号/订单号/工单号',
      '快递公司名称': '如：顺丰、圆通、中通等',
      'X月X日': '具体日期，如：3月15日',
      '寄件城市': '快递寄出城市',
      '收件城市': '快递收件城市',
      '已丢失/已破损/已延误X天': '选择实际情况，如：已破损',
      '物品名称': '丢失/破损物品的名称',
      '金额': '涉及金额，单位：元',
      'X': '数字，如：3',
      '编号': '工单号/受理编号',
      '被收费号码': '被乱扣费的手机号',
      '运营商名称': '如：移动、联通、电信',
      '业务名称': '被擅自开通的业务名称',
      '平台名称/店铺名称': '电商平台或店铺名称',
      '商品名称': '购买的商品名称',
      '商家名称/店铺名称': '被投诉商家的全称',
      '统一社会信用代码（如有）': '商家的统一社会信用代码，可在企查查/天眼查查询',
      '银行/保险公司名称': '如：工商银行、平安保险等',
      '网点名称': '具体办理业务的网点名称',
      '姓名/工号': '涉事工作人员的姓名或工号',
      '存款/理财': '您原本要办理的业务类型',
      '保险/高风险理财': '被误导办理的业务类型',
      '小区名称': '您所在的小区全称',
      '栋号单元房号': '如：3栋2单元501',
      '物业公司名称': '物业服务公司全称',
      '具体描述：如小区公共区域长期无人打扫/电梯故障长期不修/擅自提高物业费/收取未经公示的费用': '简要描述具体问题',
      'X月': '问题开始的月份，如：1月',
      'X个月': '持续时间，如：3个月',
      '地址': '详细通讯地址',
      '可选，涉及金融/实名投诉时填写': '选填项，根据需要填写',
      '可选，如知道': '选填项，知道就填',
      '可选': '选填项',
      '受理单位全称，如"国家邮政局邮政业申诉服务平台"': '填写受理投诉的单位全称',
      'X年X月X日': '完整日期，如：2024年3月15日'
    };
    // 精确匹配
    if (guides[name]) return guides[name];
    // 长文本描述类占位符（不含X且长度>10），统一返回通用说明
    if (!name.includes('X') && name.length > 10) return '简要描述具体问题';
    // 模糊匹配
    for (const key in guides) {
      if (name.includes(key) || key.includes(name)) {
        return guides[key];
      }
    }
    return '请填写' + name;
  },

  /**
   * 根据占位符名称获取填写示例
   */
  getPlaceholderExample(name) {
    const examples = {
      '姓名': '张三',
      '手机号': '13812345678',
      '单号': 'SF1234567890',
      '金额': '500',
      'X月X日': '3月15日',
      'X': '3'
    };
    if (examples[name]) return examples[name];
    return '';
  },

  /**
   * 判断占位符对应的输入控件类型
   * - date  ：日期类（X月X日 / X年X月X日 / 标签为「日期」「完整日期」）→ 日期选择器
   * - region：地区类（城市 / 地址 / 地区 / 所在地）→ 省市区选择 + 手动补充详细地址
   * - select：常见平台/公司类（外卖平台、快递公司、运营商等）→ 候选选择 + 手动输入
   * - text  ：其余一律普通文本输入
   */
  getPlaceholderType(name) {
    const label = this.getPlaceholderLabel(name);
    const text = name + '|' + label;
    // 时间段（X点至X点）、小时数不适用日期选择器
    if (/X点|点钟|小时/.test(text)) return 'text';
    // 标准日期占位符或标签已明确为日期
    if (label === '日期' || label === '完整日期') return 'date';
    if (/^X年X月X日$/.test(name) || /^X月X日$/.test(name)) return 'date';
    // 常见平台 / 公司类：给出候选，减少手输
    if ((SELECT_OPTIONS[name] || []).length) return 'select';
    // 地区类
    if (/城市|地址|地区|所在地/.test(text)) return 'region';
    return 'text';
  },

  /**
   * 获取占位符的候选选项（无候选返回空数组）
   */
  getPlaceholderOptions(name) {
    return SELECT_OPTIONS[name] || [];
  },

  /**
   * 判断占位符的格式校验规则
   * phone=手机号 / idcard=身份证号 / email=邮箱 / ''=不校验
   */
  getPlaceholderRule(name) {
    const label = this.getPlaceholderLabel(name);
    const text = name + '|' + label;
    if (/身份证/.test(text)) {
      // 「身份证号后四位 / 后 4 位 / 尾号」这类只需 4 位，不做完整号码校验
      if (/后四?位|后4位|末四?位|尾号/.test(text)) return '';
      return 'idcard';
    }
    if (/手机|联系电话|电话号|手机号/.test(text)) return 'phone';
    if (/邮箱|电子邮箱|邮件地址/.test(text)) return 'email';
    return '';
  },

  /**
   * 校验单个字段值，返回错误信息（空字符串代表通过）；空值不在此处报错
   */
  validateField(rule, value) {
    const v = String(value === undefined || value === null ? '' : value).trim();
    if (!v || !rule) return '';
    if (rule === 'phone') {
      return /^1[3-9]\d{9}$/.test(v) ? '' : '请输入 11 位有效手机号（1 开头）';
    }
    if (rule === 'idcard') {
      return this.validateIdCard(v);
    }
    if (rule === 'email') {
      return /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(v) ? '' : '请输入有效的邮箱地址';
    }
    return '';
  },

  /**
   * 身份证号校验（15 位 / 18 位，含出生日期与校验位）
   */
  validateIdCard(value) {
    const s = String(value).trim().toUpperCase();
    if (!/^\d{15}$/.test(s) && !/^\d{17}[\dX]$/.test(s)) {
      return '身份证号应为 15 位或 18 位';
    }
    let y;
    let m;
    let d;
    if (s.length === 15) {
      y = Number('19' + s.substr(6, 2));
      m = Number(s.substr(8, 2));
      d = Number(s.substr(10, 2));
    } else {
      y = Number(s.substr(6, 4));
      m = Number(s.substr(10, 2));
      d = Number(s.substr(12, 2));
    }
    const date = new Date(y, m - 1, d);
    if (y < 1900 || y > 2100 || date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return '身份证号中的出生日期无效';
    }
    if (s.length === 18) {
      const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
      let sum = 0;
      for (let i = 0; i < 17; i++) sum += Number(s[i]) * weights[i];
      if (codes[sum % 11] !== s[17]) return '身份证号校验位不正确，请核对';
    }
    return '';
  },

  /**
   * 汇总所有字段的格式错误
   */
  buildErrors(formData) {
    const errors = {};
    (this.data.placeholders || []).forEach(p => {
      if (!p.rule) return;
      const msg = this.validateField(p.rule, (formData || {})[p.name]);
      if (msg) errors[p.name] = msg;
    });
    return errors;
  },

  /**
   * 日期选择器变更
   */
  onDateChange(e) {
    const field = e.currentTarget.dataset.field;
    const parts = String(e.detail.value || '').split('-');
    if (parts.length !== 3) return;
    const formData = { ...this.data.formData };
    formData[field] = `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
    this.setData({ formData });
  },

  /**
   * 地区（省市区）选择：写入省市区，并保留用户已补充的详细地址。
   * 例：已填「四川省成都市武侯区天府大道 1 号」，重选地区后仍保留「天府大道 1 号」。
   */
  onRegionChange(e) {
    const field = e.currentTarget.dataset.field;
    const parts = (e.detail.value || []).filter(Boolean);
    // 去掉省市区重名（如「北京市北京市东城区」→「北京市东城区」）
    const unique = parts.filter((p, i) => parts.indexOf(p) === i);
    const region = unique.join('');
    const oldValue = String(this.data.formData[field] || '');
    const cache = this._regionCache || (this._regionCache = {});
    const prevRegion = cache[field] || '';
    // 剥离上一次选择的省市区，保留用户手输的详细地址
    let detail = oldValue;
    if (prevRegion && oldValue.startsWith(prevRegion)) detail = oldValue.slice(prevRegion.length);
    cache[field] = region;

    const formData = { ...this.data.formData };
    formData[field] = region + detail;
    this.setData({ formData });
  },

  /**
   * 候选选择器变更（外卖平台 / 快递公司 / 运营商等常见选项）
   */
  onSelectChange(e) {
    const field = e.currentTarget.dataset.field;
    const item = (this.data.placeholders || []).find(p => p.name === field);
    const options = (item && item.options) || [];
    const value = options[Number(e.detail.value)];
    if (!value) return;
    const formData = { ...this.data.formData };
    formData[field] = value;
    this.setData({ formData });
  },

  /**
   * 复制文本到剪贴板（统一反馈，避免静默失败）
   */
  copyText(text, successTitle) {
    const content = (text === undefined || text === null) ? '' : String(text);
    if (!content.trim()) {
      wx.showToast({ title: '暂无可复制内容', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: successTitle || '已复制', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败，请重试', icon: 'none' });
      }
    });
  },

  /**
   * 切换填充表单显示
   */
  toggleFillForm() {
    const { showFillForm } = this.data;
    this.setData({ showFillForm: !showFillForm });
  },

  /**
   * 表单输入
   */
  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    const formData = { ...this.data.formData };
    formData[field] = value;
    // 实时校验该字段格式（手机号 / 身份证 / 邮箱）
    const meta = (this.data.placeholders || []).find(p => p.name === field);
    const formErrors = { ...this.data.formErrors };
    const msg = meta && meta.rule ? this.validateField(meta.rule, value) : '';
    if (msg) {
      formErrors[field] = msg;
    } else {
      delete formErrors[field];
    }
    this.setData({ formData, formErrors });
  },

  /**
   * 生成个性化话术
   */
  generateCustomScript() {
    const { script, formData, placeholders } = this.data;

    // 1. 格式校验（手机号 / 身份证号 / 邮箱）——不通过直接拦截
    const errors = this.buildErrors(formData);
    this.setData({ formErrors: errors });
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const meta = (placeholders || []).find(p => p.name === errorKeys[0]);
      wx.showToast({
        title: (meta ? meta.label : '') + '：' + errors[errorKeys[0]],
        icon: 'none',
        duration: 2600
      });
      return;
    }

    // 2. 检查是否有未填写的占位符（提示用友好标签而非原始占位符名）
    const unfilled = [];
    for (const [key, value] of Object.entries(formData)) {
      if (!value || !value.trim()) {
        const p = (placeholders || []).find(x => x.name === key);
        unfilled.push(p ? p.label : key);
      }
    }

    if (unfilled.length > 0) {
      this.showConfirmModal({
        title: '提示',
        content: `还有 ${unfilled.length} 项未填写：${unfilled.slice(0, 3).join('、')}${unfilled.length > 3 ? '等' : ''}，确定生成吗？`,
        success: (res) => {
          if (res.confirm) {
            this.doGenerate();
          }
        }
      });
    } else {
      this.doGenerate();
    }
  },

  /**
   * 执行生成
   */
  doGenerate() {
    const { script, formData } = this.data;
    const phoneRaw = scriptRepo.getScriptPhoneContent(script);
    const writtenRaw = scriptRepo.getScriptWrittenContent(script);

    // 替换占位符
    let customPhone = phoneRaw;
    let customWritten = writtenRaw;

    for (const [key, value] of Object.entries(formData)) {
      const placeholder = `【${key}】`;
      const replaceValue = value || placeholder; // 未填写的保留原占位符
      customPhone = customPhone.split(placeholder).join(replaceValue);
      customWritten = customWritten.split(placeholder).join(replaceValue);
    }

    // 对个性化话术也进行高亮和换行处理，确保rich-text正常渲染
    const customPhoneHtml = this.highlightPlaceholders(customPhone);
    const customWrittenHtml = this.highlightPlaceholders(customWritten);

    this.setData({
      customPhoneContent: customPhoneHtml,
      customWrittenContent: customWrittenHtml,
      // 同时保存纯文本版本用于复制
      customPhoneText: customPhone,
      customWrittenText: customWritten,
      hasCustomContent: true,
      showFillForm: false
    });

    wx.showToast({ title: '个性化话术已生成', icon: 'success' });
  },

  /**
   * 重置个性化话术
   */
  resetCustomScript() {
    this.showConfirmModal({
      title: '提示',
      content: '确定要重置为原始话术吗？已填写的信息将被清空。',
      success: (res) => {
        if (res.confirm) {
          const formData = {};
          this.data.placeholders.forEach(p => { formData[p.name] = ''; });
          this.setData({
            hasCustomContent: false,
            customPhoneContent: '',
            customWrittenContent: '',
            customPhoneText: '',
            customWrittenText: '',
            formData,
            formErrors: {},
            showFillForm: false
          });
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  },

  /**
   * 复制个性化话术
   */
  copyCustomScript(e) {
    const type = e.currentTarget.dataset.type;
    // 复制纯文本版本（customXxxContent 是带 <br/> 与高亮的 HTML，不能直接进剪贴板）
    const { customPhoneText, customWrittenText } = this.data;
    const content = type === 'phone' ? customPhoneText : customWrittenText;
    this.copyText(content, '个性化话术已复制');
  },

  onToggleFavorite() {
    const { scriptId } = this.data;
    const isFavorite = app.toggleFavorite('scripts', scriptId);
    this.setData({ isFavorite });
    wx.showToast({
      title: isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  onChannelTap(e) {
    const id = e.currentTarget.dataset.id;
    // 预加载分片，跳转后直接使用缓存
    channelRepo.preloadChannelPart(id);
    wx.navigateTo({
      url: `/detail/channel-detail/channel-detail?id=${id}`
    });
  },

  onBack() {
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
    const { script } = this.data;
    const name = script && script.scene_name ? script.scene_name : '投诉话术模板';
    const id = script && script.id ? script.id : '';
    return {
      title: name + ' - 一键复制直接用',
      path: '/detail/script-detail/script-detail?id=' + id
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '投诉话术模板 - 一键复制直接用'
    };
  },

  onShow() {
  },
});