/**
 * 法律法规张冠李戴批量修正脚本（第八批）
 */

const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
let lawsContent = fs.readFileSync(lawsPath, 'utf-8');
let laws = eval(lawsContent.replace('module.exports =', ''));

console.log('开始第八批修正...');

const fixes = {
  // law_071 未成年人保护法（第二条是传染病防治法内容）
  'law_071': {
    name: '中华人民共和国未成年人保护法',
    full_name: '中华人民共和国未成年人保护法',
    category: ['其他'],
    article: '第四条 保护未成年人，应当坚持最有利于未成年人的原则...',
    articles: [
      {
        id: 'law_071_art_001',
        content: '第四条 保护未成年人，应当坚持最有利于未成年人的原则。处理涉及未成年人事项，应当符合下列要求：（一）给予未成年人特殊、优先保护；（二）尊重未成年人人格尊严；（三）保护未成年人隐私权和个人信息；（四）适应未成年人身心健康发展的规律和特点；（五）听取未成年人的意见；（六）保护与教育相结合。'
      },
      {
        id: 'law_071_art_002',
        content: '第一百二十九条 违反本法规定，侵犯未成年人合法权益，造成人身、财产或者其他损害的，依法承担民事责任。违反本法规定，构成违反治安管理行为的，依法给予治安管理处罚；构成犯罪的，依法追究刑事责任。'
      }
    ]
  },

  // law_072 残疾人保障法（第一条是医疗器械监督管理条例内容）
  'law_072': {
    name: '中华人民共和国残疾人保障法',
    full_name: '中华人民共和国残疾人保障法',
    category: ['其他'],
    article: '第三条 残疾人在政治、经济、文化、社会和家庭生活等方面享有同其他公民平等的权利...',
    articles: [
      {
        id: 'law_072_art_001',
        content: '第三条 残疾人在政治、经济、文化、社会和家庭生活等方面享有同其他公民平等的权利。残疾人的公民权利和人格尊严受法律保护。禁止基于残疾的歧视。禁止侮辱、侵害残疾人。禁止通过大众传播媒介或者其他方式贬低损害残疾人人格。'
      },
      {
        id: 'law_072_art_002',
        content: '第六十七条 违反本法规定，侵害残疾人的合法权益，其他法律、法规规定行政处罚的，从其规定；造成财产损失或者其他损害的，依法承担民事责任；构成犯罪的，依法追究刑事责任。'
      }
    ]
  },

  // law_073 噪声污染防治法（两条都是医疗机构管理条例内容）
  'law_073': {
    name: '中华人民共和国噪声污染防治法',
    full_name: '中华人民共和国噪声污染防治法',
    category: ['环保市容'],
    article: '第四十三条 在噪声敏感建筑物集中区域，禁止夜间进行产生噪声的建筑施工作业...',
    articles: [
      {
        id: 'law_073_art_001',
        content: '第四十三条 在噪声敏感建筑物集中区域，禁止夜间进行产生噪声的建筑施工作业，但抢修、抢险施工作业，因生产工艺要求或者其他特殊需要必须连续施工作业的除外。因特殊需要必须连续施工作业的，建设单位应当取得地方人民政府住房和城乡建设、生态环境主管部门或者地方人民政府指定的部门的证明，并在施工现场显著位置公示或者以其他方式公告附近居民。'
      },
      {
        id: 'law_073_art_002',
        content: '第八十二条 违反本法规定，有下列行为之一，由地方人民政府指定的部门说服教育，责令改正；拒不改正的，给予警告，对个人可以处二百元以上一千元以下的罚款，对单位可以处二千元以上二万元以下的罚款：（一）在噪声敏感建筑物集中区域使用高音广播喇叭的；（二）在公共场所组织或者开展娱乐、健身等活动，未遵守公共场所管理者有关活动区域、时段、音量等规定，未采取有效措施造成噪声污染，或者违反规定使用音响器材产生过大音量的；（三）对已竣工交付使用的建筑物进行室内装修活动，未按照规定在限定的作业时间内进行，或者未采取有效措施造成噪声污染的；（四）其他违反法律规定造成社会生活噪声污染的。'
      }
    ]
  },

  // law_074 涉外民事关系法律适用法（第一条是母婴保健法内容）
  'law_074': {
    name: '中华人民共和国涉外民事关系法律适用法',
    full_name: '中华人民共和国涉外民事关系法律适用法',
    category: ['其他'],
    article: '第二条 涉外民事关系适用的法律，依照本法确定...',
    articles: [
      {
        id: 'law_074_art_001',
        content: '第二条 涉外民事关系适用的法律，依照本法确定。其他法律对涉外民事关系法律适用另有特别规定的，依照其规定。本法和其他法律对涉外民事关系法律适用没有规定的，适用与该涉外民事关系有最密切联系的法律。'
      },
      {
        id: 'law_074_art_002',
        content: '第三条 当事人依照法律规定可以明示选择涉外民事关系适用的法律。'
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

console.log('\n第八批修正完成！');
console.log('修正法律数量:', fixedCount);
console.log('累计修正法律数量: 34');
console.log('当前法律数量:', laws.length);
console.log('当前条款数量:', laws.reduce((sum, law) => sum + law.articles.length, 0));
