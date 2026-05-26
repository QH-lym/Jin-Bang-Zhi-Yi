# Build Electron app with minimal output size

$ErrorActionPreference = 'Stop'
$serverDir = [System.IO.Path]::Combine($PSScriptRoot, '..', 'server')

Write-Host "[build-electron] Optimizing server node_modules for production..."

# Save full node_modules, install production-only, run builder, restore
$fullDir = [System.IO.Path]::Combine($serverDir, 'node_modules.full')
$prodDir = [System.IO.Path]::Combine($serverDir, 'node_modules')

if ((Test-Path $fullDir) -and -not (Test-Path $prodDir)) {
    Write-Host "[build-electron] Restoring leftover full server node_modules..."
    Rename-Item -Path $fullDir -NewName 'node_modules' -Force
}

if (Test-Path $prodDir) {
    if (Test-Path $fullDir) {
        Write-Host "[build-electron] Removing stale server node_modules.full..."
        Remove-Item -Path $fullDir -Recurse -Force
    }
    Rename-Item -Path $prodDir -NewName 'node_modules.full' -Force
}

try {
    # Install production-only dependencies in server
    Push-Location $serverDir
    npm install --omit=dev --omit=optional --ignore-scripts | Out-Null
    Pop-Location

    Write-Host "[build-electron] Server node_modules reduced. Running electron-builder..."
    npx electron-builder --publish=never
}
finally {
    # Restore full node_modules for development
    if (Test-Path $prodDir) {
        Remove-Item -Path $prodDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $fullDir) {
        Rename-Item -Path $fullDir -NewName 'node_modules' -Force
        Write-Host "[build-electron] Restored full server node_modules"
    }
}
