$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$Port = if ($env:PORT) { $env:PORT } else { '3001' }
$LogDir = Join-Path $Root 'logs'
$OutLog = Join-Path $LogDir 'sync-server.out.log'
$ErrLog = Join-Path $LogDir 'sync-server.err.log'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root 'data') | Out-Null

Write-Host "Installing dependencies..."
npm install

Write-Host "Building server..."
npm run build

Write-Host "Opening Windows Firewall port $Port..."
try {
  $ruleName = "JinBang Sync Server $Port"
  if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port | Out-Null
  }
} catch {
  Write-Warning "Could not add firewall rule automatically. Run PowerShell as Administrator or open TCP port $Port manually."
}

Write-Host "Stopping existing server on port $Port if found..."
try {
  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  foreach ($connection in $connections) {
    Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
  }
} catch {
  Write-Warning "Could not stop existing process on port $Port."
}

Write-Host "Starting sync server on port $Port..."
$env:PORT = $Port
Start-Process -FilePath 'node' -ArgumentList @('dist/index.js') -WorkingDirectory $Root -WindowStyle Hidden -RedirectStandardOutput $OutLog -RedirectStandardError $ErrLog

Start-Sleep -Seconds 3

Write-Host "Checking health..."
$healthUrl = "http://localhost:$Port/health"
$health = Invoke-RestMethod -Uri $healthUrl

Write-Host "Sync server is running:"
Write-Host "  Local:  $healthUrl"
Write-Host "  Public: http://118.178.109.63:$Port/health"
Write-Host "Data file:"
Write-Host "  $(Join-Path $Root 'data\sync-store.json')"
