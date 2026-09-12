const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.js');
let content = fs.readFileSync(jsPath, 'utf-8');

// 用正则表达式匹配整个onLawTap方法并替换
const oldMethodRegex = /\/\/ 复制法律条款\s+onLawTap\(e\)\s*\{[\s\S]*?\n  \},/;

const newMethod = `// 复制法律条款
  onLawTap(e) {
    const law = e.currentTarget.dataset.law;
    if (law) {
      let copyContent = law.name + '\\n\\n';
      if (law.articles && law.articles.length > 0) {
        law.articles.forEach(function(art, index) {
          copyContent += art.content;
          if (index < law.articles.length - 1) {
            copyContent += '\\n\\n';
          }
        });
      } else if (law.article) {
        copyContent += law.article;
      } else if (law.description) {
        copyContent += law.description;
      }
      wx.setClipboardData({
        data: copyContent,
        success: function() {
          wx.showToast({ title: '法律条款已复制', icon: 'success' });
        }
      });
    }
  },`;

if (oldMethodRegex.test(content)) {
  content = content.replace(oldMethodRegex, newMethod);
  fs.writeFileSync(jsPath, content, 'utf-8');
  console.log('✅ onLawTap方法已完整修复');
} else {
  console.log('❌ 未找到匹配的方法');
}

// 验证
const verify = fs.readFileSync(jsPath, 'utf-8');
console.log('包含let copyContent:', verify.includes('let copyContent'));
console.log('包含law.articles.forEach:', verify.includes('law.articles.forEach'));
console.log('包含法律条款已复制:', verify.includes('法律条款已复制'));
