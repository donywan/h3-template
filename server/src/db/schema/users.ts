import { pgTable, uuid, varchar, timestamp, boolean, text, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// 用户表定义 - 支持微信授权登录
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // 基本用户信息
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  name: varchar('name', { length: 255 }),
  nickname: varchar('nickname', { length: 255 }),
  avatar: text('avatar'), // 头像URL
  
  // 传统登录
  passwordHash: varchar('password_hash', { length: 255 }),
  
  // 微信登录相关字段
  wechatOpenid: varchar('wechat_openid', { length: 255 }).unique(), // 微信openid
  wechatUnionid: varchar('wechat_unionid', { length: 255 }).unique(), // 微信unionid
  wechatNickname: varchar('wechat_nickname', { length: 255 }), // 微信昵称
  wechatAvatar: text('wechat_avatar'), // 微信头像
  wechatGender: varchar('wechat_gender', { length: 10 }), // 微信性别 (1男性，2女性，0未知)
  wechatCity: varchar('wechat_city', { length: 100 }), // 微信城市
  wechatProvince: varchar('wechat_province', { length: 100 }), // 微信省份
  wechatCountry: varchar('wechat_country', { length: 100 }), // 微信国家
  
  // 登录令牌
  accessToken: text('access_token'), // 访问令牌
  refreshToken: text('refresh_token'), // 刷新令牌
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }), // 令牌过期时间
  
  // 用户状态
  isActive: boolean('is_active').default(true),
  isEmailVerified: boolean('is_email_verified').default(false),
  isPhoneVerified: boolean('is_phone_verified').default(false),
  
  // 登录信息
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  lastLoginIp: varchar('last_login_ip', { length: 45 }), // 支持IPv6
  loginCount: varchar('login_count', { length: 10 }).default('0'),
  
  // 扩展信息
  profile: jsonb('profile'), // 用户扩展信息 JSON
  preferences: jsonb('preferences'), // 用户偏好设置
  
  // 时间戳
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 微信用户信息验证schema
const wechatUserSchema = z.object({
  openid: z.string().optional(),
  unionid: z.string().optional(),
  nickname: z.string().optional(),
  headimgurl: z.string().url().optional(),
  sex: z.enum(['0', '1', '2']).optional(), // 0未知，1男，2女
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
});

// 基础 Zod schemas
export const insertUserSchema = createInsertSchema(users).refine(
  (data) => {
    // 至少需要一种登录方式：邮箱+密码、手机+密码、或微信openid
    return (
      (data.email && data.passwordHash) ||
      (data.phone && data.passwordHash) ||
      data.wechatOpenid
    );
  },
  {
    message: "用户必须有至少一种登录方式：邮箱+密码、手机+密码、或微信授权",
    path: ["email"],
  }
);

export const selectUserSchema = createSelectSchema(users);

// 更新用户schema - 简化版本
export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
  name: z.string().min(1).max(255).optional(),
  nickname: z.string().min(1).max(255).optional(),
  avatar: z.string().url().optional(),
  passwordHash: z.string().min(8).optional(),
  wechatOpenid: z.string().optional(),
  wechatUnionid: z.string().optional(),
  wechatNickname: z.string().optional(),
  wechatAvatar: z.string().url().optional(),
  wechatGender: z.enum(['0', '1', '2']).optional(),
  wechatCity: z.string().optional(),
  wechatProvince: z.string().optional(),
  wechatCountry: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
  isPhoneVerified: z.boolean().optional(),
  lastLoginAt: z.date().optional(),
  lastLoginIp: z.string().optional(),
  loginCount: z.string().optional(),
  profile: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
});

// 微信登录专用schema
export const wechatLoginSchema = z.object({
  code: z.string().min(1), // 微信授权码
  state: z.string().optional(), // 状态参数
});

export const wechatUserInfoSchema = wechatUserSchema;

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type WechatLoginData = z.infer<typeof wechatLoginSchema>;
export type WechatUserInfo = z.infer<typeof wechatUserInfoSchema>;

// 用户登录类型枚举
export const LoginType = {
  EMAIL: 'email',
  PHONE: 'phone',
  WECHAT: 'wechat',
} as const;

export type LoginTypeType = typeof LoginType[keyof typeof LoginType];
