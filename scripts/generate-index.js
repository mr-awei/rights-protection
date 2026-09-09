/**
 * 渠道索引自动生成脚本
 * 用法：node scripts/generate-index.js
 *
 * 基于 detail/data/channels_part_1/2/3.js 自动生成 data/channels_index.js
 * 确保索引文件与分片文件保持一致
 *
 * 同时自动维护 data/config.js 中的 data_stats（渠道/话术/法规/平台 条数），
 * 设置页直接读该字段展示，无需在运行时加载 laws.js(148KB) 等重数据。
 * 注意：分片与 laws/platforms 已下沉到 detail 分包，路径与运行时保持一致。
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'miniprogram', 'data');
const DETAIL_DATA_DIR = path.join(__dirname, '..', 'miniprogram', 'detail', 'data');

const INDEX_FILE = path.join(DATA_DIR, 'channels_index.js');
const CONFIG_FILE = path.join(DATA_DIR, 'config.js');
const SCRIPTS_FILE = path.join(DATA_DIR, 'scripts.js');
const LAWS_FILE = path.join(DETAIL_DATA_DIR, 'laws.js');
const PLATFORMS_FILE = path.join(DETAIL_DATA_DIR, 'platforms.js');
const PART_FILES = [1, 2, 3].map(i => path.join(DETAIL_DATA_DIR, 'channels_part_' + i + '.js'));

console.log('========== 生成渠道索引 ==========\n');

// 加载所有分片
const allChannels = [];
PART_FILES.forEach((file, idx) => {
  delete require.cache[require.resolve(file)];
  const data = require(file);
  data.forEach(c => {
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

// ========== 同步 data_stats 到 config.js ==========
console.log('\n========== 同步数据统计 ==========');

function countOf(file) {
  try {
    delete require.cache[require.resolve(file)];
    const d = require(file);
    return Array.isArray(d) ? d.length : 0;
  } catch (e) {
    console.log('  ⚠️ 读取失败: ' + path.basename(file) + ' -> ' + e.message);
    return 0;
  }
}

const dataStats = {
  channels: allChannels.length,
  scripts: countOf(SCRIPTS_FILE),
  laws: countOf(LAWS_FILE),
  platforms: countOf(PLATFORMS_FILE)
};
console.log('  ' + JSON.stringify(dataStats));

try {
  let cfg = fs.readFileSync(CONFIG_FILE, 'utf8');
  const block = '"data_stats": {\n' +
    Object.keys(dataStats).map(k => '    "' + k + '": ' + dataStats[k]).join(',\n') +
    '\n  }';

  if (/"data_stats"\s*:\s*\{[^}]*\}/.test(cfg)) {
    cfg = cfg.replace(/"data_stats"\s*:\s*\{[^}]*\}/, block);
  } else {
    // 首次写入：插到 data_verified_at 之后
    cfg = cfg.replace(/("data_verified_at"\s*:\s*"[^"]*",)/, '$1\n  ' + block + ',');
  }
  fs.writeFileSync(CONFIG_FILE, cfg, 'utf8');
  console.log('  ✅ config.js 的 data_stats 已更新');
} catch (e) {
  console.log('  ❌ 写入 config.js 失败: ' + e.message);
  process.exit(1);
}

console.log('\n✅ 索引生成完成！');
