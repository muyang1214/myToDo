# MyToDo 项目上下文

> 此文件用于记录项目关键信息，方便在不同设备/会话中快速恢复开发上下文

## 项目概述

**项目名称**: MyToDo - 极简待办应用

**核心理念**: 化繁为简，专注于最纯粹的待办管理体验

**目标用户**: 追求简洁高效的个人用户

## 核心需求

### 功能需求
1. **极简待办管理**
   - 添加待办事项
   - 标记完成/未完成
   - 删除待办
   - 未完成事项自动滚入下一天

2. **数据状态**
   - 只有两种状态：完成 / 未完成
   - 无开始时间、到期时间、优先级、闹钟等复杂功能

3. **AI 智能分类**（后续版本）
   - 自动识别待办类别：工作/运动/投资/生活
   - 本地关键词匹配（当前版本）
   - 后续可接入 AI API

4. **多端同步**
   - PC 端（Web）
   - iOS App
   - Android App
   - 数据实时同步

5. **离线支持**
   - 离线可用
   - 联网自动同步

### 非功能需求
- 简洁的 UI 设计
- 快速响应
- 数据安全

## 技术选型

### 前端
| 技术 | 选型 | 理由 |
|------|------|------|
| 框架 | React Native + Expo | 一套代码三端运行（iOS/Android/Web） |
| 语言 | TypeScript | 类型安全，开发体验好 |
| 状态管理 | Zustand | 轻量级，简单易用 |
| 样式 | NativeWind (TailwindCSS) | 快速开发，一致性高 |
| 离线存储 | AsyncStorage + WatermelonDB | 本地持久化 |

### 后端
| 技术 | 选型 | 理由 |
|------|------|------|
| BaaS | Supabase | 开箱即用的数据库、认证、实时订阅 |
| 数据库 | PostgreSQL | Supabase 内置，数据完全掌控 |
| 认证 | Supabase Auth | 邮箱+密码登录 |
| 实时同步 | Supabase Realtime | WebSocket 自动推送数据变更 |

### 开发工具
| 工具 | 用途 |
|------|------|
| Git | 版本控制 |
| GitLab | 代码托管 |
| VS Code / TRAE | 代码编辑 |

## 项目结构

```
D:\myToDo\
├── .trae/                    # TRAE 项目上下文
│   └── project_context.md    # 本文件
├── docs/                     # 项目文档
│   ├── 01-需求分析.md
│   ├── 02-技术选型.md
│   ├── 03-架构设计.md
│   ├── 04-数据库设计.md
│   ├── 05-API设计.md
│   ├── 06-开发日志.md
│   └── 07-部署指南.md
├── src/                      # 源代码（待创建）
│   ├── app/                  # Expo Router 路由
│   ├── components/           # UI 组件
│   ├── stores/               # Zustand 状态
│   ├── services/             # API 服务
│   ├── utils/                # 工具函数
│   └── types/                # TypeScript 类型
├── assets/                   # 静态资源
├── app.json                  # Expo 配置
├── package.json              # 依赖配置
└── tsconfig.json             # TypeScript 配置
```

## 数据模型

### 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 待办事项表 (todos)
```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('work', 'sport', 'investment', 'life')),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_created_at ON todos(created_at);
CREATE INDEX idx_todos_is_completed ON todos(is_completed);
```

## 开发进度

### 当前阶段: Phase 1 - 本地 MVP

- [x] 确定技术选型
- [x] 创建项目目录结构
- [x] 创建项目上下文文件
- [x] 初始化 Git 仓库
- [x] 初始化 Expo 项目
- [x] 安装核心依赖 (Zustand, NativeWind, Supabase)
- [x] 配置 TypeScript
- [x] 创建基础项目结构
- [ ] 配置 Supabase（需创建 Supabase 项目）
- [x] 实现基础 UI（首页待办列表）
- [ ] 实现本地存储（AsyncStorage 持久化）
- [ ] 实现用户认证
- [ ] 实现数据同步

### 里程碑

| 阶段 | 目标 | 状态 |
|------|------|------|
| Phase 1 | 本地 MVP（添加/完成/删除待办） | 进行中 |
| Phase 2 | 多端同步（Supabase 集成） | 待开始 |
| Phase 3 | AI 分类功能 | 待开始 |
| Phase 4 | 上线部署 | 待开始 |

## 关键决策记录

### 2026-04-08 项目启动
- **决策**: 使用 React Native + Expo + Supabase 技术栈
- **原因**: 
  - 一套代码三端运行
  - 开发效率高
  - 免费额度充足
  - 实时同步开箱即用

- **决策**: 先使用本地关键词匹配实现分类
- **原因**: 
  - 无额外成本
  - 离线可用
  - 后续可升级为 AI

## 环境要求

### 开发环境
- Node.js >= 18
- npm 或 pnpm
- Git
- Expo CLI (`npm install -g expo-cli`)

### 账号准备
- [ ] GitLab 账号
- [ ] Supabase 账号
- [ ] Apple Developer 账号（上架 App Store）
- [ ] Google Play Developer 账号（上架 Google Play）

## 快速开始

```bash
# 进入项目目录
cd D:\myToDo

# 安装依赖（项目初始化后）
npm install

# 启动开发服务器
npx expo start

# 运行 Web 版
npx expo start --web

# 运行 iOS 模拟器
npx expo start --ios

# 运行 Android 模拟器
npx expo start --android
```

## 联系与资源

- **项目位置**: D:\myToDo
- **代码仓库**: 待创建 (GitLab)
- **Supabase 项目**: 待创建

---

*最后更新: 2026-04-08*
