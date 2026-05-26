# IIS 反向代理配置 - 步骤2
# 前提：证书已导入，后端服务运行在 localhost:3001

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IIS 反向代理配置" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "错误: 请以管理员身份运行此脚本" -ForegroundColor Red
    exit 1
}

# 1. 启用 ARR 代理
Write-Host "1. 启用 ARR 代理..." -ForegroundColor Green
Import-Module WebAdministration -ErrorAction SilentlyContinue

$proxyEnabled = Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/proxy' -Name 'enabled' -ErrorAction SilentlyContinue
if ($proxyEnabled -ne $true) {
    Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/proxy' -Name 'enabled' -Value $true
    Write-Host "   ✓ ARR 代理已启用" -ForegroundColor Gray
} else {
    Write-Host "   ✓ ARR 代理已是启用状态" -ForegroundColor Gray
}

# 2. 创建 API 代理目录
Write-Host "2. 创建 API 代理目录..." -ForegroundColor Green
$apiPath = "C:\inetpub\wwwroot\api-proxy"
if (-not (Test-Path $apiPath)) {
    New-Item -ItemType Directory -Path $apiPath -Force | Out-Null
    Write-Host "   ✓ 目录已创建: $apiPath" -ForegroundColor Gray
} else {
    Write-Host "   ✓ 目录已存在" -ForegroundColor Gray
}

# 3. 创建 web.config 反向代理配置
Write-Host "3. 配置反向代理规则..." -ForegroundColor Green

$webConfigContent = @'<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyToNodeJS" stopProcessing="true">
          <match url="^(.*)" />
          <action type="Rewrite" url="http://localhost:3001/{R:1}" />
        </rule>
      </rules>
      <outboundRules>
        <rule name="AddCORSHeaders">
          <match serverVariable="RESPONSE_Access_Control_Allow_Origin" pattern=".*" />
          <action type="Rewrite" value="*" />
        </rule>
      </outboundRules>
    </rewrite>
    <httpProtocol>
      <customHeaders>
        <add name="Access-Control-Allow-Origin" value="*" />
        <add name="Access-Control-Allow-Methods" value="GET,POST,PUT,DELETE,OPTIONS" />
        <add name="Access-Control-Allow-Headers" value="Content-Type,Authorization,X-Requested-With" />
        <add name="Access-Control-Allow-Credentials" value="true" />
      </customHeaders>
    </httpProtocol>
    <directoryBrowse enabled="false" />
  </system.webServer>
</configuration>
'@

$webConfigPath = Join-Path $apiPath "web.config"
$webConfigContent | Out-File -FilePath $webConfigPath -Encoding UTF8 -Force
Write-Host "   ✓ web.config 已创建" -ForegroundColor Gray

# 4. 创建或更新网站
Write-Host "4. 配置网站..." -ForegroundColor Green
$siteName = "jinbang-api"
$hostName = "api.jinbangzhiyi.online"

# 获取证书
$cert = Get-ChildItem "Cert:\LocalMachine\My" | Where-Object { 
    $_.Subject -like "*jinbangzhiyi.online*" -or $_.DnsNameList -match "jinbangzhiyi.online" 
} | Select-Object -First 1

if (-not $cert) {
    Write-Host "   ⚠ 未找到 jinbangzhiyi.online 证书，请确保证书已导入到本地计算机-个人存储" -ForegroundColor Yellow
    Write-Host "   当前可用证书:" -ForegroundColor Gray
    Get-ChildItem "Cert:\LocalMachine\My" | Select-Object Subject, Thumbprint | Format-Table -AutoSize
    exit 1
}

Write-Host "   找到证书: $($cert.Subject)" -ForegroundColor Gray
Write-Host "   证书指纹: $($cert.Thumbprint)" -ForegroundColor Gray

# 检查网站是否存在
$site = Get-Website -Name $siteName -ErrorAction SilentlyContinue
if (-not $site) {
    # 创建新网站
    New-Website -Name $siteName -PhysicalPath $apiPath -Port 443 -HostHeader $hostName -Ssl | Out-Null
    Write-Host "   ✓ 网站已创建: $siteName" -ForegroundColor Gray
} else {
    Write-Host "   ✓ 网站已存在: $siteName" -ForegroundColor Gray
    # 更新物理路径
    Set-ItemProperty "IIS:\Sites\$siteName" -Name physicalPath -Value $apiPath
}

# 5. 绑定证书
Write-Host "5. 绑定 SSL 证书..." -ForegroundColor Green

# 删除现有 HTTPS 绑定
Get-WebBinding -Name $siteName -Protocol "https" -ErrorAction SilentlyContinue | Remove-WebBinding

# 添加新的 HTTPS 绑定并关联证书
New-WebBinding -Name $siteName -Protocol "https" -Port 443 -HostHeader $hostName -SslFlags 1 | Out-Null

# 使用 netsh 绑定证书
$appId = "{00112233-4455-6677-8899-AABBCCDDEEFF}"
$deleteCmd = "netsh http delete sslcert ipport=0.0.0.0:443"
$addCmd = "netsh http add sslcert ipport=0.0.0.0:443 certhash=$($cert.Thumbprint) appid=$appId"

Invoke-Expression $deleteCmd 2>&1 | Out-Null
$result = Invoke-Expression $addCmd 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ SSL 证书已绑定到 0.0.0.0:443" -ForegroundColor Gray
} else {
    Write-Host "   ⚠ 证书绑定可能有问题: $result" -ForegroundColor Yellow
}

# 6. 配置应用程序池
Write-Host "6. 配置应用程序池..." -ForegroundColor Green
$appPoolName = $siteName
$appPool = Get-IISAppPool -Name $appPoolName -ErrorAction SilentlyContinue
if (-not $appPool) {
    New-Item -Path "IIS:\AppPools\$appPoolName" -Force | Out-Null
    Set-ItemProperty -Path "IIS:\AppPools\$appPoolName" -Name "managedRuntimeVersion" -Value ""
    Write-Host "   ✓ 应用程序池已创建" -ForegroundColor Gray
}

# 设置网站使用应用程序池
Set-ItemProperty "IIS:\Sites\$siteName" -Name applicationPool -Value $appPoolName

# 7. 重启网站
Write-Host "7. 重启网站..." -ForegroundColor Green
Stop-Website -Name $siteName -ErrorAction SilentlyContinue
Start-Website -Name $siteName
Write-Host "   ✓ 网站已重启" -ForegroundColor Gray

# 8. 测试配置
Write-Host "8. 测试配置..." -ForegroundColor Green
Start-Sleep -Seconds 2

try {
    $response = Invoke-WebRequest -Uri "https://api.jinbangzhiyi.online/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ HTTPS 连接测试成功!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ 返回状态码: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠ HTTPS 测试失败: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   请确保后端服务已启动: npm start (在 server 目录)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "配置完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API 地址: https://api.jinbangzhiyi.online/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "1. 确保后端服务在运行: cd server && npm start" -ForegroundColor White
Write-Host "2. 修改前端 .env: VITE_CLOUD_API_BASE=https://api.jinbangzhiyi.online/api" -ForegroundColor White
Write-Host "3. 重新构建并部署前端" -ForegroundColor White
Write-Host ""
