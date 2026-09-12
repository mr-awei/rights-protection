# 修改channel-detail.js中的getLawsByCategory方法
import re

file_path = r'E:\rights protection\miniprogram\pages\channel-detail\channel-detail.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 要替换的旧内容
old_content = '''    // 优先使用渠道自带的法律依据字段
    if (channel.legal_basis && channel.legal_basis.trim()) {
      return [{
        id: 'channel_legal_basis',
        name: channel.legal_basis.length > 30 ? channel.legal_basis.substring(0, 30) + '...' : channel.legal_basis,
        description: channel.legal_basis,
        article: channel.legal_basis,
        isChannelBuiltin: true
      }];
    }'''

# 新内容
new_content = '''    // 优先使用渠道自带的法律依据字段，解析出每个法律并匹配本地库的具体条款
    if (channel.legal_basis && channel.legal_basis.trim()) {
      const matchedLaws = [];
      const seenNames = new Set();
      
      // 解析《...》格式的法律名称
      const lawMatches = channel.legal_basis.match(/《([^》]+)》/g);
      if (lawMatches) {
        lawMatches.forEach(match => {
          const lawName = match.replace(/[《》]/g, '').trim();
          if (seenNames.has(lawName)) return;
          seenNames.add(lawName);
          
          // 从本地法律库精确匹配（支持简称匹配）
          let matchedLaw = allLaws.find(law => {
            const localName = (law.name || law.title || '').trim();
            if (localName === lawName) return true;
            const localShort = localName.replace('中华人民共和国', '').trim();
            const inputShort = lawName.replace('中华人民共和国', '').trim();
            if (localShort === inputShort) return true;
            if (localName.includes(lawName) || lawName.includes(localName)) return true;
            if (localShort.includes(inputShort) || inputShort.includes(localShort)) return true;
            return false;
          });
          
          if (matchedLaw) {
            matchedLaws.push({
              id: matchedLaw.id,
              name: matchedLaw.name || matchedLaw.title,
              article: matchedLaw.article || matchedLaw.description || '',
              description: matchedLaw.description || matchedLaw.article || '',
              isChannelBuiltin: true
            });
          } else {
            matchedLaws.push({
              id: 'law_' + lawName,
              name: lawName,
              article: '',
              description: '该法律条款待补充',
              isChannelBuiltin: true
            });
          }
        });
      }
      
      if (matchedLaws.length === 0) {
        matchedLaws.push({
          id: 'channel_legal_basis',
          name: channel.legal_basis.length > 30 ? channel.legal_basis.substring(0, 30) + '...' : channel.legal_basis,
          description: channel.legal_basis,
          article: channel.legal_basis,
          isChannelBuiltin: true
        });
      }
      
      return matchedLaws.slice(0, 5);
    }'''

if old_content in content:
    content = content.replace(old_content, new_content)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('修改成功！')
else:
    print('未找到要替换的内容')
    # 打印附近内容用于调试
    idx = content.find('优先使用渠道自带的法律依据字段')
    if idx >= 0:
        print('找到位置:', idx)
        print(content[idx:idx+500])
