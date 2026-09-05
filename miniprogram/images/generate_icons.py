"""
生成微信小程序TabBar图标
6个图标：首页(普通/选中)、分类(普通/选中)、我的(普通/选中)
尺寸：81x81px，PNG格式
"""
from PIL import Image, ImageDraw
import os

# 颜色定义
GRAY = (134, 144, 156, 255)  # #86909C 普通状态
BLUE = (22, 119, 255, 255)    # #1677FF 选中状态
SIZE = 81

def create_home_icon(color):
    """创建首页图标（房子形状）"""
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 房子屋顶（三角形）
    roof_points = [(40, 12), (14, 36), (66, 36)]
    draw.polygon(roof_points, fill=color)

    # 房子主体（矩形）
    draw.rectangle([20, 34, 60, 66], fill=color)

    # 门（矩形，用背景色挖空）
    draw.rectangle([35, 48, 46, 66], fill=(0, 0, 0, 0))

    return img

def create_category_icon(color):
    """创建分类图标（四宫格）"""
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 四个方块
    margin = 16
    gap = 8
    cell_size = (SIZE - 2 * margin - gap) // 2

    # 左上
    draw.rectangle([margin, margin, margin + cell_size, margin + cell_size], fill=color)
    # 右上
    draw.rectangle([margin + cell_size + gap, margin, SIZE - margin, margin + cell_size], fill=color)
    # 左下
    draw.rectangle([margin, margin + cell_size + gap, margin + cell_size, SIZE - margin], fill=color)
    # 右下
    draw.rectangle([margin + cell_size + gap, margin + cell_size + gap, SIZE - margin, SIZE - margin], fill=color)

    return img

def create_profile_icon(color):
    """创建我的图标（人物形状）"""
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 头部（圆形）
    head_radius = 14
    head_center = (40, 28)
    draw.ellipse([
        head_center[0] - head_radius, head_center[1] - head_radius,
        head_center[0] + head_radius, head_center[1] + head_radius
    ], fill=color)

    # 身体（半圆形/弧形）
    body_top = 46
    body_bottom = 68
    body_left = 16
    body_right = 64
    draw.pieslice([body_left, body_top - 20, body_right, body_bottom + 20], 180, 360, fill=color)

    return img

def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))

    icons = [
        ('tab-home.png', create_home_icon, GRAY),
        ('tab-home-active.png', create_home_icon, BLUE),
        ('tab-category.png', create_category_icon, GRAY),
        ('tab-category-active.png', create_category_icon, BLUE),
        ('tab-profile.png', create_profile_icon, GRAY),
        ('tab-profile-active.png', create_profile_icon, BLUE),
    ]

    for filename, creator, color in icons:
        img = creator(color)
        filepath = os.path.join(output_dir, filename)
        img.save(filepath, 'PNG')
        print(f'已生成: {filename} ({os.path.getsize(filepath)} bytes)')

    print('\n所有图标生成完成！')

if __name__ == '__main__':
    main()
