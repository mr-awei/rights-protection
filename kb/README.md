# 知识库（唯一数据源 SSOT）

> **从现在起，你只维护这个目录。**
> `miniprogram/data/*.js` 和 `miniprogram/detail/data/*.js` 都由脚本生成，**不要再手工编辑**。
> `source/*.docx` 降级为原始素材归档。

## 一、工作流

```
你编辑 kb/*.md（唯一数据源）
        │
        │  node scripts/kb-build.js --write
        ▼
miniprogram/data/*.js（自动生成，带"请勿手工编辑"头）
        │
        ├─ node scripts/export-kb.js  → data/knowledge-base.json（AI 用）
        └─ node scripts/validate-data.js / verify-release.js（发版校验）
```

## 二、目录结构

```
kb/
├── channels/   122 个渠道，一渠道一文件：ch_001-工信部电信用户申诉受理中心.md
├── scripts/    19 条话术：sc_001-快递丢失_破损_延误.md
├── laws/       90 条法规：law_001-中华人民共和国宪法.md
└── README.md   本文件
```

## 三、文件格式

每个 md = **YAML front-matter（结构化字段）+ Markdown 正文（长文本）**。

用 Obsidian 打开 `kb/` 作为库即可直接编辑，VS Code 同理。

### 渠道（channels/*.md）

```markdown
---
type: channel
id: ch_001
name: 工信部电信用户申诉受理中心
phone: "12300"
website: "https://..."
regulator: 工业和信息化部
category_l1: 基础民生与公共交通
category_l2: 电信运营
category_user: 电信运营
category_user_l2: 电信运营
channel_type: hotline
hot_level: 3
related_script_id: sc_002
law_ids:
  - law_003
issue_types:
  - service_attitude
  - overcharge
tags:
  - 电信
  - 乱扣费
---

# 渠道名

## 适用范围
（这里写适用范围）

## 前置条件
（如"需先向企业投诉满 7 日"；没有就写（无））

## 实用提示
（没有就写（无））
```

**字段说明**：

| 字段 | 必填 | 说明 |
|---|:--:|---|
| `id` | ✅ | 主键，`ch_xxx`，不可重复 |
| `name` | ✅ | 渠道名称 |
| `phone` | | 投诉电话（纯数字建议加引号，避免被当成数字） |
| `category_l1` | ✅ | 一级分类（5 个之一） |
| `category_l2` | ✅ | 二级分类 |
| `category_user` | ✅ | 用户视角分类（13 个之一） |
| `channel_type` | | `hotline` / `platform` / `official` / `enterprise` |
| `hot_level` | | 热度 1–5 |
| `related_script_id` | | 关联话术 id（如 `sc_002`） |
| `law_ids` | | 关联法条 id **列表**（多个用 `-` 逐行写） |
| `issue_types` | | 问题类型列表 |
| `tags` | | 搜索标签（越多越好搜到） |

### 话术（scripts/*.md）

```markdown
---
type: script
id: sc_001
scene_name: 场景1：快递丢失/破损/延误（拨打12305邮政申诉）
category: 场景1
applicable: 快递丢失、破损、延误，向快递公司投诉满 7 日未解决。
is_general: false
hot_level: 5
keywords:
  - 快递丢失
  - 12305
---

## 电话版话术
（正文，【】里是占位符，如【姓名】【手机号】）

## 书面版话术
（正文）
```

### 法规（laws/*.md）

```markdown
---
type: law
id: law_001
name: 中华人民共和国宪法
full_name: 中华人民共和国宪法
category:
  - 通用
  - 政务纪检
---

（正文放法条原文，做 RAG 时建议按条文切片）
```

## 四、常用操作

### 改一个渠道的电话

打开 `kb/channels/ch_001-*.md` → 改 `phone:` → 跑：

```bash
node scripts/kb-build.js --write
```

### 新增一个渠道

在 `kb/channels/` 新建 `ch_123-某某渠道.md`，按上面模板填 `id`（不重复即可）→ 跑 `kb-build.js --write`，会自动进索引和分片。

### 删除一个渠道

直接删 md 文件 → 跑 `kb-build.js --write`，生成的数据里就没有了。

### 改话术模板

编辑 `kb/scripts/sc_0xx-*.md` 的「电话版话术 / 书面版话术」小节 → 重新生成。

## 五、命令一览

| 命令 | 作用 |
|---|---|
| `node scripts/kb-build.js` | **校验**：对比知识库与现有数据，不写文件（改动前先跑这个看差异） |
| `node scripts/kb-build.js --write` | **写入**：校验后生成 `miniprogram/data/*.js` |
| `node scripts/export-kb.js` | 导出 `data/knowledge-base.json`（AI 消费用） |
| `node scripts/validate-data.js` | 数据一致性校验 |
| `node scripts/verify-release.js` | 发版交叉验证 |

## 六、注意事项

1. **不要手工编辑 `miniprogram/data/*.js`** —— 下次 `kb-build --write` 会覆盖你的改动。
2. **`id` 不要重复**，否则生成的数据会有问题。
3. **`law_ids` 写成列表**（每行 `- law_xxx`）。历史数据里是逗号分隔字符串，脚本会自动兼容，但新写的一律用列表。
4. **纯数字字段加引号**（如 `phone: "12300"`），避免 YAML 解析成数字丢失前导零。
5. 改完记得跑 `validate-data.js` 和 `verify-release.js`。
6. `kb/` 不参与小程序打包，231 个文件对包体积**零影响**。
