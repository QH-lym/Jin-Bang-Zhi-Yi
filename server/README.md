# SJY Server - 独立后端服务

使用 **Server Key** 调用腾讯云 CloudBase 的独立 Node.js 后端服务。

---

## 🔑 Server Key 说明

```
┌─────────────────────────────────────────────────────────────┐
│  腾讯云 CloudBase 密钥体系                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Publishable Key（前端使用）                                  │
│  ├─ 用途：匿名认证、前端 SDK 初始化                           │
│  ├─ 权限：有限（仅匿名登录）                                  │
│  └─ 安全性：可暴露在前端代码中                                │
│                                                             │
│  Server Key（服务端使用） ⬅️ 本项目使用                        │
│  ├─ 用途：服务端 API 调用                                     │
│  ├─ 权限：完整（管理员权限）                                  │
│  └─ 安全性：❌ 严禁暴露到前端！                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env，填入你的 Server Key
TCB_SERVER_KEY=your_server_key_here
```

> **获取 Server Key**：
> 1. 登录 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb/env/sjy-d0gxtaklr8e1be761/access)
> 2. 进入「环境」→「访问服务」→「服务端密钥」
> 3. 复制 Server Key

### 3. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

服务启动后访问：
- 首页：`http://localhost:3000/`
- 健康检查：`http://localhost:3000/health`

---

## 📚 API 接口

### 认证 `/api/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/register` | 用户注册 |
| POST | `/login` | 用户登录 |
| GET | `/users` | 获取用户列表 |

### CRUD `/api/crud/:collection`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/:collection` | 查询列表 |
| GET | `/:collection/:id` | 获取单条 |
| POST | `/:collection` | 创建 |
| PUT | `/:collection/:id` | 更新 |
| DELETE | `/:collection/:id` | 删除 |

**支持的集合**：`products`, `hanfuItems`, `orders`, `rentalOrders`, `users`, `favorites`, `danmus`, `posts`

### 存储 `/api/storage`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/signature` | 获取上传签名 |
| GET | `/url?fileId=xxx` | 获取下载链接 |
| DELETE | `/:fileId` | 删除文件 |

### 业务 `/api/business`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/orders` | 创建订单 |
| PATCH | `/orders/:id/status` | 更新订单状态 |
| GET | `/dashboard` | 仪表盘统计 |

---

## 💡 使用示例

### 注册用户

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123456", "displayName": "管理员"}'
```

### 查询商品列表

```bash
curl "http://localhost:3000/api/crud/products?page=1&pageSize=10"
```

### 创建订单

```bash
curl -X POST http://localhost:3000/api/business/orders \
  -H "Content-Type: application/json" \
  -d '{"product": "手机", "buyer": "张三", "amount": 2999}'
```

### 获取仪表盘

```bash
curl http://localhost:3000/api/business/dashboard
```

---

## 🔧 项目结构

```
server/
├── src/
│   ├── config/
│   │   └── cloudbase.ts      # CloudBase 配置（使用 Server Key）
│   ├── routes/
│   │   ├── auth.ts           # 认证路由
│   │   ├── crud.ts           # CRUD 路由
│   │   ├── storage.ts        # 存储路由
│   │   └── business.ts       # 业务路由
│   └── index.ts              # 服务入口
├── .env.example              # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚠️ 安全注意事项

1. **永远不要将 Server Key 提交到 Git**
   ```bash
   # .gitignore 已配置
   server/.env
   ```

2. **生产环境使用 HTTPS**
   ```bash
   # 部署时使用反向代理（Nginx/Caddy）
   ```

3. **限制 CORS 域名**
   ```env
   # 生产环境
   CORS_ORIGIN=https://sjy-d0gxtaklr8e1be761-1429062856.tcloudbaseapp.com
   ```

4. **添加请求限流**
   ```bash
   # 生产环境建议添加 express-rate-limit
   npm install express-rate-limit
   ```

---

## 🚀 部署

### 部署到腾讯云 CVM/轻量服务器

```bash
# 1. 构建
cd server
npm run build

# 2. 上传 dist/ 和 package.json 到服务器
# 3. 服务器上安装依赖并启动
npm install --production
npm start
```

### 使用 PM2 进程管理

```bash
npm install -g pm2
pm2 start dist/index.js --name sjy-server
```

---

## 📞 相关链接

- [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb/env/sjy-d0gxtaklr8e1be761)
- [CloudBase Node.js SDK 文档](https://docs.cloudbase.net/sdk/node/intro.html)
