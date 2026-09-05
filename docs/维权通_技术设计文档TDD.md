# 维权通 · 技术设计文档（TDD）

| 文档属性 | 内容 |
|----------|------|
| 产品名称 | 维权通 |
| 文档版本 | v1.0 |
| 文档状态 | 初稿 |
| 创建日期 | 2026-09-05 |
| 最后更新 | 2026-09-05 |
| 产品阶段 | MVP（V1.0） |
| 配套文档 | 《维权通 · MVP版PRD》《维权通 · 产品远景规划》 |
| 数据来源 | 三份维权文档（2026年8月30日验证） |

---

## 修订记录

| 版本 | 日期 | 修订人 | 修订内容 |
|------|------|--------|----------|
| v1.0 | 2026-09-05 | — | 初版，包含技术选型、架构设计、数据管线、核心模块、扩展性、性能、安全、工程化、测试、上线全流程 |

---

## 目录

1. [项目背景与技术目标](#1-项目背景与技术目标)
2. [技术选型与决策](#2-技术选型与决策)
3. [系统架构设计](#3-系统架构设计)
4. [数据层设计](#4-数据层设计)
5. [数据转换管线](#5-数据转换管线)
6. [核心模块详细设计](#6-核心模块详细设计)
7. [扩展性设计](#7-扩展性设计)
8. [性能设计](#8-性能设计)
9. [安全与合规设计](#9-安全与合规设计)
10. [工程化](#10-工程化)
11. [测试策略](#11-测试策略)
12. [上线与发布](#12-上线与发布)
13. [监控与运维](#13-监控与运维)
14. [风险与应对](#14-风险与应对)
15. [附录](#15-附录)

---

## 1. 项目背景与技术目标

### 1.1 项目背景

维权通是一款基于微信小程序的随身维权工具箱，核心功能是关键词搜索投诉渠道、话术模板和投诉流程。数据来源于三份Word文档（合计超11万字、260+表格、109+行业渠道、16个高层级平台、5套场景话术）。

技术面临的核心挑战：
1. **数据格式**：Word文档不便于程序读取和搜索，需要转换为结构化格式
2. **数据更新**：Word文档会持续更新（新增场景、新增法律条款），需要可重复执行的转换管线
3. **离线可用**：MVP要求无网络也能搜索浏览，数据必须打包进小程序
4. **搜索性能**：150+条数据量虽小，但要求搜索响应<500ms、首条命中率≥80%
5. **未来扩展**：V2.0将接入AI问答、投诉跟踪、证据管理，V3.0将迁移独立后端，架构必须预留扩展空间

### 1.2 技术目标

| 目标维度 | 具体指标 |
|----------|----------|
| 开发效率 | 1人3-4周完成MVP全功能开发 |
| 运行性能 | 冷启动<2s，搜索响应<500ms（P95），页面切换<300ms |
| 包体积 | 主包<1MB，数据文件<500KB（压缩后） |
| 离线可用 | 100%核心功能（搜索/浏览/复制/收藏）断网可用 |
| 数据质量 | 转换脚本提取准确率≥98%，支持Schema校验 |
| 可维护性 | 数据更新无需改代码，转换脚本可重复执行，支持增量更新 |
| 可扩展性 | V2.0接入云开发/AI无需重构，V3.0迁移后端仅替换Repository实现 |

### 1.3 技术原则

1. **KISS原则**：MVP用最简单的技术方案，不引入不必要的复杂度
2. **数据与代码分离**：所有内容数据独立于代码，更新数据不需要发版逻辑改动
3. **接口抽象**：数据访问层按Repository模式抽象，本地/远程可切换
4. **配置驱动**：搜索权重、热门词、功能开关全部配置化
5. **渐进式架构**：MVP本地架构→V2.0云开发→V3.0独立后端，每一步平滑升级不推倒重来

---

## 2. 技术选型与决策

### 2.1 前端框架选型

| 方案 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **微信小程序原生** | 性能最优、包体积最小、API原生支持、无额外依赖、调试工具完善 | 仅支持微信平台、不能跨端 | ✅ **选用** |
| Taro (React) | 跨端、React生态、组件化 | 包体积大（+300KB）、性能损耗、编译复杂、依赖多 | ❌ MVP不需要跨端 |
| uni-app (Vue) | 跨端、Vue生态、学习成本低 | 包体积大、性能损耗、平台兼容问题 | ❌ 同上 |
| 微信小程序+TypeScript | 类型安全、可维护性好 | 增加编译步骤、学习成本 | ⚠️ 可选，MVP用JS即可，V2.0可迁移TS |

**决策理由**：MVP仅需微信平台，数据量小功能简单，原生开发性能最优、包体积最小、开发速度最快。跨端框架的优势在MVP阶段无法体现，反而增加复杂度和包体积。

### 2.2 数据格式选型（核心决策）

#### 2.2.1 运行时数据格式（小程序端）

| 格式 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **JSON** | 小程序原生require加载、解析快、体积小、支持嵌套结构、易读易改 | 大数据量查询需全量加载到内存（150条无压力） | ✅ **选用** |
| SQLite | 支持SQL查询、索引、事务、查询效率高 | 小程序需插件支持、打包后只读、增加包体积、开发复杂 | ❌ 数据量小，SQL优势无法体现 |
| CSV | 极简、体积极小 | 不支持嵌套、不支持多表关联、解析需手写、无类型 | ❌ 数据结构复杂，CSV表达力不足 |
| Protocol Buffers | 体积极小、解析极快 | 不可读、需编译schema、调试困难、小程序支持差 | ❌ 过度设计，数据量小不需要 |

**决策理由**：JSON是小程序端最优选择。150条数据全量加载到内存<1MB，构建倒排索引后搜索<500ms。JSON原生支持、易读易改、无额外依赖。

#### 2.2.2 维护时数据格式（人工编辑）

| 格式 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **Excel (.xlsx)** | 非技术人员可直接编辑、多sheet组织、支持筛选排序、可视化好 | 需openpyxl库解析、体积比JSON大、不适合运行时直接使用 | ✅ **选用（维护层）** |
| JSON | 程序友好、可直接用 | 非技术人员编辑困难、易写错格式 | ❌ 不适合人工维护 |
| YAML | 可读性好、支持注释 | 非技术人员仍不友好、缩进敏感 | ❌ 同上 |
| 数据库管理工具 | 结构化、可校验 | 需要安装软件、学习成本高 | ❌ 过度设计 |

**决策理由**：Excel作为人工维护层，非技术人员（运营/内容编辑）可直接打开编辑，多sheet组织不同类型数据，支持筛选排序。编辑后通过转换脚本生成JSON供小程序使用。

#### 2.2.3 最终数据格式方案：双层架构

```
Word文档（源数据，持续更新）
    ↓ 【转换脚本 extract.py】首次提取 / 增量更新
Excel文件（维护层，人工审核编辑，多sheet）
    ↓ 【转换脚本 build.py】构建
JSON文件（运行层，小程序打包使用，压缩后<500KB）
    ↓ 打包
微信小程序（运行时加载JSON，构建内存索引）
```

**工作流**：
- **首次**：Word → extract.py → Excel（人工审核）→ build.py → JSON
- **日常更新（编辑Excel）**：修改Excel → build.py → JSON
- **日常更新（更新Word）**：更新Word → extract.py（增量模式，输出diff报告）→ 人工确认 → Excel → build.py → JSON

### 2.3 搜索方案选型

| 方案 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **本地倒排索引（JS实现）** | 离线可用、响应极快（<10ms）、可控性强、无依赖 | 需手写索引构建、数据量受限（150条无压力） | ✅ **选用** |
| 简单字符串匹配 (includes) | 实现极简 | 不支持分词、不支持权重排序、命中率低 | ❌ 搜索质量不达标 |
| 第三方搜索库 (如flexsearch) | 功能强大、性能好 | 增加包体积（+50KB）、API学习成本 | ⚠️ V2.0数据量大时可考虑 |
| 后端搜索API (Elasticsearch) | 功能强大、支持复杂查询 | 需要服务器、不支持离线、增加成本和复杂度 | ❌ MVP不需要，V3.0再考虑 |

**决策理由**：150条数据量，手写倒排索引（~200行代码）完全够用，响应<10ms，离线可用，无额外依赖。支持基于词典的中文分词、标签加权匹配、同义词扩展。

### 2.4 状态管理选型

| 方案 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **小程序原生 (Page data + globalData)** | 无依赖、学习成本低、性能好 | 复杂状态管理困难、跨页面通信需手动 | ✅ **选用** |
| MobX | 响应式、可维护性好 | 增加依赖、学习成本 | ❌ MVP复杂度低，不需要 |
| Redux | 可预测、中间件丰富 | 模板代码多、学习曲线陡 | ❌ 过度设计 |

**决策理由**：MVP功能简单，页面间共享状态少（主要是收藏/历史），用小程序原生的globalData + 本地存储即可。V2.0状态复杂度上升时可考虑引入MobX。

### 2.5 后端服务选型（V2.0预留）

| 方案 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| **微信云开发** | 免运维、与小程序深度集成、按量付费、开发快 | 厂商锁定、性能上限、自定义程度有限 | ✅ **V2.0选用** |
| 自建后端 (Node.js + MySQL) | 完全可控、性能好、可扩展 | 需运维服务器、开发周期长、成本高 | V3.0迁移 |
| Serverless (阿里云/腾讯云函数) | 免运维、弹性伸缩 | 厂商锁定、冷启动、调试困难 | 备选 |

### 2.6 技术栈总览

| 层级 | 技术选型 | 版本 | 用途 |
|------|----------|------|------|
| 前端框架 | 微信小程序原生 | 最新稳定版 | UI、交互、路由 |
| 语言 | JavaScript (ES6+) | — | 业务逻辑 |
| 样式 | WXSS + Flex布局 | — | 样式 |
| 运行时数据 | JSON | — | 渠道/话术/平台/配置数据 |
| 维护层数据 | Excel (.xlsx) | — | 人工编辑维护 |
| 转换脚本 | Python 3.8+ | — | Word→Excel→JSON转换 |
| 搜索 | 本地倒排索引（自研） | — | 关键词搜索 |
| 存储 | 小程序本地存储 (wx.setStorageSync) | — | 收藏/历史/配置 |
| 构建工具 | 微信开发者工具 | — | 编译、调试、发布 |
| 代码质量 | ESLint + Prettier | — | 代码规范 |
| 版本控制 | Git | — | 代码版本管理 |
| 【V2.0】后端 | 微信云开发 | — | 云函数/云数据库/云存储 |
| 【V2.0】AI | 大模型API（豆包/通义千问） | — | AI问答/话术生成 |
| 【V3.0】后端 | Node.js + MySQL + Elasticsearch | — | 独立后端/搜索/开放API |

---

## 3. 系统架构设计

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        微信小程序（客户端）                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    表现层 (View / Pages)                  │    │
│  │  首页 │ 搜索 │ 渠道详情 │ 话术详情 │ 分类 │ 我的 │ 工具箱  │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                   服务层 (Services)                       │    │
│  │  SearchService │ ChannelService │ ScriptService           │    │
│  │  FavoriteService │ HistoryService │ ConfigService         │    │
│  │  【预留】AIService │ ComplaintService │ UserService       │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │ 依赖注入                             │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                数据访问层 (Repositories)                  │    │
│  │  ChannelRepository(接口)                                  │    │
│  │    ├─ LocalChannelRepository (MVP, 本地JSON)             │    │
│  │    └─ 【预留】RemoteChannelRepository (V3.0, 远程API)    │    │
│  │  ScriptRepository │ PlatformRepository │ ConfigRepository  │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                    数据层 (Data)                          │    │
│  │  channels.json │ scripts.json │ platforms.json            │    │
│  │  config.json │ categories.json │ schedule.json            │    │
│  │  hotlines.json │ enterprise_query.json                    │    │
│  │  本地存储: favorites / view_history / search_history      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 基础设施层 (Infrastructure)               │    │
│  │  SearchIndex(倒排索引) │ Tracker(埋点) │ Storage(存储封装) │    │
│  │  SynonymDict(同义词典) │ Validator(数据校验)               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      数据管线（离线工具链）                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Word文档(.docx)                                                  │
│      │                                                            │
│      ▼  extract.py (Python, python-docx + openpyxl)             │
│  Excel文件(.xlsx)  ←── 人工审核/编辑 ──→  diff报告              │
│      │                                                            │
│      ▼  build.py (Python, openpyxl + jsonschema)                │
│  JSON文件(.json) + Schema校验 + 数据质量报告                      │
│      │                                                            │
│      ▼  打包进小程序                                              │
│  微信小程序                                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 分层设计原则

| 层级 | 职责 | 依赖方向 | 变更频率 |
|------|------|----------|----------|
| 表现层 (View) | 页面渲染、用户交互、事件处理 | 依赖Service层 | 高 |
| 服务层 (Service) | 业务逻辑编排、数据加工、状态管理 | 依赖Repository接口 | 中 |
| 数据访问层 (Repository) | 数据存取、查询、索引 | 依赖数据层 | 低 |
| 数据层 (Data) | 原始数据、本地存储 | 无依赖 | 中（内容更新） |
| 基础设施层 (Infra) | 通用工具、索引、埋点、校验 | 无依赖 | 低 |

**依赖规则**：上层依赖下层接口，不依赖下层实现。Service依赖Repository接口，不依赖LocalChannelRepository具体类。

### 3.3 模块划分

| 模块 | 目录 | 职责 | 优先级 |
|------|------|------|--------|
| 首页模块 | pages/home/ | 首页渲染、搜索入口、分类入口、高频话术 | P0 |
| 搜索模块 | pages/search/ + services/SearchService.js | 搜索联想、搜索结果、关键词高亮 | P0 |
| 渠道模块 | pages/channel-detail/ + services/ChannelService.js | 渠道详情、分类浏览、电话拨打、网址复制 | P0 |
| 话术模块 | pages/script-detail/ + services/ScriptService.js | 话术列表、话术详情、一键复制 | P0 |
| 个人中心 | pages/mine/ + services/FavoriteService.js | 收藏、浏览历史、搜索历史 | P1 |
| 工具箱 | pages/toolbox/ | 跟进时间表、热线变更、通用模板、企业查询 | P1 |
| 数据管线 | tools/ | Word→Excel→JSON转换脚本、数据校验 | P0 |
| 基础设施 | utils/ | 倒排索引、埋点、存储、同义词典、校验 | P0 |
| 【预留】AI模块 | pages/ai-assistant/ + services/AIService.js | AI问答、话术生成 | V2.0 |
| 【预留】投诉跟踪 | pages/complaint-ticket/ + services/ComplaintService.js | 投诉进度管理、提醒 | V2.0 |
| 【预留】证据管理 | pages/evidence/ + services/EvidenceService.js | 证据上传、管理、导出 | V2.0 |
| 【预留】社区模块 | pages/community/ + services/CommunityService.js | 案例分享、评论、点赞 | V2.5 |

---

## 4. 数据层设计

### 4.1 数据模型总览

```
核心业务数据（JSON，打包进小程序）
├── channels.json          投诉渠道表（109+条）
├── platforms.json         高层级诉求平台表（16条）
├── scripts.json           话术模板表（5条+通用模板）
├── categories.json        分类配置表
├── schedule.json          投诉跟进时间表（8条）
├── hotlines.json          热线整合变更表（12条）
├── enterprise_query.json  企业信息查询平台表（4条）
└── config.json            应用配置（搜索权重/热门词/功能开关）

用户行为数据（本地存储，运行时生成）
├── favorites              收藏记录
├── view_history           浏览历史（最多20条）
└── search_history         搜索历史（最多20条）

【预留表，V2.0+启用】
├── users                  用户表
├── ai_conversations       AI对话记录
├── complaint_tickets      投诉跟踪卡
├── evidences              证据文件
├── channel_feedbacks      渠道效力反馈
├── posts                  社区帖子
├── comments               社区评论
└── likes                  点赞记录
```

### 4.2 JSON Schema 设计

#### 4.2.1 channels.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Channel",
  "type": "object",
  "required": ["id", "name", "scope", "category_l1", "category_l2", "tags", "city_code", "channel_type", "status", "hot_level"],
  "properties": {
    "id": { "type": "string", "description": "渠道唯一ID，格式ch_NNN" },
    "name": { "type": "string", "description": "渠道官方全称" },
    "phone": { "type": ["string", "null"], "description": "投诉电话" },
    "phone_note": { "type": ["string", "null"], "description": "电话备注（服务时间等）" },
    "website": { "type": ["string", "null"], "description": "官方网址" },
    "regulator": { "type": ["string", "null"], "description": "上级监管部门" },
    "scope": { "type": "string", "description": "适用范围" },
    "precondition": { "type": ["string", "null"], "description": "前置条件/注意事项" },
    "legal_basis": { "type": ["string", "null"], "description": "法律依据" },
    "tips": { "type": ["string", "null"], "description": "实用提示/威慑力提示" },
    "source": { "type": ["string", "null"], "description": "信息来源" },
    "category_l1": { "type": "string", "description": "一级分类" },
    "category_l2": { "type": "string", "description": "二级分类" },
    "tags": { "type": "array", "items": { "type": "string" }, "minItems": 3, "description": "搜索标签（≥3个）" },
    "city_code": { "type": "string", "enum": ["national", "sichuan", "chengdu"], "description": "城市编码（预留多城市）" },
    "channel_type": { "type": "string", "enum": ["official", "hotline", "platform", "enterprise"], "description": "渠道类型" },
    "status": { "type": "string", "enum": ["active", "merged", "discontinued"], "description": "状态" },
    "merged_to": { "type": ["string", "null"], "description": "若已整合，替代渠道ID" },
    "hot_level": { "type": "integer", "minimum": 1, "maximum": 5, "description": "热度权重" },
    "related_script_id": { "type": ["string", "null"], "description": "关联话术ID" },
    "effect_rating": { "type": ["integer", "null"], "description": "【V2.0预留】效力评级1-5" },
    "response_speed": { "type": ["integer", "null"], "description": "【V2.0预留】响应速度评分" },
    "penalty_power": { "type": ["integer", "null"], "description": "【V2.0预留】处罚力度评分" },
    "success_rate": { "type": ["number", "null"], "description": "【V2.5预留】用户实测成功率" },
    "user_feedback_count": { "type": ["integer", "null"], "description": "【V2.5预留】用户反馈数" },
    "ext": { "type": "object", "description": "扩展字段（JSON，未来新增属性无需改表）" }
  }
}
```

#### 4.2.2 scripts.json

```json
{
  "title": "Script",
  "type": "object",
  "required": ["id", "scene_name", "applicable", "script_type", "phone_script", "keywords", "is_hot", "hot_level"],
  "properties": {
    "id": { "type": "string" },
    "scene_name": { "type": "string" },
    "applicable": { "type": "string" },
    "related_channel_id": { "type": ["string", "null"] },
    "script_type": { "type": "string", "enum": ["template", "ai_generated", "custom", "user_shared"] },
    "phone_script": { "type": "string" },
    "written_complainant": { "type": ["string", "null"] },
    "written_respondent": { "type": ["string", "null"] },
    "written_request": { "type": ["string", "null"] },
    "written_facts": { "type": ["string", "null"] },
    "written_evidence": { "type": ["string", "null"] },
    "legal_basis": { "type": ["string", "null"] },
    "evidence_list": { "type": "array", "items": { "type": "string" } },
    "keywords": { "type": "array", "items": { "type": "string" } },
    "is_hot": { "type": "boolean" },
    "hot_level": { "type": "integer", "minimum": 1, "maximum": 5 },
    "user_id": { "type": ["string", "null"], "description": "【V2.0预留】创建者用户ID" },
    "is_public": { "type": ["boolean", "null"], "description": "【V2.5预留】是否公开分享" },
    "usage_count": { "type": ["integer", "null"], "description": "【V2.0预留】使用次数" },
    "ext": { "type": "object" }
  }
}
```

#### 4.2.3 config.json

```json
{
  "data_version": "2026.08",
  "data_verified_at": "2026-08-30",
  "search_weights": {
    "name_exact": 100,
    "phone_exact": 90,
    "tag_exact": 80,
    "scope_fuzzy": 50,
    "script_match": 60,
    "platform_match": 55
  },
  "hot_search_words": ["快递丢失", "运营商扣费", "商家不退款", "物业乱收费", "欠薪", "电信诈骗", "噪音扰民", "医院乱收费", "出租车拒载", "个人信息泄露"],
  "synonyms": {
    "丢了": "丢失", "弄丢": "丢失",
    "坑人": "误导", "骗人": "欺诈", "套路": "违规收费",
    "不管": "不作为", "没人管": "不作为", "慢作为": "不作为",
    "乱收费": "违规收费", "多收钱": "违规收费", "加价": "价格违法",
    "退款": "退款", "退钱": "退款",
    "假货": "假冒伪劣", "山寨": "假冒伪劣", "翻新": "假冒伪劣",
    "噪音": "噪声扰民", "吵": "噪声扰民",
    "欠薪": "拖欠工资", "不发工资": "拖欠工资",
    "诈骗": "电信网络诈骗", "被骗钱": "电信网络诈骗"
  },
  "feature_flags": {
    "ai_assistant": false,
    "complaint_ticket": false,
    "evidence_manager": false,
    "community": false,
    "user_login": false,
    "effect_rating": false,
    "script_fill": false,
    "multi_city": false,
    "payment": false
  },
  "emergency_phones": [
    { "name": "110报警", "phone": "110", "icon": "🚨" },
    { "name": "119火警", "phone": "119", "icon": "🔥" },
    { "name": "120急救", "phone": "120", "icon": "🚑" },
    { "name": "96110反诈", "phone": "96110", "icon": "🛡️" }
  ],
  "limits": {
    "view_history_max": 20,
    "search_history_max": 20,
    "search_suggest_max": 8,
    "search_page_size": 20
  }
}
```

### 4.3 Excel 结构设计（维护层）

Excel文件 `维权通数据_维护版.xlsx`，包含以下sheet：

| Sheet名 | 对应JSON | 列数 | 说明 |
|---------|----------|------|------|
| 渠道表 | channels.json | 25 | 所有投诉渠道，一行一个渠道 |
| 话术表 | scripts.json | 18 | 所有话术模板，一行一个话术 |
| 平台表 | platforms.json | 14 | 高层级诉求平台 |
| 分类表 | categories.json | 5 | 分类配置 |
| 跟进时间表 | schedule.json | 5 | 投诉跟进时间节点 |
| 热线变更表 | hotlines.json | 4 | 已整合/停用热线 |
| 企业查询表 | enterprise_query.json | 5 | 企业信息查询平台 |
| 配置表 | config.json | 3 | 搜索权重、热门词、功能开关（key-value格式） |
| 数据字典 | — | 4 | 各字段说明、枚举值、必填项 |
| 更新日志 | — | 5 | 每次数据更新的记录（版本、日期、变更内容、操作人） |

**Excel设计要点**：
1. 第一行为表头（字段英文名+中文说明，如 `name 渠道名称`）
2. 枚举类型字段用数据验证（下拉选择），防止输入错误
3. 必填字段用黄色底色标记
4. tags/keywords等数组字段用英文逗号分隔
5. 新增渠道时，ID自动生成（=MAX+1）
6. 条件格式：status=merged的行标黄，status=discontinued的行标红

### 4.4 ID编码规范

| 数据类型 | ID格式 | 示例 | 说明 |
|----------|--------|------|------|
| 渠道 | ch_NNN | ch_001 | 3位数字，按提取顺序 |
| 话术 | sc_NNN | sc_001 | 3位数字 |
| 平台 | pl_NNN | pl_001 | 3位数字 |
| 分类 | cat_NN | cat_01 | 2位数字 |
| 跟进时间 | sch_NN | sch_01 | 2位数字 |
| 用户 | u_NNNNNN | u_000001 | V2.0，6位数字 |
| 投诉跟踪卡 | ct_NNNNNN | ct_000001 | V2.0 |
| AI对话 | ai_NNNNNN | ai_000001 | V2.0 |
| 社区帖子 | post_NNNNNN | post_000001 | V2.5 |

**ID分配规则**：
- 首次提取时按文档出现顺序分配
- 后续新增时取当前最大ID+1
- 删除数据不回收ID（软删除，保留ID引用完整性）
- ID一旦分配不可修改

### 4.5 数据版本管理

```
数据版本号格式：YYYY.MM[.patch]
示例：2026.08、2026.08.1、2026.09

版本规则：
- YYYY.MM：主版本，对应一次完整的数据核验（每季度一次）
- .patch：补丁版本，对应小范围修正（号码错误、网址更新、新增渠道）
- 版本号记录在 config.json 的 data_version 字段
- Excel的"更新日志"sheet记录每次版本变更
```

---

## 5. 数据转换管线

### 5.1 管线总览

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Word文档     │────▶│  extract.py   │────▶│  Excel文件    │────▶│  build.py     │
│  (.docx)      │     │  提取+解析    │     │  (.xlsx)      │     │  校验+构建    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                           │
                              ┌──────────────┐     ┌──────────────┐      │
                              │  数据质量报告  │◀────│  JSON文件     │◀─────┘
                              │  (HTML/TXT)   │     │  (.json)      │
                              └──────────────┘     └──────────────┘
```

### 5.2 工具链依赖

| 工具 | 版本 | 用途 | 安装 |
|------|------|------|------|
| Python | 3.8+ | 转换脚本运行时 | 系统自带或官网下载 |
| python-docx | 0.8.11+ | 读取Word文档 | `pip install python-docx` |
| openpyxl | 3.1+ | 读写Excel文件 | `pip install openpyxl` |
| jsonschema | 4.0+ | JSON Schema校验 | `pip install jsonschema` |
| tqdm | 4.0+ | 进度条显示 | `pip install tqdm` |

**一键安装**：`pip install python-docx openpyxl jsonschema tqdm`

### 5.3 extract.py — Word提取脚本

#### 5.3.1 功能

1. 读取指定目录下的所有.docx文件
2. 按文档顺序遍历段落和表格
3. 识别标题层级（Heading 1/2/3）构建分类树
4. 解析渠道表格（6-7行的键值对表格：渠道名称/官方网址/投诉电话/上级监管部门/适用范围/信息来源）
5. 解析话术表格（电话版话术、书面版分块）
6. 解析高层级平台（打开方式/主要针对/注意事项）
7. 自动分配ID
8. 输出Excel文件（多sheet）
9. 输出提取报告（提取数量、未识别表格、警告信息）

#### 5.3.2 核心解析逻辑

**渠道表格识别规则**：
- 表格为2列（键值对）
- 第一列包含"渠道名称"或"平台名称"
- 行数在5-10行之间
- 第二列非空

**分类归属规则**：
- 渠道表格出现在哪个Heading 2/3下，就归属哪个分类
- Heading 1 → category_l1
- Heading 2 → category_l2
- 若表格前无标题，归属"未分类"，人工审核时修正

**标签自动生成规则**：
1. 从渠道名称提取关键词（如"工信部电信用户申诉受理中心"→["电信","申诉","工信部"]）
2. 从适用范围提取高频名词
3. 从分类名称提取
4. 去重，保留3-8个标签
5. 人工审核时补充口语化标签

#### 5.3.3 命令行用法

```bash
# 基本用法：提取指定目录下所有Word，输出Excel
python extract.py --input "./docs" --output "./data/维权通数据_维护版.xlsx"

# 指定单个文件
python extract.py --input "./docs/官方投诉维权渠道大全.docx" --output "./data/channels.xlsx"

# 增量模式：与现有Excel对比，输出diff报告
python extract.py --input "./docs" --output "./data/维权通数据_维护版.xlsx" --existing "./data/维权通数据_维护版.xlsx" --diff

# 仅提取渠道（不提取话术/平台）
python extract.py --input "./docs" --output "./data/channels.xlsx" --type channels

# 详细日志
python extract.py --input "./docs" --output "./data/output.xlsx" --verbose
```

#### 5.3.4 输出报告

提取完成后输出 `提取报告_YYYYMMDD.txt`：

```
=== 维权通数据提取报告 ===
提取时间: 2026-09-05 14:30:00
输入文件:
  - 官方投诉维权渠道大全（合并版·最终版）.docx
  - 生活投诉渠道大全（最终版）.docx
  - 群众诉求官方平台汇总（最终版）.docx

提取结果:
  渠道表: 125条（去重后109条）
  话术表: 6条（5场景+1通用）
  平台表: 16条
  分类表: 5个一级分类，59个二级分类
  跟进时间表: 8条
  热线变更表: 12条
  企业查询表: 4条

去重记录:
  - 12315在3个分类中出现，合并为1条，关联3个分类标签
  - 12345在5个分类中出现，合并为1条

警告信息:
  - 3个表格未识别为渠道/话术/平台，需人工审核（行号: 156, 234, 412）
  - 2个渠道缺少投诉电话（ch_088, ch_103）
  - 5个渠道标签不足3个，已自动补充

数据质量:
  - 必填字段完整率: 96.8%
  - 电话号码格式校验通过率: 98.2%
  - 网址格式校验通过率: 95.4%
```

### 5.4 build.py — Excel构建JSON脚本

#### 5.4.1 功能

1. 读取Excel文件（多sheet）
2. 数据清洗（去除首尾空格、统一换行符、数组字段拆分）
3. JSON Schema校验（必填字段、类型、枚举值、格式）
4. 数据一致性校验（外键关联：related_channel_id必须存在、merged_to必须存在）
5. 搜索标签完整性校验（每个渠道≥3个标签）
6. 输出JSON文件（每个sheet对应一个JSON）
7. 输出数据质量报告
8. 可选：生成压缩版JSON（去除空格换行，减小体积）

#### 5.4.2 命令行用法

```bash
# 基本用法：Excel转JSON
python build.py --input "./data/维权通数据_维护版.xlsx" --output "./miniprogram/data/"

# 仅校验不输出
python build.py --input "./data/维权通数据_维护版.xlsx" --validate-only

# 生成压缩版JSON
python build.py --input "./data/维权通数据_维护版.xlsx" --output "./data/" --minify

# 严格模式（任何警告都视为失败）
python build.py --input "./data/维权通数据_维护版.xlsx" --output "./data/" --strict
```

#### 5.4.3 校验规则

| 校验类型 | 规则 | 失败处理 |
|----------|------|----------|
| 必填校验 | id/name/scope/category_l1/category_l2/tags/status/hot_level非空 | 错误，终止构建 |
| 类型校验 | 字段类型符合Schema定义 | 错误，终止构建 |
| 枚举校验 | status/city_code/channel_type/script_type在枚举值内 | 错误，终止构建 |
| 格式校验 | phone匹配电话格式、website匹配URL格式 | 警告，继续构建 |
| 外键校验 | related_channel_id/merged_to指向的ID存在 | 错误，终止构建 |
| 唯一校验 | id全局唯一 | 错误，终止构建 |
| 标签校验 | 每个渠道tags≥3个、每个话术keywords≥2个 | 警告，继续构建 |
| 范围校验 | hot_level在1-5之间 | 错误，终止构建 |

#### 5.4.4 输出文件清单

```
miniprogram/data/
├── channels.json          (109条，约120KB)
├── platforms.json         (16条，约25KB)
├── scripts.json           (6条，约30KB)
├── categories.json        (59条，约5KB)
├── schedule.json          (8条，约3KB)
├── hotlines.json          (12条，约2KB)
├── enterprise_query.json  (4条，约2KB)
├── config.json            (配置，约3KB)
└── _manifest.json         (文件清单+版本+校验和，约1KB)
```

**总体积**：约190KB（未压缩），gzip压缩后约60KB，远低于500KB目标。

### 5.5 增量更新策略

#### 5.5.1 场景一：编辑Excel后更新（日常运营）

```
1. 运营人员打开 Excel，新增/修改渠道、话术、法律条款
2. 运行 build.py 校验并生成JSON
3. 校验通过 → JSON更新 → 小程序发版（或热更新）
4. 校验失败 → 查看错误报告 → 修正Excel → 重新构建
```

#### 5.5.2 场景二：更新Word后同步（内容大更新）

```
1. 更新Word文档（新增场景、新增法律条款、修正号码）
2. 运行 extract.py --diff --existing 现有Excel
   - 提取新Word数据
   - 与现有Excel按ID对比
   - 输出diff报告（新增N条、修改N条、删除N条、冲突N条）
3. 人工审核diff报告
   - 新增：确认后自动加入Excel
   - 修改：确认字段变更，保留人工修改过的字段
   - 删除：软删除（is_deleted=true），不物理移除
   - 冲突：人工逐条确认
4. 运行 build.py 生成JSON
5. 小程序发版
```

#### 5.5.3 diff算法

```python
def diff(old_data, new_data):
    """
    基于ID的三路合并算法
    - 以ID为主键匹配
    - 同一ID下，逐字段对比
    - 字段变更检测：old_value != new_value
    - 冲突检测：old中的人工修改字段与new中的值不同
    - 输出：added[], modified[], deleted[], conflicts[]
    """
    old_map = {item['id']: item for item in old_data}
    new_map = {item['id']: item for item in new_data}

    added = [item for id, item in new_map.items() if id not in old_map]
    deleted = [item for id, item in old_map.items() if id not in new_map]

    modified = []
    conflicts = []
    for id in old_map.keys() & new_map.keys():
        old_item = old_map[id]
        new_item = new_map[id]
        field_changes = {}
        field_conflicts = {}
        for field in ALL_FIELDS:
            old_val = old_item.get(field)
            new_val = new_item.get(field)
            if old_val != new_val:
                # 检查该字段是否被人工修改过（通过Excel的修改标记列）
                if old_item.get(f'_manual_{field}'):
                    field_conflicts[field] = {'old': old_val, 'new': new_val}
                else:
                    field_changes[field] = {'old': old_val, 'new': new_val}
        if field_changes:
            modified.append({'id': id, 'changes': field_changes})
        if field_conflicts:
            conflicts.append({'id': id, 'conflicts': field_conflicts})

    return {'added': added, 'modified': modified, 'deleted': deleted, 'conflicts': conflicts}
```

### 5.6 数据质量保障

| 环节 | 保障措施 | 工具 |
|------|----------|------|
| 提取阶段 | 自动识别+人工审核标记未识别表格 | extract.py输出警告 |
| 编辑阶段 | Excel数据验证（下拉枚举）、必填字段颜色标记、条件格式 | openpyxl数据验证 |
| 构建阶段 | JSON Schema校验、外键校验、唯一校验、格式校验 | build.py --validate |
| 发布阶段 | 构建成功后自动生成校验和，小程序启动时校验数据完整性 | _manifest.json |
| 运行阶段 | 数据加载失败时降级为内置最小数据集（10个高频渠道） | 降级策略 |

---

## 6. 核心模块详细设计

### 6.1 搜索倒排索引模块

#### 6.1.1 设计目标

- 支持150+条数据的全文检索
- 响应时间<10ms（P95）
- 支持中文分词（基于词典）
- 支持标签加权匹配
- 支持同义词扩展
- 支持关键词高亮

#### 6.1.2 索引结构

```javascript
/**
 * 倒排索引数据结构
 * term -> { docId -> { positions: [], field: string, weight: number } }
 */
class InvertedIndex {
  constructor() {
    this.index = new Map();  // term -> Map<docId, Posting>
    this.docStore = new Map(); // docId -> document
    this.dictionary = new Set(); // 词典（用于分词）
  }

  /**
   * 添加文档到索引
   * @param {string} docId - 文档ID
   * @param {Object} doc - 文档对象
   * @param {Object} fieldWeights - 字段权重配置
   */
  addDocument(docId, doc, fieldWeights) {
    this.docStore.set(docId, doc);

    for (const [field, weight] of Object.entries(fieldWeights)) {
      const text = doc[field];
      if (!text) continue;

      const terms = this.tokenize(text);
      terms.forEach((term, position) => {
        if (!this.index.has(term)) {
          this.index.set(term, new Map());
        }
        const postings = this.index.get(term);
        if (!postings.has(docId)) {
          postings.set(docId, { positions: [], field, weight });
        }
        postings.get(docId).positions.push(position);
        this.dictionary.add(term);
      });
    }
  }

  /**
   * 中文分词（基于词典的正向最大匹配）
   * @param {string} text - 输入文本
   * @returns {string[]} - 分词结果
   */
  tokenize(text) {
    const terms = [];
    // 1. 英文/数字连续字符作为一个term
    // 2. 中文字符按词典正向最大匹配
    // 3. 单字也加入索引（保证召回率）
    // ... 具体实现见代码
    return terms;
  }

  /**
   * 搜索
   * @param {string} query - 查询关键词
   * @param {Object} options - 搜索选项
   * @returns {Array} - 排序后的搜索结果
   */
  search(query, options = {}) {
    // 1. 查询分词
    // 2. 同义词扩展
    // 3. 倒排索引查找
    // 4. BM25相似度计算 + 字段权重 + 热度权重
    // 5. 排序返回
    // ... 具体实现见代码
  }
}
```

#### 6.1.3 分词策略

由于数据量小（150条），采用**混合分词策略**：

1. **英文/数字**：连续字符作为一个term（如"12305"、"MIIT"）
2. **中文词典匹配**：基于渠道名称、标签、分类名构建词典（约500词），正向最大匹配
3. **单字兜底**：每个中文字符也单独加入索引，保证召回率（数据量小，单字索引体积可接受）
4. **同义词扩展**：查询时通过config.synonyms扩展同义词

#### 6.1.4 排序算法

```
最终得分 = BM25相似度 × 字段权重 × 匹配类型系数 + 热度权重(hot_level) × 10

匹配类型系数：
- 名称精确匹配: 3.0
- 电话号码精确匹配: 2.5
- 标签精确匹配: 2.0
- 适用范围模糊匹配: 1.0
- 话术场景匹配: 1.5

字段权重（来自config.search_weights）：
- name_exact: 100
- phone_exact: 90
- tag_exact: 80
- scope_fuzzy: 50
- script_match: 60
```

#### 6.1.5 索引构建时机

- 小程序启动时（onLaunch）异步构建
- 构建时间<200ms（150条数据）
- 构建完成前搜索功能显示"加载中..."
- 构建完成后缓存到globalData，全局复用
- 数据版本变更时（热更新）重建索引

### 6.2 Repository 模式实现

#### 6.2.1 接口定义

```javascript
// repositories/ChannelRepository.js
class ChannelRepository {
  /**
   * 根据ID获取渠道
   * @param {string} id - 渠道ID
   * @returns {Promise<Object|null>}
   */
  async getById(id) { throw new Error('Not implemented'); }

  /**
   * 搜索渠道
   * @param {string} keyword - 关键词
   * @param {Object} filters - 过滤条件 {category_l1, city_code, status}
   * @param {Object} pagination - 分页 {page, pageSize}
   * @returns {Promise<{list: Array, total: number}>}
   */
  async search(keyword, filters = {}, pagination = {}) { throw new Error('Not implemented'); }

  /**
   * 按分类获取渠道
   * @param {string} categoryL1 - 一级分类
   * @param {string} categoryL2 - 二级分类（可选）
   * @returns {Promise<Array>}
   */
  async getByCategory(categoryL1, categoryL2 = null) { throw new Error('Not implemented'); }

  /**
   * 获取热门渠道
   * @param {number} limit - 数量
   * @returns {Promise<Array>}
   */
  async getHot(limit = 10) { throw new Error('Not implemented'); }

  /**
   * 根据IDs批量获取
   * @param {string[]} ids - ID列表
   * @returns {Promise<Array>}
   */
  async getByIds(ids) { throw new Error('Not implemented'); }

  /**
   * 获取所有渠道（用于索引构建）
   * @returns {Promise<Array>}
   */
  async getAll() { throw new Error('Not implemented'); }
}
```

#### 6.2.2 本地实现（MVP）

```javascript
// repositories/LocalChannelRepository.js
class LocalChannelRepository extends ChannelRepository {
  constructor() {
    super();
    this.data = require('/data/channels.json');
    this.index = null; // 延迟构建
  }

  async getById(id) {
    return this.data.find(item => item.id === id && !item.is_deleted) || null;
  }

  async search(keyword, filters = {}, pagination = { page: 1, pageSize: 20 }) {
    // 1. 过滤
    let results = this.data.filter(item => !item.is_deleted);
    if (filters.category_l1) results = results.filter(i => i.category_l1 === filters.category_l1);
    if (filters.city_code) results = results.filter(i => i.city_code === filters.city_code);
    if (filters.status) results = results.filter(i => i.status === filters.status);

    // 2. 搜索（使用倒排索引）
    if (keyword) {
      const index = this._getIndex();
      const scoredResults = index.search(keyword, {
        fieldWeights: { name: 100, phone: 90, tags: 80, scope: 50, regulator: 40 },
        hotLevelField: 'hot_level'
      });
      // 与过滤结果取交集
      const filterIds = new Set(results.map(r => r.id));
      results = scoredResults.filter(r => filterIds.has(r.id));
    } else {
      // 无关键词时按热度排序
      results.sort((a, b) => b.hot_level - a.hot_level);
    }

    // 3. 分页
    const total = results.length;
    const start = (pagination.page - 1) * pagination.pageSize;
    const list = results.slice(start, start + pagination.pageSize);

    return { list, total };
  }

  async getByCategory(categoryL1, categoryL2 = null) {
    return this.data.filter(item =>
      !item.is_deleted &&
      item.category_l1 === categoryL1 &&
      (!categoryL2 || item.category_l2 === categoryL2)
    ).sort((a, b) => b.hot_level - a.hot_level);
  }

  async getHot(limit = 10) {
    return this.data
      .filter(item => !item.is_deleted && item.is_hot !== false)
      .sort((a, b) => b.hot_level - a.hot_level)
      .slice(0, limit);
  }

  async getByIds(ids) {
    const idSet = new Set(ids);
    return this.data.filter(item => idSet.has(item.id) && !item.is_deleted);
  }

  async getAll() {
    return this.data.filter(item => !item.is_deleted);
  }

  _getIndex() {
    if (!this.index) {
      this.index = new InvertedIndex();
      this.data.forEach(item => {
        this.index.addDocument(item.id, item, {
          name: 100, phone: 90, tags: 80, scope: 50, regulator: 40, legal_basis: 30
        });
      });
    }
    return this.index;
  }
}
```

#### 6.2.3 远程实现（V3.0预留）

```javascript
// repositories/RemoteChannelRepository.js
class RemoteChannelRepository extends ChannelRepository {
  constructor(apiBaseUrl, apiKey) {
    super();
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
  }

  async getById(id) {
    const res = await wx.request({
      url: `${this.apiBaseUrl}/channels/${id}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return res.data;
  }

  async search(keyword, filters = {}, pagination = {}) {
    const res = await wx.request({
      url: `${this.apiBaseUrl}/channels/search`,
      method: 'GET',
      data: { keyword, ...filters, ...pagination },
      header: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return res.data;
  }
  // ... 其他方法类似，调用后端API
}
```

**切换方式**：在app.js中通过配置切换：

```javascript
// app.js
const ChannelRepository = require('./repositories/LocalChannelRepository');
// V3.0切换为：const ChannelRepository = require('./repositories/RemoteChannelRepository');

App({
  globalData: {
    repositories: {
      channel: new ChannelRepository(),
      // script: new ScriptRepository(),
      // platform: new PlatformRepository()
    }
  }
});
```

Service层代码完全不需要改动，因为依赖的是Repository接口。

### 6.3 Service 层设计

#### 6.3.1 SearchService

```javascript
// services/SearchService.js
class SearchService {
  constructor(channelRepo, scriptRepo, platformRepo, config) {
    this.channelRepo = channelRepo;
    this.scriptRepo = scriptRepo;
    this.platformRepo = platformRepo;
    this.config = config;
    this.searchHistory = []; // 内存缓存，持久化到本地存储
  }

  /**
   * 统一搜索（跨渠道/话术/平台）
   */
  async search(keyword, options = {}) {
    const { type = 'all', page = 1, pageSize = 20 } = options;

    // 1. 同义词扩展
    const expandedKeyword = this._expandSynonyms(keyword);

    // 2. 并行搜索
    const tasks = [];
    if (type === 'all' || type === 'channel') {
      tasks.push(this.channelRepo.search(expandedKeyword, {}, { page, pageSize }).then(r => ({ type: 'channel', ...r })));
    }
    if (type === 'all' || type === 'script') {
      tasks.push(this.scriptRepo.search(expandedKeyword, {}, { page, pageSize }).then(r => ({ type: 'script', ...r })));
    }
    if (type === 'all' || type === 'platform') {
      tasks.push(this.platformRepo.search(expandedKeyword, {}, { page, pageSize }).then(r => ({ type: 'platform', ...r })));
    }

    const results = await Promise.all(tasks);

    // 3. 合并排序（渠道>话术>平台，同类型按得分）
    const merged = this._mergeAndSort(results);

    // 4. 记录搜索历史
    this._recordHistory(keyword);

    return {
      list: merged.slice(0, pageSize),
      total: merged.length,
      byType: results.reduce((acc, r) => { acc[r.type] = r.total; return acc; }, {})
    };
  }

  /**
   * 搜索联想
   */
  async suggest(keyword, limit = 8) {
    // 从渠道名称、标签、话术场景名中前缀匹配
    // ...
  }

  _expandSynonyms(keyword) {
    // 遍历config.synonyms，替换同义词
    let expanded = keyword;
    for (const [from, to] of Object.entries(this.config.synonyms)) {
      expanded = expanded.replace(new RegExp(from, 'g'), to);
    }
    return expanded;
  }

  _mergeAndSort(results) {
    // 渠道优先级 > 话术 > 平台
    const typePriority = { channel: 3, script: 2, platform: 1 };
    return results
      .flatMap(r => r.list.map(item => ({ ...item, _type: r.type, _priority: typePriority[r.type] })))
      .sort((a, b) => (b._priority * 1000 + b._score) - (a._priority * 1000 + a._score));
  }

  _recordHistory(keyword) {
    // 去重、限制20条、持久化
    // ...
  }
}
```

### 6.4 页面路由设计

| 页面路径 | 页面名称 | 入口 | 参数 |
|----------|----------|------|------|
| pages/home/index | 首页 | 底部导航 | — |
| pages/search/index | 搜索页 | 首页搜索框 | keyword（可选） |
| pages/search/result | 搜索结果页 | 搜索提交 | keyword, type |
| pages/channel/detail | 渠道详情页 | 搜索结果/分类/收藏 | id |
| pages/script/list | 话术列表页 | 底部导航 | — |
| pages/script/detail | 话术详情页 | 首页高频话术/搜索/渠道关联 | id |
| pages/category/index | 分类浏览页 | 底部导航/首页分类 | category_l1（可选） |
| pages/mine/index | 我的页 | 底部导航 | — |
| pages/toolbox/schedule | 跟进时间表 | 我的页→工具箱 | — |
| pages/toolbox/hotlines | 热线变更速查 | 我的页→工具箱 | — |
| pages/toolbox/template | 通用投诉信 | 我的页→工具箱 | — |
| pages/toolbox/enterprise | 企业查询指引 | 我的页→工具箱 | — |
| pages/about/index | 关于页 | 我的页→关于 | — |
| 【预留】pages/ai-assistant/index | AI助手 | 首页AI入口（V2.0） | — |
| 【预留】pages/complaint-ticket/list | 投诉跟踪列表 | 我的页→我的投诉（V2.0） | — |
| 【预留】pages/complaint-ticket/detail | 投诉跟踪详情 | 投诉跟踪列表 | id |
| 【预留】pages/evidence/list | 证据管理 | 话术详情→证据（V2.0） | — |
| 【预留】pages/community/index | 社区首页 | 底部导航第5tab（V2.5） | — |

### 6.5 存储封装

```javascript
// utils/storage.js
/**
 * 小程序本地存储封装
 * - 统一key前缀，避免冲突
 * - JSON序列化/反序列化
 * - 异常处理（存储满、配额超限）
 * - 过期机制（可选）
 */
class Storage {
  constructor(prefix = 'wqt_') {
    this.prefix = prefix;
  }

  set(key, value, expireAt = null) {
    try {
      const data = { value, expireAt, updatedAt: Date.now() };
      wx.setStorageSync(this.prefix + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[Storage] set error:', e);
      // 存储满时清理最旧的数据
      this._cleanup();
      try {
        wx.setStorageSync(this.prefix + key, JSON.stringify({ value, expireAt, updatedAt: Date.now() }));
        return true;
      } catch (e2) {
        return false;
      }
    }
  }

  get(key, defaultValue = null) {
    try {
      const raw = wx.getStorageSync(this.prefix + key);
      if (!raw) return defaultValue;
      const data = JSON.parse(raw);
      // 过期检查
      if (data.expireAt && Date.now() > data.expireAt) {
        this.remove(key);
        return defaultValue;
      }
      return data.value;
    } catch (e) {
      return defaultValue;
    }
  }

  remove(key) {
    try {
      wx.removeStorageSync(this.prefix + key);
    } catch (e) { /* ignore */ }
  }

  clearAll() {
    // 只清除带前缀的key
    const info = wx.getStorageInfoSync();
    info.keys.forEach(k => {
      if (k.startsWith(this.prefix)) {
        wx.removeStorageSync(k);
      }
    });
  }

  _cleanup() {
    // 按更新时间排序，删除最旧的30%数据
    // ...
  }
}

module.exports = new Storage('wqt_');
```

---

## 7. 扩展性设计

### 7.1 V2.0 升级路径（云开发+AI）

#### 7.1.1 架构变更

```
MVP架构                          V2.0架构
─────────                        ─────────
小程序本地JSON        ──保持──▶  小程序本地JSON（基础数据）
本地倒排索引          ──保持──▶  本地倒排索引（基础搜索）
本地存储              ──扩展──▶  本地存储 + 云数据库
无后端                ──新增──▶  微信云开发（云函数/云数据库/云存储）
无AI                  ──新增──▶  大模型API（豆包/通义千问）
无用户                ──新增──▶  微信登录（openid）
```

#### 7.1.2 各模块升级方式

| 模块 | MVP实现 | V2.0升级 | 代码改动量 |
|------|---------|----------|-----------|
| 渠道数据 | LocalChannelRepository | 保持本地（基础数据）+ 云数据库（用户自定义渠道） | 新增CloudChannelRepository，Service层注入 |
| 搜索 | 本地倒排索引 | 保持本地（基础搜索）+ 云函数搜索（用户数据/复杂查询） | SearchService增加远程搜索分支 |
| 收藏 | 本地存储 | 本地+云数据库同步（多设备） | FavoriteService增加云同步 |
| 用户 | 无 | 微信登录，user表启用 | 新增UserService，登录页 |
| AI问答 | 功能开关关闭 | AIService实现，调用大模型API | 新增ai-assistant页面，首页入口启用 |
| 投诉跟踪 | 表结构预留，功能关闭 | ComplaintService实现，云数据库存储 | 新增complaint-ticket页面，工具箱入口启用 |
| 证据管理 | 表结构预留，功能关闭 | EvidenceService实现，云存储存储文件 | 新增evidence页面，话术详情入口启用 |
| 效力评级 | 字段预留，数据为空 | 从用户反馈聚合计算，渠道详情展示 | ChannelService增加评级计算逻辑 |

#### 7.1.3 数据迁移

```
MVP本地数据 → V2.0云数据库迁移方案：
1. 用户首次登录时，检测本地存储中的收藏/历史数据
2. 调用云函数 migrateUserData，将本地数据上传到云数据库
3. 上传成功后，本地数据保留作为缓存
4. 后续操作优先读写云数据库，本地作为离线缓存
5. 冲突策略：云端优先（云数据库为权威数据源）
```

### 7.2 V3.0 升级路径（独立后端+开放API）

#### 7.2.1 架构变更

```
V2.0架构                          V3.0架构
─────────                          ─────────
微信云开发            ──迁移──▶  独立后端（Node.js + MySQL + Elasticsearch）
云数据库              ──迁移──▶  MySQL + Redis
云存储                ──迁移──▶  对象存储（OSS/COS）
云函数                ──迁移──▶  微服务（Docker + K8s）
大模型API直连         ──优化──▶  后端代理大模型API（统一鉴权/限流/缓存）
无开放API             ──新增──▶  RESTful API + API Key管理
无CMS                 ──新增──▶  内容管理后台（运营人员Web端）
无爬虫                ──新增──▶  数据自动更新爬虫（监控政府官网变更）
```

#### 7.2.2 Repository切换

MVP/V2.0使用LocalChannelRepository，V3.0切换为RemoteChannelRepository：

```javascript
// app.js（V3.0）
const RemoteChannelRepository = require('./repositories/RemoteChannelRepository');

App({
  globalData: {
    repositories: {
      channel: new RemoteChannelRepository('https://api.weiquantong.com/v1', API_KEY),
      // 其他Repository类似切换
    }
  }
});
```

**Service层、View层代码零改动**，因为依赖的是Repository接口。

#### 7.2.3 搜索升级

本地倒排索引 → Elasticsearch：

```javascript
// V3.0的RemoteChannelRepository.search()
async search(keyword, filters = {}, pagination = {}) {
  const res = await wx.request({
    url: `${this.apiBaseUrl}/search`,
    method: 'POST',
    data: {
      index: 'channels',
      query: {
        bool: {
          must: [{ multi_match: { query: keyword, fields: ['name^3', 'tags^2', 'scope'] } }],
          filter: this._buildFilters(filters)
        }
      },
      from: (pagination.page - 1) * pagination.pageSize,
      size: pagination.pageSize,
      sort: [{ _score: 'desc' }, { hot_level: 'desc' }]
    }
  });
  return this._parseESResponse(res.data);
}
```

### 7.3 数据规模演进策略（上千场景应对方案）

#### 7.3.1 规模预测与瓶颈分析

| 数据规模 | 原始数据 | 预构建索引 | 总计 | 主包2MB | 内存占用 | 搜索性能 |
|----------|----------|-----------|------|---------|----------|----------|
| 128文档（MVP） | 143KB | 325KB | 458KB | ✅ | ~20MB | <10ms |
| 500场景 | ~3.5MB | ~5MB | ~8.5MB | ❌ 超主包 | ~50MB | <20ms |
| 1000场景+法规 | ~7MB | ~10MB | ~17MB | ❌ 严重超限 | ~80MB | <30ms |
| 2000场景+法规 | ~14MB | ~20MB | ~34MB | ❌ 超整包20MB | ~120MB | <50ms |

**三大瓶颈**：
1. **包体积**：主包硬限制2MB，1000场景光数据就17MB
2. **内存**：全量加载+索引在低端机可能占80MB+，有被系统回收风险
3. **法律法规重复**：1000个场景可能反复引用同一部法律，全文存1000遍是纯浪费

#### 7.3.2 三层数据架构（核心解决方案）

```
┌─────────────────────────────────────────────────────────┐
│  第一层：搜索索引（全量，常驻内存）                        │
│  只存 term → [docId, fieldIdx, weight]                   │
│  1000场景约 3-5MB，gzip后 1-2MB                          │
│  搜索<20ms，不需要加载详情数据                             │
│  文件：search_index.json + suggest_trie.json              │
├─────────────────────────────────────────────────────────┤
│  第二层：场景详情（按需加载，按一级分类分片）               │
│  channels_01_基础民生.json ~ channels_N_政务司法.json     │
│  点击搜索结果时才加载对应分类的详情                        │
│  已浏览的缓存到本地存储（wx.setStorageSync）              │
│  文件：channels_XX_分类名.json + channels_index.json      │
├─────────────────────────────────────────────────────────┤
│  第三层：法律法规库（独立去重，按需加载）                   │
│  laws.json：每部法律只存一份，有唯一ID                     │
│  场景表只存 law_ids: ["law_001", "law_023"]              │
│  详情页展示时才加载引用的法律全文                           │
│  1000场景可能只引用50-100部不同法律                        │
│  文件：laws.json                                           │
└─────────────────────────────────────────────────────────┘
```

#### 7.3.3 法律法规去重机制

| 做法 | 体积（1000场景） | 搜索质量 |
|------|-------------------|----------|
| ❌ 每个场景存法律全文 | 1000×5KB=5MB | 法律条文重复度高，索引噪音大 |
| ✅ 法律去重+场景引用ID | 100部×5KB=500KB | 只索引法律名称，不索引条文 |
| ✅ 法律名称进索引，全文不进 | 索引+100KB | 用户搜"消费者权益保护法"能命中 |

**实现方式**（转换脚本已内置）：
- `LawExtractor`类从legal_basis字段自动提取法律名称（支持《》、"根据XX法"等多种表述）
- 常见法律简称自动标准化（"消法"→"中华人民共和国消费者权益保护法"）
- 去重后分配唯一ID（law_001, law_002...）
- 场景表更新law_ids字段，不存法律全文
- laws.json按引用次数排序，方便展示"最常用法律"

**搜索策略**：
- 用户搜"快递丢了"→匹配场景→详情页展示该场景引用的法律条文
- 用户搜"消费者权益保护法"→匹配法律名称→展示引用了该法的所有场景
- 法律条文不进倒排索引，避免"的""了""是"等高频字污染索引

#### 7.3.4 数据分片加载机制

**触发条件**：渠道数超过300条时，转换脚本自动按一级分类分片输出。

**输出结构**：
```
data/
├── search_index.json          (全量索引，常驻)
├── suggest_trie.json          (联想树，常驻)
├── laws.json                  (法律法规，按需)
├── channels_index.json        (分片索引: [{shard, category, count}])
├── channels_01_基础民生.json  (分片1)
├── channels_02_金融消费.json  (分片2)
├── channels_03_政务司法.json  (分片3)
├── scripts.json               (话术，全量，数量少)
├── config.json
├── categories.json
└── _manifest.json
```

**小程序端加载策略**：
1. 启动时加载search_index.json + suggest_trie.json + config.json（约2MB）
2. 搜索时只查索引，得到docId列表
3. 点击搜索结果时，根据docId所属分类，按需加载对应channels_XX.json
4. 已加载的分片缓存在内存，已浏览的详情缓存到本地存储
5. 热门分类（基础民生、金融消费）预加载，冷门分类按需加载

**体积估算（1000场景）**：
- 索引层：search_index(3MB) + suggest_trie(1MB) = 4MB → gzip后1.3MB
- 详情层：10个分片，每个约700KB → 首屏只加载1-2个分片
- 法律层：laws.json约500KB → 按需加载
- 启动加载：约2MB（索引+配置+热门分片），符合主包限制

#### 7.3.5 分阶段演进路线

| 阶段 | 场景数 | 数据架构 | 搜索方式 | 后端 |
|------|--------|----------|----------|------|
| MVP | <300 | 全量JSON+预构建索引 | 本地倒排索引 | 无 |
| V1.5 | 300-500 | 自动分片+法律法规去重 | 本地倒排索引+按需加载 | 无 |
| V2.0 | 500-2000 | 分片+云数据库同步 | 本地索引兜底+云函数搜索 | 微信云开发 |
| V3.0 | 2000+ | 独立后端+ES | API搜索+离线缓存 | Node.js+Elasticsearch |

**V2.0云开发过渡方案**：
- 数据主存储迁移到云数据库（支持运营人员后台直接编辑，不用发版）
- 小程序端保留本地索引作为离线兜底（热门500条）
- 搜索优先走云函数（服务端可以用更复杂的分词和排序），网络失败时降级到本地索引
- 法律法规全量存云数据库，小程序端只缓存常用法律

**V3.0独立后端方案**：
- Elasticsearch承担全部搜索（支持拼音搜索、纠错、相关推荐）
- MySQL存储结构化数据，Redis缓存热门搜索结果
- 小程序端只做展示层，数据全部走API
- 离线模式只保留高频100条数据（应急使用）

#### 7.3.6 转换脚本的扩展性支持

当前convert.py已内置以下能力，无需修改即可支持规模增长：

| 能力 | 触发条件 | 说明 |
|------|----------|------|
| 法律法规自动提取去重 | 默认开启 | LawExtractor类，支持50+常见法律简称映射 |
| 数据自动分片 | 渠道数>300 | 按一级分类分片，输出channels_index.json |
| 预构建索引 | 默认开启 | IndexBuilder类，压缩格式（数字索引代替字符串） |
| 搜索联想Trie树 | 默认开启 | 从名称/标签/关键词构建 |
| 数据校验 | 默认开启 | 必填/枚举/外键/格式校验 |
| 增量更新(diff) | --diff参数 | 新旧对比，输出新增/修改/删除/冲突报告 |

### 7.4 功能开关机制

所有V2.0+功能通过config.json的feature_flags控制：

```javascript
// utils/featureFlag.js
class FeatureFlag {
  constructor(config) {
    this.flags = config.feature_flags || {};
  }

  isEnabled(featureName) {
    return !!this.flags[featureName];
  }

  // 页面中使用
  // if (featureFlag.isEnabled('ai_assistant')) {
  //   显示AI入口
  // }
}
```

**MVP**：所有feature_flag=false，入口隐藏
**V2.0**：ai_assistant=true, complaint_ticket=true, evidence_manager=true, user_login=true
**V2.5**：community=true, multi_city=true
**V3.0**：payment=true（如需要）

---

## 8. 性能设计

### 8.1 性能目标

| 指标 | 目标值 | 测量方式 |
|------|--------|----------|
| 冷启动时间 | < 2s（中低端真机） | 微信开发者工具性能面板 + 真机测试 |
| 搜索响应 | < 500ms（P95），< 100ms（P50） | 50个典型query计时 |
| 页面切换 | < 300ms | 真机体验 |
| 索引构建 | < 200ms | 启动时异步构建计时 |
| 主包体积 | < 1MB | 微信开发者工具体积分析 |
| 数据文件体积 | < 500KB（未压缩），< 150KB（gzip） | 文件大小 |
| 内存占用 | < 100MB | 真机性能监控 |
| 首屏渲染 | < 1s | 从启动到首页可交互 |

### 8.2 启动性能优化

| 优化项 | 措施 | 预期收益 |
|--------|------|----------|
| 懒加载 | 非首页页面使用分包加载 | 主包体积减小30% |
| 异步索引 | 搜索索引在onLaunch后异步构建，不阻塞首屏 | 首屏渲染加快200ms |
| 数据预加载 | 首页需要的热门渠道/话术在启动时同步加载 | 首页无加载等待 |
| 缓存策略 | 搜索结果/渠道详情缓存到内存 | 重复访问<50ms |
| 图片优化 | 图标用SVG或字体图标，不使用大图 | 包体积减小，渲染加快 |

### 8.3 搜索性能优化

| 优化项 | 措施 |
|--------|------|
| 索引预构建 | 启动时构建一次，全局复用，不重复构建 |
| 防抖 | 搜索联想输入防抖300ms，避免频繁计算 |
| 分页 | 搜索结果分页加载，每页20条，避免一次性渲染 |
| 虚拟列表 | 长列表使用虚拟滚动（如数据量增长到1000+） |
| 缓存 | 相同query的搜索结果缓存5分钟，避免重复计算 |
| Web Worker | 【可选】索引构建和搜索计算放到Worker线程，不阻塞UI（V2.0数据量大时） |

### 8.4 包体积优化

| 优化项 | 措施 | 预期体积 |
|--------|------|----------|
| 数据压缩 | JSON去除空格换行（minify） | 190KB → 120KB |
| 无第三方库 | 不引入任何npm包，全部自研 | 0KB额外依赖 |
| 图标内联 | SVG图标内联到WXSS，不单独存文件 | 减少HTTP请求 |
| 代码压缩 | 微信开发者工具上传时自动压缩 | JS体积减小40% |
| 分包加载 | 非核心页面放到分包 | 主包<1MB |

**预估主包体积构成**：
```
业务代码 (JS/WXML/WXSS):  ~300KB
数据文件 (JSON):           ~120KB
图标资源:                  ~20KB
其他:                      ~10KB
─────────────────────────────
总计:                      ~450KB（远低于1MB目标）
```

### 8.5 离线可用策略

| 数据类型 | 存储方式 | 离线可用 |
|----------|----------|----------|
| 渠道/话术/平台数据 | 打包进小程序（JSON） | ✅ 完全离线 |
| 分类/配置/时间表 | 打包进小程序（JSON） | ✅ 完全离线 |
| 收藏/历史 | 本地存储（wx.setStorageSync） | ✅ 完全离线 |
| 搜索索引 | 内存构建（启动时从JSON构建） | ✅ 完全离线 |
| 【V2.0】用户数据 | 云数据库 + 本地缓存 | ⚠️ 有网络时同步，离线时读缓存 |
| 【V2.0】AI问答 | 大模型API | ❌ 需要网络（离线时提示"AI功能需要网络"） |

---

## 9. 安全与合规设计

### 9.1 数据安全

| 风险 | 措施 |
|------|------|
| 本地数据篡改 | 数据文件打包时生成校验和（SHA256），启动时校验，篡改则降级 |
| 用户隐私 | MVP不收集任何个人信息，无用户ID，无手机号，无位置 |
| 证据文件安全 | 【V2.0】云存储文件加密存储，访问需鉴权，敏感信息自动脱敏提示 |
| 通信安全 | 【V2.0】所有API调用使用HTTPS，大模型API通过后端代理，不在前端存储API Key |
| 本地存储清理 | 提供"清除缓存"功能，用户可主动清除所有本地数据 |

### 9.2 内容合规

| 合规项 | 措施 |
|--------|------|
| 非官方声明 | 关于页显著展示"本工具为便民信息汇总，非政府官方应用" |
| 免责声明 | 所有话术模板页底部展示"仅供参考，不构成法律意见" |
| 依法维权 | 话术模板强调"如实陈述，不得捏造事实"，跟进时间表强调"依法维权、理性维权" |
| 信息来源 | 所有渠道标注信息来源和验证日期 |
| 紧急电话 | 110/119/120拨打二次确认，防止误触 |
| 反诈提示 | 详情页提示"所有官方投诉渠道均免费，要求转账的都是诈骗"，96110入口常驻 |
| UGC审核 | 【V2.5】社区内容先审后发，AI初审+人工复审，24小时巡查 |

### 9.3 小程序审核合规

| 审核项 | 合规措施 |
|--------|----------|
| 类目选择 | 选择"工具-信息查询"类目，不选择"医疗""金融""法律"等需资质类目 |
| 名称合规 | 小程序名称不含"官方""政府""政务"等误导性词汇 |
| 功能合规 | 不提供在线投诉提交（仅提供渠道信息和跳转/复制），不提供在线法律服务 |
| 隐私政策 | MVP无个人信息收集，无需隐私政策；V2.0接入登录时需补充隐私政策 |
| 内容审核 | 所有内容来源于政府公开渠道，无UGC（MVP），无违法违规内容 |

---

## 10. 工程化

### 10.1 目录结构

```
维权通/
├── miniprogram/                    # 小程序前端代码
│   ├── app.js                      # 入口文件
│   ├── app.json                    # 全局配置（页面路由/窗口/tabBar）
│   ├── app.wxss                    # 全局样式
│   ├── pages/                      # 页面
│   │   ├── home/
│   │   ├── search/
│   │   ├── channel-detail/
│   │   ├── script-list/
│   │   ├── script-detail/
│   │   ├── category/
│   │   ├── mine/
│   │   ├── toolbox/
│   │   ├── about/
│   │   └── _reserved/              # 预留页面（V2.0+）
│   │       ├── ai-assistant/
│   │       ├── complaint-ticket/
│   │       └── evidence/
│   ├── services/                   # 服务层
│   │   ├── SearchService.js
│   │   ├── ChannelService.js
│   │   ├── ScriptService.js
│   │   ├── FavoriteService.js
│   │   ├── HistoryService.js
│   │   ├── ConfigService.js
│   │   └── _reserved/              # 预留服务（V2.0+）
│   │       ├── AIService.js
│   │       ├── ComplaintService.js
│   │       └── UserService.js
│   ├── repositories/               # 数据访问层
│   │   ├── ChannelRepository.js    # 接口
│   │   ├── LocalChannelRepository.js
│   │   ├── ScriptRepository.js
│   │   ├── PlatformRepository.js
│   │   └── _reserved/
│   │       └── RemoteChannelRepository.js
│   ├── data/                       # 数据文件（JSON）
│   │   ├── channels.json
│   │   ├── scripts.json
│   │   ├── platforms.json
│   │   ├── categories.json
│   │   ├── schedule.json
│   │   ├── hotlines.json
│   │   ├── enterprise_query.json
│   │   ├── config.json
│   │   └── _manifest.json
│   ├── components/                 # 通用组件
│   │   ├── channel-card/
│   │   ├── script-card/
│   │   ├── search-bar/
│   │   ├── empty-state/
│   │   └── section-header/
│   ├── utils/                      # 工具函数
│   │   ├── search-index.js         # 倒排索引
│   │   ├── tracker.js              # 埋点
│   │   ├── storage.js              # 存储封装
│   │   ├── synonym.js              # 同义词典
│   │   ├── validator.js            # 数据校验
│   │   └── util.js                 # 通用工具
│   └── images/                     # 图片资源（图标）
│
├── tools/                          # 数据转换工具（Python）
│   ├── extract.py                  # Word→Excel提取
│   ├── build.py                    # Excel→JSON构建+校验
│   ├── schemas/                    # JSON Schema定义
│   │   ├── channel.schema.json
│   │   ├── script.schema.json
│   │   └── platform.schema.json
│   ├── templates/                  # Excel模板
│   │   └── 维权通数据_模板.xlsx
│   └── requirements.txt            # Python依赖
│
├── docs/                           # 文档
│   ├── PRD.md                      # 产品需求文档
│   ├── TDD.md                      # 本文档（技术设计文档）
│   └── 远景规划.md
│
├── .eslintrc.js                    # ESLint配置
├── .prettierrc                     # Prettier配置
├── project.config.json             # 微信开发者工具项目配置
└── README.md                       # 项目说明
```

### 10.2 代码规范

| 规范项 | 规则 |
|--------|------|
| 命名 | 文件名/变量名：camelCase；组件名：PascalCase；常量：UPPER_SNAKE_CASE |
| 缩进 | 2空格 |
| 引号 | 单引号 |
| 分号 | 必须加分号 |
| 注释 | 公共方法必须有JSDoc注释，复杂逻辑必须行内注释 |
| 函数长度 | 单函数不超过50行，超过则拆分 |
| 文件长度 | 单文件不超过300行，超过则拆分模块 |
| 魔法数字 | 禁止魔法数字，必须定义为常量 |
| 嵌套层级 | 回调嵌套不超过3层，使用Promise/async-await |

**ESLint配置**：使用eslint:recommended + 自定义规则，Prettier统一格式化。

### 10.3 Git工作流

| 分支 | 用途 | 命名 |
|------|------|------|
| main | 生产分支，保护分支，仅通过PR合并 | main |
| develop | 开发分支，日常开发合并到这里 | develop |
| feature/* | 功能分支，从develop切出 | feature/search-optimization |
| fix/* | Bug修复分支 | fix/phone-format-error |
| release/* | 发布分支 | release/v1.0.0 |
| hotfix/* | 线上紧急修复 | hotfix/crash-on-launch |

**提交信息规范**：Conventional Commits
- `feat: 新增搜索联想功能`
- `fix: 修复电话号码格式校验错误`
- `docs: 更新技术文档`
- `refactor: 重构Repository层`
- `perf: 优化索引构建性能`
- `chore: 更新依赖`

### 10.4 CI/CD（V2.0引入）

```
代码推送 → GitHub Actions
  ├── 代码检查（ESLint）
  ├── 单元测试（Jest）
  ├── 数据校验（build.py --validate-only）
  ├── 构建（微信开发者工具CLI）
  └── 上传（微信小程序CI上传，体验版）
       ↓
  人工审核 → 发布生产版
```

**MVP阶段**：使用微信开发者工具手动上传，CI/CD在V2.0引入。

---

## 11. 测试策略

### 11.1 测试分层

| 测试类型 | 范围 | 工具 | 覆盖率目标 |
|----------|------|------|-----------|
| 单元测试 | 工具函数、Service层、Repository层、倒排索引 | Jest（V2.0引入，MVP手动测试） | 80% |
| 集成测试 | 页面交互、数据流、搜索端到端 | 微信开发者工具自动化测试 | 核心路径100% |
| 性能测试 | 启动时间、搜索响应、包体积、内存 | 微信开发者工具性能面板 + 真机 | 达标 |
| 兼容性测试 | 微信版本、iOS/Android版本、屏幕尺寸 | 真机测试矩阵 | 主流设备全覆盖 |
| 数据校验 | JSON Schema、外键、格式、一致性 | build.py --validate | 100%通过 |
| 安全测试 | 数据校验、XSS、存储安全 | 手动+工具 | 无高危漏洞 |
| 用户验收 | 核心场景走查 | 真人测试 | 5个核心场景全通过 |

### 11.2 搜索测试用例（50个典型query）

| 类别 | 测试query | 预期首条结果 | 预期类型 |
|------|-----------|-------------|----------|
| 快递 | 快递丢了 | 国家邮政局申诉平台 | 渠道 |
| 快递 | 快递破损 | 国家邮政局申诉平台 | 渠道 |
| 快递 | 12305 | 国家邮政局申诉平台 | 渠道 |
| 快递 | 快递丢失话术 | 快递丢失/破损/延误 | 话术 |
| 电信 | 运营商乱扣费 | 工信部电信用户申诉受理中心 | 渠道 |
| 电信 | 话费多扣了 | 工信部电信用户申诉受理中心 | 渠道 |
| 电信 | 12300 | 工信部电信用户申诉受理中心 | 渠道 |
| 消费 | 商家不退款 | 全国12315平台 | 渠道 |
| 消费 | 买到假货 | 全国12315平台 | 渠道 |
| 消费 | 12315 | 全国12315平台 | 渠道 |
| 金融 | 银行误导销售 | 12378银行保险消费者投诉维权热线 | 渠道 |
| 金融 | 保险骗人 | 12378银行保险消费者投诉维权热线 | 渠道 |
| 金融 | 12378 | 12378银行保险消费者投诉维权热线 | 渠道 |
| 物业 | 物业不作为 | 12345政务服务便民热线（住建/物业投诉） | 渠道 |
| 物业 | 物业乱收费 | 12345政务服务便民热线（住建/物业投诉） | 渠道 |
| 劳动 | 老板欠薪 | 全国根治欠薪线索反映平台 | 渠道 |
| 劳动 | 社保没交 | 全国12333人力资源和社会保障服务热线 | 渠道 |
| 劳动 | 12333 | 全国12333人力资源和社会保障服务热线 | 渠道 |
| 医疗 | 医院乱收费 | 全国12320卫生热线 | 渠道 |
| 医疗 | 医疗纠纷 | 医疗纠纷人民调解委员会 | 渠道 |
| 环保 | 噪音扰民 | 12345政务服务便民热线（环保举报） | 渠道 |
| 环保 | 环境污染 | 12345政务服务便民热线（环保举报） | 渠道 |
| 诈骗 | 电信诈骗 | 96110全国反诈预警劝阻专线 | 渠道 |
| 诈骗 | 被骗钱了 | 96110全国反诈预警劝阻专线 | 渠道 |
| 诈骗 | 96110 | 96110全国反诈预警劝阻专线 | 渠道 |
| 个人信息 | 个人信息泄露 | 12377违法和不良信息举报中心 | 渠道 |
| 个人信息 | 骚扰电话 | 12321网络不良与垃圾信息举报受理中心 | 渠道 |
| 交通 | 出租车拒载 | 12328交通运输服务监督热线 | 渠道 |
| 交通 | 网约车坑人 | 12328交通运输服务监督热线 | 渠道 |
| 交通 | 航班取消 | 民航服务质量监督平台（12326） | 渠道 |
| 政务 | 基层不作为 | 国务院"互联网+督查"平台 | 平台 |
| 政务 | 当官的不管 | 国务院"互联网+督查"平台 | 平台 |
| 政务 | 12345 | 12345政务服务便民热线 | 渠道 |
| 纪检 | 公职人员违纪 | 中央纪委国家监委举报网站（12388） | 渠道 |
| 纪检 | 12388 | 中央纪委国家监委举报网站（12388） | 渠道 |
| 公积金 | 公积金没交 | 12329公积金举报 | 渠道 |
| 公积金 | 12329 | 12329公积金举报 | 渠道 |
| 税务 | 偷税漏税 | 全国12366纳税服务热线 | 渠道 |
| 税务 | 不开发票 | 全国12366纳税服务热线 | 渠道 |
| 教育 | 学校乱收费 | 教育部统一监督举报电话 | 渠道 |
| 食品 | 食品安全 | 全国12315平台（食品安全投诉举报） | 渠道 |
| 药品 | 假药 | 全国12315平台（药品医疗器械投诉） | 渠道 |
| 旅游 | 导游强制消费 | 12345政务服务便民热线（旅游投诉） | 渠道 |
| 住建 | 房子质量问题 | 12345政务服务便民热线（住建/物业投诉） | 渠道 |
| 城管 | 城管暴力执法 | 12342城管举报 | 渠道 |
| 安全生产 | 消防通道堵塞 | 96119消防举报 | 渠道 |
| 无结果 | 外星人绑架 | 无结果引导页 | — |

**验收标准**：50个query中，首条命中率≥80%（≥40个），响应时间<500ms。

### 11.3 数据校验测试

| 校验项 | 测试方法 | 通过标准 |
|--------|----------|----------|
| JSON Schema | build.py --validate | 0错误 |
| 必填字段 | 遍历所有记录检查必填字段 | 100%非空 |
| ID唯一性 | 检查所有表的ID是否重复 | 无重复 |
| 外键关联 | related_channel_id/merged_to指向的ID是否存在 | 全部存在 |
| 枚举值 | status/city_code/channel_type是否在枚举内 | 全部合法 |
| 电话格式 | phone字段是否匹配电话正则 | ≥95%匹配 |
| 网址格式 | website字段是否匹配URL正则 | ≥90%匹配 |
| 标签数量 | 每个渠道tags≥3个 | ≥95%达标 |
| 数据版本 | config.json的data_version是否与_manifest.json一致 | 一致 |
| 校验和 | 所有JSON文件的SHA256是否与_manifest.json一致 | 一致 |

### 11.4 兼容性测试矩阵

| 维度 | 测试范围 |
|------|----------|
| 微信版本 | 8.0（最低）、最新版 |
| iOS版本 | iOS 12（最低）、iOS 15、iOS 17、最新版 |
| Android版本 | Android 8（最低）、Android 10、Android 13、最新版 |
| 屏幕尺寸 | iPhone SE（小屏）、iPhone 14、iPhone 14 Pro Max、安卓主流（6.5寸）、iPad（大屏） |
| 网络环境 | WiFi、4G、5G、弱网（3G模拟）、断网（离线功能） |
| 设备性能 | 高端机（iPhone 15 Pro/骁龙8 Gen3）、中端机、低端机（3年前机型） |

---

## 12. 上线与发布

### 12.1 发布计划

| 阶段 | 内容 | 时间 | 负责人 |
|------|------|------|--------|
| 开发完成 | 所有功能开发完成，自测通过 | D+21 | 开发 |
| 功能测试 | 全功能测试，Bug修复 | D+21 ~ D+25 | 测试 |
| 性能测试 | 启动/搜索/包体积/内存测试优化 | D+23 ~ D+25 | 开发 |
| 兼容性测试 | 多设备多版本测试 | D+24 ~ D+26 | 测试 |
| 数据校验 | build.py全量校验，数据质量报告 | D+25 | 开发 |
| UI走查 | 设计走查，视觉细节调整 | D+25 ~ D+26 | 设计 |
| 体验版测试 | 上传体验版，内部测试 | D+26 | 全员 |
| 提交审核 | 提交微信小程序审核 | D+27 | 开发 |
| 审核反馈 | 处理审核反馈（如有） | D+27 ~ D+30 | 开发 |
| 正式发布 | 审核通过，发布生产版 | D+30 | 开发 |

**总周期**：约4周（含审核等待）

### 12.2 发布检查清单

- [ ] 所有P0/P1 Bug已修复
- [ ] 50个搜索query首条命中率≥80%
- [ ] 冷启动<2s，搜索响应<500ms
- [ ] 主包体积<1MB
- [ ] 数据校验100%通过
- [ ] 5个核心场景走查通过
- [ ] 兼容性测试通过（主流设备）
- [ ] 免责声明/关于页内容完整
- [ ] 紧急电话二次确认正常
- [ ] 收藏/历史功能正常
- [ ] 离线模式功能正常
- [ ] 小程序名称/简介合规
- [ ] 体验版内部测试通过
- [ ] 审核材料准备齐全

### 12.3 灰度发布策略

```
V1.0.0 正式发布 → 全量发布（MVP用户量小，不需要灰度）

V2.0+ 灰度策略：
1. 体验版 → 内部测试（10人）
2. 开发版 → 种子用户（100人，通过分享二维码）
3. 正式版 → 全量发布
4. 功能开关 → 新功能通过feature_flag灰度，先10%用户，观察1天，无问题则50%，再观察1天，全量
```

### 12.4 回滚方案

- 微信小程序发布后不可直接回滚到上一版本
- 回滚方案：紧急修复Bug后提交审核（加急审核），同时通过功能开关关闭有问题的功能
- 数据回滚：JSON数据打包在代码中，版本回滚时数据自动回滚（因为数据在代码包里）
- V2.0云数据库：数据变更需有备份，回滚时从备份恢复

---

## 13. 监控与运维

### 13.1 监控指标（V2.0引入）

| 指标类型 | 具体指标 | 告警阈值 |
|----------|----------|----------|
| 性能 | 冷启动时间P95 | >3s |
| 性能 | 搜索响应P95 | >1s |
| 性能 | JS错误率 | >1% |
| 性能 | 页面白屏率 | >0.5% |
| 业务 | 日活用户（DAU） | 环比下降>30% |
| 业务 | 搜索次数 | 环比下降>30% |
| 业务 | 搜索无结果率 | >20% |
| 业务 | 话术复制次数 | 环比下降>30% |
| 业务 | 收藏次数 | — |
| 技术 | API调用失败率（V2.0） | >5% |
| 技术 | 云函数执行超时率（V2.0） | >2% |
| 技术 | 云存储读写失败率（V2.0） | >1% |

### 13.2 埋点设计

**核心埋点事件**（详见PRD各模块埋点需求）：
- 页面浏览：home_view, search_result_view, channel_detail_view, script_detail_view...
- 搜索：search_submit, search_suggest_click, search_result_click, search_no_result...
- 渠道：channel_phone_click, channel_phone_call, channel_website_copy, channel_favorite...
- 话术：script_phone_copy, script_written_copy, script_favorite...
- 收藏：favorite_add, favorite_remove, favorite_item_click...
- 紧急：emergency_call_click, emergency_call_confirm...

**埋点实现**：
```javascript
// utils/tracker.js
class Tracker {
  constructor() {
    this.deviceId = this._getDeviceId();
    this.sessionId = this._generateSessionId();
    this.eventQueue = []; // 批量上报缓存
  }

  track(eventName, params = {}) {
    const event = {
      event: eventName,
      params,
      timestamp: Date.now(),
      device_id: this.deviceId,
      session_id: this.sessionId,
      app_version: getApp().globalData.version
    };

    // MVP：本地日志 + 本地存储（最多500条）
    console.log('[Track]', eventName, params);
    this._saveLocal(event);

    // 【V2.0】批量上报到后端
    // this.eventQueue.push(event);
    // if (this.eventQueue.length >= 10) this._flush();
  }

  _getDeviceId() {
    let id = wx.getStorageSync('wqt_device_id');
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      wx.setStorageSync('wqt_device_id', id);
    }
    return id;
  }
}
```

### 13.3 运维流程（V2.0）

| 事件 | 响应时间 | 处理流程 |
|------|----------|----------|
| P0故障（全量不可用） | 15分钟内响应 | 紧急修复→提交加急审核→功能开关降级→公告 |
| P1故障（核心功能异常） | 1小时内响应 | 定位问题→修复→正常审核→公告 |
| P2故障（非核心功能异常） | 4小时内响应 | 记录→下个版本修复 |
| 数据更新 | 每季度1次 | 提取→审核→构建→校验→发版 |
| 号码失效反馈 | 48小时内核实 | 核实→更新Excel→构建→发版（或热更新） |

---

## 14. 风险与应对

### 14.1 技术风险

| 风险ID | 风险描述 | 概率 | 影响 | 等级 | 应对措施 |
|--------|----------|------|------|------|----------|
| TR01 | 小程序审核不通过（涉及政务信息被误判） | 中 | 高 | 高 | 名称避免"官方"误导；显著标注"便民信息汇总非官方"；不提供在线投诉提交；提前准备申诉材料；备选H5版本 |
| TR02 | 搜索命中率不达标（<80%） | 中 | 高 | 高 | 预定义丰富标签+同义词词典；50个query回归测试；上线后收集搜索日志持续优化；无结果时引导分类浏览 |
| TR03 | Word提取准确率不足（表格识别错误） | 中 | 中 | 中 | 提取脚本输出警告报告；未识别表格人工审核；Excel作为中间层供人工修正；build.py校验兜底 |
| TR04 | 数据更新后格式不兼容 | 低 | 中 | 低 | JSON Schema版本化；ext扩展字段；_manifest.json版本校验；不兼容时降级到内置最小数据集 |
| TR05 | 本地存储满（收藏/历史过多） | 低 | 低 | 低 | 历史限制20条；存储封装自动清理最旧数据；异常捕获不阻塞用户 |
| TR06 | V2.0云开发成本超预期 | 中 | 中 | 中 | 按量付费+设置用量上限；免费额度内可支撑初期用户量；AI调用设置每日上限；缓存减少重复调用 |
| TR07 | V3.0迁移后端时数据丢失 | 低 | 高 | 中 | 迁移前全量备份；双写过渡期（同时写本地和云端）；灰度迁移；回滚方案 |

### 14.2 数据风险

| 风险ID | 风险描述 | 概率 | 影响 | 等级 | 应对措施 |
|--------|----------|------|------|------|----------|
| DR01 | 热线号码/网址变更导致信息失效 | 高 | 中 | 中 | 每季度核验更新；已整合热线标注替代渠道；详情页展示数据验证日期；用户可反馈错误；48小时内核实处理 |
| DR02 | 法律条款引用错误 | 低 | 高 | 中 | 法律条款从原文提取，不手写；build.py校验法律条款格式；人工审核；话术页标注"法律依据仅供参考" |
| DR03 | 新增场景时ID冲突 | 低 | 中 | 低 | ID自动生成（MAX+1）；build.py唯一校验；提取脚本检查ID冲突 |
| DR04 | Excel人工编辑引入格式错误 | 中 | 中 | 中 | Excel数据验证（下拉枚举）；必填字段颜色标记；build.py全量校验；校验不通过不生成JSON |
| DR05 | 多人编辑Excel冲突 | 低 | 中 | 低 | Excel作为单文件维护，指定唯一维护人；版本控制（Git管理Excel）；变更日志sheet记录 |

### 14.3 依赖风险

| 风险ID | 风险描述 | 概率 | 影响 | 等级 | 应对措施 |
|--------|----------|------|------|------|----------|
| DEP01 | 微信小程序平台政策变化 | 低 | 高 | 中 | 关注微信小程序公告；备选H5版本；功能模块化便于快速调整 |
| DEP02 | 大模型API服务不稳定（V2.0） | 中 | 中 | 中 | 多服务商备选（豆包/通义千问/文心一言）；降级策略（AI不可用时显示模板话术）；超时重试；缓存常见问题答案 |
| DEP03 | 微信云开发配额限制（V2.0） | 低 | 中 | 低 | 监控用量；设置告警；超配额时降级到本地功能；提前升级套餐 |

---

## 15. 附录

### 15.1 技术栈清单

| 类别 | 技术 | 版本 | 用途 | 引入阶段 |
|------|------|------|------|----------|
| 前端 | 微信小程序原生 | 最新稳定版 | UI/交互/路由 | MVP |
| 语言 | JavaScript (ES6+) | — | 业务逻辑 | MVP |
| 样式 | WXSS + Flex | — | 样式 | MVP |
| 数据 | JSON | — | 运行时数据 | MVP |
| 维护 | Excel (.xlsx) | — | 人工维护数据 | MVP |
| 转换 | Python | 3.8+ | Word→Excel→JSON转换 | MVP |
| 转换库 | python-docx | 0.8.11+ | 读取Word | MVP |
| 转换库 | openpyxl | 3.1+ | 读写Excel | MVP |
| 转换库 | jsonschema | 4.0+ | JSON校验 | MVP |
| 搜索 | 倒排索引（自研） | — | 本地全文检索 | MVP |
| 代码质量 | ESLint + Prettier | 最新 | 代码规范 | MVP |
| 【V2.0】后端 | 微信云开发 | — | 云函数/云数据库/云存储 | V2.0 |
| 【V2.0】AI | 大模型API（豆包/通义千问） | — | AI问答/话术生成 | V2.0 |
| 【V2.0】测试 | Jest | — | 单元测试 | V2.0 |
| 【V3.0】后端 | Node.js + Express/Koa | LTS | 独立后端服务 | V3.0 |
| 【V3.0】数据库 | MySQL 8.0 | 8.0 | 关系型数据存储 | V3.0 |
| 【V3.0】搜索 | Elasticsearch | 8.x | 全文检索 | V3.0 |
| 【V3.0】缓存 | Redis | 7.x | 缓存/会话 | V3.0 |
| 【V3.0】对象存储 | 阿里云OSS/腾讯云COS | — | 文件存储 | V3.0 |
| 【V3.0】部署 | Docker + Kubernetes | — | 容器化部署 | V3.0 |
| 【V3.0】CI/CD | GitHub Actions | — | 自动化构建部署 | V3.0 |

### 15.2 参考文档

| 文档 | 说明 |
|------|------|
| 《维权通 · MVP版PRD》 | 产品需求文档 |
| 《维权通 · 产品远景规划》 | 产品远景规划 |
| 《官方投诉维权渠道大全（合并版·最终版）》 | 数据来源文档1 |
| 《生活投诉渠道大全（最终版）》 | 数据来源文档2 |
| 《群众诉求官方平台汇总（最终版）》 | 数据来源文档3 |
| 微信小程序官方文档 | https://developers.weixin.qq.com/miniprogram/dev/framework/ |
| 微信云开发文档 | https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html |
| python-docx文档 | https://python-docx.readthedocs.io/ |
| openpyxl文档 | https://openpyxl.readthedocs.io/ |
| JSON Schema规范 | https://json-schema.org/ |

### 15.3 术语表

| 术语 | 解释 |
|------|------|
| MVP | Minimum Viable Product，最小可行产品 |
| TDD | Technical Design Document，技术设计文档 |
| PRD | Product Requirements Document，产品需求文档 |
| Repository | 仓库模式，数据访问层设计模式 |
| 倒排索引 | 搜索引擎核心数据结构，从关键词映射到文档 |
| BM25 | 搜索引擎常用的相关性排序算法 |
| 分词 | 将文本切分成词语的过程 |
| 同义词扩展 | 查询时将同义词替换为标准词，提高召回率 |
| 软删除 | 不物理删除数据，通过is_deleted字段标记删除 |
| 乐观锁 | 通过version字段控制并发更新 |
| 功能开关 | 通过配置控制功能是否启用，无需发版 |
| 热更新 | 微信小程序不通过审核即可更新代码（仅限逻辑代码，不能新增页面） |
| 分包加载 | 将小程序代码分成主包和分包，按需加载，减小主包体积 |
| 云开发 | 微信提供的Serverless服务，包含云函数/云数据库/云存储 |
| RAG | Retrieval-Augmented Generation，检索增强生成（V2.0 AI用） |

### 15.4 转换脚本使用说明

#### 环境准备

```bash
# 1. 安装Python 3.8+
# 2. 安装依赖
pip install python-docx openpyxl jsonschema tqdm

# 3. 验证安装
python --version  # Python 3.8+
python -c "import docx; import openpyxl; import jsonschema; print('OK')"
```

#### 首次提取（Word → Excel）

```bash
# 将docs目录下所有Word文档提取为Excel
python tools/extract.py \
  --input "./docs" \
  --output "./data/维权通数据_维护版.xlsx" \
  --verbose

# 输出：
# - Excel文件（多sheet）
# - 提取报告_YYYYMMDD.txt（提取数量、警告、质量报告）
```

#### 人工审核

1. 打开Excel文件
2. 查看"数据字典"sheet了解各字段含义
3. 检查黄色标记的必填字段是否完整
4. 检查提取报告中的警告信息，修正未识别表格
5. 补充口语化标签（每个渠道≥3个）
6. 检查电话号码和网址格式
7. 保存Excel

#### 构建JSON（Excel → JSON）

```bash
# 校验并生成JSON
python tools/build.py \
  --input "./data/维权通数据_维护版.xlsx" \
  --output "./miniprogram/data/" \
  --minify

# 输出：
# - 8个JSON文件（channels/scripts/platforms/categories/schedule/hotlines/enterprise_query/config）
# - _manifest.json（文件清单+版本+校验和）
# - 数据质量报告_YYYYMMDD.txt（校验结果、警告、统计）
```

#### 仅校验（不输出JSON）

```bash
python tools/build.py \
  --input "./data/维权通数据_维护版.xlsx" \
  --validate-only
```

#### 增量更新（Word更新后同步）

```bash
# 与现有Excel对比，输出diff报告
python tools/extract.py \
  --input "./docs" \
  --output "./data/维权通数据_维护版_new.xlsx" \
  --existing "./data/维权通数据_维护版.xlsx" \
  --diff

# 输出diff报告：
# - 新增：N条
# - 修改：N条（逐字段列出变更）
# - 删除：N条（建议软删除）
# - 冲突：N条（人工修改字段与新提取值冲突，需人工确认）
```

#### 日常更新（编辑Excel后）

```bash
# 1. 编辑Excel（新增渠道/话术/法律条款）
# 2. 构建JSON
python tools/build.py --input "./data/维权通数据_维护版.xlsx" --output "./miniprogram/data/"
# 3. 微信开发者工具上传小程序
```

### 15.5 Excel字段速查（渠道表）

| 列 | 字段名 | 中文说明 | 必填 | 类型 | 枚举/格式 |
|----|--------|----------|------|------|-----------|
| A | id | 渠道ID | 是 | string | ch_NNN |
| B | name | 渠道名称 | 是 | string | — |
| C | phone | 投诉电话 | 否 | string | 电话格式 |
| D | phone_note | 电话备注 | 否 | string | — |
| E | website | 官方网址 | 否 | string | URL格式 |
| F | regulator | 上级监管部门 | 否 | string | — |
| G | scope | 适用范围 | 是 | text | — |
| H | precondition | 前置条件 | 否 | string | — |
| I | legal_basis | 法律依据 | 否 | string | — |
| J | tips | 实用提示 | 否 | string | — |
| K | source | 信息来源 | 否 | string | — |
| L | category_l1 | 一级分类 | 是 | string | — |
| M | category_l2 | 二级分类 | 是 | string | — |
| N | tags | 搜索标签 | 是 | array | 英文逗号分隔，≥3个 |
| O | city_code | 城市编码 | 是 | enum | national/sichuan/chengdu |
| P | channel_type | 渠道类型 | 是 | enum | official/hotline/platform/enterprise |
| Q | status | 状态 | 是 | enum | active/merged/discontinued |
| R | merged_to | 替代渠道ID | 否 | string | ch_NNN |
| S | hot_level | 热度权重 | 是 | int | 1-5 |
| T | related_script_id | 关联话术ID | 否 | string | sc_NNN |
| U | effect_rating | 效力评级（V2.0） | 否 | int | 1-5 |
| V | response_speed | 响应速度（V2.0） | 否 | int | 1-5 |
| W | penalty_power | 处罚力度（V2.0） | 否 | int | 1-5 |
| X | success_rate | 实测成功率（V2.5） | 否 | float | 0-1 |
| Y | user_feedback_count | 反馈数（V2.5） | 否 | int | — |
| Z | ext | 扩展字段 | 否 | JSON | — |

---

## 16. 多端技术架构

### 16.1 多端架构总览

维权通的核心价值在于**数据**和**搜索算法**，而非UI。因此采用**核心层跨端复用，UI层按需适配**的架构：

```
┌─────────────────────────────────────────────────────────────────┐
│                      各端UI层（独立适配）                          │
│  ┌────────────┐  ┌────────────┐  ┌─────────┐  ┌────────────┐ │
│  │ 微信小程序   │  │ Web响应式   │  │ APP     │  │ 桌面EXE    │ │
│  │ WXML/WXSS  │  │ HTML/CSS   │  │ Capacitor│  │ Tauri      │ │
│  └──────┬─────┘  └──────┬─────┘  └────┬────┘  └──────┬─────┘ │
│         │                 │              │                │       │
├─────────┴─────────────────┴──────────────┴────────────────┴───────┤
│                   核心业务层（纯JS，所有端100%复用）                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────┐ │
│  │ 搜索索引模块   │  │ 数据管理模块   │  │ 业务逻辑模块   │  │ 埋点  │ │
│  │ 倒排索引/RAG  │  │ Repository   │  │ Service层     │  │      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                    数据层（统一JSON，所有端共享）                      │
│  channels.json │ scripts.json │ search_index.json │ laws.json │ ... │
└─────────────────────────────────────────────────────────────────────┘
```

### 16.2 核心层跨端复用设计

#### 16.2.1 模块划分与平台依赖隔离

| 模块 | 平台依赖 | 跨端复用方式 |
|------|----------|-------------|
| 搜索索引模块 | 无（纯算法） | 100%代码复用，同一JS文件 |
| 数据管理模块 | 存储API不同 | 定义Repository接口，各端实现不同存储 |
| 业务逻辑模块 | 无（纯逻辑） | 100%代码复用，同一JS文件 |
| 埋点模块 | 上报通道不同 | 定义track接口，各端实现不同上报 |
| 工具函数 | 无 | 100%代码复用 |

#### 16.2.2 Repository模式的跨端实现

```javascript
// 统一接口（所有端共用）
class ChannelRepository {
  async getById(id) { throw new Error('Not implemented'); }
  async search(keyword, filters, pagination) { throw new Error('Not implemented'); }
  async getByCategory(l1, l2) { throw new Error('Not implemented'); }
  async getHot(limit) { throw new Error('Not implemented'); }
  async getAll() { throw new Error('Not implemented'); }
}

// 小程序实现
class MiniProgramChannelRepository extends ChannelRepository {
  constructor() {
    super();
    this.data = require('/data/channels.json');
    this.storage = wx; // 小程序存储API
  }
  // ... 实现接口方法
}

// Web实现
class WebChannelRepository extends ChannelRepository {
  constructor() {
    super();
    this.data = await fetch('/data/channels.json').then(r => r.json());
    this.storage = localStorage; // Web存储API
    this.indexedDB = window.indexedDB; // 大数据用IndexedDB
  }
  // ... 实现接口方法
}

// APP实现（Capacitor）
class AppChannelRepository extends ChannelRepository {
  constructor() {
    super();
    this.data = require('../assets/data/channels.json');
    this.storage = Capacitor.Plugins.Storage; // Capacitor存储插件
    this.fs = Capacitor.Plugins.Filesystem; // 文件系统插件
  }
  // ... 实现接口方法
}

// 桌面实现（Tauri）
class DesktopChannelRepository extends ChannelRepository {
  constructor() {
    super();
    this.data = await window.__TAURI__.fs.readTextFile('data/channels.json');
    this.storage = window.localStorage;
    this.fs = window.__TAURI__.fs; // Tauri文件系统API
    this.sqlite = window.__TAURI__.sql; // 可选：SQLite
  }
  // ... 实现接口方法
}
```

**关键**：Service层代码完全不变，只在app启动时根据平台注入对应的Repository实现。

#### 16.2.3 搜索索引模块的跨端复用

搜索索引是纯算法，无任何平台API依赖，所有端使用同一份代码：

```
core/
├── search/
│   ├── inverted-index.js      # 倒排索引（所有端共用）
│   ├── tokenizer.js           # 分词器（所有端共用）
│   ├── bm25.js                # BM25排序算法（所有端共用）
│   ├── vector-index.js        # 【V2.0】向量索引（所有端共用）
│   └── synonym-dict.js        # 同义词典（所有端共用）
├── data/
│   ├── repository.js          # Repository接口（所有端共用）
│   └── validator.js           # 数据校验（所有端共用）
├── services/
│   ├── search-service.js      # 搜索服务（所有端共用）
│   ├── channel-service.js     # 渠道服务（所有端共用）
│   └── script-service.js      # 话术服务（所有端共用）
└── utils/
    ├── storage.js             # 存储封装（接口定义，各端实现）
    └── tracker.js             # 埋点（接口定义，各端实现）
```

**预构建索引文件**（search_index.json）所有端共享同一份，确保搜索结果完全一致。

### 16.3 各端技术方案详解

#### 16.3.1 微信小程序（V1.0）

| 项 | 方案 |
|----|------|
| UI框架 | 微信小程序原生（WXML/WXSS/JS） |
| 核心层 | 直接引用core/目录的JS模块 |
| 数据存储 | 本地JSON打包 + wx.setStorageSync |
| 大数据存储 | 【V2.0】微信云开发云数据库 |
| 构建工具 | 微信开发者工具 |
| 包体积 | 主包<2MB，数据分片放分包 |

#### 16.3.2 H5/PC网站（V1.5/V2.0）

| 项 | 方案 |
|----|------|
| UI框架 | 原生HTML/CSS/JS（或Vue3轻量框架） |
| 响应式 | Mobile First，断点：768px/1024px/1440px |
| 核心层 | 直接引用core/目录的JS模块（ES Module） |
| 数据存储 | localStorage（小数据）+ IndexedDB（大数据/索引） |
| 【V2.0】后端 | 静态网站 + Serverless API（云函数） |
| 部署 | 静态托管（Vercel/Netlify/阿里云OSS/腾讯云COS） |
| CDN | 全球CDN加速，数据文件边缘缓存 |
| SEO | 服务端渲染（SSR）或预渲染（Prerender），确保渠道页可被搜索引擎收录 |
| PWA | 支持PWA，可添加到主屏幕，离线可用 |

**PC端独有功能实现**：
- 大屏数据看板：ECharts/Chart.js可视化
- 批量查询：Web Worker处理大批量搜索
- 打印优化：@media print样式，一键打印投诉信
- 导出功能：JSZip打包导出Word/PDF（用docxtemplater/jspdf）

#### 16.3.3 APP（V2.0，Capacitor）

| 项 | 方案 |
|----|------|
| 打包框架 | Capacitor 5+（Ionic团队出品，比Cordova更现代） |
| UI层 | 同一套Web响应式UI |
| 核心层 | 同一套core/JS模块 |
| 原生能力 | Capacitor插件：电话、通知、相机、文件系统、分享 |
| 数据存储 | Capacitor Storage + Filesystem（本地文件） |
| 推送通知 | Capacitor Push Notifications插件 + FCM/APNs |
| iOS构建 | Xcode，Capacitor add ios |
| Android构建 | Android Studio，Capacitor add android |
| 热更新 | Capacitor Updater插件（无需商店审核更新Web层） |

**Capacitor vs React Native/Flutter**：
- Capacitor：Web技术打包，复用现有Web代码，开发快，但性能略逊于原生
- React Native：JS+原生组件，性能好，但需重写UI，不能复用Web代码
- Flutter：Dart语言，性能最好，但需完全重写，学习成本高
- **选择Capacitor的理由**：核心层100%复用，UI层复用Web代码，开发效率最高，性能对于工具类APP足够

#### 16.3.4 Windows EXE（V2.5，Tauri）

| 项 | 方案 |
|----|------|
| 打包框架 | Tauri 2.x（Rust+WebView2，比Electron轻10倍） |
| UI层 | 同一套Web响应式UI |
| 核心层 | 同一套core/JS模块 |
| 后端 | Rust（可选，用于高性能计算/文件操作） |
| 安装包体积 | 约5-10MB（Electron通常80MB+） |
| 内存占用 | 约30-50MB（Electron通常150MB+） |
| 数据存储 | 本地文件系统 + SQLite（可选，rustqlite） |
| 系统托盘 | Tauri API支持 |
| 开机自启 | Tauri API支持 |
| 自动更新 | Tauri Updater（签名验证，增量更新） |
| 打印 | Tauri API + 系统打印 |
| 文件操作 | Tauri FS API（比浏览器FS强大得多） |

**Tauri vs Electron**：
- Tauri：Rust后端+系统WebView2，体积极小，性能好，但需要Rust知识（核心功能不需要）
- Electron：Node.js后端+Chromium，体积大（80MB+），内存占用高，但生态成熟
- **选择Tauri的理由**：工具类应用不需要Chromium的全部能力，系统WebView2足够，体积极小用户体验好

#### 16.3.5 macOS/Linux（V3.0）

Tauri天然跨平台，同一套代码编译为：
- macOS：.dmg安装包（需Apple开发者证书签名）
- Linux：.AppImage / .deb / .rpm

### 16.4 多端数据同步架构（V2.0）

```
┌─────────────────────────────────────────────────────────┐
│                    云数据库（权威数据源）                   │
│            微信云开发 / 自建后端 + MySQL                   │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
    ┌──────────▼─────────┐      ┌─────────▼──────────┐
    │   实时双向同步       │      │   增量同步（启动时）  │
    │  收藏/历史/投诉跟踪  │      │  渠道/话术/配置数据   │
    └──────────┬─────────┘      └─────────┬──────────┘
               │                          │
┌──────────────▼──────────────────────────▼───────────────┐
│                     各端本地缓存                            │
│  小程序：本地存储  Web：IndexedDB  APP：Filesystem  EXE：SQLite │
│  缓存策略：热门数据全量缓存 + 最近浏览缓存 + LRU淘汰        │
└──────────────────────────────────────────────────────────┘
```

**同步策略**：
1. **渠道/话术/配置数据**：只读数据，启动时检查版本号，有更新则增量下载
2. **收藏/历史/投诉跟踪**：用户数据，实时双向同步
3. **离线操作**：离线时操作本地缓存，联网后自动同步，冲突时云端优先+人工确认
4. **数据格式**：所有端使用统一JSON Schema，确保数据可互导

### 16.5 多端构建与发布工程化

```
代码仓库（Monorepo）
├── core/                    # 核心层（所有端共用）
│   ├── search/
│   ├── data/
│   ├── services/
│   └── utils/
├── data/                    # 数据文件（所有端共用）
│   ├── channels.json
│   ├── search_index.json
│   └── ...
├── apps/
│   ├── miniprogram/         # 微信小程序
│   ├── web/                 # H5/PC网站
│   ├── app/                 # Capacitor APP
│   └── desktop/             # Tauri桌面应用
├── tools/                   # 数据转换工具
│   └── convert.py
└── docs/                    # 文档
```

**CI/CD流水线**：
1. 代码提交 → 自动运行单元测试（核心层）
2. 数据校验（convert.py --validate-only）
3. 构建各端产物：
   - 小程序：微信开发者工具CLI上传体验版
   - Web：构建静态文件，部署到CDN
   - APP：Capacitor build，生成iOS/Android包
   - 桌面：Tauri build，生成Windows/macOS/Linux安装包
4. 自动发布到对应平台（测试环境）
5. 人工审核后发布生产环境

---

## 17. 搜索算法升级

### 17.1 搜索算法演进路线

| 阶段 | 算法 | 能处理的输入 | 响应时间 |
|------|------|-------------|----------|
| V1.0（当前） | 倒排索引+同义词+标签加权 | 标准关键词、常见口语 | <10ms |
| V1.5 | +拼音搜索+编辑距离+错别字纠正 | 拼音、错别字、近似词 | <20ms |
| V2.0 | +RAG向量检索+AI语义理解 | 任意自然语言 | <500ms（含AI） |
| V3.0 | +智能路由+个性化排序+多轮澄清 | 任意自然语言+上下文 | <1s（含多轮） |

### 17.2 MVP核心：本地关键词提取+场景选项卡（零AI成本）

#### 17.2.1 关键词词库结构

词库独立存储为 `keywords.json`，转换脚本预构建，打包进小程序。结构如下：

```json
{
  "version": "2026.08",
  "domain_keywords": {
    "快递物流": ["快递", "快件", "包裹", "物流", "圆通", "中通", "申通", "韵达", "顺丰", "极兔", "邮政", "EMS", "驿站", "快递员", "快递站"],
    "电信运营": ["电信", "话费", "流量", "宽带", "运营商", "移动", "联通", "扣费", "增值业务", "手机卡", "套餐"],
    "消费购物": ["消费", "购物", "商家", "退款", "退货", "假货", "虚假宣传", "淘宝", "京东", "拼多多", "外卖", "电商"],
    "金融保险": ["银行", "保险", "证券", "基金", "理财", "贷款", "信用卡", "金融", "误导销售"],
    "物业房产": ["物业", "房产", "租房", "房东", "业主", "电梯", "小区", "物业费", "房屋质量", "中介"],
    "劳动用工": ["劳动", "工资", "欠薪", "老板", "公司", "工厂", "社保", "公积金", "加班", "辞退", "工伤"],
    "医疗教育": ["医院", "医疗", "医生", "药品", "教育", "学校", "老师", "学费", "培训", "补课"],
    "环保城管": ["环保", "污染", "噪音", "噪声", "城管", "占道", "垃圾", "臭气", "污水"],
    "政务纪检": ["政府", "公职", "官员", "不作为", "推诿", "纪检", "举报", "信访", "督查"],
    "网络安全": ["诈骗", "被骗", "个人信息", "骚扰电话", "短信", "网络", "账号", "盗号"]
  },
  "issue_keywords": {
    "丢失": ["丢失", "丢了", "被偷", "不见了", "遗失", "没收到", "签收未收到"],
    "破损": ["破损", "坏了", "损坏", "碎了", "变形", "污染", "少件"],
    "延误": ["延误", "延迟", "慢", "迟迟不到", "卡了", "停滞", "不更新"],
    "乱收费": ["乱收费", "多收钱", "加价", "扣费", "莫名其妙扣钱", "强制收费", "变相收费"],
    "不退款": ["不退款", "不给退", "拒绝退款", "不退钱", "拖延退款", "退款难"],
    "假货": ["假货", "山寨", "假冒", "伪劣", "翻新", "以次充好", "虚假宣传"],
    "不作为": ["不作为", "不管", "没人管", "推诿", "踢皮球", "拖延", "敷衍", "慢作为"],
    "欠薪": ["欠薪", "拖欠工资", "不发工资", "克扣工资", "少发工资"],
    "服务态度": ["态度差", "骂人", "凶", "不耐烦", "拒绝服务", "挂电话"],
    "安全": ["诈骗", "被骗", "盗刷", "偷钱", "威胁", "恐吓", "人身安全"],
    "质量": ["质量差", "有问题", "故障", "不达标", "不合格"],
    "合同": ["违约", "不履行", "霸王条款", "格式条款", "单方面变更"]
  },
  "target_keywords": {
    "快递公司": ["快递公司", "快递员", "快递站", "驿站", "网点"],
    "运营商": ["运营商", "移动公司", "联通公司", "电信公司", "营业厅"],
    "商家": ["商家", "卖家", "店铺", "网店", "客服", "平台"],
    "物业": ["物业", "物业公司", "物业管家", "物业经理", "业委会"],
    "雇主": ["老板", "公司", "用人单位", "工厂", "主管", "HR", "人事"],
    "医院": ["医院", "医生", "护士", "诊所", "药店", "药企"],
    "学校": ["学校", "老师", "培训机构", "校长", "教育局"]
  },
  "scenes": [
    {
      "id": "scene_001",
      "name": "📦 快递丢失/被偷",
      "desc": "快递丢失、被偷、签收未收到，推荐12305邮政申诉",
      "keywords": ["快递", "丢失"],
      "match_mode": "all",
      "channels": ["ch_002"],
      "scripts": ["sc_001"],
      "priority": 100
    },
    {
      "id": "scene_002",
      "name": "📦 快递破损/少件",
      "desc": "快递破损、损坏、少件，推荐12305邮政申诉",
      "keywords": ["快递", "破损"],
      "match_mode": "all",
      "channels": ["ch_002"],
      "scripts": ["sc_001"],
      "priority": 95
    },
    {
      "id": "scene_003",
      "name": "📦 快递延误/停滞",
      "desc": "快递延误、物流停滞、迟迟不到，推荐12305邮政申诉",
      "keywords": ["快递", "延误"],
      "match_mode": "all",
      "channels": ["ch_002"],
      "scripts": ["sc_001"],
      "priority": 90
    },
    {
      "id": "scene_004",
      "name": "📱 运营商乱扣费",
      "desc": "话费莫名被扣、未经同意开通业务，推荐12300工信部申诉",
      "keywords": ["电信", "乱收费"],
      "match_mode": "all",
      "channels": ["ch_001"],
      "scripts": ["sc_002"],
      "priority": 100
    },
    {
      "id": "scene_005",
      "name": "🛒 商家不退款/退货难",
      "desc": "商家拒绝退款、拖延退款，推荐12315市场监管投诉",
      "keywords": ["消费", "不退款"],
      "match_mode": "all",
      "channels": ["ch_004"],
      "scripts": ["sc_003"],
      "priority": 100
    },
    {
      "id": "scene_006",
      "name": "🛒 买到假货/虚假宣传",
      "desc": "买到假货、山寨、虚假宣传，推荐12315市场监管投诉",
      "keywords": ["消费", "假货"],
      "match_mode": "all",
      "channels": ["ch_004"],
      "scripts": ["sc_003"],
      "priority": 95
    },
    {
      "id": "scene_007",
      "name": "🏠 物业不作为/乱收费",
      "desc": "物业不作为、乱收费、服务差，推荐12345+住建部门",
      "keywords": ["物业", "不作为"],
      "match_mode": "all",
      "channels": ["ch_007"],
      "scripts": ["sc_005"],
      "priority": 100
    },
    {
      "id": "scene_008",
      "name": "💼 老板欠薪/拖欠工资",
      "desc": "老板拖欠工资、不发工资，推荐全国根治欠薪平台",
      "keywords": ["劳动", "欠薪"],
      "match_mode": "all",
      "channels": ["ch_006"],
      "scripts": [],
      "priority": 100
    },
    {
      "id": "scene_009",
      "name": "🛡️ 电信诈骗/被骗钱",
      "desc": "遭遇电信诈骗、被骗钱，立即拨打96110+110",
      "keywords": ["诈骗"],
      "match_mode": "any",
      "channels": ["ch_099"],
      "scripts": [],
      "priority": 100
    }
  ]
}
```

**词库规模**：领域词50+、问题词100+、对象词80+、场景映射100+，MVP版本覆盖80%以上用户输入。

#### 17.2.2 关键词提取算法实现

**正向最大匹配算法**（从长到短匹配，避免短词优先匹配导致的错误）：

```javascript
// utils/keyword-extractor.js
class KeywordExtractor {
  constructor(keywordsData) {
    this.domainKeywords = keywordsData.domain_keywords || {};
    this.issueKeywords = keywordsData.issue_keywords || {};
    this.targetKeywords = keywordsData.target_keywords || {};
    this.scenes = keywordsData.scenes || [];

    // 构建全量词库（用于正向最大匹配）
    this.allKeywords = new Set();
    Object.values(this.domainKeywords).forEach(arr => arr.forEach(w => this.allKeywords.add(w)));
    Object.values(this.issueKeywords).forEach(arr => arr.forEach(w => this.allKeywords.add(w)));
    Object.values(this.targetKeywords).forEach(arr => arr.forEach(w => this.allKeywords.add(w)));

    // 按长度降序排序（优化匹配效率）
    this.maxLength = Math.max(...Array.from(this.allKeywords).map(w => w.length), 6);
  }

  /**
   * 从用户输入中提取关键词
   * @param {string} text - 用户输入文本
   * @returns {Object} { domains, issues, targets, allKeywords, matchedScenes }
   */
  extract(text) {
    if (!text || !text.trim()) {
      return { domains: [], issues: [], targets: [], allKeywords: [], matchedScenes: [] };
    }

    const matched = new Set();
    let i = 0;

    // 正向最大匹配
    while (i < text.length) {
      let matchedWord = null;
      // 从最长到最短尝试匹配
      for (let len = Math.min(this.maxLength, text.length - i); len >= 1; len--) {
        const word = text.substring(i, i + len);
        if (this.allKeywords.has(word)) {
          matchedWord = word;
          break;
        }
      }

      if (matchedWord) {
        matched.add(matchedWord);
        i += matchedWord.length;
      } else {
        i++;
      }
    }

    // 分类
    const domains = this._classify(matched, this.domainKeywords);
    const issues = this._classify(matched, this.issueKeywords);
    const targets = this._classify(matched, this.targetKeywords);

    // 场景匹配
    const matchedScenes = this._matchScenes(matched, domains, issues, targets);

    return {
      domains,
      issues,
      targets,
      allKeywords: Array.from(matched),
      matchedScenes
    };
  }

  /**
   * 将匹配到的关键词分类
   */
  _classify(matchedSet, categoryMap) {
    const result = [];
    for (const [category, keywords] of Object.entries(categoryMap)) {
      for (const kw of keywords) {
        if (matchedSet.has(kw)) {
          result.push({ category, keyword: kw });
        }
      }
    }
    return result;
  }

  /**
   * 场景匹配：根据关键词组合匹配场景
   */
  _matchScenes(matchedSet, domains, issues, targets) {
    const results = [];

    for (const scene of this.scenes) {
      const sceneKeywords = scene.keywords || [];
      const matchMode = scene.match_mode || 'all';

      let matchedCount = 0;
      for (const kw of sceneKeywords) {
        if (matchedSet.has(kw)) {
          matchedCount++;
        }
      }

      let isMatch = false;
      if (matchMode === 'all') {
        isMatch = matchedCount === sceneKeywords.length;
      } else if (matchMode === 'any') {
        isMatch = matchedCount >= 1;
      }

      if (isMatch) {
        results.push({
          ...scene,
          match_score: matchedCount * (scene.priority || 50)
        });
      }
    }

    // 按匹配分数降序排序
    return results.sort((a, b) => b.match_score - a.match_score);
  }
}
```

**性能**：100字输入，500+词库，匹配时间<5ms。

#### 17.2.3 场景选项卡交互实现

```javascript
// pages/search-result/search-result.js
Page({
  data: {
    keyword: '',
    extractedKeywords: [],
    matchedScenes: [],
    showScenePicker: false,
    searchResults: []
  },

  onLoad(options) {
    const keyword = options.keyword || '';
    this.setData({ keyword });
    this.processSearch(keyword);
  },

  processSearch(keyword) {
    // 1. 关键词提取
    const extractor = new KeywordExtractor(require('../../data/keywords.json'));
    const result = extractor.extract(keyword);

    this.setData({
      extractedKeywords: result.allKeywords,
      matchedScenes: result.matchedScenes
    });

    // 2. 根据匹配结果决定展示方式
    if (result.matchedScenes.length === 1) {
      // 匹配到1个场景 → 直接进入该场景详情
      const scene = result.matchedScenes[0];
      if (scene.channels && scene.channels.length > 0) {
        wx.navigateTo({ url: `/pages/channel-detail/index?id=${scene.channels[0]}` });
      } else if (scene.scripts && scene.scripts.length > 0) {
        wx.navigateTo({ url: `/pages/script-detail/index?id=${scene.scripts[0]}` });
      }
    } else if (result.matchedScenes.length >= 2) {
      // 匹配到2-5个场景 → 展示场景选项卡
      this.setData({ showScenePicker: true });
    } else {
      // 无匹配 → 走倒排索引搜索 + 热门场景推荐
      this.doInvertedSearch(keyword);
    }
  },

  // 用户点选场景
  onSceneTap(e) {
    const scene = e.currentTarget.dataset.scene;
    if (scene.channels && scene.channels.length > 0) {
      wx.navigateTo({ url: `/pages/channel-detail/index?id=${scene.channels[0]}` });
    } else if (scene.scripts && scene.scripts.length > 0) {
      wx.navigateTo({ url: `/pages/script-detail/index?id=${scene.scripts[0]}` });
    }
  },

  // 用户删除关键词，重新匹配
  onKeywordRemove(e) {
    const removedKw = e.currentTarget.dataset.keyword;
    const newKeywords = this.data.extractedKeywords.filter(k => k !== removedKw);
    // 用剩余关键词重新搜索（简化：重新输入）
    this.processSearch(newKeywords.join(' '));
  },

  // 以上都不是 → 全部分类
  onShowAllCategories() {
    wx.switchTab({ url: '/pages/category/index' });
  }
});
```

**场景选项卡WXML结构**：

```xml
<!-- pages/search-result/search-result.wxml -->
<view class="scene-picker" wx:if="{{showScenePicker}}">
  <view class="picker-header">
    <text class="picker-title">为你找到以下相关场景</text>
    <view class="keyword-tags">
      <text class="kw-tag" wx:for="{{extractedKeywords}}" wx:key="*this"
            data-keyword="{{item}}" bindtap="onKeywordRemove">
        {{item}} ✕
      </text>
    </view>
  </view>

  <view class="scene-list">
    <view class="scene-card" wx:for="{{matchedScenes}}" wx:key="id"
          data-scene="{{item}}" bindtap="onSceneTap">
      <view class="scene-name">{{item.name}}</view>
      <view class="scene-desc">{{item.desc}}</view>
      <view class="scene-meta">
        <text wx:if="{{item.channels.length > 0}}">📞 {{item.channels.length}}个渠道</text>
        <text wx:if="{{item.scripts.length > 0}}">💬 {{item.scripts.length}}套话术</text>
      </view>
    </view>
  </view>

  <view class="picker-footer" bindtap="onShowAllCategories">
    以上都不是，查看全部分类 ›
  </view>
</view>
```

#### 17.2.4 AI接入抽象层（可选，开发者自行选择）

**统一AI接口**，支持多厂商、多协议、多模型，开发者只需修改配置：

```javascript
// services/ai-service.js
class AIService {
  constructor(config) {
    this.enabled = config.enabled || false;
    this.provider = config.provider || 'custom';
    this.model = config.model || '';
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || '';
    this.protocol = config.protocol || 'openai'; // openai / anthropic / custom
    this.fallbackToLocal = config.fallbackToLocal !== false;
    this.dailyLimit = config.dailyLimit || 50;
    this.timeout = config.timeout || 10000;
  }

  /**
   * 聊天补全（统一接口）
   * @param {Array} messages - [{role: 'system'|'user'|'assistant', content: string}]
   * @param {Object} options - { temperature, max_tokens, stream }
   * @returns {Promise<string>} - AI回复内容
   */
  async chat(messages, options = {}) {
    if (!this.enabled) {
      throw new Error('AI is disabled');
    }

    // 每日限额检查
    if (!this._checkDailyLimit()) {
      throw new Error('Daily AI limit exceeded');
    }

    try {
      let response;
      switch (this.protocol) {
        case 'openai':
          response = await this._callOpenAICompatible(messages, options);
          break;
        case 'anthropic':
          response = await this._callAnthropic(messages, options);
          break;
        case 'custom':
          response = await this._callCustom(messages, options);
          break;
        default:
          throw new Error(`Unsupported protocol: ${this.protocol}`);
      }

      this._incrementUsage();
      return response;
    } catch (error) {
      console.error('[AIService] Error:', error);
      if (this.fallbackToLocal) {
        return null; // 返回null，调用方降级到本地搜索
      }
      throw error;
    }
  }

  /**
   * OpenAI兼容协议（豆包/通义千问/智谱/Ollama都兼容此协议）
   */
  async _callOpenAICompatible(messages, options) {
    const res = await wx.request({
      url: `${this.baseUrl}/chat/completions`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      data: {
        model: this.model,
        messages: messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2000,
        stream: options.stream ?? false
      },
      timeout: this.timeout
    });

    if (res.statusCode !== 200) {
      throw new Error(`API error: ${res.statusCode}`);
    }
    return res.data.choices[0].message.content;
  }

  /**
   * Anthropic协议
   */
  async _callAnthropic(messages, options) {
    // Anthropic协议实现...
  }

  /**
   * 自定义协议（开发者自行实现）
   */
  async _callCustom(messages, options) {
    // 开发者可在此处实现自定义API调用
    throw new Error('Custom protocol not implemented. Please override _callCustom method.');
  }

  _checkDailyLimit() {
    const today = new Date().toDateString();
    const usage = wx.getStorageSync('ai_usage') || { date: today, count: 0 };
    if (usage.date !== today) {
      usage.date = today;
      usage.count = 0;
    }
    return usage.count < this.dailyLimit;
  }

  _incrementUsage() {
    const today = new Date().toDateString();
    const usage = wx.getStorageSync('ai_usage') || { date: today, count: 0 };
    usage.count++;
    wx.setStorageSync('ai_usage', usage);
  }
}

/**
 * AI配置示例（config.json）
 * {
 *   "ai": {
 *     "enabled": false,
 *     "provider": "doubao",
 *     "model": "doubao-lite-4k",
 *     "api_key": "",
 *     "base_url": "https://ark.cn-beijing.volces.com/api/v3",
 *     "protocol": "openai",
 *     "fallback_to_local": true,
 *     "daily_limit": 50
 *   }
 * }
 *
 * 支持的厂商：
 * - 字节跳动豆包：base_url=https://ark.cn-beijing.volces.com/api/v3, protocol=openai
 * - 阿里通义千问：base_url=https://dashscope.aliyuncs.com/compatible-mode/v1, protocol=openai
 * - OpenAI：base_url=https://api.openai.com/v1, protocol=openai
 * - 智谱GLM：base_url=https://open.bigmodel.cn/api/paas/v4, protocol=openai
 * - 本地Ollama：base_url=http://localhost:11434/v1, protocol=openai
 * - 自定义：protocol=custom，重写_callCustom方法
 */

module.exports = AIService;
```

**AI使用场景（可选开启）**：
1. **语义搜索增强**：本地搜索无结果时，调用AI理解用户意图，推荐相关渠道
2. **AI问答助手**：用户直接问"怎么办"，AI给出步骤+渠道+话术
3. **话术定制**：根据用户具体情况，AI定制投诉话术

**降级策略**：AI不可用、超时、超限时，自动降级到本地搜索，用户无感知。

### 17.3 V1.5：模糊匹配+拼音搜索

#### 17.2.1 拼音搜索实现

**预构建拼音索引**（转换脚本生成）：
```python
# convert.py 中增加拼音索引生成
from pypinyin import lazy_pinyin, Style

def build_pinyin_index(channels, scripts):
    """为每个渠道/话术生成拼音索引"""
    pinyin_index = {}
    for doc in channels + scripts:
        # 名称的全拼和首字母
        name = doc.get('name', doc.get('scene_name', ''))
        full_pinyin = ''.join(lazy_pinyin(name, style=Style.NORMAL))
        first_letter = ''.join(lazy_pinyin(name, style=Style.FIRST_LETTER))
        pinyin_index[full_pinyin] = doc['id']
        pinyin_index[first_letter] = doc['id']
        # 标签的拼音
        for tag in doc.get('tags', doc.get('keywords', [])):
            full = ''.join(lazy_pinyin(tag, style=Style.NORMAL))
            first = ''.join(lazy_pinyin(tag, style=Style.FIRST_LETTER))
            pinyin_index[full] = doc['id']
            pinyin_index[first] = doc['id']
    return pinyin_index
```

**搜索时匹配**：
```javascript
function search(keyword) {
  // 1. 先尝试倒排索引匹配
  let results = invertedIndex.search(keyword);

  // 2. 如果结果不足，尝试拼音匹配
  if (results.length < 5) {
    const pinyinResults = pinyinIndex.search(keyword);
    results = mergeResults(results, pinyinResults);
  }

  // 3. 如果结果仍不足，尝试编辑距离模糊匹配
  if (results.length < 5) {
    const fuzzyResults = fuzzySearch(keyword, dictionary, maxDistance=2);
    results = mergeResults(results, fuzzyResults);
  }

  return results;
}
```

#### 17.2.2 编辑距离模糊匹配

```javascript
/**
 * 计算两个字符串的编辑距离（Levenshtein Distance）
 */
function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i-1] === b[j-1]) {
        dp[i][j] = dp[i-1][j-1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * 模糊搜索：在词典中找与keyword编辑距离<=maxDistance的词
 */
function fuzzySearch(keyword, dictionary, maxDistance = 2) {
  const results = [];
  for (const word of dictionary) {
    // 长度差超过maxDistance的直接跳过（优化）
    if (Math.abs(word.length - keyword.length) > maxDistance) continue;
    const dist = editDistance(keyword, word);
    if (dist <= maxDistance) {
      results.push({ word, distance: dist });
    }
  }
  // 按编辑距离排序
  return results.sort((a, b) => a.distance - b.distance);
}
```

**性能优化**：
- 词典预过滤（长度差过滤、首字母过滤）
- 编辑距离计算提前终止（超过maxDistance立即返回）
- 常用错别字映射表（直接映射，不计算编辑距离）

### 17.4 V2.0：RAG向量检索

#### 17.3.1 向量检索原理

将文本转换为向量（embedding），通过计算向量余弦相似度来匹配语义相近的文本，而不依赖关键词精确匹配：

```
用户输入："我在淘宝买了个假货商家不给退钱怎么办"
    ↓ embedding模型
用户向量：[0.12, -0.34, 0.56, ..., 0.78]（1024维）
    ↓ 余弦相似度计算
渠道向量库：
  12315渠道向量：[0.10, -0.30, 0.52, ..., 0.75] → 相似度 0.95 ✅
  12305渠道向量：[0.05, -0.10, 0.20, ..., 0.30] → 相似度 0.45
  ...
    ↓
返回：12315渠道（语义最匹配）
```

#### 17.3.2 向量索引构建（转换脚本）

```python
# convert.py 中增加向量索引构建
import numpy as np

def build_vector_index(channels, scripts, embedding_model='text-embedding-3-small'):
    """
    为每个渠道/话术构建向量索引
    向量维度：1536（text-embedding-3-small）
    存储格式：FP16压缩（float16，体积减半，精度损失可忽略）
    """
    vector_index = {
        'version': '1.0',
        'model': embedding_model,
        'dimension': 1536,
        'doc_ids': [],
        'vectors': [],  # FP16压缩存储
    }

    for doc in channels + scripts:
        # 构建用于向量化的文本（名称+适用范围+标签）
        text = f"{doc.get('name', doc.get('scene_name', ''))} " \
               f"{doc.get('scope', doc.get('applicable', ''))} " \
               f"{' '.join(doc.get('tags', doc.get('keywords', [])))}"

        # 调用embedding API获取向量
        vector = get_embedding(text, model=embedding_model)

        # FP16压缩
        vector_fp16 = np.array(vector, dtype=np.float16).tobytes()

        vector_index['doc_ids'].append(doc['id'])
        vector_index['vectors'].append(vector_fp16.hex())  # hex编码存储

    return vector_index
```

**体积估算**：
- 1000个文档 × 1536维 × 2字节（FP16）= 3MB
- gzip压缩后约1MB
- 可接受，可打包进小程序/APP

#### 17.3.3 向量检索实现（小程序端）

```javascript
/**
 * 向量检索：计算用户query与所有文档向量的余弦相似度
 */
class VectorSearch {
  constructor(vectorIndex) {
    this.docIds = vectorIndex.doc_ids;
    // 解码FP16向量
    this.vectors = vectorIndex.vectors.map(hex => {
      const buffer = new Uint8Array(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
      return new Float16Array(buffer.buffer);
    });
  }

  /**
   * 搜索最相似的topK个文档
   */
  search(queryVector, topK = 10) {
    const similarities = [];
    for (let i = 0; i < this.vectors.length; i++) {
      const sim = this._cosineSimilarity(queryVector, this.vectors[i]);
      similarities.push({ docId: this.docIds[i], score: sim });
    }
    // 按相似度降序排序
    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, topK);
  }

  _cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

**性能优化**：
- Web Worker中计算向量相似度，不阻塞UI
- 近似最近邻（ANN）算法：IVF/PQ索引，预计算聚类中心，只搜索最近的几个簇
- 1000个文档全量计算约10-20ms，可接受

#### 17.3.4 混合搜索（关键词+向量）

```javascript
/**
 * 混合搜索：结合倒排索引（关键词精确匹配）和向量检索（语义匹配）
 */
class HybridSearch {
  constructor(invertedIndex, vectorSearch) {
    this.invertedIndex = invertedIndex;
    this.vectorSearch = vectorSearch;
  }

  search(keyword, queryVector, topK = 20) {
    // 1. 倒排索引搜索（关键词匹配）
    const keywordResults = this.invertedIndex.search(keyword);
    // 归一化得分到0-1
    const keywordScores = this._normalize(keywordResults);

    // 2. 向量检索（语义匹配）
    const vectorResults = this.vectorSearch.search(queryVector, topK * 2);
    const vectorScores = this._normalize(vectorResults);

    // 3. 加权融合（关键词权重0.6，向量权重0.4）
    const merged = {};
    for (const r of keywordScores) {
      merged[r.docId] = (merged[r.docId] || 0) + r.score * 0.6;
    }
    for (const r of vectorScores) {
      merged[r.docId] = (merged[r.docId] || 0) + r.score * 0.4;
    }

    // 4. 排序返回
    return Object.entries(merged)
      .map(([docId, score]) => ({ docId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
```

### 17.5 V2.0：AI语义理解

#### 17.4.1 AI语义理解流程

```
用户输入："我快递被偷了，快递公司只赔我运费的3倍，我物品价值500块，怎么办"
    ↓
大模型解析（Prompt Engineering）：
{
  "domain": "快递物流",
  "issue_type": "快递丢失+赔偿争议",
  "target": "快递公司",
  "item_value": "500元",
  "demand": ["合理赔偿", "投诉渠道"],
  "key_facts": {
    "express_lost": true,
    "compensation_offered": "运费3倍",
    "item_value": 500,
    "is_insured": false  // 未提及保价
  },
  "suggested_channels": [
    {"id": "ch_002", "name": "国家邮政局申诉平台", "priority": 1},
    {"id": "ch_004", "name": "12315平台", "priority": 2}
  ],
  "suggested_scripts": ["sc_001"],
  "legal_basis": ["邮政法第四十七条", "快递暂行条例第二十七条"],
  "next_steps": [
    "1. 先与快递公司客服协商，要求按物品实际价值赔偿",
    "2. 7天内未解决，拨打12305向邮政局申诉",
    "3. 申诉时提供：快递单号、物品价值证明、与客服沟通记录",
    "4. 注意：未保价快递最高赔偿不超过运费3倍，但故意/重大过失除外"
  ],
  "clarification_needed": ["是否保价？", "快递公司是否出具书面答复？"]
}
    ↓
前端展示：推荐渠道+推荐话术+操作步骤+法律依据+澄清问题
```

#### 17.4.2 AI Prompt设计

```
系统角色：你是维权通的AI助手，专门帮助用户分析投诉问题并推荐最佳维权渠道和话术。

任务：根据用户描述的问题，提取关键信息，推荐投诉渠道和话术，给出操作步骤。

输出格式：严格输出JSON，包含以下字段：
- domain: 问题所属领域（快递/电信/消费/金融/物业/劳动/医疗/教育/环保/政务/其他）
- issue_type: 问题类型（简短描述）
- target: 被投诉对象
- demand: 用户诉求列表
- key_facts: 关键事实（从用户描述中提取）
- suggested_channels: 推荐渠道列表，每个包含id、name、priority（1-3）
- suggested_scripts: 推荐话术ID列表
- legal_basis: 相关法律依据列表
- next_steps: 操作步骤列表（按时间顺序）
- clarification_needed: 需要向用户澄清的问题列表（如信息不足）

约束：
1. 只推荐官方投诉渠道，不推荐非官方渠道
2. 法律依据必须准确，不确定的不要写
3. 操作步骤必须具体可执行
4. 如果信息不足以精准推荐，在clarification_needed中列出需要澄清的问题
5. 输出必须是合法JSON，不要有多余文字

用户问题：{user_query}
```

#### 17.4.3 多轮对话澄清

当AI判断信息不足时，主动向用户提问澄清：

```
用户："我快递被偷了怎么办"
AI："了解，快递丢失确实很让人着急。为了给你推荐最有效的维权方式，我需要确认几个问题：
1. 是哪家快递公司？（顺丰/圆通/中通/其他）
2. 物品价值大约多少？是否保价？
3. 你已经联系过快递公司客服了吗？他们怎么说？"

用户："圆通的，价值500块，没保价，客服说只赔3倍运费"
AI："好的，情况清楚了。根据你的情况：
- 物品价值500元，未保价，快递公司只赔3倍运费（约30-50元），这明显不合理
- 推荐渠道：国家邮政局申诉平台（12305），这是快递行业最有效的投诉渠道
- 推荐话术：快递丢失投诉话术（已为你定制，强调物品实际价值）
- 操作步骤：
  1. 保留快递单号、物品购买凭证、与客服沟通记录
  2. 拨打12305（省会区号+12305），或登录sswz.spb.gov.cn在线申诉
  3. 申诉时强调：物品实际价值500元，快递公司未履行提示保价义务
  4. 法律依据：《邮政法》第四十七条、《快递暂行条例》第二十七条
  5. 预计7-15个工作日内得到处理结果

需要我帮你生成具体的投诉话术吗？"
```

### 17.6 搜索质量评估与优化

#### 17.5.1 评估指标

| 指标 | 定义 | 目标 |
|------|------|------|
| 搜索成功率 | 搜索后用户点击了结果的比例 | ≥80%（MVP），≥90%（V2.0） |
| 无结果率 | 搜索返回0条结果的比例 | ≤15%（MVP），≤5%（V2.0） |
| 首条点击率 | 搜索结果第一条被点击的比例 | ≥50% |
| 搜索后转化率 | 搜索→详情→复制/拨打的转化比例 | ≥30% |
| MRR | 平均倒数排名（第一个相关结果的排名倒数的均值） | ≥0.7 |
| NDCG@5 | 归一化折损累计增益（前5条结果质量） | ≥0.8 |

#### 17.5.2 持续优化闭环

```
用户搜索行为数据（query、点击、停留、转化）
    ↓
离线分析（每周）：
  - 无结果query分析 → 补充标签/同义词/场景
  - 低点击率query分析 → 优化排序权重/补充相关渠道
  - 搜索后未转化分析 → 优化详情页内容/话术质量
    ↓
数据更新（每月）：
  - 更新同义词典
  - 扩展标签体系
  - 调整搜索权重
  - 补充新场景/新渠道
    ↓
A/B测试（新算法）：
  - 小流量（10%）测试新搜索算法
  - 对比核心指标（成功率/MRR/NDCG）
  - 效果显著提升则全量发布
    ↓
AI反馈闭环（V2.0）：
  - 用户对AI回答点赞/点踩
  - 点踩数据用于Prompt优化和模型微调
```

---

> **文档结束**
> 本文档为维权通 V1.0 MVP 技术设计文档，涵盖技术选型、架构设计、数据管线、核心模块、扩展性、性能、安全、工程化、测试、上线、监控全流程。
> 新增第16章（多端技术架构）和第17章（搜索算法升级），应对未来APP/网站/EXE多端发布和用户千奇百怪搜索描述的需求。
> 所有技术决策均考虑 V2.0/V3.0 扩展性，预留接口和占位，确保平滑升级不推倒重来。
> 配套文档：《维权通 · MVP版PRD》《维权通 · 产品远景规划》
