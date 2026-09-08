const fs = require('fs');
const path = require('path');

// 修改WXML：调大icon尺寸，加深颜色
const wxmlPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.wxml');
let wxmlContent = fs.readFileSync(wxmlPath, 'utf-8');

wxmlContent = wxmlContent.replace(
  '<view class="app-icon app-icon-default icon-close" style="width:32rpx;height:32rpx;--icon-bg:transparent;--icon-color:#999;"></view>',
  '<view class="app-icon app-icon-default icon-close law-modal-close-icon"></view>'
);

fs.writeFileSync(wxmlPath, wxmlContent, 'utf-8');
console.log('✅ WXML关闭按钮icon样式调整');

// 修改WXSS：添加关闭按钮样式，调大并更显眼
const wxssPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.wxss');
let wxssContent = fs.readFileSync(wxssPath, 'utf-8');

// 替换关闭按钮容器样式
wxssContent = wxssContent.replace(/\.law-modal-close\s*\{[^}]+\}/, `.law-modal-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: #f5f5f5;
  transition: all 0.2s ease;
}

.law-modal-close:active {
  background: #e0e0e0;
  transform: scale(0.92);
}

.law-modal-close-icon {
  width: 36rpx;
  height: 36rpx;
  --icon-bg: transparent;
  --icon-color: #666;
}`);

fs.writeFileSync(wxssPath, wxssContent, 'utf-8');
console.log('✅ WXSS关闭按钮样式调整：调大icon+圆形浅灰背景+点击反馈');

// 验证
const verify = fs.readFileSync(wxssPath, 'utf-8');
console.log('包含law-modal-close-icon:', verify.includes('law-modal-close-icon'));
console.log('包含border-radius: 50%:', verify.includes('border-radius: 50%'));
console.log('包含width: 36rpx:', verify.includes('width: 36rpx'));
