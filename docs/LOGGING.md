# 日志系统文档

本项目使用 [Pino](https://getpino.io/) 作为高性能日志库，提供结构化日志记录和监控功能。

## 🎯 特性

- **高性能**: 基于Pino的异步日志记录
- **结构化**: JSON格式日志，便于分析和监控
- **多级别**: 支持trace、debug、info、warn、error、fatal级别
- **美化输出**: 开发环境支持彩色格式化输出
- **HTTP日志**: 自动记录所有HTTP请求和响应
- **业务日志**: 专门的用户行为和业务逻辑日志
- **性能监控**: 内置性能计时器
- **数据库日志**: 数据库操作和连接状态日志

## 📝 日志级别

| 级别 | 数值 | 用途 |
|------|------|------|
| trace | 10 | 详细的调试信息 |
| debug | 20 | 调试信息 |
| info | 30 | 一般信息 |
| warn | 40 | 警告信息 |
| error | 50 | 错误信息 |
| fatal | 60 | 致命错误 |

## 🔧 配置

### 环境变量

```bash
# 日志级别 (trace|debug|info|warn|error|fatal)
LOG_LEVEL=debug

# 日志格式 (json|pretty)
LOG_FORMAT=json

# 是否启用美化输出 (开发环境推荐true)
LOG_PRETTY_PRINT=true

# 是否包含时间戳
LOG_TIMESTAMP=true

# 是否启用颜色 (开发环境推荐true)
LOG_COLORIZE=true
```

### 时间格式

默认时间格式: `yyyy-mm-dd HH:MM:ss.l`

示例: `2024-01-15 14:30:25.123`

## 📊 使用方式

### 插件注册

```typescript
import { createLoggerPlugin } from './plugins/logger';

const server = new H3();

// 注册日志插件 (最先注册)
server.register(createLoggerPlugin({
  level: 'debug',
  prettyPrint: true,
  timestamp: true,
  colorize: true,
}));
```

### 基础日志

```typescript
import { log } from '../plugins/logger';

// 基础日志记录
log.info('用户登录成功');
log.warn('数据库连接缓慢');
log.error('API调用失败');

// 带上下文的日志
log.info('处理用户请求', { userId: '123', action: 'login' });
```

### HTTP日志

HTTP日志插件会自动记录所有请求：

```typescript
// 自动记录的信息包括:
// - 请求时间戳
// - 请求类型标识
// - 响应时间（通过性能监控）
// - 错误信息（如果有）
```

### 业务日志

```typescript
import { bizLog } from '../plugins/logger';

// 用户行为日志
bizLog.userAction('user123', 'login', { method: 'email' });
bizLog.userAction('user123', 'purchase', { productId: 'prod456', amount: 99.99 });

// API调用日志
bizLog.apiCall('/api/users', 'GET', 'user123', 150);

// 业务错误日志
bizLog.error(new Error('支付失败'), { userId: 'user123', orderId: 'order456' });
```

### 数据库日志

```typescript
import { dbLog } from '../plugins/logger';

// 查询日志
dbLog.query('SELECT * FROM users WHERE id = $1', ['123'], 25);

// 连接状态日志
dbLog.connection('connected', { host: 'localhost', port: 5432 });

// 数据库错误日志
dbLog.error(new Error('连接超时'), 'SELECT * FROM users', ['123']);
```

### 性能监控

```typescript
import { perfLog } from '../plugins/logger';

// 方式1: 手动计时
const timer = perfLog.start('user_creation');
// ... 执行业务逻辑
timer.end({ userId: 'user123', success: true });

// 方式2: 自动计时
await perfLog.measure('database_query', async () => {
  return await db.select().from(users);
});
```

## 📋 日志格式示例

### 开发环境 (Pretty Print)

```
[14:30:25.123] INFO: 🚀 Starting H3 server application...
[14:30:25.125] INFO: 📊 Environment: development
[14:30:25.126] INFO: 🌐 Server: 0.0.0.0:3000
[14:30:25.150] INFO: ✅ Database connection successful
[14:30:25.151] INFO: ✅ Server started successfully on 0.0.0.0:3000
[14:30:30.234] INFO: GET /health - 200 (25ms)
```

### 生产环境 (JSON)

```json
{
  "level": 30,
  "time": "2024-01-15T14:30:25.123Z",
  "msg": "🚀 Starting H3 server application..."
}
{
  "level": 30,
  "time": "2024-01-15T14:30:30.234Z",
  "request": {
    "method": "GET",
    "url": "/health",
    "headers": {
      "host": "localhost:3000",
      "user-agent": "curl/7.68.0"
    },
    "remoteAddress": "127.0.0.1"
  },
  "response": {
    "statusCode": 200,
    "headers": {
      "content-type": "application/json"
    }
  },
  "duration": 25,
  "msg": "GET /health - 200"
}
```

## 🔍 日志分析

### 查看实时日志

```bash
# 开发环境 (美化输出)
cd server
bun run dev

# 生产环境 (JSON输出)
cd server
bun run start
```

### 日志过滤

```bash
# 只显示错误日志
bun run dev | grep '"level":50'

# 只显示特定用户的日志
bun run dev | grep '"userId":"user123"'

# 只显示数据库相关日志
bun run dev | grep '"type":"database"'
```

## 📈 监控和告警

### 关键指标

- **错误率**: error和fatal级别日志的比例
- **响应时间**: HTTP请求的平均响应时间
- **数据库性能**: 数据库查询的平均执行时间
- **用户活动**: 用户登录、注册等关键行为

### 告警建议

- 错误率超过5%时告警
- 平均响应时间超过1秒时告警
- 数据库查询时间超过500ms时告警
- 出现fatal级别日志时立即告警

## 🛠️ 最佳实践

### 1. 日志级别使用

- **trace**: 仅在深度调试时使用
- **debug**: 开发和测试环境的详细信息
- **info**: 正常的业务流程信息
- **warn**: 需要注意但不影响功能的问题
- **error**: 影响功能的错误
- **fatal**: 导致应用崩溃的严重错误

### 2. 结构化日志

```typescript
// ✅ 好的做法
log.info('用户登录', { 
  userId: 'user123', 
  email: 'user@example.com',
  loginMethod: 'email',
  timestamp: new Date().toISOString()
});

// ❌ 避免的做法
log.info(`用户 user123 通过邮箱 user@example.com 登录成功`);
```

### 3. 敏感信息处理

```typescript
// ✅ 自动脱敏
log.info('用户登录', { 
  userId: 'user123',
  email: 'user@example.com',
  // 密码等敏感信息会被自动脱敏
});
```

### 4. 错误日志

```typescript
// ✅ 包含完整上下文
try {
  await someOperation();
} catch (error) {
  bizLog.error(error, {
    operation: 'user_creation',
    userId: 'user123',
    timestamp: new Date().toISOString()
  });
  throw error;
}
```

## 🔧 自定义配置

如需自定义日志配置，可以修改 `src/plugins/logger.ts` 文件中的配置选项。

## 📚 相关链接

- [Pino 官方文档](https://getpino.io/)
- [Pino Pretty 文档](https://github.com/pinojs/pino-pretty)
- [Pino HTTP 文档](https://github.com/pinojs/pino-http)
