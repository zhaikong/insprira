const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('production Tailwind CSS is local and login password belongs to a form', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com/);
  assert.match(html, /css\/tailwind\.css/);
  assert.match(html, /<form id="login-form"[\s\S]*id="loginPass"[\s\S]*<\/form>/);
});

test('settings async render guards removed DOM nodes', () => {
  const settings = read('js/pages/settings.js');
  assert.match(settings, /if \(!document\.getElementById\('api-detail'\)\) return/);
  assert.match(settings, /if \(!el\) return/);
  assert.match(settings, /if \(detail\) detail\.textContent/);
});

test('tracker exposes self group, opt-in daily sync and trend action', () => {
  const html = read('index.html');
  const tracker = read('js/pages/tracker.js');
  const styles = read('css/styles.css');
  assert.match(html, /data-group="自己"/);
  assert.match(tracker, /id="addAutoSync"/);
  assert.match(tracker, /data-action="viewTrackerTrend"/);
  assert.match(tracker, /class="account-avatar"/);
  assert.doesNotMatch(tracker, /id="addFans"/);
  assert.match(styles, /\.account-avatar img\{position:absolute;inset:0;/);
});

test('server registers the 07:00 tracker refresh cron and all diagnosis skills', () => {
  const server = read('server.js');
  assert.match(server, /tracked-account-daily[\s\S]*cron_expr: '0 7 \* \* \*'/);
  assert.match(server, /task_type: 'tracker-refresh'/);
  assert.match(server, /douyin-account-diagnosis/);
  assert.match(server, /xiaohongshu-account-analyzer/);
  assert.match(server, /wechat-account-analyzer/);
});

test('async pages guard detached DOM and inspiration count loads at startup', () => {
  const dashboard = read('js/pages/dashboard.js');
  const hotlist = read('js/pages/hotlist.js');
  const app = read('js/app.js');
  const server = read('server.js');
  assert.match(dashboard, /if \(!view\['dash-dy'\] \|\| !view\['dash-dy'\]\.isConnected\) return/);
  assert.match(hotlist, /if \(!content\.isConnected\) return/);
  assert.match(app, /localApi\('inspirations\/count'\)/);
  assert.match(server, /\/api\/_\/inspirations\/count/);
});

test('inspiration generation has no built-in templates and exposes model-only provenance', () => {
  const server = read('server.js');
  const inspiration = read('js/pages/inspiration.js');
  const html = read('index.html');
  assert.doesNotMatch(server, /function fallbackInspirations/);
  assert.match(server, /sourceMode = sourceItems\.length \? 'hot-evidence' : 'llm-reasoning'/);
  assert.match(server, /系统不再使用内置选题模板/);
  assert.match(inspiration, /无热点 · 模型推理/);
  assert.doesNotMatch(html, /会使用内置选题规则/);
});

test('account UI uses SQLite credentials instead of editable env login fields', () => {
  const html = read('index.html');
  const settings = read('js/pages/settings.js');
  const account = read('js/account.js');
  const server = read('server.js');
  assert.match(html, /默认账号：admin \/ 123456/);
  assert.match(html, /data-action="openAccountModal"/);
  assert.match(account, /localApi\('account\/password'/);
  assert.match(server, /CREATE TABLE IF NOT EXISTS users/);
  assert.match(server, /DEFAULT_PASSWORD = '123456'/);
  assert.doesNotMatch(settings, /\['APP_(?:USERNAME|PASSWORD)'/);
});

test('login failures keep the server error instead of reporting an expired session', () => {
  const api = read('js/api.js');
  assert.match(api, /isLoginRequest/);
  assert.match(api, /payload\?\.error/);
  assert.match(api, /if \(!isLoginRequest\) handleUnauthorized\(\)/);
});

test('refreshing an authenticated login route enters dashboard and password fields stay empty', () => {
  const html = read('index.html');
  const app = read('js/app.js');
  const account = read('js/account.js');
  assert.match(app, /hashPage === 'login' \? 'dashboard'/);
  assert.match(app, /function clearLoginPassword\(\)/);
  assert.match(html, /id="login-form"[^>]*autocomplete="off"/);
  assert.match(html, /id="loginPass"[^>]*autocomplete="new-password"[^>]*value=""/);
  assert.match(account, /id="account-current-password"[^>]*autocomplete="new-password"[^>]*value=""/);
});
