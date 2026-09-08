const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.js');
let content = fs.readFileSync(jsPath, 'utf-8');

// 直接替换关键部分
content = content.replace(
  "data: law.name,",
  "data: copyContent,"
);

content = content.replace(
  "wx.showToast({ title: '法律名称已复制', icon: 'success' });",
  "wx.showToast({ title: '法律条款已复制', icon: 'success' });"
);

content = content.replace(
  "if (law && law.name) {\n      wx.setClipboardData({",
  "if (law) {\n      let copyContent = law.name + '\\n\\n';\n      if (law.articles && law.articles.length > 0) {\n        law.articles.forEach(function(art, index) {\n          copyContent += art.content;\n          if (index < law.articles.length - 1) { copyContent += '\\n\\n'; }\n        });\n      } else if (law.article) {\n        copyContent += law.article;\n      } else if (law.description) {\n        copyContent += law.description;\n      }\n      wx.setClipboardData({"
);

content = content.replace(
  "// 法律法规点击事件",
  "// 复制法律条款"
);

fs.writeFileSync(jsPath, content, 'utf-8');
console.log('JS文件修改完成');

// 验证
const verify = fs.readFileSync(jsPath, 'utf-8');
console.log('包含copyContent:', verify.includes('copyContent'));
console.log('包含法律条款已复制:', verify.includes('法律条款已复制'));
