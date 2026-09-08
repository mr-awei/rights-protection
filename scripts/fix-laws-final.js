/**
 * 法律法规张冠李戴最终修正脚本
 * 修复最后2部仍有问题的法律
 */

const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
let lawsContent = fs.readFileSync(lawsPath, 'utf-8');
let laws = eval(lawsContent.replace('module.exports =', ''));

console.log('开始最终修正...');

const fixes = {
  // law_040 城市供水条例（第一条是义务教育法内容）
  'law_040': {
    name: '城市供水条例',
    full_name: '城市供水条例',
    category: ['公共事业'],
    article: '第二条 从事城市供水工作和使用城市供水，必须遵守本条例...',
    articles: [
      {
        id: 'law_040_art_001',
        content: '第二条 从事城市供水工作和使用城市供水，必须遵守本条例。'
      },
      {
        id: 'law_040_art_002',
        content: '第三十三条 城市自来水供水企业或者自建设施对外供水的企业有下列行为之一的，由城市供水行政主管部门责令改正，可以处以罚款；情节严重的，报经县级以上人民政府批准，可以责令停业整顿；对负有直接责任的主管人员和其他直接责任人员，其所在单位或者上级机关可以给予行政处分：（一）供水水质、水压不符合国家规定标准的；（二）擅自停止供水或者未履行停水通知义务的；（三）未按照规定检修供水设施或者在供水设施发生故障后未及时抢修的。'
      }
    ]
  },

  // law_041 城镇燃气管理条例（第二条是社会保险法内容）
  'law_041': {
    name: '城镇燃气管理条例',
    full_name: '城镇燃气管理条例',
    category: ['公共事业'],
    article: '第十七条 燃气经营者应当向燃气用户持续、稳定、安全供应符合国家质量标准的燃气...',
    articles: [
      {
        id: 'law_041_art_001',
        content: '第十七条 燃气经营者应当向燃气用户持续、稳定、安全供应符合国家质量标准的燃气，指导燃气用户安全用气、节约用气，并对燃气设施定期进行安全检查。燃气经营者应当公示业务流程、服务承诺、收费标准和服务热线等信息，并按照国家燃气服务标准提供服务。'
      },
      {
        id: 'law_041_art_002',
        content: '第四十四条 违反本条例规定，县级以上地方人民政府及其燃气管理部门和其他有关部门，不依法作出行政许可决定或者办理批准文件的，发现违法行为或者接到对违法行为的举报不予查处的，或者有其他未依照本条例规定履行职责的行为的，对直接负责的主管人员和其他直接责任人员，依法给予处分；直接负责的主管人员和其他直接责任人员的行为构成犯罪的，依法追究刑事责任。'
      }
    ]
  }
};

let fixedCount = 0;
for (let i = 0; i < laws.length; i++) {
  const law = laws[i];
  if (fixes[law.id]) {
    const fix = fixes[law.id];
    laws[i] = {
      ...law,
      name: fix.name,
      full_name: fix.full_name,
      category: fix.category,
      article: fix.article,
      articles: fix.articles
    };
    fixedCount++;
    console.log(`已修正: ${fix.name} (${law.id})`);
  }
}

const output = 'module.exports = ' + JSON.stringify(laws, null, 2) + ';';
fs.writeFileSync(lawsPath, output, 'utf-8');

console.log('\n最终修正完成！');
console.log('修正法律数量:', fixedCount);
console.log('累计修正法律数量: 43');
console.log('当前法律数量:', laws.length);
console.log('当前条款数量:', laws.reduce((sum, law) => sum + law.articles.length, 0));

// 验证语法
try {
  eval(output);
  console.log('\n语法验证通过！');
} catch (e) {
  console.log('\n语法验证失败:', e.message);
}
