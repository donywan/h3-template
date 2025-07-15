import { defineEventHandler, getHeader, createError } from 'h3';
import { JWTUtils, type JWTPayload } from '../utils/jwt';
import { log, bizLog } from '../plugins/logger';

// 鉴权配置接口
export interface AuthConfig {
  // 需要排除鉴权的路径
  excludePaths: string[];
  // 需要排除鉴权的路径模式（正则）
  excludePatterns: RegExp[];
  // 可选鉴权的路径（有token则验证，无token则跳过）
  optionalPaths: string[];
  // API密钥路径（使用API密钥而非JWT）
  apiKeyPaths: string[];
  // 角色权限配置
  rolePermissions: Record<string, string[]>;
}

// 默认鉴权配置
const defaultAuthConfig: AuthConfig = {
  excludePaths: [
    '/health',
    '/db/status',
    // 登录相关接口
    '/app/user/login/email',
    '/app/user/login/phone', 
    '/app/user/login/wechat',
    '/app/user/register/email',
    '/app/user/register/phone',
    // 公开接口
    '/app/user/forgot-password',
    '/app/user/reset-password',
  ],
  excludePatterns: [
    /^\/public\//,  // 公开资源
    /^\/docs\//,    // 文档
    /^\/api-docs/, // API文档
  ],
  optionalPaths: [
    '/app/user/profile', // 可选鉴权，有token则返回用户信息，无token则返回游客信息
  ],
  apiKeyPaths: [
    '/admin/system', // 系统管理接口使用API密钥
  ],
  rolePermissions: {
    'admin': ['*'], // 管理员拥有所有权限
    'user': ['user:read', 'user:update'], // 普通用户权限
    'guest': ['user:read'], // 游客权限
  },
};

// 扩展H3事件上下文
declare module 'h3' {
  interface H3EventContext {
    user?: JWTPayload;
    isAuthenticated?: boolean;
    permissions?: string[];
  }
}

// 从请求头中提取token
function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  // 支持 "Bearer token" 格式
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 支持直接传token
  return authHeader;
}

// 检查路径是否需要排除鉴权
function shouldExcludeAuth(path: string, config: AuthConfig): boolean {
  // 检查精确匹配
  if (config.excludePaths.includes(path)) {
    return true;
  }
  
  // 检查正则模式匹配
  return config.excludePatterns.some(pattern => pattern.test(path));
}

// 检查是否为可选鉴权路径
function isOptionalAuth(path: string, config: AuthConfig): boolean {
  return config.optionalPaths.includes(path);
}

// 检查是否为API密钥路径
function isApiKeyPath(path: string, config: AuthConfig): boolean {
  return config.apiKeyPaths.some(apiPath => path.startsWith(apiPath));
}

// 检查用户权限
function checkPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  // 如果用户有管理员权限，允许所有操作
  if (userPermissions.includes('*')) {
    return true;
  }
  
  // 检查是否有所需权限
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
}

// 创建JWT鉴权中间件
export function createAuthMiddleware(config: Partial<AuthConfig> = {}) {
  const finalConfig = { ...defaultAuthConfig, ...config };
  
  return defineEventHandler(async (event) => {
    const path = event.req?.url || '/';
    const method = event.req?.method || 'GET';
    
    // 记录鉴权开始
    const startTime = Date.now();
    
    try {
      // 检查是否需要排除鉴权
      if (shouldExcludeAuth(path, finalConfig)) {
        log.debug(`跳过鉴权: ${method} ${path}`);
        return;
      }
      
      // 检查是否为API密钥路径
      if (isApiKeyPath(path, finalConfig)) {
        const apiKey = event.req.headers.get('x-api-key');
        if (!apiKey) {
          throw createError({
            statusCode: 401,
            statusMessage: 'API密钥缺失',
          });
        }

        const apiKeyResult = await JWTUtils.verifyApiKey(apiKey);
        if (!apiKeyResult.valid) {
          throw createError({
            statusCode: 401,
            statusMessage: 'API密钥无效',
          });
        }

        event.context.isAuthenticated = true;
        log.debug(`API密钥验证成功: ${apiKeyResult.identifier}`);
        return;
      }
      
      // 提取JWT token
      // const authHeader = getHeader(event, 'authorization');
      const authHeader = event.req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);
      
      // 检查是否为可选鉴权
      const isOptional = isOptionalAuth(path, finalConfig);
      
      if (!token) {
        if (isOptional) {
          // 可选鉴权，无token时设置为未认证状态
          event.context.isAuthenticated = false;
          log.debug(`可选鉴权，无token: ${method} ${path}`);
          return;
        }
        
        throw createError({
          statusCode: 401,
          statusMessage: '访问令牌缺失',
        });
      }
      
      // 验证JWT token
      const verifyResult = await JWTUtils.verifyAccessToken(token);

      if (!verifyResult.valid) {
        if (verifyResult.expired) {
          throw createError({
            statusCode: 401,
            statusMessage: '访问令牌已过期',
            data: { code: 'TOKEN_EXPIRED' },
          });
        }

        throw createError({
          statusCode: 401,
          statusMessage: '访问令牌无效',
          data: { code: 'TOKEN_INVALID', error: verifyResult.error },
        });
      }

      // 设置用户信息到上下文
      event.context.user = verifyResult.payload;
      event.context.isAuthenticated = true;

      // 设置用户权限
      const userRole = verifyResult.payload?.role || 'guest';
      event.context.permissions = finalConfig.rolePermissions[userRole] || [];

      // 记录成功的鉴权
      const duration = Date.now() - startTime;
      bizLog.userAction(
        verifyResult.payload!.userId,
        'auth_success',
        {
          path,
          method,
          duration,
          role: userRole,
        }
      );

      log.debug(`鉴权成功: ${method} ${path} - 用户: ${verifyResult.payload!.userId}`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 记录鉴权失败
      bizLog.error(error instanceof Error ? error : new Error('鉴权失败'), {
        path,
        method,
        duration,
        type: 'auth_failure',
      });
      
      log.warn(`鉴权失败: ${method} ${path} - ${error instanceof Error ? error.message : '未知错误'}`);
      
      // 重新抛出错误
      throw error;
    }
  });
}

// 权限检查装饰器函数
export function requirePermissions(permissions: string[]) {
  return defineEventHandler(async (event) => {
    if (!event.context.isAuthenticated) {
      throw createError({
        statusCode: 401,
        statusMessage: '需要登录',
      });
    }
    
    const userPermissions = event.context.permissions || [];
    
    if (!checkPermissions(userPermissions, permissions)) {
      throw createError({
        statusCode: 403,
        statusMessage: '权限不足',
        data: { 
          required: permissions,
          current: userPermissions,
        },
      });
    }
  });
}

// 角色检查装饰器函数
export function requireRole(role: string) {
  return defineEventHandler(async (event) => {
    if (!event.context.isAuthenticated || !event.context.user) {
      throw createError({
        statusCode: 401,
        statusMessage: '需要登录',
      });
    }
    
    const userRole = event.context.user.role || 'guest';
    
    if (userRole !== role && userRole !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: '角色权限不足',
        data: { 
          required: role,
          current: userRole,
        },
      });
    }
  });
}

// 获取当前用户信息的工具函数
export function getCurrentUser(event: any): JWTPayload | null {
  return event.context.user || null;
}

// 检查当前用户是否已认证
export function isAuthenticated(event: any): boolean {
  return event.context.isAuthenticated === true;
}

// 导出默认配置
export { defaultAuthConfig };
