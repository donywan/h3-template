import { defineEventHandler, defineMiddleware, definePlugin, H3, handleCors, serve } from "h3";
import adminRoutes from "./admin";
import { appRoutes } from "./app";
import { appConfig, validateConfig, getDatabaseUrl } from "./config";
import { createLoggerPlugin, logger, log, bizLog, perfLog } from "./plugins/logger";
import { testConnection, healthCheck, gracefulShutdown, getPoolStatus } from "./db/connection";
import { createAuthMiddleware } from "./middleware/auth";

// 验证配置
validateConfig();

// 初始化日志
log.info('🚀 Starting H3 server application...');
log.info(`📊 Environment: ${appConfig.env}`);
log.info(`🌐 Server: ${appConfig.server.host}:${appConfig.server.port}`);

// 测试数据库连接
testConnection();

const server = new H3()

// 注册日志插件
server.register(createLoggerPlugin({
  level: appConfig.logging.level as any,
  prettyPrint: appConfig.logging.prettyPrint,
  timestamp: appConfig.logging.timestamp,
  colorize: appConfig.logging.colorize,
}));

// 注册JWT鉴权中间件
server.use('/', createAuthMiddleware({
  excludePaths: [
    '/health',
    '/db/status',
    // 登录相关接口
    '/app/user/login/email',
    '/app/user/login/phone',
    '/app/user/login/wechat',
    '/app/user/register/email',
    '/app/user/register/phone',
    '/app/user/refresh-token',
    // 公开接口
    '/app/user/forgot-password',
    '/app/user/reset-password',
  ],
  optionalPaths: [
    '/app/user/profile', // 可选鉴权
  ],
}));

// 健康检查路由
server.get('/health', async () => {
    const timer = perfLog.start('health_check');
    try {
        const dbHealth = await healthCheck();
        const poolStatus = getPoolStatus();

        const response = {
            status: 'ok',
            environment: appConfig.env,
            timestamp: new Date().toISOString(),
            database: {
                host: appConfig.database.host,
                port: appConfig.database.port,
                database: appConfig.database.database,
                health: dbHealth,
                pool: poolStatus,
            },
            version: process.env.npm_package_version || '1.0.0'
        };

        timer.end({ status: 'success' });
        return response;
    } catch (error) {
        timer.end({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
    }
});

// 数据库连接池状态监控
server.get('/db/status', async () => {
    const timer = perfLog.start('db_status_check');
    try {
        const dbHealth = await healthCheck();
        const poolStatus = getPoolStatus();

        const response = {
            success: true,
            data: {
                health: dbHealth,
                pool: poolStatus,
                connectionString: getDatabaseUrl().replace(/:[^:@]*@/, ':***@'),
            }
        };

        timer.end({ status: 'success' });
        bizLog.apiCall('/db/status', 'GET', undefined, timer.end());
        return response;
    } catch (error) {
        timer.end({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        bizLog.error(error instanceof Error ? error : new Error('Unknown error'), { endpoint: '/db/status' });
        throw error;
    }
});

// 挂载路由
server.mount('/admin', adminRoutes)
server.mount('/app', appRoutes)

// CORS 中间件
server.use('/', async (event) => {
    const corsRes = handleCors(event, {
        origin: appConfig.server.cors.origin === '*' ? '*' : appConfig.server.cors.origin.split(','),
        preflight: {
            statusCode: 204,
        },
        methods: appConfig.server.cors.methods.split(',') as any,
    });
    if (corsRes) {
        return corsRes;
    }
});

// 启动服务器
log.info('🚀 Starting H3 server...');
log.info(`📊 Environment: ${appConfig.env}`);
log.info(`🗄️  Database URL: ${getDatabaseUrl().replace(/:[^:@]*@/, ':***@')}`);

serve(server, {
    port: appConfig.server.port,
    hostname: appConfig.server.host
});

log.info(`✅ Server started successfully on ${appConfig.server.host}:${appConfig.server.port}`);

// 优雅关闭处理
process.on('SIGINT', async () => {
    log.warn('\n🛑 Received SIGINT, shutting down gracefully...');
    await gracefulShutdown();
    log.info('✅ Server shutdown completed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    log.warn('\n🛑 Received SIGTERM, shutting down gracefully...');
    await gracefulShutdown();
    log.info('✅ Server shutdown completed');
    process.exit(0);
});

// 未捕获异常处理
process.on('uncaughtException', async (error) => {
    log.fatal('🚨 Uncaught Exception:', error);
    bizLog.error(error, { type: 'uncaught_exception' });
    await gracefulShutdown();
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    log.fatal('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    bizLog.error(reason instanceof Error ? reason : new Error(String(reason)), {
        type: 'unhandled_rejection',
        promise: String(promise)
    });
    await gracefulShutdown();
    process.exit(1);
});