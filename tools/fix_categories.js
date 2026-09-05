// fix_categories.js - 全面修正分类数据
// 1. 修正category_l1（"第二编"→真正的一级分类）
// 2. 修正错误的tags
// 3. 建立渠道ID到用户视角分类的精准映射
// 4. 重新生成索引和分片文件

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'miniprogram', 'data');

// ========== 用户视角10个分类 ==========
const USER_CATEGORIES = [
  { name: '交通物流', icon: '🚄' },
  { name: '电信运营', icon: '📱' },
  { name: '消费购物', icon: '🛒' },
  { name: '金融保险', icon: '💰' },
  { name: '房产物业', icon: '🏠' },
  { name: '劳动用工', icon: '💼' },
  { name: '医疗教育', icon: '🏥' },
  { name: '环保城管', icon: '🌿' },
  { name: '政务纪检', icon: '⚖️' },
  { name: '网络安全', icon: '🛡️' }
];

// ========== 渠道ID到用户分类的精准映射 ==========
const CHANNEL_CATEGORY_MAP = {
  // 交通物流（快递+铁路+民航+公路+公交+地铁+水上搜救）
  'ch_002': '交通物流',  // 国家邮政局
  'ch_010': '交通物流',  // 铁路12306
  'ch_011': '交通物流',  // 12327铁路监督
  'ch_012': '交通物流',  // 民航12326
  'ch_013': '交通物流',  // 12328交通运输
  'ch_014': '交通物流',  // 12395水上搜救
  'ch_015': '交通物流',  // 12328城市客运
  'ch_016': '交通物流',  // 成都公交
  'ch_017': '交通物流',  // 成都地铁

  // 电信运营
  'ch_001': '电信运营',  // 工信部电信申诉

  // 消费购物（12315+电商+价格+广告+质量+知识产权+食品+药品+旅游+农业+烟草+商务）
  'ch_024': '消费购物',  // 全国12315
  'ch_025': '消费购物',  // 12315电商投诉
  'ch_026': '消费购物',  // 12315价格投诉
  'ch_027': '消费购物',  // 12315广告违法
  'ch_028': '消费购物',  // 12315产品质量
  'ch_029': '消费购物',  // 12330知识产权
  'ch_038': '消费购物',  // 12312商务领域
  'ch_039': '消费购物',  // 12313烟草专卖
  'ch_040': '消费购物',  // 12316农业三农
  'ch_043': '消费购物',  // 香港消费者委员会
  'ch_052': '消费购物',  // 12345旅游投诉
  'ch_053': '消费购物',  // 12315食品安全
  'ch_054': '消费购物',  // 食品安全内部知情人
  'ch_055': '消费购物',  // 12315药品医疗器械

  // 金融保险（银行+保险+证券+基金+金融消费+互联网金融+境外金融）
  'ch_018': '金融保险',  // 12378银行保险
  'ch_019': '金融保险',  // 12363金融消费
  'ch_020': '金融保险',  // 互联网金融举报
  'ch_021': '金融保险',  // 12386证监会
  'ch_022': '金融保险',  // 中证中小投资者
  'ch_023': '金融保险',  // 证券交易所投资者
  'ch_032': '金融保险',  // 反垄断举报
  'ch_033': '金融保险',  // 公平竞争审查
  'ch_041': '金融保险',  // 香港交易所
  'ch_042': '金融保险',  // 香港证监会
  'ch_044': '金融保险',  // 欧盟GDPR
  'ch_045': '金融保险',  // 美国SEC
  'ch_046': '金融保险',  // 美国FTC/FBI
  'ch_103': '金融保险',  // 四川金融监管局
  'ch_104': '金融保险',  // 四川证监局
  'ch_105': '金融保险',  // 成都12315与12345双号并行

  // 房产物业（住建+物业+供水+燃气+供热+工程质量+电力能源）
  'ch_003': '房产物业',  // 国家电网/南方电网
  'ch_004': '房产物业',  // 12398能源监管
  'ch_005': '房产物业',  // 12345供水诉求
  'ch_006': '房产物业',  // 成都自来水公司
  'ch_007': '房产物业',  // 12345燃气诉求
  'ch_008': '房产物业',  // 成都燃气集团
  'ch_009': '房产物业',  // 12345供热诉求
  'ch_056': '房产物业',  // 12345住建/物业投诉
  'ch_057': '房产物业',  // 住房和城乡建设部
  'ch_058': '房产物业',  // 工程质量举报

  // 劳动用工（人社+社保+公积金+欠薪+工会+税务）
  'ch_063': '劳动用工',  // 12333人社服务
  'ch_064': '劳动用工',  // 12329公积金举报
  'ch_065': '劳动用工',  // 全国根治欠薪平台
  'ch_066': '劳动用工',  // 12366纳税服务
  'ch_096': '劳动用工',  // 12351工会维权

  // 医疗教育（医疗+卫生+医保+教育+科研）
  'ch_047': '医疗教育',  // 12320卫生热线
  'ch_048': '医疗教育',  // 医疗纠纷人民调解
  'ch_049': '医疗教育',  // 12393医保举报
  'ch_050': '医疗教育',  // 教育部监督举报
  'ch_051': '医疗教育',  // 科研诚信举报
  'ch_106': '医疗教育',  // 四川12320卫生热线

  // 环保城管（环保+城管）
  'ch_059': '环保城管',  // 12345环保举报
  'ch_060': '环保城管',  // 全国生态环境信访投诉
  'ch_095': '环保城管',  // 12342城管举报

  // 政务纪检（政务+纪检+司法+公安+安全生产+消防+水利+自然资源+海关+移民+外交+国家安全+民政+广电+扫黄打非+特殊群体+退役军人+会计+统计+政府采购）
  'ch_034': '政务纪检',  // 税收违法举报
  'ch_035': '政务纪检',  // 会计违法举报
  'ch_036': '政务纪检',  // 统计违法举报
  'ch_037': '政务纪检',  // 政府采购举报
  'ch_061': '政务纪检',  // 12314水利举报
  'ch_062': '政务纪检',  // 12336自然资源违法举报
  'ch_067': '政务纪检',  // 公安部举报中心12389
  'ch_068': '政务纪检',  // 全国法院12368
  'ch_069': '政务纪检',  // 12348法律援助
  'ch_070': '政务纪检',  // 法院工作人员违纪举报
  'ch_071': '政务纪检',  // 中央纪委12388
  'ch_072': '政务纪检',  // 12309检察服务
  'ch_073': '政务纪检',  // 12380组织部门举报
  'ch_074': '政务纪检',  // 12337扫黑除恶
  'ch_075': '政务纪检',  // 12310机构编制举报
  'ch_076': '政务纪检',  // 审计署信访举报
  'ch_077': '政务纪检',  // 国资委举报
  'ch_078': '政务纪检',  // 广电总局投诉
  'ch_079': '政务纪检',  // 扫黄打非12390
  'ch_080': '政务纪检',  // 民政部投诉
  'ch_081': '政务纪检',  // 12349民政举报
  'ch_085': '政务纪检',  // 12345全国统一号码
  'ch_086': '政务纪检',  // 政务服务好差评
  'ch_087': '政务纪检',  // 国家信访局
  'ch_088': '政务纪检',  // 12350安全生产举报
  'ch_089': '政务纪检',  // 96119消防举报
  'ch_090': '政务纪检',  // 12119森林火警
  'ch_091': '政务纪检',  // 12360海关举报
  'ch_092': '政务纪检',  // 12367移民管理局
  'ch_093': '政务纪检',  // 12308外交部领事保护
  'ch_094': '政务纪检',  // 12339国家安全举报
  'ch_097': '政务纪检',  // 12338妇女维权
  'ch_098': '政务纪检',  // 12355青少年服务
  'ch_099': '政务纪检',  // 12385残疾人服务
  'ch_100': '政务纪检',  // 12397退役军人服务
  'ch_101': '政务纪检',  // 成都12345
  'ch_102': '政务纪检',  // 四川12345

  // 网络安全（反诈+110+网络不良信息+网络违法犯罪）
  'ch_030': '网络安全',  // 96110反诈
  'ch_031': '网络安全',  // 110报警
  'ch_082': '网络安全',  // 12377违法不良信息
  'ch_083': '网络安全',  // 12321网络不良垃圾信息
  'ch_084': '网络安全',  // 网络违法犯罪举报

  // ===== 重复数据（ch_107-ch_122）的分类映射 =====
  'ch_107': '交通物流',  // 12395水上遇险求救（=ch_014）
  'ch_108': '金融保险',  // 反垄断举报（=ch_032）
  'ch_109': '政务纪检',  // 会计违法举报（=ch_035）
  'ch_110': '医疗教育',  // 12393医保服务（=ch_049）
  'ch_111': '政务纪检',  // 12314水利监督（=ch_061）
  'ch_112': '劳动用工',  // 12329住房公积金（=ch_064）
  'ch_113': '政务纪检',  // 12339国家安全（=ch_094）
  'ch_114': '政务纪检',  // 12348法律援助（=ch_069）
  'ch_115': '政务纪检',  // 12349民政服务（=ch_081）
  'ch_116': '政务纪检',  // 12360海关服务（=ch_091）
  'ch_117': '环保城管',  // 12342城管服务（=ch_095）
  'ch_118': '政务纪检',  // 12338妇女维权（=ch_097）
  'ch_119': '政务纪检',  // 12355青少年服务（=ch_098）
  'ch_120': '医疗教育',  // 科研诚信举报（=ch_051）
  'ch_121': '政务纪检',  // 政府采购举报（=ch_037）
  'ch_122': '政务纪检',  // 96119火灾隐患（=ch_089）
};

// ========== 需要清理的错误tags ==========
// 这些tags是转换脚本自动生成时误加的，需要移除
const WRONG_TAGS = [
  '社会服务与政务司法',
  '基础民生与公共交通',
  '金融与商业消费',
  '四川省 / 成都市地方渠道专章',
  '第二编  各行业领域投诉渠道',
  '事业单位与公共服务',
  '劳动用工 / 社保',
  '反垄断与经济违法举报',
  '城市公交 / 地铁',
];

// ========== 主函数 ==========
function main() {
  console.log('=== 开始修正分类数据 ===\n');

  // 1. 读取完整渠道数据
  const channelsPath = path.join(DATA_DIR, 'channels.js');
  const channels = require(channelsPath);
  console.log(`读取到 ${channels.length} 条渠道数据`);

  // 2. 修正每条渠道
  let fixedCount = 0;
  let tagFixedCount = 0;
  let unmappedChannels = [];

  channels.forEach(ch => {
    // 2.1 修正category_l1：如果是"第二编"，改为category_l2的值
    if (ch.category_l1 === '第二编  各行业领域投诉渠道' || ch.category_l1 === '第二编 各行业领域投诉渠道') {
      ch.category_l1 = ch.category_l2 || '未分类';
      fixedCount++;
    }

    // 2.2 清理错误的tags
    if (Array.isArray(ch.tags)) {
      const originalLength = ch.tags.length;
      ch.tags = ch.tags.filter(tag => !WRONG_TAGS.includes(tag));
      // 同时清理tags里误加的"环保"（只有真正的环保渠道才能有这个tag）
      const isEnvChannel = ['ch_059', 'ch_060'].includes(ch.id);
      if (!isEnvChannel && ch.tags.includes('环保')) {
        ch.tags = ch.tags.filter(t => t !== '环保');
      }
      if (ch.tags.length !== originalLength) {
        tagFixedCount++;
      }
    }

    // 2.3 添加用户视角分类字段
    const userCategory = CHANNEL_CATEGORY_MAP[ch.id];
    if (userCategory) {
      ch.category_user = userCategory;
    } else {
      unmappedChannels.push(ch.id + ' ' + ch.name);
    }
  });

  console.log(`修正category_l1: ${fixedCount} 条`);
  console.log(`修正tags: ${tagFixedCount} 条`);
  console.log(`添加用户视角分类: ${channels.length - unmappedChannels.length} 条`);
  if (unmappedChannels.length > 0) {
    console.log(`\n⚠️  未映射到用户分类的渠道（${unmappedChannels.length}条）:`);
    unmappedChannels.forEach(c => console.log('  ' + c));
  }

  // 3. 统计各用户分类的渠道数量
  console.log('\n=== 各用户分类渠道数量 ===');
  const catCount = {};
  channels.forEach(ch => {
    const cat = ch.category_user || '未分类';
    catCount[cat] = (catCount[cat] || 0) + 1;
  });
  USER_CATEGORIES.forEach(cat => {
    console.log(`  ${cat.icon} ${cat.name}: ${catCount[cat.name] || 0} 条`);
  });
  if (catCount['未分类']) {
    console.log(`  ❓ 未分类: ${catCount['未分类']} 条`);
  }

  // 4. 写回完整数据文件（channels.js）
  const channelsJsContent = '// channels.js - 完整渠道数据（已修正分类）\nmodule.exports = ' +
    JSON.stringify(channels, null, 2) + ';\n';
  fs.writeFileSync(channelsPath, channelsJsContent, 'utf8');
  console.log(`\n已写回 ${channelsPath}`);

  // 5. 重新生成轻量索引（channels_index.js）
  const index = channels.map((ch, i) => ({
    id: ch.id,
    name: ch.name,
    phone: ch.phone || '',
    tags: ch.tags || [],
    category_l1: ch.category_l1,
    category_l2: ch.category_l2,
    category_user: ch.category_user,
    hot_level: ch.hot_level || 0,
    part_num: Math.floor(i / 50) + 1
  }));
  const indexPath = path.join(DATA_DIR, 'channels_index.js');
  const indexContent = '// channels_index.js - 轻量索引（启动加载，已修正分类）\nmodule.exports = ' +
    JSON.stringify(index, null, 2) + ';\n';
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log(`已生成 ${indexPath} (${index.length}条)`);

  // 6. 重新生成分片文件（每50条一个分片）
  const CHANNELS_PER_PART = 50;
  const numParts = Math.ceil(channels.length / CHANNELS_PER_PART);
  const partFiles = [];

  for (let p = 0; p < numParts; p++) {
    const start = p * CHANNELS_PER_PART;
    const end = Math.min(start + CHANNELS_PER_PART, channels.length);
    const partData = channels.slice(start, end);
    const partNum = p + 1;
    const partPath = path.join(DATA_DIR, `channels_part_${partNum}.js`);
    const partContent = `// channels_part_${partNum}.js - 渠道分片${partNum}（${start+1}-${end}条，已修正分类）\nmodule.exports = ` +
      JSON.stringify(partData, null, 2) + ';\n';
    fs.writeFileSync(partPath, partContent, 'utf8');
    partFiles.push(`channels_part_${partNum}.js`);
    console.log(`已生成 channels_part_${partNum}.js (${partData.length}条)`);
  }

  // 7. 更新分片配置（channels_config.js）
  const configPath = path.join(DATA_DIR, 'channels_config.js');
  const configContent = `// channels_config.js - 分片配置（已修正分类）
module.exports = {
  total: ${channels.length},
  num_parts: ${numParts},
  channels_per_part: ${CHANNELS_PER_PART},
  part_files: ${JSON.stringify(partFiles)}
};
`;
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log(`已更新 ${configPath}`);

  // 8. 生成用户分类配置文件（categories.js）
  const categoriesPath = path.join(DATA_DIR, 'categories.js');
  const categoriesContent = `// categories.js - 用户视角分类配置（已修正）
module.exports = ${JSON.stringify(USER_CATEGORIES, null, 2)};
`;
  fs.writeFileSync(categoriesPath, categoriesContent, 'utf8');
  console.log(`已更新 ${categoriesPath}`);

  console.log('\n=== 分类数据修正完成 ===');
  console.log('总计:', channels.length, '条渠道');
  console.log('分片:', numParts, '个');
  console.log('用户分类:', USER_CATEGORIES.length, '个');
}

main();
