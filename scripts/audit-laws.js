/**
 * 法律法规全面核查脚本
 * 输出所有法律的ID、名称、条款编号和内容摘要，用于逐部核查
 */

const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
let lawsContent = fs.readFileSync(lawsPath, 'utf-8');
let laws = eval(lawsContent.replace('module.exports =', ''));

console.log('========== 法律法规全面核查清单 ==========');
console.log('总法律数量:', laws.length);
console.log('总条款数量:', laws.reduce((s, l) => s + l.articles.length, 0));
console.log('');

// 输出每部法律的基本信息
laws.forEach((law, index) => {
  console.log(`【${index + 1}】ID: ${law.id}`);
  console.log(`    名称: ${law.name}`);
  console.log(`    分类: ${law.category ? law.category.join(', ') : '无'}`);
  console.log(`    条款数量: ${law.articles ? law.articles.length : 0}`);
  if (law.articles && law.articles.length > 0) {
    law.articles.forEach((art, i) => {
      // 提取条款编号
      const numMatch = art.content.match(/^(第[一二三四五六七八九十百零千\d]+条)/);
      const num = numMatch ? numMatch[1] : '未知编号';
      // 提取内容前30字
      const preview = art.content.substring(0, 50).replace(/\n/g, ' ');
      console.log(`      [${i + 1}] ${art.id}: ${num} | ${preview}...`);
    });
  }
  console.log('');
});

// 检查明显的张冠李戴：法律名称与条款内容关键词不匹配
console.log('========== 疑似张冠李戴检测 ==========');
const suspicious = [];

laws.forEach(law => {
  if (!law.articles) return;
  
  law.articles.forEach(art => {
    const content = art.content;
    const lawName = law.name.replace('中华人民共和国', '').replace('条例', '').replace('法', '');
    
    // 检测条款内容中提到的法律主体是否与法律名称匹配
    // 这是一个简单的启发式检测，可能有误报，需要人工复核
    
    // 检测1：邮政法内容出现在非邮政法中
    if (content.includes('邮政企业') && !law.name.includes('邮政') && !law.name.includes('邮件')) {
      suspicious.push({ lawId: law.id, lawName: law.name, artId: art.id, reason: '包含"邮政企业"，疑似邮政法内容', preview: content.substring(0, 40) });
    }
    
    // 检测2：快递内容出现在非快递法中
    if (content.includes('经营快递业务') && !law.name.includes('快递')) {
      suspicious.push({ lawId: law.id, lawName: law.name, artId: art.id, reason: '包含"经营快递业务"，疑似快递条例内容', preview: content.substring(0, 40) });
    }
    
    // 检测3：商业银行内容出现在非银行法中
    if (content.includes('商业银行') && !law.name.includes('银行') && !law.name.includes('金融')) {
      suspicious.push({ lawId: law.id, lawName: law.name, artId: art.id, reason: '包含"商业银行"，疑似银行法内容', preview: content.substring(0, 40) });
    }
    
    // 检测4：电信内容出现在非电信法中
    if (content.includes('电信业务经营者') && !law.name.includes('电信')) {
      suspicious.push({ lawId: law.id, lawName: law.name, artId: art.id, reason: '包含"电信业务经营者"，疑似电信法内容', preview: content.substring(0, 40) });
    }
  });
});

if (suspicious.length > 0) {
  console.log(`发现 ${suspicious.length} 条疑似张冠李戴：`);
  suspicious.forEach((s, i) => {
    console.log(`  ${i + 1}. [${s.lawId}] ${s.lawName} - ${s.artId}`);
    console.log(`     原因: ${s.reason}`);
    console.log(`     内容: ${s.preview}...`);
  });
} else {
  console.log('未发现明显的张冠李戴');
}

// 保存核查结果到文件
const reportPath = path.join(__dirname, '..', 'laws-audit-report.txt');
let report = '法律法规全面核查报告\n';
report += '生成时间: ' + new Date().toLocaleString() + '\n';
report += '总法律数量: ' + laws.length + '\n';
report += '总条款数量: ' + laws.reduce((s, l) => s + l.articles.length, 0) + '\n\n';

report += '========== 疑似张冠李戴清单 ==========\n';
if (suspicious.length > 0) {
  suspicious.forEach((s, i) => {
    report += `${i + 1}. [${s.lawId}] ${s.lawName} - ${s.artId}\n`;
    report += `   原因: ${s.reason}\n`;
    report += `   内容: ${s.preview}...\n\n`;
  });
} else {
  report += '未发现明显的张冠李戴\n';
}

fs.writeFileSync(reportPath, report, 'utf-8');
console.log('\n核查报告已保存到:', reportPath);
