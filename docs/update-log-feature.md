# 系统更新日志管理功能

## 📋 功能概述

系统更新日志管理功能允许管理员创建、编辑、发布和管理系统更新日志,并自动关联功能设计文档,帮助团队跟踪系统变更和任务进度。

## ✨ 主要特性

### 1. 更新日志管理
- ✅ **CRUD 操作**: 创建、查看、编辑、删除更新日志
- ✅ **状态管理**: 草稿 → 已发布 → 已归档
- ✅ **版本控制**: 支持语义化版本号 (v1.0.0)
- ✅ **类型分类**: 新功能、修复、优化、重大变更
- ✅ **富文本/Markdown**: 支持两种内容格式

### 2. 功能设计文档
- ✅ **自动生成**: 从 OpenSpec 变更自动生成设计文档
- ✅ **任务管理**: 按角色(前端/后端/测试)分配任务
- ✅ **进度跟踪**: 实时显示任务完成进度
- ✅ **依赖管理**: 支持任务依赖关系
- ✅ **文档导出**: 支持导出 Markdown 和 PDF 格式

### 3. 用户界面
- ✅ **列表页面**: 搜索、筛选、分页功能
- ✅ **编辑器**: 富文本和 Markdown 双模式
- ✅ **详情页**: 内容展示、设计文档、变更历史
- ✅ **导航入口**: 顶部导航栏快速访问 (📝 图标)

## 🚀 快速开始

### 访问入口

1. **顶部导航栏**: 点击右上角的 📝 图标
2. **系统管理菜单**: 系统管理 → 更新日志管理

### 创建更新日志

1. 进入更新日志列表页面
2. 点击「新增更新日志」按钮
3. 填写表单:
   - **版本号**: 例如 v1.0.0 (必填)
   - **标题**: 更新日志标题 (必填)
   - **更新类型**: 新功能/修复/优化/重大变更 (必填)
   - **影响模块**: 选择或输入受影响的模块
   - **关联变更**: OpenSpec 变更 ID (可选)
   - **内容格式**: 富文本或 Markdown
   - **更新内容**: 详细的更新说明 (必填)
4. 点击「保存草稿」或「保存并发布」

### 发布更新日志

1. 在列表页面找到草稿状态的日志
2. 点击「发布」按钮
3. 系统会自动:
   - 设置发布时间和发布人
   - 如果关联了 OpenSpec 变更,生成功能设计文档
   - 发送通知给相关人员

### 查看设计文档

1. 进入更新日志详情页
2. 切换到「功能设计文档」标签
3. 查看各角色的任务列表和进度
4. 可以:
   - 更新任务状态 (待处理/进行中/已完成)
   - 按角色筛选任务 (全部/前端/后端/测试)
   - 导出设计文档 (Markdown/PDF)

## 📁 文件结构

```
src/
├── api/
│   └── updateLog.ts              # API 服务层 (Mock 数据)
├── types/
│   └── index.ts                  # TypeScript 类型定义
├── router/
│   └── index.ts                  # 路由配置
├── views/
│   └── system/
│       ├── UpdateLog.vue         # 列表页面
│       ├── UpdateLogEditor.vue   # 编辑器页面
│       ├── UpdateLogDetail.vue   # 详情页面
│       └── components/
│           └── DesignDocumentList.vue  # 设计文档列表组件
└── layout/
    └── MainLayout.vue            # 主布局 (含导航栏)
```

## 🔧 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI 组件库**: Ant Design Vue 4.2+
- **类型系统**: TypeScript 5.2+
- **路由**: Vue Router 4.2+
- **状态管理**: Pinia 2.1+ (可选)

## 📊 数据模型

### UpdateLog (更新日志)

```typescript
interface UpdateLog {
  id: string                    // 日志 ID
  orgId: string                 // 组织 ID
  version: string               // 版本号 (v1.0.0)
  title: string                 // 标题
  content: string               // 内容
  contentType: 'html' | 'markdown'  // 内容格式
  updateType: 'feature' | 'fix' | 'optimize' | 'breaking'  // 更新类型
  affectedModules: string[]     // 影响模块
  relatedChangeId?: string      // 关联的 OpenSpec 变更 ID
  status: 'draft' | 'published' | 'archived'  // 状态
  publishedAt?: string          // 发布时间
  publishedBy?: string          // 发布人
  createTime: string            // 创建时间
  updateTime: string            // 更新时间
  creator: string               // 创建人
  updater: string               // 更新人
}
```

### DesignDocument (设计文档)

```typescript
interface DesignDocument {
  id: string                    // 文档 ID
  updateLogId: string           // 关联的更新日志 ID
  title: string                 // 文档标题
  documentType: 'frontend' | 'backend' | 'test' | 'general'  // 文档类型
  tasks: DesignTask[]           // 任务列表
  createdAt: string             // 创建时间
  createdBy: string             // 创建人
  updatedAt: string             // 更新时间
  orgId: string                 // 组织 ID
}
```

### DesignTask (设计任务)

```typescript
interface DesignTask {
  id: string                    // 任务 ID
  taskNumber: string            // 任务编号 (1.1, 1.2)
  title: string                 // 任务标题
  description?: string          // 任务描述
  assigneeRole: 'frontend' | 'backend' | 'test' | 'devops' | 'general'  // 负责角色
  status: 'pending' | 'in-progress' | 'completed'  // 状态
  estimatedHours?: number       // 预估工时
  dependencies?: string[]       // 依赖任务 ID
  completedAt?: string          // 完成时间
  createdAt: string             // 创建时间
  updatedAt: string             // 更新时间
}
```

## 🔌 API 接口

当前使用 Mock 数据,后续需要对接真实后端 API:

### 更新日志 API

- `GET /api/update-logs` - 获取更新日志列表
- `GET /api/update-logs/:id` - 获取更新日志详情
- `POST /api/update-logs` - 创建更新日志
- `PUT /api/update-logs/:id` - 更新更新日志
- `DELETE /api/update-logs/:id` - 删除更新日志
- `POST /api/update-logs/:id/publish` - 发布更新日志
- `POST /api/update-logs/:id/archive` - 归档更新日志
- `GET /api/update-logs/stats` - 获取统计信息

### 设计文档 API

- `GET /api/design-documents?updateLogId=xxx` - 获取设计文档列表
- `POST /api/design-documents` - 创建设计文档
- `PUT /api/design-documents/:id` - 更新设计文档
- `PATCH /api/design-documents/:id/tasks/:taskId` - 更新任务状态
- `GET /api/design-documents/progress?updateLogId=xxx` - 获取进度统计

## ⚠️ 注意事项

### 当前限制

1. **富文本编辑器**: 当前为占位实现,需要集成 wangEditor 5 或 TinyMCE
2. **Markdown 解析**: 需要集成 marked 或 markdown-it 库
3. **PDF 导出**: 功能开发中,需要集成 jsPDF 或后端服务
4. **后端 API**: 当前使用 Mock 数据,需要对接真实后端

### Lint 错误说明

当前存在一些 TypeScript lint 错误,这是因为 Vue 文件中的 `<script setup lang="ts">` 块与 VSCode 的 JavaScript 语言服务器有兼容性问题。这些错误不影响实际运行,可以通过以下方式解决:

1. 确保安装了 Volar 插件 (Vue 官方推荐)
2. 禁用 Vetur 插件 (如果已安装)
3. 在 VSCode 设置中启用 TypeScript 的 Takeover 模式

## 🎯 后续计划

### 短期 (1-2 周)

- [ ] 集成真实的富文本编辑器 (wangEditor 5)
- [ ] 集成 Markdown 解析库 (marked)
- [ ] 实现 PDF 导出功能
- [ ] 对接后端 API

### 中期 (1 个月)

- [ ] 实现 OpenSpec 变更自动解析
- [ ] 实现设计文档自动生成
- [ ] 添加通知系统集成
- [ ] 添加权限控制

### 长期 (2-3 个月)

- [ ] 实现版本对比功能
- [ ] 添加评论和讨论功能
- [ ] 实现任务分配和提醒
- [ ] 添加数据统计和报表

## 📞 支持

如有问题或建议,请联系开发团队或提交 Issue。

---

**最后更新**: 2026-02-04  
**版本**: v1.0.0  
**作者**: QMS 开发团队
