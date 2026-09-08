// tests/test-runner.js
// 零依赖单元测试框架 - 简单易用，无需安装任何依赖
// 运行方式：node tests/test-runner.js

class TestRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  // 定义测试套件
  describe(name, fn) {
    this.currentSuite = { name, tests: [] };
    this.suites.push(this.currentSuite);
    fn();
    this.currentSuite = null;
  }

  // 定义测试用例
  it(name, fn) {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ name, fn });
    }
  }

  // 断言：相等
  assertEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(`${message}\n  期望: ${expectedStr}\n  实际: ${actualStr}`);
    }
  }

  // 断言：不相等
  assertNotEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr === expectedStr) {
      throw new Error(`${message}\n  期望不相等，但两者相等: ${actualStr}`);
    }
  }

  // 断言：为真
  assertTrue(value, message = '') {
    if (!value) {
      throw new Error(`${message}\n  期望为真，实际为假`);
    }
  }

  // 断言：为假
  assertFalse(value, message = '') {
    if (value) {
      throw new Error(`${message}\n  期望为假，实际为真`);
    }
  }

  // 断言：包含
  assertContains(haystack, needle, message = '') {
    if (typeof haystack === 'string') {
      if (!haystack.includes(needle)) {
        throw new Error(`${message}\n  期望字符串包含 "${needle}"，实际不包含`);
      }
    } else if (Array.isArray(haystack)) {
      if (!haystack.includes(needle)) {
        throw new Error(`${message}\n  期望数组包含 ${JSON.stringify(needle)}，实际不包含`);
      }
    } else {
      throw new Error('assertContains 只支持字符串和数组');
    }
  }

  // 断言：数组长度
  assertLength(arr, length, message = '') {
    if (arr.length !== length) {
      throw new Error(`${message}\n  期望长度 ${length}，实际长度 ${arr.length}`);
    }
  }

  // 断言：大于
  assertGreater(actual, expected, message = '') {
    if (!(actual > expected)) {
      throw new Error(`${message}\n  期望 ${actual} > ${expected}`);
    }
  }

  // 运行所有测试
  run() {
    console.log('\n' + '='.repeat(60));
    console.log('  我不能被欺负 - 单元测试');
    console.log('='.repeat(60) + '\n');

    const startTime = Date.now();

    for (const suite of this.suites) {
      console.log(`\n📦 ${suite.name}`);
      console.log('-'.repeat(50));

      for (const test of suite.tests) {
        try {
          test.fn();
          this.passed++;
          console.log(`  ✅ ${test.name}`);
        } catch (e) {
          this.failed++;
          this.errors.push({ suite: suite.name, test: test.name, error: e.message });
          console.log(`  ❌ ${test.name}`);
          console.log(`     ${e.message.split('\n').join('\n     ')}`);
        }
      }
    }

    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(60));
    console.log(`  测试结果: ${this.passed} 通过, ${this.failed} 失败`);
    console.log(`  耗时: ${duration}ms`);
    console.log('='.repeat(60) + '\n');

    if (this.failed > 0) {
      console.log('❌ 有测试失败，请检查以上错误信息\n');
      process.exit(1);
    } else {
      console.log('✅ 所有测试通过！\n');
      process.exit(0);
    }
  }
}

// 全局实例
const runner = new TestRunner();

// 导出全局函数
global.describe = (name, fn) => runner.describe(name, fn);
global.it = (name, fn) => runner.it(name, fn);
global.assertEqual = (a, e, m) => runner.assertEqual(a, e, m);
global.assertNotEqual = (a, e, m) => runner.assertNotEqual(a, e, m);
global.assertTrue = (v, m) => runner.assertTrue(v, m);
global.assertFalse = (v, m) => runner.assertFalse(v, m);
global.assertContains = (h, n, m) => runner.assertContains(h, n, m);
global.assertLength = (a, l, m) => runner.assertLength(a, l, m);
global.assertGreater = (a, e, m) => runner.assertGreater(a, e, m);

// 延迟运行，等待所有测试文件加载
setTimeout(() => {
  runner.run();
}, 100);

module.exports = runner;
