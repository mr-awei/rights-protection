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
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.js');
const INDEX_FILE = path.join(DATA_DIR, 'channels_index.js');
const PART_FILES = [1, 2, 3].map(i => path.join(DATA_DIR, `channels_part_${i}.js`));

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

// 7. 空字段检查
console.log('\n【7. 空字段检查】');
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

// 8. 各分类统计
console.log('\n【8. 各一级分类统计】');
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
