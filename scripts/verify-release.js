/**
 * 发布前交叉验证脚本（Release Verification）
 * 用法：node scripts/verify-release.js
 *
 * 验证维度（多轮交叉验证 + 单元测试替代）：
 *  1. 应用版本号一致性：about / settings / profile 页均显示 v1.5.0
 *  2. 数据版本号一致性：app.js / config.js / about / settings 均为 2026.09.5
 *  3. config.js changelog 首条为 2026.09.5（V1.5.0），且字段完整
 *  4. 全站「心里话」6 处文案一致，剑锋指向为最新正确表述
 *  5. 旧表述「侵权与失信」在全仓代码中零残留
 *  6. V1.5 特性：媒体曝光路径 + 所需材料清单组件/数据就绪
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MINI = path.join(ROOT, 'miniprogram');

let failures = [];
let checks = 0;

function ok(cond, name) {
  checks++;
  if (cond) {
    console.log('  ✅ ' + name);
  } else {
    console.log('  ❌ ' + name);
    failures.push(name);
  }
}

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

console.log('========== 发布交叉验证（v1.5.0）==========\n');

// ---- 1. 应用版本号 ----
console.log('【1. 应用版本号 = v1.5.0】');
const aboutJs = read(path.join(MINI, 'subpages/about/about.js'));
const settingsJs = read(path.join(MINI, 'subpages/settings/settings.js'));
const profileWxml = read(path.join(MINI, 'pages/profile/profile.wxml'));
ok(/version:\s*'1\.5\.0'/.test(aboutJs), 'about.js version = 1.5.0');
ok(/appVersion:\s*'1\.5\.0'/.test(settingsJs), 'settings.js appVersion = 1.5.0');
ok(/我不能被欺负 v1\.5\.0/.test(profileWxml), 'profile.wxml 页脚版本 = v1.5.0');

// ---- 2. 数据版本号 ----
console.log('\n【2. 数据版本号 = 2026.09.5】');
const appJs = read(path.join(MINI, 'app.js'));
const configJs = read(path.join(MINI, 'data/config.js'));
ok(/dataVersion:\s*'2026\.09\.5'/.test(aboutJs), 'about.js dataVersion = 2026.09.5');
ok(/dataVersion:\s*'2026\.09\.5'/.test(settingsJs), 'settings.js dataVersion = 2026.09.5');
ok(/dataVersion:\s*'2026\.09\.5'/.test(appJs), 'app.js globalData.dataVersion = 2026.09.5');
ok(/"data_version":\s*"2026\.09\.5"/.test(configJs), 'config.js data_version = 2026.09.5');
ok(/"dataVersion":\s*"2026\.09\.5"/.test(configJs), 'config.js dataVersion = 2026.09.5');

// ---- 3. changelog 首条 ----
console.log('\n【3. config.js changelog[0] = V1.5.0】');
delete require.cache[require.resolve(path.join(MINI, 'data/config.js'))];
const config = require(path.join(MINI, 'data/config.js'));
const first = config.changelog && config.changelog[0];
ok(!!first, 'changelog 存在且非空');
ok(first && first.version === '2026.09.5', 'changelog[0].version = 2026.09.5');
ok(first && /V1\.5\.0/.test(first.title || ''), 'changelog[0].title 含 V1.5.0');
ok(first && Array.isArray(first.items) && first.items.length >= 1, 'changelog[0].items 非空');
ok(first && /媒体曝光/.test((first.items || []).join('')), 'changelog[0].items 含「媒体曝光」');
ok(first && /材料清单/.test((first.items || []).join('')), 'changelog[0].items 含「材料清单」');

// ---- 4. 心里话 6 处一致 ----
console.log('\n【4. 全站「心里话」6 处文案一致】');
const heartFiles = [
  'subpages/origin/origin.wxml',
  'pages/index/index.wxml',
  'detail/script-detail/script-detail.wxml',
  'detail/channel-detail/channel-detail.wxml',
  'subpages/general-template/general-template.wxml',
  'subpages/disclaimer/disclaimer.wxml'
];
const EXPECT = '违法犯罪、道德败坏，以及不作为、乱作为、懒作为';
heartFiles.forEach(f => {
  const txt = read(path.join(MINI, f));
  ok(txt.includes(EXPECT), '心里话一致：' + f);
});

// ---- 5. 旧表述零残留 ----
console.log('\n【5. 旧表述「侵权与失信」零残留】');
const OLD = '侵权与失信';
let oldHits = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walk(full);
    } else if (/\.(js|wxml|wxss|json|md)$/.test(entry.name)) {
      if (read(full).includes(OLD)) oldHits++;
    }
  }
}
walk(MINI);
ok(oldHits === 0, 'miniprogram 内无「侵权与失信」残留（实际 ' + oldHits + ' 处）');

// ---- 6. V1.5 特性：媒体曝光路径 + 所需材料清单 ----
console.log('\n【6. V1.5 特性：媒体曝光路径 + 所需材料清单】');
const appJson = read(path.join(MINI, 'app.json'));
ok(/media-exposure\/media-exposure/.test(appJson), 'app.json 已注册 media-exposure 分包页');
const mediaPage = path.join(MINI, 'subpages/media-exposure/media-exposure.js');
ok(fs.existsSync(mediaPage), 'media-exposure 页 js 存在');
ok(fs.existsSync(path.join(MINI, 'components/materials-checklist/materials-checklist.js')), 'materials-checklist 组件存在');
ok(/materials-checklist/.test(read(path.join(MINI, 'detail/channel-detail/channel-detail.wxml'))), 'channel-detail 引用 materials-checklist');
ok(/materials-checklist/.test(read(path.join(MINI, 'detail/script-detail/script-detail.wxml'))), 'script-detail 引用 materials-checklist');
// 媒体曝光数据：3 条路径，每条含必带材料与合规边界
delete require.cache[require.resolve(path.join(MINI, 'data/media_exposure.js'))];
const media = require(path.join(MINI, 'data/media_exposure.js'));
ok(Array.isArray(media) && media.length === 3, 'media_exposure.js 含 3 条媒体曝光路径');
ok(media.every(m => Array.isArray(m.materials) && m.materials.length > 0), '每条媒体曝光路径均含材料清单');
ok(media.every(m => Array.isArray(m.compliance) && m.compliance.length > 0), '每条媒体曝光路径均含合规边界');
// 媒体曝光入口：每个渠道/话术详情页独立入口（不再放在首页场景里）
ok(/onMediaExposureTap/.test(read(path.join(MINI, 'detail/channel-detail/channel-detail.js'))), 'channel-detail 存在「媒体曝光」入口');
ok(/onMediaExposureTap/.test(read(path.join(MINI, 'detail/script-detail/script-detail.js'))), 'script-detail 存在「媒体曝光」入口');

// ---- 总结 ----
console.log('\n========== 验证总结 ==========');
console.log('检查项: ' + checks + '  失败: ' + failures.length);
if (failures.length > 0) {
  console.log('\n❌ 失败项:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
} else {
  console.log('\n✅ 全部交叉验证通过，可以发布 v1.5.0。');
  process.exit(0);
}
