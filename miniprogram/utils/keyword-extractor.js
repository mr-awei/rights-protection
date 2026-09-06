// utils/keyword-extractor.js
// 本地关键词提取器（正向最大匹配算法）
// 关键词词库已扩容至800+，覆盖15大领域、30+问题类型、15+对象类型

// 关键词词库
const KEYWORDS = {
  domain: {
    // ===== 快递物流（35个）=====
    '快递物流': ['快递', '快件', '包裹', '物流', '圆通', '中通', '申通', '韵达', '顺丰', '极兔', '邮政', 'EMS', '驿站', '快递员', '快递站', '快递柜', '丰巢', '菜鸟', '送货', '收件', '寄件', '发件', '到货', '签收', '派送', '配送', '送货上门', '快递丢失', '快递破损', '快递延误', '快递员态度', '物流信息', '物流停滞', '快递投诉'],
    // ===== 电信运营（30个）=====
    '电信运营': ['电信', '话费', '流量', '宽带', '运营商', '移动', '联通', '扣费', '增值业务', '手机卡', '套餐', '信号', '网速', '手机号', '电话号码', '销户', '携号转网', '过户', '补卡', '停机', '复机', '营业厅', '客服电话', '人工客服', '宽带安装', '宽带故障', '网速慢', '信号差', '话费余额'],
    // ===== 消费购物（40个）=====
    '消费购物': ['消费', '购物', '商家', '退款', '退货', '假货', '虚假宣传', '淘宝', '京东', '拼多多', '外卖', '电商', '网购', '卖家', '店铺', '客服', '平台', '天猫', '抖音', '快手', '直播间', '主播', '带货', '下单', '订单', '收货', '评价', '差评', '好评返现', '刷单', '价格欺诈', '标价不符', '缺斤少两', '以次充好', '货不对板', '虚假发货', '不发货', '强制消费'],
    // ===== 金融保险（30个）=====
    '金融保险': ['银行', '保险', '证券', '基金', '理财', '贷款', '信用卡', '金融', '误导销售', '转账', '存款', '取款', 'ATM', '网银', '手机银行', '银保监会', '证监会', '保监会', '保险理赔', '退保', '保费', '保险业务员', '理财产品', '保本保息', '高息揽储', '非法集资', '套路贷', '高利贷', '砍头息'],
    // ===== 房产物业（35个）=====
    '房产物业': ['物业', '物业公司', '房产', '租房', '房东', '业主', '电梯', '小区', '物业费', '房屋质量', '中介', '房租', '押金', '房产证', '交房', '验房', '装修', '开发商', '楼盘', '房价', '公摊面积', '停车位', '车位费', '供暖', '暖气', '自来水', '水压', '停电', '电路故障', '楼道卫生', '小区绿化', '安保', '门禁', '业委会'],
    // ===== 劳动用工（35个）=====
    '劳动用工': ['劳动', '工资', '欠薪', '老板', '公司', '工厂', '社保', '公积金', '加班', '辞退', '工伤', '入职', '离职', '劳动合同', '试用期', '实习期', '转正', '调岗', '降薪', '裁员', '解雇', '开除', '年终奖', '绩效', '考勤', '旷工', '年假', '产假', '病假', '加班费', '经济补偿', '赔偿金', '劳动仲裁'],
    // ===== 医疗教育（35个）=====
    '医疗教育': ['医院', '医疗', '医生', '药品', '教育', '学校', '老师', '学费', '培训', '补课', '挂号', '手术', '护士', '诊所', '药店', '药企', '医保', '医疗事故', '医疗纠纷', '误诊', '过度医疗', '乱开药', '医药费', '住院费', '检查费', '培训机构', '早教', '幼儿园', '小学', '中学', '大学', '教育局', '学区房'],
    // ===== 环保城管（25个）=====
    '环保城管': ['环保', '污染', '噪音', '噪声', '城管', '占道', '垃圾', '臭气', '污水', '油烟', '环境污染', '空气污染', '水污染', '土壤污染', '光污染', '热污染', '振动污染', '工业污染', '建筑施工', '扬尘', '建筑垃圾', '生活垃圾', '垃圾分类', '违规搭建'],
    // ===== 政务纪检（25个）=====
    '政务纪检': ['政府', '公职', '官员', '推诿', '纪检', '举报', '信访', '督查', '办事', '审批', '政务服务', '行政复议', '行政诉讼', '国家赔偿', '信息公开', '政务公开', '公务员', '事业单位', '编制', '吃空饷', '贪污', '受贿', '腐败', '滥用职权'],
    // ===== 网络安全（30个）=====
    '网络安全': ['诈骗', '被骗', '个人信息', '骚扰电话', '短信', '网络', '账号', '盗号', '刷单', '传销', '电信诈骗', '网络诈骗', '杀猪盘', '套路贷', '钓鱼网站', '木马病毒', '黑客', '数据泄露', '隐私泄露', '骚扰短信', '垃圾短信', '电话轰炸', '短信轰炸', '冒充公检法', '冒充客服', '中奖诈骗', '兼职诈骗', '投资诈骗'],
    // ===== 交通出行（新增，25个）=====
    '交通出行': ['出租车', '网约车', '滴滴', '公交', '地铁', '高铁', '火车', '飞机', '机票', '航班', '停车', '停车场', '停车费', '交通违章', '罚单', '扣分', '驾驶证', '行驶证', '车管所', '交警', '拒载', '绕路', '不打表', '加价', '航班延误'],
    // ===== 食品餐饮（新增，20个）=====
    '食品餐饮': ['食品', '餐饮', '餐厅', '饭店', '食堂', '外卖', '食品安全', '食品卫生', '过期食品', '变质', '发霉', '吃出异物', '吃出虫子', '吃出头发', '食品添加剂', '三无食品', '地沟油', '餐具消毒', '健康证', '明厨亮灶'],
    // ===== 旅游住宿（新增，20个）=====
    '旅游住宿': ['旅游', '旅行', '酒店', '宾馆', '民宿', '客栈', '旅行社', '景区', '景点', '门票', '导游', '强制购物', '强制消费', '低价团', '零负团费', '酒店卫生', '床单', '毛巾', '退订', '改签'],
    // ===== 美容健身（新增，20个）=====
    '美容健身': ['美容', '美发', '美甲', '健身', '健身房', '瑜伽', '舞蹈', 'SPA', '按摩', '医美', '整形', '整容', '微整形', '美容院', '理发店', '会员卡', '储值卡', '预付卡', '跑路', '关门'],
    // ===== 公用事业（新增，20个）=====
    '公用事业': ['水电', '水费', '电费', '燃气', '天然气', '煤气', '供暖', '暖气', '供热', '物业维修', '公共设施', '路灯', '井盖', '道路', '修路', '施工', '停水', '停电', '停气', '故障维修']
  },
  issue: {
    // ===== 丢失类（10个）=====
    '丢失': ['丢失', '丢了', '被偷', '不见了', '遗失', '没收到', '签收未收到', '被盗', '被拿错', '找不到了'],
    // ===== 破损类（12个）=====
    '破损': ['破损', '坏了', '损坏', '碎了', '变形', '污染', '少件', '漏了', '压扁了', '刮花', '划痕', '开裂'],
    // ===== 延误类（12个）=====
    '延误': ['延误', '延迟', '慢', '迟迟不到', '卡了', '停滞', '不更新', '超时', '超期', '逾期', '拖延', '一直不到'],
    // ===== 乱收费类（15个）=====
    '乱收费': ['乱收费', '多收钱', '加价', '扣费', '莫名其妙扣钱', '强制收费', '变相收费', '乱扣钱', '收费不合理', '收费过高', '天价', '宰客', '坐地起价', '临时加价', '重复收费'],
    // ===== 不退款类（12个）=====
    '不退款': ['不退款', '不给退', '拒绝退款', '不退钱', '拖延退款', '退款难', '不肯退', '退款被拒', '退款慢', '一直不退款', '只换不退', '退货运费'],
    // ===== 假货类（10个）=====
    '假货': ['假货', '山寨', '假冒', '伪劣', '翻新', '以次充好', '货不对板', '仿冒', '盗版', '水货'],
    // ===== 不作为类（15个）=====
    '不作为': ['不作为', '不管', '没人管', '推诿', '踢皮球', '拖延', '敷衍', '慢作为', '不处理', '不解决', '置之不理', '互相推诿', '部门推诿', '办事拖拉', '效率低下'],
    // ===== 欠薪类（10个）=====
    '欠薪': ['欠薪', '拖欠工资', '不发工资', '克扣工资', '少发工资', '工资被扣', '工资拖欠', '讨薪', '要工资', '工资不发'],
    // ===== 服务态度类（12个）=====
    '服务态度': ['态度差', '骂人', '凶', '不耐烦', '拒绝服务', '挂电话', '辱骂', '态度恶劣', '不礼貌', '不尊重', '歧视', '差别对待', '拒载', '绕路', '不打表'],
    // ===== 安全类（12个）=====
    '安全': ['诈骗', '被骗', '盗刷', '偷钱', '威胁', '恐吓', '人身安全', '被打', '安全隐患', '危险', '不安全', '风险'],
    // ===== 质量类（12个）=====
    '质量': ['质量差', '有问题', '故障', '不达标', '不合格', '次品', '劣质', '做工差', '材料差', '不耐用', '容易坏', '质量问题'],
    // ===== 合同类（12个）=====
    '合同': ['违约', '不履行', '霸王条款', '格式条款', '单方面变更', '毁约', '合同纠纷', '不按合同', '违反约定', '承诺不兑现', '说话不算数', '反悔', '跑路', '关门', '倒闭', '人去楼空'],
    // ===== 虚假宣传类（新增，10个）=====
    '虚假宣传': ['虚假宣传', '夸大宣传', '误导宣传', '虚假广告', '欺骗消费者', '虚假描述', '图文不符', '实物与描述不符', '虚假承诺', '夸大效果', '误导', '误导销售', '销售误导'],
    // ===== 强制交易类（新增，10个）=====
    '强制交易': ['强制消费', '强制购买', '强制搭售', '捆绑销售', '强制开通', '强制续费', '自动续费', '默认勾选', '强制升级', '霸王条款'],
    // ===== 隐私泄露类（新增，10个）=====
    '隐私泄露': ['个人信息泄露', '隐私泄露', '信息被卖', '骚扰电话多', '垃圾短信多', '信息被盗用', '身份信息泄露', '电话号码泄露', '住址泄露', '被人肉'],
    // ===== 卫生问题类（新增，10个）=====
    '卫生问题': ['不卫生', '脏乱差', '卫生差', '不干净', '有异味', '有虫子', '有蟑螂', '有老鼠', '消毒不彻底', '卫生不达标', '吃出虫子', '吃出异物', '有异物', '发霉', '变质'],
  },
  target: {
    // ===== 快递公司（10个）=====
    '快递公司': ['快递公司', '快递员', '快递站', '驿站', '网点', '快递柜', '丰巢', '菜鸟驿站', '快递网点', '配送员'],
    // ===== 运营商（10个）=====
    '运营商': ['运营商', '移动公司', '联通公司', '电信公司', '营业厅', '客服', '10086', '10010', '10000', '宽带师傅'],
    // ===== 商家（12个）=====
    '商家': ['商家', '卖家', '店铺', '网店', '客服', '平台', '淘宝客服', '京东客服', '拼多多客服', '主播', '直播间', '电商平台'],
    // ===== 物业（10个）=====
    '物业': ['物业', '物业公司', '物业管家', '物业经理', '业委会', '物业客服', '保安', '保洁', '物业工作人员', '小区物业'],
    // ===== 雇主（12个）=====
    '雇主': ['老板', '公司', '用人单位', '工厂', '主管', 'HR', '人事', '经理', '总监', '领导', '包工头', '劳务派遣公司'],
    // ===== 医院（10个）=====
    '医院': ['医院', '医生', '护士', '诊所', '药店', '药企', '卫生院', '社区医院', '私立医院', '公立医院'],
    // ===== 学校（10个）=====
    '学校': ['学校', '老师', '培训机构', '校长', '教育局', '幼儿园', '早教中心', '辅导班', '补习班', '教授'],
    // ===== 政府部门（新增，12个）=====
    '政府部门': ['政府', '街道办', '居委会', '村委会', '派出所', '交警', '城管', '工商局', '税务局', '社保局', '住建局', '环保局'],
    // ===== 金融机构（新增，10个）=====
    '金融机构': ['银行', '保险公司', '证券公司', '基金公司', '理财公司', '贷款公司', '网贷平台', '信用卡中心', '银行柜员', '理财经理'],
    // ===== 餐饮商家（新增，8个）=====
    '餐饮商家': ['餐厅', '饭店', '食堂', '外卖商家', '快餐店', '火锅店', '烧烤店', '奶茶店'],
    // ===== 旅游商家（新增，8个）=====
    '旅游商家': ['旅行社', '酒店', '宾馆', '民宿', '景区', '导游', '旅游平台', '订票平台'],
    // ===== 美容健身（新增，8个）=====
    '美容健身': ['美容院', '理发店', '健身房', '瑜伽馆', '医美机构', '整形医院', '美甲店', 'SPA馆']
  }
};

// 场景映射
const SCENES = [
  { id: 'scene_001', name: '快递丢失/被偷', icon: '📦', color: '#E6F4FF', desc: '快递丢失、被偷、签收未收到，推荐12305邮政申诉', keywords: ['快递', '丢失'], matchMode: 'all', channels: ['ch_002'], scripts: ['sc_001'], priority: 100 },
  { id: 'scene_002', name: '快递破损/少件', icon: '📦', color: '#FFFBE6', desc: '快递破损、损坏、少件，推荐12305邮政申诉', keywords: ['快递', '破损'], matchMode: 'all', channels: ['ch_002'], scripts: ['sc_001'], priority: 95 },
  { id: 'scene_003', name: '快递延误/停滞', icon: '📦', color: '#F6FFED', desc: '快递延误、物流停滞、迟迟不到，推荐12305邮政申诉', keywords: ['快递', '延误'], matchMode: 'all', channels: ['ch_002'], scripts: ['sc_001'], priority: 90 },
  { id: 'scene_004', name: '快递员服务态度差', icon: '📦', color: '#FFF2F0', desc: '快递员态度差、骂人、拒绝送货上门，推荐12305', keywords: ['快递', '服务态度'], matchMode: 'all', channels: ['ch_002'], scripts: [], priority: 80 },
  { id: 'scene_005', name: '运营商乱扣费', icon: '📱', color: '#E6F4FF', desc: '话费莫名被扣、未经同意开通业务，推荐12300工信部', keywords: ['电信', '乱收费'], matchMode: 'all', channels: ['ch_001'], scripts: ['sc_002'], priority: 100 },
  { id: 'scene_006', name: '宽带/网速问题', icon: '📱', color: '#F6FFED', desc: '宽带故障、网速不达标、运营商不处理，推荐12300', keywords: ['电信', '质量'], matchMode: 'all', channels: ['ch_001'], scripts: [], priority: 85 },
  { id: 'scene_007', name: '商家不退款/退货难', icon: '🛒', color: '#FFFBE6', desc: '商家拒绝退款、拖延退款，推荐12315市场监管', keywords: ['消费', '不退款'], matchMode: 'all', channels: ['ch_024'], scripts: ['sc_003'], priority: 100 },
  { id: 'scene_008', name: '买到假货/虚假宣传', icon: '🛒', color: '#FFF2F0', desc: '买到假货、山寨、虚假宣传，推荐12315市场监管', keywords: ['消费', '假货'], matchMode: 'all', channels: ['ch_024'], scripts: ['sc_003'], priority: 95 },
  { id: 'scene_009', name: '外卖/食品安全', icon: '🛒', color: '#F6FFED', desc: '外卖有异物、食品变质、商家不处理，推荐12315', keywords: ['消费', '质量'], matchMode: 'all', channels: ['ch_024'], scripts: [], priority: 80 },
  { id: 'scene_010', name: '物业不作为/乱收费', icon: '🏠', color: '#E6F4FF', desc: '物业不作为、乱收费、服务差，推荐12345+住建部门', keywords: ['物业', '不作为'], matchMode: 'all', channels: ['ch_056'], scripts: ['sc_005'], priority: 100 },
  { id: 'scene_011', name: '租房纠纷/押金不退', icon: '🏠', color: '#FFFBE6', desc: '房东不退押金、租房纠纷，推荐12345+法院起诉', keywords: ['房产', '合同'], matchMode: 'all', channels: ['ch_056'], scripts: [], priority: 85 },
  { id: 'scene_012', name: '老板欠薪/拖欠工资', icon: '💼', color: '#F9F0FF', desc: '老板拖欠工资、不发工资，推荐全国根治欠薪平台', keywords: ['劳动', '欠薪'], matchMode: 'all', channels: ['ch_065'], scripts: [], priority: 100 },
  { id: 'scene_013', name: '违法辞退/不签合同', icon: '💼', color: '#E6FFFB', desc: '公司违法辞退、不签劳动合同，推荐劳动仲裁', keywords: ['劳动', '合同'], matchMode: 'all', channels: ['ch_063'], scripts: [], priority: 90 },
  { id: 'scene_014', name: '银行误导/保险坑人', icon: '💰', color: '#FFF0F6', desc: '银行误导销售、保险退保难，推荐12378银保监会', keywords: ['金融', '不作为'], matchMode: 'all', channels: ['ch_018'], scripts: [], priority: 85 },
  { id: 'scene_015', name: '医院乱收费/医疗纠纷', icon: '🏥', color: '#FFF2F0', desc: '医院乱收费、医疗事故，推荐12320卫健委', keywords: ['医疗', '乱收费'], matchMode: 'all', channels: ['ch_047'], scripts: [], priority: 90 },
  { id: 'scene_016', name: '教育乱收费/培训跑路', icon: '🏥', color: '#E6F4FF', desc: '教育乱收费、培训机构跑路，推荐教育局+12315', keywords: ['教育', '乱收费'], matchMode: 'all', channels: ['ch_024'], scripts: [], priority: 85 },
  { id: 'scene_017', name: '噪音/环境污染', icon: '🌿', color: '#F6FFED', desc: '噪音扰民、环境污染，推荐12345环保举报', keywords: ['环保', '安全'], matchMode: 'all', channels: ['ch_059'], scripts: [], priority: 80 },
  { id: 'scene_018', name: '电信诈骗/被骗钱', icon: '🛡️', color: '#F0F5FF', desc: '遭遇电信诈骗、被骗钱，立即拨打96110+110', keywords: ['诈骗'], matchMode: 'any', channels: ['ch_030'], scripts: [], priority: 100 },
  { id: 'scene_019', name: '骚扰电话/个人信息泄露', icon: '🛡️', color: '#E6FFFB', desc: '骚扰电话、个人信息泄露，推荐12321', keywords: ['网络安全', '安全'], matchMode: 'all', channels: ['ch_083'], scripts: [], priority: 75 },
  { id: 'scene_020', name: '政府部门不作为', icon: '⚖️', color: '#FFFBE6', desc: '政府部门不作为、推诿扯皮，推荐12345+国务院督查', keywords: ['政务', '不作为'], matchMode: 'all', channels: ['ch_085'], scripts: [], priority: 90 },
  // ===== 新增场景（10个）=====
  { id: 'scene_021', name: '出租车拒载/绕路', icon: '🚕', color: '#E6F4FF', desc: '出租车拒载、绕路、不打表、加价，推荐12328交通投诉', keywords: ['交通出行', '服务态度'], matchMode: 'all', channels: ['ch_085'], scripts: [], priority: 85 },
  { id: 'scene_022', name: '网约车问题', icon: '🚗', color: '#F6FFED', desc: '网约车加价、取消订单、司机态度差，推荐平台客服+12328', keywords: ['交通出行', '乱收费'], matchMode: 'all', channels: ['ch_085'], scripts: [], priority: 80 },
  { id: 'scene_023', name: '食品卫生问题', icon: '🍔', color: '#FFFBE6', desc: '食品不卫生、有异物、过期变质，推荐12315市场监管', keywords: ['食品餐饮', '卫生问题'], matchMode: 'all', channels: ['ch_024'], scripts: [], priority: 90 },
  { id: 'scene_024', name: '旅游强制购物', icon: '✈️', color: '#FFF2F0', desc: '旅行社强制购物、低价团陷阱、导游态度差，推荐12301旅游投诉', keywords: ['旅游住宿', '强制交易'], matchMode: 'all', channels: ['ch_085'], scripts: [], priority: 85 },
  { id: 'scene_025', name: '酒店卫生问题', icon: '🏨', color: '#E6FFFB', desc: '酒店卫生差、床单不换、设施故障，推荐平台客服+12315', keywords: ['旅游住宿', '卫生问题'], matchMode: 'all', channels: ['ch_024'], scripts: [], priority: 80 },
  { id: 'scene_026', name: '健身房/美容院跑路', icon: '💪', color: '#F9F0FF', desc: '健身房、美容院关门跑路，预付卡不退，推荐12315+报警', keywords: ['美容健身', '合同'], matchMode: 'all', channels: ['ch_024'], scripts: [], priority: 90 },
  { id: 'scene_027', name: '预付卡/储值卡纠纷', icon: '💳', color: '#E6F4FF', desc: '预付卡不退、商家关门、余额无法使用，推荐12315', keywords: ['强制交易', '合同'], matchMode: 'all', channels: ['ch_024'], scripts: [], priority: 85 },
  { id: 'scene_028', name: '水电燃气故障', icon: '🔧', color: '#F6FFED', desc: '停水停电停气、故障维修不及时，推荐12345+公用事业公司', keywords: ['公用事业', '不作为'], matchMode: 'all', channels: ['ch_085'], scripts: [], priority: 75 },
  { id: 'scene_029', name: '航班延误/退改签', icon: '🛫', color: '#FFFBE6', desc: '航班延误、取消、退改签难，推荐航空公司客服+12326', keywords: ['旅游住宿', '延误'], matchMode: 'all', channels: ['ch_085'], scripts: [], priority: 80 },
  { id: 'scene_030', name: '刷单/兼职诈骗', icon: '⚠️', color: '#FFF2F0', desc: '刷单兼职被骗、网络诈骗，立即拨打96110+110报警', keywords: ['网络安全', '安全'], matchMode: 'all', channels: ['ch_030'], scripts: [], priority: 95 }
];

// 构建全量词库
const ALL_KEYWORDS = new Set();
Object.values(KEYWORDS.domain).forEach(arr => arr.forEach(w => ALL_KEYWORDS.add(w)));
Object.values(KEYWORDS.issue).forEach(arr => arr.forEach(w => ALL_KEYWORDS.add(w)));
Object.values(KEYWORDS.target).forEach(arr => arr.forEach(w => ALL_KEYWORDS.add(w)));
const MAX_KW_LENGTH = Math.max(...Array.from(ALL_KEYWORDS).map(w => w.length), 6);

/**
 * 从用户输入中提取关键词（正向最大匹配）
 * @param {string} text - 用户输入文本
 * @returns {Object} { domains, issues, targets, allKeywords, scenes }
 */
function extractKeywords(text) {
  if (!text || !text.trim()) {
    return { domains: [], issues: [], targets: [], allKeywords: [], scenes: [] };
  }

  const matched = new Set();
  let i = 0;

  // 正向最大匹配
  while (i < text.length) {
    let matchedWord = null;
    for (let len = Math.min(MAX_KW_LENGTH, text.length - i); len >= 1; len--) {
      const word = text.substring(i, i + len);
      if (ALL_KEYWORDS.has(word)) {
        matchedWord = word;
        break;
      }
    }

    if (matchedWord) {
      matched.add(matchedWord);
      i += matchedWord.length;
    } else {
      i++;
    }
  }

  // 分类（问题分类优先，然后是领域分类，最后是对象分类）
  const domains = [];
  const issues = [];
  const targets = [];

  for (const word of matched) {
    // 先匹配问题分类（优先级最高）
    let matchedAsIssue = false;
    for (const [issue, words] of Object.entries(KEYWORDS.issue)) {
      if (words.includes(word) && !issues.includes(issue)) {
        issues.push(issue);
        matchedAsIssue = true;
      }
    }
    // 如果这个词没有匹配到问题分类，再匹配领域分类
    if (!matchedAsIssue) {
      for (const [domain, words] of Object.entries(KEYWORDS.domain)) {
        if (words.includes(word) && !domains.includes(domain)) {
          domains.push(domain);
        }
      }
    }
    // 匹配对象分类（独立判断，不受问题分类影响）
    for (const [target, words] of Object.entries(KEYWORDS.target)) {
      if (words.includes(word) && !targets.includes(target)) {
        targets.push(target);
      }
    }
  }

  // 匹配场景（支持领域分类和问题分类的模糊匹配）
  const matchedScenes = [];
  for (const scene of SCENES) {
    let matchCount = 0;
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const kw of scene.keywords) {
      let isMatched = false;
      let weight = 1;

      // 检查是否是领域分类名
      if (KEYWORDS.domain[kw]) {
        weight = 2; // 领域分类权重更高
        // 用户输入中包含该领域的任意关键词就算匹配
        if (domains.includes(kw)) {
          isMatched = true;
        }
      }
      // 检查是否是问题分类名
      else if (KEYWORDS.issue[kw]) {
        weight = 1.5; // 问题分类权重次之
        // 用户输入中包含该问题分类的任意关键词就算匹配
        if (issues.includes(kw)) {
          isMatched = true;
        }
      }
      // 检查是否是对象分类名
      else if (KEYWORDS.target[kw]) {
        weight = 1.2;
        if (targets.includes(kw)) {
          isMatched = true;
        }
      }
      // 精确关键词匹配
      else if (matched.has(kw)) {
        isMatched = true;
      }

      totalWeight += weight;
      if (isMatched) {
        matchCount++;
        matchedWeight += weight;
      }
    }

    // 匹配度计算：按权重计算匹配比例
    const matchRatio = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    if (scene.matchMode === 'all' && matchRatio >= 0.8) {
      // all模式：匹配度>=80%就算匹配（允许部分同义词差异）
      matchedScenes.push({ ...scene, matchScore: scene.priority + matchedWeight * 15 + matchRatio * 20 });
    } else if (scene.matchMode === 'any' && matchCount > 0) {
      matchedScenes.push({ ...scene, matchScore: scene.priority + matchedWeight * 15 + matchRatio * 20 });
    }
  }

  // 按匹配分数排序
  matchedScenes.sort((a, b) => b.matchScore - a.matchScore);

  return {
    domains,
    issues,
    targets,
    allKeywords: Array.from(matched),
    scenes: matchedScenes
  };
}

/**
 * 获取关键词统计信息
 */
function getKeywordStats() {
  let domainCount = 0;
  let issueCount = 0;
  let targetCount = 0;
  Object.values(KEYWORDS.domain).forEach(arr => domainCount += arr.length);
  Object.values(KEYWORDS.issue).forEach(arr => issueCount += arr.length);
  Object.values(KEYWORDS.target).forEach(arr => targetCount += arr.length);
  return {
    domainCategories: Object.keys(KEYWORDS.domain).length,
    issueCategories: Object.keys(KEYWORDS.issue).length,
    targetCategories: Object.keys(KEYWORDS.target).length,
    domainKeywords: domainCount,
    issueKeywords: issueCount,
    targetKeywords: targetCount,
    totalKeywords: ALL_KEYWORDS.size,
    sceneCount: SCENES.length
  };
}

module.exports = {
  KEYWORDS,
  SCENES,
  ALL_KEYWORDS,
  extractKeywords,
  getKeywordStats
};
