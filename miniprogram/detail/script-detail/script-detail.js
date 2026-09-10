// detail/script-detail/script-detail.js
const app = getApp();
// 通过 Repository 抽象访问数据（TDD §3/§6），页面不再直接依赖数据模块
const { channels: channelRepo, scripts: scriptRepo, laws: lawRepo } = require('../repositories').createRepositories();

// 所需材料清单通用基线（话术详情共用，PRD §9.3.2）
const DEFAULT_MATERIALS = [
  { name: '身份与关系证明', required: true, desc: '本人身份证、与对方的关系证明' },
  { name: '交易与合同凭证', required: true, desc: '订单、支付记录、合同、发票等' },
  { name: '沟通记录', required: true, desc: '聊天记录、通话录音、邮件等' },
  { name: '侵权证据', required: true, desc: '照片、视频、质检报告、录屏等' },
  { name: '时间线说明', required: false, desc: '按时间顺序梳理事发经过' },
  { name: '诉求与损失证明', required: false, desc: '退款 / 赔偿计算、损失凭证' }
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
      isFavorite: app.isFavorite('scripts', id),
      loading: false,
      materialsList: script.materials && script.materials.length > 0 ? script.materials : DEFAULT_MATERIALS
    });

    wx.setNavigationBarTitle({ title: script.scene_name || '话术详情' });

    // 第二批：异步加载关联渠道（非核心内容，不阻塞首屏渲染）
    setTimeout(() => {
      const relatedChannels = scriptRepo.getRelatedChannels(id);
      this.setData({ relatedChannels });
    }, 50);
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
    wx.setClipboardData({
      data: section.content,
      success: () => {
        wx.showToast({ title: `${section.title}已复制`, icon: 'success' });
      }
    });
  },

  highlightPlaceholders(text) {
    if (!text) return '';
    // 高亮 【占位符】 格式
    let result = text.replace(/【([^】]+)】/g, '<span class="placeholder">【$1】</span>');
    // 高亮 [占位符] 格式
    result = result.replace(/\[([^\]]+)\]/g, '<span class="placeholder">[$1]</span>');
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

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '话术已复制', icon: 'success' });
      }
    });
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
      example: this.getPlaceholderExample(name)
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
      'X天': '天数'
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
      '手机号': '138****8888',
      '单号': 'SF1234567890',
      '金额': '500',
      'X月X日': '3月15日',
      'X': '3'
    };
    if (examples[name]) return examples[name];
    return '';
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
    this.setData({ formData });
  },

  /**
   * 生成个性化话术
   */
  generateCustomScript() {
    const { script, formData } = this.data;

    // 检查是否有未填写的占位符
    const unfilled = [];
    for (const [key, value] of Object.entries(formData)) {
      if (!value || !value.trim()) {
        unfilled.push(key);
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
            formData,
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
    const { customPhoneContent, customWrittenContent } = this.data;
    const content = type === 'phone' ? customPhoneContent : customWrittenContent;

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '个性化话术已复制', icon: 'success' });
      }
    });
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

  // 跳转媒体曝光指南页（第四条维权路径）
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