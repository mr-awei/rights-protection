/**
 * reserved_tables.js - 预留数据表结构定义
 * 
 * 【说明】
 * 以下11张表在MVP阶段完成结构定义，但不启用业务逻辑。
 * 确保V2.0/V2.5上线时无需改表结构。
 * 所有表均预留 ext 字段（JSON类型），用于未来新增属性无需改表结构。
 * 
 * 【版本规划】
 * V2.0启用: user, ai_conversation, complaint_ticket, evidence
 * V2.5启用: channel_feedback, post, comment, like
 * 已本地实现: favorite, search_log, view_history
 */

module.exports = {
  // ========== V2.0 启用表 ==========

  /**
   * user - 用户表
   * 存储用户基本信息，支持微信登录和匿名用户
   */
  user: {
    table_name: 'user',
    version: 'V2.0',
    enabled: false,
    description: '用户表，存储用户基本信息',
    fields: {
      id: { type: 'string', primary: true, description: '用户ID（微信openid或本地生成）' },
      nickname: { type: 'string', nullable: true, description: '用户昵称' },
      avatar_url: { type: 'string', nullable: true, description: '头像URL' },
      phone: { type: 'string', nullable: true, description: '手机号（加密存储）' },
      device_id: { type: 'string', description: '设备ID，匿名用户标识' },
      is_anonymous: { type: 'boolean', default: true, description: '是否匿名用户' },
      created_at: { type: 'number', description: '创建时间戳' },
      updated_at: { type: 'number', description: '更新时间戳' },
      last_active_at: { type: 'number', description: '最后活跃时间' },
      status: { type: 'string', default: 'active', description: '用户状态：active/banned/deleted' },
      ext: { type: 'object', nullable: true, description: '扩展字段，JSON格式' }
    },
    indexes: ['device_id', 'phone', 'created_at']
  },

  /**
   * ai_conversation - AI对话记录表
   * 存储用户与AI助手的对话历史
   */
  ai_conversation: {
    table_name: 'ai_conversation',
    version: 'V2.0',
    enabled: false,
    description: 'AI对话记录表，存储用户与AI助手的对话历史',
    fields: {
      id: { type: 'string', primary: true, description: '对话记录ID' },
      user_id: { type: 'string', description: '用户ID' },
      session_id: { type: 'string', description: '会话ID，同一会话的多条记录共享' },
      role: { type: 'string', description: '角色：user/assistant/system' },
      content: { type: 'string', description: '对话内容' },
      message_type: { type: 'string', default: 'text', description: '消息类型：text/image/legal_reference' },
      related_channel_id: { type: 'string', nullable: true, description: '关联的渠道ID' },
      related_script_id: { type: 'string', nullable: true, description: '关联的话术ID' },
      tokens_used: { type: 'number', default: 0, description: '消耗的token数' },
      response_time_ms: { type: 'number', nullable: true, description: 'AI响应耗时（毫秒）' },
      rating: { type: 'number', nullable: true, description: '用户评分：1-5' },
      created_at: { type: 'number', description: '创建时间戳' },
      ext: { type: 'object', nullable: true, description: '扩展字段，JSON格式' }
    },
    indexes: ['user_id', 'session_id', 'created_at']
  },

  /**
   * complaint_ticket - 投诉跟踪卡表
   * 存储用户创建的投诉跟踪卡，记录投诉进度
   */
  complaint_ticket: {
    table_name: 'complaint_ticket',
    version: 'V2.0',
    enabled: false,
    description: '投诉跟踪卡表，记录用户投诉进度',
    fields: {
      id: { type: 'string', primary: true, description: '跟踪卡ID' },
      user_id: { type: 'string', description: '用户ID' },
      title: { type: 'string', description: '投诉标题' },
      category_l1: { type: 'string', description: '一级分类' },
      category_l2: { type: 'string', nullable: true, description: '二级分类' },
      respondent: { type: 'string', description: '被投诉方名称' },
      respondent_contact: { type: 'string', nullable: true, description: '被投诉方联系方式' },
      amount_involved: { type: 'number', default: 0, description: '涉及金额（元）' },
      channel_id: { type: 'string', nullable: true, description: '使用的投诉渠道ID' },
      script_id: { type: 'string', nullable: true, description: '使用的话术模板ID' },
      status: { type: 'string', default: 'draft', description: '状态：draft/submitted/processing/resolved/escalated/closed' },
      current_stage: { type: 'string', nullable: true, description: '当前阶段（对应跟进时间表节点）' },
      submitted_at: { type: 'number', nullable: true, description: '提交时间' },
      expected_resolve_at: { type: 'number', nullable: true, description: '预计解决时间' },
      resolved_at: { type: 'number', nullable: true, description: '实际解决时间' },
      result: { type: 'string', nullable: true, description: '处理结果描述' },
      satisfaction: { type: 'number', nullable: true, description: '满意度：1-5' },
      created_at: { type: 'number', description: '创建时间戳' },
      updated_at: { type: 'number', description: '更新时间戳' },
      ext: { type: 'object', nullable: true, description: '扩展字段，JSON格式' }
    },
    indexes: ['user_id', 'status', 'channel_id', 'created_at']
  },

  /**
   * evidence - 证据表
   * 存储用户上传的证据文件（图片、视频、文档等）
   */
  evidence: {
    table_name: 'evidence',
    version: 'V2.0',
    enabled: false,
    description: '证据表，存储用户上传的证据文件',
    fields: {
      id: { type: 'string', primary: true, description: '证据ID' },
      user_id: { type: 'string', description: '用户ID' },
      complaint_ticket_id: { type: 'string', nullable: true, description: '关联的投诉跟踪卡ID' },
      script_id: { type: 'string', nullable: true, description: '关联的话术ID' },
      file_type: { type: 'string', description: '文件类型：image/video/audio/document' },
      file_name: { type: 'string', description: '文件名' },
      file_size: { type: 'number', description: '文件大小（字节）' },
      file_url: { type: 'string', description: '文件存储URL（云存储）' },
      local_path: { type: 'string', nullable: true, description: '本地临时路径' },
      thumbnail_url: { type: 'string', nullable: true, description: '缩略图URL' },
      title: { type: 'string', nullable: true, description: '证据标题/说明' },
      evidence_type: { type: 'string', nullable: true, description: '证据类型：合同/聊天记录/支付凭证/照片/录音/其他' },
      captured_at: { type: 'number', nullable: true, description: '证据获取时间' },
      is_encrypted: { type: 'boolean', default: false, description: '是否加密存储' },
      created_at: { type: 'number', description: '创建时间戳' },
      ext: { type: 'object', nullable: true, description: '扩展字段，JSON格式' }
    },
    indexes: ['user_id', 'complaint_ticket_id', 'file_type', 'created_at']
  },

  // ========== V2.5 启用表 ==========

  /**
   * channel_feedback - 渠道效力反馈表
   * 存储用户对投诉渠道的效力反馈
   */
  channel_feedback: {
    table_name: 'channel_feedback',
    version: 'V2.5',
    enabled: false,
    description: '渠道效力反馈表，存储用户对投诉渠道的评价',
    fields: {
      id: { type: 'string', primary: true, description: '反馈ID' },
      user_id: { type: 'string', description: '用户ID' },
      channel_id: { type: 'string', description: '渠道ID' },
      complaint_ticket_id: { type: 'string', nullable: true, description: '关联的投诉跟踪卡ID' },
      effect_rating: { type: 'number', description: '效力评分：1-5' },
      response_speed: { type: 'number', nullable: true, description: '响应速度评分：1-5' },
      penalty_power: { type: 'number', nullable: true, description: '处罚力度评分：1-5' },
      success_rate: { type: 'number', nullable: true, description: '成功率评分：1-5' },
      is_resolved: { type: 'boolean', nullable: true, description: '问题是否得到解决' },
      resolve_days: { type: 'number', nullable: true, description: '解决耗时（天）' },
      comment: { type: 'string', nullable: true, description: '文字评价' },
      is_anonymous: { type: 'boolean', default: true, description: '是否匿名评价' },
      created_at: { type: 'number', description: '创建时间戳' },
      ext: { type: 'object', nullable: true, description: '扩展字段，JSON格式' }
    },
    indexes: ['channel_id', 'user_id', 'effect_rating', 'created_at']
  },

  /**
   * post - 社区帖子表
   * 存储用户发布的维权案例分享帖子
   */
  post: {
    table_name: 'post',
    version: 'V2.5',
    enabled: false,
    description: '社区帖子表，存储用户发布的维权案例分享',
    fields: {
      id: { type: 'string', primary: true, description: '帖子ID' },
      user_id: { type: 'string', description: '发布用户ID' },
      title: { type: 'string', description: '帖子标题' },
      content: { type: 'string', description: '帖子内容（富文本/Markdown）' },
      content_type: { type: 'string', default: 'text', description: '内容类型：text/markdown/rich' },
      category: { type: 'string', description: '帖子分类：case_share/question/discussion/guide' },
      related_channel_ids: { type: 'array', nullable: true, description: '关联的渠道ID列表' },
      related_script_ids: { type: 'array', nullable: true, description: '关联的话术ID列表' },
      cover_image: { type: 'string', nullable: true, description: '封面图URL' },
      images: { type: 'array', nullable: true, description: '图片URL列表' },
      view_count: { type: 'number', default: 0, description: '浏览次数' },
      like_count: { type: 'number', default: 0, description: '点赞数' },
      comment_count: { type: 'number', default: 0, description: '评论数' },
      share_count: { type: 'number', default: 0, description: '分享数' },
      is_anonymous: { type: 'boolean', default: false, description: '是否匿名发布' },
      is_featured: { type: 'boolean', default: false, description: '是否精选/置顶' },
      status: { type: 'string', default: 'published', description: '状态：draft/published/hidden/deleted' },
      published_at: { type: 'number', nullable: true, description: '发布时间' },
      created_at: { type: 'number', description: '创建时间戳' },
      updated_at: { type: 'number', description: '更新时间戳' },
      ext: { type: 'object', nullable: true, description: '扩展字段，JSON格式' }
    },
    indexes: ['user_id', 'category', 'status', 'is_featured', 'published_at']
  },

  /**
   * comment - 社区评论表
   * 存储社区帖子的评论
   */
  comment: {
    table_name: 'comment',
    version: 'V2.5',
    enabled: false,
    description: '社区评论表，存储帖子评论',
    fields: {
      id: { type: 'string', primary: true, description: '评论ID' },
      post_id: { type: 'string', description: '所属帖子ID' },
      user_id: { type: 'string', description: '评论用户ID' },
      parent_id: { type: 'string', nullable: true, description: '父评论ID（用于回复）' },
      reply_to_user_id: { type: 'string', nullable: true, description: '回复的目标用户ID' },
      content: { type: 'string', description: '评论内容' },
      images: { type: 'array', nullable: true, description: '图片URL列表' },
      like_count: { type: 'number', default: 0, description: '点赞数' },
      is_anonymous: { type: 'boolean', default: false, description: '是否匿名评论' },
      status: { type: 'string', default: 'published', description: '状态：published/hidden/deleted' },
      created_at: { type: 'number', description: '创建时间戳' },
      ext: { type: 'object', nullable: true, description: '扩展字段，JSON格式' }
    },
    indexes: ['post_id', 'user_id', 'parent_id', 'created_at']
  },

  /**
   * like - 点赞表
   * 存储用户对帖子、评论的点赞记录
   */
  like: {
    table_name: 'like',
    version: 'V2.5',
    enabled: false,
    description: '点赞表，存储用户点赞记录',
    fields: {
      id: { type: 'string', primary: true, description: '点赞ID' },
      user_id: { type: 'string', description: '用户ID' },
      target_type: { type: 'string', description: '点赞对象类型：post/comment/channel/script' },
      target_id: { type: 'string', description: '点赞对象ID' },
      created_at: { type: 'number', description: '创建时间戳' },
      ext: { type: 'object', nullable: true, description: '扩展字段，JSON格式' }
    },
    indexes: ['user_id', 'target_type', 'target_id', 'created_at'],
    unique_keys: ['user_id+target_type+target_id']
  },

  // ========== 已本地实现表 ==========

  /**
   * favorite - 收藏表
   * 存储用户收藏的渠道和话术（已本地实现，支持分组）
   */
  favorite: {
    table_name: 'favorite',
    version: 'MVP',
    enabled: true,
    description: '收藏表，存储用户收藏的渠道和话术（已本地实现）',
    fields: {
      id: { type: 'string', primary: true, description: '收藏ID' },
      user_id: { type: 'string', description: '用户ID（本地用device_id）' },
      item_type: { type: 'string', description: '收藏类型：channel/script' },
      item_id: { type: 'string', description: '收藏对象ID' },
      group_id: { type: 'string', default: 'default', description: '所属分组ID' },
      created_at: { type: 'number', description: '创建时间戳' },
      ext: { type: 'object', nullable: true, description: '扩展字段，JSON格式' }
    },
    indexes: ['user_id', 'item_type', 'group_id', 'created_at'],
    unique_keys: ['user_id+item_type+item_id']
  },

  /**
   * search_log - 搜索日志表
   * 存储用户搜索记录（已本地实现，匿名用于搜索优化）
   */
  search_log: {
    table_name: 'search_log',
    version: 'MVP',
    enabled: true,
    description: '搜索日志表，存储用户搜索记录（已本地实现）',
    fields: {
      id: { type: 'string', primary: true, description: '日志ID' },
      keyword: { type: 'string', description: '搜索关键词' },
      result_count: { type: 'number', default: 0, description: '搜索结果数量' },
      search_type: { type: 'string', default: 'all', description: '搜索类型：all/channel/script/platform' },
      searched_at: { type: 'number', description: '搜索时间戳' },
      ext: { type: 'object', nullable: true, description: '扩展字段，JSON格式' }
    },
    indexes: ['keyword', 'search_type', 'searched_at']
  },

  /**
   * view_history - 浏览历史表
   * 存储用户浏览渠道和话术的历史记录（已本地实现）
   */
  view_history: {
    table_name: 'view_history',
    version: 'MVP',
    enabled: true,
    description: '浏览历史表，存储用户浏览记录（已本地实现）',
    fields: {
      id: { type: 'string', primary: true, description: '历史记录ID' },
      user_id: { type: 'string', description: '用户ID（本地用device_id）' },
      item_type: { type: 'string', description: '浏览类型：channel/script' },
      item_id: { type: 'string', description: '浏览对象ID' },
      item_name: { type: 'string', nullable: true, description: '对象名称（用于快速展示）' },
      item_extra: { type: 'string', nullable: true, description: '额外信息' },
      viewed_at: { type: 'number', description: '浏览时间戳' },
      ext: { type: 'object', nullable: true, description: '扩展字段，JSON格式' }
    },
    indexes: ['user_id', 'item_type', 'viewed_at']
  }
};
