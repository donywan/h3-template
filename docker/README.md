# Docker 部署指南

本目录包含了 H3 Server 的 Docker 部署配置文件。

## 📁 文件结构

```
docker/
├── Dockerfile              # 生产环境 Dockerfile
├── Dockerfile.dev          # 开发环境 Dockerfile
├── docker-compose.yml      # 生产环境 Docker Compose
├── docker-compose.dev.yml  # 开发环境 Docker Compose
├── docker-compose.test.yml # 测试环境 Docker Compose
├── .dockerignore           # Docker 忽略文件
├── init.sql                # 生产环境数据库初始化脚本
├── init-dev.sql            # 开发环境数据库初始化脚本
├── init-test.sql           # 测试环境数据库初始化脚本
└── README.md               # 本文档
```

## 🚀 快速开始

### 开发环境

```bash
# 在项目根目录运行
cd docker
docker-compose -f docker-compose.dev.yml up -d

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 停止服务
docker-compose -f docker-compose.dev.yml down
```

### 测试环境

```bash
# 在项目根目录运行
cd docker
docker-compose -f docker-compose.test.yml up -d

# 查看日志
docker-compose -f docker-compose.test.yml logs -f

# 停止服务
docker-compose -f docker-compose.test.yml down
```

### 生产环境

```bash
# 在项目根目录运行
cd docker
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🐳 服务说明

### app / app-dev
- **端口**: 3000
- **描述**: H3 应用服务器
- **环境变量**:
  - `NODE_ENV`: 运行环境 (development/production)
  - `PORT`: 服务端口
  - `DATABASE_URL`: 数据库连接字符串

### db
- **端口**: 5432
- **镜像**: postgres:15-alpine
- **数据库**: h3_db
- **用户名**: postgres
- **密码**: password
- **数据持久化**: postgres_data volume

### redis
- **端口**: 6379
- **镜像**: redis:7-alpine
- **描述**: 缓存服务 (可选)

## 🔧 配置说明

### 环境变量

可以通过以下方式配置环境变量：

1. **修改 docker-compose.yml**:
```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - DATABASE_URL=postgresql://postgres:password@db:5432/h3_db
```

2. **使用 .env 文件**:
```bash
# 在 docker 目录创建 .env 文件
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:password@db:5432/h3_db
```

### 数据库初始化

`init.sql` 文件会在 PostgreSQL 容器首次启动时自动执行，包含：

- 创建必要的扩展 (uuid-ossp, pgcrypto)
- 创建示例表 (users, positions)
- 插入示例数据
- 创建索引和触发器

### 数据持久化

数据库数据通过 Docker volume `postgres_data` 持久化存储。

## 🛠️ 常用命令

### 构建镜像

```bash
# 构建生产镜像
docker build -f Dockerfile -t h3-server:latest ..

# 构建开发镜像
docker build -f Dockerfile.dev -t h3-server:dev ..
```

### 管理服务

```bash
# 启动所有服务
docker-compose up -d

# 启动特定服务
docker-compose up -d db redis

# 重启服务
docker-compose restart app

# 查看服务状态
docker-compose ps

# 查看资源使用情况
docker-compose top
```

### 日志和调试

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f app

# 进入容器
docker-compose exec app sh
docker-compose exec db psql -U postgres -d h3_db
```

### 数据库操作

```bash
# 连接数据库
docker-compose exec db psql -U postgres -d h3_db

# 备份数据库
docker-compose exec db pg_dump -U postgres h3_db > backup.sql

# 恢复数据库
docker-compose exec -T db psql -U postgres h3_db < backup.sql
```

## 🔒 安全注意事项

1. **生产环境**请修改默认密码
2. **不要**在生产环境中暴露数据库端口
3. **使用**环境变量或 Docker secrets 管理敏感信息
4. **定期**更新基础镜像和依赖

## 🐛 故障排除

### 常见问题

1. **端口冲突**:
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :3000
   
   # 修改端口映射
   ports:
     - "3001:3000"  # 将本地端口改为 3001
   ```

2. **数据库连接失败**:
   ```bash
   # 检查数据库服务状态
   docker-compose ps db
   
   # 查看数据库日志
   docker-compose logs db
   ```

3. **权限问题**:
   ```bash
   # 检查文件权限
   ls -la
   
   # 修复权限 (Linux/macOS)
   sudo chown -R $USER:$USER .
   ```

## 📊 监控

### 健康检查

应用容器包含健康检查配置：

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1
```

### 查看健康状态

```bash
# 查看容器健康状态
docker-compose ps

# 查看详细健康检查信息
docker inspect $(docker-compose ps -q app) | grep -A 10 Health
```
