# PowerShell 开发启动脚本
param(
    [switch]$Docker,
    [switch]$Clean,
    [switch]$Install,
    [switch]$DB,
    [switch]$Help
)

if ($Help) {
    Write-Host "H3 Server 开发脚本" -ForegroundColor Green
    Write-Host ""
    Write-Host "用法: .\scripts\dev.ps1 [选项]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "选项:" -ForegroundColor Yellow
    Write-Host "  -Docker    使用 Docker 启动开发环境"
    Write-Host "  -Clean     清理缓存和依赖后重新安装"
    Write-Host "  -Install   只安装依赖"
    Write-Host "  -DB        启动数据库服务"
    Write-Host "  -Help      显示此帮助信息"
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\scripts\dev.ps1              # 启动开发服务器"
    Write-Host "  .\scripts\dev.ps1 -Docker      # 使用 Docker 启动"
    Write-Host "  .\scripts\dev.ps1 -Clean       # 清理后启动"
    Write-Host "  .\scripts\dev.ps1 -DB          # 只启动数据库"
    exit 0
}

Write-Host "🚀 H3 Server 开发环境启动" -ForegroundColor Green

# 检查 .env 文件
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  未找到 .env 文件，从 .env.example 复制..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ 已创建 .env 文件，请根据需要修改配置" -ForegroundColor Green
}

if ($Clean) {
    Write-Host "🧹 清理缓存和依赖..." -ForegroundColor Yellow
    bun run clean
    bun run install:clean
}

if ($Install) {
    Write-Host "📦 安装依赖..." -ForegroundColor Yellow
    bun install
    exit 0
}

if ($DB) {
    Write-Host "🗄️  启动数据库服务..." -ForegroundColor Yellow
    docker-compose up -d db redis
    Write-Host "✅ 数据库服务已启动" -ForegroundColor Green
    exit 0
}

if ($Docker) {
    Write-Host "🐳 使用 Docker 启动开发环境..." -ForegroundColor Yellow
    bun run docker:up:dev
    Write-Host "✅ Docker 开发环境已启动" -ForegroundColor Green
    Write-Host "📝 查看日志: bun run docker:logs" -ForegroundColor Cyan
} else {
    Write-Host "💻 启动本地开发服务器..." -ForegroundColor Yellow
    
    # 检查依赖
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 安装依赖..." -ForegroundColor Yellow
        bun install
    }
    
    # 启动开发服务器
    Write-Host "🎯 启动服务器在 http://localhost:3000" -ForegroundColor Cyan
    bun run dev
}
