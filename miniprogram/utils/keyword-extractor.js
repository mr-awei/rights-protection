// utils/keyword-extractor.js
// 本地关键词提取器（正向最大匹配算法）

// 关键词词库
const KEYWORDS = {
  domain: {
    '快递物流': ['快递', '快件', '包裹', '物流', '圆通', '中通', '申通', '韵达', '顺丰', '极兔', '邮政', 'EMS', '驿站', '快递员', '快递站', '快递柜', '丰巢'],
    '电信运营': ['电信', '话费', '流量', '宽带', '运营商', '移动', '联通', '扣费', '增值业务', '手机卡', '套餐', '信号', '网速'],
    '消费购物': ['消费', '购物', '商家', '退款', '退货', '假货', '虚假宣传', '淘宝', '京东', '拼多多', '外卖', '电商', '网购', '卖家', '店铺', '客服', '平台'],
    '金融保险': ['银行', '保险', '证券', '基金', '理财', '贷款', '信用卡', '金融', '误导销售', '转账'],
    '房产物业': ['物业', '房产', '租房', '房东', '业主', '电梯', '小区', '物业费', '房屋质量', '中介', '房租', '押金'],
    '劳动用工': ['劳动', '工资', '欠薪', '老板', '公司', '工厂', '社保', '公积金', '加班', '辞退', '工伤', '入职', '离职'],
    '医疗教育': ['医院', '医疗', '医生', '药品', '教育', '学校', '老师', '学费', '培训', '补课', '挂号', '手术'],
    '环保城管': ['环保', '污染', '噪音', '噪声', '城管', '占道', '垃圾', '臭气', '污水', '油烟'],
    '政务纪检': ['政府', '公职', '官员', '不作为', '推诿', '纪检', '举报', '信访', '督查', '办事', '审批'],
    '网络安全': ['诈骗', '被骗', '个人信息', '骚扰电话', '短信', '网络', '账号', '盗号', '刷单', '传销']
  },
  issue: {
    '丢失': ['丢失', '丢了', '被偷', '不见了', '遗失', '没收到', '签收未收到', '被盗'],
    '破损': ['破损', '坏了', '损坏', '碎了', '变形', '污染', '少件', '漏了'],
    '延误': ['延误', '延迟', '慢', '迟迟不到', '卡了', '停滞', '不更新', '超时'],
    '乱收费': ['乱收费', '多收钱', '加价', '扣费', '莫名其妙扣钱', '强制收费', '变相收费', '乱扣钱'],
    '不退款': ['不退款', '不给退', '拒绝退款', '不退钱', '拖延退款', '退款难', '不肯退'],
    '假货': ['假货', '山寨', '假冒', '伪劣', '翻新', '以次充好', '货不对板'],
    '不作为': ['不作为', '不管', '没人管', '推诿', '踢皮球', '拖延', '敷衍', '慢作为', '不处理'],
    '欠薪': ['欠薪', '拖欠工资', '不发工资', '克扣工资', '少发工资'],
    '服务态度': ['态度差', '骂人', '凶', '不耐烦', '拒绝服务', '挂电话', '辱骂'],
    '安全': ['诈骗', '被骗', '盗刷', '偷钱', '威胁', '恐吓', '人身安全', '被打'],
    '质量': ['质量差', '有问题', '故障', '不达标', '不合格', '次品'],
    '合同': ['违约', '不履行', '霸王条款', '格式条款', '单方面变更', '毁约']
  },
  target: {
    '快递公司': ['快递公司', '快递员', '快递站', '驿站', '网点'],
    '运营商': ['运营商', '移动公司', '联通公司', '电信公司', '营业厅'],
    '商家': ['商家', '卖家', '店铺', '网店', '客服', '平台'],
    '物业': ['物业', '物业公司', '物业管家', '物业经理', '业委会'],
    '雇主': ['老板', '公司', '用人单位', '工厂', '主管', 'HR', '人事'],
    '医院': ['医院', '医生', '护士', '诊所', '药店', '药企'],
    '学校': ['学校', '老师', '培训机构', '校长', '教育局']
  }
};

// 场景映射
const SCENES = [
  { id: 'scene_001', name: '快递丢失/被偷', icon: '📦', color: '#E6F4FF', desc: '快递丢失、被偷、签收未收到，推荐12305邮政申诉', keywords: ['快递', '丢失'], matchMode: 'all', channels: ['ch_002'], scripts: ['sc_001'], priority: 100 },
  { id: 'scene_002', name: '快递破损/少件', icon: '📦', color: '#FFFBE6', desc: '快递破损、损坏、少件，推荐12305邮政申诉', keywords: ['快递', '破损'], matchMode: 'all', channels: ['ch_002'], scripts: ['sc_001'], priority: 95 },
  { id: 'scene_003', name: '快递延误/停滞', icon: '📦', color: '#F6FFED', desc: '快递延误、物流停滞、迟迟不到，推荐12305邮政申诉', keywords: ['快递', '延误'], matchMode: 'all', channels: ['ch_002'], scripts: ['sc_001'], priority: 90 },
  { id: 'scene_004', name: '快递员服务态度差', icon: '📦', color: '#FFF2F0', desc: '快递员态度差、骂人、拒绝送货上门，推荐12305', keywords: ['快递', '服务态度'], matchMode: 'all', channels: ['ch_002'], scripts: [], priority: 80 },
  { id: 'scene_005', name: '运营商乱扣费', icon: '📱', color: '#E6F4FF', desc: '话费莫名被扣、未经同意开通业务，推荐12300工信部', keywords: ['电信', '乱收费'], matchMode: 'all', channels: ['ch_001'], scripts: ['sc_002'], priority: 100 },
  { id: 'scene_006', name: '宽带/网速问题', icon: '📱', color: '#F6FFED', desc: '宽带故障、网速不达标、运营商不处理，推荐12300', keywords: ['电信', '质量'], matchMode: 'all', channels: ['ch_001'], scripts: [], priority: 85 },
  { id: 'scene_007', name: '商家不退款/退货难', icon: '🛒', color: '#FFFBE6', desc: '商家拒绝退款、拖延退款，推荐12315市场监管', keywords: ['消费', '不退款'], matchMode: 'all', channels: ['ch_024'], scripts: ['sc_003'], priority: 100 },
  { id: 'scene_008', name: '买到假货/虚假宣传', icon: '🛒', color: '#FFF2F0', desc: '买到假货、山寨、虚假宣传，推荐12315市场监管', keywords: ['消费', '假货'], matchMode: 'all', channels: ['ch_024'], scripts: ['sc_003'], priority: 95 },
  { id: 'scene_009', name: '外卖/食品安全', icon: '🛒', color: '#F6FFED', desc: '外卖有异物、食品变质、商家不处理，推荐12315', keywords: ['消费', '质量'], matchMode: 'all', channels: ['ch_024'], scripts: [], priority: 80 },
  { id: 'scene_010', name: '物业不作为/乱收费', icon: '🏠', color: '#E6F4FF', desc: '物业不作为、乱收费、服务差，推荐12345+住建部门', keywords: ['物业', '不作为'], matchMode: 'all', channels: ['ch_056'], scripts: ['sc_005'], priority: 100 },
  { id: 'scene_011', name: '租房纠纷/押金不退', icon: '🏠', color: '#FFFBE6', desc: '房东不退押金、租房纠纷，推荐12345+法院起诉', keywords: ['房产', '合同'], matchMode: 'all', channels: ['ch_056'], scripts: [], priority: 85 },
  { id: 'scene_012', name: '老板欠薪/拖欠工资', icon: '💼', color: '#F9F0FF', desc: '老板拖欠工资、不发工资，推荐全国根治欠薪平台', keywords: ['劳动', '欠薪'], matchMode: 'all', channels: ['ch_065'], scripts: [], priority: 100 },
  { id: 'scene_013', name: '违法辞退/不签合同', icon: '💼', color: '#E6FFFB', desc: '公司违法辞退、不签劳动合同，推荐劳动仲裁', keywords: ['劳动', '合同'], matchMode: 'all', channels: ['ch_063'], scripts: [], priority: 90 },
  { id: 'scene_014', name: '银行误导/保险坑人', icon: '💰', color: '#FFF0F6', desc: '银行误导销售、保险退保难，推荐12378银保监会', keywords: ['金融', '不作为'], matchMode: 'all', channels: ['ch_018'], scripts: [], priority: 85 },
  { id: 'scene_015', name: '医院乱收费/医疗纠纷', icon: '🏥', color: '#FFF2F0', desc: '医院乱收费、医疗事故，推荐12320卫健委', keywords: ['医疗', '乱收费'], matchMode: 'all', channels: ['ch_047'], scripts: [], priority: 90 },
  { id: 'scene_016', name: '教育乱收费/培训跑路', icon: '🏥', color: '#E6F4FF', desc: '教育乱收费、培训机构跑路，推荐教育局+12315', keywords: ['教育', '乱收费'], matchMode: 'all', channels: ['ch_024'], scripts: [], priority: 85 },
  { id: 'scene_017', name: '噪音/环境污染', icon: '🌿', color: '#F6FFED', desc: '噪音扰民、环境污染，推荐12345环保举报', keywords: ['环保', '安全'], matchMode: 'all', channels: ['ch_059'], scripts: [], priority: 80 },
  { id: 'scene_018', name: '电信诈骗/被骗钱', icon: '🛡️', color: '#F0F5FF', desc: '遭遇电信诈骗、被骗钱，立即拨打96110+110', keywords: ['诈骗'], matchMode: 'any', channels: ['ch_030'], scripts: [], priority: 100 },
  { id: 'scene_019', name: '骚扰电话/个人信息泄露', icon: '🛡️', color: '#E6FFFB', desc: '骚扰电话、个人信息泄露，推荐12321', keywords: ['网络安全', '安全'], matchMode: 'all', channels: ['ch_083'], scripts: [], priority: 75 },
  { id: 'scene_020', name: '政府部门不作为', icon: '⚖️', color: '#FFFBE6', desc: '政府部门不作为、推诿扯皮，推荐12345+国务院督查', keywords: ['政务', '不作为'], matchMode: 'all', channels: ['ch_085'], scripts: [], priority: 90 }
];

// 构建全量词库
const ALL_KEYWORDS = new Set();
Object.values(KEYWORDS.domain).forEach(arr => arr.forEach(w => ALL_KEYWORDS.add(w)));
Object.values(KEYWORDS.issue).forEach(arr => arr.forEach(w => ALL_KEYWORDS.add(w)));
Object.values(KEYWORDS.target).forEach(arr => arr.forEach(w => ALL_KEYWORDS.add(w)));
const MAX_KW_LENGTH = Math.max(...Array.from(ALL_KEYWORDS).map(w => w.length), 6);

/**
 * 从用户输入中提取关键词（正向最大匹配）
 * @param {string} text - 用户输入文本
 * @returns {Object} { domains, issues, targets, allKeywords, scenes }
 */
function extractKeywords(text) {
  if (!text || !text.trim()) {
    return { domains: [], issues: [], targets: [], allKeywords: [], scenes: [] };
  }

  const matched = new Set();
  let i = 0;

  // 正向最大匹配
  while (i < text.length) {
    let matchedWord = null;
    for (let len = Math.min(MAX_KW_LENGTH, text.length - i); len >= 1; len--) {
      const word = text.substring(i, i + len);
      if (ALL_KEYWORDS.has(word)) {
        matchedWord = word;
        break;
      }
    }

    if (matchedWord) {
      matched.add(matchedWord);
      i += matchedWord.length;
    } else {
      i++;
    }
  }

  // 分类
  const domains = classifyKeywords(matched, KEYWORDS.domain);
  const issues = classifyKeywords(matched, KEYWORDS.issue);
  const targets = classifyKeywords(matched, KEYWORDS.target);

  // 场景匹配
  const matchedScenes = matchScenes(matched);

  return {
    domains,
    issues,
    targets,
    allKeywords: Array.from(matched),
    scenes: matchedScenes
  };
}

/**
 * 将匹配到的关键词分类
 */
function classifyKeywords(matchedSet, categoryMap) {
  const result = [];
  for (const [category, keywords] of Object.entries(categoryMap)) {
    for (const kw of keywords) {
      if (matchedSet.has(kw)) {
        result.push({ category, keyword: kw });
      }
    }
  }
  return result;
}

/**
 * 场景匹配
 */
function matchScenes(matchedSet) {
  const results = [];
  for (const scene of SCENES) {
    const sceneKeywords = scene.keywords || [];
    const matchMode = scene.matchMode || 'all';
    let matchedCount = 0;
    for (const kw of sceneKeywords) {
      if (matchedSet.has(kw)) {
        matchedCount++;
      }
    }

    let isMatch = false;
    if (matchMode === 'all') {
      isMatch = matchedCount === sceneKeywords.length;
    } else if (matchMode === 'any') {
      isMatch = matchedCount >= 1;
    }

    if (isMatch) {
      results.push({
        ...scene,
        matchScore: matchedCount * (scene.priority || 50)
      });
    }
  }
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = {
  extractKeywords,
  SCENES,
  KEYWORDS
};
