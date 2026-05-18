# IIS SSL 反向代理配置脚本
# 将 HTTPS 请求转发到后端 HTTP 服务

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IIS SSL 反向代理配置" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "错误: 请以管理员身份运行此脚本" -ForegroundColor Red
    exit 1
}

# 1. 安装 ARR (Application Request Routing) 和 URL Rewrite
Write-Host "1. 检查 ARR 和 URL Rewrite 模块..." -ForegroundColor Green

$arrInstalled = Test-Path "$env:SystemRoot\System32\inetsrv\arr.dll"
$rewriteInstalled = Test-Path "$env:SystemRoot\System32\inetsrv\rewrite.dll"

if (-not $arrInstalled) {
    Write-Host "   正在下载 ARR..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi" -OutFile "$env:TEMP\requestRouter_amd64.msi"
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", "$env:TEMP\requestRouter_amd64.msi", "/quiet", "/norestart" -Wait
    Write-Host "   ✓ ARR 安装完成" -ForegroundColor Gray
}

if (-not $rewriteInstalled) {
    Write-Host "   正在下载 URL Rewrite..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-E585A6FBB904/rewrite_amd64_en-US.msi" -OutFile "$env:TEMP\rewrite_amd64_en-US.msi"
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", "$env:TEMP\rewrite_amd64_en-US.msi", "/quiet", "/norestart" -Wait
    Write-Host "   ✓ URL Rewrite 安装完成" -ForegroundColor Gray
}

# 2. 启用代理
Write-Host "2. 启用 ARR 代理..." -ForegroundColor Green
Import-Module WebAdministration
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/proxy' -Name 'enabled' -Value $true
Write-Host "   ✓ ARR 代理已启用" -ForegroundColor Gray

# 3. 创建后端网站（如果还没有）
Write-Host "3. 配置后端网站..." -ForegroundColor Green
$backendSiteName = "jinbang-api"
$backendPort = 3001

if (-not (Get-Website -Name $backendSiteName -ErrorAction SilentlyContinue)) {
    # 创建一个空目录用于后端站点
    $backendPath = "C:\inetpub\wwwroot\api-proxy"
    if (-not (Test-Path $backendPath)) {
        New-Item -ItemType Directory -Path $backendPath -Force | Out-Null
    }
    
    # 创建网站
    New-Website -Name $backendSiteName -PhysicalPath $backendPath -Port 443 -HostHeader "api.jinbangzhiyi.online" -Ssl -SslFlags 1 | Out-Null
    Write-Host "   ✓ 后端网站已创建" -ForegroundColor Gray
}

# 4. 配置 URL Rewrite 规则
Write-Host "4. 配置反向代理规则..." -ForegroundColor Green

$rewriteConfig = @"
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyToNodeJS" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{CACHE_URL}" pattern="^https://" />
          </conditions>
          <action type="Rewrite" url="http://localhost:3001/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    <httpProtocol>
      <customHeaders>
        <add name="Access-Control-Allow-Origin" value="*" />
        <add name="Access-Control-Allow-Methods" value="GET,POST,PUT,DELETE,OPTIONS" />
        <add name="Access-Control-Allow-Headers" value="Content-Type,Authorization" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
"@

$webConfigPath = "C:\inetpub\wwwroot\api-proxy\web.config"
$rewriteConfig | Out-File -FilePath $webConfigPath -Encoding UTF8
Write-Host "   ✓ 反向代理规则已配置" -ForegroundColor Gray

# 5. 绑定证书
Write-Host "5. 绑定 SSL 证书..." -ForegroundColor Green
$cert = Get-ChildItem "Cert:\LocalMachine\My" | Where-Object { $_.Subject -like "*jinbangzhiyi.online*" } | Select-Object -First 1
if ($cert) {
    $binding = Get-WebBinding -Name $backendSiteName -Protocol "https" -ErrorAction SilentlyContinue
    if (-not $binding) {
        New-WebBinding -Name $backendSiteName -Protocol "https" -Port 443 -HostHeader "api.jinbangzhiyi.online" -SslFlags 1 | Out-Null
    }
    
    # 绑定证书
    $bindingInfo = "*:443:api.jinbangzhiyi.online"
    $cmd = "netsh http add sslcert ipport=0.0.0.0:443 certhash=$($cert.Thumbprint) appid=`{00112233-4455-6677-8899-AABBCCDDEEFF`}"
    Invoke-Expression $cmd 2>&1 | Out-Null
    Write-Host "   ✓ SSL 证书已绑定" -ForegroundColor Gray
} else {
    Write-Host "   ⚠ 未找到 jinbangzhiyi.online 证书，请手动绑定" -ForegroundColor Yellow
}

# 6. 重启 IIS
Write-Host "6. 重启 IIS..." -ForegroundColor Green
iisreset /restart | Out-Null
Write-Host "   ✓ IIS 已重启" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "配置完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API 地址: https://api.jinbangzhiyi.online/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "请修改前端 .env 文件：" -ForegroundColor Yellow
Write-Host "VITE_CLOUD_API_BASE=https://api.jinbangzhiyi.online/api" -ForegroundColor White
Write-Host ""
Write-Host "然后重新构建并部署前端。" -ForegroundColor Yellow
