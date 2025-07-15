import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';
import { appConfig } from '../config';

// JWT配置
export interface JWTConfig {
  secret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  issuer: string;
  audience: string;
}

// 默认JWT配置
const defaultJWTConfig: JWTConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m', // 15分钟
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d', // 7天
  issuer: process.env.JWT_ISSUER || 'h3-server',
  audience: process.env.JWT_AUDIENCE || 'h3-client',
};

// JWT载荷接口 (扩展 jose 的 JWTPayload)
export interface JWTPayload extends JoseJWTPayload {
  userId: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: string[];
  type: 'access' | 'refresh';
  exp?: number; // 过期时间
  iat?: number; // 签发时间
}

// JWT验证结果接口
export interface JWTVerifyResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
  expired?: boolean;
}

// JWT工具类
export class JWTUtils {
  private static config: JWTConfig = defaultJWTConfig;

  // 获取密钥的 Uint8Array 格式
  private static getSecretKey(): Uint8Array {
    return new TextEncoder().encode(this.config.secret);
  }

  // 解析过期时间字符串为秒数
  private static parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid expiry format: ${expiry}`);

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  // 设置JWT配置
  static setConfig(config: Partial<JWTConfig>) {
    this.config = { ...this.config, ...config };
  }

  // 生成访问令牌
  static async generateAccessToken(payload: Omit<JWTPayload, 'type' | 'exp' | 'iat'>): Promise<string> {
    const tokenPayload = {
      ...payload,
      type: 'access' as const,
    };

    const expirySeconds = this.parseExpiryToSeconds(this.config.accessTokenExpiry);

    return await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expirySeconds)
      .setIssuer(this.config.issuer)
      .setAudience(this.config.audience)
      .setSubject(String(payload.userId))
      .sign(this.getSecretKey());
  }

  // 生成刷新令牌
  static async generateRefreshToken(payload: Omit<JWTPayload, 'type' | 'exp' | 'iat'>): Promise<string> {
    const tokenPayload = {
      ...payload,
      type: 'refresh' as const,
    };

    const expirySeconds = this.parseExpiryToSeconds(this.config.refreshTokenExpiry);

    return await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expirySeconds)
      .setIssuer(this.config.issuer)
      .setAudience(this.config.audience)
      .setSubject(String(payload.userId))
      .sign(this.getSecretKey());
  }

  // 生成令牌对
  static async generateTokenPair(payload: Omit<JWTPayload, 'type' | 'exp' | 'iat'>) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload)
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.accessTokenExpiry,
    };
  }

  // 验证令牌
  static async verifyToken(token: string, type?: 'access' | 'refresh'): Promise<JWTVerifyResult> {
    try {
      const { payload } = await jwtVerify(token, this.getSecretKey(), {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      const decoded = payload as JWTPayload;

      // 检查令牌类型
      if (type && decoded.type !== type) {
        return {
          valid: false,
          error: `Invalid token type. Expected ${type}, got ${decoded.type}`,
        };
      }

      return {
        valid: true,
        payload: decoded,
      };
    } catch (error) {
      // jose 的错误处理
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          return {
            valid: false,
            expired: true,
            error: 'Token expired',
          };
        }

        return {
          valid: false,
          error: error.message,
        };
      }

      return {
        valid: false,
        error: 'Token verification failed',
      };
    }
  }

  // 验证访问令牌
  static async verifyAccessToken(token: string): Promise<JWTVerifyResult> {
    return await this.verifyToken(token, 'access');
  }

  // 验证刷新令牌
  static async verifyRefreshToken(token: string): Promise<JWTVerifyResult> {
    return await this.verifyToken(token, 'refresh');
  }

  // 从令牌中提取载荷（不验证）
  static decodeToken(token: string): JWTPayload | null {
    try {
      // 简单解析 JWT payload (不验证签名)
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload as JWTPayload;
    } catch {
      return null;
    }
  }

  // 检查令牌是否即将过期（剩余时间少于指定分钟数）
  static isTokenExpiringSoon(token: string, minutesThreshold: number = 5): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;

    const expirationTime = payload.exp * 1000; // 转换为毫秒
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    const thresholdTime = minutesThreshold * 60 * 1000; // 转换为毫秒

    return timeUntilExpiry <= thresholdTime;
  }

  // 刷新访问令牌
  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string } | null> {
    const verifyResult = await this.verifyRefreshToken(refreshToken);

    if (!verifyResult.valid || !verifyResult.payload) {
      return null;
    }

    const { type, exp, iat, ...payload } = verifyResult.payload;
    const newAccessToken = await this.generateAccessToken(payload);

    return { accessToken: newAccessToken };
  }

  // 获取令牌剩余时间（秒）
  static getTokenRemainingTime(token: string): number | null {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return null;

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const remainingTime = Math.max(0, expirationTime - currentTime);

    return Math.floor(remainingTime / 1000);
  }

  // 生成API密钥（用于服务间通信）
  static async generateApiKey(identifier: string): Promise<string> {
    const payload = {
      type: 'api_key',
      identifier,
    };

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(this.config.issuer)
      .setAudience(this.config.audience)
      .sign(this.getSecretKey());
  }

  // 验证API密钥
  static async verifyApiKey(apiKey: string): Promise<{ valid: boolean; identifier?: string }> {
    try {
      const { payload } = await jwtVerify(apiKey, this.getSecretKey(), {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      if (payload.type !== 'api_key') {
        return { valid: false };
      }

      return {
        valid: true,
        identifier: payload.identifier as string,
      };
    } catch {
      return { valid: false };
    }
  }
}

// 导出默认实例
export const jwtUtils = JWTUtils;
