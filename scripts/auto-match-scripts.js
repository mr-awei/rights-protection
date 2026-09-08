// 自动补全渠道关联话术
const fs = require('fs');
const path = require('path');

// 话术匹配规则（按分类和关键词匹配）
const matchRules = [
  // 快递/物流
  { scriptId: 'sc_001', categories: ['快递物流', '邮政'], keywords: ['快递', '物流', '邮政', '12305', '丢失', '破损', '延误'] },
  { scriptId: 'sc_017', categories: ['快递物流'], keywords: ['快递柜', '驿站', '菜鸟', '丰巢', '违规收费'] },
  // 电信/运营商
  { scriptId: 'sc_002', categories: ['电信运营'], keywords: ['电信', '运营商', '12300', '乱扣费', '宽带', '话费', '流量', '套餐', '移动', '联通'] },
  // 市场监管/消费
  { scriptId: 'sc_003', categories: ['市场监管', '消费者权益'], keywords: ['12315', '市场监管', '工商', '消费者', '退款', '假货', '虚假宣传', '商家'] },
  { scriptId: 'sc_010', categories: ['食品药品', '市场监管'], keywords: ['食品', '餐饮', '外卖', '美团', '饿了么', '食品安全', '12331'] },
  { scriptId: 'sc_015', categories: ['市场监管'], keywords: ['网购', '电商', '淘宝', '京东', '拼多多', '不发货', '虚假发货'] },
  // 金融
  { scriptId: 'sc_004', categories: ['金融消费'], keywords: ['银行', '保险', '证券', '金融', '12378', '银保监', '理财', '贷款', '信用卡'] },
  // 物业/住建/房产
  { scriptId: 'sc_005', categories: ['房地产'], keywords: ['物业', '物业费', '12345', '住建'] },
  { scriptId: 'sc_009', categories: ['房地产'], keywords: ['租房', '房东', '押金', '房租', '中介'] },
  { scriptId: 'sc_013', categories: ['房地产'], keywords: ['装修', '装修公司', '家装', '偷工减料'] },
  // 劳动
  { scriptId: 'sc_006', categories: ['劳动用工'], keywords: ['劳动', '人社', '12333', '欠薪', '工资', '加班', '社保', '公积金', '工伤'] },
  // 医疗
  { scriptId: 'sc_007', categories: ['医疗健康'], keywords: ['医疗', '医院', '卫健', '12320', '医生', '药品', '医保', '医疗纠纷'] },
  // 教育
  { scriptId: 'sc_008', categories: ['教育培训'], keywords: ['教育', '学校', '培训', '教育局', '退费', '补课', '校外培训'] },
  // 交通
  { scriptId: 'sc_011', categories: ['交通出行'], keywords: ['交通', '12328', '网约车', '出租车', '滴滴', '拒载', '绕路', '公交', '地铁'] },
  // 预付费
  { scriptId: 'sc_012', categories: ['市场监管', '消费者权益'], keywords: ['健身房', '美容院', '预付费', '预付卡', '跑路', '美发', '美容'] },
  // 噪音/环保
  { scriptId: 'sc_014', categories: ['环境保护', '政务服务'], keywords: ['噪音', '噪声', '扰民', '环保', '12369', '污染', '城管'] },
  // 汽车
  { scriptId: 'sc_016', categories: ['市场监管', '消费者权益'], keywords: ['汽车', '4S店', '车', '买车', '强制消费', '汽车质量'] },
];

function matchScript(channel) {
  const category = channel.category_user_l2 || channel.category_user || '';
  const tags = channel.tags || [];
  const name = channel.name || '';
  const scope = channel.scope || '';
  const allText = name + ' ' + scope + ' ' + tags.join(' ');

  // 按规则匹配
  for (const rule of matchRules) {
    // 检查分类匹配
    const categoryMatch = rule.categories.some(cat => category.includes(cat) || cat.includes(category));
    // 检查关键词匹配
    const keywordMatch = rule.keywords.some(kw => allText.includes(kw));

    if (categoryMatch && keywordMatch) {
      return rule.scriptId;
    }
  }

  // 二次匹配：只看关键词
  for (const rule of matchRules) {
    const keywordMatch = rule.keywords.some(kw => allText.includes(kw));
    if (keywordMatch) {
      return rule.scriptId;
    }
  }

  return ''; // 无匹配，使用通用话术兜底
}

// 处理渠道分片文件
const files = [
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_1.js'),
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_2.js'),
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_3.js'),
];

let totalUpdated = 0;
let totalWithScript = 0;

files.forEach((filePath, fileIndex) => {
  const channels = require(filePath);
  let updated = 0;

  channels.forEach(channel => {
    // 如果已经有关联话术，跳过
    if (channel.related_script_id && channel.related_script_id.trim() !== '') {
      totalWithScript++;
      return;
    }

    // 自动匹配
    const scriptId = matchScript(channel);
    if (scriptId) {
      channel.related_script_id = scriptId;
      updated++;
      totalWithScript++;
    }
  });

  // 写回文件
  const content = 'module.exports = ' + JSON.stringify(channels, null, 2) + ';\n';
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`文件${fileIndex + 1}更新了${updated}个渠道的关联话术`);
  totalUpdated += updated;
});

console.log(`\n总计更新了${totalUpdated}个渠道的关联话术`);
console.log(`当前有关联话术的渠道数: ${totalWithScript}/122`);
console.log(`关联率: ${(totalWithScript / 122 * 100).toFixed(1)}%`);
