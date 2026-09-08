/**
 * 批量更新法律article摘要字段
 * 使article字段与第一条条款内容一致
 */

const fs = require('fs');
const path = require('path');

const lawsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'laws.js');
let lawsContent = fs.readFileSync(lawsPath, 'utf-8');
let laws = eval(lawsContent.replace('module.exports =', ''));

console.log('开始批量更新article摘要字段...\n');

let updatedCount = 0;
for (let i = 0; i < laws.length; i++) {
  const law = laws[i];
  
  // 如果有articles，更新article为第一条条款的前100个字符
  if (law.articles && law.articles.length > 0) {
    const firstArticle = law.articles[0].content;
    // 取前100个字符，如果超过则加省略号
    const newArticle = firstArticle.length > 100 
      ? firstArticle.substring(0, 100) + '...' 
      : firstArticle;
    
    if (law.article !== newArticle) {
      console.log(`更新: ${law.id} ${law.name}`);
      console.log(`  旧: ${law.article ? law.article.substring(0, 50) + '...' : '(空)'}`);
      console.log(`  新: ${newArticle.substring(0, 50)}...`);
      laws[i].article = newArticle;
      updatedCount++;
    }
  }
}

const output = 'module.exports = ' + JSON.stringify(laws, null, 2) + ';';
fs.writeFileSync(lawsPath, output, 'utf-8');

console.log(`\n更新完成！共更新 ${updatedCount} 部法律的article摘要字段`);

// 验证语法
try {
  eval(output);
  console.log('语法验证通过！');
} catch (e) {
  console.log('语法验证失败:', e.message);
}
