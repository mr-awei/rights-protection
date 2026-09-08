const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.js');
let content = fs.readFileSync(jsPath, 'utf-8');

// 找到formatLawArticles方法的开始和结束位置
const startMarker = '  // 格式化法律条款内容，添加合理换行';
const endMarker = '  // 关闭法律详情弹窗';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log('❌ 未找到方法边界');
  console.log('startIdx:', startIdx, 'endIdx:', endIdx);
  process.exit(1);
}

// 新的formatLawArticles方法
const newMethod = `  // 格式化法律条款内容，添加合理换行
  formatLawArticles(law) {
    if (!law.articles || law.articles.length === 0) {
      return law;
    }
    const formattedArticles = law.articles.map(article => {
      let text = article.content;
      // 1. 条款编号后换行
      text = text.replace(/^(第[一二三四五六七八九十百零千]+条)/, '$1' + String.fromCharCode(10));
      // 2. 中文数字分项前换行
      text = text.replace(/（[一二三四五六七八九十]+）/g, function(match, offset) {
        return offset > 0 ? String.fromCharCode(10) + match : match;
      });
      // 3. 阿拉伯数字分项前换行
      text = text.replace(/（\\d+）/g, function(match, offset) {
        return offset > 0 ? String.fromCharCode(10) + match : match;
      });
      // 4. 去除多余连续换行
      text = text.replace(/\\n{3,}/g, String.fromCharCode(10) + String.fromCharCode(10));
      // 5. 去除首尾空格
      text = text.trim();
      return {
        id: article.id,
        content: text
      };
    });
    return {
      id: law.id,
      name: law.name,
      article: law.article,
      description: law.description,
      articles: formattedArticles
    };
  },

`;

// 替换
content = content.substring(0, startIdx) + newMethod + content.substring(endIdx);

fs.writeFileSync(jsPath, content, 'utf-8');
console.log('✅ formatLawArticles方法已重写');

// 验证语法
try {
  require('child_process').execSync('node --check "' + jsPath + '"', {stdio: 'pipe'});
  console.log('✅ 语法验证通过');
} catch (e) {
  console.log('❌ 语法错误:', e.stdout.toString());
}
