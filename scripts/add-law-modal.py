# 修改channel-detail.js，添加法律详情弹窗功能
import re

file_path = r'E:\rights protection\miniprogram\pages\channel-detail\channel-detail.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在data中添加showLawModal和currentLaw字段
old_data = '''  data: {
    channel: null,
    laws: [],
    relatedScripts: [],
    statusInfo: null,'''

new_data = '''  data: {
    channel: null,
    laws: [],
    relatedScripts: [],
    statusInfo: null,
    showLawModal: false,
    currentLaw: null,'''

if old_data in content:
    content = content.replace(old_data, new_data)
    print('1. data字段添加成功')
else:
    print('1. 未找到data字段')

# 2. 修改匹配法律时返回detailed_articles字段
old_match = '''          if (matchedLaw) {
            matchedLaws.push({
              id: matchedLaw.id,
              name: matchedLaw.name || matchedLaw.title,
              article: matchedLaw.article || matchedLaw.description || '',
              description: matchedLaw.description || matchedLaw.article || '',
              isChannelBuiltin: true
            });'''

new_match = '''          if (matchedLaw) {
            matchedLaws.push({
              id: matchedLaw.id,
              name: matchedLaw.name || matchedLaw.title,
              article: matchedLaw.article || matchedLaw.description || '',
              description: matchedLaw.description || matchedLaw.article || '',
              detailed_articles: matchedLaw.detailed_articles || [],
              isChannelBuiltin: true
            });'''

if old_match in content:
    content = content.replace(old_match, new_match)
    print('2. detailed_articles字段添加成功')
else:
    print('2. 未找到匹配法律的代码')

# 3. 添加法律详情弹窗的打开和关闭方法（在onLawTap方法之前）
old_law_tap = '''  // 法律法规点击事件
  onLawTap(e) {'''

new_law_tap = '''  // 打开法律详情弹窗
  openLawModal(e) {
    const law = e.currentTarget.dataset.law;
    if (law) {
      this.setData({
        currentLaw: law,
        showLawModal: true
      });
    }
  },

  // 关闭法律详情弹窗
  closeLawModal() {
    this.setData({
      showLawModal: false,
      currentLaw: null
    });
  },

  // 阻止弹窗内容区域的点击事件冒泡
  preventModalBubble() {
    // 空方法，用于阻止冒泡
  },

  // 法律法规点击事件
  onLawTap(e) {'''

if old_law_tap in content:
    content = content.replace(old_law_tap, new_law_tap)
    print('3. 法律详情弹窗方法添加成功')
else:
    print('3. 未找到onLawTap方法')

# 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('修改完成！')
