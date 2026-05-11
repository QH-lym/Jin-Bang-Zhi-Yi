param(
  [ValidateSet('Debug', 'Release')]
  [string]$Variant = 'Debug'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $repoRoot 'android'
$sdkRoot = if (Test-Path 'D:\Android\Sdk') {
  'D:\Android\Sdk'
} else {
  Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}
$gradleHome = if (Test-Path 'D:\.gradle') {
  'D:\.gradle'
} else {
  Join-Path $env:USERPROFILE '.gradle'
}
$jdkCandidates = @(
  'D:\Java\jdk-21.0.11.10-hotspot',
  'C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot',
  'C:\Program Files\Android\Android Studio\jbr',
  $env:JAVA_HOME
) | Where-Object { $_ -and (Test-Path (Join-Path $_ 'bin\java.exe')) }

if (-not $jdkCandidates) {
  throw 'JDK 21/17 not found. Install Temurin JDK 21 or Android Studio JBR first.'
}

if (-not (Test-Path (Join-Path $sdkRoot 'platforms\android-36'))) {
  throw "Android SDK platform android-36 not found under $sdkRoot."
}

$env:JAVA_HOME = @($jdkCandidates)[0]
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:GRADLE_USER_HOME = $gradleHome
$env:Path = "$env:JAVA_HOME\bin;$sdkRoot\cmdline-tools\latest\bin;$sdkRoot\platform-tools;$env:Path"

$sdkDir = $sdkRoot -replace '\\', '\\'
Set-Content -Path (Join-Path $androidDir 'local.properties') -Value "sdk.dir=$sdkDir" -Encoding ASCII

Push-Location $repoRoot
try {
  npm run build
  npx cap sync android
  Push-Location $androidDir
  try {
    .\gradlew.bat "assemble$Variant"
  } finally {
    Pop-Location
  }
} finally {
  Pop-Location
}
