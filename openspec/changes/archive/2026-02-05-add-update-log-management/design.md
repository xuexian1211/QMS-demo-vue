# 技术设计文档

## Context
当前 QMS 系统缺少系统更新日志管理功能,用户无法快速了解系统的最新变化和新增功能。开发团队在进行 OpenSpec 提案归档时,也缺少自动化的变更记录机制。本设计旨在解决这两个问题,提供一个完整的更新日志管理解决方案。

**约束条件:**
- 必须遵循 Vue 3 + TypeScript + Ant Design Vue 技术栈
- 必须符合 JNPF 框架的设计模式和布局规范
- 前端为单页应用,无服务端渲染
- 需要与现有的系统管理模块无缝集成

**利益相关者:**
- 最终用户:需要了解系统更新内容
- 产品经理:需要向客户展示系统迭代进展
- 开发团队:需要自动化变更记录,减少手动维护成本
- 系统管理员:需要管理更新日志的发布和维护

## Goals / Non-Goals

### Goals
- 提供完整的更新日志 CRUD 功能
- 在导航栏提供快速访问入口(紧邻消息通知按钮)
- 支持富文本编辑和 Markdown 格式的更新内容
- 在 OpenSpec 提案归档时自动生成更新日志草稿
- 与消息通知系统集成,推送新更新日志
- 支持版本号管理和时间线展示
- 符合现有的 JNPF UI 设计规范
- **支持功能设计文档关联和管理**
- **支持按角色(前端/后端/测试)划分任务文档**
- **支持从 OpenSpec tasks.md 自动解析生成结构化设计文档**

### Non-Goals
- 不实现自动化部署流水线集成(仅限 OpenSpec 归档集成)
- 不实现多语言国际化(当前仅支持中文)
- 不实现更新日志的评论和互动功能(第一阶段)
- 不实现更新日志的订阅和邮件推送(第一阶段)
- 不实现更新日志的变更对比功能(第一阶段)

## Decisions

### Decision 1: 数据模型设计
**What:** 更新日志实体包含以下核心字段:
```typescript
interface UpdateLog {
  id: string                  // 唯一标识
  version: string             // 版本号(如 v1.2.0)
  title: string               // 更新标题
  content: string             // 更新内容(支持 HTML/Markdown)
  contentType: 'html' | 'markdown'  // 内容类型
  updateType: 'feature' | 'fix' | 'optimize' | 'breaking'  // 更新类型
  affectedModules: string[]   // 影响的模块
  relatedChangeId?: string    // 关联的 OpenSpec change-id
  status: 'draft' | 'published' | 'archived'  // 状态
  publishedAt?: Date          // 发布时间
  publishedBy?: string        // 发布人
  createdAt: Date             // 创建时间
  createdBy: string           // 创建人
  updatedAt: Date             // 更新时间
  updatedBy: string           // 更新人
  orgId: string               // 组织 ID(多组织支持)
}
```

**Why:** 这个数据模型覆盖了更新日志的核心需求,包括版本管理、内容存储、状态流转、审计追踪等。`relatedChangeId` 字段用于关联 OpenSpec 提案,便于追溯变更来源。

**Alternatives considered:**
- 简化版:仅包含标题、内容、时间 - 被否决,缺少版本管理和状态流转
- 扩展版:包含附件、标签、分类等 - 保留到后续迭代,避免初期过度设计

### Decision 2: 富文本编辑器选择
**What:** 使用 `@wangeditor/editor-for-vue@next` (wangEditor 5)

**Why:**
- 轻量级,性能好,适合集成到 Vue 3 项目
- 支持 TypeScript,类型安全
- 提供丰富的工具栏和插件扩展能力
- 支持 Markdown 快捷输入
- 中文文档完善,社区活跃
- 比 TinyMCE 和 Quill 更易于配置和定制

**Alternatives considered:**
- TinyMCE: 功能强大但体积较大,配置复杂,需要付费才能使用完整功能
- Quill: 轻量但扩展能力有限,不支持表格等复杂功能
- Vditor: Markdown 专用,但需求中可能需要更丰富的格式支持

### Decision 3: OpenSpec 归档自动生成策略
**What:** 创建 Node.js 脚本 `scripts/generate-update-log.js`,在执行 `openspec archive` 后手动或通过 git hook 触发

**Why:**
- OpenSpec CLI 目前不提供原生的归档后钩子(hook)功能
- 手动触发脚本提供更大的灵活性,可以在归档前预览生成内容
- 可以集成到 CI/CD 流程中自动执行
- 脚本可以解析 `proposal.md` 和 `tasks.md`,提取关键信息生成更新日志

**Alternatives considered:**
- 修改 OpenSpec CLI 源码添加钩子 - 被否决,维护成本高,不利于升级
- 完全手动创建更新日志 - 被否决,自动化程度低,容易遗漏

**实现方案:**
```javascript
// scripts/generate-update-log.js
// 1. 解析 changes/archive/<date>-<change-id>/proposal.md
// 2. 提取 "What Changes" 部分作为更新内容
// 3. 解析 tasks.md 生成完成的功能列表
// 4. 调用后端 API POST /api/update-logs 创建草稿
// 5. 输出生成的更新日志 ID 和链接
```

### Decision 4: 导航栏集成位置
**What:** 在 `MainLayout.vue` 的导航栏右侧,紧邻消息通知按钮(🔔)之后添加更新日志按钮(📝)

**Why:**
- 更新日志与消息通知在用户心智模型中相近,都是"系统信息"类功能
- 紧邻布局便于用户关联和发现
- 保持导航栏的简洁性,不增加菜单层级

**Alternatives considered:**
- 放在"系统管理"子菜单中 - 被否决,用户访问路径过长,不利于快速查看
- 作为独立的顶级菜单项 - 被否决,占用过多导航空间

### Decision 5: 版本号管理策略
**What:** 支持语义化版本号(Semantic Versioning)格式,如 `v1.2.3`,同时支持自定义版本号

**Why:**
- 符合行业标准和用户习惯
- 便于排序和版本对比
- 灵活支持内部迭代需求(如 `v1.2.3-beta`)

**Validation:** 使用正则表达式验证版本号格式,提示用户输入规范

### Decision 6: 状态流转设计
**What:** 更新日志状态流转: `草稿(draft)` → `已发布(published)` → `已归档(archived)`

**Why:**
- 简单清晰的状态机,符合发布流程
- 草稿状态允许多次修改,已发布后不可编辑(避免历史记录被篡改)
- 已归档状态用于隐藏过期的更新日志,保持列表整洁

**Alternatives considered:**
- 允许已发布状态继续编辑 - 被否决,容易导致历史记录不一致
- 增加"审批中"状态 - 保留到后续迭代,初期简化流程

### Decision 7: 功能设计文档数据模型
**What:** 功能设计文档实体包含以下核心字段:
```typescript
interface DesignDocument {
  id: string                  // 唯一标识
  updateLogId: string         // 关联的更新日志 ID
  title: string               // 文档标题
  documentType: 'frontend' | 'backend' | 'test' | 'general'  // 文档类型
  tasks: DesignTask[]         // 任务列表
  createdAt: Date             // 创建时间
  createdBy: string           // 创建人
  updatedAt: Date             // 更新时间
  orgId: string               // 组织 ID
}

interface DesignTask {
  id: string                  // 任务唯一标识
  taskNumber: string          // 任务编号(如 "1.1", "2.3")
  title: string               // 任务标题
  description: string         // 任务描述
  assigneeRole: 'frontend' | 'backend' | 'test' | 'all'  // 负责角色
  status: 'pending' | 'in-progress' | 'completed'  // 任务状态
  estimatedHours?: number     // 预计工时
  dependencies: string[]      // 依赖的任务 ID 列表
  completedAt?: Date          // 完成时间
}
```

**Why:** 
- 通过 `updateLogId` 关联更新日志,支持一对多关系
- `documentType` 字段按角色划分文档,便于团队成员快速定位
- `DesignTask` 结构化存储任务信息,包含状态、工时、依赖关系等
- `assigneeRole` 明确任务的负责角色,支持协作
- `dependencies` 字段记录任务依赖,便于管理开发顺序

**Alternatives considered:**
- 将所有任务存储为单个 Markdown 文本 - 被否决,难以结构化查询和展示
- 不区分文档类型,所有任务混在一起 - 被否决,不利于角色分工阅读
- 使用单独的任务管理系统 - 被否决,过度设计,增加系统复杂度

### Decision 8: OpenSpec tasks.md 自动解析策略
**What:** 扩展 `scripts/generate-update-log.js` 脚本,自动解析 tasks.md 并生成结构化设计文档

**Why:**
- 复用现有的 OpenSpec tasks.md 内容,避免重复劳动
- 自动化生成减少手动录入错误
- 保持更新日志与开发任务的一致性

**实现方案:**
```javascript
// scripts/generate-update-log.js (扩展)
// 1. 解析 tasks.md,提取任务结构
//    - 识别 ## 标题作为阶段
//    - 识别 - [ ] / - [x] 作为任务项
//    - 提取任务编号、标题、描述
// 2. 根据任务标题关键词分类角色
//    - 包含 "前端"、"组件"、"页面" → frontend
//    - 包含 "后端"、"API"、"接口" → backend
//    - 包含 "测试"、"验证" → test
//    - 其他 → general
// 3. 分析任务依赖关系
//    - 解析 "Dependencies" 部分
//    - 提取任务之间的依赖关系
// 4. 调用 API POST /api/design-documents 批量创建设计文档
// 5. 关联到更新日志记录
```

**Alternatives considered:**
- 完全手动创建设计文档 - 被否决,工作量大,容易遗漏
- 使用 AI 自动分类任务角色 - 保留到后续优化,初期使用关键词匹配
- 不解析依赖关系 - 被否决,依赖关系对开发顺序很重要

### Decision 9: 设计文档展示方式
**What:** 在更新日志详情页显示关联的设计文档,支持按角色筛选查看

**Why:**
- 用户可以在一个页面查看更新内容和对应的设计文档,提高效率
- 按角色筛选允许不同团队成员快速找到自己相关的任务
- 支持展开/折叠,避免信息过载

**UI 设计:**
```
更新日志详情页
├── 更新内容区域(富文本/Markdown 渲染)
├── 影响范围和版本信息
└── 功能设计文档区域
    ├── Tab 切换: [全部] [前端任务] [后端任务] [测试任务]
    └── 任务列表
        └── 任务卡片
            ├── 任务编号和标题
            ├── 任务描述
            ├── 状态、预计工时
            └── 依赖任务(可点击跳转)
```

**Alternatives considered:**
- 设计文档单独一个页面 - 被否决,用户需要在两个页面之间跳转,体验不佳
- 不支持按角色筛选 - 被否决,任务多时难以快速定位
- 使用树状结构展示 - 保留到后续优化,初期使用列表+筛选

## Risks / Trade-offs

### Risk 1: 富文本编辑器性能问题
- **风险:** 大量内容时编辑器可能卡顿
- **缓解措施:** 
  - 限制单条更新日志内容长度(建议 10,000 字符)
  - 使用虚拟滚动优化长列表渲染
  - 提供 Markdown 模式作为备选方案

### Risk 2: OpenSpec 自动生成内容质量问题
- **风险:** 自动解析的内容可能不符合发布标准,需要大量人工修改
- **缓解措施:**
  - 生成的更新日志默认为草稿状态,必须人工审核后才能发布
  - 提供模板和格式指南,规范 `proposal.md` 的书写
  - 支持手动调整生成的内容

### Risk 3: 前后端接口不一致
- **风险:** 前端开发依赖后端 API,可能阻塞开发进度
- **缓解措施:**
  - 先定义 TypeScript 接口类型和 Mock 数据
  - 前端使用 Mock Service Worker (MSW) 或 JSON Server 模拟后端
  - 前后端并行开发,定期同步接口变更

### Trade-off 1: 富文本 vs Markdown
- **权衡:** 富文本编辑器功能丰富但复杂,Markdown 简洁但格式有限
- **决定:** 同时支持两种格式,通过 `contentType` 字段区分,由创建者选择
- **理由:** 满足不同用户的偏好,技术用户可能更喜欢 Markdown,产品人员可能更喜欢富文本

### Trade-off 2: 实时通知 vs 轮询通知
- **权衡:** WebSocket 实时通知成本高,HTTP 轮询延迟高
- **决定:** 第一阶段使用轮询通知(每 30 秒查询一次未读数量)
- **理由:** 更新日志不是强实时需求,轮询足够满足需求,降低系统复杂度

## Migration Plan

### 数据迁移
当前系统没有历史更新日志数据,无需数据迁移。

### 功能上线计划
1. **Phase 1:** 核心 CRUD 功能上线,手动创建更新日志
2. **Phase 2:** 集成 OpenSpec 自动生成功能
3. **Phase 3:** 消息通知集成和未读徽章
4. **Phase 4:** 优化和增强(评论、订阅等)

### 回滚策略
- 前端功能可以通过路由配置快速下线
- 后端 API 通过功能开关控制是否启用
- 数据库表保留,不影响现有功能

## Open Questions

1. **Q: 更新日志的权限粒度如何设计?**
   - A: 初期方案 - 系统管理员和超级管理员可以创建、编辑、发布;普通用户只能查看已发布的更新日志

2. **Q: 是否需要支持多版本对比功能?**
   - A: 暂不支持,保留到后续迭代,避免初期过度设计

3. **Q: OpenSpec 归档脚本应该在何时触发?**
   - A: 提供两种方式 - (1) 手动执行脚本 `npm run generate:update-log <change-id>` (2) Git hook 在归档 commit 后自动触发

4. **Q: 更新日志的多语言支持?**
   - A: 第一阶段仅支持中文,后续根据需求扩展国际化

5. **Q: 是否需要支持更新日志的草稿协作(多人编辑)?**
   - A: 暂不支持,第一阶段仅支持单人编辑,保留到后续迭代

## Technical Dependencies

### 前端依赖
```json
{
  "@wangeditor/editor": "^5.1.23",
  "@wangeditor/editor-for-vue": "^5.1.12",
  "dayjs": "^1.11.x" // 已有依赖
}
```

### 开发工具依赖
```json
{
  "fs-extra": "^11.0.0",    // Node.js 脚本文件操作
  "gray-matter": "^4.0.3",  // 解析 Markdown frontmatter
  "marked": "^12.0.0"       // Markdown 解析(如需展示)
}
```

## Performance Considerations

### 前端性能
- 更新日志列表使用分页,每页 20 条
- 富文本编辑器按需加载,减少初始包体积
- 图片上传支持压缩和 CDN 加速

### 后端性能
- 列表查询添加索引(`version`, `status`, `publishedAt`)
- 使用缓存存储热门更新日志(Redis)
- 限制单条更新日志内容大小(< 1MB)

## Security Considerations

- 富文本内容存储前进行 XSS 过滤(使用 DOMPurify 或后端过滤)
- API 接口需要身份认证和权限校验
- 防止 CSRF 攻击(使用 CSRF Token)
- 限制 API 调用频率(Rate Limiting)
