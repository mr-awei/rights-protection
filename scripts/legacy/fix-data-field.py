# 修改channel-detail.js的data字段
file_path = r'E:\rights protection\miniprogram\pages\channel-detail\channel-detail.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_data = '''    statusInfo: null,
    loading: true  // 加载状态
  },'''

new_data = '''    statusInfo: null,
    loading: true,  // 加载状态
    showLawModal: false,
    currentLaw: null
  },'''

if old_data in content:
    content = content.replace(old_data, new_data)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('data字段修改成功！')
else:
    print('未找到data字段')
    # 打印附近内容
    idx = content.find('statusInfo: null')
    if idx >= 0:
        print(content[idx:idx+200])
