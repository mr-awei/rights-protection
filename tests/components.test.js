// tests/components.test.js
// 通用组件单元测试

const fs = require('fs');
const path = require('path');

describe('通用组件 - 配置验证', () => {
  it('empty-state 组件应该有正确的配置', () => {
    const json = require('../miniprogram/components/empty-state/empty-state.json');
    assertTrue(json.component === true, 'empty-state应该是组件');
  });

  it('loading-state 组件应该有正确的配置', () => {
    const json = require('../miniprogram/components/loading-state/loading-state.json');
    assertTrue(json.component === true, 'loading-state应该是组件');
  });

  it('ui-card 组件应该有正确的配置', () => {
    const json = require('../miniprogram/components/ui-card/ui-card.json');
    assertTrue(json.component === true, 'ui-card应该是组件');
  });

  it('ui-tag 组件应该有正确的配置', () => {
    const json = require('../miniprogram/components/ui-tag/ui-tag.json');
    assertTrue(json.component === true, 'ui-tag应该是组件');
  });

  it('list-item 组件应该有正确的配置', () => {
    const json = require('../miniprogram/components/list-item/list-item.json');
    assertTrue(json.component === true, 'list-item应该是组件');
  });

  it('custom-modal 组件应该有正确的配置', () => {
    const json = require('../miniprogram/components/custom-modal/custom-modal.json');
    assertTrue(json.component === true, 'custom-modal应该是组件');
  });
});

describe('通用组件 - 文件完整性', () => {
  const components = [
    'empty-state',
    'loading-state',
    'ui-card',
    'ui-tag',
    'list-item',
    'custom-modal'
  ];

  components.forEach(compName => {
    it(compName + ' 组件应该包含4个文件', () => {
      const compPath = path.join(__dirname, '../miniprogram/components/' + compName);
      const jsFile = path.join(compPath, compName + '.js');
      const jsonFile = path.join(compPath, compName + '.json');
      const wxmlFile = path.join(compPath, compName + '.wxml');
      const wxssFile = path.join(compPath, compName + '.wxss');

      assertTrue(fs.existsSync(jsFile), compName + '.js 应该存在');
      assertTrue(fs.existsSync(jsonFile), compName + '.json 应该存在');
      assertTrue(fs.existsSync(wxmlFile), compName + '.wxml 应该存在');
      assertTrue(fs.existsSync(wxssFile), compName + '.wxss 应该存在');
    });

    it(compName + ' 组件文件不应该为空', () => {
      const compPath = path.join(__dirname, '../miniprogram/components/' + compName);
      const files = ['js', 'json', 'wxml', 'wxss'];
      files.forEach(ext => {
        const filePath = path.join(compPath, compName + '.' + ext);
        const stats = fs.statSync(filePath);
        assertGreater(stats.size, 0, compName + '.' + ext + ' 不应该为空');
      });
    });
  });
});

describe('通用组件 - JS语法验证', () => {
  const components = [
    'empty-state',
    'loading-state',
    'ui-card',
    'ui-tag',
    'list-item',
    'custom-modal'
  ];

  components.forEach(compName => {
    it(compName + '.js 应该有有效的JS语法', () => {
      const filePath = path.join(__dirname, '../miniprogram/components/' + compName + '/' + compName + '.js');
      const content = fs.readFileSync(filePath, 'utf8');
      assertTrue(content.indexOf('Component(') > -1, compName + '.js 应该包含Component定义');
      assertTrue(content.indexOf('properties') > -1, compName + '.js 应该包含properties');
    });
  });
});

describe('通用组件 - properties验证', () => {
  function checkProperties(compName, props) {
    const filePath = path.join(__dirname, '../miniprogram/components/' + compName + '/' + compName + '.js');
    const content = fs.readFileSync(filePath, 'utf8');
    props.forEach(prop => {
      assertTrue(content.indexOf(prop) > -1, compName + '应该有' + prop + '属性');
    });
  }

  it('empty-state 应该有必要的properties', () => {
    checkProperties('empty-state', ['title', 'desc', 'iconType', 'actionText']);
  });

  it('loading-state 应该有必要的properties', () => {
    checkProperties('loading-state', ['text', 'showText', 'size']);
  });

  it('ui-card 应该有必要的properties', () => {
    checkProperties('ui-card', ['title', 'subtitle', 'hover', 'paddingSize']);
  });

  it('ui-tag 应该有必要的properties', () => {
    checkProperties('ui-tag', ['text', 'type', 'size', 'closable']);
  });

  it('list-item 应该有必要的properties', () => {
    checkProperties('list-item', ['icon', 'title', 'desc', 'rightText', 'showArrow']);
  });
});

describe('通用组件 - 方法验证', () => {
  function checkMethods(compName, methods) {
    const filePath = path.join(__dirname, '../miniprogram/components/' + compName + '/' + compName + '.js');
    const content = fs.readFileSync(filePath, 'utf8');
    methods.forEach(method => {
      assertTrue(content.indexOf(method) > -1, compName + '应该有' + method + '方法');
    });
  }

  it('empty-state 应该有onActionTap方法', () => {
    checkMethods('empty-state', ['onActionTap']);
  });

  it('ui-card 应该有onCardTap方法', () => {
    checkMethods('ui-card', ['onCardTap']);
  });

  it('ui-tag 应该有onTagTap和onCloseTap方法', () => {
    checkMethods('ui-tag', ['onTagTap', 'onCloseTap']);
  });

  it('list-item 应该有onItemTap方法', () => {
    checkMethods('list-item', ['onItemTap']);
  });
});
