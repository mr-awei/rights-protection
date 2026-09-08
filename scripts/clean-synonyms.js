// 合理清理同义词库：只删除真正的噪声和重复映射
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'miniprogram', 'data', 'config.js');
let content = fs.readFileSync(configPath, 'utf8');

// 读取当前同义词库
const config = require(configPath);
const synonyms = config.synonyms || {};

console.log('清理前同义词数量:', Object.keys(synonyms).length);

// 真正的噪声词（明显错误或歧义的映射）
const noiseWords = [
  '工资条',        // 工资条不一定是拖欠工资，明显错误
  '公积金提取',    // 公积金提取不一定是投诉场景
  '公积金贷款',    // 公积金贷款不一定是投诉场景
  '医闹',          // 医闹是患者闹事，不是医疗纠纷
  '租金',          // 租金不一定是投诉，太泛
];

// 去重并清理
const cleanedSynonyms = {};
const seenKeys = new Set();
let removedNoise = 0;
let removedDuplicate = 0;

for (const [key, value] of Object.entries(synonyms)) {
  // 跳过噪声词
  if (noiseWords.includes(key)) {
    removedNoise++;
    continue;
  }
  
  // 去重（保留第一个出现的，因为第一个通常是更准确的映射）
  if (seenKeys.has(key)) {
    removedDuplicate++;
    continue;
  }
  
  seenKeys.add(key);
  cleanedSynonyms[key] = value;
}

console.log('删除噪声词:', removedNoise);
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
  console.log('\n同义词库清理完成！');
} else {
  console.log('未找到synonyms对象');
}
