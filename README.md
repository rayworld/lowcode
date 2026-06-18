# LowCode Platform 🚀

企业级低代码开发平台，帮助开发者和业务人员快速构建现代化 Web 应用。通过可视化页面设计、**全功能数据建模**、工作流编排等功能，大幅降低应用开发门槛。

---

## 功能特性

### 🗃️ 数据建模 — 核心引擎
全生命周期数据模型管理，从设计到数据操作一站完成：

- **可视化实体设计器**：在线定义数据模型与字段，支持 **19 种字段类型**
- **关系映射**：一对一、一对多、**多对多（自动生成中间表）**
- **字段类型系统**：STRING / TEXT / NUMBER / BOOLEAN / DATE / DATETIME / EMAIL / PHONE / URL / SELECT / MULTI_SELECT / FILE / IMAGE / JSON / RELATION / **CURRENCY / LOCATION / RATING / COLOR**
- **类型智能推荐**：根据字段名称自动推荐类型（如 `email` → EMAIL）
- **字段排序拖拽**：可视化调整字段顺序
- **字段类型变更**：支持安全转换，30+ 条转换规则，自动迁移已有数据
- **全局选项集**：可复用选项集管理，支持颜色标记
- **ER 图可视化**：基于 ReactFlow 的交互式实体关系图，支持拖拽布局持久化
- **ER 图增强**：边线动画、悬停高亮、字段折叠、颜色分组、字段内联编辑
- **动态默认值表达式**：支持 `{{NOW()}}` / `{{UUID()}}` / `{{USER_ID()}}` / `{{SEQUENCE()}}` 等
- **模型版本控制**：自动快照、版本对比、一键回滚
- **代码生成**：一键生成 TypeScript 类型定义、Form 组件、Table 列定义

### 📊 数据管理
- **智能数据浏览器**：多字段过滤、排序、全文搜索、列自定义
- **高级查询构建器**：可视化 AND/OR 条件组（包含/等于/大于/范围/为空 等操作符）
- **游标分页**：解决深分页性能问题
- **批量操作**：批量删除、批量导出选中行
- **CSV 导入/导出**：UTF-8 BOM 兼容 Excel
- **模型导入/导出**：完整 JSON 序列化，支持 skip/overwrite/rename 冲突策略
- **关联数据解析**：自动解析关联字段显示名称，可点击跳转
- **类型级数据校验**：NUMBER/EMAIL/URL/PHONE/DATE/CURRENCY/LOCATION/RATING/COLOR
- **唯一约束强制执行**
- **Schema 补齐**：查询时自动用默认值填充缺失字段
- **数据变更审计日志**

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
- **数据权限集成**：字段级可见性控制、行级数据过滤（`$user.id` 条件解析）

### 📱 应用管理
- 应用的创建、配置、发布全生命周期管理
- 应用级权限与角色管理（RBAC）
- 多应用隔离，独立数据模型与页面

### 🔌 开放集成
- **RESTful API**，自动生成 Swagger 文档
- 完整的 API 鉴权与请求验证
- 可扩展的组件注册机制

---

## 技术栈

| 层次 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite + Ant Design 5 |
| **拖拽引擎** | react-grid-layout + @xyflow/react (ReactFlow) |
| **状态管理** | Zustand |
| **后端** | NestJS 10 + TypeScript |
| **数据库** | PostgreSQL 15 (Prisma ORM, JSONB + GIN 索引) |
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
│   │   │   │   ├── data/          # 数据组件（QueryBuilder, OptionSetManager）
│   │   │   │   ├── designer/      # 页面设计器组件
│   │   │   │   └── erd/           # ER 图组件
│   │   │   ├── config/            # 配置文件
│   │   │   │   ├── field-type.config.ts  # 字段类型注册表
│   │   │   │   ├── model-templates.ts    # 预设模板
│   │   │   │   └── default-expressions.ts # 默认值表达式
│   │   │   ├── layouts/           # 布局组件
│   │   │   ├── pages/             # 页面
│   │   │   │   ├── apps/          # 应用管理
│   │   │   │   ├── data-model/    # 数据模型（3 页面）
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
│           ├── common/
│           │   ├── audit/         # 审计日志服务
│           │   ├── decorators/    # 自定义装饰器
│           │   ├── guards/        # 认证/角色守卫
│           │   └── prisma/        # Prisma 服务
│           ├── modules/
│           │   ├── data-model/    # 数据模型核心（含版本/代码生成/权限/选项集）
│           │   ├── app-manager/   # 应用管理
│           │   ├── auth/          # 认证
│           │   ├── permission/    # 权限管理
│           │   ├── page/          # 页面管理
│           │   ├── workflow/      # 工作流
│           │   ├── component/     # 组件注册表
│           │   └── user/          # 用户管理
│           ├── cache/             # 缓存模块
│           └── main.ts
├── packages/
│   └── shared/                    # 共享类型与枚举
└── docker-compose.yml             # 本地基础设施
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

## API 概览

| 模块 | 端点 | 说明 |
|------|------|------|
| **Auth** | `POST /api/auth/login` | 用户登录 |
| | `POST /api/auth/register` | 用户注册 |
| | `POST /api/auth/refresh` | 刷新 Token |
| **Apps** | `GET/POST /api/apps` | 应用列表 / 创建 |
| | `GET/PUT/DELETE /api/apps/:id` | 应用详情 / 更新 / 删除 |
| **数据模型** | `GET/POST /api/apps/:appId/entities` | 实体列表 / 创建 |
| | `GET/PUT/DELETE /api/apps/:appId/entities/:id` | 实体详情 / 更新 / 删除 |
| | `GET /api/apps/:appId/entities/relations` | ER 图关系数据 |
| | `POST /api/apps/:appId/entities/:id/clone` | 克隆实体 |
| | `PUT /api/apps/:appId/entities/:eid/fields/reorder` | 字段重排序 |
| | `GET /api/apps/:appId/entities/fields/:fid/compatible-types` | 字段兼容类型查询 |
| | `GET /api/apps/:appId/entities/export/model` | 导出模型 JSON |
| | `POST /api/apps/:appId/entities/import/model` | 导入模型 JSON |
| **动态数据** | `GET /api/entities/:id/data` | 查询记录（支持过滤/排序/搜索/游标分页） |
| | `POST /api/entities/:id/data` | 创建记录（支持动态默认值） |
| | `PUT/DELETE /api/entities/:id/data/:rid` | 更新/删除记录 |
| | `GET /api/entities/:id/data/export/csv` | 导出 CSV |
| **版本控制** | `GET/POST /api/apps/:id/entities/:eid/versions` | 版本列表 / 创建快照 |
| | `POST /apps/:id/entities/:eid/versions/:v/restore` | 恢复版本 |
| | `POST /apps/:id/entities/:eid/versions/compare` | 版本对比 |
| **代码生成** | `GET /api/apps/:appId/codegen/entities/:eid` | 生成 TS 类型 + 组件代码 |
| **选项集** | `GET/POST /api/apps/:appId/option-sets` | 选项集管理 |
| **权限** | `GET/POST /api/apps/:id/roles` | 角色管理 |
| **Pages** | `GET/POST /api/apps/:id/pages` | 页面列表 / 创建 |
| **Workflow** | `GET/POST /api/apps/:id/workflows` | 工作流列表 / 创建 |

完整 API 文档请访问 `/api/docs`（Swagger UI）。

---

## 核心模块说明

### 数据模型模块 — 深度解析

数据建模采用 **元数据驱动架构（EAV + JSONB 混搭）**，核心由三张表构成：

| 表 | 用途 |
|---|------|
| `DataEntity` | 实体/表定义（名称、显示名、描述） |
| `Field` | 字段/列定义（类型、约束、关联、默认值） |
| `DataRecord` | 实际数据行，JSONB 列存储所有字段值 |

#### 智能字段类型系统

19 种字段类型，通过 `field-type.config.ts` 注册表管理（图标/颜色/描述/推荐名称）：

```
STRING TEXT NUMBER BOOLEAN DATE DATETIME EMAIL PHONE URL
SELECT MULTI_SELECT FILE IMAGE JSON RELATION
CURRENCY LOCATION RATING COLOR
```

- **智能推荐**：根据字段名自动推荐（`email` → EMAIL, `price` → CURRENCY）
- **类型转换矩阵**：30+ 条安全转换规则，自动迁移已有数据
- **表达式默认值**：`{{NOW()}}` `{{UUID()}}` `{{USER_ID()}}` `{{SEQUENCE()}}`

#### 预设模板

一键创建完整数据模型：

- **客户管理 (CRM)**：客户 + 联系人 + 商机
- **项目管理**：项目 + 任务
- **进销存管理**：商品 + 仓库 + 库存 + 订单
- **内容管理**：文章 + 分类
- **反馈管理**：用户反馈 + 工单

#### 操作安全

| 机制 | 说明 |
|------|------|
| **实体删除保护** | 检查关联引用，列出影响范围 |
| **类型转换数据迁移** | 自动转换已有数据（如 STRING→NUMBER 清除非数字值） |
| **模型版本快照** | 每次变更自动创建，支持回滚 |
| **审计日志** | 所有建模操作可追溯 |
| **唯一约束** | 应用层强制执行 |
| **字段级权限** | 基于角色的字段可见性控制 |
| **行级权限** | `$user.id` 条件表达式 |

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

## 开发路线图

### ✅ 已完成
- [x] 应用管理 CRUD
- [x] 用户认证与 JWT
- [x] 全功能数据建模（19 种字段类型 + 关系 + ER 图）
- [x] 智能字段类型推荐
- [x] 字段排序拖拽
- [x] 字段类型安全变更与数据迁移
- [x] 可视化页面设计器
- [x] 工作流引擎基础版
- [x] 数据校验管道（类型校验 + 唯一约束）
- [x] 关联数据解析
- [x] 实体删除保护
- [x] Schema 补齐（默认值填充）
- [x] 审计日志
- [x] 数据浏览器增强（过滤/排序/搜索/列设置）
- [x] 预设模板 + Excel/CSV 导入
- [x] ER 图增强（动画/高亮/折叠/颜色分组/内联编辑）
- [x] 模型版本控制（快照/对比/回滚）
- [x] 数据导入导出（CSV + JSON 模型）
- [x] 批量操作（删除/导出）
- [x] 代码生成（TypeScript 类型 + 组件代码）
- [x] GIN 索引 + 游标分页
- [x] 多环境模型同步
- [x] 字段级 + 行级权限集成
- [x] 选项集管理中心
- [x] 动态默认值表达式引擎
- [x] 高级查询构建器 (AND/OR)
- [x] 实体克隆

### 🔜 规划中
- [ ] 工作流高级节点（循环、并行分支）
- [ ] 页面模板市场
- [ ] 应用发布与版本管理
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
- [@xyflow/react](https://reactflow.dev/) - ReactFlow 流程图框架
- [Bull](https://github.com/OptimalBits/bull) - 队列系统
