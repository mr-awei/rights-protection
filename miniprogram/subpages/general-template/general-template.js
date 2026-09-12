// subsubsubpages/general-template/general-template.js
const app = getApp();
const { getGeneralTemplate } = require('../../utils/data');
const { getStatusBarHeight } = require('../../utils/layout');

// 占位符定义
const PLACEHOLDERS = [
  { name: 'complainant_name', label: '投诉人姓名', example: '张三', guide: '您的真实姓名' },
  { name: 'complainant_phone', label: '联系电话', example: '13800138000', guide: '便于受理部门联系您' },
  { name: 'complainant_address', label: '联系地址', example: 'XX市XX区XX路XX号', guide: '您的详细地址（可选）' },
  { name: 'complainant_idcard', label: '身份证号', example: '5101**********1234', guide: '涉及金融、实名投诉时填写（可选）' },
  { name: 'respondent_name', label: '被投诉方名称', example: 'XX公司/XX店铺', guide: '被投诉单位的全称' },
  { name: 'respondent_credit_code', label: '统一社会信用代码', example: '91XXXXXXXXXXXXXXXX', guide: '被投诉单位的信用代码（可选，可在企业信用信息公示系统查询）' },
  { name: 'respondent_address', label: '被投诉方地址', example: 'XX市XX区XX路XX号', guide: '被投诉单位的地址（可选）' },
  { name: 'respondent_phone', label: '被投诉方电话', example: '028-XXXXXXXX', guide: '被投诉单位的联系电话（可选）' },
  { name: 'complaint_subject', label: '投诉事项', example: '违规收费/服务质量问题/不履行合同义务', guide: '简明概括投诉事项' },
  { name: 'complaint_request1', label: '投诉请求1', example: '退还费用XX元', guide: '具体、可执行的诉求' },
  { name: 'complaint_request2', label: '投诉请求2', example: '赔偿损失XX元', guide: '第二条诉求（可选）' },
  { name: 'incident_time', label: '事发时间', example: '2026年X月X日', guide: '事情发生的时间' },
  { name: 'incident_place', label: '事发地点/平台', example: 'XX平台/XX店铺', guide: '事情发生的地点或平台' },
  { name: 'incident_detail', label: '事情经过', example: '本人在该平台购买了XX服务，对方未按约定提供...', guide: '按时间顺序客观叙述' },
  { name: 'acceptance_unit', label: '受理单位', example: 'XX市市场监督管理局', guide: '您要投诉到的单位全称' }
];

Page({
  data: {
    template: null,
    sections: [],
    displaySections: [],
    customSections: [],
    placeholders: PLACEHOLDERS,
    formData: {},
    showFillForm: false,
    hasCustomContent: false,
    statusBarHeight: 20
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

  onLoad() {

    this.setData({ statusBarHeight: getStatusBarHeight() });
    this.loadTemplate();
  },

  loadTemplate() {
    const template = getGeneralTemplate();
    if (!template) {
      wx.showToast({ title: '模板加载失败', icon: 'none' });
      return;
    }
    const sections = template.sections || [];
    this.setData({ template, sections, displaySections: sections });
  },

  // 切换填充表单显示
  toggleFillForm() {
    this.setData({ showFillForm: !this.data.showFillForm });
  },

  // 表单输入
  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 生成个性化投诉信
  generateCustomTemplate() {
    const { formData, sections } = this.data;
    
    // 检查必填项
    if (!formData.complainant_name || !formData.respondent_name || !formData.complaint_subject) {
      wx.showToast({ title: '请填写投诉人姓名、被投诉方名称和投诉事项', icon: 'none', duration: 3000 });
      return;
    }

    // 生成个性化分块
    const customSections = sections.map(section => {
      let content = section.content;
      
      // 替换占位符
      content = content.replace(/【被投诉单位名称】/g, formData.respondent_name || '【被投诉单位名称】');
      content = content.replace(/【投诉事项，如：违规收费\/服务质量问题\/不履行合同义务】/g, formData.complaint_subject || '【投诉事项】');
      content = content.replace(/【投诉事项】/g, formData.complaint_subject || '【投诉事项】');
      content = content.replace(/【姓名】/g, formData.complainant_name || '【姓名】');
      content = content.replace(/【手机号码】/g, formData.complainant_phone || '【手机号码】');
      content = content.replace(/【详细地址】/g, formData.complainant_address || '【详细地址】');
      content = content.replace(/【身份证号码，可选】/g, formData.complainant_idcard || '【身份证号】');
      content = content.replace(/【单位全称，如：XX公司\/XX店铺】/g, formData.respondent_name || '【单位全称】');
      content = content.replace(/【单位全称】/g, formData.respondent_name || '【单位全称】');
      content = content.replace(/【单位地址】/g, formData.respondent_address || '【单位地址】');
      content = content.replace(/【代码，可选】/g, formData.respondent_credit_code || '【统一社会信用代码】');
      content = content.replace(/【对方电话，可选】/g, formData.respondent_phone || '【对方电话】');
      content = content.replace(/【具体诉求1，如：退还费用XX元】/g, formData.complaint_request1 || '【具体诉求1】');
      content = content.replace(/【具体诉求1】/g, formData.complaint_request1 || '【具体诉求1】');
      content = content.replace(/【具体诉求2，如：赔偿损失XX元】/g, formData.complaint_request2 || '【具体诉求2】');
      content = content.replace(/【具体诉求2】/g, formData.complaint_request2 || '【具体诉求2】');
      content = content.replace(/【具体诉求3，如：依法查处被投诉方的违法行为】/g, '依法查处被投诉方的违法行为');
      content = content.replace(/【具体诉求3】/g, '依法查处被投诉方的违法行为');
      content = content.replace(/【时间】/g, formData.incident_time || '【时间】');
      content = content.replace(/【地点\/平台】/g, formData.incident_place || '【地点/平台】');
      content = content.replace(/【交易\/服务关系】/g, '交易/服务关系');
      content = content.replace(/【按时间顺序叙述事情经过，包括：发生了什么、对方做了什么、造成了什么后果】/g, formData.incident_detail || '【按时间顺序叙述事情经过】');
      content = content.replace(/【按时间顺序叙述事情经过】/g, formData.incident_detail || '【按时间顺序叙述事情经过】');
      content = content.replace(/【受理单位全称，如：XX市市场监督管理局】/g, formData.acceptance_unit || '【受理单位全称】');
      content = content.replace(/【受理单位全称】/g, formData.acceptance_unit || '【受理单位全称】');
      content = content.replace(/【年 月 日】/g, this.getCurrentDate());
      
      return {
        ...section,
        content: content
      };
    });

    this.setData({
      customSections,
      displaySections: customSections,
      hasCustomContent: true,
      showFillForm: false
    });

    wx.showToast({ title: '个性化投诉信已生成', icon: 'success' });
  },

  // 获取当前日期
  getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return `${year}年${month}月${day}日`;
  },

  // 重置个性化模板
  resetCustomTemplate() {
    this.showConfirmModal({
      title: '确认重置',
      content: '重置后将清除您填写的所有信息，恢复为原始模板。确定要重置吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            customSections: [],
            displaySections: this.data.sections,
            hasCustomContent: false,
            formData: {},
            showFillForm: false
          });
          wx.showToast({ title: '已重置', icon: 'success' });
        }
      }
    });
  },

  // 复制单个分块
  onCopySection(e) {
    const section = e.currentTarget.dataset.section;
    if (!section) return;
    // 将HTML转换为纯文本
    const plainText = this.htmlToPlainText(section.content);
    wx.setClipboardData({
      data: plainText,
      success: () => {
        wx.showToast({ title: `${section.title}已复制`, icon: 'success' });
      }
    });
  },

  // HTML转纯文本
  htmlToPlainText(html) {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  },

  // 复制全部
  onCopyAll() {
    const { displaySections, hasCustomContent } = this.data;
    if (displaySections.length === 0) return;
    
    // 将每个分块的HTML转换为纯文本，然后拼接
    const fullText = displaySections.map(s => {
      const plainText = this.htmlToPlainText(s.content);
      return `【${s.title}】\n${plainText}`;
    }).join('\n\n');
    
    wx.setClipboardData({
      data: fullText,
      success: () => {
        wx.showToast({ title: hasCustomContent ? '个性化投诉信已复制' : '完整模板已复制', icon: 'success' });
      }
    });
  },

  // 返回首页
  onBackHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
