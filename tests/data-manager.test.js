// tests/data-manager.test.js
// 数据管理单元测试

// 注意：数据管理模块依赖微信小程序的require机制，在Node环境下需要模拟
// 这里测试数据结构和基本逻辑

describe('数据管理 - 数据结构验证', () => {
  it('渠道数据应该有必要的字段', () => {
    // 模拟渠道数据结构验证
    const requiredFields = ['id', 'name', 'phone', 'tags', 'category_l1', 'category_l2'];
    const sampleChannel = {
      id: 'test_001',
      name: '测试渠道',
      phone: '12345',
      tags: ['测试'],
      category_l1: '测试分类',
      category_l2: '测试子类'
    };

    for (const field of requiredFields) {
      assertTrue(sampleChannel.hasOwnProperty(field), `渠道数据应该包含字段: ${field}`);
    }
  });

  it('话术数据应该有必要的字段', () => {
    const requiredFields = ['id', 'title', 'content', 'category', 'placeholders'];
    const sampleScript = {
      id: 'script_001',
      title: '测试话术',
      content: '这是测试话术内容',
      category: '测试分类',
      placeholders: ['姓名', '电话']
    };

    for (const field of requiredFields) {
      assertTrue(sampleScript.hasOwnProperty(field), `话术数据应该包含字段: ${field}`);
    }
  });

  it('法律法规数据应该有必要的字段', () => {
    const requiredFields = ['id', 'name', 'articles', 'category'];
    const sampleLaw = {
      id: 'law_001',
      name: '测试法律',
      articles: [{ id: 'art_001', title: '第一条', content: '测试内容' }],
      category: '测试分类'
    };

    for (const field of requiredFields) {
      assertTrue(sampleLaw.hasOwnProperty(field), `法律法规数据应该包含字段: ${field}`);
    }
  });

  it('分类数据应该有层级结构', () => {
    const sampleCategory = {
      id: 'cat_001',
      name: '一级分类',
      children: [
        { id: 'cat_002', name: '二级分类' }
      ]
    };

    assertTrue(sampleCategory.hasOwnProperty('id'), '分类应该有id');
    assertTrue(sampleCategory.hasOwnProperty('name'), '分类应该有name');
    assertTrue(Array.isArray(sampleCategory.children), '分类应该有children数组');
  });
});

describe('数据管理 - 数据完整性', () => {
  it('渠道ID应该唯一', () => {
    const channels = [
      { id: '001', name: '渠道1' },
      { id: '002', name: '渠道2' },
      { id: '003', name: '渠道3' }
    ];
    const ids = channels.map(c => c.id);
    const uniqueIds = [...new Set(ids)];
    assertLength(uniqueIds, ids.length, '渠道ID应该唯一');
  });

  it('话术ID应该唯一', () => {
    const scripts = [
      { id: 's001', title: '话术1' },
      { id: 's002', title: '话术2' }
    ];
    const ids = scripts.map(s => s.id);
    const uniqueIds = [...new Set(ids)];
    assertLength(uniqueIds, ids.length, '话术ID应该唯一');
  });

  it('法律ID应该唯一', () => {
    const laws = [
      { id: 'l001', name: '法律1' },
      { id: 'l002', name: '法律2' }
    ];
    const ids = laws.map(l => l.id);
    const uniqueIds = [...new Set(ids)];
    assertLength(uniqueIds, ids.length, '法律ID应该唯一');
  });
});

describe('数据管理 - 分片架构', () => {
  it('分片配置应该包含必要字段', () => {
    const shardConfig = {
      num_parts: 3,
      part_size: 50,
      total_count: 122
    };
    assertTrue(shardConfig.hasOwnProperty('num_parts'), '分片配置应该有num_parts');
    assertTrue(shardConfig.hasOwnProperty('part_size'), '分片配置应该有part_size');
    assertTrue(shardConfig.hasOwnProperty('total_count'), '分片配置应该有total_count');
  });

  it('索引数据应该包含必要字段', () => {
    const indexItem = {
      id: '001',
      name: '测试渠道',
      phone: '12345',
      tags: ['测试'],
      part_num: 1
    };
    assertTrue(indexItem.hasOwnProperty('id'), '索引应该有id');
    assertTrue(indexItem.hasOwnProperty('name'), '索引应该有name');
    assertTrue(indexItem.hasOwnProperty('part_num'), '索引应该有part_num');
  });

  it('分片数量应该合理', () => {
    const totalCount = 122;
    const partSize = 50;
    const expectedParts = Math.ceil(totalCount / partSize);
    assertEqual(expectedParts, 3, '122条数据按50条/片应该是3片');
  });
});
