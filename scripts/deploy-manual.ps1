# 手动部署脚本
# 在阿里云服务器上以管理员身份运行此脚本

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  晋梆智绎 - 手动部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 配置
$sourceZip = "C:\inetpub\wwwroot\dist-deploy.zip"
$targetDir = "C:\inetpub\wwwroot"
$backupDir = "C:\inetpub\wwwroot-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# 检查文件是否存在
if (-not (Test-Path $sourceZip)) {
    Write-Host "错误: 找不到部署包 $sourceZip" -ForegroundColor Red
    Write-Host "请先将 dist-deploy.zip 上传到 $targetDir" -ForegroundColor Yellow
    exit 1
}

Write-Host "1. 创建备份..." -ForegroundColor Green
if (Test-Path "$targetDir\index.html") {
    Copy-Item -Path $targetDir -Destination $backupDir -Recurse -Force
    Write-Host "   备份已创建: $backupDir" -ForegroundColor Gray
}

Write-Host "2. 清理旧文件..." -ForegroundColor Green
$exclude = @('dist-deploy.zip', 'web.config', 'downloads')
Get-ChildItem $targetDir -Exclude $exclude | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "3. 解压新文件..." -ForegroundColor Green
Expand-Archive -Path $sourceZip -DestinationPath $targetDir -Force

Write-Host "4. 清理部署包..." -ForegroundColor Green
Remove-Item $sourceZip -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  部署完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Cyan
Write-Host "  http://47.99.168.47/" -ForegroundColor White
Write-Host "  https://jinbangzhiyi.online/" -ForegroundColor White
Write-Host ""
Write-Host "API 地址:" -ForegroundColor Cyan
Write-Host "  http://47.99.168.47:3001/" -ForegroundColor White
Write-Host ""
