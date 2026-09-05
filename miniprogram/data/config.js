// config.js - 由 config.json 自动转换，请勿手动编辑
module.exports = {
  "data_version": "2026.08",
  "data_verified_at": "2026-08-30",
  "search_weights": {
    "name_exact": 100,
    "phone_exact": 90,
    "tag_exact": 80,
    "scope_fuzzy": 50,
    "script_match": 60,
    "platform_match": 55
  },
  "hot_search_words": [
    "快递丢失",
    "运营商扣费",
    "商家不退款",
    "物业乱收费",
    "欠薪",
    "电信诈骗",
    "噪音扰民",
    "医院乱收费",
    "出租车拒载",
    "个人信息泄露"
  ],
  "synonyms": {
    "丢了": "丢失",
    "弄丢": "丢失",
    "坑人": "误导",
    "骗人": "欺诈",
    "不管": "不作为",
    "乱收费": "违规收费",
    "退款": "退款",
    "假货": "假冒伪劣",
    "噪音": "噪声扰民",
    "欠薪": "拖欠工资",
    "诈骗": "电信网络诈骗"
  },
  "feature_flags": {
    "ai_assistant": false,
    "complaint_ticket": false,
    "evidence_manager": false,
    "community": false,
    "user_login": false,
    "effect_rating": false,
    "script_fill": false,
    "multi_city": false,
    "payment": false
  },
  "emergency_phones": [
    {
      "name": "110报警",
      "phone": "110",
      "icon": "🚨"
    },
    {
      "name": "119火警",
      "phone": "119",
      "icon": "🔥"
    },
    {
      "name": "120急救",
      "phone": "120",
      "icon": "🚑"
    },
    {
      "name": "96110反诈",
      "phone": "96110",
      "icon": "🛡️"
    }
  ],
  "limits": {
    "view_history_max": 20,
    "search_history_max": 20,
    "search_suggest_max": 8,
    "search_page_size": 20
  }
};
