// tests/search-enhance.test.js
// 搜索增强工具单元测试

const {
  getPinyinInitial,
  getPinyinInitials,
  editDistance,
  correctTypos,
  fuzzyMatch
} = require('../miniprogram/utils/search-enhance.js');

const { getSynonyms, expandKeywords } = require('../miniprogram/utils/synonyms.js');

describe('搜索增强 - 拼音首字母转换', () => {
  it('应该能转换单个汉字为拼音首字母', () => {
    assertEqual(getPinyinInitial('快'), 'k', '快应该转换为k');
    assertEqual(getPinyinInitial('递'), 'd', '递应该转换为d');
    assertEqual(getPinyinInitial('电'), 'd', '电应该转换为d');
  });

  it('应该能转换整个字符串为拼音首字母串', () => {
    assertEqual(getPinyinInitials('快递'), 'kd', '快递应该转换为kd');
    assertEqual(getPinyinInitials('电信'), 'dx', '电信应该转换为dx');
    assertEqual(getPinyinInitials('消费'), 'xf', '消费应该转换为xf');
  });

  it('应该能处理混合中英文', () => {
    const result = getPinyinInitials('WiFi');
    assertEqual(result, 'wifi', '英文应该保持小写');
  });

  it('空字符串应该返回空', () => {
    assertEqual(getPinyinInitials(''), '', '空字符串应该返回空');
  });
});

describe('搜索增强 - 编辑距离计算', () => {
  it('相同字符串编辑距离应该为0', () => {
    assertEqual(editDistance('快递', '快递'), 0, '相同字符串编辑距离为0');
  });

  it('单字符差异编辑距离应该为1', () => {
    assertEqual(editDistance('快递', '快第'), 1, '单字符差异编辑距离为1');
  });

  it('完全不同字符串编辑距离应该正确', () => {
    const distance = editDistance('快递', '电信');
    assertGreater(distance, 0, '完全不同字符串编辑距离应该大于0');
  });

  it('空字符串编辑距离应该等于另一字符串长度', () => {
    assertEqual(editDistance('', '快递'), 2, '空字符串编辑距离等于另一字符串长度');
  });
});

describe('搜索增强 - 错别字纠正', () => {
  it('应该能纠正常见错别字', () => {
    const result = correctTypos('快第');
    assertEqual(result, '快递', '快第应该纠正为快递');
  });

  it('正确的词不应该被修改', () => {
    const result = correctTypos('快递');
    assertEqual(result, '快递', '正确的词不应该被修改');
  });

  it('空字符串应该返回空', () => {
    assertEqual(correctTypos(''), '', '空字符串应该返回空');
  });
});

describe('搜索增强 - 同义词扩展', () => {
  it('应该能扩展常见同义词', () => {
    const result = expandKeywords(['快递']);
    assertGreater(result.length, 1, '快递应该有多个同义词');
    assertContains(result, '快递', '同义词应该包含原词');
  });

  it('应该能扩展投诉相关同义词', () => {
    const result = expandKeywords(['投诉']);
    assertGreater(result.length, 1, '投诉应该有多个同义词');
  });

  it('无同义词的词应该只返回原词', () => {
    const result = getSynonyms('一个完全不存在的词xyz123');
    assertLength(result, 1, '无同义词的词应该只返回原词');
    assertEqual(result[0], '一个完全不存在的词xyz123', '应该返回原词');
  });

  it('空字符串应该返回空数组', () => {
    const result = getSynonyms('');
    assertLength(result, 0, '空字符串应该返回空数组');
  });
});

describe('搜索增强 - 模糊匹配', () => {
  it('应该能精确包含匹配', () => {
    const result = fuzzyMatch('快递', '快递投诉');
    assertTrue(result.matched, '应该能精确包含匹配');
    assertEqual(result.score, 100, '精确包含匹配得分应该为100');
  });

  it('应该能精确匹配', () => {
    const result = fuzzyMatch('快递', '快递');
    assertTrue(result.matched, '精确匹配应该成功');
    assertEqual(result.score, 100, '精确匹配得分应该为100');
  });

  it('完全不相关的词不应该匹配', () => {
    const result = fuzzyMatch('一个完全不存在的词xyz123', '快递');
    assertFalse(result.matched, '完全不相关的词不应该匹配');
  });

  it('空输入应该返回未匹配', () => {
    const result = fuzzyMatch('', '快递');
    assertFalse(result.matched, '空输入应该返回未匹配');
  });

  it('空目标应该返回未匹配', () => {
    const result = fuzzyMatch('快递', '');
    assertFalse(result.matched, '空目标应该返回未匹配');
  });
});
