# 查找项目目录并构建脚本
# 在阿里云服务器上运行

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  查找项目并构建" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 常见项目路径
$possiblePaths = @(
    "C:\inetpub\wwwroot\jin-bang-zhi-yi",
    "C:\inetpub\wwwroot\jinbangzhiyi",
    "C:\inetpub\wwwroot\dist",
    "C:\wwwroot\jin-bang-zhi-yi",
    "D:\jin-bang-zhi-yi",
    "D:\wwwroot\jin-bang-zhi-yi"
)

$foundPath = $null

Write-Host "1. 查找项目目录..." -ForegroundColor Green
foreach ($path in $possiblePaths) {
    if (Test-Path "$path\package.json") {
        $foundPath = $path
        Write-Host "   ✓ 找到项目: $path" -ForegroundColor Gray
        break
    }
}

# 如果没找到，搜索整个 wwwroot
if (-not $foundPath) {
    Write-Host "   在 C:\inetpub\wwwroot 搜索 package.json..." -ForegroundColor Yellow
    $foundFiles = Get-ChildItem -Path "C:\inetpub\wwwroot" -Recurse -Filter "package.json" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($foundFiles) {
        $foundPath = $foundFiles.DirectoryName
        Write-Host "   ✓ 找到项目: $foundPath" -ForegroundColor Gray
    }
}

if (-not $foundPath) {
    Write-Host "   ✗ 未找到项目目录" -ForegroundColor Red
    Write-Host "   请确认项目已上传到 C:\inetpub\wwwroot\" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. 切换到项目目录..." -ForegroundColor Green
Set-Location $foundPath
Write-Host "   当前目录: $(Get-Location)" -ForegroundColor Gray

Write-Host ""
Write-Host "3. 检查 package.json..." -ForegroundColor Green
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "   项目名称: $($pkg.name)" -ForegroundColor Gray
    Write-Host "   版本: $($pkg.version)" -ForegroundColor Gray
} else {
    Write-Host "   ✗ package.json 不存在" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4. 安装依赖..." -ForegroundColor Green
if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ 依赖安装失败" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✓ node_modules 已存在" -ForegroundColor Gray
}

Write-Host ""
Write-Host "5. 修改 API 地址为 HTTPS..." -ForegroundColor Green
$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    $newContent = $content -replace 'http://118\.178\.109\.63:3001/api', 'https://api.jinbangzhiyi.online/api'
    if ($content -ne $newContent) {
        $newContent | Out-File $envFile -Encoding UTF8
        Write-Host "   ✓ API 地址已更新为 HTTPS" -ForegroundColor Gray
    } else {
        Write-Host "   ✓ API 地址已是 HTTPS 或无需修改" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⚠ .env 文件不存在，创建新文件..." -ForegroundColor Yellow
    "VITE_CLOUD_API_BASE=https://api.jinbangzhiyi.online/api" | Out-File $envFile -Encoding UTF8
}

Write-Host ""
Write-Host "6. 构建项目..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ 构建失败" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "7. 检查构建输出..." -ForegroundColor Green
if (Test-Path "dist\index.html") {
    Write-Host "   ✓ 构建成功!" -ForegroundColor Green
    $distSize = (Get-ChildItem dist -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   dist/ 大小: $([math]::Round($distSize, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "   ✗ 构建输出不存在" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "构建完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "项目路径: $foundPath" -ForegroundColor Cyan
Write-Host "构建输出: $foundPath\dist\" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "将 dist\ 目录内容复制到 IIS 网站目录" -ForegroundColor White
Write-Host ""
