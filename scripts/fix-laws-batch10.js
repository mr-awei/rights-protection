/**
 * 法律法规张冠李戴批量修正脚本（第十批 - 最后一批）
 */

const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
let lawsContent = fs.readFileSync(lawsPath, 'utf-8');
let laws = eval(lawsContent.replace('module.exports =', ''));

console.log('开始第十批（最后一批）修正...');

const fixes = {
  // law_082 城市公共汽电车客运管理规定（第二条是专利法内容）
  'law_082': {
    name: '城市公共汽车和电车客运管理规定',
    full_name: '城市公共汽车和电车客运管理规定',
    category: ['交通物流'],
    article: '第三条 交通运输部负责指导全国城市公共汽电车客运管理工作...',
    articles: [
      {
        id: 'law_082_art_001',
        content: '第三条 交通运输部负责指导全国城市公共汽电车客运管理工作。省、自治区人民政府交通运输主管部门负责指导本行政区域内城市公共汽电车客运管理工作。城市人民政府交通运输主管部门或者城市人民政府指定的城市公共交通运营主管部门（以下简称城市公共交通主管部门）具体承担本行政区域内城市公共汽电车客运管理工作。'
      },
      {
        id: 'law_082_art_002',
        content: '第四条 城市公共汽电车客运是城市公共交通的重要组成部分，具有公益属性。省、自治区人民政府交通运输主管部门应当配合有关部门，在城市人民政府的统一领导下，科学编制城市公共交通规划，确立公共汽电车客运在城市公共交通中的主体地位，在城市用地、财政投入、道路通行、设施建设等方面给予优先保障。'
      }
    ]
  },

  // law_085 税收违法行为检举管理办法（第二条是反不正当竞争法内容）
  'law_085': {
    name: '税收违法行为检举管理办法',
    full_name: '税收违法行为检举管理办法',
    category: ['政务服务'],
    article: '第十条 检举人使用与其营业执照、身份证等符合法律、行政法规和国家有关规定的身份证件上一致的名称、姓名检举的，为实名检举...',
    articles: [
      {
        id: 'law_085_art_001',
        content: '第十条 检举人使用与其营业执照、身份证等符合法律、行政法规和国家有关规定的身份证件上一致的名称、姓名检举的，为实名检举；否则为匿名检举。'
      },
      {
        id: 'law_085_art_002',
        content: '第二十条 检举事项受理后，应当分级分类，按照以下方式处理：（一）检举内容详细、税收违法行为线索清楚、证明资料充分的，由稽查局立案检查。（二）检举内容与线索较明确但缺少必要证明资料，有可能存在税收违法行为的，由稽查局调查核实。发现存在税收违法行为的，立案检查；未发现的，作查结处理。（三）检举对象明确，但其他检举事项不完整或者内容不清、线索不明的，可以暂存待查，待检举人将情况补充完整以后，再进行处理。（四）已经受理尚未查结的检举事项，再次检举的，可以合并处理。（五）本办法第三条规定以外的检举事项，转交有处理权的单位或者部门。'
      }
    ]
  },

  // law_087 烟草专卖法实施条例（两条都是仲裁法内容）
  'law_087': {
    name: '中华人民共和国烟草专卖法实施条例',
    full_name: '中华人民共和国烟草专卖法实施条例',
    category: ['消费购物'],
    article: '第二十五条 任何单位或者个人不得销售非法生产的烟草制品...',
    articles: [
      {
        id: 'law_087_art_001',
        content: '第二十五条 任何单位或者个人不得销售非法生产的烟草制品。'
      },
      {
        id: 'law_087_art_002',
        content: '第六十条 违反本条例第二十六条、第三十六条第二款规定，为无烟草专卖许可证的单位或者个人提供烟草专卖品的，由烟草专卖行政主管部门没收违法所得，并处以销售总额20%以上50%以下的罚款。'
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

console.log('\n第十批（最后一批）修正完成！');
console.log('修正法律数量:', fixedCount);
console.log('累计修正法律数量: 41');
console.log('当前法律数量:', laws.length);
console.log('当前条款数量:', laws.reduce((sum, law) => sum + law.articles.length, 0));

// 验证语法
try {
  eval(output);
  console.log('\n语法验证通过！');
} catch (e) {
  console.log('\n语法验证失败:', e.message);
}
