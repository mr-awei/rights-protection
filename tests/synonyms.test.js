// tests/synonyms.test.js
// 同义词库单元测试

const { SYNONYMS, getSynonyms, expandKeywords, getSynonymStats } = require('../miniprogram/utils/synonyms.js');

describe('同义词库 - 基础查询', () => {
  it('应该能查询常见词的同义词', () => {
    const result = getSynonyms('投诉');
    assertGreater(result.length, 1, '投诉应该有多个同义词');
    assertContains(result, '投诉', '同义词应该包含原词');
  });

  it('应该能查询快递相关同义词', () => {
    const result = getSynonyms('快递');
    assertGreater(result.length, 0, '快递应该有同义词');
  });

  it('应该能查询退款相关同义词', () => {
    const result = getSynonyms('退款');
    assertGreater(result.length, 0, '退款应该有同义词');
  });

  it('不存在的词应该只返回原词', () => {
    const result = getSynonyms('一个完全不存在的词xyz123');
    assertLength(result, 1, '不存在的词应该只返回原词');
    assertEqual(result[0], '一个完全不存在的词xyz123', '应该返回原词');
  });

  it('空字符串应该返回空数组', () => {
    const result = getSynonyms('');
    assertLength(result, 0, '空字符串应该返回空数组');
  });
});

describe('同义词库 - 存在性检查', () => {
  it('应该能判断常见词是否有同义词', () => {
    const result = getSynonyms('投诉');
    assertGreater(result.length, 0, '投诉应该有同义词');
  });

  it('不存在的词应该只返回原词', () => {
    const result = getSynonyms('一个完全不存在的词xyz123');
    assertLength(result, 1, '不存在的词应该只返回原词');
    assertEqual(result[0], '一个完全不存在的词xyz123', '应该返回原词');
  });

  it('空字符串应该返回空数组', () => {
    const result = getSynonyms('');
    assertLength(result, 0, '空字符串应该返回空数组');
  });
});

describe('同义词库 - 统计功能', () => {
  it('应该能获取所有同义词键', () => {
    const keys = Object.keys(SYNONYMS);
    assertGreater(keys.length, 0, '同义词键数量应该大于0');
  });

  it('应该能获取同义词库统计信息', () => {
    const stats = getSynonymStats();
    assertGreater(stats.keywordCount, 0, '同义词键总数应该大于0');
    assertGreater(stats.totalSynonyms, 0, '同义词总数应该大于0');
  });

  it('同义词库应该包含足够多的词条', () => {
    const keys = Object.keys(SYNONYMS);
    assertGreater(keys.length, 100, '同义词库应该包含超过100个词条');
  });
});

describe('同义词库 - 数据质量', () => {
  it('每个同义词组应该至少包含原词', () => {
    const keys = Object.keys(SYNONYMS);
    let allValid = true;
    for (const key of keys.slice(0, 20)) {
      const synonyms = getSynonyms(key);
      if (!synonyms.includes(key)) {
        allValid = false;
        break;
      }
    }
    assertTrue(allValid, '每个同义词组应该至少包含原词');
  });

  it('同义词不应该有重复', () => {
    const keys = Object.keys(SYNONYMS);
    let hasDuplicate = false;
    for (const key of keys.slice(0, 20)) {
      const synonyms = getSynonyms(key);
      const unique = [...new Set(synonyms)];
      if (unique.length !== synonyms.length) {
        hasDuplicate = true;
        break;
      }
    }
    assertFalse(hasDuplicate, '同义词不应该有重复');
  });

  it('同义词应该是非空字符串', () => {
    const keys = Object.keys(SYNONYMS);
    let allValid = true;
    for (const key of keys.slice(0, 20)) {
      const synonyms = getSynonyms(key);
      for (const syn of synonyms) {
        if (typeof syn !== 'string' || syn.trim() === '') {
          allValid = false;
          break;
        }
      }
      if (!allValid) break;
    }
    assertTrue(allValid, '同义词应该是非空字符串');
  });
});

describe('同义词库 - 关键词扩展', () => {
  it('应该能扩展多个关键词', () => {
    const result = expandKeywords(['快递', '投诉']);
    assertGreater(result.length, 2, '扩展后应该有多个关键词');
  });

  it('扩展结果应该去重', () => {
    const result = expandKeywords(['快递', '快递']);
    const unique = [...new Set(result)];
    assertLength(unique, result.length, '扩展结果应该去重');
  });

  it('空数组应该返回空数组', () => {
    const result = expandKeywords([]);
    assertLength(result, 0, '空数组应该返回空数组');
  });
});
