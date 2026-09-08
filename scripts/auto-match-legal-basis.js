// 自动补全渠道法律依据
const fs = require('fs');
const path = require('path');

// 法律依据匹配规则（按分类匹配）
const legalBasisRules = {
  '电信运营': '《中华人民共和国电信条例》《电信服务规范》《中华人民共和国消费者权益保护法》',
  '快递物流': '《中华人民共和国邮政法》《快递暂行条例》《中华人民共和国消费者权益保护法》',
  '金融消费': '《中华人民共和国商业银行法》《中华人民共和国银行业监督管理法》《中华人民共和国保险法》《中华人民共和国证券法》《中华人民共和国消费者权益保护法》',
  '市场监管': '《中华人民共和国消费者权益保护法》《中华人民共和国产品质量法》《中华人民共和国食品安全法》《中华人民共和国价格法》',
  '消费者权益': '《中华人民共和国消费者权益保护法》《中华人民共和国产品质量法》《中华人民共和国民法典》',
  '房地产': '《物业管理条例》《商品房销售管理办法》《中华人民共和国民法典》《中华人民共和国城市房地产管理法》',
  '劳动用工': '《中华人民共和国劳动法》《中华人民共和国劳动合同法》《中华人民共和国劳动争议调解仲裁法》《中华人民共和国社会保险法》',
  '医疗健康': '《中华人民共和国基本医疗卫生与健康促进法》《中华人民共和国医师法》《中华人民共和国药品管理法》《医疗纠纷预防和处理条例》',
  '教育培训': '《中华人民共和国教育法》《中华人民共和国义务教育法》《中华人民共和国民办教育促进法》《中华人民共和国消费者权益保护法》',
  '交通出行': '《中华人民共和国道路交通安全法》《出租汽车驾驶员从业资格管理规定》《网络预约出租汽车经营服务管理暂行办法》',
  '环境保护': '《中华人民共和国环境保护法》《中华人民共和国噪声污染防治法》《中华人民共和国大气污染防治法》《中华人民共和国水污染防治法》',
  '食品药品': '《中华人民共和国食品安全法》《中华人民共和国药品管理法》《中华人民共和国产品质量法》《中华人民共和国消费者权益保护法》',
  '政务服务': '《中华人民共和国宪法》《中华人民共和国行政复议法》《中华人民共和国行政诉讼法》《信访工作条例》',
  '个人信息': '《中华人民共和国个人信息保护法》《中华人民共和国数据安全法》《中华人民共和国网络安全法》',
  '网络安全': '《中华人民共和国网络安全法》《中华人民共和国数据安全法》《中华人民共和国个人信息保护法》',
  '基础民生与公共交通': '《中华人民共和国消费者权益保护法》《中华人民共和国民法典》',
};

function getLegalBasis(channel) {
  const category = channel.category_user_l2 || channel.category_user || '';
  const categoryL1 = channel.category_l1 || '';

  // 优先匹配二级分类
  if (legalBasisRules[category]) {
    return legalBasisRules[category];
  }

  // 匹配一级分类中的关键词
  for (const key of Object.keys(legalBasisRules)) {
    if (categoryL1.includes(key) || key.includes(categoryL1)) {
      return legalBasisRules[key];
    }
  }

  // 默认法律依据
  return '《中华人民共和国消费者权益保护法》《中华人民共和国民法典》';
}

// 处理渠道分片文件
const files = [
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_1.js'),
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_2.js'),
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_3.js'),
];

let totalUpdated = 0;
let totalWithLegalBasis = 0;

files.forEach((filePath, fileIndex) => {
  const channels = require(filePath);
  let updated = 0;

  channels.forEach(channel => {
    // 如果已经有法律依据，跳过
    if (channel.legal_basis && channel.legal_basis.trim() !== '') {
      totalWithLegalBasis++;
      return;
    }

    // 自动匹配
    const legalBasis = getLegalBasis(channel);
    if (legalBasis) {
      channel.legal_basis = legalBasis;
      updated++;
      totalWithLegalBasis++;
    }
  });

  // 写回文件
  const content = 'module.exports = ' + JSON.stringify(channels, null, 2) + ';\n';
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`文件${fileIndex + 1}更新了${updated}个渠道的法律依据`);
  totalUpdated += updated;
});

console.log(`\n总计更新了${totalUpdated}个渠道的法律依据`);
console.log(`当前有法律依据的渠道数: ${totalWithLegalBasis}/122`);
console.log(`覆盖率: ${(totalWithLegalBasis / 122 * 100).toFixed(1)}%`);
