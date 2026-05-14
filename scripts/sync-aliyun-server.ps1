<#
.SYNOPSIS
  部署同步服务器到阿里云 ECS (118.178.109.63)
.DESCRIPTION
  先执行 build-server-deploy.ps1 生成部署包，
  然后通过 ECS Cloud Assistant 上传并安装到远程服务器。
#>

param(
  [string]$RegionId = "cn-hangzhou",
  [string]$InstanceId = "i-bp1dg9w5vq1zptwi0ezz",
  [string]$ServerDir = "C:\jhfyjxpt-server",
  [string]$DeployZip = (Join-Path $PSScriptRoot "..\server\deploy\jinbang-server-deploy.zip"),
  [switch]$Build,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
  param([string]$Name, [scriptblock]$Script)
  Write-Host ""; Write-Host "==> $Name"
  & $Script
}

function Invoke-Aliyun {
  param([string[]]$Arguments)
  $globalArgs = @()
  if ($env:ALIBABA_CLOUD_ACCESS_KEY_ID -and $env:ALIBABA_CLOUD_ACCESS_KEY_SECRET) {
    $globalArgs += @(
      "--access-key-id", $env:ALIBABA_CLOUD_ACCESS_KEY_ID,
      "--access-key-secret", $env:ALIBABA_CLOUD_ACCESS_KEY_SECRET,
      "--region", $RegionId
    )
  }
  & aliyun @Arguments @globalArgs
}

function Send-File {
  param([string]$TargetDir, [string]$FilePath)
  $bytes = [IO.File]::ReadAllBytes($FilePath)
  $content = [Convert]::ToBase64String($bytes)
  $name = Split-Path $FilePath -Leaf

  $send = Invoke-Aliyun @(
    "ecs", "SendFile",
    "--RegionId", $RegionId,
    "--InstanceId.1", $InstanceId,
    "--TargetDir", $TargetDir,
    "--Name", $name,
    "--ContentType", "Base64",
    "--Content", $content,
    "--Overwrite", "true",
    "--Timeout", "300"
  ) | ConvertFrom-Json

  Start-Sleep -Seconds 3

  $result = Invoke-Aliyun @(
    "ecs", "DescribeSendFileResults",
    "--RegionId", $RegionId,
    "--InvokeId", $send.InvokeId,
    "--InstanceId", $InstanceId
  ) | ConvertFrom-Json

  $status = $result.Invocations.Invocation[0].InvokeInstances.InvokeInstance[0].InvocationStatus
  if ($status -ne "Success") {
    throw "SendFile failed: $status"
  }
  Write-Host "  $name 上传完成"
}

function Invoke-Remote {
  param([string]$Script)
  $content = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Script))
  $run = Invoke-Aliyun @(
    "ecs", "RunCommand",
    "--RegionId", $RegionId,
    "--Type", "RunPowerShellScript",
    "--CommandContent", $content,
    "--ContentEncoding", "Base64",
    "--InstanceId.1", $InstanceId,
    "--Name", "deploy-jhfyjxpt-server",
    "--Timeout", "300"
  ) | ConvertFrom-Json

  Start-Sleep -Seconds 6

  $result = Invoke-Aliyun @(
    "ecs", "DescribeInvocationResults",
    "--RegionId", $RegionId,
    "--InvokeId", $run.InvokeId,
    "--InstanceId", $InstanceId
  ) | ConvertFrom-Json

  $inv = $result.Invocation.InvocationResults.InvocationResult[0]
  $output = ""
  try { $output = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($inv.Output)) } catch {}
  Write-Host $output

  if ($inv.ExitCode -ne 0) {
    throw "Remote command failed with exit code $($inv.ExitCode)"
  }
}

# ─── Step 0: Verify prerequisites ───
Invoke-Step "检查 aliyun CLI" {
  if (-not (Get-Command aliyun -ErrorAction SilentlyContinue)) {
    throw "请先安装阿里云 CLI：https://aliyun-cli.s3.com/docs/install.html"
  }
}

Invoke-Step "检查部署包" {
  if (-not (Test-Path $DeployZip)) {
    if ($Build) {
      Write-Host "  -Build 模式：运行 build-server-deploy.ps1..."
      & (Join-Path $PSScriptRoot "build-server-deploy.ps1")
    } else {
      throw "部署包不存在: $DeployZip`n请先运行 scripts\build-server-deploy.ps1"
    }
  }
  $size = (Get-Item $DeployZip).Length
  Write-Host ("  部署包: $DeployZip ({0:F2} MB)" -f ($size / 1MB))
}

if ($DryRun) { Write-Host "Dry run 模式，跳过实际部署。"; exit 0 }

# ─── Step 1: Upload deployment zip ───
Invoke-Step "上传部署包到服务器" {
  Send-File -TargetDir "C:\Temp" -FilePath $DeployZip
}

# ─── Step 2: Remote installation ───
Invoke-Step "远程安装服务器" {
  $script = @"
`$ErrorActionPreference = 'Stop'
`$zipPath = 'C:\Temp\jinbang-server-deploy.zip'
`$targetDir = '$ServerDir'

if (-not (Test-Path `$zipPath)) { throw "Deployment zip not found" }

# Backup old data
`$oldData = Join-Path `$targetDir "data"
`$backupDir = "C:\Temp\jhfyjxpt-server-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if (Test-Path `$targetDir) {
  New-Item -ItemType Directory -Force -Path `$backupDir | Out-Null
  if (Test-Path `$oldData) {
    Copy-Item `$oldData `$backupDir -Recurse -Force
    Write-Output "已备份旧数据到 `$backupDir"
  }
  Remove-Item `$targetDir -Recurse -Force
}

# Extract
New-Item -ItemType Directory -Force -Path `$targetDir | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory(`$zipPath, `$targetDir)
Write-Output "部署包已解压到 `$targetDir"

# Restore data
if (Test-Path (Join-Path `$backupDir "sync-store.json")) {
  `$dataDir = Join-Path `$targetDir "data"
  New-Item -ItemType Directory -Force -Path `$dataDir | Out-Null
  Copy-Item (Join-Path `$backupDir "sync-store.json") `$dataDir -Force
  Write-Output "已恢复数据文件"
}

# Run install script
& (Join-Path `$targetDir "server\install.ps1")
Write-Output ""
Write-Output "服务器部署完成。"
Write-Output "健康检查: http://localhost:3001/health"
Write-Output "API: http://118.178.109.63:3001/api/crud/products"
"@
  Invoke-Remote -Script $script
}

Invoke-Step "验证远程服务" {
  Start-Sleep -Seconds 2
  try {
    $health = Invoke-RestMethod -Uri "http://118.178.109.63:3001/health" -TimeoutSec 10
    Write-Host "  状态: $($health.status)"
    Write-Host "  存储: $($health.storage)"
    Write-Host "  OSS: $($health.oss.configured)"
  } catch {
    Write-Host "  [警告] 健康检查暂未通过（服务器可能需要更多时间启动）"
    Write-Host "  $_"
  }
}

Write-Host ""
Write-Host "=== 服务器部署完成 ==="
Write-Host "API 地址: http://118.178.109.63:3001/api"
Write-Host "前端配置: VITE_CLOUD_API_BASE=http://118.178.109.63:3001/api"
