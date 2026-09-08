// utils/source-utils.js - 信息来源工具函数
// 将网址转换为网站名

// 网址域名到网站名的映射表
const DOMAIN_NAME_MAP = {
  'www.csrc.gov.cn': '中国证券监督管理委员会',
  'www.gov.cn': '中国政府网',
  'www.12306.cn': '中国铁路12306',
  'www.12326.cn': '中国民用航空局消费者投诉平台',
  'www.caac.gov.cn': '中国民用航空局',
  'www.12377.cn': '中央网信办举报中心',
  'www.cac.gov.cn': '国家互联网信息办公室',
  'www.12388.gov.cn': '中央纪委国家监委举报网站',
  'www.court.gov.cn': '最高人民法院',
  'www.mca.gov.cn': '民政部',
  'www.mee.gov.cn': '生态环境部',
  'www.mem.gov.cn': '应急管理部',
  'www.moe.gov.cn': '教育部',
  'www.mohrss.gov.cn': '人力资源和社会保障部',
  'www.mohurd.gov.cn': '住房和城乡建设部',
  'www.mps.gov.cn': '公安部',
  'www.nhc.gov.cn': '国家卫生健康委员会',
  'www.nmpa.gov.cn': '国家药品监督管理局',
  'www.nra.gov.cn': '国家广播电视总局',
  'www.nrta.gov.cn': '国家广播电视总局',
  'www.samr.gov.cn': '国家市场监督管理总局',
  'www.sc.gov.cn': '四川省人民政府',
  'xxgk.mot.gov.cn': '交通运输部',
  'www.chinatax.gov.cn': '国家税务总局',
  '12366.chinatax.gov.cn': '国家税务总局12366纳税服务平台',
  '12389.mps.gov.cn': '公安部12389举报平台',
  'sswz.spb.gov.cn': '国家邮政局申诉网站',
  'wsjkw.sc.gov.cn': '四川省卫生健康委员会',
  'www.cdgas.com': '成都燃气',
  'www.cdgjbus.com': '成都公交',
  'www.cdwater.com.cn': '成都自来水',
  'www.chengdurail.com': '成都地铁',
  'www.cnipa.gov.cn': '国家知识产权局',
  'www.gjxfj.gov.cn': '国家信访局',
  'm.cyol.com': '中国青年报',
  'm.thepaper.cn': '澎湃新闻',
  'www.12315.cn': '全国12315平台',
  'www.12315.com': '全国12315平台',
  'www.12345.gov.cn': '全国12345政务服务便民热线',
  'www.pbc.gov.cn': '中国人民银行',
  'www.cbirc.gov.cn': '国家金融监督管理总局',
  'www.nfra.gov.cn': '国家金融监督管理总局',
  'www.mof.gov.cn': '财政部',
  'www.miit.gov.cn': '工业和信息化部',
  'www.mofcom.gov.cn': '商务部',
  'www.mnr.gov.cn': '自然资源部',
  'www.mwr.gov.cn': '水利部',
  'www.moa.gov.cn': '农业农村部',
  'www.mct.gov.cn': '文化和旅游部',
  'www.nsa.gov.cn': '国家安全部',
  'www.nea.gov.cn': '国家能源局',
  'www.customs.gov.cn': '海关总署',
  'www.stats.gov.cn': '国家统计局',
  'www.mva.gov.cn': '国家退役军人事务部',
  'www.cma.gov.cn': '中国气象局',
  'www.amac.org.cn': '中国证券投资基金业协会',
  'www.iac.org.cn': '中国互联网协会',
  'www.12321.cn': '12321网络不良与垃圾信息举报受理中心',
  'www.12300.gov.cn': '工业和信息化部电信用户申诉受理中心',
  'www.chinatt315.org.cn': '中国消费者协会',
  'www.cca.org.cn': '中国消费者协会',
  'www.npc.gov.cn': '全国人民代表大会',
  'www.cppcc.gov.cn': '中国人民政治协商会议',
  'www.ccdi.gov.cn': '中央纪律检查委员会',
  'www.12309.gov.cn': '最高人民检察院12309检察服务中心',
  'www.spp.gov.cn': '最高人民检察院',
  'www.12368.gov.cn': '全国法院12368诉讼服务热线',
  'www.12348.gov.cn': '司法部12348中国法网',
  'www.moj.gov.cn': '司法部',
  'www.beijing.gov.cn': '北京市人民政府',
  'www.shanghai.gov.cn': '上海市人民政府',
  'www.gz.gov.cn': '广州市人民政府',
  'www.sz.gov.cn': '深圳市人民政府',
  'www.hangzhou.gov.cn': '杭州市人民政府',
  'www.nanjing.gov.cn': '南京市人民政府',
  'www.wuhan.gov.cn': '武汉市人民政府',
  'www.chengdu.gov.cn': '成都市人民政府',
  'www.chongqing.gov.cn': '重庆市人民政府',
  'www.xian.gov.cn': '西安市人民政府',
  'www.tianjin.gov.cn': '天津市人民政府',
  'www.suzhou.gov.cn': '苏州市人民政府',
  'www.qingdao.gov.cn': '青岛市人民政府',
  'www.dalian.gov.cn': '大连市人民政府',
  'www.xiamen.gov.cn': '厦门市人民政府',
  'www.ningbo.gov.cn': '宁波市人民政府',
  'www.sanya.gov.cn': '三亚市人民政府',
  'www.haikou.gov.cn': '海口市人民政府',
  'www.zhuhai.gov.cn': '珠海市人民政府',
  'www.foshan.gov.cn': '佛山市人民政府',
  'www.dongguan.gov.cn': '东莞市人民政府',
  'www.kunming.gov.cn': '昆明市人民政府',
  'www.guiyang.gov.cn': '贵阳市人民政府',
  'www.nanning.gov.cn': '南宁市人民政府',
  'www.lanzhou.gov.cn': '兰州市人民政府',
  'www.urumqi.gov.cn': '乌鲁木齐市人民政府',
  'www.lhasa.gov.cn': '拉萨市人民政府',
  'www.yinchuan.gov.cn': '银川市人民政府',
  'www.xining.gov.cn': '西宁市人民政府',
  'www.hohhot.gov.cn': '呼和浩特市人民政府',
  'www.shenyang.gov.cn': '沈阳市人民政府',
  'www.changchun.gov.cn': '长春市人民政府',
  'www.harbin.gov.cn': '哈尔滨市人民政府',
  'www.shijiazhuang.gov.cn': '石家庄市人民政府',
  'www.taiyuan.gov.cn': '太原市人民政府',
  'www.jinan.gov.cn': '济南市人民政府',
  'www.zhengzhou.gov.cn': '郑州市人民政府',
  'www.hefei.gov.cn': '合肥市人民政府',
  'www.nanchang.gov.cn': '南昌市人民政府',
  'www.changsha.gov.cn': '长沙市人民政府',
  'www.fuzhou.gov.cn': '福州市人民政府',
  'www.guangzhou.gov.cn': '广州市人民政府',
  'www.shenzhen.gov.cn': '深圳市人民政府'
};

/**
 * 将网址转换为网站名
 * @param {string} source - 原始信息来源（可能是网址、网站名或混合）
 * @returns {string} 转换后的网站名
 */
function convertSourceToName(source) {
  if (!source || source.length === 0) return '';
  // 如果已经是中文网站名（不包含http），直接返回
  if (!source.includes('http')) return source;
  // 提取所有网址
  const urls = source.match(/https?:\/\/[^\s；;，,]+/g) || [];
  if (urls.length === 0) return source;
  // 将每个网址转换为网站名
  const names = urls.map(url => {
    try {
      let domain = url.replace(/https?:\/\//, '').split('/')[0];
      // 去除查询参数
      domain = domain.split('?')[0].split('？')[0];
      // 查找映射表
      if (DOMAIN_NAME_MAP[domain]) return DOMAIN_NAME_MAP[domain];
      // 尝试去掉www.前缀
      const domainWithoutWww = domain.replace(/^www\./, '');
      if (DOMAIN_NAME_MAP[domainWithoutWww]) return DOMAIN_NAME_MAP[domainWithoutWww];
      // 尝试匹配子域名（包含关系）
      for (const key in DOMAIN_NAME_MAP) {
        if (domain.includes(key) || key.includes(domain)) {
          return DOMAIN_NAME_MAP[key];
        }
      }
      // 没有找到映射，返回域名
      return domain;
    } catch (e) {
      return url;
    }
  });
  // 去重并返回
  return [...new Set(names)].join('、');
}

module.exports = {
  convertSourceToName,
  DOMAIN_NAME_MAP
};
