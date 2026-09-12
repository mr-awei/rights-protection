/**
 * kb-split.js - 渠道分类文件超过阈值时自动拆成「目录 + 二级分类 md」。
 *
 * 背景：单文件太大（上千条）难维护；拆分后 kb-build.js 的 listDir 已递归扫描子目录，无需改代码。
 *
 * 用法：
 *   node scripts/kb-split.js                   预览（不写入）
 *   node scripts/kb-split.js --write           执行拆分
 *   node scripts/kb-split.js --threshold=100  自定义阈值（默认 500 条）
 *
 * 拆分后务必跑：node scripts/kb-build.js（校验应 0 差异），确认无误再 --write。
 */
const fs = require('fs');
const path = require('path');
const { KB, parseEntities, buildGroupFile } = require('./kb-lib');

const CH_DIR = path.join(KB, 'channels');
const WRITE = process.argv.includes('--write');
const arg = process.argv.find(a => a.startsWith('--threshold=')) || '--threshold=500';
const THRESHOLD = Number(arg.split('=')[1]) || 500;

const FIELDS = ['id', 'name', 'phone', 'website', 'regulator', 'category_l2', 'category_user', 'category_user_l2',
  'channel_type', 'hot_level', 'related_script_id', 'law_ids', 'issue_types', 'tags'];

if (!fs.existsSync(CH_DIR)) {
  console.log('没有 kb/channels/ 目录，无需拆分。');
  process.exit(0);
}

const files = fs.readdirSync(CH_DIR).filter(f => f.endsWith('.md'));
console.log('渠道文件: ' + files.length + ' 个 | 拆分阈值: ' + THRESHOLD + ' 条\n');

let split = 0;
files.forEach(f => {
  const p = path.join(CH_DIR, f);
  const entities = parseEntities(p);
  if (entities.length <= THRESHOLD) {
    console.log('  ✅ 保持    ' + f + '（' + entities.length + ' 条）');
    return;
  }
  const cat1 = (entities[0].meta && entities[0].meta.category_l1) || f.replace(/\.md$/, '');
  const groups = {};
  entities.forEach(e => {
    const l2 = e.data.category_l2 || '其他';
    if (!groups[l2]) groups[l2] = [];
    groups[l2].push(e);
  });
  const l2List = Object.keys(groups).sort();
  console.log('  ⚠️ 需拆分  ' + f + '（' + entities.length + ' 条 → ' + l2List.length + ' 个二级分类: ' + l2List.join('、') + '）');

  if (!WRITE) return;

  const outDir = path.join(CH_DIR, f.replace(/\.md$/, ''));
  fs.mkdirSync(outDir, { recursive: true });
  l2List.forEach(l2 => {
    const safe = (l2.replace(/[\\/:*?"<>|]/g, '_') || '其他');
    const meta = { type: 'channel-group', category_l1: cat1, category_l2: l2 };
    fs.writeFileSync(path.join(outDir, safe + '.md'),
      buildGroupFile(meta, groups[l2], FIELDS, ['适用范围', '前置条件', '实用提示']), 'utf8');
  });
  // 原单文件内容已全部迁到子目录，删除（可用 git 恢复）
  fs.unlinkSync(p);
  split++;
});

console.log('');
if (!WRITE) {
  console.log('（预览模式，未写入。加 --write 执行拆分）');
} else {
  console.log('✅ 已拆分 ' + split + ' 个文件 → 接着跑：node scripts/kb-build.js（应 0 差异），再 --write 生成数据');
}
