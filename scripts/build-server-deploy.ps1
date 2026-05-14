<#
.SYNOPSIS
  构建阿里云服务器部署包
#>

param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverRoot = Join-Path $scriptRoot "..\server" | Resolve-Path
$buildDir = Join-Path $serverRoot "deploy"

function Build-Server {
  Write-Host "==> Compiling server..."
  Push-Location $serverRoot
  npm install --ignore-scripts 2>&1 | Out-Null
  npm run build 2>&1
  $ok = $LASTEXITCODE -eq 0
  Pop-Location
  if (-not $ok) { throw "Build failed" }
}

function Prune-NodeModules {
  Write-Host "==> Pruning node_modules (production only)..."
  Push-Location $serverRoot
  # Backup full node_modules
  $bak = Join-Path $serverRoot "node_modules.full"
  if (Test-Path $bak) { Remove-Item $bak -Recurse -Force }
  
  # Copy full node_modules to backup
  $nm = Join-Path $serverRoot "node_modules"
  if (Test-Path $nm) {
    Copy-Item $nm $bak -Recurse -Force
  }
  
  # Prune in-place: remove devDependencies
  npm prune --omit=dev 2>&1 | Out-Null
  Pop-Location
  return $bak
}

function Restore-NodeModules($bak) {
  if (-not (Test-Path $bak)) {
    Write-Host "  (no backup to restore)"
    return
  }
  Write-Host "==> Restoring full node_modules..."
  # Remove pruned version
  $nm = Join-Path $serverRoot "node_modules"
  if (Test-Path $nm) { Remove-Item $nm -Recurse -Force -ErrorAction SilentlyContinue }
  
  # Try rename first, fall back to copy + delete
  try {
    Rename-Item $bak "node_modules" -ErrorAction Stop
  } catch {
    Write-Host "  rename failed, copying instead..."
    Copy-Item $bak $nm -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Remove-Item $bak -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Get-InstallScript {
  $template = Join-Path $serverRoot "templates\install.ps1"
  return Get-Content $template -Raw -Encoding UTF8
}

# ─── Main ───
if (-not $SkipBuild) { Build-Server }

$bak = Prune-NodeModules

try {
  Write-Host "==> Creating deploy package..."
  if (Test-Path $buildDir) { Remove-Item $buildDir -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

  $pkg = Join-Path $buildDir "server"
  New-Item -ItemType Directory -Force -Path $pkg | Out-Null

  Copy-Item (Join-Path $serverRoot "dist") $pkg -Recurse -Force
  $nmDir = Join-Path $serverRoot "node_modules"
  if (Test-Path $nmDir) {
    Copy-Item $nmDir $pkg -Recurse -Force
  } else {
    Write-Host "  [WARN] node_modules not found, skipping"
  }
  Copy-Item (Join-Path $serverRoot "package.json") $pkg -Force

  # Install script
  Get-InstallScript | Set-Content (Join-Path $pkg "install.ps1") -Encoding UTF8 -NoNewline

  # .env
  $envSrc = Join-Path $serverRoot ".env"
  if (Test-Path $envSrc) { Copy-Item $envSrc $pkg -Force }

  # start script
  $startScr = Join-Path $serverRoot "start-sync-server.ps1"
  if (Test-Path $startScr) { Copy-Item $startScr $pkg -Force }

  # Zip
  Write-Host "==> Zipping..."
  $zip = Join-Path $buildDir "jinbang-server-deploy.zip"
  if (Test-Path $zip) { Remove-Item $zip -Force }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::CreateFromDirectory($pkg, $zip)

  Remove-Item $pkg -Recurse -Force

  $size = (Get-Item $zip).Length
  Write-Host ""
  Write-Host "=== Done ==="
  Write-Host ("  Package: {0}" -f $zip)
  Write-Host ("  Size: {0:F2} MB" -f ($size / 1MB))
  Write-Host ""
  Write-Host "Upload with:"
  $scpCmd = "scp " + $zip + " Administrator@118.178.109.63:C:\Temp\"
  Write-Host ("  " + $scpCmd)
  Write-Host "  (or run scripts\sync-aliyun-server.ps1)"
} finally {
  Restore-NodeModules $bak
}
