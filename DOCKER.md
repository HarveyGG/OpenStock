# Docker 启动指南

## 快速启动

### 1. 准备环境变量

确保 `.env` 文件中包含以下配置（用于 Docker 环境）：

```env
# Core
NODE_ENV=production

# Database (Docker 内部网络)
MONGODB_URI=mongodb://root:example@mongodb:27017/openstock?authSource=admin

# Better Auth
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Finnhub (必需)
FINNHUB_API_KEY=your_finnhub_key
FINNHUB_BASE_URL=https://finnhub.io/api/v1

# AI (Gemini for email personalization)
GEMINI_API_KEY=your_gemini_api_key

# Redis (automatically configured in Docker)
REDIS_URL=redis://redis:6379

# Email (Gmail OAuth 2.0 - recommended)
NODEMAILER_EMAIL=youraddress@gmail.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token

# Or use App Password (legacy)
# NODEMAILER_PASSWORD=your_gmail_app_password
```

**重要**：Docker 环境中的 `MONGODB_URI` 必须使用 `mongodb` 作为主机名（不是 `localhost`），因为这是 Docker 网络中的服务名。

### 2. 启动服务

#### 方式一：使用 Docker Compose（推荐）

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 停止并删除数据卷（谨慎使用）
docker compose down -v
```

#### 方式二：使用 Docker Desktop

1. 打开 Docker Desktop
2. 在左侧菜单找到 "Compose"
3. 点击 "Open" 或 "Add"，选择项目目录
4. 点击 "Start" 启动服务

### 3. 访问应用

- **应用地址**：http://localhost:3000
- **MongoDB**：localhost:27017（仅在 Docker 网络内使用 `mongodb:27017`）

## 服务说明

### openstock-app
- **容器名**：`openstock-app`
- **端口**：3000
- **健康检查**：http://localhost:3000/api/health
- **自动重启**：是

### openstock-mongodb
- **容器名**：`openstock-mongodb`
- **端口**：27018 (host) -> 27017 (container)
- **数据持久化**：`mongo-data` 卷
- **自动重启**：是
- **认证**：root / example

### openstock-redis
- **容器名**：`openstock-redis`
- **端口**：6379
- **数据持久化**：`redis-data` 卷
- **自动重启**：是
- **用途**：BullMQ 任务队列存储

## 常用命令

```bash
# 查看运行状态
docker compose ps

# 查看应用日志
docker compose logs openstock

# 查看 MongoDB 日志
docker compose logs mongodb

# 重启服务
docker compose restart

# 进入容器
docker compose exec openstock sh
docker compose exec mongodb mongosh -u root -p example

# 查看 Redis 队列状态
docker compose exec redis redis-cli KEYS "bull:*"

# 备份数据
docker compose exec mongodb mongodump --out /data/backup

# 清理（停止并删除容器、网络）
docker compose down
```

## 故障排查

### 应用无法启动
1. 检查 `.env` 文件是否存在且配置正确
2. 查看日志：`docker compose logs openstock`
3. 确认 MongoDB 已启动：`docker compose ps`

### MongoDB 连接失败
1. 确认 `MONGODB_URI` 使用 `mongodb` 作为主机名（不是 `localhost`）
2. 检查 MongoDB 健康状态：`docker compose ps`
3. 查看 MongoDB 日志：`docker compose logs mongodb`

### 端口冲突
如果 3000 或 27017 端口被占用，可以修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "3001:3000"  # 将 3001 映射到容器的 3000
```

## 数据持久化

MongoDB 数据存储在 Docker 卷 `mongo-data` 中，即使删除容器，数据也会保留。

要完全删除数据：
```bash
docker compose down -v
```

