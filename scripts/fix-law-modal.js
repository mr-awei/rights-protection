/**
 * 修复法律弹窗：
 * 1. onLawTap方法改为复制完整法律条款
 * 2. WXML按钮文字改为"复制法律条款"
 * 3. 关闭按钮用文字"关闭"代替图标，确保可见
 */

const fs = require('fs');
const path = require('path');

// 1. 修改JS文件
const jsPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.js');
let jsContent = fs.readFileSync(jsPath, 'utf-8');

const oldJs = `  // 法律法规点击事件
  onLawTap(e) {
    const law = e.currentTarget.dataset.law;
    if (law && law.name) {
      wx.setClipboardData({
        data: law.name,
        success: () => {
          wx.showToast({ title: '法律名称已复制', icon: 'success' });
        }
      });
    }
  },`;

const newJs = `  // 复制法律条款
  onLawTap(e) {
    const law = e.currentTarget.dataset.law;
    if (law) {
      let copyContent = law.name + '\\n\\n';
      if (law.articles && law.articles.length > 0) {
        law.articles.forEach((art, index) => {
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
        success: () => {
          wx.showToast({ title: '法律条款已复制', icon: 'success' });
        }
      });
    }
  },`;

if (jsContent.includes(oldJs)) {
  jsContent = jsContent.replace(oldJs, newJs);
  fs.writeFileSync(jsPath, jsContent, 'utf-8');
  console.log('✅ JS文件修改成功：onLawTap改为复制完整法律条款');
} else {
  console.log('⚠️ JS文件未找到匹配的代码段，可能已经修改过');
}

// 2. 修改WXML文件
const wxmlPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.wxml');
let wxmlContent = fs.readFileSync(wxmlPath, 'utf-8');

// 修改按钮文字
wxmlContent = wxmlContent.replace(
  '<button class="law-modal-btn" bindtap="onLawTap" data-law="{{currentLaw}}">复制法律名称</button>',
  '<button class="law-modal-btn" bindtap="onLawTap" data-law="{{currentLaw}}">复制法律条款</button>'
);
console.log('✅ WXML按钮文字改为"复制法律条款"');

// 修改关闭按钮：用文字"关闭"代替图标，确保可见
wxmlContent = wxmlContent.replace(
  `<view class="law-modal-close" bindtap="closeLawModal">
            <text class="app-icon app-icon-default icon-close"></text>
          </view>`,
  `<view class="law-modal-close" bindtap="closeLawModal">
            <text class="law-modal-close-text">关闭</text>
          </view>`
);
console.log('✅ 关闭按钮改为文字"关闭"，确保可见');

fs.writeFileSync(wxmlPath, wxmlContent, 'utf-8');

// 3. 修改WXSS文件：添加关闭按钮文字样式
const wxssPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.wxss');
let wxssContent = fs.readFileSync(wxssPath, 'utf-8');

// 添加关闭按钮文字样式（如果不存在）
if (!wxssContent.includes('.law-modal-close-text')) {
  wxssContent = wxssContent.replace(
    '.law-modal-close .icon-close {',
    `.law-modal-close-text {
  font-size: 28rpx;
  color: #999;
  padding: 8rpx 16rpx;
}

.law-modal-close .icon-close {`
  );
  console.log('✅ WXSS添加关闭按钮文字样式');
}

fs.writeFileSync(wxssPath, wxssContent, 'utf-8');

console.log('\n🎉 法律弹窗修复完成！');
