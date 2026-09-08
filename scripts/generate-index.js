/**
 * 渠道索引自动生成脚本
 * 用法：node scripts/generate-index.js
 * 
 * 基于channels_part_1/2/3.js自动生成channels_index.js
 * 确保索引文件与分片文件保持一致
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'miniprogram', 'data');
const INDEX_FILE = path.join(DATA_DIR, 'channels_index.js');
const PART_FILES = [1, 2, 3].map(i => path.join(DATA_DIR, `channels_part_${i}.js`));

console.log('========== 生成渠道索引 ==========\n');

// 加载所有分片
const allChannels = [];
PART_FILES.forEach((file, idx) => {
  delete require.cache[require.resolve(file)];
  const data = require(file);
  data.forEach((c, i) => {
    c.part_num = idx + 1;
    allChannels.push(c);
  });
  console.log('  分片' + (idx + 1) + ': ' + data.length + '条');
});

console.log('\n  总计: ' + allChannels.length + '条渠道');

// 生成轻量索引（只保留搜索和列表需要的字段）
const indexData = allChannels.map(c => ({
  id: c.id,
  name: c.name,
  phone: c.phone || '',
  tags: c.tags || [],
  category_l1: c.category_l1 || '',
  category_l2: c.category_l2 || '',
  category_user: c.category_user || '',
  category_user_l2: c.category_user_l2 || '',
  issue_types: c.issue_types || [],
  related_script_id: c.related_script_id || '',
  channel_type: c.channel_type || 'official',
  hot_level: c.hot_level || 0,
  part_num: c.part_num
}));

// 写入索引文件
fs.writeFileSync(INDEX_FILE, 'module.exports = ' + JSON.stringify(indexData, null, 2) + ';', 'utf8');

const stats = fs.statSync(INDEX_FILE);
console.log('\n✅ channels_index.js 已生成');
console.log('  文件路径: ' + INDEX_FILE);
console.log('  索引条数: ' + indexData.length);
console.log('  文件大小: ' + (stats.size / 1024).toFixed(2) + ' KB');

// 验证
console.log('\n========== 验证索引 ==========');
delete require.cache[require.resolve(INDEX_FILE)];
const generatedIndex = require(INDEX_FILE);
const indexIds = new Set(generatedIndex.map(c => c.id));
const partIds = new Set(allChannels.map(c => c.id));

if (indexIds.size === partIds.size && [...indexIds].every(id => partIds.has(id))) {
  console.log('  ✅ ID完全一致');
} else {
  console.log('  ❌ ID不一致!');
  process.exit(1);
}

// 检查关键字段
const requiredFields = ['id', 'name', 'category_l1', 'category_l2', 'category_user_l2', 'issue_types'];
let missingCount = 0;
generatedIndex.forEach(c => {
  requiredFields.forEach(field => {
    if (c[field] === undefined || c[field] === null) {
      missingCount++;
      console.log('  ❌ 缺少字段: ' + c.name + '.' + field);
    }
  });
});

if (missingCount === 0) {
  console.log('  ✅ 所有必需字段完整');
} else {
  console.log('  ❌ 共缺少' + missingCount + '个字段');
  process.exit(1);
}

console.log('\n✅ 索引生成完成！');
