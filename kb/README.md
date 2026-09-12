# 知识库（唯一数据源 SSOT）

> **你只维护这个目录。** `miniprogram/data/*.js` 由脚本生成，不再手工编辑。`source/*.docx` 降级为原始素材归档。

## 一、为什么是 7 个文件而不是 231 个

按**一级分类聚合**：一个分类一个文件，既能全文搜索/浏览，又便于**交接给别人**（发 7 个文件即可，而不是 231 个）。

```
kb/
├── channels/                       渠道 122 条，分 5 个文件
│   ├── 基础民生与公共交通.md          17 条
│   ├── 金融与商业消费.md              32 条
│   ├── 社会服务与政务司法.md          51 条
│   ├── 高层级诉求平台.md              18 条
│   └── 四川成都地方渠道.md             4 条
├── scripts/投诉话术.md               话术 19 条（1 个文件）
├── laws/法律法规.md                  法规 90 条（1 个文件）
└── README.md                        本文件
```

用 Obsidian 打开 `kb/` 作为库即可；VS Code 同样可以。

## 二、工作流

```
你编辑 kb/*.md
     │  node scripts/kb-build.js（先看差异）
     │  node scripts/kb-build.js --write（确认后生成）
     ▼
miniprogram/data/*.js + detail/data/*.js（自动生成）
     │
     ├─ node scripts/export-kb.js → data/knowledge-base.json（AI 用）
     └─ node scripts/validate-data.js / verify-release.js（发版校验）
```

## 三、文件格式

每个文件 = **YAML 文件头 + 若干实体分节**。

```markdown
---
type: channel-group
category_l1: 基础民生与公共交通
count: 17
---

# 基础民生与公共交通（17 条）

## ch_001 · 工信部电信用户申诉受理中心

- id: ch_001
- name: 工信部电信用户申诉受理中心
- phone: 12300
- website: https://yhssglxt.miit.gov.cn/web/home
- regulator: 工业和信息化部
- category_l2: 电信运营
- category_user: 电信运营
- category_user_l2: 电信运营
- channel_type: platform
- hot_level: 3
- related_script_id: sc_002
- law_ids: law_003
- issue_types: service_attitude, overcharge
- tags: 电信, 乱扣费, 话费

**适用范围**

电信服务质量、资费争议…

**前置条件**

（无）

**实用提示**

（无）

## ch_002 · …
```

**字段说明（渠道）**：

| 字段 | 必填 | 说明 |
|---|:--:|---|
| `id` | ✅ | 主键 `ch_xxx`，不可重复 |
| `name` | ✅ | 渠道名称 |
| `phone` | | 投诉电话 |
| `website` / `regulator` | | 官网 / 上级监管部门 |
| `category_l2` / `category_user` | ✅ | 二级分类 / 用户视角分类 |
| `channel_type` | | `hotline` / `platform` / `official` / `enterprise` |
| `hot_level` | | 热度 1–5 |
| `related_script_id` | | 关联话术，如 `sc_002` |
| `law_ids` | | 关联法条，**逗号分隔** |
| `issue_types` / `tags` | | 问题类型 / 搜索标签，**逗号分隔** |

长文本放 `**适用范围**` / `**前置条件**` / `**实用提示**` 小节下；没有就写 `（无）`。

话术文件同理，小节为 `**电话版话术**` / `**书面版话术**`；法规文件直接写正文。

## 四、常用操作

| 想做什么 | 怎么做 |
|---|---|
| 改一个渠道电话 | 打开对应分类文件，搜 `ch_001`，改 `phone:` 行 |
| 新增渠道 | 在所属分类文件末尾加一段 `## ch_123 · 名称` 及字段 |
| 删除渠道 | 删掉那一整段（`##` 到下一个 `##` 之前） |
| 改话术 | 编辑 `kb/scripts/投诉话术.md` 的对应小节 |
| 批量查看 | Obsidian 里搜索关键词即可跨文件全文检索 |

改完执行：

```bash
node scripts/kb-build.js           # 看差异（只对比不写）
node scripts/kb-build.js --write   # 确认无误后生成
node scripts/validate-data.js      # 数据校验
node scripts/verify-release.js     # 发版校验
```

## 五、注意事项

1. **不要手工编辑 `miniprogram/data/*.js`** —— 下次 `--write` 会覆盖。
2. `id` 不可重复。
3. 逗号分隔字段（`law_ids` / `tags`）用中文逗号或英文逗号均可，脚本都能解析。
4. 字段行必须以 `- ` 开头、小节标题必须用 `**…**` 独占一行，脚本靠这个识别。
5. `kb/` 不参与小程序打包，对包体积**零影响**。
6. 交接给别人：把整个 `kb/` 目录（7 个 md + README）发给对方即可，对方改完发回，你跑 `--write` 重新生成。
