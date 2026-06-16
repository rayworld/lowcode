# LowCode Platform 🚀

企业级低代码开发平台，帮助开发者和业务人员快速构建现代化 Web 应用。通过可视化页面设计、数据模型管理、工作流编排等功能，大幅降低应用开发门槛。

---

## 功能特性

### 📱 应用管理
- 应用的创建、配置、发布全生命周期管理
- 应用级权限与角色管理（RBAC）
- 多应用隔离，独立数据模型与页面

### 🗃️ 数据建模
- **可视化实体设计器**：在线定义数据模型与字段
- 支持 10+ 字段类型：字符串、数字、布尔、日期、枚举、JSON 等
- **关系映射**：支持一对一、一对多、多对多关系
- **动态数据浏览**：自动生成 CRUD 接口与数据管理页面
- 基于 Prisma ORM + PostgreSQL，保障数据一致性

### 🎨 可视化页面设计
- **拖拽式页面设计器**（基于 `react-grid-layout`）
- 丰富的内置组件库（基于 Ant Design）
- 实时属性面板配置
- 组件事件绑定与交互联动
- 页面版本管理与发布

### ⚙️ 工作流引擎
- **可视化工作流编排**，支持多种触发方式
- 基于 Bull + Redis 的异步任务队列
- 节点类型：条件判断、API 调用、数据操作、延时等待等
- 执行日志与错误追踪
- 支持成功/失败分支路由

### 🔐 权限系统
- **JWT 身份认证**（Access Token + Refresh Token）
- **RBAC 角色权限模型**
- 资源级权限控制（页面、数据、操作）
- 权限条件表达式（如：仅查看本人数据）

### 🔌 开放集成
- **RESTful API**，自动生成 Swagger 文档
- WebSocket 实时推送
- 完整的 API 鉴权与请求验证
- 可扩展的组件注册机制

---

## 技术栈

| 层次 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite + Ant Design 5 |
| **拖拽引擎** | react-grid-layout + dnd-kit |
| **状态管理** | Zustand |
| **后端** | NestJS 10 + TypeScript |
| **数据库** | PostgreSQL 15 (Prisma ORM) |
| **缓存/队列** | Redis 7 + Bull |
| **认证** | Passport.js + JWT |
| **文档** | Swagger / OpenAPI |
| **包管理** | pnpm workspace (Monorepo) |
| **容器** | Docker & Docker Compose |

---

## 项目结构

```
lowcode-platform/
├── apps/
│   ├── client/                    # React 前端
│   │   ├── src/
│   │   │   ├── components/        # 通用组件
│   │   │   │   └── designer/      # 页面设计器组件
│   │   │   ├── layouts/           # 布局组件
│   │   │   ├── pages/             # 页面
│   │   │   │   ├── apps/          # 应用管理
│   │   │   │   ├── dashboard/     # 仪表盘
│   │   │   │   ├── data-model/    # 数据模型
│   │   │   │   ├── login/         # 登录注册
│   │   │   │   ├── page-designer/ # 页面设计器
│   │   │   │   └── workflow-editor/ # 工作流编辑器
│   │   │   ├── services/          # API 服务层
│   │   │   ├── stores/            # 状态管理
│   │   │   └── styles/            # 全局样式
│   │   └── vite.config.ts
│   └── server/                    # NestJS 后端
│       ├── prisma/
│       │   ├── schema.prisma      # 数据模型定义
│       │   ├── migrations/        # 数据库迁移
│       │   └── seed.ts            # 种子数据
│       └── src/
│           ├── common/            # 通用模块
│           │   ├── decorators/    # 自定义装饰器
│           │   ├── filters/       # 异常过滤器
│           │   ├── guards/        # 认证/角色守卫
│           │   ├── interceptors/  # 拦截器
│           │   └── prisma/        # Prisma 服务
│           ├── modules/
│           │   ├── app-manager/   # 应用管理
│           │   ├── auth/          # 认证
│           │   ├── component/     # 组件注册表
│           │   ├── data-model/    # 数据模型 & 动态数据
│           │   ├── page/          # 页面管理
│           │   ├── permission/    # 权限管理
│           │   ├── user/          # 用户管理
│           │   └── workflow/      # 工作流
│           ├── cache/             # 缓存模块
│           └── main.ts
├── packages/
│   └── shared/                    # 共享类型与枚举
│       └── src/
│           ├── enums/
│           └── types/
├── docker-compose.yml             # 本地基础设施
├── pnpm-workspace.yaml            # Monorepo 配置
└── package.json                   # 根配置
```

---

## 快速开始

### 1. 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.x
- **Docker** & **Docker Compose** (用于 PostgreSQL 和 Redis)

### 2. 启动基础设施

```bash
# 启动 PostgreSQL、Redis、pgAdmin
pnpm docker:up
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 环境配置

```bash
# 复制环境变量模板
cp .env.example apps/server/.env
```

根据实际情况修改 `.env` 中的配置，默认值即可用于本地开发。

### 5. 数据库初始化

```bash
# 生成 Prisma Client
pnpm db:generate

# 执行数据库迁移
pnpm db:migrate

# 填充种子数据（可选）
pnpm db:seed
```

### 6. 启动开发服务器

```bash
# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:server   # 后端 → http://localhost:3000
pnpm dev:client   # 前端 → http://localhost:5173
```

### 7. 访问

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5173 |
| API 服务 | http://localhost:3000/api |
| Swagger 文档 | http://localhost:3000/api/docs |
| pgAdmin | http://localhost:5050 (admin@lowcode.com / admin123) |

---

## 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动前后端开发服务器 |
| `pnpm dev:server` | 仅启动后端（热重载） |
| `pnpm dev:client` | 仅启动前端（Vite HMR） |
| `pnpm build` | 构建所有子项目 |
| `pnpm lint` | 代码检查 |
| `pnpm format` | 代码格式化 |
| `pnpm db:migrate` | 执行数据库迁移 |
| `pnpm db:seed` | 填充种子数据 |
| `pnpm db:generate` | 生成 Prisma Client |
| `pnpm docker:up` | 启动 Docker 服务 |
| `pnpm docker:down` | 停止 Docker 服务 |

---

## API 概览

| 模块 | 端点 | 说明 |
|------|------|------|
| **Auth** | `POST /api/auth/login` | 用户登录 |
| | `POST /api/auth/register` | 用户注册 |
| | `POST /api/auth/refresh` | 刷新 Token |
| **Apps** | `GET/POST /api/apps` | 应用列表 / 创建 |
| | `GET/PUT/DELETE /api/apps/:id` | 应用详情 / 更新 / 删除 |
| **Data Model** | `GET/POST /api/apps/:id/entities` | 实体列表 / 创建 |
| | `GET/PUT/DELETE /api/entities/:id` | 实体详情 / 更新 / 删除 |
| | `GET/POST /api/entities/:id/records` | 数据记录查询 / 创建 |
| **Pages** | `GET/POST /api/apps/:id/pages` | 页面列表 / 创建 |
| | `PUT /api/pages/:id/schema` | 更新页面 Schema |
| **Workflow** | `GET/POST /api/apps/:id/workflows` | 工作流列表 / 创建 |
| | `POST /api/workflows/:id/execute` | 执行工作流 |
| **Components** | `GET /api/components` | 组件注册表列表 |
| **Permissions** | `GET/POST /api/apps/:id/roles` | 角色列表 / 创建 |
| | `POST /api/roles/:id/permissions` | 配置角色权限 |

完整 API 文档请访问 `/api/docs`（Swagger UI）。

---

## 核心模块说明

### 数据模型模块

动态实体系统，支持运行时创建和管理数据模型：

- 通过 `DataEntity` 和 `Field` 模型定义数据结构
- 自动生成对应的数据库表（通过 Prisma Migrate 或 `db push`）
- 提供通用 `DataRecord` 模型存储动态数据（JSONB）
- 为每个实体自动生成 RESTful CRUD 接口

### 页面设计器

可视化拖拽页面构建工具：

- 基于 `react-grid-layout` 实现自由布局
- 组件支持拖拽添加、缩放、移动
- 属性面板实时编辑组件配置
- 页面 Schema 以 JSON 格式存储，支持版本管理

### 工作流引擎

异步工作流执行系统：

- **触发器**：定时、Webhook、数据变更、手动触发
- **节点类型**：HTTP 请求、条件判断、数据操作、延时、子工作流
- 基于 Bull 队列实现可靠的任务调度和执行
- 完整的执行日志与错误处理

---

## 开发路线图

- [x] 应用管理 CRUD
- [x] 用户认证与 JWT
- [x] 数据建模与动态 CRUD
- [x] 可视化页面设计器
- [x] 工作流引擎基础版
- [ ] 工作流高级节点（循环、并行分支）
- [ ] 页面模板市场
- [ ] 应用发布与版本管理
- [ ] 数据导入/导出 (CSV/Excel)
- [ ] 业务规则引擎
- [ ] 自定义组件开发 SDK
- [ ] 多租户 SaaS 模式
- [ ] 移动端适配

---

## 贡献指南

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'feat: add amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 NestJS 模块化架构
- 前端使用函数式组件 + Hooks
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

---

## 许可证

[MIT](LICENSE)

---

## 致谢

- [NestJS](https://nestjs.com/) - 优雅的 Node.js 后端框架
- [React](https://react.dev/) - 前端 UI 库
- [Ant Design](https://ant.design/) - 企业级 UI 组件库
- [Prisma](https://www.prisma.io/) - 现代 ORM
- [Bull](https://github.com/OptimalBits/bull) - 队列系统
