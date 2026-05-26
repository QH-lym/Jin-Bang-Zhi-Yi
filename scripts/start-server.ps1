# 晋梆智绎后端服务启动脚本
# 在阿里云服务器上以管理员身份运行

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  晋梆智绎 - 后端服务启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 配置
$serverDir = "C:\inetpub\wwwroot\jinbang-sync-server"
$port = 3001

# 检查目录是否存在
if (-not (Test-Path $serverDir)) {
    Write-Host "错误: 找不到服务器目录 $serverDir" -ForegroundColor Red
    Write-Host "请确认后端代码已部署到该目录" -ForegroundColor Yellow
    exit 1
}

Write-Host "1. 切换到服务器目录..." -ForegroundColor Green
Set-Location $serverDir

Write-Host "2. 检查 Node.js..." -ForegroundColor Green
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Node.js 未安装" -ForegroundColor Red
    exit 1
}
Write-Host "   Node.js 版本: $nodeVersion" -ForegroundColor Gray

Write-Host "3. 安装依赖（如果需要）..." -ForegroundColor Green
if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "错误: 依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host "4. 检查端口 $port 是否被占用..." -ForegroundColor Green
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "   端口 $port 被占用，尝试关闭占用进程..." -ForegroundColor Yellow
    $processId = $portInUse.OwningProcess
    Stop-Process -Id $processId -Force
    Write-Host "   已关闭进程 $processId" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

Write-Host "5. 启动后端服务..." -ForegroundColor Green
Write-Host "   服务地址: http://118.178.109.63:$port" -ForegroundColor Cyan
Write-Host "   按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""

# 启动服务
npm start
