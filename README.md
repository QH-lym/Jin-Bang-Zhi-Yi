# 晋梆智绎

三晋非遗数字化赋能平台，包含 React/Vite 前端、Electron 桌面端、CloudBase 云函数与独立 Node 服务。

## 项目结构

```text
.
├─ src/                         # 主前端应用源码
│  ├─ components/               # React 页面与组件
│  ├─ cloud/                    # CloudBase 前端接入
│  ├─ data/                     # 本地数据与 Dexie 存储
│  ├─ hooks/                    # React hooks
│  └─ utils/                    # 通用工具
├─ electron/                    # Electron 主进程与 preload
├─ cloudbase/                   # CloudBase 云函数与配置
├─ server/                      # 独立后端服务
├─ public/                      # 静态资源
├─ scripts/                     # 构建、检查、维护脚本
├─ cross-platform-adaptation/   # 跨端适配示例与说明
└─ docs/                        # 产品与检查文档
```

## 常用命令

```bash
npm run dev
npm run build
npm run preview
npm run check:encoding
npm run build:electron
```

## 维护说明

- 生产构建输出在 `dist/`，Electron 打包输出在 `release/`，两者不提交到仓库。
- 一次性修复脚本放在 `scripts/maintenance/`，避免根目录继续膨胀。
- `.uploads/`、Python 缓存、npm 缓存等本地运行产物已加入忽略规则。
- 若 `npm run check:encoding` 误报正常中文，需要调整 `scripts/check-encoding.mjs` 的检测规则。
