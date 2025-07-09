import { H3, readBody } from "h3";
import { UserService } from "../../service/user_service";
import { insertUserSchema, updateUserSchema } from "../../db/schema/users";

const userRoute = new H3()

// 获取所有用户列表
userRoute.get("/", async () => {
    try {
        // 这里可以添加分页和筛选逻辑
        return {
            success: true,
            message: "用户列表接口",
            data: []
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "获取用户列表失败"
        };
    }
});

// 根据ID获取用户信息
userRoute.get("/:id", async (event) => {
    try {
        const id = event.context.params?.id;
        if (!id) {
            return {
                success: false,
                message: "用户ID不能为空"
            };
        }

        const user = await UserService.findById(id);
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
            data: safeUser
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "获取用户信息失败"
        };
    }
});

// 创建用户
userRoute.post("/", async (event) => {
    event.context.logger('xxx')
    try {
        const body = await readBody(event);
        const validatedData = insertUserSchema.parse(body);

        const user = await UserService.create(validatedData);

        // 移除敏感信息
        const { passwordHash, accessToken, refreshToken, ...safeUser } = user;

        return {
            success: true,
            message: "用户创建成功",
            data: safeUser
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "创建用户失败"
        };
    }
});

// 更新用户信息
userRoute.put("/:id", async (event) => {
    try {
        const id = event.context.params?.id;
        if (!id) {
            return {
                success: false,
                message: "用户ID不能为空"
            };
        }

        const body = await readBody(event);
        const validatedData = updateUserSchema.parse(body);
        const user = await UserService.update(id, validatedData);

        if (!user) {
            return {
                success: false,
                message: "用户不存在或更新失败"
            };
        }

        // 移除敏感信息
        const { passwordHash, accessToken, refreshToken, ...safeUser } = user;

        return {
            success: true,
            message: "用户更新成功",
            data: safeUser
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "更新用户失败"
        };
    }
});

// 删除用户（软删除）
userRoute.delete("/:id", async (event) => {
    try {
        const id = event.context.params?.id;
        if (!id) {
            return {
                success: false,
                message: "用户ID不能为空"
            };
        }

        const success = await UserService.softDelete(id);

        return {
            success,
            message: success ? "用户删除成功" : "用户删除失败"
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "删除用户失败"
        };
    }
});

export default userRoute;