# 环境配置指南

本文档详细说明了如何为不同环境配置H3服务器。

## 🌍 支持的环境

项目支持三种环境，每种环境都有独立的配置和数据库：

| 环境 | 端口 | 数据库端口 | Redis端口 | 描述 |
|------|------|------------|-----------|------|
| **开发环境** | 3000 | 5432 | 6379 | 本地开发，详细日志，宽松安全设置 |
| **测试环境** | 3001 | 5433 | 6380 | 自动化测试，独立数据库，静默日志 |
| **生产环境** | 3000 | 5432 | 6379 | 生产部署，严格安全设置，SSL支持 |

## 📁 配置文件

```
.env.development    # 开发环境配置
.env.test          # 测试环境配置
.env.production    # 生产环境配置
.env.example       # 配置模板
```

## 🔧 环境变量说明

### 核心配置

| 变量名 | 开发环境 | 测试环境 | 生产环境 | 说明 |
|--------|----------|----------|----------|------|
| `NODE_ENV` | development | test | production | 运行环境 |
| `PORT` | 3000 | 3001 | 3000 | 服务端口 |
| `HOST` | 0.0.0.0 | 127.0.0.1 | 0.0.0.0 | 绑定地址 |

### 数据库配置

| 变量名 | 开发环境 | 测试环境 | 生产环境 |
|--------|----------|----------|----------|
| `DB_HOST` | localhost | localhost | localhost |
| `DB_PORT` | 5432 | 5433 | 5432 |
| `DB_NAME` | h3_dev_db | h3_test_db | h3_prod_db |
| `DB_USER` | postgres | test_user | postgres |
| `DB_PASSWORD` | dev_password | test_password | secure_production_password |
| `DB_SSL` | false | false | true |
| `DB_MAX_CONNECTIONS` | 5 | 3 | 20 |

### 安全配置

| 变量名 | 开发环境 | 测试环境 | 生产环境 |
|--------|----------|----------|----------|
| `JWT_SECRET` | dev-super-secret... | test-jwt-secret... | CHANGE_THIS_IN_PRODUCTION |
| `JWT_EXPIRES_IN` | 7d | 1h | 24h |
| `CORS_ORIGIN` | * | localhost:3000,3001 | https://yourdomain.com |
| `RATE_LIMIT_MAX` | 1000 | 1000 | 100 |

### 日志配置

| 变量名 | 开发环境 | 测试环境 | 生产环境 |
|--------|----------|----------|----------|
| `LOG_LEVEL` | debug | error | info |
| `LOG_FORMAT` | pretty | json | json |

## 🚀 启动不同环境

### 本地启动

```bash
# 开发环境
bun run dev
# 或
NODE_ENV=development bun run src/index.ts

# 测试环境
bun run dev:test
# 或
NODE_ENV=test bun run src/index.ts

# 生产环境
bun run start
# 或
NODE_ENV=production bun run src/index.ts
```

### Docker启动

```bash
# 开发环境
bun run docker:up:dev

# 测试环境
bun run docker:up:test

# 生产环境
bun run docker:up
```

## 🗄️ 数据库管理

### 不同环境的数据库操作

```bash
# 开发环境
bun run db:migrate:dev
bun run db:studio:dev
bun run db:push:dev

# 测试环境
bun run db:migrate:test
bun run db:studio:test
bun run db:push:test

# 生产环境
bun run db:migrate:prod
bun run db:studio:prod
bun run db:push:prod
```

### 数据库初始化脚本

每个环境都有独立的初始化脚本：

- `docker/init-dev.sql` - 开发环境，包含丰富的测试数据
- `docker/init-test.sql` - 测试环境，包含测试专用数据和函数
- `docker/init.sql` - 生产环境，只包含基础结构和最少数据

## 🔒 安全注意事项

### 开发环境
- ✅ 允许所有CORS来源
- ✅ 详细的调试日志
- ✅ 宽松的速率限制
- ✅ 启用调试路由

### 测试环境
- ⚠️ 限制CORS来源
- ⚠️ 静默日志模式
- ⚠️ 独立的数据库和端口
- ⚠️ 短期JWT过期时间

### 生产环境
- 🔒 严格的CORS策略
- 🔒 启用SSL/TLS
- 🔒 强制HTTPS
- 🔒 严格的速率限制
- 🔒 禁用调试功能
- 🔒 强密码要求

## 📊 健康检查

每个环境都提供健康检查端点：

```bash
# 开发环境
curl http://localhost:3000/health

# 测试环境
curl http://127.0.0.1:3001/health

# 生产环境
curl http://localhost:3000/health
```

返回示例：
```json
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "host": "localhost",
    "port": 5432,
    "database": "h3_dev_db"
  },
  "version": "1.0.0"
}
```

## 🛠️ 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :3000
   
   # 修改端口
   export PORT=3001
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库配置
   echo $DATABASE_URL
   
   # 测试连接
   psql $DATABASE_URL
   ```

3. **环境变量未加载**
   ```bash
   # 检查环境文件
   cat .env.development
   
   # 手动设置环境
   export NODE_ENV=development
   ```

### 调试技巧

```bash
# 查看当前配置
NODE_ENV=development bun run src/index.ts

# 查看环境变量
printenv | grep -E "(NODE_ENV|DB_|PORT)"

# 测试数据库连接
bun run db:studio:dev
```

## 📝 最佳实践

1. **永远不要**在版本控制中提交包含敏感信息的 `.env` 文件
2. **使用**环境特定的配置文件而不是修改通用配置
3. **定期**更新生产环境的密钥和密码
4. **测试**每个环境的配置是否正确工作
5. **监控**生产环境的健康状态和性能指标
