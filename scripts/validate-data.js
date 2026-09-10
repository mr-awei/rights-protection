/**
 * 数据一致性自动验证脚本
 * 用法：node scripts/validate-data.js
 * 
 * 验证内容：
 * 1. 一级分类匹配（categories.js vs 渠道数据）
 * 2. 二级分类有效性（渠道的category_l2必须在categories.js里）
 * 3. category_l2与category_user_l2一致性
 * 4. 索引文件与分片文件一致性
 * 5. issue_types有效性
 * 6. 空字段检查
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'miniprogram', 'data');
const DETAIL_DATA_DIR = path.join(__dirname, '..', 'miniprogram', 'detail', 'data');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.js');
const INDEX_FILE = path.join(DATA_DIR, 'channels_index.js');
const PART_FILES = [1, 2, 3].map(i => path.join(DETAIL_DATA_DIR, `channels_part_${i}.js`));

let errors = [];
let warnings = [];

function error(msg) { errors.push(msg); }
function warning(msg) { warnings.push(msg); }

console.log('========== 数据一致性验证 ==========\n');

// 1. 加载数据
console.log('【1. 加载数据】');
delete require.cache[require.resolve(CATEGORIES_FILE)];
const categories = require(CATEGORIES_FILE);
console.log('  categories.js: ' + categories.length + '个一级分类');

const allChannels = [];
PART_FILES.forEach(file => {
  delete require.cache[require.resolve(file)];
  const data = require(file);
  allChannels.push(...data);
});
console.log('  分片文件: ' + allChannels.length + '条渠道');

delete require.cache[require.resolve(INDEX_FILE)];
const indexData = require(INDEX_FILE);
console.log('  索引文件: ' + indexData.length + '条渠道');

// 2. 一级分类匹配
console.log('\n【2. 一级分类匹配】');
const catL1Names = new Set(categories.map(c => c.name));
const channelL1Names = new Set(allChannels.map(c => c.category_l1).filter(Boolean));
const l1OnlyInCat = [...catL1Names].filter(n => !channelL1Names.has(n));
const l1OnlyInChannel = [...channelL1Names].filter(n => !catL1Names.has(n));
if (l1OnlyInCat.length === 0 && l1OnlyInChannel.length === 0) {
  console.log('  ✅ 一级分类完全匹配');
} else {
  if (l1OnlyInCat.length > 0) {
    warning('仅categories.js有: ' + JSON.stringify(l1OnlyInCat));
  }
  if (l1OnlyInChannel.length > 0) {
    error('仅渠道数据有: ' + JSON.stringify(l1OnlyInChannel));
  }
}

// 3. 二级分类有效性
console.log('\n【3. 二级分类有效性】');
let invalidL2 = 0;
allChannels.forEach(c => {
  const cat = categories.find(cat => cat.name === c.category_l1);
  if (cat) {
    const l2Names = new Set(cat.children.map(child => child.name));
    if (!l2Names.has(c.category_l2)) {
      invalidL2++;
      if (invalidL2 <= 5) {
        error('  ' + c.name + ': l1=' + c.category_l1 + ', l2=' + c.category_l2 + '（不在categories.js里）');
      }
    }
  } else {
    invalidL2++;
    error('  ' + c.name + ': 无效的一级分类 ' + c.category_l1);
  }
});
if (invalidL2 === 0) {
  console.log('  ✅ 所有渠道二级分类有效');
} else {
  error('共' + invalidL2 + '条渠道二级分类无效');
}

// 4. category_l2与category_user_l2一致性
console.log('\n【4. category_l2与category_user_l2一致性】');
let l2Mismatch = allChannels.filter(c => c.category_l2 !== c.category_user_l2).length;
if (l2Mismatch === 0) {
  console.log('  ✅ 完全一致');
} else {
  error('共' + l2Mismatch + '条渠道不一致');
  allChannels.filter(c => c.category_l2 !== c.category_user_l2).slice(0, 5).forEach(c => {
    error('  ' + c.name + ': l2=' + c.category_l2 + ', user_l2=' + c.category_user_l2);
  });
}

// 5. 索引与分片一致性
console.log('\n【5. 索引与分片一致性】');
const indexIds = new Set(indexData.map(c => c.id));
const partIds = new Set(allChannels.map(c => c.id));
if (indexIds.size === partIds.size && [...indexIds].every(id => partIds.has(id))) {
  console.log('  ✅ ID完全一致');
} else {
  error('ID不一致: 索引' + indexIds.size + '条, 分片' + partIds.size + '条');
}

// 检查索引字段完整性
const requiredFields = ['id', 'name', 'category_l1', 'category_l2', 'category_user_l2', 'issue_types'];
let missingFieldCount = 0;
indexData.forEach(c => {
  requiredFields.forEach(field => {
    if (c[field] === undefined || c[field] === null) {
      missingFieldCount++;
      if (missingFieldCount <= 3) {
        error('  索引缺少字段: ' + c.name + '.' + field);
      }
    }
  });
});
if (missingFieldCount === 0) {
  console.log('  ✅ 索引字段完整');
} else {
  error('索引共缺少' + missingFieldCount + '个字段');
}

// 6. issue_types有效性
console.log('\n【6. issue_types有效性】');
const validIssueTypes = new Set(['overcharge', 'no_refund', 'quality', 'service_attitude', 'inaction', 'fraud', 'privacy', 'other']);
let emptyIssueTypes = 0;
let invalidIssueTypes = 0;
allChannels.forEach(c => {
  if (!c.issue_types || c.issue_types.length === 0) {
    emptyIssueTypes++;
  } else {
    c.issue_types.forEach(t => {
      if (!validIssueTypes.has(t)) {
        invalidIssueTypes++;
        if (invalidIssueTypes <= 3) {
          error('  ' + c.name + ': 无效issue_type=' + t);
        }
      }
    });
  }
});
if (emptyIssueTypes === 0 && invalidIssueTypes === 0) {
  console.log('  ✅ 所有渠道issue_types有效');
} else {
  if (emptyIssueTypes > 0) error(emptyIssueTypes + '条渠道issue_types为空');
  if (invalidIssueTypes > 0) error(invalidIssueTypes + '个无效issue_type');
}

// 7. category_user 语义一致性检查
console.log('\n【7. category_user 语义一致性检查】');
const L2_TO_EXPECTED_USER = {
  // 基础民生与公共交通
  '电信运营': '电信运营',
  '快递与邮政': '快递物流',
  '供电': '公用事业',
  '供水': '公用事业',
  '燃气': '公用事业',
  '供热/供暖': '公用事业',
  '铁路': '交通出行',
  '民航': '交通出行',
  '公路/网约车/出租车': '交通出行',
  '城市公交/地铁': '交通出行',
  // 金融与商业消费
  '银行': '金融保险',
  '保险': '金融保险',
  '证券/基金/期货': '金融保险',
  '消费者权益(12315)': '消费购物',
  '互联网电商': '消费购物',
  '价格监管': '金融保险',
  '市场监管(综合)': '消费购物',
  '广告违法': '消费购物',
  '产品质量': '消费购物',
  '知识产权': '消费购物',
  '电信诈骗/金融诈骗': '网络安全',
  '反垄断与经济违法': '金融保险',
  '政府采购': '政务纪检',
  '商务领域(预付卡/二手车)': '消费购物',
  '烟草专卖': '政务纪检',
  '农业生产资料': '政务纪检',
  '跨境与境外维权': '金融保险',
  // 社会服务与政务司法
  '医疗': '医疗教育',
  '教育': '医疗教育',
  '旅游': '旅游住宿',
  '餐饮食品': '食品餐饮',
  '药品/医疗器械': '医疗教育',
  '房地产/物业': '房产物业',
  '环保': '环保城管',
  '劳动用工/社保': '劳动用工',
  '税务': '政务纪检',
  '公安警务': '政务纪检',
  '法院司法': '政务纪检',
  '纪检监察': '政务纪检',
  '公职人员监督': '政务纪检',
  '文化广电': '政务纪检',
  '民政': '政务纪检',
  '网络安全/个人信息': '网络安全',
  '政务服务(12345)': '政务纪检',
  '信访': '政务纪检',
  '安全生产应急': '政务纪检',
  '涉外贸易与海关': '政务纪检',
  '国家安全': '政务纪检',
  '城市管理': '环保城管',
  '特殊群体维权': '政务纪检',
  // 高层级诉求平台：按实际业务设置 category_user，不强制映射
  '投诉求助类': null,
  '问政建议类': null,
  '监督举报类': null
  // 四川/成都地方渠道：按实际业务设置 category_user，不强制映射
};
let userMismatch = 0;
allChannels.forEach(c => {
  const expected = L2_TO_EXPECTED_USER[c.category_l2];
  if (expected && c.category_user !== expected) {
    userMismatch++;
    if (userMismatch <= 5) {
      error('  ' + c.name + ': l2=' + c.category_l2 + ', category_user=' + c.category_user + ', 期望=' + expected);
    }
  }
});
if (userMismatch === 0) {
  console.log('  ✅ category_user 语义一致');
} else {
  error('共' + userMismatch + '条渠道 category_user 语义不一致');
}

// 8. 空字段检查
console.log('\n【8. 空字段检查】');
let emptyFields = { category_l1: 0, category_l2: 0, category_user: 0, category_user_l2: 0 };
allChannels.forEach(c => {
  Object.keys(emptyFields).forEach(field => {
    if (!c[field]) emptyFields[field]++;
  });
});
let hasEmpty = false;
Object.keys(emptyFields).forEach(field => {
  if (emptyFields[field] > 0) {
    hasEmpty = true;
    error('  ' + field + '为空: ' + emptyFields[field] + '条');
  }
});
if (!hasEmpty) {
  console.log('  ✅ 所有分类字段均不为空');
}

// 9. 各分类统计
console.log('\n【9. 各一级分类统计】');
categories.forEach(cat => {
  const count = allChannels.filter(c => c.category_l1 === cat.name).length;
  const l2Count = new Set(allChannels.filter(c => c.category_l1 === cat.name).map(c => c.category_l2)).size;
  console.log('  ' + cat.name + ': ' + count + '条渠道, ' + l2Count + '/' + cat.children.length + '个二级分类有数据');
});

// 总结
console.log('\n========== 验证总结 ==========');
console.log('错误: ' + errors.length + '个');
console.log('警告: ' + warnings.length + '个');

if (warnings.length > 0) {
  console.log('\n⚠️ 警告列表:');
  warnings.forEach(w => console.log('  - ' + w));
}

if (errors.length > 0) {
  console.log('\n❌ 错误列表:');
  errors.forEach(e => console.log('  - ' + e));
  process.exit(1);
} else {
  console.log('\n✅ 所有验证通过！数据一致性良好。');
  process.exit(0);
}
