const fs = require('fs');
const path = require('path');

// 1. 修改JS：在openLawModal中添加条款格式化逻辑
const jsPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.js');
let jsContent = fs.readFileSync(jsPath, 'utf-8');

const oldOpenLaw = `  // 打开法律详情弹窗
  openLawModal(e) {
    const law = e.currentTarget.dataset.law;
    if (law) {
      this.setData({
        currentLaw: law,
        showLawModal: true
      });
    }
  },`;

const newOpenLaw = `  // 打开法律详情弹窗
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
      // 4. 句号后如果后面跟着"第X条"或"（一）"，不额外处理（已经有换行了）
      // 5. 去除多余的连续换行（最多保留2个）
      content = content.replace(/\\n{3,}/g, '\\n\\n');
      // 6. 去除首尾空格
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

if (jsContent.includes(oldOpenLaw)) {
  jsContent = jsContent.replace(oldOpenLaw, newOpenLaw);
  fs.writeFileSync(jsPath, jsContent, 'utf-8');
  console.log('✅ JS：添加条款格式化逻辑');
} else {
  console.log('⚠️ JS：未找到匹配的openLawModal方法');
}

// 2. 修改WXML：给条款文本添加white-space: pre-wrap样式类
const wxmlPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.wxml');
let wxmlContent = fs.readFileSync(wxmlPath, 'utf-8');

wxmlContent = wxmlContent.replace(
  '<text class="law-article-text">{{item.content}}</text>',
  '<text class="law-article-text law-article-content">{{item.content}}</text>'
);

fs.writeFileSync(wxmlPath, wxmlContent, 'utf-8');
console.log('✅ WXML：给条款文本添加内容样式类');

// 3. 修改WXSS：添加条款内容样式（保留换行、增加行高、条款间距）
const wxssPath = path.join(__dirname, '..', 'miniprogram', 'pages', 'channel-detail', 'channel-detail.wxss');
let wxssContent = fs.readFileSync(wxssPath, 'utf-8');

// 替换law-article-item样式，增加间距
wxssContent = wxssContent.replace(/\.law-article-item\s*\{[^}]+\}/, `.law-article-item {
  margin-bottom: 28rpx;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border-left: 6rpx solid #4a90d9;
}`);

// 替换law-article-text样式，添加white-space和行高
wxssContent = wxssContent.replace(/\.law-article-text\s*\{[^}]+\}/, `.law-article-text {
  font-size: 26rpx;
  color: #333;
  line-height: 2;
  white-space: pre-wrap;
  word-break: break-all;
}`);

fs.writeFileSync(wxssPath, wxssContent, 'utf-8');
console.log('✅ WXSS：添加条款内容样式（保留换行、行高2、条款间距28rpx）');

// 验证
const verifyJs = fs.readFileSync(jsPath, 'utf-8');
const verifyWxml = fs.readFileSync(wxmlPath, 'utf-8');
const verifyWxss = fs.readFileSync(wxssPath, 'utf-8');
console.log('\\n验证结果：');
console.log('JS包含formatLawArticles:', verifyJs.includes('formatLawArticles'));
console.log('JS包含中文数字分项换行:', verifyJs.includes('（[一二三四五六七八九十]+）'));
console.log('WXML包含law-article-content:', verifyWxml.includes('law-article-content'));
console.log('WXSS包含white-space: pre-wrap:', verifyWxss.includes('white-space: pre-wrap'));
console.log('WXSS包含line-height: 2:', verifyWxss.includes('line-height: 2'));
