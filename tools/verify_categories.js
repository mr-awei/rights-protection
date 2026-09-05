// verify_categories.js - 验证分类修正结果
const channels = require('../miniprogram/data/channels_index.js');

console.log('=== 环保城管分类下的渠道 ===');
const envChannels = channels.filter(c => c.category_user === '环保城管');
envChannels.forEach(c => {
  console.log(c.id + ' | ' + c.name + ' | tags: ' + (c.tags || []).join(', '));
});
console.log('\n共 ' + envChannels.length + ' 条');

console.log('\n=== 各分类渠道数量 ===');
const catCount = {};
channels.forEach(c => {
  const cat = c.category_user || '未分类';
  catCount[cat] = (catCount[cat] || 0) + 1;
});
Object.keys(catCount).forEach(cat => {
  console.log(cat + ': ' + catCount[cat] + ' 条');
});

console.log('\n=== 检查tags里是否还有误加的"环保" ===');
const wrongEnvTags = channels.filter(c =>
  c.category_user !== '环保城管' &&
  (c.tags || []).includes('环保')
);
console.log('非环保城管分类但tags含"环保"的渠道: ' + wrongEnvTags.length + ' 条');
wrongEnvTags.forEach(c => console.log('  ' + c.id + ' ' + c.name));

console.log('\n=== 检查category_l1是否还有"第二编" ===');
const wrongL1 = channels.filter(c =>
  c.category_l1 && c.category_l1.includes('第二编')
);
console.log('category_l1仍为"第二编"的渠道: ' + wrongL1.length + ' 条');
