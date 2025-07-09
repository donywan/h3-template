# 使用官方 Bun 镜像作为基础镜像
FROM oven/bun:1 AS base

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 bun.lockb (如果存在)
COPY package.json bun.lockb* ./

# 安装依赖
RUN bun install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN bun run build:prod

# 生产阶段
FROM oven/bun:1-slim AS production

# 设置工作目录
WORKDIR /app

# 复制构建产物和必要文件
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules

# 创建非 root 用户
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 bunjs
USER bunjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# 启动应用
CMD ["bun", "run", "preview"]
