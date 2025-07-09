import { H3, readBody } from "h3";
import { UserService } from "../../service/user_service";
import { wechatLoginSchema, type WechatUserInfo } from "../../db/schema/users";

export const userRoute = new H3()

// 用户信息接口
userRoute.get("/profile", async (event) => {
    try {
        // 这里应该从JWT token中获取用户ID
        // 暂时返回示例响应
        return {
            success: true,
            message: "获取用户信息成功",
            data: {
                id: "example-user-id",
                name: "示例用户",
                avatar: "https://example.com/avatar.jpg"
            }
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

        // 生成访问令牌
        const accessToken = UserService.generateAccessToken();
        const refreshToken = UserService.generateRefreshToken();

        // 更新用户令牌
        await UserService.update(user.id, {
            accessToken,
            refreshToken,
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
        });

        // 移除敏感信息
        const { passwordHash, ...safeUser } = user;

        return {
            success: true,
            message: "登录成功",
            data: {
                user: safeUser,
                accessToken,
                refreshToken,
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

        // 生成访问令牌
        const accessToken = UserService.generateAccessToken();
        const refreshToken = UserService.generateRefreshToken();

        // 更新用户令牌
        await UserService.update(user.id, {
            accessToken,
            refreshToken,
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
        });

        // 移除敏感信息
        const { passwordHash, ...safeUser } = user;

        return {
            success: true,
            message: "登录成功",
            data: {
                user: safeUser,
                accessToken,
                refreshToken,
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

        // 生成访问令牌
        const accessToken = UserService.generateAccessToken();
        const refreshToken = UserService.generateRefreshToken();

        // 更新用户令牌
        await UserService.update(user.id, {
            accessToken,
            refreshToken,
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
        });

        return {
            success: true,
            message: "微信登录成功",
            data: {
                user,
                accessToken,
                refreshToken,
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

// 退出登录
userRoute.post("/logout", async () => {
    try {
        // 这里应该从JWT token中获取用户ID
        // 清除用户的访问令牌
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