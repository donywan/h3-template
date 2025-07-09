# PowerShell 生产部署脚本
param(
    [switch]$Build,
    [switch]$Docker,
    [switch]$Test,
    [switch]$Help
)

if ($Help) {
    Write-Host "H3 Server 生产部署脚本" -ForegroundColor Green
    Write-Host ""
    Write-Host "用法: .\scripts\deploy.ps1 [选项]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "选项:" -ForegroundColor Yellow
    Write-Host "  -Build     构建生产版本"
    Write-Host "  -Docker    使用 Docker 部署"
    Write-Host "  -Test      运行测试"
    Write-Host "  -Help      显示此帮助信息"
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy.ps1 -Build    # 构建生产版本"
    Write-Host "  .\scripts\deploy.ps1 -Docker   # Docker 部署"
    Write-Host "  .\scripts\deploy.ps1 -Test     # 运行测试"
    exit 0
}

Write-Host "🚀 H3 Server 生产部署" -ForegroundColor Green

# 检查环境
if ($env:NODE_ENV -ne "production") {
    Write-Host "⚠️  当前不是生产环境，设置 NODE_ENV=production" -ForegroundColor Yellow
    $env:NODE_ENV = "production"
}

if ($Test) {
    Write-Host "🧪 运行测试..." -ForegroundColor Yellow
    bun run test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 测试失败，停止部署" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ 测试通过" -ForegroundColor Green
}

if ($Build) {
    Write-Host "🔨 构建生产版本..." -ForegroundColor Yellow
    
    # 清理旧的构建
    bun run clean
    
    # 安装生产依赖
    Write-Host "📦 安装生产依赖..." -ForegroundColor Yellow
    bun install --production
    
    # 类型检查
    Write-Host "🔍 类型检查..." -ForegroundColor Yellow
    bun run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 类型检查失败" -ForegroundColor Red
        exit 1
    }
    
    # 构建
    Write-Host "🏗️  构建应用..." -ForegroundColor Yellow
    bun run build:prod
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 构建失败" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ 构建完成" -ForegroundColor Green
}

if ($Docker) {
    Write-Host "🐳 Docker 部署..." -ForegroundColor Yellow
    
    # 构建 Docker 镜像
    Write-Host "🔨 构建 Docker 镜像..." -ForegroundColor Yellow
    docker build -f docker/Dockerfile -t server_h3 .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker 镜像构建失败" -ForegroundColor Red
        exit 1
    }
    
    # 启动服务
    Write-Host "🚀 启动 Docker 服务..." -ForegroundColor Yellow
    cd docker && docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker 服务启动失败" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Docker 部署完成" -ForegroundColor Green
    Write-Host "🌐 服务运行在: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "📝 查看日志: bun run docker:logs" -ForegroundColor Cyan
} else {
    Write-Host "💻 本地生产模式启动..." -ForegroundColor Yellow
    
    if (-not (Test-Path "dist/index.js")) {
        Write-Host "❌ 未找到构建文件，请先运行构建" -ForegroundColor Red
        Write-Host "💡 运行: .\scripts\deploy.ps1 -Build" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "🎯 启动生产服务器在 http://localhost:3000" -ForegroundColor Cyan
    bun run preview
}

Write-Host "🎉 部署完成！" -ForegroundColor Green
