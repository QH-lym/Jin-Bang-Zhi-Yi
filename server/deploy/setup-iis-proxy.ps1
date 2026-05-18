#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Configure IIS Reverse Proxy - Forward /api to localhost:3001
.DESCRIPTION
    This script configures IIS URL Rewrite and ARR for HTTPS domain access to backend API
.NOTES
    Run in Administrator PowerShell
#>

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IIS Reverse Proxy Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check admin rights
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "Please run this script as Administrator!"
    exit 1
}

# Config parameters
$SiteName = "jinbangzhiyi.online"
$WebConfigPath = Join-Path $PSScriptRoot "web.config"

# Check web.config exists
if (-not (Test-Path $WebConfigPath)) {
    Write-Error "web.config not found. Make sure it is in the same directory as this script."
    exit 1
}

Write-Host "[1/4] Checking IIS modules..." -ForegroundColor Yellow

# Check URL Rewrite module
$rewriteModule = Get-ChildItem "HKLM:\SOFTWARE\Microsoft\IIS Extensions" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -like "*rewrite*" }

if (-not $rewriteModule) {
    Write-Warning "URL Rewrite module not installed. Please install rewrite_amd64_en-US.msi first."
    exit 1
}
Write-Host "      [OK] URL Rewrite module installed" -ForegroundColor Green

# Check ARR module
$arrModule = Get-ChildItem "HKLM:\SOFTWARE\Microsoft\IIS Extensions" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -like "*ApplicationRequestRouting*" }

if (-not $arrModule) {
    Write-Warning "ARR module not installed. Please install requestRouter_amd64.msi first."
    exit 1
}
Write-Host "      [OK] ARR module installed" -ForegroundColor Green

Write-Host ""
Write-Host "[2/4] Enabling ARR proxy..." -ForegroundColor Yellow

# Enable ARR proxy
Import-Module WebAdministration -ErrorAction SilentlyContinue

$arrConfigPath = "MACHINE/WEBROOT/APPHOST"
try {
    $section = Get-WebConfigurationProperty -PSPath $arrConfigPath -Filter "system.webServer/proxy" -Name "." -ErrorAction SilentlyContinue
    if ($section) {
        Set-WebConfigurationProperty -PSPath $arrConfigPath -Filter "system.webServer/proxy" -Name "enabled" -Value "True"
        Write-Host "      [OK] ARR proxy enabled" -ForegroundColor Green
    }
} catch {
    Write-Warning "Could not enable ARR proxy via PowerShell. Please enable manually in IIS Manager."
}

Write-Host ""
Write-Host "[3/4] Configuring URL rewrite rules..." -ForegroundColor Yellow

# Get website path
$site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if (-not $site) {
    Write-Error "Website '$SiteName' not found. Please check the site name."
    exit 1
}

$sitePath = $site.PhysicalPath
Write-Host "      Site path: $sitePath" -ForegroundColor Gray

# Backup existing web.config
$existingConfig = Join-Path $sitePath "web.config"
if (Test-Path $existingConfig) {
    $backupPath = Join-Path $sitePath "web.config.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
    Copy-Item $existingConfig $backupPath -Force
    Write-Host "      [OK] Backed up original web.config to $backupPath" -ForegroundColor Green
}

# Copy new web.config
Copy-Item $WebConfigPath $existingConfig -Force
Write-Host "      [OK] Applied new web.config" -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] Restarting IIS..." -ForegroundColor Yellow

iisreset /restart | Out-Null
Write-Host "      [OK] IIS restarted" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please verify the following URLs:" -ForegroundColor Yellow
Write-Host "  - https://jinbangzhiyi.online/health" -ForegroundColor Cyan
Write-Host "  - https://jinbangzhiyi.online/api/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Make sure backend service is running on localhost:3001" -ForegroundColor Yellow
Write-Host ""

# Test connection
Write-Host "Testing connection..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "      [OK] Backend service (localhost:3001) is running" -ForegroundColor Green
    }
} catch {
    Write-Warning "Backend service (localhost:3001) is not running. Please start the service first."
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
