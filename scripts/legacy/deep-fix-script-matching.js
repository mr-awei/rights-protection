// 深度修复渠道关联话术匹配错误
const fs = require('fs');
const path = require('path');

// 需要清空关联话术的渠道ID（匹配不准确，应该用通用话术兜底）
const clearScriptIds = [
  // 12345专项诉求（匹配到物业不准确，用通用话术）
  'ch_005', // 12345供水诉求 → 错误匹配到物业
  'ch_007', // 12345燃气诉求 → 错误匹配到物业
  'ch_009', // 12345供热诉求 → 错误匹配到物业
  
  // 公交/地铁（匹配到网约车不准确）
  'ch_016', // 成都公交 → 错误匹配到网约车
  'ch_017', // 成都地铁 → 错误匹配到网约车
  
  // 互联网金融/证券（匹配到银行保险或商家不退款不准确）
  'ch_020', // 互联网金融举报 → 错误匹配到商家不退款
  'ch_021', // 证监会服务平台 → 错误匹配到银行保险
  'ch_022', // 投服中心 → 错误匹配到银行保险
  'ch_023', // 证券交易所 → 错误匹配到银行保险
  
  // 知识产权/公平竞争/反垄断（匹配到商家不退款不准确）
  'ch_029', // 知识产权维权 → 错误匹配到商家不退款
  'ch_033', // 公平竞争审查 → 错误匹配到商家不退款
  'ch_108', // 反垄断举报 → 错误匹配到商家不退款
  
  // 跨境/境外维权（匹配到银行保险或商家不退款不准确）
  'ch_041', // 香港交易所 → 错误匹配到银行保险
  'ch_042', // 香港证监会 → 错误匹配到银行保险
  'ch_045', // 美国SEC → 错误匹配到银行保险
  'ch_046', // 美国FTC → 错误匹配到商家不退款
  
  // 食品安全内部举报（匹配到商家不退款不准确）
  'ch_054', // 食品安全内部知情人举报 → 错误匹配到商家不退款
  
  // 生态环境信访（匹配到噪音扰民不准确）
  'ch_060', // 生态环境信访 → 错误匹配到噪音扰民
  
  // 四川金融监管局（匹配到商家不退款不准确）
  'ch_103', // 四川金融监管局 → 错误匹配到商家不退款
  
  // 公积金热线（匹配到拖欠工资不准确）
  'ch_112', // 12329公积金热线 → 错误匹配到拖欠工资
];

// 处理渠道分片文件
const files = [
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_1.js'),
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_2.js'),
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_3.js'),
];

let totalCleared = 0;

files.forEach((filePath, fileIndex) => {
  const channels = require(filePath);
  let cleared = 0;

  channels.forEach(channel => {
    if (clearScriptIds.includes(channel.id)) {
      channel.related_script_id = '';
      cleared++;
      totalCleared++;
    }
  });

  // 写回文件
  const content = 'module.exports = ' + JSON.stringify(channels, null, 2) + ';\n';
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`文件${fileIndex + 1}清空了${cleared}个渠道的错误关联话术`);
});

console.log(`\n总计清空了${totalCleared}个渠道的错误关联话术`);
console.log('这些渠道将使用通用话术兜底');
