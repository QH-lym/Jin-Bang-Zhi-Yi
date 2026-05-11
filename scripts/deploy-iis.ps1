param(
  [string]$SiteName = "jin-bang-zhi-yi",
  [string]$AppPoolName = "jin-bang-zhi-yi",
  [string]$SourcePath = (Join-Path $PSScriptRoot "..\dist"),
  [string]$PhysicalPath = "C:\inetpub\wwwroot\jin-bang-zhi-yi",
  [int]$Port = 80,
  [string]$HostName = "",
  [switch]$Build,
  [switch]$InstallIIS
)

$ErrorActionPreference = "Stop"

function Assert-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Please run this script in an elevated PowerShell session."
  }
}

function Invoke-Robocopy {
  param(
    [string]$From,
    [string]$To
  )

  robocopy $From $To /E /NFL /NDL /NJH /NJS /NP
  $code = $LASTEXITCODE
  if ($code -gt 7) {
    throw "robocopy failed with exit code $code."
  }
  $global:LASTEXITCODE = 0
}

Assert-Admin

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

if ($Build) {
  Push-Location $repoRoot
  try {
    npm ci
    npm run build
  } finally {
    Pop-Location
  }
}

$resolvedSource = Resolve-Path $SourcePath
if (-not (Test-Path (Join-Path $resolvedSource "index.html"))) {
  throw "Build output not found at $resolvedSource. Run npm run build first, or pass -Build."
}

if ($InstallIIS) {
  if (Get-Command Install-WindowsFeature -ErrorAction SilentlyContinue) {
    Install-WindowsFeature Web-Server, Web-Static-Content, Web-Default-Doc, Web-Http-Errors, Web-Http-Redirect, Web-Filtering, Web-Stat-Compression, Web-Mgmt-Console -IncludeManagementTools | Out-Null
  } else {
    throw "Install-WindowsFeature is unavailable. Install IIS manually, then rerun without -InstallIIS."
  }
}

Import-Module WebAdministration

New-Item -ItemType Directory -Path $PhysicalPath -Force | Out-Null
Invoke-Robocopy -From $resolvedSource -To $PhysicalPath

icacls $PhysicalPath /grant "IIS_IUSRS:(OI)(CI)RX" /T | Out-Null

if (-not (Test-Path "IIS:\AppPools\$AppPoolName")) {
  New-WebAppPool -Name $AppPoolName | Out-Null
}
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ""
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name managedPipelineMode -Value "Integrated"

$site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if ($site) {
  Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value $PhysicalPath
  Set-ItemProperty "IIS:\Sites\$SiteName" -Name applicationPool -Value $AppPoolName
} else {
  New-Website -Name $SiteName -PhysicalPath $PhysicalPath -Port $Port -HostHeader $HostName -ApplicationPool $AppPoolName | Out-Null
}

$bindingInfo = if ($HostName) { "*:${Port}:${HostName}" } else { "*:${Port}:" }
$binding = Get-WebBinding -Name $SiteName -Protocol "http" | Where-Object { $_.bindingInformation -eq $bindingInfo }
if (-not $binding) {
  New-WebBinding -Name $SiteName -Protocol "http" -Port $Port -HostHeader $HostName | Out-Null
}

Start-WebAppPool -Name $AppPoolName -ErrorAction SilentlyContinue
Start-Website -Name $SiteName

$urlHost = if ($HostName) { $HostName } else { "localhost" }
$urlPort = if ($Port -eq 80) { "" } else { ":$Port" }
Write-Host "Deployment completed: http://$urlHost$urlPort/"
Write-Host "Physical path: $PhysicalPath"
