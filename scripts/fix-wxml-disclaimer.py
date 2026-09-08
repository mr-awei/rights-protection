# 修改wxml，修复law-desc判断逻辑并添加免责声明
file_path = r'E:\rights protection\miniprogram\pages\channel-detail\channel-detail.wxml'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修复law-desc中的判断逻辑（detailed_articles -> articles）
old_desc = '''<text class="law-desc">{{item.detailed_articles && item.detailed_articles.length > 0 ? '点击查看详细条款' : (item.description || item.article || '点击查看法律详情')}}</text>'''
new_desc = '''<text class="law-desc">{{item.articles && item.articles.length > 0 ? '点击查看详细条款' : (item.description || item.article || '点击查看法律详情')}}</text>'''

if old_desc in content:
    content = content.replace(old_desc, new_desc)
    print('1. law-desc判断逻辑修复成功')
else:
    print('1. 未找到law-desc')
    # 搜索detailed_articles
    idx = content.find('detailed_articles')
    if idx >= 0:
        print('找到detailed_articles at', idx)
        print(content[idx-50:idx+200])

# 2. 在法律依据部分添加免责声明（在</view>结束标签之前，即law-list之后）
old_law_section_end = '''      </view>
    </view>

    <!-- 关联话术 -->'''

new_law_section_end = '''      </view>
      <view class="law-disclaimer">
        <text class="law-disclaimer-text">⚠️ 以上法律条款仅供参考，具体以官方发布的法律法规为准。如有疑问，请咨询专业律师。</text>
      </view>
    </view>

    <!-- 关联话术 -->'''

if old_law_section_end in content:
    content = content.replace(old_law_section_end, new_law_section_end)
    print('2. 免责声明添加成功')
else:
    print('2. 未找到法律依据部分结束位置')
    # 搜索关联话术
    idx = content.find('关联话术')
    if idx >= 0:
        print('找到关联话术 at', idx)
        print(content[idx-200:idx+50])

# 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('修改完成！')
