// 深度清理同义词库噪声
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'miniprogram', 'data', 'config.js');
let content = fs.readFileSync(configPath, 'utf8');

// 读取当前同义词库
const config = require(configPath);
const synonyms = config.synonyms || {};

console.log('清理前同义词数量:', Object.keys(synonyms).length);

// 需要删除的噪声词（明显错误、太泛或歧义的映射）
const noiseWords = [
  // 太泛的词，搜索时不会作为投诉关键词
  '慢',           // 太慢了，不是具体投诉
  '吵',           // 太泛，有"太吵""噪音"等更具体的词
  '不管',         // 太泛，有"不作为""没人管"等更具体的词
  '拿不到',       // 不一定是丢失，可能是其他原因
  '关门',         // 关门不一定是不退款
  '办事',         // 太泛，不是投诉场景
  '办证',         // 太泛，不是投诉场景
  '审批',         // 太泛，不是投诉场景
  '举报',         // 太泛，有具体的举报渠道
  '投诉',         // 太泛，这是App的核心功能
  '复议',         // 太泛，有"行政复议"更具体
  '消费者',       // 太泛，不是投诉关键词
  '权益',         // 太泛，不是投诉关键词
  '保护',         // 太泛，不是投诉关键词
  '价格',         // 太泛，有"价格欺诈""价格举报"更具体
  '计量',         // 太泛，不是投诉关键词
  '三包',         // 太泛，不是投诉关键词
  '保修',         // 太泛，不是投诉关键词
  '污染',         // 太泛，有具体的污染类型
  '垃圾',         // 太泛，有"垃圾分类"更具体
  '排污',         // 太泛，不是投诉关键词
  '排放',         // 太泛，不是投诉关键词
  '环评',         // 太泛，不是投诉关键词
  '食品',         // 太泛，有"食品安全"更具体
  '餐饮',         // 太泛，不是投诉关键词
  '餐厅',         // 太泛，不是投诉关键词
  '饭店',         // 太泛，不是投诉关键词
  '外卖',         // 太泛，不是投诉关键词
  '保健品',       // 太泛，有"虚假保健"更具体
  '政府部门',     // 太泛，不是投诉关键词
  '市场监管',     // 部门名称，不是投诉关键词
  '工商局',       // 部门名称，不是投诉关键词
  '工商所',       // 部门名称，不是投诉关键词
  '人民银行',     // 部门名称，不是投诉关键词
  '人民网',       // 媒体名称，不是投诉关键词
  '中介',         // 太泛，有"黑中介"更具体
  '上访',         // 太泛，有"信访"更具体
  '坑人',         // 太泛，有"误导""欺诈"更具体
];

// 需要修正目标的同义词（目标不一致或错误）
const fixMapping = {
  '刷单': '诈骗',           // 刷单是诈骗，不是网购消费
  '不作为': '不作为',        // 统一为"不作为"，不是"政务服务"
  '加价': '违规收费',        // 加价是违规收费，不是交通出行
  '乱扣费': '违规收费',      // 乱扣费是违规收费，不是金融消费
  '押金不退': '不退款',      // 押金不退是不退款，不是房地产
  '克扣工资': '拖欠工资',    // 保持
  '社保': '社保',            // 统一为"社保"，不是"劳动用工"
  '公积金': '公积金',        // 统一为"公积金"，不是"劳动用工"
  '加班': '加班',            // 统一为"加班"，不是"劳动用工"
  '辞退': '辞退',            // 统一为"辞退"，不是"劳动用工"
  '工伤': '工伤',            // 统一为"工伤"，不是"劳动用工"
  '医疗纠纷': '医疗纠纷',    // 统一为"医疗纠纷"，不是"医疗健康"
  '教育纠纷': '教育纠纷',    // 统一为"教育纠纷"，不是"教育培训"
  '物业': '物业',            // 统一为"物业"，不是"房地产"
  '价格欺诈': '价格举报',    // 价格欺诈属于价格举报
  '信访': '信访',            // 统一为"信访"，不是"政务服务"
  '假药': '假冒伪劣',        // 假药属于假冒伪劣，不是食品药品
  '质监': '质检',            // 统一为"质检"
  '卷款跑路': '不退款',      // 卷款跑路是不退款，不是教育培训
  '跑路': '不退款',          // 保持
  '倒闭': '不退款',          // 保持
  '拖延': '不作为',          // 拖延属于不作为
};

// 去重并清理
const cleanedSynonyms = {};
const seenKeys = new Set();
let removedNoise = 0;
let fixedMapping = 0;
let removedDuplicate = 0;

for (const [key, value] of Object.entries(synonyms)) {
  // 跳过噪声词
  if (noiseWords.includes(key)) {
    removedNoise++;
    continue;
  }
  
  // 去重（保留第一个出现的）
  if (seenKeys.has(key)) {
    removedDuplicate++;
    continue;
  }
  
  seenKeys.add(key);
  
  // 修正目标映射
  if (fixMapping[key]) {
    cleanedSynonyms[key] = fixMapping[key];
    fixedMapping++;
  } else {
    cleanedSynonyms[key] = value;
  }
}

console.log('删除噪声词:', removedNoise);
console.log('修正目标映射:', fixedMapping);
console.log('删除重复词:', removedDuplicate);
console.log('清理后同义词数量:', Object.keys(cleanedSynonyms).length);

// 构建新的synonyms内容
let synonymsContent = '  "synonyms": {\n';
const keys = Object.keys(cleanedSynonyms);
keys.forEach((key, index) => {
  const value = cleanedSynonyms[key];
  const comma = index < keys.length - 1 ? ',' : '';
  synonymsContent += `    "${key}": "${value}"${comma}\n`;
});
synonymsContent += '  }';

// 替换原有的synonyms内容
const lines = content.split('\n');
let synonymsStart = -1;
let synonymsEnd = -1;
let braceCount = 0;
let inSynonyms = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"synonyms"')) {
    synonymsStart = i;
    inSynonyms = true;
    braceCount = 0;
  }
  if (inSynonyms) {
    for (const char of lines[i]) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    if (braceCount === 0 && synonymsStart !== -1 && i > synonymsStart) {
      synonymsEnd = i;
      break;
    }
  }
}

if (synonymsStart !== -1 && synonymsEnd !== -1) {
  const newLines = [
    ...lines.slice(0, synonymsStart),
    synonymsContent,
    ...lines.slice(synonymsEnd + 1)
  ];
  
  content = newLines.join('\n');
  fs.writeFileSync(configPath, content, 'utf8');
  console.log('\n同义词库深度清理完成！');
} else {
  console.log('未找到synonyms对象');
}
