// fix_categories.js - 全面修正分类数据（一级+二级分类体系）
// 1. 修正category_l1（"第二编"→真正的一级分类）
// 2. 修正错误的tags
// 3. 建立渠道ID到用户视角分类的精准映射（一级+二级）
// 4. 重新生成索引和分片文件

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'miniprogram', 'data');

// ========== 用户视角分类体系（一级+二级） ==========
const CATEGORY_TREE = [
  {
    name: '交通物流', icon: '🚄', color: '#3B82F6',
    children: [
      { name: '快递邮政' },
      { name: '铁路民航' },
      { name: '公路水运' },
      { name: '城市公交' }
    ]
  },
  {
    name: '电信运营', icon: '📱', color: '#8B5CF6',
    children: [
      { name: '电信申诉' }
    ]
  },
  {
    name: '消费购物', icon: '🛒', color: '#F59E0B',
    children: [
      { name: '市场监管' },
      { name: '食品药品' },
      { name: '旅游服务' },
      { name: '农业商务' },
      { name: '境外消费' }
    ]
  },
  {
    name: '金融保险', icon: '💰', color: '#10B981',
    children: [
      { name: '银行保险' },
      { name: '证券基金' },
      { name: '互联网金融' },
      { name: '反垄断' },
      { name: '境外金融' },
      { name: '地方金融' }
    ]
  },
  {
    name: '房产物业', icon: '🏠', color: '#EF4444',
    children: [
      { name: '住建物业' },
      { name: '供水燃气' },
      { name: '电力能源' },
      { name: '工程质量' }
    ]
  },
  {
    name: '劳动用工', icon: '💼', color: '#6366F1',
    children: [
      { name: '人社社保' },
      { name: '公积金' },
      { name: '欠薪维权' },
      { name: '税务工会' }
    ]
  },
  {
    name: '医疗教育', icon: '🏥', color: '#EC4899',
    children: [
      { name: '医疗卫生' },
      { name: '医保服务' },
      { name: '教育科研' },
      { name: '地方卫生' }
    ]
  },
  {
    name: '环保城管', icon: '🌿', color: '#14B8A6',
    children: [
      { name: '环境保护' },
      { name: '城市管理' }
    ]
  },
  {
    name: '政务纪检', icon: '⚖️', color: '#64748B',
    children: [
      { name: '政务服务' },
      { name: '纪检监察' },
      { name: '司法公安' },
      { name: '安全生产' },
      { name: '自然资源' },
      { name: '民政民生' },
      { name: '财税审计' }
    ]
  },
  {
    name: '网络安全', icon: '🛡️', color: '#0EA5E9',
    children: [
      { name: '反诈预警' },
      { name: '网络举报' },
      { name: '违法犯罪' }
    ]
  }
];

// ========== 渠道ID到一级+二级分类的精准映射 ==========
const CHANNEL_CATEGORY_MAP = {
  // ===== 交通物流 =====
  'ch_002': { l1: '交通物流', l2: '快递邮政' },  // 国家邮政局
  'ch_010': { l1: '交通物流', l2: '铁路民航' },  // 铁路12306
  'ch_011': { l1: '交通物流', l2: '铁路民航' },  // 12327铁路监督
  'ch_012': { l1: '交通物流', l2: '铁路民航' },  // 民航12326
  'ch_013': { l1: '交通物流', l2: '公路水运' },  // 12328交通运输
  'ch_014': { l1: '交通物流', l2: '公路水运' },  // 12395水上搜救
  'ch_015': { l1: '交通物流', l2: '公路水运' },  // 12328城市客运
  'ch_016': { l1: '交通物流', l2: '城市公交' },  // 成都公交
  'ch_017': { l1: '交通物流', l2: '城市公交' },  // 成都地铁
  'ch_107': { l1: '交通物流', l2: '公路水运' },  // 12395水上遇险求救（重复）

  // ===== 电信运营 =====
  'ch_001': { l1: '电信运营', l2: '电信申诉' },  // 工信部电信申诉

  // ===== 消费购物 =====
  'ch_024': { l1: '消费购物', l2: '市场监管' },  // 全国12315
  'ch_025': { l1: '消费购物', l2: '市场监管' },  // 12315电商投诉
  'ch_026': { l1: '消费购物', l2: '市场监管' },  // 12315价格投诉
  'ch_027': { l1: '消费购物', l2: '市场监管' },  // 12315广告违法
  'ch_028': { l1: '消费购物', l2: '市场监管' },  // 12315产品质量
  'ch_029': { l1: '消费购物', l2: '市场监管' },  // 12330知识产权
  'ch_038': { l1: '消费购物', l2: '农业商务' },  // 12312商务领域
  'ch_039': { l1: '消费购物', l2: '农业商务' },  // 12313烟草专卖
  'ch_040': { l1: '消费购物', l2: '农业商务' },  // 12316农业三农
  'ch_043': { l1: '消费购物', l2: '境外消费' },  // 香港消费者委员会
  'ch_052': { l1: '消费购物', l2: '旅游服务' },  // 12345旅游投诉
  'ch_053': { l1: '消费购物', l2: '食品药品' },  // 12315食品安全
  'ch_054': { l1: '消费购物', l2: '食品药品' },  // 食品安全内部知情人
  'ch_055': { l1: '消费购物', l2: '食品药品' },  // 12315药品医疗器械

  // ===== 金融保险 =====
  'ch_018': { l1: '金融保险', l2: '银行保险' },  // 12378银行保险
  'ch_019': { l1: '金融保险', l2: '银行保险' },  // 12363金融消费
  'ch_020': { l1: '金融保险', l2: '互联网金融' },  // 互联网金融举报
  'ch_021': { l1: '金融保险', l2: '证券基金' },  // 12386证监会
  'ch_022': { l1: '金融保险', l2: '证券基金' },  // 中证中小投资者
  'ch_023': { l1: '金融保险', l2: '证券基金' },  // 证券交易所投资者
  'ch_032': { l1: '金融保险', l2: '反垄断' },  // 反垄断举报
  'ch_033': { l1: '金融保险', l2: '反垄断' },  // 公平竞争审查
  'ch_041': { l1: '金融保险', l2: '境外金融' },  // 香港交易所
  'ch_042': { l1: '金融保险', l2: '境外金融' },  // 香港证监会
  'ch_044': { l1: '金融保险', l2: '境外金融' },  // 欧盟GDPR
  'ch_045': { l1: '金融保险', l2: '境外金融' },  // 美国SEC
  'ch_046': { l1: '金融保险', l2: '境外金融' },  // 美国FTC/FBI
  'ch_103': { l1: '金融保险', l2: '地方金融' },  // 四川金融监管局
  'ch_104': { l1: '金融保险', l2: '地方金融' },  // 四川证监局
  'ch_105': { l1: '金融保险', l2: '地方金融' },  // 成都12315与12345双号并行
  'ch_108': { l1: '金融保险', l2: '反垄断' },  // 反垄断举报（重复）

  // ===== 房产物业 =====
  'ch_003': { l1: '房产物业', l2: '电力能源' },  // 国家电网/南方电网
  'ch_004': { l1: '房产物业', l2: '电力能源' },  // 12398能源监管
  'ch_005': { l1: '房产物业', l2: '供水燃气' },  // 12345供水诉求
  'ch_006': { l1: '房产物业', l2: '供水燃气' },  // 成都自来水公司
  'ch_007': { l1: '房产物业', l2: '供水燃气' },  // 12345燃气诉求
  'ch_008': { l1: '房产物业', l2: '供水燃气' },  // 成都燃气集团
  'ch_009': { l1: '房产物业', l2: '供水燃气' },  // 12345供热诉求
  'ch_056': { l1: '房产物业', l2: '住建物业' },  // 12345住建/物业投诉
  'ch_057': { l1: '房产物业', l2: '住建物业' },  // 住房和城乡建设部
  'ch_058': { l1: '房产物业', l2: '工程质量' },  // 工程质量举报

  // ===== 劳动用工 =====
  'ch_063': { l1: '劳动用工', l2: '人社社保' },  // 12333人社服务
  'ch_064': { l1: '劳动用工', l2: '公积金' },  // 12329公积金举报
  'ch_065': { l1: '劳动用工', l2: '欠薪维权' },  // 全国根治欠薪平台
  'ch_066': { l1: '劳动用工', l2: '税务工会' },  // 12366纳税服务
  'ch_096': { l1: '劳动用工', l2: '税务工会' },  // 12351工会维权
  'ch_112': { l1: '劳动用工', l2: '公积金' },  // 12329住房公积金热线（重复）

  // ===== 医疗教育 =====
  'ch_047': { l1: '医疗教育', l2: '医疗卫生' },  // 12320卫生热线
  'ch_048': { l1: '医疗教育', l2: '医疗卫生' },  // 医疗纠纷人民调解
  'ch_049': { l1: '医疗教育', l2: '医保服务' },  // 12393医保举报
  'ch_050': { l1: '医疗教育', l2: '教育科研' },  // 教育部监督举报
  'ch_051': { l1: '医疗教育', l2: '教育科研' },  // 科研诚信举报
  'ch_106': { l1: '医疗教育', l2: '地方卫生' },  // 四川12320卫生热线
  'ch_110': { l1: '医疗教育', l2: '医保服务' },  // 12393医保服务热线（重复）
  'ch_120': { l1: '医疗教育', l2: '教育科研' },  // 科研诚信举报（重复）

  // ===== 环保城管 =====
  'ch_059': { l1: '环保城管', l2: '环境保护' },  // 12345环保举报
  'ch_060': { l1: '环保城管', l2: '环境保护' },  // 全国生态环境信访投诉
  'ch_095': { l1: '环保城管', l2: '城市管理' },  // 12342城管举报
  'ch_117': { l1: '环保城管', l2: '城市管理' },  // 12342城管服务热线（重复）

  // ===== 政务纪检 =====
  // 政务服务
  'ch_085': { l1: '政务纪检', l2: '政务服务' },  // 12345全国统一号码
  'ch_086': { l1: '政务纪检', l2: '政务服务' },  // 政务服务好差评
  'ch_087': { l1: '政务纪检', l2: '政务服务' },  // 国家信访局
  'ch_101': { l1: '政务纪检', l2: '政务服务' },  // 成都12345
  'ch_102': { l1: '政务纪检', l2: '政务服务' },  // 四川12345
  // 纪检监察
  'ch_071': { l1: '政务纪检', l2: '纪检监察' },  // 中央纪委12388
  'ch_073': { l1: '政务纪检', l2: '纪检监察' },  // 12380组织部门举报
  'ch_075': { l1: '政务纪检', l2: '纪检监察' },  // 12310机构编制举报
  // 司法公安
  'ch_067': { l1: '政务纪检', l2: '司法公安' },  // 公安部举报中心12389
  'ch_068': { l1: '政务纪检', l2: '司法公安' },  // 全国法院12368
  'ch_069': { l1: '政务纪检', l2: '司法公安' },  // 12348法律援助
  'ch_070': { l1: '政务纪检', l2: '司法公安' },  // 法院工作人员违纪举报
  'ch_072': { l1: '政务纪检', l2: '司法公安' },  // 12309检察服务
  'ch_074': { l1: '政务纪检', l2: '司法公安' },  // 12337扫黑除恶举报平台
  'ch_114': { l1: '政务纪检', l2: '司法公安' },  // 12348法律援助热线（重复）
  // 安全生产
  'ch_088': { l1: '政务纪检', l2: '安全生产' },  // 12350安全生产举报
  'ch_089': { l1: '政务纪检', l2: '安全生产' },  // 96119消防举报
  'ch_090': { l1: '政务纪检', l2: '安全生产' },  // 12119森林火警
  'ch_122': { l1: '政务纪检', l2: '安全生产' },  // 96119火灾隐患（重复）
  // 自然资源
  'ch_061': { l1: '政务纪检', l2: '自然资源' },  // 12314水利举报
  'ch_062': { l1: '政务纪检', l2: '自然资源' },  // 12336自然资源违法举报
  'ch_091': { l1: '政务纪检', l2: '自然资源' },  // 12360海关举报
  'ch_111': { l1: '政务纪检', l2: '自然资源' },  // 12314水利部监督举报（重复）
  'ch_116': { l1: '政务纪检', l2: '自然资源' },  // 12360海关服务热线（重复）
  // 民政民生
  'ch_078': { l1: '政务纪检', l2: '民政民生' },  // 广电总局投诉
  'ch_079': { l1: '政务纪检', l2: '民政民生' },  // 扫黄打非12390
  'ch_080': { l1: '政务纪检', l2: '民政民生' },  // 民政部投诉
  'ch_081': { l1: '政务纪检', l2: '民政民生' },  // 12349民政举报
  'ch_092': { l1: '政务纪检', l2: '民政民生' },  // 12367移民管理局
  'ch_093': { l1: '政务纪检', l2: '民政民生' },  // 12308外交部领事保护
  'ch_094': { l1: '政务纪检', l2: '民政民生' },  // 12339国家安全举报
  'ch_097': { l1: '政务纪检', l2: '民政民生' },  // 12338妇女维权
  'ch_098': { l1: '政务纪检', l2: '民政民生' },  // 12355青少年服务
  'ch_099': { l1: '政务纪检', l2: '民政民生' },  // 12385残疾人服务
  'ch_100': { l1: '政务纪检', l2: '民政民生' },  // 12397退役军人服务
  'ch_113': { l1: '政务纪检', l2: '民政民生' },  // 12339国家安全机关举报（重复）
  'ch_115': { l1: '政务纪检', l2: '民政民生' },  // 12349民政服务热线（重复）
  'ch_118': { l1: '政务纪检', l2: '民政民生' },  // 12338妇女维权公益服务（重复）
  'ch_119': { l1: '政务纪检', l2: '民政民生' },  // 12355青少年服务台（重复）
  // 财税审计
  'ch_034': { l1: '政务纪检', l2: '财税审计' },  // 税收违法举报
  'ch_035': { l1: '政务纪检', l2: '财税审计' },  // 会计违法举报
  'ch_036': { l1: '政务纪检', l2: '财税审计' },  // 统计违法举报
  'ch_037': { l1: '政务纪检', l2: '财税审计' },  // 政府采购举报
  'ch_076': { l1: '政务纪检', l2: '财税审计' },  // 审计署信访举报
  'ch_077': { l1: '政务纪检', l2: '财税审计' },  // 国资委举报
  'ch_109': { l1: '政务纪检', l2: '财税审计' },  // 会计违法举报（重复）
  'ch_121': { l1: '政务纪检', l2: '财税审计' },  // 政府采购举报（重复）

  // ===== 网络安全 =====
  'ch_030': { l1: '网络安全', l2: '反诈预警' },  // 96110反诈
  'ch_031': { l1: '网络安全', l2: '反诈预警' },  // 110报警
  'ch_082': { l1: '网络安全', l2: '网络举报' },  // 12377违法不良信息
  'ch_083': { l1: '网络安全', l2: '网络举报' },  // 12321网络不良垃圾信息
  'ch_084': { l1: '网络安全', l2: '违法犯罪' },  // 网络违法犯罪举报
};

// ========== 需要清理的错误tags ==========
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
  console.log('=== 开始修正分类数据（一级+二级分类体系）===\n');

  // 1. 读取完整渠道数据
  const channelsPath = path.join(DATA_DIR, 'channels.js');
  const channels = require(channelsPath);
  console.log(`读取到 ${channels.length} 条渠道数据`);

  // 2. 修正每条渠道
  let fixedCount = 0;
  let tagFixedCount = 0;
  let unmappedChannels = [];

  channels.forEach(ch => {
    // 2.1 修正category_l1
    if (ch.category_l1 === '第二编  各行业领域投诉渠道' || ch.category_l1 === '第二编 各行业领域投诉渠道') {
      ch.category_l1 = ch.category_l2 || '未分类';
      fixedCount++;
    }

    // 2.2 清理错误的tags
    if (Array.isArray(ch.tags)) {
      const originalLength = ch.tags.length;
      ch.tags = ch.tags.filter(tag => !WRONG_TAGS.includes(tag));
      // 清理tags里误加的"环保"（只有真正的环保渠道才能有这个tag）
      const isEnvChannel = ['ch_059', 'ch_060'].includes(ch.id);
      if (!isEnvChannel && ch.tags.includes('环保')) {
        ch.tags = ch.tags.filter(t => t !== '环保');
      }
      if (ch.tags.length !== originalLength) {
        tagFixedCount++;
      }
    }

    // 2.3 添加用户视角分类字段（一级+二级）
    const cat = CHANNEL_CATEGORY_MAP[ch.id];
    if (cat) {
      ch.category_user = cat.l1;
      ch.category_user_l2 = cat.l2;
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

  // 3. 统计各一级分类和二级分类的渠道数量
  console.log('\n=== 各一级分类渠道数量 ===');
  const l1Count = {};
  const l2Count = {};
  channels.forEach(ch => {
    const l1 = ch.category_user || '未分类';
    const l2 = ch.category_user_l2 || '未分类';
    l1Count[l1] = (l1Count[l1] || 0) + 1;
    if (!l2Count[l1]) l2Count[l1] = {};
    l2Count[l1][l2] = (l2Count[l1][l2] || 0) + 1;
  });
  CATEGORY_TREE.forEach(cat => {
    console.log(`\n${cat.icon} ${cat.name}: ${l1Count[cat.name] || 0} 条`);
    if (cat.children) {
      cat.children.forEach(sub => {
        console.log(`  └ ${sub.name}: ${l2Count[cat.name]?.[sub.name] || 0} 条`);
      });
    }
  });

  // 4. 写回完整数据文件
  const channelsJsContent = '// channels.js - 完整渠道数据（已修正分类，含一级+二级用户分类）\nmodule.exports = ' +
    JSON.stringify(channels, null, 2) + ';\n';
  fs.writeFileSync(channelsPath, channelsJsContent, 'utf8');
  console.log(`\n已写回 ${channelsPath}`);

  // 5. 重新生成轻量索引
  const index = channels.map((ch, i) => ({
    id: ch.id,
    name: ch.name,
    phone: ch.phone || '',
    tags: ch.tags || [],
    category_l1: ch.category_l1,
    category_l2: ch.category_l2,
    category_user: ch.category_user,
    category_user_l2: ch.category_user_l2,
    hot_level: ch.hot_level || 0,
    part_num: Math.floor(i / 50) + 1
  }));
  const indexPath = path.join(DATA_DIR, 'channels_index.js');
  const indexContent = '// channels_index.js - 轻量索引（启动加载，含一级+二级用户分类）\nmodule.exports = ' +
    JSON.stringify(index, null, 2) + ';\n';
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log(`已生成 ${indexPath} (${index.length}条)`);

  // 6. 重新生成分片文件
  const CHANNELS_PER_PART = 50;
  const numParts = Math.ceil(channels.length / CHANNELS_PER_PART);
  const partFiles = [];

  for (let p = 0; p < numParts; p++) {
    const start = p * CHANNELS_PER_PART;
    const end = Math.min(start + CHANNELS_PER_PART, channels.length);
    const partData = channels.slice(start, end);
    const partNum = p + 1;
    const partPath = path.join(DATA_DIR, `channels_part_${partNum}.js`);
    const partContent = `// channels_part_${partNum}.js - 渠道分片${partNum}（${start+1}-${end}条，含一级+二级用户分类）\nmodule.exports = ` +
      JSON.stringify(partData, null, 2) + ';\n';
    fs.writeFileSync(partPath, partContent, 'utf8');
    partFiles.push(`channels_part_${partNum}.js`);
    console.log(`已生成 channels_part_${partNum}.js (${partData.length}条)`);
  }

  // 7. 更新分片配置
  const configPath = path.join(DATA_DIR, 'channels_config.js');
  const configContent = `// channels_config.js - 分片配置
module.exports = {
  total: ${channels.length},
  num_parts: ${numParts},
  channels_per_part: ${CHANNELS_PER_PART},
  part_files: ${JSON.stringify(partFiles)}
};
`;
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log(`已更新 ${configPath}`);

  // 8. 生成分类树配置文件（含一级+二级分类）
  const categoriesPath = path.join(DATA_DIR, 'categories.js');
  const categoriesContent = `// categories.js - 用户视角分类树（一级+二级分类）
module.exports = ${JSON.stringify(CATEGORY_TREE, null, 2)};
`;
  fs.writeFileSync(categoriesPath, categoriesContent, 'utf8');
  console.log(`已更新 ${categoriesPath} (${CATEGORY_TREE.length}个一级分类)`);

  console.log('\n=== 分类数据修正完成 ===');
  console.log('总计:', channels.length, '条渠道');
  console.log('一级分类:', CATEGORY_TREE.length, '个');
  console.log('二级分类:', CATEGORY_TREE.reduce((sum, c) => sum + (c.children?.length || 0), 0), '个');
  console.log('分片:', numParts, '个');
}

main();
