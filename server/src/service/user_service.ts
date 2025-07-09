import { eq, or } from 'drizzle-orm';
import { db } from '../db/connection';
import { users, type User, type NewUser, type WechatUserInfo, LoginType } from '../db/schema/users';
import { bizLog, perfLog } from '../plugins/logger';
import crypto from 'crypto';

// 用户服务类
export class UserService {
  
  // 根据ID查找用户
  static async findById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  // 根据邮箱查找用户
  static async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  // 根据手机号查找用户
  static async findByPhone(phone: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0] || null;
  }

  // 根据微信openid查找用户
  static async findByWechatOpenid(openid: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.wechatOpenid, openid)).limit(1);
    return result[0] || null;
  }

  // 根据微信unionid查找用户
  static async findByWechatUnionid(unionid: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.wechatUnionid, unionid)).limit(1);
    return result[0] || null;
  }

  // 创建新用户
  static async create(userData: NewUser): Promise<User> {
    const timer = perfLog.start('user_create');
    try {
      const result = await db.insert(users).values(userData).returning();
      const user = result[0];

      bizLog.userAction(user.id, 'user_created', {
        email: userData.email,
        phone: userData.phone,
        loginType: userData.wechatOpenid ? 'wechat' : (userData.email ? 'email' : 'phone')
      });

      timer.end({ userId: user.id, success: true });
      return user;
    } catch (error) {
      timer.end({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      bizLog.error(error instanceof Error ? error : new Error('User creation failed'), { userData });
      throw error;
    }
  }

  // 更新用户信息
  static async update(id: string, userData: Partial<NewUser>): Promise<User | null> {
    const result = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  }

  // 更新用户登录信息
  static async updateLoginInfo(id: string, ip?: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        loginCount: String(parseInt(await this.getLoginCount(id)) + 1),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  // 获取用户登录次数
  private static async getLoginCount(id: string): Promise<string> {
    const user = await this.findById(id);
    return user?.loginCount || '0';
  }

  // 验证密码
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return crypto.timingSafeEqual(
      Buffer.from(crypto.createHash('sha256').update(plainPassword).digest('hex')),
      Buffer.from(hashedPassword)
    );
  }

  // 哈希密码
  static hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // 生成访问令牌
  static generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // 生成刷新令牌
  static generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // 微信登录或注册
  static async wechatLoginOrRegister(wechatUserInfo: WechatUserInfo): Promise<User> {
    // 首先尝试通过unionid查找用户（如果有）
    let user: User | null = null;
    
    if (wechatUserInfo.unionid) {
      user = await this.findByWechatUnionid(wechatUserInfo.unionid);
    }
    
    // 如果没有找到，尝试通过openid查找
    if (!user && wechatUserInfo.openid) {
      user = await this.findByWechatOpenid(wechatUserInfo.openid);
    }

    if (user) {
      // 用户已存在，更新微信信息
      const updatedUser = await this.update(user.id, {
        wechatOpenid: wechatUserInfo.openid,
        wechatUnionid: wechatUserInfo.unionid,
        wechatNickname: wechatUserInfo.nickname,
        wechatAvatar: wechatUserInfo.headimgurl,
        wechatGender: wechatUserInfo.sex,
        wechatCity: wechatUserInfo.city,
        wechatProvince: wechatUserInfo.province,
        wechatCountry: wechatUserInfo.country,
        // 如果用户没有头像，使用微信头像
        avatar: user.avatar || wechatUserInfo.headimgurl,
        // 如果用户没有昵称，使用微信昵称
        nickname: user.nickname || wechatUserInfo.nickname,
      });
      return updatedUser!;
    } else {
      // 创建新用户
      const newUser: NewUser = {
        wechatOpenid: wechatUserInfo.openid,
        wechatUnionid: wechatUserInfo.unionid,
        wechatNickname: wechatUserInfo.nickname,
        wechatAvatar: wechatUserInfo.headimgurl,
        wechatGender: wechatUserInfo.sex,
        wechatCity: wechatUserInfo.city,
        wechatProvince: wechatUserInfo.province,
        wechatCountry: wechatUserInfo.country,
        nickname: wechatUserInfo.nickname,
        avatar: wechatUserInfo.headimgurl,
        isActive: true,
      };
      
      return await this.create(newUser);
    }
  }

  // 邮箱密码登录
  static async emailLogin(email: string, password: string): Promise<User | null> {
    const timer = perfLog.start('email_login');
    try {
      const user = await this.findByEmail(email);
      if (!user || !user.passwordHash) {
        bizLog.userAction('unknown', 'login_failed', { email, reason: 'user_not_found' });
        timer.end({ success: false, reason: 'user_not_found' });
        return null;
      }

      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        bizLog.userAction(user.id, 'login_failed', { email, reason: 'invalid_password' });
        timer.end({ userId: user.id, success: false, reason: 'invalid_password' });
        return null;
      }

      bizLog.userAction(user.id, 'login_success', { email, method: 'email' });
      timer.end({ userId: user.id, success: true });
      return user;
    } catch (error) {
      bizLog.error(error instanceof Error ? error : new Error('Email login failed'), { email });
      timer.end({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  // 手机密码登录
  static async phoneLogin(phone: string, password: string): Promise<User | null> {
    const user = await this.findByPhone(phone);
    if (!user || !user.passwordHash) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  // 邮箱注册
  static async emailRegister(email: string, password: string, name?: string): Promise<User> {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error('邮箱已被注册');
    }

    const newUser: NewUser = {
      email,
      passwordHash: this.hashPassword(password),
      name: name || email.split('@')[0], // 默认使用邮箱前缀作为用户名
      isActive: true,
    };

    return await this.create(newUser);
  }

  // 手机注册
  static async phoneRegister(phone: string, password: string, name?: string): Promise<User> {
    const existingUser = await this.findByPhone(phone);
    if (existingUser) {
      throw new Error('手机号已被注册');
    }

    const newUser: NewUser = {
      phone,
      passwordHash: this.hashPassword(password),
      name: name || `用户${phone.slice(-4)}`, // 默认使用手机号后4位
      isActive: true,
    };

    return await this.create(newUser);
  }

  // 删除用户（软删除）
  static async softDelete(id: string): Promise<boolean> {
    const result = await this.update(id, { isActive: false });
    return !!result;
  }

  // 激活用户
  static async activate(id: string): Promise<boolean> {
    const result = await this.update(id, { isActive: true });
    return !!result;
  }
}
