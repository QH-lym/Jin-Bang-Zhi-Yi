# 安装 ARR 和 URL Rewrite 模块
# 在阿里云服务器上以管理员身份运行

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  安装 IIS ARR 和 URL Rewrite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "错误: 请以管理员身份运行此脚本" -ForegroundColor Red
    exit 1
}

# 创建临时目录
$tempDir = "$env:TEMP\iis-modules"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# 1. 下载并安装 Web Platform Installer (WebPI)
Write-Host "1. 检查 Web Platform Installer..." -ForegroundColor Green
$webPiPath = "${env:ProgramFiles}\Microsoft\Web Platform Installer\WebPlatformInstaller.exe"
if (-not (Test-Path $webPiPath)) {
    Write-Host "   下载 Web Platform Installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://go.microsoft.com/fwlink/?LinkId=287166" -OutFile "$tempDir\WebPlatformInstaller_amd64_en-US.msi"
    Write-Host "   安装 Web Platform Installer..." -ForegroundColor Yellow
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", "$tempDir\WebPlatformInstaller_amd64_en-US.msi", "/quiet", "/norestart" -Wait
    Write-Host "   ✓ Web Platform Installer 安装完成" -ForegroundColor Gray
} else {
    Write-Host "   ✓ Web Platform Installer 已存在" -ForegroundColor Gray
}

# 2. 直接下载安装 ARR
Write-Host "2. 安装 Application Request Routing (ARR)..." -ForegroundColor Green
$arrUrl = "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi"
$arrInstaller = "$tempDir\requestRouter_amd64.msi"

if (-not (Test-Path "$env:SystemRoot\System32\inetsrv\arr.dll")) {
    Write-Host "   下载 ARR..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $arrUrl -OutFile $arrInstaller
    Write-Host "   安装 ARR..." -ForegroundColor Yellow
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $arrInstaller, "/quiet", "/norestart" -Wait
    Write-Host "   ✓ ARR 安装完成" -ForegroundColor Gray
} else {
    Write-Host "   ✓ ARR 已安装" -ForegroundColor Gray
}

# 3. 下载并安装 URL Rewrite
Write-Host "3. 安装 URL Rewrite..." -ForegroundColor Green
$rewriteUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-E585A6FBB904/rewrite_amd64_en-US.msi"
$rewriteInstaller = "$tempDir\rewrite_amd64_en-US.msi"

if (-not (Test-Path "$env:SystemRoot\System32\inetsrv\rewrite.dll")) {
    Write-Host "   下载 URL Rewrite..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $rewriteUrl -OutFile $rewriteInstaller
    Write-Host "   安装 URL Rewrite..." -ForegroundColor Yellow
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $rewriteInstaller, "/quiet", "/norestart" -Wait
    Write-Host "   ✓ URL Rewrite 安装完成" -ForegroundColor Gray
} else {
    Write-Host "   ✓ URL Rewrite 已安装" -ForegroundColor Gray
}

# 4. 启用 ARR 代理
Write-Host "4. 启用 ARR 代理..." -ForegroundColor Green
Import-Module WebAdministration -ErrorAction SilentlyContinue

# 等待模块加载
Start-Sleep -Seconds 2

try {
    # 检查配置节是否存在
    $section = Get-WebConfiguration -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/proxy' -ErrorAction SilentlyContinue
    if ($section) {
        Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/proxy' -Name 'enabled' -Value $true
        Write-Host "   ✓ ARR 代理已启用" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ 配置节不存在，尝试使用 appcmd..." -ForegroundColor Yellow
        $appCmd = "${env:SystemRoot}\System32\inetsrv\appcmd.exe"
        if (Test-Path $appCmd) {
            & $appCmd set config -section:system.webServer/proxy /enabled:"True" /commit:apphost
            Write-Host "   ✓ ARR 代理已启用 (appcmd)" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ⚠ 启用代理时出错: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   请手动在 IIS 管理器中启用: 服务器节点 -> Application Request Routing -> Server Proxy Settings -> Enable proxy" -ForegroundColor Yellow
}

# 5. 重启 IIS
Write-Host "5. 重启 IIS..." -ForegroundColor Green
iisreset /restart
Write-Host "   ✓ IIS 已重启" -ForegroundColor Gray

# 6. 验证安装
Write-Host "6. 验证安装..." -ForegroundColor Green
$arrExists = Test-Path "$env:SystemRoot\System32\inetsrv\arr.dll"
$rewriteExists = Test-Path "$env:SystemRoot\System32\inetsrv\rewrite.dll"

Write-Host "   ARR: $(if($arrExists){'✓ 已安装'}else{'✗ 未安装'})" -ForegroundColor $(if($arrExists){'Green'}else{'Red'})
Write-Host "   URL Rewrite: $(if($rewriteExists){'✓ 已安装'}else{'✗ 未安装'})" -ForegroundColor $(if($rewriteExists){'Green'}else{'Red'})

# 清理临时文件
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($arrExists -and $rewriteExists) {
    Write-Host "安装成功!" -ForegroundColor Green
} else {
    Write-Host "安装可能有问题，请检查" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步: 运行 iis-config-step2.ps1 配置反向代理" -ForegroundColor Yellow
Write-Host ""
