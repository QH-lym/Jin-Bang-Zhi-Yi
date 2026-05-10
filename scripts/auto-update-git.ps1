param(
  [string]$RepoUrl = $env:GIT_PUSH_URL,
  [string]$Branch = $(if ($env:GIT_PUSH_BRANCH) { $env:GIT_PUSH_BRANCH } else { "master" }),
  [string]$CommitPrefix = "auto update",
  [switch]$SkipElectronBuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $RepoUrl) {
  $RepoUrl = "https://github.com/QH-lym/Jin-Bang-Zhi-Yi.git"
}

function Invoke-Step {
  param(
    [string]$Title,
    [scriptblock]$Script
  )

  Write-Host ""
  Write-Host "==> $Title"
  & $Script
}

function Test-HasGitChanges {
  $status = git -C $repoRoot status --porcelain
  return [bool]$status
}

function Test-HasUnpushedCommits {
  try {
    $ahead = git -C $repoRoot rev-list --count "@{u}..HEAD" 2>$null
    return ([int]$ahead) -gt 0
  } catch {
    return $false
  }
}

function Stop-PackagedApp {
  $releaseDir = Join-Path $repoRoot "release\win-unpacked"
  if (-not (Test-Path $releaseDir)) {
    return
  }

  $processes = Get-Process | Where-Object {
    try {
      $_.Path -and $_.Path.StartsWith($releaseDir, [StringComparison]::OrdinalIgnoreCase)
    } catch {
      $false
    }
  }

  if ($processes) {
    Write-Host "Stopping running packaged app processes before rebuilding..."
    $processes | Stop-Process -Force
    Start-Sleep -Seconds 2
  }
}

function Push-WithToken {
  param(
    [string]$Url,
    [string]$TargetBranch
  )

  $token = $env:GITHUB_TOKEN
  if (-not $token) {
    $token = $env:GH_TOKEN
  }
  if (-not $token) {
    throw "Missing GitHub token. Set GITHUB_TOKEN or GH_TOKEN."
  }

  $askPassBase = Join-Path $env:TEMP ("git-askpass-" + [Guid]::NewGuid().ToString("N"))
  $askPassPs1 = "$askPassBase.ps1"
  $askPassCmd = "$askPassBase.cmd"
  $previousAskPass = $env:GIT_ASKPASS
  $previousTerminalPrompt = $env:GIT_TERMINAL_PROMPT
  $previousGitHubToken = $env:GITHUB_TOKEN

  try {
    @'
param($Prompt)
if ($Prompt -match "Username") {
  "x-access-token"
} else {
  $env:GITHUB_TOKEN
}
'@ | Set-Content -LiteralPath $askPassPs1 -Encoding UTF8

    "@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"$askPassPs1`" %*" |
      Set-Content -LiteralPath $askPassCmd -Encoding ASCII

    $env:GITHUB_TOKEN = $token
    $env:GIT_ASKPASS = $askPassCmd
    $env:GIT_TERMINAL_PROMPT = "0"

    git -C $repoRoot push $Url "HEAD:$TargetBranch"
  } finally {
    if (Test-Path $askPassPs1) {
      Remove-Item -LiteralPath $askPassPs1 -Force
    }
    if (Test-Path $askPassCmd) {
      Remove-Item -LiteralPath $askPassCmd -Force
    }
    $env:GIT_ASKPASS = $previousAskPass
    $env:GIT_TERMINAL_PROMPT = $previousTerminalPrompt
    $env:GITHUB_TOKEN = $previousGitHubToken
  }
}

Invoke-Step "Check git changes" {
  git -C $repoRoot status --short
}

if (-not (Test-HasGitChanges)) {
  if (Test-HasUnpushedCommits) {
    Invoke-Step "Push existing local commits via HTTPS token to $Branch" {
      Push-WithToken -Url $RepoUrl -TargetBranch $Branch
    }
    Write-Host ""
    Write-Host "Auto update finished."
    exit 0
  }

  Write-Host "No git changes or unpushed commits to update."
  exit 0
}

if ($SkipElectronBuild) {
  Invoke-Step "Run frontend build" {
    npm run build --prefix $repoRoot
  }
} else {
  Invoke-Step "Rebuild packaged desktop app" {
    Stop-PackagedApp
    npm run build:electron --prefix $repoRoot
  }
}

Invoke-Step "Stage changes" {
  git -C $repoRoot add -A
}

if (-not (Test-HasGitChanges)) {
  Write-Host "No committable git changes after build."
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$message = "$CommitPrefix`: $timestamp"

Invoke-Step "Create commit: $message" {
  git -C $repoRoot commit -m $message
}

Invoke-Step "Push via HTTPS token to $Branch" {
  Push-WithToken -Url $RepoUrl -TargetBranch $Branch
}

Write-Host ""
Write-Host "Auto update finished."
