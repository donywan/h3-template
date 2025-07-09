import { config } from 'dotenv';

// 根据环境加载对应的 .env 文件
const env = process.env.NODE_ENV || 'development';

// 加载环境特定的配置文件
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

// 如果环境特定文件不存在，回退到默认 .env 文件
config({ path: '.env' });

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    origin: string;
    methods: string;
  };
}

export interface AppConfig {
  env: string;
  server: ServerConfig;
  database: DatabaseConfig;
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  jwt?: {
    secret: string;
    expiresIn: string;
  };
  logging: {
    level: string;
    format: string;
  };
}

// 获取环境变量的辅助函数
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue!;
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
}

function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

// 应用配置
export const appConfig: AppConfig = {
  env,
  server: {
    port: getEnvNumber('PORT', 3000),
    host: getEnvVar('HOST', '0.0.0.0'),
    cors: {
      origin: getEnvVar('CORS_ORIGIN', '*'),
      methods: getEnvVar('CORS_METHODS', 'GET,POST,PUT,DELETE,OPTIONS'),
    },
  },
  database: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 5432),
    database: getEnvVar('DB_NAME', 'h3_db'),
    username: getEnvVar('DB_USER', 'postgres'),
    password: getEnvVar('DB_PASSWORD', 'password'),
    ssl: getEnvBoolean('DB_SSL', false),
    maxConnections: getEnvNumber('DB_MAX_CONNECTIONS', 10),
    connectionTimeout: getEnvNumber('DB_CONNECTION_TIMEOUT', 30000),
  },
  redis: process.env.REDIS_HOST ? {
    host: getEnvVar('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD,
  } : undefined,
  jwt: process.env.JWT_SECRET ? {
    secret: getEnvVar('JWT_SECRET'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
  } : undefined,
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    format: getEnvVar('LOG_FORMAT', 'json'),
  },
};

// 数据库连接字符串
export function getDatabaseUrl(): string {
  const { database } = appConfig;
  
  // 如果直接提供了 DATABASE_URL，优先使用
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // 否则根据配置构建连接字符串
  const sslParam = database.ssl ? '?sslmode=require' : '';
  return `postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}${sslParam}`;
}

// 验证配置
export function validateConfig(): void {
  console.log(`🔧 Loading configuration for environment: ${env}`);
  
  // 验证必需的配置
  if (!appConfig.database.host) {
    throw new Error('Database host is required');
  }
  
  if (!appConfig.database.database) {
    throw new Error('Database name is required');
  }
  
  console.log(`✅ Configuration loaded successfully`);
  console.log(`📊 Database: ${appConfig.database.host}:${appConfig.database.port}/${appConfig.database.database}`);
  console.log(`🌐 Server: ${appConfig.server.host}:${appConfig.server.port}`);
}
