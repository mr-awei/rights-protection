const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.js');
let jsContent = fs.readFileSync(jsPath, 'utf-8');

// 用正则匹配openLawModal方法
const regex = /(\/\/ 打开法律详情弹窗\s+openLawModal\(e\)\s*\{[\s\S]*?\n  \},)/;

const newMethod = `// 打开法律详情弹窗
  openLawModal(e) {
    const law = e.currentTarget.dataset.law;
    if (law) {
      // 格式化条款内容，添加合理换行
      const formattedLaw = this.formatLawArticles(law);
      this.setData({
        currentLaw: formattedLaw,
        showLawModal: true
      });
    }
  },

  // 格式化法律条款内容，添加合理换行
  formatLawArticles(law) {
    if (!law.articles || law.articles.length === 0) {
      return law;
    }
    const formattedArticles = law.articles.map(article => {
      let content = article.content;
      // 1. 条款编号后换行（"第四十条"后面）
      content = content.replace(/^(第[一二三四五六七八九十百零千]+条)\s*/, '$1\\n');
      // 2. 中文数字分项前换行（"（一）"、"（二）"等）
      content = content.replace(/(?<!^)（[一二三四五六七八九十]+）/g, '\\n$&');
      // 3. 阿拉伯数字分项前换行（"（1）"、"（2）"等）
      content = content.replace(/(?<!^)（\\d+）/g, '\\n$&');
      // 4. 去除多余的连续换行（最多保留2个）
      content = content.replace(/\\n{3,}/g, '\\n\\n');
      // 5. 去除首尾空格
      content = content.trim();
      return {
        ...article,
        content: content
      };
    });
    return {
      ...law,
      articles: formattedArticles
    };
  },`;

if (regex.test(jsContent)) {
  jsContent = jsContent.replace(regex, newMethod);
  fs.writeFileSync(jsPath, jsContent, 'utf-8');
  console.log('✅ JS：添加条款格式化逻辑成功');
} else {
  console.log('❌ JS：正则未匹配到openLawModal方法');
}

// 验证
const verify = fs.readFileSync(jsPath, 'utf-8');
console.log('包含formatLawArticles:', verify.includes('formatLawArticles'));
console.log('包含中文数字分项换行:', verify.includes('（[一二三四五六七八九十]+）'));
