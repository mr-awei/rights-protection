# 修复config.js中同义词库结束括号缺少逗号的问题
with open(r'E:\rights protection\miniprogram\data\config.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip() == '}' and i + 1 < len(lines) and 'feature_flags' in lines[i+1]:
        if not line.rstrip().endswith(','):
            lines[i] = line.rstrip() + ',\n'
            print(f'修复第{i+1}行: {lines[i].strip()}')

with open(r'E:\rights protection\miniprogram\data\config.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('修复完成')
