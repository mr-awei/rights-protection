# 修改wxml中的法律详情弹窗，使用articles字段
file_path = r'E:\rights protection\miniprogram\pages\channel-detail\channel-detail.wxml'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 修改法律详情弹窗中的条款展示，使用articles字段
old_text = '''          <block wx:if="{{currentLaw.detailed_articles && currentLaw.detailed_articles.length > 0}}">
            <view class="law-article-item" wx:for="{{currentLaw.detailed_articles}}" wx:key="index">
              <text class="law-article-text">{{item}}</text>
            </view>
          </block>'''

new_text = '''          <block wx:if="{{currentLaw.articles && currentLaw.articles.length > 0}}">
            <view class="law-article-item" wx:for="{{currentLaw.articles}}" wx:key="id">
              <text class="law-article-text">{{item.content}}</text>
            </view>
          </block>'''

if old_text in content:
    content = content.replace(old_text, new_text)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('wxml修改成功！')
else:
    print('未找到要替换的内容')
    # 搜索detailed_articles
    idx = content.find('detailed_articles')
    if idx >= 0:
        print('找到detailed_articles at', idx)
        print(content[idx-100:idx+300])
