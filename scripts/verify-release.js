/**
 * 发布前交叉验证脚本（Release Verification）
 * 用法：node scripts/verify-release.js
 *
 * 验证维度（多轮交叉验证 + 单元测试替代）：
 *  1. 应用版本号一致性：about / settings / profile 页均显示 v1.5.1
 *  2. 数据版本号一致性：app.js / config.js / about / settings 均为 2026.09.6
 *  3. config.js changelog 首条为 2026.09.6（V1.5.1），且字段完整
 *  4. 全站「心里话」6 处文案一致，剑锋指向为最新正确表述
 *  5. 旧表述「侵权与失信」在全仓代码中零残留
 *  6. V1.5 特性：媒体曝光路径 + 所需材料清单组件/数据就绪
 *  7. V1.5.1 搜索相关性回归：无关召回、跨领域召回、同义词自映射、吸顶与首页搜索交互
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

console.log('========== 发布交叉验证（v1.5.1）==========\n');

// ---- 1. 应用版本号 ----
console.log('【1. 应用版本号 = v1.5.1】');
const aboutJs = read(path.join(MINI, 'subpages/about/about.js'));
const settingsJs = read(path.join(MINI, 'subpages/settings/settings.js'));
const profileWxml = read(path.join(MINI, 'pages/profile/profile.wxml'));
ok(/version:\s*'1\.5\.1'/.test(aboutJs), 'about.js version = 1.5.1');
ok(/appVersion:\s*'1\.5\.1'/.test(settingsJs), 'settings.js appVersion = 1.5.1');
ok(/我不能被欺负 v1\.5\.1/.test(profileWxml), 'profile.wxml 页脚版本 = v1.5.1');

// ---- 2. 数据版本号 ----
console.log('\n【2. 数据版本号 = 2026.09.6】');
const appJs = read(path.join(MINI, 'app.js'));
const configJs = read(path.join(MINI, 'data/config.js'));
ok(/dataVersion:\s*'2026\.09\.6'/.test(aboutJs), 'about.js dataVersion = 2026.09.6');
ok(/dataVersion:\s*'2026\.09\.6'/.test(settingsJs), 'settings.js dataVersion = 2026.09.6');
ok(/dataVersion:\s*'2026\.09\.6'/.test(appJs), 'app.js globalData.dataVersion = 2026.09.6');
ok(/"data_version":\s*"2026\.09\.6"/.test(configJs), 'config.js data_version = 2026.09.6');
ok(/"dataVersion":\s*"2026\.09\.6"/.test(configJs), 'config.js dataVersion = 2026.09.6');

// ---- 3. changelog 首条 ----
console.log('\n【3. config.js changelog[0] = V1.5.1】');
delete require.cache[require.resolve(path.join(MINI, 'data/config.js'))];
const config = require(path.join(MINI, 'data/config.js'));
const first = config.changelog && config.changelog[0];
ok(!!first, 'changelog 存在且非空');
ok(first && first.version === '2026.09.6', 'changelog[0].version = 2026.09.6');
ok(first && /V1\.5\.1/.test(first.title || ''), 'changelog[0].title 含 V1.5.1');
ok(first && Array.isArray(first.items) && first.items.length >= 1, 'changelog[0].items 非空');
// V1.5 特性条目分布在历史 changelog 中，检查全量条目而非仅首条
const allLogItems = (config.changelog || []).reduce((acc, c) => acc.concat(c.items || []), []).join('');
ok(/媒体曝光/.test(allLogItems), 'changelog 含「媒体曝光」条目');
ok(/材料清单/.test(allLogItems), 'changelog 含「材料清单」条目');

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

// ---- 7. V1.5.1 搜索相关性回归 ----
console.log('\n【7. V1.5.1 搜索相关性回归】');
const { search } = require(path.join(MINI, 'detail/utils/search.js'));
const dataMain = require(path.join(MINI, 'utils/data.js'));
const dataDetail = require(path.join(MINI, 'detail/utils/data-detail.js'));
const configMain = require(path.join(MINI, 'data/config.js'));
dataMain.loadAllData();

// 展开「结果 + 场景及其渠道/话术」的名称集合
function collectNames(kw) {
  const r = search(kw);
  const names = (r.results || []).map(x => x.name || '');
  (r.scenes || []).forEach(s => {
    names.push(s.name || '');
    (s.channels || []).forEach(id => {
      const c = dataDetail.getChannelById(id);
      if (c) names.push(c.name || '');
    });
    (s.scripts || []).forEach(id => {
      const sc = dataMain.getScriptById(id);
      if (sc) names.push(sc.scene_name || '');
    });
  });
  return names;
}

// 7.1 「劳动」不应召回快递/银行/反垄断/纳税等无关结果
const laborNames = collectNames('劳动');
const laborBad = ['反垄断', '快递', '银行', '纳税', '物业', '装修'].filter(w => laborNames.some(n => n.includes(w)));
ok(laborBad.length === 0, '「劳动」不再召回无关结果' + (laborBad.length ? '（仍含：' + laborBad.join('、') + '）' : ''));

// 7.2 「医院乱收费」不应召回跨领域结果，且命中 12320
const hospitalNames = collectNames('医院乱收费');
const hospitalBad = ['物业', '快递', '银行', '保险'].filter(w => hospitalNames.some(n => n.includes(w)));
ok(hospitalBad.length === 0, '「医院乱收费」不再召回跨领域结果' + (hospitalBad.length ? '（仍含：' + hospitalBad.join('、') + '）' : ''));
ok(hospitalNames.some(n => n.includes('12320')), '「医院乱收费」命中 12320 卫生热线');

// 7.3 「物业乱收费」应命中物业场景
const wuyeScenes = (search('物业乱收费').scenes || []).map(s => s.name);
ok(wuyeScenes.some(n => n.includes('物业')), '「物业乱收费」命中物业场景');

// 7.4 同义词库无自映射
const selfSynonyms = Object.entries(configMain.synonyms || {}).filter(([k, v]) => k === v).map(([k]) => k);
ok(selfSynonyms.length === 0, 'config.synonyms 无自映射' + (selfSynonyms.length ? '（' + selfSynonyms.length + ' 条）' : ''));

// 7.5 搜索结果页：整体吸顶 + 底部安全区留白
const srWxss = read(path.join(MINI, 'detail/search-result/search-result.wxss'));
ok(/\.sticky-head[\s\S]{0,80}position:\s*sticky/.test(srWxss), 'search-result 搜索头+Tab 整体吸顶');
ok(/safe-area-inset-bottom/.test(srWxss), 'search-result 列表底部含安全区留白');

// 7.6 首页搜索框就地编辑（不再跳转独立搜索页）
const indexWxml = read(path.join(MINI, 'pages/index/index.wxml'));
const indexJs = read(path.join(MINI, 'pages/index/index.js'));
ok(/focus="\{\{searchFocus\}\}"/.test(indexWxml), '首页搜索框绑定 focus 就地编辑');
ok(!/detail\/search\/search/.test(indexJs), '首页不再跳转独立搜索页');

// ---- 总结 ----
console.log('\n========== 验证总结 ==========');
console.log('检查项: ' + checks + '  失败: ' + failures.length);
if (failures.length > 0) {
  console.log('\n❌ 失败项:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
} else {
  console.log('\n✅ 全部交叉验证通过，可以发布 v1.5.1。');
  process.exit(0);
}
