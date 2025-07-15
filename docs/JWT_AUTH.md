# JWT鉴权系统文档

本文档介绍H3应用中基于 **jose** 库的JWT鉴权系统实现。

## 🎯 **系统概述**

JWT鉴权系统提供了完整的用户认证和授权功能，包括：

- 基于 jose 库的现代化 JWT token生成和验证
- 异步优先的API设计
- 自动API接口鉴权
- 灵活的路径排除配置
- 角色和权限管理
- Token刷新机制
- 完全的 TypeScript 类型安全

## 🔧 **配置说明**

### 环境变量配置

```bash
# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production-must-be-at-least-32-characters
JWT_ACCESS_EXPIRY=15m          # 访问令牌过期时间
JWT_REFRESH_EXPIRY=7d          # 刷新令牌过期时间
JWT_ISSUER=h3-server           # 令牌发行者
JWT_AUDIENCE=h3-client         # 令牌受众
```

### 鉴权中间件配置

```typescript
server.use('/', createAuthMiddleware({
  excludePaths: [
    '/health',
    '/db/status',
    '/app/user/login/email',
    '/app/user/login/phone', 
    '/app/user/login/wechat',
    '/app/user/register/email',
    '/app/user/register/phone',
    '/app/user/refresh-token',
  ],
  optionalPaths: [
    '/app/user/profile', // 可选鉴权
  ],
  apiKeyPaths: [
    '/admin/system', // API密钥鉴权
  ],
}));
```

## 📊 **API接口说明**

### 1. 用户登录 (邮箱)

```bash
POST /app/user/login/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "用户名"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

### 2. 用户登录 (手机)

```bash
POST /app/user/login/phone
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "password123"
}
```

### 3. 微信登录

```bash
POST /app/user/login/wechat
Content-Type: application/json

{
  "code": "wechat_auth_code",
  "userInfo": {
    "nickName": "微信用户",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

### 4. 获取用户信息 (需要鉴权)

```bash
GET /app/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应:**
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "用户名",
    "createdAt": "2025-07-09T10:30:00.000Z"
  }
}
```

### 5. 刷新访问令牌

```bash
POST /app/user/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应:**
```json
{
  "success": true,
  "message": "令牌刷新成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 6. 退出登录

```bash
POST /app/user/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔐 **鉴权机制**

### 1. 路径分类

#### **排除鉴权路径 (excludePaths)**
- 完全跳过鉴权检查
- 适用于登录、注册、健康检查等公开接口

#### **可选鉴权路径 (optionalPaths)**
- 有token则验证，无token则跳过
- 适用于可以匿名访问但有token时提供更多信息的接口

#### **API密钥路径 (apiKeyPaths)**
- 使用API密钥而非JWT进行鉴权
- 适用于服务间通信

#### **强制鉴权路径**
- 除上述路径外的所有路径
- 必须提供有效的JWT token

### 2. Token格式

#### **请求头格式**
```
Authorization: Bearer <access_token>
```

#### **JWT载荷结构**
```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "phone": "13800138000",
  "role": "user",
  "permissions": ["user:read", "user:update"],
  "type": "access",
  "iat": 1641234567,
  "exp": 1641235467,
  "iss": "h3-server",
  "aud": "h3-client",
  "sub": "user-id"
}
```

### 3. 错误响应

#### **401 未授权**
```json
{
  "statusCode": 401,
  "statusMessage": "访问令牌缺失"
}
```

#### **401 令牌过期**
```json
{
  "statusCode": 401,
  "statusMessage": "访问令牌已过期",
  "data": { "code": "TOKEN_EXPIRED" }
}
```

#### **401 令牌无效**
```json
{
  "statusCode": 401,
  "statusMessage": "访问令牌无效",
  "data": { "code": "TOKEN_INVALID" }
}
```

#### **403 权限不足**
```json
{
  "statusCode": 403,
  "statusMessage": "权限不足",
  "data": {
    "required": ["admin:write"],
    "current": ["user:read", "user:update"]
  }
}
```

## 🛠️ **开发指南**

### 1. 在路由中获取用户信息

```typescript
import { getCurrentUser, isAuthenticated } from '../middleware/auth';

export default defineEventHandler(async (event) => {
  // 检查是否已认证
  if (!isAuthenticated(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: '需要登录'
    });
  }

  // 获取当前用户信息
  const user = getCurrentUser(event);
  console.log('当前用户:', user?.userId);
});
```

### 2. 权限检查

```typescript
import { requirePermissions, requireRole } from '../middleware/auth';

// 需要特定权限
export default defineEventHandler(async (event) => {
  await requirePermissions(['user:write'])(event);
  // 业务逻辑
});

// 需要特定角色
export default defineEventHandler(async (event) => {
  await requireRole('admin')(event);
  // 业务逻辑
});
```

### 3. 自定义鉴权配置

```typescript
// 创建自定义鉴权中间件
const customAuthMiddleware = createAuthMiddleware({
  excludePaths: ['/custom/public'],
  rolePermissions: {
    'admin': ['*'],
    'moderator': ['user:read', 'user:write', 'post:moderate'],
    'user': ['user:read', 'user:update'],
  },
});

server.use('/api', customAuthMiddleware);
```

### 4. 异步操作

```typescript
// 所有 JWT 操作都是异步的 (使用 jose 库)
const tokens = await JWTUtils.generateTokenPair(payload);
const verifyResult = await JWTUtils.verifyAccessToken(token);
const refreshResult = await JWTUtils.refreshAccessToken(refreshToken);
```

## 🔍 **安全最佳实践**

### 1. JWT密钥管理
- 使用强随机密钥 (至少32字符)
- 生产环境中定期轮换密钥
- 不要在代码中硬编码密钥

### 2. Token过期时间
- 访问令牌: 15分钟 (短期)
- 刷新令牌: 7天 (长期)
- 根据安全需求调整

### 3. HTTPS传输
- 生产环境必须使用HTTPS
- 防止token在传输过程中被截获

### 4. Token存储
- 客户端安全存储token
- 避免在localStorage中存储敏感token
- 考虑使用httpOnly cookie

### 5. jose 库优势
- 使用 Web Crypto API，性能更好
- 完全符合 JOSE 标准
- 原生 TypeScript 支持
- 异步操作，不阻塞事件循环

## 📚 **相关文档**

- [用户服务文档](./USER_SERVICE.md)
- [API文档](./API_DOCUMENTATION.md)
- [日志系统文档](./LOGGING.md)
