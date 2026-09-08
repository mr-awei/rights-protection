// tests/run-all-tests.js
// 运行所有单元测试
// 使用方式：node tests/run-all-tests.js

console.log('正在加载测试文件...\n');

// 加载测试框架
require('./test-runner.js');

// 加载所有测试文件
try {
  require('./keyword-extractor.test.js');
  console.log('✅ 加载: keyword-extractor.test.js');
} catch (e) {
  console.log('❌ 加载失败: keyword-extractor.test.js -', e.message);
}

try {
  require('./search-enhance.test.js');
  console.log('✅ 加载: search-enhance.test.js');
} catch (e) {
  console.log('❌ 加载失败: search-enhance.test.js -', e.message);
}

try {
  require('./data-manager.test.js');
  console.log('✅ 加载: data-manager.test.js');
} catch (e) {
  console.log('❌ 加载失败: data-manager.test.js -', e.message);
}

try {
  require('./synonyms.test.js');
  console.log('✅ 加载: synonyms.test.js');
} catch (e) {
  console.log('❌ 加载失败: synonyms.test.js -', e.message);
}

try {
  require('./components.test.js');
  console.log('✅ 加载: components.test.js');
} catch (e) {
  console.log('❌ 加载失败: components.test.js -', e.message);
}

console.log('\n所有测试文件加载完成，开始运行测试...');
