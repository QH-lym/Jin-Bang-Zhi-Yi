# 安装 ARR 和 URL Rewrite 模块 - 更新版
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

# 1. 下载并安装 ARR 3.0
Write-Host "1. 安装 Application Request Routing (ARR) 3.0..." -ForegroundColor Green
$arrUrl = "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi"
$arrInstaller = "$tempDir\requestRouter_amd64.msi"

if (-not (Test-Path "$env:SystemRoot\System32\inetsrv\arr.dll")) {
    try {
        Write-Host "   下载 ARR..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $arrUrl -OutFile $arrInstaller -TimeoutSec 60
        Write-Host "   安装 ARR..." -ForegroundColor Yellow
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $arrInstaller, "/quiet", "/norestart" -Wait
        Write-Host "   ✓ ARR 安装完成" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ ARR 下载失败，请手动下载安装:" -ForegroundColor Red
        Write-Host "   $arrUrl" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✓ ARR 已安装" -ForegroundColor Green
}

# 2. 下载并安装 URL Rewrite 2.1
Write-Host "2. 安装 URL Rewrite 2.1..." -ForegroundColor Green

# 尝试多个下载地址
$rewriteUrls = @(
    "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-E585A6FBB904/rewrite_amd64_en-US.msi",
    "https://download.microsoft.com/download/D/8/1/D81E5DD6-7729-4D8E-BA72-348C6E2B3C9E/rewrite_amd64_en-US.msi",
    "https://download.microsoft.com/download/6/9/D/69D1E74D-4E46-4B74-9B77-DA5F0E2F9C7B/rewrite_amd64_en-US.msi"
)

$rewriteInstalled = $false
if (-not (Test-Path "$env:SystemRoot\System32\inetsrv\rewrite.dll")) {
    foreach ($url in $rewriteUrls) {
        $rewriteInstaller = "$tempDir\rewrite_amd64_en-US.msi"
        try {
            Write-Host "   尝试下载: $url" -ForegroundColor Yellow
            Invoke-WebRequest -Uri $url -OutFile $rewriteInstaller -TimeoutSec 30
            Write-Host "   安装 URL Rewrite..." -ForegroundColor Yellow
            Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $rewriteInstaller, "/quiet", "/norestart" -Wait
            Write-Host "   ✓ URL Rewrite 安装完成" -ForegroundColor Green
            $rewriteInstalled = $true
            break
        } catch {
            Write-Host "   下载失败，尝试下一个地址..." -ForegroundColor Gray
            continue
        }
    }
    
    if (-not $rewriteInstalled) {
        Write-Host "   ✗ 所有下载地址都失败" -ForegroundColor Red
        Write-Host "   请手动下载 URL Rewrite 2.1:" -ForegroundColor Yellow
        Write-Host "   https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ✓ URL Rewrite 已安装" -ForegroundColor Green
    $rewriteInstalled = $true
}

# 3. 验证安装并启用代理
Write-Host "3. 验证安装..." -ForegroundColor Green
Start-Sleep -Seconds 2

$arrExists = Test-Path "$env:SystemRoot\System32\inetsrv\arr.dll"
$rewriteExists = Test-Path "$env:SystemRoot\System32\inetsrv\rewrite.dll"

Write-Host "   ARR: $(if($arrExists){'✓ 已安装'}else{'✗ 未安装'})" -ForegroundColor $(if($arrExists){'Green'}else{'Red'})
Write-Host "   URL Rewrite: $(if($rewriteExists){'✓ 已安装'}else{'✗ 未安装'})" -ForegroundColor $(if($rewriteExists){'Green'}else{'Red'})

# 4. 启用 ARR 代理
if ($arrExists) {
    Write-Host "4. 启用 ARR 代理..." -ForegroundColor Green
    Import-Module WebAdministration -ErrorAction SilentlyContinue
    
    try {
        # 使用 appcmd 启用代理
        $appCmd = "$env:SystemRoot\System32\inetsrv\appcmd.exe"
        if (Test-Path $appCmd) {
            & $appCmd set config -section:system.webServer/proxy /enabled:"True" /commit:apphost 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✓ ARR 代理已启用" -ForegroundColor Green
            } else {
                Write-Host "   ⚠ 启用代理失败，请手动启用" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "   ⚠ 启用代理时出错: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# 5. 重启 IIS
Write-Host "5. 重启 IIS..." -ForegroundColor Green
iisreset /restart | Out-Null
Write-Host "   ✓ IIS 已重启" -ForegroundColor Gray

# 清理临时文件
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($arrExists -and $rewriteExists) {
    Write-Host "安装成功!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "下一步: 运行 iis-config-step2.ps1 配置反向代理" -ForegroundColor Yellow
} else {
    Write-Host "部分组件未安装成功" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    if (-not $arrExists) {
        Write-Host "ARR 下载地址: https://www.iis.net/downloads/microsoft/application-request-routing" -ForegroundColor Cyan
    }
    if (-not $rewriteExists) {
        Write-Host "URL Rewrite 下载地址: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Cyan
    }
}
Write-Host ""
