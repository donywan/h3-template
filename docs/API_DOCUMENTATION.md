# API 文档

本文档描述了H3服务器的API接口，包括用户认证和微信登录功能。

## 🌐 基础信息

- **基础URL**: `http://localhost:3000`
- **内容类型**: `application/json`
- **字符编码**: `UTF-8`

## 📊 通用响应格式

所有API响应都遵循以下格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

错误响应：
```json
{
  "success": false,
  "message": "错误信息"
}
```

## 🔐 用户认证 API

### 1. 邮箱密码登录

**POST** `/app/user/login/email`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "avatar": "头像URL",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "访问令牌",
    "refreshToken": "刷新令牌"
  }
}
```

### 2. 手机密码登录

**POST** `/app/user/login/phone`

```json
{
  "phone": "13800138000",
  "password": "password123"
}
```

### 3. 微信授权登录

**POST** `/app/user/login/wechat`

```json
{
  "code": "微信授权码",
  "state": "状态参数(可选)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "微信登录成功",
  "data": {
    "user": {
      "id": "uuid",
      "wechatOpenid": "微信openid",
      "wechatNickname": "微信昵称",
      "wechatAvatar": "微信头像",
      "nickname": "用户昵称",
      "avatar": "头像URL"
    },
    "accessToken": "访问令牌",
    "refreshToken": "刷新令牌"
  }
}
```

### 4. 邮箱注册

**POST** `/app/user/register/email`

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名(可选)"
}
```

### 5. 手机注册

**POST** `/app/user/register/phone`

```json
{
  "phone": "13800138000",
  "password": "password123",
  "name": "用户名(可选)"
}
```

### 6. 获取用户信息

**GET** `/app/user/profile`

**响应**:
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": "uuid",
    "name": "用户名",
    "avatar": "头像URL"
  }
}
```

### 7. 退出登录

**POST** `/app/user/logout`

## 👨‍💼 管理员 API

### 1. 获取用户列表

**GET** `/admin/user/`

### 2. 获取用户详情

**GET** `/admin/user/:id`

### 3. 创建用户

**POST** `/admin/user/`

```json
{
  "email": "user@example.com",
  "name": "用户名",
  "passwordHash": "哈希密码"
}
```

### 4. 更新用户

**PUT** `/admin/user/:id`

```json
{
  "name": "新用户名",
  "isActive": true
}
```

### 5. 删除用户

**DELETE** `/admin/user/:id`

## 🏥 系统健康检查

### 健康检查

**GET** `/health`

**响应**:
```json
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "host": "localhost",
    "port": 5432,
    "database": "h3_dev_db",
    "health": {
      "status": "healthy",
      "latency": 10
    }
  },
  "version": "1.0.0"
}
```

## 🗄️ 数据库表结构

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| email | varchar(255) | 邮箱 (唯一) |
| phone | varchar(20) | 手机号 (唯一) |
| name | varchar(255) | 用户名 |
| nickname | varchar(255) | 昵称 |
| avatar | text | 头像URL |
| password_hash | varchar(255) | 密码哈希 |
| wechat_openid | varchar(255) | 微信openid (唯一) |
| wechat_unionid | varchar(255) | 微信unionid (唯一) |
| wechat_nickname | varchar(255) | 微信昵称 |
| wechat_avatar | text | 微信头像 |
| wechat_gender | varchar(10) | 微信性别 |
| wechat_city | varchar(100) | 微信城市 |
| wechat_province | varchar(100) | 微信省份 |
| wechat_country | varchar(100) | 微信国家 |
| access_token | text | 访问令牌 |
| refresh_token | text | 刷新令牌 |
| token_expires_at | timestamp | 令牌过期时间 |
| is_active | boolean | 是否激活 |
| is_email_verified | boolean | 邮箱是否验证 |
| is_phone_verified | boolean | 手机是否验证 |
| last_login_at | timestamp | 最后登录时间 |
| last_login_ip | varchar(45) | 最后登录IP |
| login_count | varchar(10) | 登录次数 |
| profile | jsonb | 扩展信息 |
| preferences | jsonb | 用户偏好 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

## 🔧 开发指南

### 启动开发服务器

```bash
bun run dev
```

### 生成数据库迁移

```bash
bun run drizzle-kit generate
```

### 执行数据库迁移

```bash
bun run drizzle-kit migrate
```

### 启动数据库管理界面

```bash
bun run drizzle-kit studio
```

## 🐛 错误代码

| 错误信息 | 说明 |
|----------|------|
| "邮箱和密码不能为空" | 登录参数缺失 |
| "邮箱或密码错误" | 登录凭据无效 |
| "邮箱已被注册" | 注册时邮箱已存在 |
| "手机号已被注册" | 注册时手机号已存在 |
| "用户不存在" | 查询的用户不存在 |
| "微信登录失败" | 微信授权过程出错 |

## 📊 日志系统

项目集成了 [Pino](https://getpino.io/) 高性能日志系统：

### 日志特性
- **结构化日志**: JSON格式，便于分析
- **多级别**: trace、debug、info、warn、error、fatal
- **HTTP日志**: 自动记录所有请求和响应
- **性能监控**: 内置请求耗时统计
- **美化输出**: 开发环境彩色格式化

### 日志配置
```bash
LOG_LEVEL=debug          # 日志级别
LOG_PRETTY_PRINT=true    # 美化输出
LOG_TIMESTAMP=true       # 时间戳
LOG_COLORIZE=true        # 颜色输出
```

### 日志示例
```
[2025-07-09 08:52:47.457] INFO: Operation completed: health_check (30ms)
    type: "performance"
    operation: "health_check"
    duration: 30
    status: "success"
```

详细文档请参考: [日志系统文档](./LOGGING.md)

## 📝 注意事项

1. **安全性**: 生产环境请使用HTTPS
2. **令牌**: 访问令牌有效期为7天
3. **微信登录**: 当前使用模拟数据，需要集成真实的微信API
4. **数据库**: 需要先启动PostgreSQL数据库服务
5. **CORS**: 开发环境允许所有来源，生产环境需要配置
6. **日志**: 敏感信息会自动脱敏，生产环境建议使用JSON格式
