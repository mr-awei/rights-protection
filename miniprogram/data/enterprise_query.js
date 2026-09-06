// 企业信息查询指引数据
// 数据来源：三份维权文档整理，2026年8月30日验证

const ENTERPRISE_QUERY = [
  {
    id: 'eq_001',
    name: '国家企业信用信息公示系统',
    website: 'gsxt.gov.cn',
    full_url: 'https://www.gsxt.gov.cn',
    icon: '🏢',
    color: '#3B82F6',
    can_query: [
      '注册资本、法定代表人、股东信息',
      '经营异常名录、严重违法失信名单',
      '行政处罚信息、抽查检查信息',
      '企业年报、变更记录'
    ],
    rights_usage: [
      '投诉前核实商家真实主体名称和统一社会信用代码',
      '胜诉后申请将被执行人列入经营异常名录',
      '查询股东信息，必要时追究股东责任'
    ],
    tips: '官方系统，信息最权威，查询免费，无需注册'
  },
  {
    id: 'eq_002',
    name: '信用中国',
    website: 'creditchina.gov.cn',
    full_url: 'https://www.creditchina.gov.cn',
    icon: '⭐',
    color: '#F59E0B',
    can_query: [
      '公共信用信息、行政许可信息',
      '行政处罚信息、守信红名单',
      '失信被执行人名单、重点关注名单',
      '企业信用报告（部分需付费）'
    ],
    rights_usage: [
      '一站查清企业所有信用污点',
      '作为投诉时的佐证材料',
      '查询对方是否有多次行政处罚记录'
    ],
    tips: '国家发改委主管，覆盖范围广，信息更新及时'
  },
  {
    id: 'eq_003',
    name: '中国执行信息公开网',
    website: 'zxgk.court.gov.cn',
    full_url: 'http://zxgk.court.gov.cn',
    icon: '⚖️',
    color: '#EF4444',
    can_query: [
      '被执行人信息（正在被法院强制执行）',
      '失信被执行人名单（"老赖"）',
      '限制高消费人员名单',
      '执行案件信息、终本案件信息'
    ],
    rights_usage: [
      '起诉前判断对方有无履行能力',
      '胜诉后申请将对方纳入失信被执行人名单',
      '申请限制高消费，迫使对方履行义务'
    ],
    tips: '最高人民法院主办，"老赖"信息最权威，可直接作为证据'
  },
  {
    id: 'eq_004',
    name: '认证认可信息公共服务平台',
    website: 'cx.cnca.cn',
    full_url: 'http://cx.cnca.cn',
    icon: '✅',
    color: '#10B981',
    can_query: [
      'CCC强制性认证证书真伪',
      '自愿性产品认证信息',
      '管理体系认证信息',
      '检验检测机构资质认定（CMA）'
    ],
    rights_usage: [
      '购买电器等产品前先核验3C证书真伪',
      '发现假认证直接拨12315举报',
      '检测报告真伪查询，防止商家伪造检测报告'
    ],
    tips: '国家认监委主办，认证信息唯一官方查询渠道'
  }
];

module.exports = ENTERPRISE_QUERY;
