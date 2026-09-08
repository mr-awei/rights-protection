const fs = require('fs');
const path = require('path');

const wxmlPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.wxml');
let content = fs.readFileSync(wxmlPath, 'utf-8');

// 替换关闭按钮的图标为文字
content = content.replace(
  '<text class="app-icon app-icon-default icon-close"></text>',
  '<text class="law-modal-close-text">关闭</text>'
);

fs.writeFileSync(wxmlPath, content, 'utf-8');
console.log('✅ 关闭按钮已改为文字"关闭"');

// 验证
const verify = fs.readFileSync(wxmlPath, 'utf-8');
console.log('包含law-modal-close-text:', verify.includes('law-modal-close-text'));
