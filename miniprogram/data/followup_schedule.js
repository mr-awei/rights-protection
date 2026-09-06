// 投诉跟进时间表数据
// 数据来源：三份维权文档整理，2026年8月30日验证

const FOLLOWUP_SCHEDULE = [
  {
    id: 'fs_001',
    time_node: '投诉当天',
    time_display: 'Day 0',
    legal_basis: '—',
    action: '记录投诉编号/工单号；保存提交成功截图；保存所有证据原件（聊天记录、合同、发票、照片、视频等）',
    escalate_to: '—',
    status: 'current',
    color: '#3B82F6',
    icon: '📝'
  },
  {
    id: 'fs_002',
    time_node: '3个工作日内',
    time_display: 'Day 1-3',
    legal_basis: '多数部门承诺3个工作日内告知是否受理',
    action: '未收到受理通知的，拨打投诉渠道查询进度，确认投诉是否被受理',
    escalate_to: '原投诉渠道',
    status: 'pending',
    color: '#8B5CF6',
    icon: '📞'
  },
  {
    id: 'fs_003',
    time_node: '7个工作日',
    time_display: 'Day 7',
    legal_basis: '《市场监督管理投诉举报处理办法》：收到之日起7个工作日内作出是否受理决定',
    action: '超7日未受理的，要求出具不予受理书面告知；对不予受理决定不服的可申请行政复议',
    escalate_to: '上级市场监管部门 / 12345督办',
    status: 'pending',
    color: '#F59E0B',
    icon: '⚠️'
  },
  {
    id: 'fs_004',
    time_node: '15个工作日',
    time_display: 'Day 15',
    legal_basis: '多数行业投诉处理承诺期限',
    action: '未收到处理结果的，再次联系受理部门催办，要求明确办结时限',
    escalate_to: '原受理部门',
    status: 'pending',
    color: '#EC4899',
    icon: '📋'
  },
  {
    id: 'fs_005',
    time_node: '60日',
    time_display: 'Day 60',
    legal_basis: '《市场监督管理投诉举报处理办法》：受理之日起六十日内完成调解',
    action: '调解期限届满未解决的，要求出具终止调解通知书；准备下一步法律途径',
    escalate_to: '原受理部门 / 上级主管部门',
    status: 'pending',
    color: '#EF4444',
    icon: '⚖️'
  },
  {
    id: 'fs_006',
    time_node: '超期未处理',
    time_display: '> Day 60',
    legal_basis: '《信访工作条例》《行政机关公务员处分条例》',
    action: '投诉行政不作为；要求挂牌督办；向上级纪检监察部门反映',
    escalate_to: '上级主管部门 / 12345 / 12388纪检监察',
    status: 'pending',
    color: '#DC2626',
    icon: '🚨'
  },
  {
    id: 'fs_007',
    time_node: '对结果不服（行政类）',
    time_display: '收到结果后60日内',
    legal_basis: '《行政复议法》60日内复议；《行政诉讼法》6个月内起诉',
    action: '行政类纠纷：向上一级行政机关申请行政复议，或向人民法院提起行政诉讼',
    escalate_to: '复议机关 / 人民法院',
    status: 'pending',
    color: '#6366F1',
    icon: '🏛️'
  },
  {
    id: 'fs_008',
    time_node: '对结果不服（民事类）',
    time_display: '诉讼时效3年内',
    legal_basis: '《民法典》诉讼时效3年',
    action: '民事纠纷：向人民法院提起民事诉讼（小额诉讼程序适用于标的额较小的案件）',
    escalate_to: '人民法院',
    status: 'pending',
    color: '#0EA5E9',
    icon: '📜'
  }
];

module.exports = FOLLOWUP_SCHEDULE;
