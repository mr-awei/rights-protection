/**
 * Repository 数据访问层（对齐 TDD §3 / §6 / §16）
 *
 * 设计目标：View / Service 只依赖 Repository 接口，不感知数据来自本地 JSON 还是远程 API。
 * 当前实现 Local*Repository 直接委托既有数据模块（utils/data.js + detail/utils/data-detail.js）。
 * V3.0 接入开放 API / 独立后端时，只需新增 Remote*Repository 实现相同接口，
 * 并通过 createRepositories() 切换，Service 与页面层零改动。
 *
 * 位置说明：本文件位于 detail 分包内，因此可以合法引用同包 data-detail.js 与主包 data.js；
 * 若放在主包则会产生主包跨包引用 detail 分包的违规，导致运行时 "module not defined"。
 */
const localChannelData = require('../../utils/data.js');
const localDetailData = require('../utils/data-detail.js');

// ============ Channel ============
class ChannelRepository {
  /** 渠道列表（索引级，用于列表 / 收藏 / 历史） */
  getChannels() {
    return localChannelData.getChannels();
  }
  getChannelIndex(id) {
    return localChannelData.getChannelById(id);
  }
  /** 渠道完整详情（含电话 / 网址 / 流程 / 关联话术） */
  getChannelDetail(id) {
    return localDetailData.getChannelById(id);
  }
  getChannelByHotline(phone) {
    return localChannelData.getChannelByHotline(phone);
  }
  getChannelsByCategory(l1, l2) {
    return localChannelData.getChannelsByCategory(l1, l2);
  }
  getHotChannels() {
    return localChannelData.getHotChannels();
  }
  getRelatedScripts(channel) {
    return localChannelData.getRelatedScripts(channel);
  }
  searchChannels(keyword) {
    return localChannelData.searchChannels(keyword);
  }
  /** 预加载指定渠道的完整分片（懒加载详情页数据） */
  preloadChannelPart(id) {
    return localDetailData.preloadChannelPart(id);
  }
  normalizeChannel(channel) {
    return localChannelData.normalizeChannel(channel);
  }
}

// ============ Script ============
class ScriptRepository {
  getScripts() {
    return localChannelData.getScripts();
  }
  getScriptById(id) {
    return localChannelData.getScriptById(id);
  }
  getHotScripts() {
    return localChannelData.getHotScripts();
  }
  getRelatedChannels(script) {
    return localChannelData.getRelatedChannels(script);
  }
  getScriptPhoneContent(script) {
    return localChannelData.getScriptPhoneContent(script);
  }
  getScriptWrittenContent(script) {
    return localChannelData.getScriptWrittenContent(script);
  }
  searchScripts(keyword) {
    return localChannelData.searchScripts(keyword);
  }
}

// ============ Platform ============
class PlatformRepository {
  getPlatforms() {
    return localDetailData.getPlatforms();
  }
  getPlatformById(id) {
    return localDetailData.getPlatformById(id);
  }
  searchPlatforms(keyword) {
    return localDetailData.searchPlatforms(keyword);
  }
}

// ============ Law ============
class LawRepository {
  getLaws() {
    return localDetailData.getLaws();
  }
  getLawById(id) {
    return localDetailData.getLawById(id);
  }
}

// ============ Config / Tool ============
class ConfigRepository {
  getConfig() {
    return localChannelData.getConfig();
  }
  getCategories() {
    return localChannelData.getCategories();
  }
  getHotSearchWords() {
    return (localChannelData.getConfig().hot_search_words) || [];
  }
  getEmergencyPhones() {
    return (localChannelData.getConfig().emergency_phones) || [];
  }
  getChangelog() {
    return (localChannelData.getConfig().changelog) || [];
  }
  getToolData(name) {
    return localChannelData.getToolData(name);
  }
  getHotlineChanges() {
    return localChannelData.getHotlineChanges();
  }
  getFollowupSchedule() {
    return localChannelData.getFollowupSchedule();
  }
  getEnterpriseQueries() {
    return localChannelData.getEnterpriseQueries();
  }
  getGeneralTemplate() {
    return localChannelData.getGeneralTemplate();
  }
}

/**
 * 工厂：返回当前启用的 Repository 集合。
 * V3.0 远程化时改为根据 feature_flags 返回 Remote 实现（保持相同接口）。
 */
function createRepositories() {
  return {
    channels: new ChannelRepository(),
    scripts: new ScriptRepository(),
    platforms: new PlatformRepository(),
    laws: new LawRepository(),
    config: new ConfigRepository(),
  };
}

module.exports = {
  createRepositories,
  ChannelRepository,
  ScriptRepository,
  PlatformRepository,
  LawRepository,
  ConfigRepository,
};
