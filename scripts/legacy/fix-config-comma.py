# 修复config.js中缺少逗号的语法错误
import re

with open(r'E:\rights protection\miniprogram\data\config.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找所有缺少逗号的行（行尾是"值"，下一行是"键"）
# 简单方法：找到"天府民声"那一行，添加逗号
lines = content.split('\n')
fixed_lines = []
for i, line in enumerate(lines):
    if '"天府民声"' in line and '高层级诉求' in line and not line.rstrip().endswith(','):
        # 检查下一行是否是新的键值对
        if i + 1 < len(lines) and lines[i+1].strip().startswith('"'):
            line = line.rstrip() + ','
            print(f'修复第{i+1}行: {line}')
    fixed_lines.append(line)

content = '\n'.join(fixed_lines)

with open(r'E:\rights protection\miniprogram\data\config.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('修复完成')
