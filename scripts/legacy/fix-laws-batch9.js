/**
 * 法律法规张冠李戴批量修正脚本（第九批）
 */

const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
let lawsContent = fs.readFileSync(lawsPath, 'utf-8');
let laws = eval(lawsContent.replace('module.exports =', ''));

console.log('开始第九批修正...');

const fixes = {
  // law_076 对外贸易法（两条都是人口与计划生育法内容）
  'law_076': {
    name: '中华人民共和国对外贸易法',
    full_name: '中华人民共和国对外贸易法',
    category: ['其他'],
    article: '第六条 中华人民共和国在对外贸易方面根据所缔结或者参加的国际条约、协定，给予其他缔约方、参加方最惠国待遇、国民待遇等待遇...',
    articles: [
      {
        id: 'law_076_art_001',
        content: '第六条 中华人民共和国在对外贸易方面根据所缔结或者参加的国际条约、协定，给予其他缔约方、参加方最惠国待遇、国民待遇等待遇，或者根据互惠、对等原则给予对方最惠国待遇、国民待遇等待遇。'
      },
      {
        id: 'law_076_art_002',
        content: '第六十条 违反本法第十一条规定，未经授权擅自进出口实行国营贸易管理的货物的，国务院对外贸易主管部门或者国务院其他有关部门可以处五万元以下罚款；情节严重的，可以自行政处罚决定生效之日起三年内，不受理违法行为人从事国营贸易管理货物进出口业务的申请，或者撤销已给予其从事其他国营贸易管理货物进出口的授权。'
      }
    ]
  },

  // law_077 农业法（第二条是教师法内容）
  'law_077': {
    name: '中华人民共和国农业法',
    full_name: '中华人民共和国农业法',
    category: ['其他'],
    article: '第七十六条 农业生产资料使用者因生产资料质量问题遭受损失的，出售该生产资料的经营者应当予以赔偿...',
    articles: [
      {
        id: 'law_077_art_001',
        content: '第七十六条 农业生产资料使用者因生产资料质量问题遭受损失的，出售该生产资料的经营者应当予以赔偿，赔偿额包括购货价款、有关费用和可得利益损失。'
      },
      {
        id: 'law_077_art_002',
        content: '第九十条 违反本法规定，侵害农民和农业生产经营组织的土地承包经营权等财产权或者其他合法权益的，应当停止侵害，恢复原状；造成损失、损害的，依法承担赔偿责任。国家工作人员利用职务便利或者以其他名义侵害农民和农业生产经营组织的合法权益的，应当赔偿损失，并由其所在单位或者上级主管机关给予处分。'
      }
    ]
  },

  // law_080 公共航空运输旅客服务管理规定（第二条是会计法内容）
  'law_080': {
    name: '公共航空运输旅客服务管理规定',
    full_name: '公共航空运输旅客服务管理规定',
    category: ['交通物流'],
    article: '第四条 承运人应当遵守法律、行政法规和规章的规定，保证运输安全，提高运输服务质量...',
    articles: [
      {
        id: 'law_080_art_001',
        content: '第四条 承运人应当遵守法律、行政法规和规章的规定，保证运输安全，提高运输服务质量，保障旅客的合法权益。承运人应当以明示的方式向旅客告知下列信息：（一）旅客的权利和义务；（二）运输条件；（三）客票退改签规则；（四）行李运输规则；（五）航班延误或者取消时的服务措施；（六）投诉渠道和处理流程。'
      },
      {
        id: 'law_080_art_002',
        content: '第二十四条 承运人应当按照运输合同的约定，将旅客安全运输到约定地点。承运人未按照运输合同的约定将旅客运输到约定地点的，应当根据旅客的要求，安排改乘其他航班或者退还票款。'
      }
    ]
  },

  // law_081 网络预约出租汽车经营服务管理暂行办法（第二条是统计法内容）
  'law_081': {
    name: '网络预约出租汽车经营服务管理暂行办法',
    full_name: '网络预约出租汽车经营服务管理暂行办法',
    category: ['交通物流'],
    article: '第三条 坚持优先发展城市公共交通、适度发展出租汽车，按照高品质服务、差异化经营的原则，有序发展网约车...',
    articles: [
      {
        id: 'law_081_art_001',
        content: '第三条 坚持优先发展城市公共交通、适度发展出租汽车，按照高品质服务、差异化经营的原则，有序发展网约车。网约车运价实行市场调节价，城市人民政府认为有必要实行政府指导价的除外。'
      },
      {
        id: 'law_081_art_002',
        content: '第十六条 网约车平台公司承担承运人责任，应当保证运营安全，保障乘客合法权益。'
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

console.log('\n第九批修正完成！');
console.log('修正法律数量:', fixedCount);
console.log('累计修正法律数量: 38');
console.log('当前法律数量:', laws.length);
console.log('当前条款数量:', laws.reduce((sum, law) => sum + law.articles.length, 0));
