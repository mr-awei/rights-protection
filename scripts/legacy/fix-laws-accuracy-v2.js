/**
 * 法律法规内容准确性修正脚本
 * 修正在深度核查中发现的内容错误
 */

const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
let lawsContent = fs.readFileSync(lawsPath, 'utf-8');
let laws = eval(lawsContent.replace('module.exports =', ''));

console.log('开始内容准确性修正...\n');

const fixes = {
  // law_021 教育法 - 第八十一条内容错误（2021修订版）
  'law_021': {
    articles: [
      {
        id: 'law_021_art_001',
        content: '第七十八条 学校及其他教育机构违反国家有关规定向受教育者收取费用的，由教育行政部门或者其他有关行政部门责令退还所收费用；对直接负责的主管人员和其他直接责任人员，依法给予处分。'
      },
      {
        id: 'law_021_art_002',
        content: '第八十一条 举办国家教育考试，教育行政部门、教育考试机构疏于管理，造成考场秩序混乱、作弊情况严重的，对直接负责的主管人员和其他直接责任人员，依法给予处分；构成犯罪的，依法追究刑事责任。'
      }
    ]
  },

  // law_029 行政复议法 - 第六条内容错误（2023修订版）
  'law_029': {
    articles: [
      {
        id: 'law_029_art_001',
        content: '第六条 外国人、无国籍人、外国组织在中华人民共和国境内申请行政复议，适用本法。'
      },
      {
        id: 'law_029_art_002',
        content: '第十一条 有下列情形之一的，公民、法人或者其他组织可以依照本法申请行政复议：（一）对行政机关作出的行政处罚决定不服；（二）对行政机关作出的行政强制措施、行政强制执行决定不服；（三）申请行政许可，行政机关拒绝或者在法定期限内不予答复，或者对行政机关作出的有关行政许可的其他决定不服；（四）对行政机关作出的关于确认土地、矿藏、水流、森林、山岭、草原、荒地、滩涂、海域等自然资源的所有权或者使用权的决定不服；（五）对行政机关作出的征收征用决定及其补偿决定不服；（六）认为行政机关侵犯其经营自主权或者农村土地承包经营权、农村土地经营权；（七）认为行政机关滥用行政权力排除或者限制竞争；（八）认为行政机关违法集资、摊派费用或者违法要求履行其他义务；（九）认为行政机关不依法履行、未按照约定履行或者违法变更、解除政府特许经营协议、土地房屋征收补偿协议等协议；（十）认为行政机关侵犯其他人身权、财产权等合法权益。'
      }
    ]
  }
};

let fixedCount = 0;
for (let i = 0; i < laws.length; i++) {
  const law = laws[i];
  if (fixes[law.id]) {
    const fix = fixes[law.id];
    if (fix.articles) {
      laws[i].articles = fix.articles;
      // 更新article摘要字段
      if (fix.articles.length > 0) {
        const firstArticle = fix.articles[0].content;
        laws[i].article = firstArticle.length > 100 
          ? firstArticle.substring(0, 100) + '...' 
          : firstArticle;
      }
    }
    fixedCount++;
    console.log(`已修正: ${law.id} ${law.name}`);
    if (fix.articles) {
      for (const art of fix.articles) {
        console.log(`  - ${art.content.substring(0, 50)}...`);
      }
    }
  }
}

const output = 'module.exports = ' + JSON.stringify(laws, null, 2) + ';';
fs.writeFileSync(lawsPath, output, 'utf-8');

console.log(`\n修正完成！共修正 ${fixedCount} 部法律的内容准确性问题`);

// 验证语法
try {
  eval(output);
  console.log('语法验证通过！');
} catch (e) {
  console.log('语法验证失败:', e.message);
}
