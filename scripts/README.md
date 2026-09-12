# scripts 目录说明

## 一、常用工具（持续维护）

| 脚本 | 用途 | 何时运行 |
|------|------|---------|
| `validate-data.js` | 数据一致性校验（分类 / 渠道 / 话术 / 法律法规 / 空字段） | 改数据后、发版前 |
| `verify-release.js` | 发布交叉验证（版本号、changelog、V1.5 特性、搜索回归） | 发版前 |
| `search-hitrate-test.js` | 搜索命中率测试（目标 ≥80%） | 改搜索逻辑后 |
| `docx-pack.js` | 把解压后的 Office 目录重新打包为 docx / xlsx | 修改 source/*.docx 后 |
| `audit-fill-fields.js` | 审计话术填充表单字段：类型分布、候选覆盖、长名（会退化成「投诉事由」）、高频纯文本 | 优化表单字段前后 |
| `code-audit.js` | 代码审计：未引用组件 / 数据文件、console 统计、大文件清单 | 定期 |
| `generate-index.js` | 生成搜索索引 / 建议词典 | 数据大版本更新后 |
| `export-kb.js` | 导出 AI 友好的知识库 `data/knowledge-base.json`（统一 schema + 显式关系表，不进小程序包） | 改数据后、供 AI 消费前 |

> 用法示例：
> ```bash
> node scripts/validate-data.js
> node scripts/verify-release.js
> node scripts/docx-pack.js _tmp_doc1 "source/官方投诉维权渠道大全（合并版·最终版）.docx"
> node scripts/audit-fill-fields.js
> node scripts/code-audit.js
> ```

## 二、数据 / 法律法规维护

| 脚本 | 用途 |
|------|------|
| `audit-laws.js`、`deep-audit-laws.js` | 法规数据审计 |
| `enrich-laws.js`、`restructure-laws.js`、`update-article-summary.js` | 法规数据补充与重构 |
| `match-channel-articles.js`、`auto-match-legal-basis.js`、`auto-match-scripts.js` | 渠道 ↔ 法规条文 / 话术的自动匹配 |

## 二之二、知识库（AI 接入）

`export-kb.js` 把分散的数据合并为 `data/knowledge-base.json`：231 个实体（渠道 122 / 话术 19 / 法条 90）+ 显式关系表。

结构定义见 **[`docs/知识库结构说明.md`](../docs/知识库结构说明.md)**，含各实体字段、关系类型、已知缺口与 AI 接入的分阶段建议。

> 该导出**不改变小程序运行时存储**，对用户功能、包体积、离线能力**零影响**。

## 三、legacy/ 目录

**历史一次性修复脚本**（批量修法规、清洗同义词与标签、修 UI 样式、修 config 语法等）。

这些脚本对应的问题**已修复完毕、不再有复用价值**，仅作归档保留以便追溯，**请勿再运行**（它们多是按当时的临时状态写的，数据现状已变化，运行可能破坏现有数据）。

如需恢复某个脚本，从 git 历史中取回即可。

## 四、注意事项

- 修改 `source/*.docx` 前，请先关闭 Word 中打开的对应文档（避免互相覆盖）。
- 打包 docx 不能直接用 PowerShell 的 `Compress-Archive`（会生成反斜杠路径的 zip 条目，Word 无法识别），统一使用 `docx-pack.js`。
