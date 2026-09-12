# 修复config.js中同义词典结束括号缺少逗号的问题
with open(r'E:\rights protection\miniprogram\data\config.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed_lines = []
for i, line in enumerate(lines):
    # 找到同义词典的结束括号（只有两个空格的}），并且下一行是feature_flags
    if line.strip() == '}' and i + 1 < len(lines) and '"feature_flags"' in lines[i+1]:
        if not line.rstrip().endswith(','):
            line = line.rstrip() + ',\n'
            print(f'修复第{i+1}行: {line.strip()}')
    fixed_lines.append(line)

with open(r'E:\rights protection\miniprogram\data\config.js', 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print('修复完成')
