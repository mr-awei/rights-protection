// pages/script-detail/script-detail.js
const app = getApp();
const { getScriptById, getRelatedChannels, getScriptPhoneContent, getScriptWrittenContent, preloadChannelPart, getLaws } = require('../../utils/data');

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
    hasCustomContent: false
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
    const script = getScriptById(id);
    if (!script) {
      wx.showToast({ title: '话术不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    // 写入浏览历史
    app.addViewHistory('script', id, script.scene_name || script.name || '投诉话术', '');

    // 获取话术内容
    const phoneRaw = getScriptPhoneContent(script);
    const writtenRaw = getScriptWrittenContent(script);
    const phoneContent = this.highlightPlaceholders(phoneRaw);
    const writtenContent = this.highlightPlaceholders(writtenRaw);
    const evidenceList = script.evidence_list || [];
    const writtenSections = this.buildWrittenSections(script);
    const laws = this.getRelatedLaws(script);
    // 提取所有占位符
    const placeholders = this.extractPlaceholders(phoneRaw + '\n' + writtenRaw);
    // 初始化表单数据
    const formData = {};
    placeholders.forEach(p => { formData[p] = ''; });

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
      loading: false
    });

    wx.setNavigationBarTitle({ title: script.scene_name || '话术详情' });

    // 第二批：异步加载关联渠道（非核心内容，不阻塞首屏渲染）
    setTimeout(() => {
      const relatedChannels = getRelatedChannels(id);
      this.setData({ relatedChannels });
    }, 50);
  },

  // 构建书面版分块
  buildWrittenSections(script) {
    const sections = [];
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
    const allLaws = getLaws();
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
    const { activeTab, script, hasCustomContent, customPhoneContent, customWrittenContent } = this.data;
    // 如果有个性化内容，优先复制个性化内容
    let content;
    if (hasCustomContent) {
      content = activeTab === 'phone' ? customPhoneContent : customWrittenContent;
    } else {
      content = activeTab === 'phone'
        ? getScriptPhoneContent(script)
        : getScriptWrittenContent(script);
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
   * 提取文本中的所有占位符【】
   */
  extractPlaceholders(text) {
    if (!text) return [];
    const regex = /【([^】]+)】/g;
    const placeholders = new Set();
    let match;
    while ((match = regex.exec(text)) !== null) {
      placeholders.add(match[1]);
    }
    return Array.from(placeholders);
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
      wx.showModal({
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
    const phoneRaw = getScriptPhoneContent(script);
    const writtenRaw = getScriptWrittenContent(script);

    // 替换占位符
    let customPhone = phoneRaw;
    let customWritten = writtenRaw;

    for (const [key, value] of Object.entries(formData)) {
      const placeholder = `【${key}】`;
      const replaceValue = value || placeholder; // 未填写的保留原占位符
      customPhone = customPhone.split(placeholder).join(replaceValue);
      customWritten = customWritten.split(placeholder).join(replaceValue);
    }

    this.setData({
      customPhoneContent: customPhone,
      customWrittenContent: customWritten,
      hasCustomContent: true,
      showFillForm: false
    });

    wx.showToast({ title: '个性化话术已生成', icon: 'success' });
  },

  /**
   * 重置个性化话术
   */
  resetCustomScript() {
    wx.showModal({
      title: '提示',
      content: '确定要重置为原始话术吗？已填写的信息将被清空。',
      success: (res) => {
        if (res.confirm) {
          const formData = {};
          this.data.placeholders.forEach(p => { formData[p] = ''; });
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
    preloadChannelPart(id);
    wx.navigateTo({
      url: `/pages/channel-detail/channel-detail?id=${id}`
    });
  },

  onBack() {
    wx.navigateBack();
  }
});
