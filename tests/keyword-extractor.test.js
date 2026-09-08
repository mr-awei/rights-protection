// tests/keyword-extractor.test.js
// 关键词提取器单元测试

const { extractKeywords, getKeywordStats } = require('../miniprogram/utils/keyword-extractor.js');

describe('关键词提取器 - 基础功能', () => {
  it('应该能从简单句子中提取关键词', () => {
    const result = extractKeywords('我的快递丢了');
    assertContains(result.domains, '快递物流', '应该提取到快递物流领域');
    assertContains(result.issues, '丢失', '应该提取到丢失问题');
  });

  it('应该能提取电信运营关键词', () => {
    const result = extractKeywords('手机话费被扣了');
    assertContains(result.domains, '电信运营', '应该提取到电信运营领域');
    assertContains(result.issues, '乱收费', '应该提取到乱收费问题');
  });

  it('应该能提取消费购物关键词', () => {
    const result = extractKeywords('淘宝买的东西是假货，商家不给退款');
    assertContains(result.domains, '消费购物', '应该提取到消费购物领域');
    assertContains(result.issues, '假货', '应该提取到假货问题');
    assertContains(result.issues, '不退款', '应该提取到不退款问题');
  });

  it('应该能提取金融保险关键词', () => {
    const result = extractKeywords('银行理财产品被骗了');
    assertContains(result.domains, '金融保险', '应该提取到金融保险领域');
    assertGreater(result.issues.length, 0, '应该提取到至少一个问题');
  });

  it('应该能提取劳动用工关键词', () => {
    const result = extractKeywords('公司拖欠工资，还不给加班费');
    assertContains(result.domains, '劳动用工', '应该提取到劳动用工领域');
    assertContains(result.issues, '欠薪', '应该提取到欠薪问题');
  });
});

describe('关键词提取器 - 复杂场景', () => {
  it('应该能处理长文本描述', () => {
    const result = extractKeywords('我在网上买了一个手机，收到后发现是假货，屏幕有划痕，商家不给退款还态度很差，快递也很慢');
    assertGreater(result.domains.length, 0, '应该提取到至少一个领域');
    assertGreater(result.issues.length, 0, '应该提取到至少一个问题');
  });

  it('应该能处理口语化表达', () => {
    const result = extractKeywords('太气人了，快递员把我包裹扔门卫就走了，还丢了');
    assertContains(result.domains, '快递物流', '应该提取到快递物流领域');
  });

  it('应该能处理多个领域混合', () => {
    const result = extractKeywords('物业不给修电梯，还乱收物业费，小区快递也丢了');
    assertContains(result.domains, '房产物业', '应该提取到房产物业领域');
    assertContains(result.domains, '快递物流', '应该提取到快递物流领域');
  });

  it('空输入应该返回空结果', () => {
    const result = extractKeywords('');
    assertLength(result.domains, 0, '空输入不应该提取到领域');
    assertLength(result.issues, 0, '空输入不应该提取到问题');
  });

  it('无意义输入应该返回空结果', () => {
    const result = extractKeywords('今天天气真好啊哈哈');
    assertLength(result.domains, 0, '无意义输入不应该提取到领域');
  });
});

describe('关键词提取器 - 统计功能', () => {
  it('应该能返回关键词统计信息', () => {
    const stats = getKeywordStats();
    assertGreater(stats.totalKeywords, 0, '关键词总数应该大于0');
    assertGreater(stats.domainCategories, 0, '领域分类数量应该大于0');
    assertGreater(stats.issueCategories, 0, '问题分类数量应该大于0');
  });
});
