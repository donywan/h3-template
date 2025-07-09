import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getDatabaseUrl } from '../config';
import * as schema from './schema';

// 构建数据库连接字符串
const connectionString = getDatabaseUrl();

// 数据库连接池配置
const poolConfig = {
  max: 200, // 最大连接数
  idle_timeout: 20, // 空闲连接超时（秒）
  connect_timeout: 10, // 连接超时（秒）
  max_lifetime: 60 * 30, // 连接最大生命周期（30分钟）
  ssl: process.env.DB_SSL === 'true' ? 'require' as const : false,
  debug: process.env.NODE_ENV === 'development',
  onnotice: process.env.NODE_ENV === 'development' ? console.log : undefined,
};

// 创建数据库连接池
const pool = postgres(connectionString, poolConfig);

// 创建 Drizzle 实例
export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// 数据库连接测试
export async function testConnection(): Promise<boolean> {
  try {
    const startTime = Date.now();
    await pool`SELECT 1`;
    const duration = Date.now() - startTime;
    console.log(`✅ Database connection successful (${duration}ms)`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// 关闭数据库连接池
export async function closeConnection(): Promise<void> {
  try {
    await pool.end();
    console.log('🔌 Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database connection pool:', error);
  }
}

// 数据库健康检查
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await pool`SELECT 1`;
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 连接池状态监控
export function getPoolStatus() {
  return {
    maxConnections: poolConfig.max,
    idleTimeout: poolConfig.idle_timeout,
    connectTimeout: poolConfig.connect_timeout,
    maxLifetime: poolConfig.max_lifetime,
    sslEnabled: poolConfig.ssl !== false,
  };
}

// 优雅关闭
export async function gracefulShutdown(): Promise<void> {
  console.log('🔄 Initiating graceful database shutdown...');
  try {
    await pool.end({ timeout: 5 });
    console.log('✅ Database connections closed gracefully');
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    throw error;
  }
}

// 导出类型和实例
export type Database = typeof db;
export { schema, pool };
