# H3 Pino日志插件使用示例

本文档展示如何在H3应用中使用Pino日志插件。

## 🔧 插件注册

### 基本注册

```typescript
import { H3 } from 'h3';
import { createLoggerPlugin } from './plugins/logger';

const server = new H3();

// 注册日志插件
server.register(createLoggerPlugin());
```

### 自定义配置注册

```typescript
import { H3 } from 'h3';
import { createLoggerPlugin } from './plugins/logger';

const server = new H3();

// 注册带配置的日志插件
server.register(createLoggerPlugin({
  level: 'debug',           // 日志级别
  prettyPrint: true,        // 美化输出
  timestamp: true,          // 包含时间戳
  colorize: true,           // 彩色输出
  translateTime: 'yyyy-mm-dd HH:MM:ss.l', // 时间格式
}));
```

## 📝 在路由中使用日志

### 基础使用

```typescript
import { defineEventHandler } from 'h3';
import { log, bizLog, perfLog } from '../plugins/logger';

export default defineEventHandler(async (event) => {
  // 基础日志
  log.info('处理用户请求');
  
  try {
    // 业务逻辑
    const result = await someBusinessLogic();
    
    // 成功日志
    log.info('请求处理成功', { result });
    
    return { success: true, data: result };
  } catch (error) {
    // 错误日志
    log.error('请求处理失败', error);
    throw error;
  }
});
```

### 业务日志使用

```typescript
import { defineEventHandler } from 'h3';
import { bizLog } from '../plugins/logger';

export default defineEventHandler(async (event) => {
  const userId = 'user123';
  
  // 记录用户行为
  bizLog.userAction(userId, 'login_attempt', {
    ip: event.context.clientIP,
    userAgent: event.context.userAgent,
  });
  
  try {
    const user = await authenticateUser(credentials);
    
    // 记录成功登录
    bizLog.userAction(userId, 'login_success', {
      method: 'email',
      timestamp: new Date().toISOString(),
    });
    
    return { success: true, user };
  } catch (error) {
    // 记录登录失败
    bizLog.error(error, {
      userId,
      action: 'login',
      ip: event.context.clientIP,
    });
    
    throw error;
  }
});
```

### 性能监控使用

```typescript
import { defineEventHandler } from 'h3';
import { perfLog } from '../plugins/logger';

export default defineEventHandler(async (event) => {
  // 方式1: 手动计时
  const timer = perfLog.start('user_data_fetch');
  
  try {
    const userData = await fetchUserData();
    
    // 记录成功完成
    timer.end({ 
      success: true, 
      recordCount: userData.length 
    });
    
    return userData;
  } catch (error) {
    // 记录失败
    timer.end({ 
      success: false, 
      error: error.message 
    });
    
    throw error;
  }
});

// 方式2: 自动计时
export const autoTimedHandler = defineEventHandler(async (event) => {
  return await perfLog.measure('database_query', async () => {
    return await db.select().from(users);
  });
});
```

### 数据库操作日志

```typescript
import { defineEventHandler } from 'h3';
import { dbLog } from '../plugins/logger';

export default defineEventHandler(async (event) => {
  try {
    // 记录查询开始
    const startTime = Date.now();
    const sql = 'SELECT * FROM users WHERE id = $1';
    const params = ['123'];
    
    const result = await db.query(sql, params);
    
    // 记录查询成功
    const duration = Date.now() - startTime;
    dbLog.query(sql, params, duration);
    
    return result;
  } catch (error) {
    // 记录查询失败
    dbLog.error(error, sql, params);
    throw error;
  }
});
```

## 🎯 事件上下文中的日志

插件会自动将logger实例添加到事件上下文中：

```typescript
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  // 从事件上下文获取logger
  const logger = event.context.logger;
  
  logger.info('使用上下文中的logger');
  
  // 记录请求开始时间（插件自动设置）
  const requestStartTime = event.context.requestStartTime;
  const duration = Date.now() - requestStartTime;
  
  logger.info('请求处理耗时', { duration });
});
```

## 🔍 日志输出示例

### 开发环境输出

```
[2025-07-09 09:40:46.481] INFO: 🚀 Starting H3 server application...
[2025-07-09 09:40:46.490] INFO: ✅ Server started successfully on 0.0.0.0:3000
[2025-07-09 09:41:28.506] INFO: Operation completed: health_check (32ms)
    type: "performance"
    operation: "health_check"
    duration: 32
    status: "success"
```

### 生产环境输出

```json
{
  "level": 30,
  "time": "2025-07-09T09:40:46.481Z",
  "msg": "🚀 Starting H3 server application..."
}
{
  "level": 30,
  "time": "2025-07-09T09:41:28.506Z",
  "type": "performance",
  "operation": "health_check",
  "duration": 32,
  "status": "success",
  "msg": "Operation completed: health_check (32ms)"
}
```

## 🛠️ 最佳实践

### 1. 插件注册顺序

```typescript
const server = new H3();

// 1. 首先注册日志插件
server.register(createLoggerPlugin());

// 2. 然后注册其他插件
server.register(corsPlugin());
server.register(authPlugin());

// 3. 最后注册路由
server.mount('/api', apiRoutes);
```

### 2. 结构化日志

```typescript
// ✅ 好的做法
log.info('用户操作', {
  userId: 'user123',
  action: 'create_post',
  postId: 'post456',
  timestamp: new Date().toISOString(),
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
});

// ❌ 避免的做法
log.info(`用户 user123 创建了帖子 post456`);
```

### 3. 错误处理

```typescript
try {
  await riskyOperation();
} catch (error) {
  // 记录完整的错误上下文
  bizLog.error(error, {
    operation: 'user_registration',
    userId: 'user123',
    step: 'email_verification',
    timestamp: new Date().toISOString(),
    additionalData: { /* 相关数据 */ }
  });
  
  throw error; // 重新抛出错误
}
```

### 4. 性能监控

```typescript
// 监控关键业务操作
const timer = perfLog.start('critical_operation');

try {
  const result = await criticalBusinessLogic();
  timer.end({ success: true, resultSize: result.length });
  return result;
} catch (error) {
  timer.end({ success: false, error: error.message });
  throw error;
}
```

## 📚 相关文档

- [日志系统完整文档](./LOGGING.md)
- [API文档](./API_DOCUMENTATION.md)
- [Pino官方文档](https://getpino.io/)
