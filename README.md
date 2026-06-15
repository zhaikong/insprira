# 灵感熔炉

基于 [RedFox API](https://redfox.mousequake.cn/) 的本地自媒体工作台。单文件 Node.js 后端 + 原生 JS 前端，SQLite 本地优先存储，覆盖热榜、选题、搜索、账号追踪、知识库、跨平台内容重构。

## 功能

- **热榜与趋势**：全网热点、抖音 / 小红书 / 公众号热榜，AI 公众号 / AI B站 / AI 小红书昨日榜；7/14 天增长、稳定、冷却趋势
- **选题生成**：基于本地热榜证据 + 公众号爆款搜索，调用 OpenAI 兼容 LLM 生成有数据依据的选题
- **账号追踪**：分组订阅、作品同步、公众号官方诊断 Skill
- **知识库**：Obsidian Vault 与 Notion 双源接入，Markdown / JSON 导出
- **内容重构**：多平台改写、RedFox `gpt-image-2` 封面生成、违禁词检测
- **本地 Agent**：Codex / Claude Code / Kimi / OpenClaw / Hermes 子进程集成
- **Skill 中心**：从 [redfox-community](https://github.com/redfox-community/skills) 拉取并热更新
- **CRON 调度**：内置每日热榜快照、缓存清理、配额清理任务，支持自定义

`skills/` 目录已加入 `.gitignore`，不随仓库分发，首次启动后从社区仓库拉取。

## 启动

要求 Node.js ≥ 20。

```bash
cd insprira
npm install
cp .env.example .env
# 编辑 .env，至少填写 REDFOX_API_KEY 和 KB_ENCRYPTION_KEY
npm start
```

浏览器访问 [http://127.0.0.1:8080](http://127.0.0.1:8080)。

首次启动会在 SQLite 中创建默认账号 `admin / 123456`，登录后请立即在左下角"账户与安全"中修改密码。密码使用 scrypt 加盐哈希保存，登录会话使用 HttpOnly Cookie；修改密码会注销该账号的其他会话。

## 配置

所有字段和默认值见 [`.env.example`](.env.example)。

必填项：

- `REDFOX_API_KEY` — RedFox 平台 API Key
- `LLM_API_KEY` — OpenAI 兼容 LLM 服务的 Key（用于选题生成、热点分析）
- `KB_ENCRYPTION_KEY` — 知识库凭证加密密钥，用 `openssl rand -hex 32` 生成，配置后请勿修改

服务默认仅监听本机。容器部署时可将 `HOST` 改为 `0.0.0.0`，并在外层增加 HTTPS。

## 数据

运行数据保存在 `cache.db`（SQLite，WAL 模式），可通过 `CACHE_DB_PATH` 指定其他路径。

主要表：

| 表 | 用途 |
|---|---|
| `api_cache` | RedFox 响应缓存，按端点独立 TTL |
| `api_usage` | API 调用日志（90 天后自动清理） |
| `action_logs` | 用户操作审计 |
| `hot_snapshots` | 每日热榜快照 |
| `hot_batches` / `hot_batch_items` | 实时热榜批次与条目 |
| `hot_daily_keywords` | 每日全网关键词 |
| `inspirations` | 选题库 |
| `inspiration_keyword_configs` / `inspiration_keyword_terms` | 自动选题配置与关键词 |
| `inspiration_runs` / `inspiration_feedback` | 选题生成记录与反馈 |
| `tracked_accounts` / `account_works` / `account_snapshots` | 账号订阅、作品、趋势快照 |
| `local_data` | 通用本地优先数据缓存 |
| `kb_config` / `kb_entries_cache` | 知识库配置与条目缓存 |
| `crontab` | 定时任务（内置任务不可删除） |
| `users` / `sessions` | 本地账号与会话 |

## 验证

```bash
npm run check   # server.js 语法检查
npm test        # 内置回归测试（密码哈希、选题去重、前端结构）
```

## 安全

- 密码使用 scrypt 加盐哈希，会话使用 HttpOnly Cookie
- `.env` 中的密钥仅保存在服务端，不会返回浏览器
- RedFox API 代理仅放行白名单端点
- 图片代理仅允许白名单域名

## License

[AGPL-3.0](LICENSE)
