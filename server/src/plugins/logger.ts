import pino from 'pino';
import pinoHttp from 'pino-http';
import { definePlugin, defineEventHandler } from 'h3';

// 日志级别配置
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// 日志配置接口
export interface LoggerConfig {
  level: LogLevel;
  prettyPrint: boolean;
  timestamp: boolean;
  colorize: boolean;
  translateTime: string;
  ignore: string;
  messageFormat?: string;
  customLevels?: Record<string, number>;
  redact?: string[];
}

// 默认日志配置
const defaultConfig: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  prettyPrint: process.env.NODE_ENV === 'development',
  timestamp: true,
  colorize: process.env.NODE_ENV === 'development',
  translateTime: 'yyyy-mm-dd HH:MM:ss.l',
  ignore: 'pid,hostname,reqId,responseTime',
  messageFormat: '{req.method} {req.url} - {msg}',
  redact: ['req.headers.authorization', 'req.headers.cookie'],
};

// 创建Pino实例
function createPinoLogger(config: Partial<LoggerConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  
  const pinoConfig: pino.LoggerOptions = {
    level: finalConfig.level,
    timestamp: finalConfig.timestamp ? pino.stdTimeFunctions.isoTime : false,
    redact: finalConfig.redact,
  };

  // 开发环境使用pretty打印
  if (finalConfig.prettyPrint) {
    pinoConfig.transport = {
      target: 'pino-pretty',
      options: {
        colorize: finalConfig.colorize,
        translateTime: finalConfig.translateTime,
        ignore: finalConfig.ignore,
        messageFormat: finalConfig.messageFormat,
        singleLine: false,
        hideObject: false,
        customColors: 'info:blue,warn:yellow,error:red',
        customLevels: finalConfig.customLevels,
      },
    };
  }

  return pino(pinoConfig);
}

// 创建HTTP日志中间件
function createHttpLogger(logger: pino.Logger) {
  return pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      } else if (res.statusCode >= 300 && res.statusCode < 400) {
        return 'info';
      }
      return 'info';
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} - ${res.statusCode}`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
    },
    customAttributeKeys: {
      req: 'request',
      res: 'response',
      err: 'error',
      responseTime: 'duration',
    },
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
        },
        remoteAddress: req.socket?.remoteAddress,
        remotePort: req.socket?.remotePort,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
        headers: {
          'content-type': res.getHeader('content-type'),
          'content-length': res.getHeader('content-length'),
        },
      }),
      err: pino.stdSerializers.err,
    },
  });
}

// 创建全局日志实例
export const logger = createPinoLogger();

// 创建HTTP日志中间件实例
export const httpLogger = createHttpLogger(logger);

// H3日志插件
export function createLoggerPlugin(config?: Partial<LoggerConfig>) {
  const loggerInstance = config ? createPinoLogger(config) : logger;

  return definePlugin((app) => {
    // 注册全局日志中间件
    app.use('/', defineEventHandler(async (event) => {
      // 将logger添加到event context中
      event.context.logger = loggerInstance;
      event.context.requestStartTime = Date.now();

      // 简单记录请求
      loggerInstance.info({
        type: 'http_request',
        timestamp: new Date().toISOString(),
      }, 'HTTP Request received');
    }));
  });
}

// 日志工具函数
export const log = {
  trace: (msg: string, ...args: any[]) => logger.trace(msg, ...args),
  debug: (msg: string, ...args: any[]) => logger.debug(msg, ...args),
  info: (msg: string, ...args: any[]) => logger.info(msg, ...args),
  warn: (msg: string, ...args: any[]) => logger.warn(msg, ...args),
  error: (msg: string, ...args: any[]) => logger.error(msg, ...args),
  fatal: (msg: string, ...args: any[]) => logger.fatal(msg, ...args),
};

// 数据库日志
export const dbLog = {
  query: (sql: string, params?: any[], duration?: number) => {
    logger.debug({
      type: 'database',
      sql: sql.replace(/\s+/g, ' ').trim(),
      params,
      duration,
    }, 'Database query executed');
  },
  error: (error: Error, sql?: string, params?: any[]) => {
    logger.error({
      type: 'database',
      error: error.message,
      sql,
      params,
    }, 'Database query failed');
  },
  connection: (status: 'connected' | 'disconnected' | 'error', details?: any) => {
    const level = status === 'error' ? 'error' : 'info';
    logger[level]({
      type: 'database',
      status,
      ...details,
    }, `Database ${status}`);
  },
};

// 业务日志
export const bizLog = {
  userAction: (userId: string, action: string, details?: any) => {
    logger.info({
      type: 'user_action',
      userId,
      action,
      ...details,
    }, `User action: ${action}`);
  },
  apiCall: (endpoint: string, method: string, userId?: string, duration?: number) => {
    logger.info({
      type: 'api_call',
      endpoint,
      method,
      userId,
      duration,
    }, `API call: ${method} ${endpoint}`);
  },
  error: (error: Error, context?: any) => {
    logger.error({
      type: 'business_error',
      error: error.message,
      stack: error.stack,
      ...context,
    }, 'Business logic error');
  },
};

// 性能日志
export const perfLog = {
  start: (operation: string) => {
    const startTime = Date.now();
    return {
      end: (details?: any) => {
        const duration = Date.now() - startTime;
        logger.info({
          type: 'performance',
          operation,
          duration,
          ...details,
        }, `Operation completed: ${operation} (${duration}ms)`);
        return duration;
      },
    };
  },
  measure: async (operation: string, fn: () => Promise<any>) => {
    const timer = perfLog.start(operation);
    try {
      return await fn();
    } finally {
      timer.end();
    }
  },
};

// 导出类型
export type Logger = typeof logger;
export type HttpLogger = typeof httpLogger;
