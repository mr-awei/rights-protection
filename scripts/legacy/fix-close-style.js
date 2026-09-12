const fs = require('fs');
const path = require('path');

const wxssPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.wxss');
let content = fs.readFileSync(wxssPath, 'utf-8');

const oldStyle = `.law-modal-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.law-modal-close-text {
  font-size: 28rpx;
  color: #999;
  padding: 8rpx 16rpx;
}`;

const newStyle = `.law-modal-close {
  min-width: 80rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0 8rpx;
}

.law-modal-close-text {
  font-size: 26rpx;
  color: #999;
  white-space: nowrap;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
}

.law-modal-close-text:active {
  background: #e8e8e8;
  color: #666;
}`;

if (content.includes(oldStyle)) {
  content = content.replace(oldStyle, newStyle);
  fs.writeFileSync(wxssPath, content, 'utf-8');
  console.log('✅ 关闭按钮样式已修复');
} else {
  console.log('⚠️ 未找到匹配的样式，尝试用正则替换');
  // 用正则替换
  content = content.replace(/\.law-modal-close\s*\{[^}]+\}/, `.law-modal-close {
  min-width: 80rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0 8rpx;
}`);
  content = content.replace(/\.law-modal-close-text\s*\{[^}]+\}/, `.law-modal-close-text {
  font-size: 26rpx;
  color: #999;
  white-space: nowrap;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
}

.law-modal-close-text:active {
  background: #e8e8e8;
  color: #666;
}`);
  fs.writeFileSync(wxssPath, content, 'utf-8');
  console.log('✅ 用正则替换完成');
}

// 验证
const verify = fs.readFileSync(wxssPath, 'utf-8');
console.log('包含min-width: 80rpx:', verify.includes('min-width: 80rpx'));
console.log('包含white-space: nowrap:', verify.includes('white-space: nowrap'));
console.log('包含background: #f5f5f5:', verify.includes('background: #f5f5f5'));
