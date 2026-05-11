# Windows Server 2022 + IIS 部署说明

本项目的 Web 端是 Vite/React 静态站点，生产产物位于 `dist/`。服务器部署时只需要把 `dist/` 发布到 IIS 站点目录；`server/` 是可选的独立 Node/Express 服务，不是 IIS 静态站点启动所必需。

## 1. 本地构建

```powershell
npm ci
npm run build
```

构建成功后确认 `dist/index.html` 存在。`public/web.config` 会自动复制到 `dist/web.config`，用于 IIS 默认首页、常见 MIME 类型、静态压缩和安全响应头。

## 2. 在服务器执行一键部署

把项目目录复制到 Windows Server 2022 后，使用“以管理员身份运行”的 PowerShell 执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-iis.ps1 -Build -InstallIIS
```

默认会创建：

- IIS 站点：`jin-bang-zhi-yi`
- 应用程序池：`jin-bang-zhi-yi`
- 站点目录：`C:\inetpub\wwwroot\jin-bang-zhi-yi`
- HTTP 端口：`80`

如果 IIS 已安装，并且本地已经构建好 `dist/`，可以省略 `-Build -InstallIIS`：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-iis.ps1
```

指定域名或端口：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-iis.ps1 -HostName "example.com" -Port 8080
```

## 3. 防火墙

如果服务器没有开放 HTTP/HTTPS 端口：

```powershell
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

## 4. 验证

访问：

```text
http://服务器IP/
```

或使用域名：

```text
http://example.com/
```

如果页面打不开，优先检查：

- IIS 站点是否已启动
- 应用程序池是否已启动
- 站点物理路径是否指向已复制的 `dist/`
- `dist/index.html`、`dist/assets/`、`dist/web.config` 是否存在
- 服务器安全组和 Windows 防火墙是否放行端口

## 5. 可选 Node 后端

如需启用 `server/` 下的独立 API 服务，建议单独使用 Node 进程管理器运行，例如 `pm2` 或 Windows 服务，然后在 IIS 上安装 ARR + URL Rewrite 做反向代理到 Node 端口。

前端若需要调用该服务，应在构建前设置：

```powershell
$env:VITE_CLOUD_API_BASE="https://api.example.com"
npm run build
```
