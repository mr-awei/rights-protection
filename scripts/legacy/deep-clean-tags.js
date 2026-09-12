// 深度清理渠道tags噪声
const fs = require('fs');
const path = require('path');

// 需要删除的噪声词（太泛、截断、地址相关或与渠道不相关）
const noiseTags = [
  // 太泛的通用词
  '12345', '不作为', '行为', '注意', '通用', '查询', '时间受理',
  // 截断的不完整词（常见模式）
  '举控告', '接拨打', '国公安部', '公安部举报中', '受理对公安机', '关及民警违纪', '违法问题的检', '咨询等非违纪', '违法问题请直',
  '委员会', '中央纪委国家', '监委举报网站', '党员违反党纪', '行为的检举控', '对监察对象', '六类公职人员', '不依法履职', '违反秉公用权', '廉洁从政从业', '职务犯罪行为', '对党风廉政建', '设和反腐败工', '作的意见建议',
  '自动语音提供', '小时案件信息', '最高人民法院',
  '举报属实可获', '矿山重大隐患', '举报最高奖励', '国应急管理部',
  '资助勾结敌对',
  '管理总局四川', '四川省内银行', '保险机构消费', '者投诉的属地', '受理与督办', '成都市天府大', '号天府国际金', '成都地方渠道',
  '四川省卫生健', '四川省内医疗',
  '康委员会',
  // 地址相关词
  '地址', '道北段', '融中心', '号楼', '966',
  // 其他噪声
  '万元', '势力',
];

// 处理渠道分片文件
const files = [
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_1.js'),
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_2.js'),
  path.join(__dirname, '..', 'miniprogram', 'data', 'channels_part_3.js'),
];

let totalRemoved = 0;

files.forEach((filePath, fileIndex) => {
  const channels = require(filePath);
  let removed = 0;

  channels.forEach(channel => {
    if (!channel.tags || !Array.isArray(channel.tags)) return;
    
    const originalLength = channel.tags.length;
    
    // 过滤噪声词
    channel.tags = channel.tags.filter(tag => {
      // 删除明确的噪声词
      if (noiseTags.includes(tag)) return false;
      
      // 删除截断的不完整词（长度>5且以"的""了""和""与""及""等"结尾，或者包含不完整短语）
      if (tag.length > 5 && (tag.endsWith('的') || tag.endsWith('了') || tag.endsWith('和') || tag.endsWith('与') || tag.endsWith('及'))) {
        return false;
      }
      
      // 删除明显是从地址中提取的词（包含"路""街""号""楼""层""室"且长度>4）
      if ((tag.includes('路') || tag.includes('街') || tag.includes('号楼') || tag.includes('层') || tag.includes('室')) && tag.length > 4 && !tag.includes('热线') && !tag.includes('举报') && !tag.includes('投诉')) {
        return false;
      }
      
      return true;
    });
    
    removed += originalLength - channel.tags.length;
  });

  // 写回文件
  const content = 'module.exports = ' + JSON.stringify(channels, null, 2) + ';\n';
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`文件${fileIndex + 1}删除了${removed}个噪声tags`);
  totalRemoved += removed;
});

console.log(`\n总计删除了${totalRemoved}个噪声tags`);
