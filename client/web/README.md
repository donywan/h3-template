# H3 Template Web - SolidStart Frontend

基于 SolidStart 的现代化前端应用，与 H3 后端 API 集成，使用 Bun 运行时优化性能。

## 🚀 **技术栈**

- **框架**: SolidStart (SolidJS 全栈框架)
- **运行时**: Bun (高性能 JavaScript 运行时)
- **样式**: Tailwind CSS
- **状态管理**: SolidJS Signals
- **路由**: SolidJS Router
- **构建工具**: Vinxi + Bun
- **包管理**: Bun
- **认证**: JWT + 自动刷新
- **API 客户端**: 自定义 Fetch 封装

## 🔧 **开发指南**

### 环境配置

1. 复制环境配置文件：
```bash
cp .env.example .env
```

2. 修改 `.env` 文件中的配置：
```bash
# API 服务器配置
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT=10000
```

### 安装依赖

```bash
bun install
```

### 启动开发服务器

```bash
bun run dev
```

应用将在 http://localhost:3001 启动

### 构建生产版本

```bash
bun run build
```

### 清理构建缓存

```bash
bun run clean
```

## ⚡ **Bun 运行时优势**

### 性能提升

- **更快的启动时间**: Bun 的原生性能比 Node.js 快 3-4 倍
- **更快的包安装**: Bun 的包管理器比 npm/yarn 快 10-25 倍
- **更快的构建**: 内置的打包器和转译器
- **更低的内存占用**: 更高效的内存管理

### 开发体验

- **内置 TypeScript 支持**: 无需额外配置
- **内置测试运行器**: `bun test`
- **内置打包器**: `bun build`
- **兼容 Node.js**: 可以运行大部分 Node.js 代码

### 配置优化

项目已经配置了以下 Bun 优化：

1. **bunfig.toml**: Bun 运行时配置
2. **app.config.ts**: SolidStart + Bun 集成配置
3. **package.json**: 使用 `--bun` 标志的脚本

## This project was created with the [Solid CLI](https://github.com/solidjs-community/solid-cli)
