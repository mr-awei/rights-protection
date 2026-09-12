/**
 * 反间谍法全面修正脚本
 * 2023修订版条款已全面变更
 */

const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
let lawsContent = fs.readFileSync(lawsPath, 'utf-8');
let laws = eval(lawsContent.replace('module.exports =', ''));

console.log('开始修正反间谍法...\n');

for (let i = 0; i < laws.length; i++) {
  const law = laws[i];
  if (law.id === 'law_046') {
    console.log(`修正前: ${law.name}`);
    for (const art of law.articles) {
      console.log(`  - ${art.content.substring(0, 60)}...`);
    }
    
    // 修正为2023修订版正确内容
    laws[i].articles = [
      {
        id: 'law_046_art_001',
        content: '第四条 本法所称间谍行为，是指下列行为：（一）间谍组织及其代理人实施或者指使、资助他人实施，或者境内外机构、组织、个人与其相勾结实施的危害中华人民共和国国家安全的活动；（二）参加间谍组织或者接受间谍组织及其代理人的任务，或者投靠间谍组织及其代理人；（三）间谍组织及其代理人以外的其他境外机构、组织、个人实施或者指使、资助他人实施，或者境内机构、组织、个人与其相勾结实施的窃取、刺探、收买、非法提供国家秘密、情报或者其他关系国家安全和利益的文件、数据、资料、物品的行为；（四）间谍组织及其代理人实施或者指使、资助他人实施，或者境内外机构、组织、个人与其相勾结实施针对国家机关、涉密单位或者关键信息基础设施等的网络攻击、侵入、干扰、控制、破坏等活动；（五）为敌人指示攻击目标；（六）进行其他间谍活动。'
      },
      {
        id: 'law_046_art_002',
        content: '第二十一条 公民和组织发现间谍行为，应当及时向国家安全机关报告；向公安机关等其他国家机关、组织报告的，相关国家机关、组织应当立即移送国家安全机关处理。'
      },
      {
        id: 'law_046_art_003',
        content: '第三十八条 对违反本法规定，涉嫌犯罪，需要对有关事项是否属于国家秘密或者情报进行鉴定以及需要对危害后果进行评估的，由国家保密部门或者省、自治区、直辖市保密部门按照程序在一定期限内进行鉴定和组织评估。'
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
