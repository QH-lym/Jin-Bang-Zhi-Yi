# install.ps1 - 阿里云服务器一键安装脚本
# 由 build-server-deploy.ps1 自动打包，部署时直接运行

$ErrorActionPreference = 'Stop'
$ServerDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==> 安装阿里云同步服务器..."

# 停止旧进程
$existing = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
foreach ($conn in $existing) {
  Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
  Write-Host "  已停止旧进程 PID $($conn.OwningProcess)"
}

# 确保上传目录存在
$uploadsDir = Join-Path $ServerDir "uploads"
New-Item -ItemType Directory -Force -Path $uploadsDir | Out-Null

# 启动服务
$logDir = Join-Path $ServerDir "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$outLog = Join-Path $logDir "server.out.log"
$errLog = Join-Path $logDir "server.err.log"

$env:PORT = '3001'
$env:SYNC_STORE_PATH = Join-Path $ServerDir "data\sync-store.json"

Start-Process -FilePath 'node' -ArgumentList @('dist/index.js') -WorkingDirectory $ServerDir `
  -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog

Start-Sleep -Seconds 3
$health = Invoke-RestMethod -Uri "http://localhost:3001/health" -ErrorAction SilentlyContinue
if ($health) {
  Write-Host "  服务已启动: http://localhost:3001/health"
  Write-Host "  OSS 状态: $($health.storage)"
} else {
  Write-Host "  [警告] 服务启动后健康检查未通过，请查看日志: $errLog"
}
