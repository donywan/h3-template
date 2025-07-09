# H3 Server with Bun Runtime

一个基于 [H3](https://h3.dev/) 框架和 [Bun](https://bun.sh) 运行时的高性能 Web 服务器。

## ✨ 特性

- 🚀 **高性能**: 基于 H3 v2 和 Bun 运行时
- 🔧 **TypeScript**: 完整的 TypeScript 支持
- 🗄️ **数据库**: 集成 Drizzle ORM 和 PostgreSQL
- 🐳 **Docker**: 完整的 Docker 支持
- 🔄 **热重载**: 开发环境自动重载
- 📦 **模块化**: 清晰的路由和中间件结构

## 🚀 快速开始

### 环境要求

- [Bun](https://bun.sh) >= 1.0.0
- [Node.js](https://nodejs.org) >= 20.11.0 (可选)
- [Docker](https://docker.com) (可选)

### 安装依赖

```bash
bun install
```

### 环境配置

项目支持多环境配置，每个环境都有独立的配置文件：

- `.env.development` - 开发环境配置
- `.env.test` - 测试环境配置
- `.env.production` - 生产环境配置
- `.env.example` - 配置模板

复制对应环境的配置文件：

```bash
# 开发环境 (默认已提供)
cp .env.development .env

# 测试环境
cp .env.test .env

# 生产环境
cp .env.production .env
```

根据需要修改配置文件中的数据库连接等信息。

### 开发模式

```bash
# 启动开发服务器 (使用开发环境配置)
bun run dev

# 启动测试环境服务器
bun run dev:test

# 或使用 PowerShell 脚本 (Windows)
.\scripts\dev.ps1
```

### 生产模式

```bash
# 构建生产版本
bun run build:prod

# 启动生产服务器
bun run preview

# 或使用 PowerShell 脚本 (Windows)
.\scripts\deploy.ps1 -Build
```

## 🐳 Docker 部署

### 开发环境

```bash
# 启动开发环境 (包含数据库)
cd docker
docker-compose -f docker-compose.dev.yml up -d

# 或使用 npm 脚本
bun run docker:up:dev

# 查看日志
bun run docker:logs:dev

# 停止服务
bun run docker:down:dev
```

### 测试环境

```bash
# 启动测试环境
cd docker
docker-compose -f docker-compose.test.yml up -d

# 或使用 npm 脚本
bun run docker:up:test

# 查看日志
bun run docker:logs:test

# 停止服务
bun run docker:down:test
```

### 生产环境

```bash
# 构建并启动生产环境
cd docker
docker-compose up -d

# 或使用 npm 脚本
bun run docker:build
bun run docker:up

# 或使用脚本
.\scripts\deploy.ps1 -Docker
```

## 📝 可用脚本

### 开发脚本

| 命令 | 描述 |
|------|------|
| `bun run dev` | 启动开发服务器 (热重载) |
| `bun run start` | 启动服务器 |
| `bun run test` | 运行测试 |
| `bun run test:watch` | 监视模式运行测试 |
| `bun run lint` | TypeScript 类型检查 |

### 构建脚本

| 命令 | 描述 |
|------|------|
| `bun run build` | 构建应用 |
| `bun run build:prod` | 构建生产版本 (压缩) |
| `bun run preview` | 预览生产构建 |
| `bun run clean` | 清理构建文件 |

### 数据库脚本

| 命令 | 描述 |
|------|------|
| `bun run db:generate` | 生成数据库迁移 |
| `bun run db:migrate` | 运行数据库迁移 |
| `bun run db:studio` | 启动 Drizzle Studio |
| `bun run db:push` | 推送 schema 到数据库 |

### Docker 脚本

| 命令 | 描述 |
|------|------|
| `bun run docker:build` | 构建 Docker 镜像 |
| `bun run docker:up` | 启动 Docker 服务 |
| `bun run docker:down` | 停止 Docker 服务 |
| `bun run docker:logs` | 查看 Docker 日志 |

## 📁 项目结构

```
h3-template/
├── src/                    # 源代码
│   ├── admin/             # 管理员路由
│   │   ├── routes/        # 管理员子路由
│   │   └── index.ts       # 管理员路由入口
│   ├── app/               # 应用路由
│   │   ├── routes/        # 应用子路由
│   │   └── index.ts       # 应用路由入口
│   ├── db/                # 数据库相关
│   │   └── schema/        # 数据库 schema
│   └── index.ts           # 应用入口
├── docker/                # Docker 配置
│   ├── Dockerfile         # 生产 Dockerfile
│   ├── Dockerfile.dev     # 开发 Dockerfile
│   ├── docker-compose.yml # Docker 生产配置
│   ├── docker-compose.dev.yml # Docker 开发配置
│   ├── .dockerignore      # Docker 忽略文件
│   ├── init.sql           # 数据库初始化脚本
│   └── README.md          # Docker 部署指南
├── scripts/               # 脚本文件
│   ├── dev.ps1           # 开发启动脚本
│   └── deploy.ps1        # 部署脚本
├── dist/                  # 构建输出 (自动生成)
├── .env.example          # 环境变量模板
└── package.json          # 项目配置
```

## 🌐 API 路由

### 基础路由

- `GET /` - 健康检查

### 管理员路由

- `GET /admin/user/` - 获取用户列表
- `GET /admin/position/` - 获取职位列表

### 应用路由

- `GET /app/user/` - 应用用户接口

## 🔧 配置

### 环境变量

主要环境变量配置 (详见 `.env.example`):

```bash
# 服务器配置
NODE_ENV=development
PORT=3000

# 数据库配置
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# CORS 配置
CORS_ORIGIN=*
```

### TypeScript 配置

项目使用严格的 TypeScript 配置，支持：

- ESNext 语法
- 模块解析
- 严格类型检查
- Bun 运行时类型

## 🚀 性能优化

### Bun 运行时优势

- **快速启动**: Bun 的启动时间比 Node.js 快 4x
- **内置打包**: 无需额外的打包工具
- **原生 TypeScript**: 直接运行 TypeScript 文件
- **快速安装**: 包管理器比 npm 快 25x

### H3 框架优势

- **轻量级**: 最小的运行时开销
- **Web 标准**: 基于现代 Web API
- **类型安全**: 完整的 TypeScript 支持
- **可组合**: 模块化设计

## 🧪 测试

```bash
# 运行所有测试
bun run test

# 监视模式
bun run test:watch

# 覆盖率报告
bun run test:coverage
```

## 📊 监控和日志

### 健康检查

```bash
# 检查服务状态
curl http://localhost:3000/

# 或使用脚本
bun run health
```

### Docker 日志

```bash
# 查看实时日志
bun run docker:logs

# 查看特定服务日志
docker-compose logs -f app
```

## 🤝 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [H3 文档](https://h3.dev/)
- [Bun 文档](https://bun.sh/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [TypeScript](https://www.typescriptlang.org/)

---

**由 [H3](https://h3.dev/) + [Bun](https://bun.sh) 强力驱动** ⚡
