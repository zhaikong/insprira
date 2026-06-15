const test = require('node:test');
const assert = require('node:assert/strict');

const {
  hashPassword,
  verifyPassword,
  validateUsername,
  validatePassword,
} = require('../server');

test('password hashes are salted and verifiable', () => {
  const first = hashPassword('123456');
  const second = hashPassword('123456');
  assert.notEqual(first, second);
  assert.equal(verifyPassword('123456', first), true);
  assert.equal(verifyPassword('wrong-password', first), false);
});

test('account input validation accepts defaults and rejects weak values', () => {
  assert.equal(validateUsername('admin'), 'admin');
  assert.equal(validatePassword('123456'), '123456');
  assert.throws(() => validateUsername('a'));
  assert.throws(() => validatePassword('123'));
});
