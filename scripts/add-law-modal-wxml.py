# 修改channel-detail.wxml，添加法律详情弹窗
file_path = r'E:\rights protection\miniprogram\pages\channel-detail\channel-detail.wxml'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修改法律列表项的点击事件和描述
old_law_item = '''        <view class="law-item" wx:for="{{laws}}" wx:key="id" bindtap="onLawTap" data-law="{{item}}" hover-class="law-item-hover">
          <view class="law-icon app-icon app-icon-default icon-law"></view>
          <view class="law-info">
            <text class="law-name">{{item.name}}</text>
            <text class="law-desc">{{item.description || item.article || '点击复制法律名称'}}</text>
          </view>
          <text class="law-arrow">›</text>
        </view>'''

new_law_item = '''        <view class="law-item" wx:for="{{laws}}" wx:key="id" bindtap="openLawModal" data-law="{{item}}" hover-class="law-item-hover">
          <view class="law-icon app-icon app-icon-default icon-law"></view>
          <view class="law-info">
            <text class="law-name">{{item.name}}</text>
            <text class="law-desc">{{item.detailed_articles && item.detailed_articles.length > 0 ? '点击查看详细条款' : (item.description || item.article || '点击查看法律详情')}}</text>
          </view>
          <text class="law-arrow">›</text>
        </view>'''

if old_law_item in content:
    content = content.replace(old_law_item, new_law_item)
    print('1. 法律列表项修改成功')
else:
    print('1. 未找到法律列表项')

# 2. 在页面底部添加法律详情弹窗（在</view>之前，即页面根容器结束之前）
# 找到页面的最后一个</view>，在它之前添加弹窗
law_modal = '''
    <!-- 法律详情弹窗 -->
    <view class="law-modal-mask" wx:if="{{showLawModal}}" bindtap="closeLawModal">
      <view class="law-modal-content" catchtap="preventModalBubble">
        <view class="law-modal-header">
          <text class="law-modal-title">{{currentLaw.name}}</text>
          <view class="law-modal-close" bindtap="closeLawModal">
            <text class="app-icon app-icon-default icon-close"></text>
          </view>
        </view>
        <scroll-view class="law-modal-body" scroll-y>
          <block wx:if="{{currentLaw.detailed_articles && currentLaw.detailed_articles.length > 0}}">
            <view class="law-article-item" wx:for="{{currentLaw.detailed_articles}}" wx:key="index">
              <text class="law-article-text">{{item}}</text>
            </view>
          </block>
          <block wx:else>
            <view class="law-article-item">
              <text class="law-article-text">{{currentLaw.article || currentLaw.description || '该法律详细条款待补充'}}</text>
            </view>
          </block>
        </scroll-view>
        <view class="law-modal-footer">
          <button class="law-modal-btn" bindtap="onLawTap" data-law="{{currentLaw}}">复制法律名称</button>
        </view>
      </view>
    </view>
'''

# 在</view>之前添加弹窗（找到最后一个</view>）
last_view_idx = content.rfind('</view>')
if last_view_idx >= 0:
    content = content[:last_view_idx] + law_modal + content[last_view_idx:]
    print('2. 法律详情弹窗添加成功')
else:
    print('2. 未找到页面结束标签')

# 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('修改完成！')
