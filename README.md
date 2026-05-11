# 晋梆智绎

晋剧文化数字化展示与互动平台，包含 Web 前端、Electron 桌面端、Android 端、CloudBase 云函数和独立 Node 服务。

项目运营服务内容包括晋剧文化展示、课程学习、汉服租赁、文创商品管理、用户互动体验、云端数据同步和多端访问支持，主要用于非遗文化数字化运营、线上传播、业务管理与用户服务。

## 当前线上地址

| 用途 | 链接 |
| --- | --- |
| 官网首页 | `http://jinbangzhiyi.online/` |
| 软件包下载 | `http://jinbangzhiyi.online/downloads/v1.0.0/jin-bang-zhi-yi-setup-1.0.0.exe` |
| 隐私政策 | `http://jinbangzhiyi.online/privacy.html` |
| 支持信息 | `http://jinbangzhiyi.online/support.html` |
| 安装失败说明 | `http://jinbangzhiyi.online/installer-exit-codes.html` |

更多链接见 [项目链接整理](docs/项目链接整理.md)。

## 目录结构

```text
.
├── src/                         # React/Vite 前端应用
│   ├── components/              # 页面和业务组件
│   ├── assets/                  # 课程、剧目、商品、汉服 SVG 素材
│   ├── cloud/                   # CloudBase 前端接入
│   ├── data/                    # 本地数据和 Dexie 存储
│   ├── hooks/                   # React hooks
│   └── utils/                   # 通用工具
├── public/                      # 静态资源、审核页面、安装包下载目录
├── electron/                    # Electron 主进程和 preload
├── android/                     # Capacitor Android 工程
├── cloudbase/                   # CloudBase 云函数
├── server/                      # 独立 Node/Express 服务
├── scripts/                     # 构建、图标、维护脚本
├── docs/                        # 产品、检查、链接整理文档
├── dist/                        # Web 构建输出，不提交
└── release/                     # Electron 打包输出，不提交
```

## 常用命令

```bash
npm run dev              # 启动 Web 开发服务
npm run build            # TypeScript 检查并构建 dist
npm run preview          # 预览 dist
npm run build:electron   # 构建 Windows 桌面安装包
npm run build:android    # 构建/同步 Android 工程
npm run check:encoding   # 检查文本编码
```

## 发布流程

1. 确认安装包位于 `public/downloads/v1.0.0/jin-bang-zhi-yi-setup-1.0.0.exe`。
2. 执行 `npm run build`。
3. 执行 `npx tcb hosting deploy dist -e sjy-d0gxtaklr8e1be761`。
4. 验证软件包 URL 返回 `200`，并确认文件大小为 `111773807` 字节。

## 维护提醒

- `dist/`、`release/`、`node_modules/`、`.env` 已在 `.gitignore` 中忽略。
- 当前安装包超过 100 MB，不适合直接提交到 GitHub；如需长期版本管理，建议使用 CloudBase 静态托管、GitHub Release 或对象存储保存安装包。
- 正式对外链接统一使用 `http://jinbangzhiyi.online/` 域名。
