# 维权通 - 微信小程序

> 遇到问题，一键找到维权渠道。基于122条官方投诉渠道、6套投诉话术、9部法律法规的本地搜索维权工具。

## 项目简介

维权通是一款帮助普通消费者快速找到官方投诉渠道的微信小程序。用户输入遇到的问题（如"快递被偷了"），系统通过本地关键词提取匹配相关场景，展示对应的投诉渠道、投诉话术和投诉流程，全程无需AI、零API成本。

## 核心特性

- **本地关键词提取**：用户输入一大段自然语言，自动提取核心关键词（正向最大匹配算法）
- **场景选项卡**：匹配到多个场景时，展示场景选项卡让用户选择，匹配度可视化
- **纯本地搜索**：倒排索引+预构建，无需后端、无需AI、零API费用
- **122条官方渠道**：覆盖快递、电信、消费、金融、物业、劳动、医疗等10大领域
- **6套投诉话术**：电话版+书面版，占位符高亮，证据清单
- **9部法律法规**：自动提取去重，场景关联法律依据

## 目录结构

```
rights-protection/
├── docs/                    # 产品文档
│   ├── 维权小程序_MVP版PRD.md          # 产品需求文档（大厂规范）
│   ├── 维权小程序_远景规划.md           # 产品远景规划（V1.0-V3.0）
│   └── 维权通_技术设计文档TDD.md        # 技术设计文档
├── source/                  # 源数据（Word文档）
│   ├── 官方投诉维权渠道大全（合并版·最终版）.docx
│   ├── 生活投诉渠道大全（最终版）.docx
│   └── 群众诉求官方平台汇总（最终版）.docx
├── data/                    # 运行层数据（转换脚本生成）
│   ├── channels.json        # 渠道数据（122条）
│   ├── scripts.json         # 话术数据（6条）
│   ├── laws.json            # 法律法规（9部去重）
│   ├── categories.json      # 分类树
│   ├── config.json          # 配置文件（含AI可选接入）
│   ├── search_index.json    # 预构建倒排索引（1411个term）
│   ├── suggest_trie.json    # 搜索联想Trie树
│   ├── _manifest.json       # 数据清单
│   └── 维权通数据_维护版.xlsx  # Excel维护层（可人工编辑）
├── tools/                   # 工具脚本
│   ├── convert.py           # Word→Excel→JSON转换工具
│   └── requirements.txt     # Python依赖
├── prototype/               # 产品原型
│   └── 维权通_产品原型.html  # 高保真可交互原型（7页面）
├── .gitignore
└── README.md
```

## 快速开始

### 环境要求

- Python 3.8+
- 依赖：`python-docx`, `openpyxl`, `jsonschema`, `tqdm`

### 安装依赖

```bash
pip install -r tools/requirements.txt
```

### 数据转换流程

```bash
# 1. Word → Excel（提取数据，生成维护层）
python tools/convert.py --input "./source" --output "./data/维权通数据_维护版.xlsx" --mode extract

# 2. Excel → JSON（构建运行层，生成索引）
python tools/convert.py --input "./data/维权通数据_维护版.xlsx" --output "./data/" --mode build

# 3. 一键全流程
python tools/convert.py --input "./source" --output "./data/" --mode all

# 4. 仅校验数据
python tools/convert.py --input "./data/维权通数据_维护版.xlsx" --mode validate
```

### 查看产品原型

用浏览器打开 `prototype/维权通_产品原型.html`，可体验完整交互流程。

## 技术架构

### 双层数据架构

```
Word源文档 → Excel维护层（人工可编辑） → JSON运行层（小程序加载）
                                    ↓
                          预构建倒排索引 + 搜索联想Trie
```

### 搜索流程

```
用户输入自然语言
    ↓
本地关键词提取（正向最大匹配，330+关键词）
    ↓
场景匹配（关键词组合→20个预设场景）
    ↓
├─ 1个场景 → 直接进入渠道详情
├─ 2-5个场景 → 场景选项卡（用户点选）
└─ 无匹配 → 倒排索引搜索结果页
```

### AI可选接入

MVP默认不接入AI，纯本地搜索零成本。架构预留AI接入抽象层，开发者可自行选择：
- 厂商：字节豆包、阿里通义千问、OpenAI、智谱GLM、本地Ollama、自定义
- 协议：OpenAI兼容协议、Anthropic协议、自定义
- 配置：`data/config.json` 中的 `ai` 字段

## 多端战略

| 端 | 技术方案 | 发布阶段 |
|----|----------|----------|
| 微信小程序 | 原生 | V1.0（当前） |
| H5网站 | Web响应式 | V1.5 |
| PC网站 | Web大屏适配 | V2.0 |
| APP | Capacitor打包Web | V2.0 |
| Windows EXE | Tauri打包Web | V2.5 |
| macOS/Linux | Tauri跨平台 | V3.0 |

核心层（搜索索引+数据管理+业务逻辑）纯JS一次开发，全端复用。

## 数据规模

| 数据项 | 数量 |
|--------|------|
| 官方投诉渠道 | 122条 |
| 投诉话术 | 6套 |
| 法律法规 | 9部（去重） |
| 领域分类 | 10个 |
| 搜索关键词 | 330+ |
| 预设场景 | 20个 |
| 倒排索引term | 1411个 |

## 文档导航

- [产品需求文档（PRD）](docs/维权小程序_MVP版PRD.md)
- [产品远景规划](docs/维权小程序_远景规划.md)
- [技术设计文档（TDD）](docs/维权通_技术设计文档TDD.md)

## 许可证

MIT License

## 联系方式

- Gitee: https://gitee.com/mr-awei
- GitHub: https://github.com/mr-awei
