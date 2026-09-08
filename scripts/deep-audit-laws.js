/**
 * 法律法规深度核查脚本
 * 逐条检查法律条款的内容准确性
 */

const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
let lawsContent = fs.readFileSync(lawsPath, 'utf-8');
let laws = eval(lawsContent.replace('module.exports =', ''));

console.log('========== 法律法规深度核查 ==========\n');
console.log(`总法律数量: ${laws.length}`);
console.log(`总条款数量: ${laws.reduce((sum, law) => sum + law.articles.length, 0)}\n`);

let issues = [];
let suspiciousLaws = [];

// 常见错误关键词检测
const errorPatterns = [
  { pattern: /国家实行九年义务教育制度/, law: '义务教育法', desc: '义务教育法内容' },
  { pattern: /用人单位和个人依法缴纳社会保险费/, law: '社会保险法', desc: '社会保险法内容' },
  { pattern: /邮政企业对给据邮件/, law: '邮政法', desc: '邮政法内容' },
  { pattern: /禁止生产经营下列食品/, law: '食品安全法', desc: '食品安全法内容' },
  { pattern: /消费者因不符合食品安全标准/, law: '食品安全法', desc: '食品安全法内容' },
  { pattern: /电信业务经营者/, law: '电信条例/电信服务规范', desc: '电信相关法律内容' },
  { pattern: /商业银行办理个人储蓄存款/, law: '商业银行法', desc: '商业银行法内容' },
  { pattern: /保险人收到被保险人/, law: '保险法', desc: '保险法内容' },
  { pattern: /发行人、上市公司或者其他信息披露义务人/, law: '证券法', desc: '证券法内容' },
  { pattern: /排放油烟的餐饮服务业经营者/, law: '大气污染防治法', desc: '大气污染防治法内容' },
  { pattern: /任何单位、个人不得损坏、挪用或者擅自拆除、停用消防设施/, law: '消防法', desc: '消防法内容' },
  { pattern: /公民和组织应当履行下列维护国家安全的义务/, law: '国家安全法', desc: '国家安全法内容' },
  { pattern: /本法所称间谍行为/, law: '反间谍法', desc: '反间谍法内容' },
  { pattern: /铁路运输企业应当保证旅客和货物运输的安全/, law: '铁路法', desc: '铁路法内容' },
  { pattern: /因发生在民用航空器上/, law: '民用航空法', desc: '民用航空法内容' },
  { pattern: /非公开募集基金/, law: '证券投资基金法', desc: '证券投资基金法内容' },
  { pattern: /纳税人、扣缴义务人有权向税务机关了解/, law: '税收征收管理法', desc: '税收征收管理法内容' },
  { pattern: /国家机关、企业事业单位和其他组织以及个体工商户和个人等统计调查对象/, law: '统计法', desc: '统计法内容' },
  { pattern: /在中华人民共和国境内进行下列工程建设项目/, law: '招标投标法', desc: '招标投标法内容' },
  { pattern: /医师在执业活动中享有下列权利/, law: '医师法', desc: '医师法内容' },
  { pattern: /禁止生产（包括配制，下同）、销售、使用假药、劣药/, law: '药品管理法', desc: '药品管理法内容' },
  { pattern: /民办学校的招生简章和广告/, law: '民办教育促进法', desc: '民办教育促进法内容' },
  { pattern: /行政处罚的种类/, law: '行政处罚法', desc: '行政处罚法内容' },
  { pattern: /任何单位和个人发现有犯罪事实或者犯罪嫌疑人/, law: '刑事诉讼法', desc: '刑事诉讼法内容' },
  { pattern: /公务员应当遵纪守法，不得有下列行为/, law: '公务员法', desc: '公务员法内容' },
  { pattern: /家庭暴力受害人及其法定代理人/, law: '反家庭暴力法', desc: '反家庭暴力法内容' },
  { pattern: /保护未成年人，应当坚持最有利于未成年人的原则/, law: '未成年人保护法', desc: '未成年人保护法内容' },
  { pattern: /残疾人在政治、经济、文化、社会和家庭生活等方面享有同其他公民平等的权利/, law: '残疾人保障法', desc: '残疾人保障法内容' },
  { pattern: /在噪声敏感建筑物集中区域，禁止夜间进行产生噪声的建筑施工作业/, law: '噪声污染防治法', desc: '噪声污染防治法内容' },
  { pattern: /涉外民事关系适用的法律/, law: '涉外民事关系法律适用法', desc: '涉外民事关系法律适用法内容' },
  { pattern: /中华人民共和国在对外贸易方面根据所缔结或者参加的国际条约/, law: '对外贸易法', desc: '对外贸易法内容' },
  { pattern: /农业生产资料使用者因生产资料质量问题遭受损失/, law: '农业法', desc: '农业法内容' },
  { pattern: /承运人应当遵守法律、行政法规和规章的规定，保证运输安全/, law: '公共航空运输旅客服务管理规定', desc: '公共航空运输旅客服务管理规定内容' },
  { pattern: /坚持优先发展城市公共交通、适度发展出租汽车/, law: '网络预约出租汽车经营服务管理暂行办法', desc: '网约车管理办法内容' },
  { pattern: /交通运输部负责指导全国城市公共汽电车客运管理工作/, law: '城市公共汽电车客运管理规定', desc: '城市公共汽电车客运管理规定内容' },
  { pattern: /检举人使用与其营业执照、身份证等/, law: '税收违法行为检举管理办法', desc: '税收违法行为检举管理办法内容' },
  { pattern: /任何单位或者个人不得销售非法生产的烟草制品/, law: '烟草专卖法实施条例', desc: '烟草专卖法实施条例内容' },
  { pattern: /从事城市供水工作和使用城市供水/, law: '城市供水条例', desc: '城市供水条例内容' },
  { pattern: /燃气经营者应当向燃气用户持续、稳定、安全供应符合国家质量标准的燃气/, law: '城镇燃气管理条例', desc: '城镇燃气管理条例内容' },
];

// 检查每一条法律条款
for (let i = 0; i < laws.length; i++) {
  const law = laws[i];
  let lawIssues = [];
  
  // 检查article字段与articles第一条是否一致
  if (law.article && law.articles.length > 0) {
    const firstArticleContent = law.articles[0].content;
    if (law.article.length > 20 && !firstArticleContent.includes(law.article.substring(0, 20))) {
      lawIssues.push(`article摘要与第一条内容不一致`);
    }
  }
  
  // 检查每条条款
  for (let j = 0; j < law.articles.length; j++) {
    const article = law.articles[j];
    
    // 检查条款编号格式
    const articleNumMatch = article.content.match(/^第([一二三四五六七八九十百千零〇两]+)条/);
    if (!articleNumMatch) {
      lawIssues.push(`条款${j+1}缺少正确的条款编号格式`);
    }
    
    // 检查是否包含其他法律的特征内容
    for (const pattern of errorPatterns) {
      if (pattern.pattern.test(article.content)) {
        // 检查当前法律是否就是该法律
        if (!law.name.includes(pattern.law.split('/')[0]) && !law.name.includes(pattern.law.split('/')[1] || '')) {
          lawIssues.push(`条款${j+1}可能包含${pattern.desc}的特征内容`);
        }
      }
    }
    
    // 检查内容长度（过短可能不完整）
    if (article.content.length < 20) {
      lawIssues.push(`条款${j+1}内容过短(${article.content.length}字)，可能不完整`);
    }
  }
  
  if (lawIssues.length > 0) {
    issues.push({
      lawId: law.id,
      lawName: law.name,
      issues: lawIssues
    });
  }
}

console.log('========== 发现的问题 ==========\n');
if (issues.length === 0) {
  console.log('未发现明显问题\n');
} else {
  for (const issue of issues) {
    console.log(`【${issue.lawId}】${issue.lawName}`);
    for (const iss of issue.issues) {
      console.log(`  - ${iss}`);
    }
    console.log('');
  }
}

console.log(`========== 核查完成 ==========`);
console.log(`有问题的法律数量: ${issues.length}`);
console.log(`问题总数: ${issues.reduce((sum, i) => sum + i.issues.length, 0)}`);

// 保存核查报告
const reportPath = path.join(__dirname, '..', 'laws-deep-audit-report.txt');
let report = '法律法规深度核查报告\n\n';
report += `生成时间: ${new Date().toLocaleString()}\n`;
report += `总法律数量: ${laws.length}\n`;
report += `总条款数量: ${laws.reduce((sum, law) => sum + law.articles.length, 0)}\n\n`;

if (issues.length === 0) {
  report += '未发现明显问题\n';
} else {
  report += `有问题的法律数量: ${issues.length}\n`;
  report += `问题总数: ${issues.reduce((sum, i) => sum + i.issues.length, 0)}\n\n`;
  for (const issue of issues) {
    report += `【${issue.lawId}】${issue.lawName}\n`;
    for (const iss of issue.issues) {
      report += `  - ${iss}\n`;
    }
    report += '\n';
  }
}

fs.writeFileSync(reportPath, report, 'utf-8');
console.log(`\n核查报告已保存到: ${reportPath}`);
