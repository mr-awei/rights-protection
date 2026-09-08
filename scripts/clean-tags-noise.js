/**
 * 清理渠道tags中的噪声 - 简化版
 */
const fs = require('fs');

// 真正的噪声词模式
const NOISE_PATTERNS = [
  /等$/, /共$/, /务$/, /政$/, /诉$/, /及$/, /与$/, /和$/, /或$/, /的$/, /了$/, /在$/, /是$/,
  /^等/, /^共/, /^务/, /^政/, /^诉/, /^及/, /^与/, /^和/, /^或/, /^的/, /^了/, /^在/, /^是/,
  /适用于/, /覆盖/, /为.*主管/, /为.*行业/, /等所有/, /等快/, /等投/, /等申/, /等诉/,
  /基础民生/, /社会服务/, /金融与商业/, /高层级/, /四川.*地方/,
  /个省区市/, /广东.*广西/, /云南.*贵州/,
  /国家邮政局邮/, /政业申诉/, /政业投诉/,
  /南方电网供电/, /国家电网覆盖/, /南方电网覆盖/,
  /能源监管热线/, /电力监管投诉/, /停电抢修不及/, /电力市场违规/, /能源项目违法/, /油气管道安全/,
  /政务服务便民/, /供水服务质量/, /收费争议等投/, /各地人民政府/, /住建部门为供/, /水行业主管/,
  /服务态度等投/, /服务态度等申/, /服务态度等诉/,
  /诉满/, /共交通/, /务司法/, /政司法/,
  /服务$/, /投诉$/, /管理$/, /监管$/, /监督$/, /检查$/, /调查$/, /处理$/, /工作$/, /业务$/, /事项$/, /问题$/, /情况$/, /方面$/, /领域$/, /行业$/, /部门$/, /单位$/, /机构$/, /组织$/, /团体$/, /个人$/, /企业$/, /公司$/, /工厂$/, /商店$/, /市场$/, /平台$/, /系统$/, /体系$/, /机制$/, /制度$/, /政策$/, /法规$/, /法律$/, /规定$/, /规则$/, /规范$/, /标准$/, /要求$/, /条件$/, /程序$/, /流程$/, /步骤$/, /方法$/, /方式$/, /手段$/, /措施$/, /行动$/, /活动$/, /项目$/, /计划$/, /方案$/, /预案$/, /应急$/, /突发$/, /紧急$/, /重要$/, /主要$/, /关键$/, /核心$/, /重点$/, /难点$/, /热点$/, /焦点$/, /亮点$/, /特点$/, /特征$/, /优势$/, /劣势$/, /机会$/, /威胁$/, /风险$/, /挑战$/, /机遇$/, /发展$/, /进步$/, /提升$/, /提高$/, /增强$/, /加强$/, /加大$/, /加快$/, /加深$/, /加宽$/, /加厚$/, /加高$/, /加长$/, /扩大$/, /扩展$/, /拓展$/, /拓宽$/, /推广$/, /推行$/, /推进$/, /推动$/, /带动$/, /促进$/, /保障$/, /保证$/, /确保$/, /维护$/, /保护$/, /保卫$/, /捍卫$/, /坚守$/, /坚持$/, /坚定$/, /坚决$/, /坚强$/, /坚韧$/, /坚毅$/, /顽强$/, /勇敢$/, /英勇$/, /无畏$/, /无私$/, /奉献$/, /牺牲$/, /付出$/, /努力$/, /奋斗$/, /拼搏$/, /进取$/, /上进$/, /积极$/, /主动$/, /自觉$/, /自律$/, /自强$/, /自信$/, /自尊$/, /自爱$/, /自重$/, /自省$/, /自警$/, /自励$/, /自立$/
];

// 读取所有渠道
const allChannels = [];
for (let i = 1; i <= 3; i++) {
  const part = require('E:/rights protection/miniprogram/data/channels_part_' + i + '.js');
  allChannels.push(...part);
}

// 清理噪声tags
let totalRemoved = 0;
allChannels.forEach(ch => {
  const beforeCount = (ch.tags || []).length;
  const cleanedTags = (ch.tags || []).filter(tag => {
    if (!tag || typeof tag !== 'string') return false;
    if (tag.length < 2 || tag.length > 8) return false;
    for (const pattern of NOISE_PATTERNS) {
      if (pattern.test(tag)) return false;
    }
    return true;
  });
  totalRemoved += (beforeCount - cleanedTags.length);
  ch.tags = cleanedTags;
});

// 写回分片文件
let index = 0;
for (let i = 1; i <= 3; i++) {
  const partCount = i === 3 ? 22 : 50;
  const partChannels = allChannels.slice(index, index + partCount);
  index += partCount;
  
  const content = 'module.exports = ' + JSON.stringify(partChannels, null, 2) + ';\n';
  fs.writeFileSync('E:/rights protection/miniprogram/data/channels_part_' + i + '.js', content, 'utf8');
  console.log('分片' + i + ': ' + partChannels.length + '条渠道已更新');
}

console.log('\n总计移除噪声tags: ' + totalRemoved + '个');
console.log('平均每个渠道tags: ' + (allChannels.reduce((sum, ch) => sum + ch.tags.length, 0) / allChannels.length).toFixed(1) + '个');

// 打印前5个渠道的tags示例
console.log('\n前5个渠道的tags示例:');
allChannels.slice(0, 5).forEach(ch => {
  console.log(ch.id + ' ' + ch.name + ': ' + JSON.stringify(ch.tags));
});
