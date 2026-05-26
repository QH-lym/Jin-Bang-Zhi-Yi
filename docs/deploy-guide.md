# 🚀 部署指南

## 📋 密钥配置状态

### ✅ 已配置密钥

| 密钥类型 | 环境变量 | 状态 | 用途 |
|---------|---------|------|------|
| **Publishable Key** | `VITE_TCB_PUBLISHABLE_KEY` | ✅ 已配置 | 前端匿名认证 |
| **Server Key** | `VITE_TCB_SERVER_KEY` | ✅ 已配置 | 服务端 API 调用 |
| **环境 ID** | `VITE_CLOUDBASE_ENV_ID` | ✅ 已配置 | `sjy-d0gxtaklr8e1be761` |
| **地域** | `VITE_CLOUDBASE_REGION` | ✅ 已配置 | `ap-shanghai` |

### 🔑 密钥说明

```
┌─────────────────────────────────────────────────────────────┐
│  腾讯云 CloudBase 密钥体系                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  前端 (浏览器)                                               │
│  ├─ Publishable Key ──→ 匿名认证、云函数调用                  │
│  └─ 环境 ID / 地域 ────→ 指定云环境                           │
│                                                             │
│  后端 (云函数)                                               │
│  └─ SYMBOL_CURRENT_ENV ─→ 自动获取当前环境（无需手动配置）     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**安全提示**：
- ✅ Publishable Key 可以暴露在前端，仅用于匿名认证
- ✅ 云函数使用 `SYMBOL_CURRENT_ENV` 自动获取环境，无需额外密钥
- ❌ 不要将 Server Key 用于前端，它仅用于服务端

---

## 🛠️ 部署步骤

### 1. 安装 CloudBase CLI

```bash
npm install -g @cloudbase/cli
```

### 2. 登录腾讯云

```bash
tcb login
# 或
npx tcb login
```

### 3. 部署云函数

```bash
# 部署所有云函数
tcb fn deploy

# 或分别部署
tcb fn deploy auth
tcb fn deploy crud
tcb fn deploy storage
tcb fn deploy business
```

### 4. 部署静态网站

```bash
# 构建项目
npm run build

# 部署到腾讯云
tcb hosting deploy dist -e sjy-d0gxtaklr8e1be761

# 或使用 framework 一键部署
tcb framework deploy
```

---

## ✅ 部署验证

### 验证 1：云函数状态

```bash
# 查看云函数列表
tcb fn list

# 预期输出：
# ┌─────────────┬─────────┬─────────┐
# │ 名称         │ 状态    │ 运行时  │
# ├─────────────┼─────────┼─────────┤
# │ auth        │ Active  │ Nodejs16│
# │ crud        │ Active  │ Nodejs16│
# │ storage     │ Active  │ Nodejs16│
# │ business    │ Active  │ Nodejs16│
# └─────────────┴─────────┴─────────┘
```

### 验证 2：云函数调用测试

```bash
# 测试认证云函数
tcb fn invoke auth --data '{"action":"anonymous"}'

# 预期输出：
# {
#   "code": 0,
#   "message": "匿名登录成功",
#   "data": { "uid": "xxx", "token": "xxx" }
# }
```

### 验证 3：网页访问测试

部署完成后，访问以下地址：

```
https://jinbangzhiyi.online
```

### 验证 4：本地数据功能测试

1. 打开管理后台
2. 新增或修改商品 / 戏服封面
3. 创建一条测试订单
4. 刷新页面后确认数据仍然存在
5. 确认控制台无数据同步相关报错

**预期结果**：
- ✅ 进度条正常显示
- ✅ 同步成功提示
- ✅ 无认证错误（code: -1）

---

## 🔧 故障排查

### 问题 1：文件上传接口不可用

**原因**：独立后端服务未启动，或 `/api/upload` 代理未正确转发

**解决**：
```bash
# 1. 构建并启动服务端
npm run build:server
npm run start --prefix server

# 2. 检查健康接口
curl http://localhost:3001/health
```

### 问题 2：本地数据刷新后丢失

**原因**：浏览器清理了站点数据，或用户切换了浏览器 / 设备

**解决**：
```bash
# 避免清理站点 IndexedDB
# 桌面端使用同一安装路径和应用数据目录
```

### 问题 3：部署后页面空白

**原因**：构建失败或路径错误

**解决**：
```bash
# 1. 本地测试构建
npm run build
npm run preview

# 2. 检查 dist 目录是否存在
ls dist/

# 3. 重新部署
tcb hosting deploy dist --force
```

---

## 📊 部署检查清单

- [ ] CloudBase CLI 已安装
- [ ] 已登录腾讯云账号
- [ ] 云函数已部署（auth, crud, storage, business）
- [ ] 静态网站已部署
- [ ] 访问 URL 正常
- [ ] 本地数据功能测试通过
- [ ] 无控制台报错

---

## 📞 相关链接

- [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb/env/sjy-d0gxtaklr8e1be761)
- [CloudBase CLI 文档](https://docs.cloudbase.net/cli/intro.html)
- [云函数文档](https://docs.cloudbase.net/cloud-function/intro.html)
