param(
  [string]$SiteName = "jin-bang-zhi-yi",
  [string]$AppPoolName = "jin-bang-zhi-yi",
  [string]$SourcePath = (Join-Path $PSScriptRoot "..\dist"),
  [string]$PhysicalPath = "C:\inetpub\wwwroot\jin-bang-zhi-yi",
  [int]$Port = 80,
  [string]$HostName = "",
  [switch]$EnableHttps,
  [int]$HttpsPort = 443,
  [string]$CertPfxPath = "",
  [string]$CertZipPath = "",
  [string]$CertPasswordPath = "",
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

function Resolve-OptionalPath {
  param([string]$Path)

  if (-not $Path) {
    return ""
  }

  if ([IO.Path]::IsPathRooted($Path)) {
    return $Path
  }

  return (Join-Path $repoRoot $Path)
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

$certThumbprint = ""
if ($EnableHttps) {
  $certWorkDir = ""

  if ($CertZipPath) {
    $resolvedCertZip = Resolve-OptionalPath $CertZipPath
    if (-not (Test-Path $resolvedCertZip)) {
      throw "Certificate zip not found: $resolvedCertZip"
    }

    $certWorkDir = Join-Path $env:TEMP ("jin-bang-zhi-yi-cert-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $certWorkDir -Force | Out-Null
    Expand-Archive -LiteralPath $resolvedCertZip -DestinationPath $certWorkDir -Force

    if (-not $CertPfxPath) {
      $pfx = Get-ChildItem -LiteralPath $certWorkDir -Filter *.pfx | Select-Object -First 1
      if (-not $pfx) {
        throw "No .pfx file found in certificate zip."
      }
      $CertPfxPath = $pfx.FullName
    }

    if (-not $CertPasswordPath) {
      $passwordFile = Get-ChildItem -LiteralPath $certWorkDir -Filter *password*.txt | Select-Object -First 1
      if ($passwordFile) {
        $CertPasswordPath = $passwordFile.FullName
      }
    }
  } else {
    $CertPfxPath = Resolve-OptionalPath $CertPfxPath
    $CertPasswordPath = Resolve-OptionalPath $CertPasswordPath
  }

  if (-not $CertPfxPath -or -not (Test-Path $CertPfxPath)) {
    throw "HTTPS was requested but no PFX certificate was found."
  }

  if ($CertPasswordPath) {
    if (-not (Test-Path $CertPasswordPath)) {
      throw "Certificate password file not found: $CertPasswordPath"
    }
    $certPassword = ConvertTo-SecureString ((Get-Content -LiteralPath $CertPasswordPath -Raw).Trim()) -AsPlainText -Force
  } else {
    $certPassword = Read-Host "PFX password" -AsSecureString
  }

  $importedCert = Import-PfxCertificate -FilePath $CertPfxPath -CertStoreLocation Cert:\LocalMachine\My -Password $certPassword
  $certThumbprint = $importedCert.Thumbprint

  if ($certWorkDir -and (Test-Path $certWorkDir)) {
    Remove-Item -LiteralPath $certWorkDir -Recurse -Force
  }
}

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

if ($EnableHttps) {
  $httpsBindingInfo = if ($HostName) { "*:${HttpsPort}:${HostName}" } else { "*:${HttpsPort}:" }
  $httpsBinding = Get-WebBinding -Name $SiteName -Protocol "https" | Where-Object { $_.bindingInformation -eq $httpsBindingInfo }
  if (-not $httpsBinding) {
    New-WebBinding -Name $SiteName -Protocol "https" -Port $HttpsPort -HostHeader $HostName -SslFlags $(if ($HostName) { 1 } else { 0 }) | Out-Null
  }
  (Get-WebBinding -Name $SiteName -Protocol "https" | Where-Object { $_.bindingInformation -eq $httpsBindingInfo }).AddSslCertificate($certThumbprint, "My")
}

Start-Website -Name $SiteName

$urlHost = if ($HostName) { $HostName } else { "localhost" }
$urlPort = if ($Port -eq 80) { "" } else { ":$Port" }
Write-Host "Deployment completed: http://$urlHost$urlPort/"
if ($EnableHttps) {
  $httpsUrlPort = if ($HttpsPort -eq 443) { "" } else { ":$HttpsPort" }
  Write-Host "HTTPS binding: https://$urlHost$httpsUrlPort/"
}
Write-Host "Physical path: $PhysicalPath"
