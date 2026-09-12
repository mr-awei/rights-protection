/**
 * 统计法修正脚本
 * 2024修订版第四十一条已变更
 */

const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
let lawsContent = fs.readFileSync(lawsPath, 'utf-8');
let laws = eval(lawsContent.replace('module.exports =', ''));

console.log('开始修正统计法...\n');

for (let i = 0; i < laws.length; i++) {
  const law = laws[i];
  if (law.id === 'law_055') {
    console.log(`修正前: ${law.name}`);
    for (const art of law.articles) {
      console.log(`  - ${art.content.substring(0, 60)}...`);
    }
    
    // 修正为2024修订版正确内容
    laws[i].articles = [
      {
        id: 'law_055_art_001',
        content: '第七条 国家机关、企业事业单位和其他组织以及个体工商户和个人等统计调查对象，必须依照本法和国家有关规定，真实、准确、完整、及时地提供统计调查所需的资料，不得提供不真实或者不完整的统计资料，不得迟报、拒报统计资料。'
      },
      {
        id: 'law_055_art_002',
        content: '第四十一条 县级以上人民政府统计机构或者有关部门有下列行为之一的，由本级人民政府、上级人民政府统计机构或者本级人民政府统计机构责令改正，予以通报；对负有责任的领导人员和直接责任人员，由任免机关或者监察机关依法给予处分：（一）未经批准或者备案擅自组织实施统计调查的；（二）未经批准或者备案擅自变更统计调查制度的内容的；（三）伪造、篡改统计资料的；（四）要求统计调查对象或者其他机构、人员提供不真实的统计资料的；（五）未按照统计调查制度的规定报送有关资料的。'
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
