# 修改channel-detail.js的getLawsByCategory方法，使用新的legal_basis_with_articles字段
file_path = r'E:\rights protection\miniprogram\pages\channel-detail\channel-detail.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 找到getLawsByCategory方法的开始位置
start_marker = '  // 根据渠道分类筛选相关法律法规（优先使用渠道自带的legal_basis字段）'
end_marker = '  // 构建渠道状态信息（已整合/停用提示）'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx >= 0 and end_idx >= 0:
    # 新的getLawsByCategory方法
    new_method = '''  // 根据渠道分类筛选相关法律法规（优先使用渠道自带的legal_basis_with_articles字段）
  getLawsByCategory(channel, allLaws) {
    // 优先使用渠道自带的法律依据+条款字段（精确匹配，只展示该渠道用到的条款）
    if (channel.legal_basis_with_articles && channel.legal_basis_with_articles.length > 0) {
      const matchedLaws = [];
      
      channel.legal_basis_with_articles.forEach(item => {
        // 从本地法律库查找法律
        let matchedLaw = null;
        if (item.law_id) {
          matchedLaw = allLaws.find(law => law.id === item.law_id);
        }
        if (!matchedLaw && item.law_name) {
          matchedLaw = allLaws.find(law => {
            const localName = (law.name || law.title || '').trim();
            return localName === item.law_name || 
                   localName.replace('中华人民共和国', '').trim() === item.law_name.replace('中华人民共和国', '').trim();
          });
        }
        
        if (matchedLaw) {
          // 只展示该渠道引用的条款
          let articles = [];
          if (item.article_ids && item.article_ids.length > 0 && matchedLaw.articles) {
            articles = matchedLaw.articles.filter(art => item.article_ids.includes(art.id));
          }
          
          matchedLaws.push({
            id: matchedLaw.id,
            name: matchedLaw.name || matchedLaw.title,
            article: matchedLaw.article || matchedLaw.description || '',
            description: matchedLaw.description || matchedLaw.article || '',
            articles: articles,
            isChannelBuiltin: true
          });
        } else {
          // 本地库没有匹配到，只展示名称
          matchedLaws.push({
            id: 'law_' + item.law_name,
            name: item.law_name,
            article: '',
            description: '该法律详细条款待补充',
            articles: [],
            isChannelBuiltin: true
          });
        }
      });
      
      return matchedLaws.slice(0, 5);
    }
    
    // 回退：使用旧的legal_basis字段（解析《...》格式）
    if (channel.legal_basis && channel.legal_basis.trim()) {
      const matchedLaws = [];
      const seenNames = new Set();
      
      const lawMatches = channel.legal_basis.match(/《([^》]+)》/g);
      if (lawMatches) {
        lawMatches.forEach(match => {
          const lawName = match.replace(/[《》]/g, '').trim();
          if (seenNames.has(lawName)) return;
          seenNames.add(lawName);
          
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
              articles: matchedLaw.articles || [],
              isChannelBuiltin: true
            });
          } else {
            matchedLaws.push({
              id: 'law_' + lawName,
              name: lawName,
              article: '',
              description: '该法律条款待补充',
              articles: [],
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
          articles: [],
          isChannelBuiltin: true
        });
      }
      
      return matchedLaws.slice(0, 5);
    }

'''
    
    content = content[:start_idx] + new_method + content[end_idx:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print('getLawsByCategory方法修改成功！')
else:
    print('未找到方法位置')
    print('start_idx:', start_idx)
    print('end_idx:', end_idx)
