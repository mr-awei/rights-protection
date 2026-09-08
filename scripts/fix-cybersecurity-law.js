/**
 * 网络安全法第四十四条修正脚本
 * 2025修订版第四十四条已变更为网络运营者不得泄露个人信息
 */

const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
let lawsContent = fs.readFileSync(lawsPath, 'utf-8');
let laws = eval(lawsContent.replace('module.exports =', ''));

console.log('开始修正网络安全法第四十四条...\n');

for (let i = 0; i < laws.length; i++) {
  const law = laws[i];
  if (law.id === 'law_031') {
    console.log(`修正前: ${law.name}`);
    for (const art of law.articles) {
      console.log(`  - ${art.content.substring(0, 60)}...`);
    }
    
    // 修正第四十四条为2025修订版内容
    laws[i].articles = [
      {
        id: 'law_031_art_001',
        content: '第二条 在中华人民共和国境内建设、运营、维护和使用网络，以及网络安全的监督管理，适用本法。'
      },
      {
        id: 'law_031_art_002',
        content: '第四十四条 网络运营者不得泄露、篡改、毁损其收集的个人信息；未经被收集者同意，不得向他人提供个人信息。但是，经过处理无法识别特定个人且不能复原的除外。网络运营者应当采取技术措施和其他必要措施，确保其收集的个人信息安全，防止信息泄露、毁损、丢失。在发生或者可能发生个人信息泄露、毁损、丢失的情况时，应当立即采取补救措施，按照规定及时告知用户并向有关主管部门报告。'
      },
      {
        id: 'law_031_art_003',
        content: '第六十四条 网络运营者、网络产品或者服务的提供者违反本法第二十二条第三款、第四十一条至第四十三条规定，侵害个人信息依法得到保护的权利的，由有关主管部门责令改正，可以根据情节单处或者并处警告、没收违法所得、处违法所得一倍以上十倍以下罚款，没有违法所得的，处一百万元以下罚款，对直接负责的主管人员和其他直接责任人员处一万元以上十万元以下罚款；情节严重的，并可以责令暂停相关业务、停业整顿、关闭网站、吊销相关业务许可证或者吊销营业执照。违反本法第四十四条规定，窃取或者以其他非法方式获取、非法出售或者非法向他人提供个人信息，尚不构成犯罪的，由公安机关没收违法所得，并处违法所得一倍以上十倍以下罚款，没有违法所得的，处一百万元以下罚款。'
      }
    ];
    
    // 更新article摘要
    laws[i].article = laws[i].articles[0].content.substring(0, 100) + '...';
    
    console.log('\n修正后:');
    for (const art of laws[i].articles) {
      console.log(`  - ${art.content.substring(0, 60)}...`);
    }
    break;
  }
}

const output = 'module.exports = ' + JSON.stringify(laws, null, 2) + ';';
fs.writeFileSync(lawsPath, output, 'utf-8');

console.log('\n修正完成！');

// 验证语法
try {
  eval(output);
  console.log('语法验证通过！');
} catch (e) {
  console.log('语法验证失败:', e.message);
}
