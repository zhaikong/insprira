const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeInspirationTitle,
  inspirationTitleSimilarity,
  dedupeInspirationIdeas,
} = require('../server');

test('normalizes cosmetic title differences', () => {
  assert.equal(
    normalizeInspirationTitle('Docker 接下来 7 天会往哪里走？'),
    normalizeInspirationTitle('docker接下来会往哪里走'),
  );
});

test('detects exact, near and same-batch duplicate inspiration titles', () => {
  assert.ok(inspirationTitleSimilarity(
    'Docker 容器管理的五个常见误区',
    'Docker容器管理：5个常见误区',
  ) >= 0.84);

  const result = dedupeInspirationIdeas([
    { title: 'NAS 数据备份的三层防线' },
    { title: 'NAS数据备份：三层防线' },
    { title: '低功耗主机如何规划家庭服务' },
  ], ['Docker 容器管理的五个常见误区']);

  assert.deepEqual(result.accepted.map(item => item.title), [
    'NAS 数据备份的三层防线',
    '低功耗主机如何规划家庭服务',
  ]);
  assert.equal(result.rejected.length, 1);
});
