# Gmail OAuth 2.0 设置指南

## 为什么使用 OAuth 2.0？

- ✅ 更安全：不需要应用专用密码
- ✅ Google 推荐：符合现代安全标准
- ✅ 更好的控制：可以撤销访问权限
- ✅ 自动刷新：token 自动更新

## 设置步骤

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击项目选择器，创建新项目或选择现有项目
3. 项目名称：`OpenStock`（或你喜欢的名字）

### 2. 启用 Gmail API

1. 在 Google Cloud Console 中，进入 **API 和服务** → **库**
2. 搜索 "Gmail API"
3. 点击 **启用**

### 3. 配置 OAuth 同意屏幕

1. 进入 **API 和服务** → **OAuth 同意屏幕**
2. 用户类型：选择 **外部**（个人账号）或 **内部**（Google Workspace）
3. 填写应用信息：
   - 应用名称：`OpenStock`
   - 用户支持电子邮件：你的邮箱（`harvey@eflabs.tech`）
   - 开发者联系信息：你的邮箱
4. 点击 **保存并继续**
5. 作用域页面：
   - 点击 **添加或移除作用域**
   - 搜索并选择：`https://www.googleapis.com/auth/gmail.send`
   - 点击 **更新** → **保存并继续**
6. 测试用户页面（**重要**）：
   - 点击 **添加用户** 按钮
   - 输入你的 Gmail 地址：`harvey@eflabs.tech`
   - 点击 **添加**
   - 可以添加多个测试用户（最多 100 个）
7. 点击 **保存并继续** → **返回到信息中心**

**⚠️ 重要提示**：在应用发布之前，只有添加到测试用户列表的账号才能使用 OAuth 授权。

### 4. 创建 OAuth 2.0 凭据

1. 进入 **API 和服务** → **凭据**
2. 点击 **创建凭据** → **OAuth 客户端 ID**
3. 应用类型：选择 **Web 应用**
4. 名称：`OpenStock Email`
5. 已授权的重定向 URI：
   - 添加：`https://developers.google.com/oauthplayground`
6. 点击 **创建**
7. 复制 **客户端 ID** 和 **客户端密钥**

### 5. 获取 Refresh Token

1. 访问 [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. 点击右上角 ⚙️ **设置**
3. 勾选 **Use your own OAuth credentials**
4. 输入你的 **OAuth Client ID** 和 **OAuth Client secret**
5. 点击 **Close**
6. 在左侧找到 **Gmail API v1**
7. 勾选 `https://mail.google.com/`
8. 点击 **Authorize APIs**
9. 登录并授权
10. 点击 **Exchange authorization code for tokens**
11. 复制 **Refresh token**

### 6. 配置环境变量

在 `.env` 文件中添加：

```env
# Gmail OAuth 2.0 (推荐方式)
GOOGLE_CLIENT_ID=你的客户端ID
GOOGLE_CLIENT_SECRET=你的客户端密钥
GOOGLE_REFRESH_TOKEN=你的刷新令牌

# 邮箱地址（发送邮件的邮箱）
NODEMAILER_EMAIL=harvey@eflabs.tech

# 如果不想使用 OAuth 2.0，可以继续使用应用专用密码
# NODEMAILER_PASSWORD=你的应用专用密码
```

## 配置说明

代码会自动检测配置：
- 如果设置了 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET` 和 `GOOGLE_REFRESH_TOKEN`，使用 OAuth 2.0
- 否则，回退到应用专用密码方式（`NODEMAILER_PASSWORD`）

## 测试

配置完成后，注册一个新用户，应该会收到欢迎邮件。

## 故障排查

### 错误：invalid_grant
- Refresh token 可能已过期
- 重新获取 refresh token

### 错误：access_denied / Access blocked
**最常见原因：未添加测试用户**

解决步骤：
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目
3. 进入 **API 和服务** → **OAuth 同意屏幕**
4. 滚动到 **测试用户** 部分
5. 点击 **添加用户**
6. 输入你的 Gmail 地址（`harvey@eflabs.tech`）
7. 点击 **添加**
8. 等待几秒钟，然后重新尝试授权

**注意**：
- 测试用户列表最多 100 个用户
- 只有测试用户列表中的账号才能授权
- 如果应用发布后，所有用户都可以使用（但需要 Google 验证）

### 错误：insufficient_permission
- 确认已启用 Gmail API
- 确认作用域包含 `https://www.googleapis.com/auth/gmail.send`

## 安全提示

- ✅ 不要将凭据提交到 Git
- ✅ 使用环境变量存储敏感信息
- ✅ 定期轮换 refresh token
- ✅ 在生产环境使用服务账号（如果可能）

