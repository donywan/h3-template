import { H3, handleCors, serve } from "h3";
import adminRoutes from "./admin";
import { appRoutes } from "./app";
import { appConfig, validateConfig, getDatabaseUrl } from "./config";

// 验证配置
validateConfig();

const server = new H3()

// 健康检查路由
server.get('/health', () => {
    return {
        status: 'ok',
        environment: appConfig.env,
        timestamp: new Date().toISOString(),
        database: {
            host: appConfig.database.host,
            port: appConfig.database.port,
            database: appConfig.database.database,
        },
        version: process.env.npm_package_version || '1.0.0'
    };
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
console.log(`🚀 Starting H3 server...`);
console.log(`📊 Environment: ${appConfig.env}`);
console.log(`🗄️  Database URL: ${getDatabaseUrl().replace(/:[^:@]*@/, ':***@')}`);

serve(server, {
    port: appConfig.server.port,
    hostname: appConfig.server.host
})