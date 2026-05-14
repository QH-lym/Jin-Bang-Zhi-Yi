param(
  [string]$RegionId = "cn-hangzhou",
  [string]$InstanceId = "i-bp1dg9w5vq1zptwi0ezz",
  [string]$PublicUrl = "http://118.178.109.63/",
  [string]$SiteRoot = "C:\inetpub\wwwroot",
  [string]$DistPath = (Join-Path $PSScriptRoot "..\dist"),
  [int]$ChunkSize = 23000,
  [switch]$Build,
  [switch]$IncludeDownloads,
  [switch]$Force,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Script
  )

  Write-Host "==> $Name"
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

function Get-RemoteIndexAsset {
  try {
    $html = (Invoke-WebRequest -UseBasicParsing $PublicUrl -TimeoutSec 20).Content
    $match = [regex]::Match($html, 'assets/index-[^"'']+\.js')
    if ($match.Success) {
      return $match.Value
    }
  } catch {
    Write-Warning "Unable to read remote index from $PublicUrl`: $($_.Exception.Message)"
  }

  return ""
}

function Get-LocalIndexAsset {
  $indexPath = Join-Path $DistPath "index.html"
  if (-not (Test-Path $indexPath)) {
    return ""
  }

  $html = Get-Content -LiteralPath $indexPath -Raw
  $match = [regex]::Match($html, 'assets/index-[^"'']+\.js')
  if ($match.Success) {
    return $match.Value
  }

  return ""
}

function Get-DistFiles {
  $root = (Resolve-Path $DistPath).Path.TrimEnd("\") + "\"
  Get-ChildItem -LiteralPath $DistPath -Recurse -File | Where-Object {
    if ($IncludeDownloads) {
      return $true
    }

    $relative = $_.FullName.Substring($root.Length)
    return -not $relative.StartsWith("downloads\", [StringComparison]::OrdinalIgnoreCase)
  }
}

function Send-FilePart {
  param(
    [string]$TargetDir,
    [string]$Name,
    [byte[]]$Bytes
  )

  $content = [Convert]::ToBase64String($Bytes)
  $send = Invoke-Aliyun @(
    "ecs", "SendFile",
    "--RegionId", $RegionId,
    "--InstanceId.1", $InstanceId,
    "--TargetDir", $TargetDir,
    "--Name", $Name,
    "--ContentType", "Base64",
    "--Content", $content,
    "--Overwrite", "true",
    "--Timeout", "120"
  ) | ConvertFrom-Json

  Start-Sleep -Milliseconds 120

  $result = Invoke-Aliyun @(
    "ecs", "DescribeSendFileResults",
    "--RegionId", $RegionId,
    "--InvokeId", $send.InvokeId,
    "--InstanceId", $InstanceId
  ) | ConvertFrom-Json

  $status = $result.Invocations.Invocation[0].InvokeInstances.InvokeInstance[0].InvocationStatus
  if ($status -ne "Success") {
    throw "SendFile failed for $TargetDir\$Name with status $status."
  }
}

function Invoke-RemoteScript {
  param([string]$Script)

  $content = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Script))
  $run = Invoke-Aliyun @(
    "ecs", "RunCommand",
    "--RegionId", $RegionId,
    "--Type", "RunPowerShellScript",
    "--CommandContent", $content,
    "--ContentEncoding", "Base64",
    "--InstanceId.1", $InstanceId,
    "--Name", "deploy-jhfyjxpt-web",
    "--Timeout", "300"
  ) | ConvertFrom-Json

  Start-Sleep -Seconds 6

  $result = Invoke-Aliyun @(
    "ecs", "DescribeInvocationResults",
    "--RegionId", $RegionId,
    "--InvokeId", $run.InvokeId,
    "--InstanceId", $InstanceId
  ) | ConvertFrom-Json

  $invocation = $result.Invocation.InvocationResults.InvocationResult[0]
  $output = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($invocation.Output))
  Write-Host $output

  if ($invocation.ExitCode -ne 0 -or $invocation.InvocationStatus -ne "Success") {
    throw "Remote command failed with status $($invocation.InvocationStatus) and exit code $($invocation.ExitCode)."
  }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Invoke-Step "Check aliyun CLI" {
  if (-not (Get-Command aliyun -ErrorAction SilentlyContinue)) {
    throw "Alibaba Cloud CLI is not installed or not in PATH."
  }

  if (-not ($env:ALIBABA_CLOUD_ACCESS_KEY_ID -and $env:ALIBABA_CLOUD_ACCESS_KEY_SECRET)) {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      $config = & aliyun configure get 2>$null
      $configExitCode = $LASTEXITCODE
    } finally {
      $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($configExitCode -ne 0 -or -not $config) {
      throw "Alibaba Cloud credentials are not configured. Set ALIBABA_CLOUD_ACCESS_KEY_ID and ALIBABA_CLOUD_ACCESS_KEY_SECRET, or run aliyun configure."
    }
  }
}

if ($Build) {
  Invoke-Step "Build web app" {
    Push-Location $repoRoot
    try {
      npm run build
    } finally {
      Pop-Location
    }
  }
}

Invoke-Step "Check dist output" {
  if (-not (Test-Path (Join-Path $DistPath "index.html"))) {
    throw "Build output not found at $DistPath. Run npm run build first or pass -Build."
  }
}

$localIndex = Get-LocalIndexAsset
$remoteIndex = Get-RemoteIndexAsset

Write-Host "Local index asset:  $localIndex"
Write-Host "Remote index asset: $remoteIndex"

if (-not $Force -and $localIndex -and $remoteIndex -and $localIndex -eq $remoteIndex) {
  Write-Host "Aliyun IIS already has the current build. Nothing to sync."
  exit 0
}

$files = @(Get-DistFiles)
$distRoot = (Resolve-Path $DistPath).Path.TrimEnd("\") + "\"
$tempRoot = "C:\Windows\Temp\jhfyjxpt-sync-" + (Get-Date -Format "yyyyMMdd-HHmmss")

Write-Host "Files to deploy: $($files.Count)"
Write-Host "Remote temp: $tempRoot"

if ($DryRun) {
  $totalBytes = ($files | Measure-Object Length -Sum).Sum
  Write-Host "Dry run only. Bytes to upload: $totalBytes"
  exit 0
}

$manifest = [System.Collections.ArrayList]::new()
$totalChunks = 0

Invoke-Step "Upload files through ECS Cloud Assistant" {
  for ($i = 0; $i -lt $files.Count; $i++) {
    $file = $files[$i]
    $relativePath = $file.FullName.Substring($distRoot.Length).Replace("\", "/")
    $bytes = [IO.File]::ReadAllBytes($file.FullName)
    $partCount = [Math]::Max(1, [Math]::Ceiling($bytes.Length / $ChunkSize))

    [void]$manifest.Add([pscustomobject]@{
      index = $i
      relativePath = $relativePath
      parts = $partCount
      length = $bytes.Length
    })

    for ($part = 0; $part -lt $partCount; $part++) {
      $offset = $part * $ChunkSize
      $length = [Math]::Min($ChunkSize, $bytes.Length - $offset)
      $chunk = New-Object byte[] $length
      if ($length -gt 0) {
        [Array]::Copy($bytes, $offset, $chunk, 0, $length)
      }

      Send-FilePart -TargetDir "$tempRoot\$i" -Name ("{0:D5}.part" -f $part) -Bytes $chunk
      $totalChunks++
    }

    Write-Host ("Uploaded {0}/{1}: {2} ({3} bytes, {4} parts)" -f ($i + 1), $files.Count, $relativePath, $bytes.Length, $partCount)
  }
}

$manifestJson = $manifest | ConvertTo-Json -Compress
$remoteScript = @"
`$ErrorActionPreference = 'Stop'
`$siteRoot = '$SiteRoot'
`$tempRoot = '$tempRoot'
`$manifest = '$manifestJson' | ConvertFrom-Json

foreach (`$item in `$manifest) {
  `$target = Join-Path `$siteRoot (`$item.relativePath -replace '/', '\')
  `$targetDir = Split-Path -Parent `$target
  New-Item -ItemType Directory -Path `$targetDir -Force | Out-Null

  `$sourceDir = Join-Path `$tempRoot ([string]`$item.index)
  `$out = [IO.File]::Open(`$target, [IO.FileMode]::Create, [IO.FileAccess]::Write)
  try {
    for (`$part = 0; `$part -lt [int]`$item.parts; `$part++) {
      `$partPath = Join-Path `$sourceDir ('{0:D5}.part' -f `$part)
      `$partBytes = [IO.File]::ReadAllBytes(`$partPath)
      `$out.Write(`$partBytes, 0, `$partBytes.Length)
    }
  } finally {
    `$out.Close()
  }

  `$actual = (Get-Item -LiteralPath `$target).Length
  if (`$actual -ne [int64]`$item.length) {
    throw "Length mismatch for `$(`$item.relativePath): `$actual != `$(`$item.length)"
  }

  Write-Output "DEPLOYED `$(`$item.relativePath) `$actual"
}

Remove-Item -LiteralPath `$tempRoot -Recurse -Force -ErrorAction SilentlyContinue
Write-Output 'DEPLOY_DONE'
"@

Invoke-Step "Install files on IIS root" {
  Invoke-RemoteScript -Script $remoteScript
  Write-Host "Uploaded chunks: $totalChunks"
}

Invoke-Step "Verify public site" {
  $nextRemoteIndex = Get-RemoteIndexAsset
  Write-Host "Remote index asset after deploy: $nextRemoteIndex"
  if ($localIndex -and $nextRemoteIndex -and $localIndex -ne $nextRemoteIndex) {
    throw "Remote site still points to $nextRemoteIndex, expected $localIndex."
  }
}

Write-Host "Aliyun IIS sync completed."
