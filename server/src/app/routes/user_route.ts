import { H3, readBody } from "h3";
import { UserService } from "../../service/user_service";
import { wechatLoginSchema, type WechatUserInfo } from "../../db/schema/users";
import { getCurrentUser, isAuthenticated } from "../../middleware/auth";
import { JWTUtils } from "../../utils/jwt";

export const userRoute = new H3()

// 用户信息接口 (需要JWT鉴权)
userRoute.get("/profile", async (event) => {
    try {
        // 检查用户是否已认证
        if (!isAuthenticated(event)) {
            return {
                success: false,
                message: "需要登录"
            };
        }

        // 从JWT token中获取用户信息
        const currentUser = getCurrentUser(event);
        if (!currentUser) {
            return {
                success: false,
                message: "用户信息无效"
            };
        }

        // 从数据库获取完整用户信息
        const user = await UserService.findById(currentUser.userId);
        if (!user) {
            return {
                success: false,
                message: "用户不存在"
            };
        }

        // 移除敏感信息
        const { passwordHash, accessToken, refreshToken, ...safeUser } = user;

        return {
            success: true,
            message: "获取用户信息成功",
            data: safeUser
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "获取用户信息失败"
        };
    }
});

// 邮箱密码登录
userRoute.post("/login/email", async (event) => {
    try {
        const body = await readBody(event) as { email?: string; password?: string };
        const { email, password } = body;

        if (!email || !password) {
            return {
                success: false,
                message: "邮箱和密码不能为空"
            };
        }

        const user = await UserService.emailLogin(email, password);
        if (!user) {
            return {
                success: false,
                message: "邮箱或密码错误"
            };
        }

        // 更新登录信息
        const clientIp = event.node?.req?.socket?.remoteAddress || 'unknown';
        await UserService.updateLoginInfo(user.id, clientIp);

        // 生成JWT令牌对
        const tokens = await UserService.generateJWTTokens(user);

        // 移除敏感信息
        const { passwordHash, accessToken: oldAccessToken, refreshToken: oldRefreshToken, ...safeUser } = user;

        return {
            success: true,
            message: "登录成功",
            data: {
                user: safeUser,
                ...tokens,
            }
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "登录失败"
        };
    }
});

// 手机密码登录
userRoute.post("/login/phone", async (event) => {
    try {
        const body = await readBody(event) as { phone?: string; password?: string };
        const { phone, password } = body;

        if (!phone || !password) {
            return {
                success: false,
                message: "手机号和密码不能为空"
            };
        }

        const user = await UserService.phoneLogin(phone, password);
        if (!user) {
            return {
                success: false,
                message: "手机号或密码错误"
            };
        }

        // 更新登录信息
        const clientIp = event.node?.req?.socket?.remoteAddress || 'unknown';
        await UserService.updateLoginInfo(user.id, clientIp);

        // 生成JWT令牌对
        const tokens = await UserService.generateJWTTokens(user);

        // 移除敏感信息
        const { passwordHash, accessToken: oldAccessToken, refreshToken: oldRefreshToken, ...safeUser } = user;

        return {
            success: true,
            message: "登录成功",
            data: {
                user: safeUser,
                ...tokens,
            }
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "登录失败"
        };
    }
});

// 微信授权登录
userRoute.post("/login/wechat", async (event) => {
    try {
        const body = await readBody(event);
        const validatedData = wechatLoginSchema.parse(body);

        // 这里应该调用微信API获取用户信息
        // 暂时使用模拟数据
        const mockWechatUserInfo: WechatUserInfo = {
            openid: "mock_openid_" + Date.now(),
            unionid: "mock_unionid_" + Date.now(),
            nickname: "微信用户",
            headimgurl: "https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLL1byctY955FrMQueH2c4kxqJLfpb9p5cEWgGrPcmibic6rxaQT8fAuGe2zQpWviaLtgBWrKbbkOzMA/132",
            sex: "1",
            city: "深圳",
            province: "广东",
            country: "中国",
        };

        // 微信登录或注册
        const user = await UserService.wechatLoginOrRegister(mockWechatUserInfo);

        // 更新登录信息
        const clientIp = event.node?.req?.socket?.remoteAddress || 'unknown';
        await UserService.updateLoginInfo(user.id, clientIp);

        // 生成JWT令牌对
        const tokens = await UserService.generateJWTTokens(user);

        return {
            success: true,
            message: "微信登录成功",
            data: {
                user,
                ...tokens,
            }
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "微信登录失败"
        };
    }
});

// 邮箱注册
userRoute.post("/register/email", async (event) => {
    try {
        const body = await readBody(event) as { email?: string; password?: string; name?: string };
        const { email, password, name } = body;

        if (!email || !password) {
            return {
                success: false,
                message: "邮箱和密码不能为空"
            };
        }

        const user = await UserService.emailRegister(email, password, name);

        // 移除敏感信息
        const { passwordHash, ...safeUser } = user;

        return {
            success: true,
            message: "注册成功",
            data: safeUser
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "注册失败"
        };
    }
});

// 手机注册
userRoute.post("/register/phone", async (event) => {
    try {
        const body = await readBody(event) as { phone?: string; password?: string; name?: string };
        const { phone, password, name } = body;

        if (!phone || !password) {
            return {
                success: false,
                message: "手机号和密码不能为空"
            };
        }

        const user = await UserService.phoneRegister(phone, password, name);

        // 移除敏感信息
        const { passwordHash, ...safeUser } = user;

        return {
            success: true,
            message: "注册成功",
            data: safeUser
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "注册失败"
        };
    }
});

// 刷新访问令牌
userRoute.post("/refresh-token", async (event) => {
    try {
        const body = await readBody(event) as { refreshToken?: string };
        const { refreshToken } = body;

        if (!refreshToken) {
            return {
                success: false,
                message: "刷新令牌不能为空"
            };
        }

        const result = await UserService.refreshJWTToken(refreshToken);
        if (!result) {
            return {
                success: false,
                message: "刷新令牌无效或已过期"
            };
        }

        return {
            success: true,
            message: "令牌刷新成功",
            data: result
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "令牌刷新失败"
        };
    }
});

// 退出登录
userRoute.post("/logout", async (event) => {
    try {
        // 从JWT token中获取用户信息
        const currentUser = getCurrentUser(event);
        if (currentUser) {
            // 这里可以将token加入黑名单或清除用户的刷新令牌
            // 暂时只返回成功响应
        }

        return {
            success: true,
            message: "退出登录成功"
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "退出登录失败"
        };
    }
});