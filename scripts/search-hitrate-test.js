/**
 * 搜索首条命中率回归测试（对齐 TDD §11.2 / PRD §8.2.2）
 * 复刻 search-result.js 的 doSearch 结果合并逻辑，离线跑 50 个典型 query，
 * 统计「首条命中率」(rank1) 与「召回率@5」。
 *
 * 用法：node scripts/search-hitrate-test.js
 */
const path = require('path');
const MINI = path.resolve(__dirname, '../miniprogram');

const { search } = require(path.join(MINI, 'detail/utils/search.js'));
const data = require(path.join(MINI, 'utils/data.js'));
const dataDetail = require(path.join(MINI, 'detail/utils/data-detail.js'));

// 复刻 search-result.doSearch 的结果合并（场景优先 + 兜底名称匹配）
function runSearch(keyword) {
  const result = search(keyword);
  let results = result.results || [];

  if (result.scenes && result.scenes.length > 0) {
    const sceneResults = [];
    result.scenes.forEach(scene => {
      if (scene.channels && scene.channels.length > 0) {
        scene.channels.forEach(channelId => {
          if (!sceneResults.find(r => r.id === channelId && r.type === 'channel')) {
            const channel = dataDetail.getChannelById(channelId);
            if (channel) {
              sceneResults.push({ ...channel, id: channelId, type: 'channel', sceneName: scene.name });
            }
          }
        });
      }
      if (scene.scripts && scene.scripts.length > 0) {
        scene.scripts.forEach(scriptId => {
          if (!sceneResults.find(r => r.id === scriptId && r.type === 'script')) {
            const script = data.getScriptById(scriptId);
            if (script) {
              sceneResults.push({ ...script, id: scriptId, type: 'script', sceneName: scene.name });
            }
          }
        });
      }
    });
    results = [...sceneResults, ...results];
  }

  if (results.length === 0) {
    // 兜底名称匹配
    const channels = data.searchChannels(keyword).map(c => ({ type: 'channel', id: c.id, name: c.name, phone: c.phone, scope: c.scope, score: 1 }));
    const scripts = data.searchScripts(keyword).map(s => ({ type: 'script', id: s.id, name: s.scene_name, phone: '', scope: s.applicable, score: 1 }));
    results = [...channels, ...scripts];
  }

  return results;
}

// expected: 字符串，匹配 (phone 包含) || (name 包含) || (id 严格相等)
function matchesExpected(item, expected) {
  if (!item) return false;
  if (item.id === expected) return true;
  if (item.phone && item.phone.includes(expected)) return true;
  if (item.name && item.name.includes(expected)) return true;
  if (item.scope && item.scope.includes(expected)) return true;
  return false;
}

// 50 个典型 query（口语化，来源：PRD §10.3 映射表、hot_search_words、SCENES 关键词）
// expected 取 PRD/领域公认的「最优渠道」电话或名称或 id
const QUERIES = [
  { q: '快递被偷了', exp: '12305' },
  { q: '快递破损了', exp: '12305' },
  { q: '快递一直没到', exp: '12305' },
  { q: '快递员态度太差', exp: '12305' },
  { q: '话费莫名其妙被扣了', exp: '12300' },
  { q: '宽带网速特别慢', exp: '12300' },
  { q: '商家不给退款', exp: '12315' },
  { q: '买到假货了', exp: '12315' },
  { q: '商家虚假宣传', exp: '12315' },
  { q: '外卖吃出虫子', exp: '12315' },
  { q: '物业不作为', exp: '12345' },
  { q: '物业乱收费', exp: '12345' },
  { q: '房东不退押金', exp: '12345' },
  { q: '老板欠薪不发工资', exp: 'ch_065' },
  { q: '公司违法辞退', exp: 'ch_063' },
  { q: '银行误导销售', exp: '12378' },
  { q: '保险退保难', exp: '12378' },
  { q: '医院乱收费', exp: 'ch_047' },
  { q: '培训机构跑路', exp: '12315' },
  { q: '噪音扰民', exp: '12345' },
  { q: '电信诈骗被骗钱', exp: '96110' },
  { q: '骚扰电话太多', exp: '12321' },
  { q: '政府部门推诿扯皮', exp: '12345' },
  { q: '出租车拒载', exp: '12328' },
  { q: '网约车加价', exp: '12328' },
  { q: '食品不卫生有异物', exp: '12315' },
  { q: '旅行社强制购物', exp: '12345' },
  { q: '酒店床单不换', exp: '12315' },
  { q: '健身房关门跑路', exp: '12315' },
  { q: '预付卡商家跑路', exp: '12315' },
  { q: '停水停电', exp: '12345' },
  { q: '航班延误退票', exp: '12326' },
  { q: '刷单兼职诈骗', exp: '96110' },
  { q: '买到翻新机', exp: '12315' },
  { q: '游戏充值不给退', exp: '12315' },
  { q: '信用卡乱收费', exp: '12378' },
  { q: '公积金被挪用', exp: '公积金' },
  { q: '公司不给交社保', exp: '12333' },
  { q: '买房开发商延期交房', exp: '12345' },
  { q: '房产中介吃差价', exp: '12345' },
  { q: '医美整形失败', exp: '12315' },
  { q: '美容院办卡跑路', exp: '12315' },
  { q: '孩子被老师体罚', exp: '12315' },
  { q: '外卖商家不处理', exp: '12315' },
  { q: '手机卡被莫名开通业务', exp: '12300' },
  { q: '理财产品亏了', exp: '12378' },
  { q: '快递柜乱收费', exp: '12305' },
  { q: '停车被乱收费', exp: '12345' },
  { q: '网购遇到钓鱼网站', exp: '96110' },
  { q: '个人信息被卖了', exp: '12321' },
  { q: '物业把电梯停了', exp: '12345' },
  { q: '公交司机拒载', exp: '12328' },
  { q: '买到三无产品', exp: '12315' }
];

let firstHit = 0;
let recall5 = 0;
const misses = [];

console.log('query'.padEnd(22), 'expected'.padEnd(10), 'rank1', 'top5', 'actual top1');
console.log('-'.repeat(80));

QUERIES.forEach(({ q, exp }) => {
  const results = runSearch(q);
  const r1 = results[0] || null;
  const hit1 = matchesExpected(r1, exp);
  const hit5 = results.slice(0, 5).some(r => matchesExpected(r, exp));
  if (hit1) firstHit++;
  if (hit5) recall5++;
  const top1desc = r1 ? (r1.type + ':' + (r1.name || '') + (r1.phone ? '(' + r1.phone + ')' : '')) : '(空)';
  console.log(
    q.padEnd(20),
    String(exp).padEnd(10),
    (hit1 ? '✓' : '✗').padEnd(4),
    (hit5 ? '✓' : '✗').padEnd(4),
    top1desc
  );
  if (!hit1) {
    misses.push({ q, exp, rank1: top1desc, top5: results.slice(0, 5).map(r => r.name || r.id) });
  }
});

console.log('-'.repeat(80));
console.log(`首条命中率 (rank1): ${firstHit}/${QUERIES.length} = ${(firstHit / QUERIES.length * 100).toFixed(1)}%  (目标 ≥80%)`);
console.log(`召回率@5        : ${recall5}/${QUERIES.length} = ${(recall5 / QUERIES.length * 100).toFixed(1)}%`);

if (misses.length) {
  console.log('\n未首条命中明细:');
  misses.forEach(m => console.log(`  - "${m.q}" 期望[${m.exp}] 实际top1=${m.rank1} | top5=${m.top5.join(' / ')}`));
}

module.exports = { firstHit, recall5, total: QUERIES.length, misses };
