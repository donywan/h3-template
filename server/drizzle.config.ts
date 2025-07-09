import { defineConfig } from "drizzle-kit";
import { config } from 'dotenv';

// 根据环境加载对应的 .env 文件
const env = process.env.NODE_ENV || 'development';

switch (env) {
  case 'production':
    config({ path: '.env.production' });
    break;
  case 'test':
    config({ path: '.env.test' });
    break;
  case 'development':
  default:
    config({ path: '.env.development' });
    break;
}

// 回退到默认 .env 文件
config({ path: '.env' });

// 构建数据库连接字符串
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const database = process.env.DB_NAME || 'h3_db';
  const username = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'password';
  const ssl = process.env.DB_SSL === 'true' ? '?sslmode=require' : '';

  return `postgresql://${username}:${password}@${host}:${port}/${database}${ssl}`;
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './drizzle',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  verbose: env === 'development',
  strict: env === 'production',
})