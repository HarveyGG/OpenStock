# Redis + BullMQ 队列系统

项目已从 Inngest 迁移到 Redis + BullMQ，实现完全本地化的任务队列系统。

## 架构

- **Redis**: 作为消息队列的存储后端
- **BullMQ**: 任务队列管理
- **Workers**: 处理欢迎邮件和新闻邮件任务
- **Cron**: 每天中午 12:00 (UTC) 自动触发新闻邮件任务

## Docker 服务

启动 Docker Compose 后会自动启动：
1. **Next.js 应用** (端口 3003)
2. **MongoDB** (端口 27018)
3. **Redis** (端口 6379)
4. **BullMQ Workers** (后台运行)
5. **Cron 调度器** (后台运行)

## 环境变量

确保 `.env` 文件中包含：

```env
REDIS_URL=redis://redis:6379
MONGODB_URI=mongodb://root:example@mongodb:27017/openstock?authSource=admin
# AI Provider (可选)
AI_PROVIDER=auto
GEMINI_API_KEY=你的_gemini_api_key
OPENAI_API_KEY=你的_openai_api_key
NODEMAILER_EMAIL=你的邮箱
GOOGLE_CLIENT_ID=你的_google_client_id
GOOGLE_CLIENT_SECRET=你的_google_client_secret
GOOGLE_REFRESH_TOKEN=你的_refresh_token
```

## 功能

### 1. 欢迎邮件

用户注册时自动发送个性化欢迎邮件：
- 使用 Gemini AI 生成个性化内容
- 通过 BullMQ 队列异步处理
- 支持 OAuth 2.0 发送

### 2. 每日新闻邮件

每天中午 12:00 (UTC) 自动发送：
- 获取所有用户的关注列表
- 为每个用户生成个性化新闻摘要
- 使用 Gemini AI 总结新闻内容
- 批量发送邮件

## 手动触发新闻邮件

如果需要手动触发新闻邮件（用于测试），可以运行：

```bash
docker compose exec openstock node -e "
const { newsEmailQueue } = require('./lib/queue/client.ts');
newsEmailQueue.add('send-daily-news', {}).then(() => {
  console.log('News email job queued');
  process.exit(0);
});
"
```

或者创建一个测试脚本：

```javascript
// scripts/trigger-news-email.mjs
import 'dotenv/config';
import { newsEmailQueue } from '../lib/queue/client.js';

await newsEmailQueue.add('send-daily-news', {});
console.log('✅ News email job queued');
process.exit(0);
```

## 监控

### 查看队列状态

```bash
# 进入容器
docker compose exec openstock sh

# 使用 Redis CLI 查看队列
redis-cli -h redis
> KEYS bull:*
> LLEN bull:welcome-email:waiting
> LLEN bull:news-email:waiting
```

### 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 只查看应用日志
docker compose logs -f openstock
```

## 优势

- ✅ **零成本**: 完全本地化，无需外部服务
- ✅ **简单**: 只需启动 Docker Compose
- ✅ **可靠**: Redis 持久化，任务不丢失
- ✅ **可扩展**: 可以轻松添加更多 worker
- ✅ **易调试**: 可以直接查看 Redis 中的队列状态

