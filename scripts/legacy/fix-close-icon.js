const fs = require('fs');
const path = require('path');

// 1. 修改WXML：把文字关闭按钮改回icon
const wxmlPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.wxml');
let wxmlContent = fs.readFileSync(wxmlPath, 'utf-8');

wxmlContent = wxmlContent.replace(
  '<text class="law-modal-close-text">关闭</text>',
  '<view class="app-icon app-icon-default icon-close" style="width:32rpx;height:32rpx;--icon-bg:transparent;--icon-color:#999;"></view>'
);

fs.writeFileSync(wxmlPath, wxmlContent, 'utf-8');
console.log('✅ WXML关闭按钮改回icon');

// 2. 修改WXSS：恢复关闭按钮容器样式，移除文字按钮样式
const wxssPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.wxss');
let wxssContent = fs.readFileSync(wxssPath, 'utf-8');

// 替换关闭按钮容器样式
wxssContent = wxssContent.replace(/\.law-modal-close\s*\{[^}]+\}/, `.law-modal-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}`);

// 移除文字按钮样式（如果存在）
wxssContent = wxssContent.replace(/\.law-modal-close-text\s*\{[^}]+\}\s*/g, '');
wxssContent = wxssContent.replace(/\.law-modal-close-text:active\s*\{[^}]+\}\s*/g, '');

fs.writeFileSync(wxssPath, wxssContent, 'utf-8');
console.log('✅ WXSS恢复关闭按钮容器样式，移除文字按钮样式');

// 验证
const verifyWxml = fs.readFileSync(wxmlPath, 'utf-8');
const verifyWxss = fs.readFileSync(wxssPath, 'utf-8');
console.log('WXML包含app-icon icon-close:', verifyWxml.includes('app-icon app-icon-default icon-close'));
console.log('WXML不包含law-modal-close-text:', !verifyWxml.includes('law-modal-close-text'));
console.log('WXSS不包含law-modal-close-text:', !verifyWxss.includes('law-modal-close-text'));
