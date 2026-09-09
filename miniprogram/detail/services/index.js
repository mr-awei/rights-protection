/**
 * Service 业务服务层（对齐 TDD §6.3）
 * Service 依赖 Repository 接口，封装业务规则；页面只调用 Service，不直接碰数据模块。
 */
const { search, suggest } = require('../utils/search.js');

class SearchService {
  constructor(repo) {
    this.repo = repo;
  }
  /** 主搜索：复用既有 search 管线（数据来自 repo 同层模块，行为一致） */
  search(keyword) {
    return search(keyword);
  }
  /** 搜索联想 */
  suggest(keyword) {
    return suggest(keyword);
  }
}

class ChannelService {
  constructor(repo) {
    this.repo = repo;
  }
  getDetail(id) {
    return this.repo.channels.getChannelDetail(id);
  }
  getRelatedScripts(channel) {
    return this.repo.channels.getRelatedScripts(channel);
  }
  getByHotline(phone) {
    return this.repo.channels.getChannelByHotline(phone);
  }
  getChannelsByCategory(l1, l2) {
    return this.repo.channels.getChannelsByCategory(l1, l2);
  }
}

class ScriptService {
  constructor(repo) {
    this.repo = repo;
  }
  getDetail(id) {
    return this.repo.scripts.getScriptById(id);
  }
  getRelatedChannels(script) {
    return this.repo.scripts.getRelatedChannels(script);
  }
  getPhoneContent(script) {
    return this.repo.scripts.getScriptPhoneContent(script);
  }
  getWrittenContent(script) {
    return this.repo.scripts.getScriptWrittenContent(script);
  }
}

function createServices(repositories) {
  return {
    search: new SearchService(repositories),
    channels: new ChannelService(repositories),
    scripts: new ScriptService(repositories),
  };
}

module.exports = {
  createServices,
  SearchService,
  ChannelService,
  ScriptService,
};
