// 热线整合变更速查数据
// 数据来源：三份维权文档整理，2026年8月30日验证

const HOTLINE_CHANGES = [
  {
    id: 'hc_001',
    original: '12301',
    original_name: '旅游服务热线',
    status: 'discontinued',
    status_text: '已取消',
    cancel_date: '2021年底',
    replacement: '12345',
    replacement_name: '政务服务便民热线',
    note: '文化和旅游部取消12301热线，相关诉求并入12345',
    color: '#EF4444'
  },
  {
    id: 'hc_002',
    original: '12369',
    original_name: '环保举报热线',
    status: 'discontinued',
    status_text: '已停用',
    cancel_date: '2024年6月',
    replacement: '12345',
    replacement_name: '政务服务便民热线',
    note: '生态环境部12369环保举报热线整体并入12345',
    color: '#EF4444'
  },
  {
    id: 'hc_003',
    original: '12318',
    original_name: '文化市场举报热线',
    status: 'merging',
    status_text: '逐步并入',
    cancel_date: '进行中',
    replacement: '12345',
    replacement_name: '政务服务便民热线',
    note: '部分地区已并入12345，部分地区仍保留原号码',
    color: '#F59E0B'
  },
  {
    id: 'hc_004',
    original: '12319',
    original_name: '城建服务热线',
    status: 'merging',
    status_text: '逐步并入',
    cancel_date: '进行中（如沈阳2026年9月停用）',
    replacement: '12345',
    replacement_name: '政务服务便民热线',
    note: '住建领域服务热线逐步整合，各地进度不一',
    color: '#F59E0B'
  },
  {
    id: 'hc_005',
    original: '12358',
    original_name: '价格举报热线',
    status: 'merged',
    status_text: '已整合',
    cancel_date: '已完成',
    replacement: '12315',
    replacement_name: '市场监管投诉举报热线',
    note: '价格监督检查职能并入市场监管总局，热线统一为12315',
    color: '#10B981'
  },
  {
    id: 'hc_006',
    original: '12365',
    original_name: '质量技术监督热线',
    status: 'merged',
    status_text: '已整合',
    cancel_date: '已完成',
    replacement: '12315',
    replacement_name: '市场监管投诉举报热线',
    note: '质检职能并入市场监管总局，热线统一为12315',
    color: '#10B981'
  },
  {
    id: 'hc_007',
    original: '12331',
    original_name: '食品药品投诉举报热线',
    status: 'merged',
    status_text: '已整合',
    cancel_date: '已完成',
    replacement: '12315',
    replacement_name: '市场监管投诉举报热线',
    note: '食药监职能并入市场监管总局，热线统一为12315',
    color: '#10B981'
  },
  {
    id: 'hc_008',
    original: '12330',
    original_name: '知识产权维权援助热线',
    status: 'partial',
    status_text: '部分职能整合',
    cancel_date: '进行中',
    replacement: '12315 + 12330',
    replacement_name: '市场监管热线 + 知识产权维权援助',
    note: '侵权举报职能并入12315，维权援助职能保留12330',
    color: '#F59E0B'
  },
  {
    id: 'hc_009',
    original: '12350',
    original_name: '安全生产举报热线',
    status: 'merging',
    status_text: '部分地区并入',
    cancel_date: '进行中',
    replacement: '12345',
    replacement_name: '政务服务便民热线',
    note: '部分地区已并入12345，原号码多地仍可使用',
    color: '#F59E0B'
  },
  {
    id: 'hc_010',
    original: '12366',
    original_name: '纳税服务热线',
    status: 'merging',
    status_text: '归并中',
    cancel_date: '进行中',
    replacement: '12345',
    replacement_name: '政务服务便民热线',
    note: '税务热线正在归并，目前仍独立运行',
    color: '#F59E0B'
  },
  {
    id: 'hc_011',
    original: '12305',
    original_name: '邮政业申诉热线',
    status: 'partial',
    status_text: '部分省份并入',
    cancel_date: '进行中',
    replacement: '12345',
    replacement_name: '政务服务便民热线',
    note: '部分省份已并入12345，国家邮政局申诉网站全国通用',
    color: '#F59E0B'
  },
  {
    id: 'hc_012',
    original: '12300',
    original_name: '电信用户申诉热线',
    status: 'active',
    status_text: '仍在运行',
    cancel_date: '—',
    replacement: '12300',
    replacement_name: '工信部电信用户申诉受理中心',
    note: '电信用户申诉热线正常运行，未整合',
    color: '#3B82F6'
  }
];

module.exports = HOTLINE_CHANGES;
