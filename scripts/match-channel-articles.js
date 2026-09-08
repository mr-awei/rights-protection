// 为每个渠道匹配引用的条款ID
const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
const laws = require(lawsPath);

// 建立法律名称到法律对象的映射
const lawNameMap = {};
laws.forEach(law => {
  const name = (law.name || law.title || '').trim();
  lawNameMap[name] = law;
  // 也支持简称匹配
  const shortName = name.replace('中华人民共和国', '').trim();
  if (shortName && !lawNameMap[shortName]) {
    lawNameMap[shortName] = law;
  }
});

// 条款匹配规则：根据渠道分类和关键词匹配条款
// key是法律名称，value是匹配规则数组
const articleMatchRules = {
  '中华人民共和国消费者权益保护法': [
    { keywords: ['质量', '退货', '更换', '修理', '三包'], articleIndex: [4] }, // 第二十四条
    { keywords: ['欺诈', '虚假宣传', '误导'], articleIndex: [6] }, // 第五十五条
    { keywords: ['投诉', '维权', '争议', '途径'], articleIndex: [5] }, // 第三十九条
    { keywords: ['安全', '人身', '财产'], articleIndex: [0] }, // 第七条
    { keywords: ['知情', '真实情况'], articleIndex: [1] }, // 第八条
    { keywords: ['自主选择'], articleIndex: [2] }, // 第九条
    { keywords: ['公平交易'], articleIndex: [3] }, // 第十条
  ],
  '中华人民共和国宪法': [
    { keywords: ['申诉', '控告', '检举', '批评', '建议'], articleIndex: [0] }, // 第四十一条
    { keywords: ['劳动', '工作'], articleIndex: [1] }, // 第四十二条
    { keywords: ['休息', '休假'], articleIndex: [2] }, // 第四十三条
    { keywords: ['退休', '养老'], articleIndex: [3] }, // 第四十四条
    { keywords: ['物质帮助', '社保', '救助'], articleIndex: [4] }, // 第四十五条
  ],
  '中华人民共和国民法典': [
    { keywords: ['合同', '违约'], articleIndex: [2] }, // 第五百七十七条
    { keywords: ['侵权', '损害', '赔偿'], articleIndex: [3, 4] }, // 第一千一百六十五条、第一千一百八十四条
    { keywords: ['民事责任', '停止侵害', '排除妨碍'], articleIndex: [1] }, // 第一百七十九条
    { keywords: ['民事义务'], articleIndex: [0] }, // 第一百七十六条
  ],
  '中华人民共和国产品质量法': [
    { keywords: ['质量', '缺陷', '损坏'], articleIndex: [0, 2] }, // 第二十六条、第四十三条
    { keywords: ['退货', '更换', '修理', '三包'], articleIndex: [1] }, // 第四十条
  ],
  '中华人民共和国食品安全法': [
    { keywords: ['质量', '安全', '变质', '过期', '异物'], articleIndex: [0] }, // 第三十四条
    { keywords: ['赔偿', '十倍', '一千元'], articleIndex: [1] }, // 第一百四十八条
  ],
  '中华人民共和国劳动法': [
    { keywords: ['工资', '拖欠', '克扣'], articleIndex: [0, 2] }, // 第五十条、第九十一条
    { keywords: ['争议', '仲裁', '调解'], articleIndex: [1] }, // 第七十七条
  ],
  '中华人民共和国劳动合同法': [
    { keywords: ['合同', '签订', '书面'], articleIndex: [0, 2] }, // 第十条、第八十二条
    { keywords: ['解除', '辞职', '离职'], articleIndex: [1] }, // 第三十八条
  ],
  '中华人民共和国电信条例': [
    { keywords: ['收费', '扣费', '资费', '服务', '态度'], articleIndex: [0, 1] }, // 第四十一条、第七十四条
  ],
  '快递暂行条例': [
    { keywords: ['丢失', '损毁', '延误', '赔偿'], articleIndex: [0] }, // 第二十七条
    { keywords: ['投诉', '服务', '查询'], articleIndex: [1] }, // 第二十八条
  ],
  '中华人民共和国邮政法': [
    { keywords: ['丢失', '损毁', '赔偿'], articleIndex: [0] }, // 第四十七条
  ],
  '中华人民共和国商业银行法': [
    { keywords: ['存款', '取款', '冻结', '扣划'], articleIndex: [0, 1] }, // 第二十九条、第七十三条
  ],
  '中华人民共和国保险法': [
    { keywords: ['理赔', '赔偿', '给付', '核定'], articleIndex: [0] }, // 第二十三条
    { keywords: ['欺骗', '误导', '拒赔'], articleIndex: [1] }, // 第一百一十六条
  ],
  '中华人民共和国证券法': [
    { keywords: ['信息披露', '虚假记载', '误导', '赔偿'], articleIndex: [0] }, // 第八十五条
    { keywords: ['虚假信息', '编造', '传播'], articleIndex: [1] }, // 第一百九十三条
  ],
  '物业管理条例': [
    { keywords: ['服务', '安全', '损害'], articleIndex: [0] }, // 第三十五条
    { keywords: ['物业费', '收费', '交纳'], articleIndex: [1] }, // 第四十一条
  ],
  '中华人民共和国基本医疗卫生与健康促进法': [
    { keywords: ['知情', '同意', '手术', '治疗'], articleIndex: [0] }, // 第三十二条
    { keywords: ['索要', '收受', '红包', '泄露隐私'], articleIndex: [1] }, // 第一百零二条
  ],
  '中华人民共和国教育法': [
    { keywords: ['收费', '乱收费', '费用'], articleIndex: [0] }, // 第七十八条
    { keywords: ['侵权', '权益', '损害'], articleIndex: [1] }, // 第八十一条
  ],
  '中华人民共和国环境保护法': [
    { keywords: ['污染', '举报', '破坏生态'], articleIndex: [0, 1] }, // 第五十七条、第六十四条
  ],
  '中华人民共和国噪声污染防治法': [
    { keywords: ['噪音', '噪声', '扰民', '装修', '广场舞'], articleIndex: [0, 1] }, // 第六十五条、第八十二条
  ],
  '中华人民共和国安全生产法': [
    { keywords: ['安全', '事故', '隐患', '危险因素'], articleIndex: [0, 1] }, // 第五十三条、第一百一十四条
  ],
  '中华人民共和国消防法': [
    { keywords: ['消防', '通道', '安全出口', '消火栓', '隐患'], articleIndex: [0, 1] }, // 第二十八条、第六十条
  ],
  '信访工作条例': [
    { keywords: ['信访', '投诉', '反映情况', '建议'], articleIndex: [0, 1, 2] }, // 第十七条、第二十二条、第三十四条
  ],
  '中华人民共和国监察法': [
    { keywords: ['举报', '报案', '职务违法', '贪污'], articleIndex: [0, 1] }, // 第十一条、第三十五条
  ],
  '中华人民共和国公务员法': [
    { keywords: ['公务员', '义务', '监督', '处分'], articleIndex: [0, 1] }, // 第十四条、第五十七条
  ],
};

// 处理单个渠道文件
function processChannelFile(filePath) {
  const channels = require(filePath);
  let updated = 0;
  
  channels.forEach(channel => {
    if (!channel.legal_basis || !channel.legal_basis.trim()) return;
    
    // 解析法律名称
    const lawMatches = channel.legal_basis.match(/《([^》]+)》/g);
    if (!lawMatches) return;
    
    const channelText = (channel.name || '') + ' ' + (channel.category_l2 || '') + ' ' + (channel.scope || '') + ' ' + (channel.description || '');
    
    const legalBasisWithArticles = [];
    
    lawMatches.forEach(match => {
      const lawName = match.replace(/[《》]/g, '').trim();
      const law = lawNameMap[lawName];
      
      if (!law || !law.articles || law.articles.length === 0) {
        // 法律库没有条款，只记录法律名称
        legalBasisWithArticles.push({
          law_name: lawName,
          article_ids: []
        });
        return;
      }
      
      // 匹配条款
      const rules = articleMatchRules[lawName] || articleMatchRules[lawName.replace('中华人民共和国', '').trim()];
      let matchedArticleIds = [];
      
      if (rules) {
        rules.forEach(rule => {
          const keywordMatched = rule.keywords.some(keyword => channelText.includes(keyword));
          if (keywordMatched) {
            rule.articleIndex.forEach(index => {
              if (law.articles[index] && !matchedArticleIds.includes(law.articles[index].id)) {
                matchedArticleIds.push(law.articles[index].id);
              }
            });
          }
        });
      }
      
      // 如果没有匹配到任何条款，默认取前2条
      if (matchedArticleIds.length === 0) {
        matchedArticleIds = law.articles.slice(0, Math.min(2, law.articles.length)).map(a => a.id);
      }
      
      legalBasisWithArticles.push({
        law_name: lawName,
        law_id: law.id,
        article_ids: matchedArticleIds
      });
    });
    
    if (legalBasisWithArticles.length > 0) {
      channel.legal_basis_with_articles = legalBasisWithArticles;
      updated++;
    }
  });
  
  // 写回文件
  const content = 'module.exports = ' + JSON.stringify(channels, null, 2) + ';\n';
  fs.writeFileSync(filePath, content, 'utf8');
  
  return updated;
}

// 处理三个渠道文件
const part1Path = path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_1.js');
const part2Path = path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_2.js');
const part3Path = path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_3.js');

const updated1 = processChannelFile(part1Path);
const updated2 = processChannelFile(part2Path);
const updated3 = processChannelFile(part3Path);

console.log('part1更新了', updated1, '个渠道');
console.log('part2更新了', updated2, '个渠道');
console.log('part3更新了', updated3, '个渠道');
console.log('总共更新了', updated1 + updated2 + updated3, '个渠道');
