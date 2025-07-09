# H3 数据库插件使用指南

本文档介绍如何使用H3数据库插件来管理PostgreSQL连接和Drizzle ORM。

## 🎯 **为什么使用数据库插件？**

### 优势对比

| 特性 | 传统方式 | 插件方式 |
|------|----------|----------|
| 生命周期管理 | 手动管理 | 自动管理 |
| 依赖注入 | 手动导入 | 自动注入 |
| 错误处理 | 分散处理 | 统一处理 |
| 健康检查 | 需要实现 | 内置支持 |
| 重连机制 | 需要实现 | 内置支持 |
| 监控集成 | 需要集成 | 自动集成 |
| 配置管理 | 分散配置 | 集中配置 |

## 🔧 **插件配置**

### 基本配置

```typescript
import { createDatabasePlugin } from './plugins/database';

server.register(createDatabasePlugin());
```

### 完整配置

```typescript
server.register(createDatabasePlugin({
  // 连接池配置 (postgres-js 不支持最小连接数)
  max: 200,              // 最大连接数
  idleTimeout: 20,       // 空闲超时(秒)
  connectTimeout: 10,    // 连接超时(秒)
  maxLifetime: 1800,     // 连接最大生命周期(秒)
  
  // SSL配置
  ssl: 'require',        // SSL模式
  
  // 调试配置
  debug: true,           // 调试模式
  logger: true,          // 启用日志
  
  // 健康检查配置
  healthCheck: {
    enabled: true,       // 启用健康检查
    interval: 30,        // 检查间隔(秒)
    timeout: 5,          // 检查超时(秒)
  },
  
  // 重连配置
  retry: {
    enabled: true,       // 启用自动重连
    maxAttempts: 3,      // 最大重试次数
    delay: 1000,         // 重试延迟(毫秒)
  },
}));
```

## 📊 **在路由中使用数据库**

### 基本使用

```typescript
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  // 从事件上下文获取数据库实例
  const db = event.context.db;
  
  // 执行查询
  const users = await db.select().from(usersTable);
  
  return { users };
});
```

### 使用数据库工具

```typescript
export default defineEventHandler(async (event) => {
  // 获取数据库状态
  const dbStatus = event.context.dbStatus;
  
  // 获取数据库工具函数
  const { healthCheck, reconnect, getStatus } = event.context.dbUtils;
  
  // 检查数据库健康状态
  if (!dbStatus.connected) {
    await reconnect();
  }
  
  // 执行健康检查
  const health = await healthCheck();
  
  return { health };
});
```

### 事务处理

```typescript
export default defineEventHandler(async (event) => {
  const db = event.context.db;
  
  // 使用事务
  return await db.transaction(async (tx) => {
    const user = await tx.insert(users).values({
      email: 'user@example.com',
      name: 'Test User',
    }).returning();
    
    await tx.insert(profiles).values({
      userId: user[0].id,
      bio: 'User bio',
    });
    
    return user[0];
  });
});
```

## 🔍 **监控和健康检查**

### 数据库状态接口

```typescript
interface DatabaseStatus {
  connected: boolean;      // 连接状态
  lastCheck: Date;        // 最后检查时间
  latency?: number;       // 延迟(毫秒)
  error?: string;         // 错误信息
  connectionCount?: number; // 连接数
  poolStatus?: any;       // 连接池状态
}
```

### 健康检查API

```bash
# 应用健康检查
GET /health

# 数据库状态检查
GET /db/status
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "health": {
      "connected": true,
      "lastCheck": "2025-07-09T09:40:46.523Z",
      "latency": 15,
      "poolStatus": {
        "maxConnections": 200,
        "idleTimeout": 20,
        "connectTimeout": 10,
        "maxLifetime": 1800
      }
    },
    "connectionString": "postgres://postgres:***@localhost:5432/h3_template"
  }
}
```

## 🛠️ **高级功能**

### 自动重连

```typescript
// 插件会自动处理连接失败和重连
// 无需手动处理，但可以监听状态变化

export default defineEventHandler(async (event) => {
  const { dbUtils } = event.context;
  
  // 手动触发重连
  if (!event.context.dbStatus.connected) {
    const reconnected = await dbUtils.reconnect();
    if (!reconnected) {
      throw new Error('数据库连接失败');
    }
  }
  
  // 继续业务逻辑
});
```

### 连接池监控

```typescript
export default defineEventHandler(async (event) => {
  const dbPool = event.context.dbPool;
  const dbStatus = event.context.dbStatus;
  
  return {
    pool: {
      connected: dbStatus.connected,
      latency: dbStatus.latency,
      lastCheck: dbStatus.lastCheck,
    },
    config: {
      maxConnections: 200,
      minConnections: 2,
    }
  };
});
```

### 错误处理

```typescript
export default defineEventHandler(async (event) => {
  const db = event.context.db;
  
  try {
    return await db.select().from(users);
  } catch (error) {
    // 检查是否是连接错误
    if (error.code === 'ECONNREFUSED') {
      // 尝试重连
      await event.context.dbUtils.reconnect();
      // 重试操作
      return await db.select().from(users);
    }
    
    throw error;
  }
});
```

## 📝 **最佳实践**

### 1. 插件注册顺序

```typescript
const server = new H3();

// 1. 日志插件
server.register(createLoggerPlugin());

// 2. 数据库插件
server.register(createDatabasePlugin());

// 3. 其他插件
server.register(authPlugin());

// 4. 路由
server.mount('/api', apiRoutes);
```

### 2. 环境配置

```bash
# 开发环境
DB_HOST=localhost
DB_PORT=5432
DB_NAME=h3_dev_db
DB_USER=postgres
DB_PASSWORD=dev_password
DB_SSL=false

# 生产环境
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=h3_prod_db
DB_USER=prod_user
DB_PASSWORD=secure_password
DB_SSL=true
```

### 3. 错误处理策略

```typescript
export default defineEventHandler(async (event) => {
  const db = event.context.db;
  const logger = event.context.logger;
  
  try {
    return await db.select().from(users);
  } catch (error) {
    // 记录错误
    logger.error('数据库查询失败', {
      error: error.message,
      query: 'SELECT * FROM users',
      timestamp: new Date().toISOString(),
    });
    
    // 根据错误类型处理
    if (error.code === 'ECONNREFUSED') {
      throw new Error('数据库连接失败，请稍后重试');
    }
    
    throw new Error('查询失败');
  }
});
```

### 4. 性能优化

```typescript
export default defineEventHandler(async (event) => {
  const db = event.context.db;
  
  // 使用连接池
  // 插件自动管理连接池，无需手动处理
  
  // 使用预编译语句
  const stmt = db.select().from(users).where(eq(users.id, placeholder('id')));
  
  // 批量操作
  const results = await db.batch([
    stmt.execute({ id: '1' }),
    stmt.execute({ id: '2' }),
    stmt.execute({ id: '3' }),
  ]);
  
  return results;
});
```

## 🔧 **故障排除**

### 常见问题

1. **连接失败**
   ```bash
   # 检查数据库是否运行
   docker ps | grep postgres
   
   # 检查连接配置
   curl http://localhost:3000/db/status
   ```

2. **连接池耗尽**
   ```typescript
   // 增加最大连接数
   server.register(createDatabasePlugin({
     max: 500, // 增加到500
   }));
   ```

3. **查询超时**
   ```typescript
   // 增加连接超时
   server.register(createDatabasePlugin({
     connectTimeout: 30, // 30秒
   }));
   ```

### 调试模式

```typescript
server.register(createDatabasePlugin({
  debug: true,    // 启用调试
  logger: true,   // 启用日志
}));
```

## 📚 **相关文档**

- [日志插件文档](./PLUGIN_EXAMPLE.md)
- [API文档](./API_DOCUMENTATION.md)
- [Drizzle ORM文档](https://orm.drizzle.team/)
- [postgres-js文档](https://github.com/porsager/postgres)
