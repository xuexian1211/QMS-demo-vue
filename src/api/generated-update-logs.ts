/**
 * 自动生成的更新日志数据
 * 生成时间: 2026/2/24 00:18:41
 * 
 * 此文件由 scripts/generate-update-logs.js 自动生成
 * 请勿手动修改
 */

import type { UpdateLog } from '@/types'

export const generatedUpdateLogs: UpdateLog[] = [
  {
    "id": "log-2026-02-05-add-update-log-management",
    "version": "v1.0.0",
    "title": "Change: 新增系统更新日志管理",
    "content": "<div class=\"update-log-content\">\n<h2>📊 实现内容</h2>\n<div class=\"section\">\n<h3>前端开发</h3>\n<ul>\n<li>4.1 创建 `src/views/system/UpdateLog.vue` 组件</li>\n<li>5.1 创建 `src/views/system/UpdateLogEditor.vue` 组件</li>\n<li>5.2 集成富文本编辑器组件(wangEditor 5)</li>\n<li>6.1 创建 `src/views/system/UpdateLogDetail.vue` 详情页面组件</li>\n<li>6.7 实现按角色筛选 Tab(全部/前端/后端/测试)</li>\n<li>7.5 实现任务角色分类逻辑(根据关键词匹配前端/后端/测试)</li>\n<li>11.2 实现前端路由守卫权限校验(使用现有路由守卫)</li>\n<li>12.1 单元测试:更新日志组件测试</li>\n</ul>\n<h3>后端开发</h3>\n<ul>\n<li>1.3 定义更新日志 API 请求/响应类型</li>\n<li>1.5 定义设计文档 API 请求/响应类型</li>\n<li>2.1 设计数据库表结构 `update_logs` 和 `design_documents`</li>\n<li>7.7 调用更新日志创建 API 保存生成的日志(生成 TypeScript 文件)</li>\n<li>7.8 调用设计文档创建 API 批量保存解析的任务(Mock 数据集成)</li>\n<li>9.1 创建 `src/api/updateLog.ts` API 服务文件</li>\n<li>9.2 封装所有更新日志相关的 API 调用(Mock 实现)</li>\n<li>11.4 后端 API 接口权限校验</li>\n<li>12.2 集成测试:API 接口测试</li>\n</ul>\n<h3>测试</h3>\n<ul>\n<li>7.10 测试自动生成流程(端到端测试)</li>\n<li>12.3 端到端测试:完整流程测试</li>\n<li>12.4 手动测试所有功能点</li>\n<li>12.5 性能测试(列表加载、富文本编辑器性能)</li>\n</ul>\n<h3>其他</h3>\n<ul>\n<li>1.1 定义更新日志 TypeScript 接口类型 (`src/types/index.ts`)</li>\n<li>1.2 制定更新日志数据结构(版本号、标题、内容、影响范围、状态、发布时间等)</li>\n<li>1.4 定义功能设计文档 TypeScript 接口类型(DesignDocument, DesignTask)</li>\n<li>2.2 实现更新日志列表查询接口 `GET /api/update-logs`</li>\n<li>2.3 实现更新日志详情查询接口 `GET /api/update-logs/:id`</li>\n<li>2.4 实现更新日志创建接口 `POST /api/update-logs`</li>\n<li>2.5 实现更新日志更新接口 `PUT /api/update-logs/:id`</li>\n<li>2.6 实现更新日志删除接口 `DELETE /api/update-logs/:id`</li>\n<li>2.7 实现更新日志发布接口 `POST /api/update-logs/:id/publish`</li>\n<li>2.8 实现设计文档列表查询接口 `GET /api/design-documents?updateLogId=xxx`</li>\n<li>2.9 实现设计文档创建接口 `POST /api/design-documents`(支持批量)</li>\n<li>2.10 实现设计文档更新接口 `PUT /api/design-documents/:id`</li>\n<li>2.11 实现设计任务状态更新接口 `PATCH /api/design-documents/:id/tasks/:taskId`</li>\n<li>3.1 在 `router/index.ts` 中新增更新日志相关路由</li>\n<li>3.2 在 `MainLayout.vue` 顶部导航栏添加更新日志按钮(📝图标)</li>\n<li>3.3 实现更新日志按钮的徽章数字提示(显示未读更新数量)</li>\n<li>4.2 实现列表页面布局(工具栏 + 搜索表单 + 数据表格)</li>\n<li>4.3 实现数据表格配置(列定义、分页、排序)</li>\n<li>4.4 实现搜索和筛选功能(按版本号、日期范围、状态筛选)</li>\n<li>4.5 实现操作按钮(新增、编辑、删除、查看详情、发布)</li>\n<li>4.6 实现数据加载和状态管理</li>\n<li>5.3 实现表单字段(版本号、标题、更新类型、影响范围等)</li>\n<li>5.4 实现表单验证规则</li>\n<li>5.5 实现保存为草稿和发布功能</li>\n<li>5.6 实现预览功能(Markdown 模式)</li>\n<li>6.2 实现版本信息展示</li>\n<li>6.3 实现更新内容渲染(支持 Markdown 或 HTML)</li>\n<li>6.4 实现影响范围和相关链接展示</li>\n<li>6.5 实现返回列表和编辑按钮</li>\n<li>6.6 实现功能设计文档关联区域</li>\n<li>6.8 实现设计任务列表展示(任务编号、标题、状态、工时、依赖)</li>\n<li>6.9 实现任务状态切换功能(标记为完成/进行中)</li>\n<li>6.10 实现任务依赖关系可视化(点击跳转到依赖任务)</li>\n<li>7.1 研究 `openspec archive` 命令的钩子机制或扩展点</li>\n<li>7.2 创建提案归档时的自动生成脚本 `scripts/generate-update-log.js`</li>\n<li>7.3 解析 `proposal.md` 生成更新日志内容(标题、内容、影响范围)</li>\n<li>7.4 解析 `tasks.md` 提取任务结构(识别##阶段、识别任务项)</li>\n<li>7.6 实现任务依赖关系解析(解析Dependencies部分)</li>\n<li>7.9 关联设计文档到更新日志记录(updateLogId)</li>\n<li>8.1 扩展消息通知 Store(`src/stores/notification.ts`如不存在则创建)</li>\n<li>8.2 实现新更新日志发布时的通知推送</li>\n<li>8.3 在消息通知下拉框中显示更新日志通知</li>\n<li>8.4 实现点击通知跳转到更新日志详情</li>\n<li>8.5 实现未读更新日志计数徽章</li>\n<li>9.3 实现错误处理和统一响应格式</li>\n<li>9.4 添加请求拦截器和响应拦截器(使用现有机制)</li>\n<li>10.1 应用 JNPF 风格的页面布局</li>\n<li>10.2 实现响应式设计(支持移动端查看)</li>\n<li>10.3 添加加载状态和骨架屏</li>\n<li>10.4 优化动画和过渡效果</li>\n<li>10.5 添加空状态提示</li>\n<li>11.1 定义更新日志管理权限(查看、创建、编辑、删除、发布)</li>\n<li>11.3 实现页面按钮级权限控制</li>\n<li>13.1 编写用户使用文档</li>\n<li>13.2 编写开发者技术文档</li>\n<li>13.3 更新系统菜单配置文档</li>\n<li>13.4 准备演示数据和截图</li>\n<li>13.5 代码审查和优化</li>\n</ul>\n</div>\n\n</div>",
    "contentType": "html",
    "updateType": "feature",
    "affectedModules": [
      "系统管理"
    ],
    "relatedChangeId": "2026-02-05-add-update-log-management",
    "status": "published",
    "publishedAt": "2026-02-23T16:18:41.681Z",
    "publishedBy": "system",
    "createTime": "2026-02-23T16:18:41.681Z",
    "updateTime": "2026-02-23T16:18:41.681Z",
    "creator": "system",
    "updater": "system",
    "orgId": "org-001"
  },
  {
    "id": "log-2026-02-06-enhance-gauge-lifecycle-management",
    "version": "v1.0.1",
    "title": "增强量检具全生命周期管理",
    "content": "<div class=\"update-log-content\">\n<h2>📊 实现内容</h2>\n<div class=\"section\">\n<h3>前端开发</h3>\n<ul>\n<li>创建 `GaugeLedgerDetail.vue` 组件</li>\n</ul>\n<h3>其他</h3>\n<ul>\n<li>在 `src/types/index.ts` 中扩展 `GaugeLedger` 接口，新增字段：</li>\n<li>定义 `GaugeStatus` 枚举类型</li>\n<li>定义 `CalibrationRecord` 校准记录接口</li>\n<li>更新 `GaugeLedgerList.vue` 中的模拟数据，包含新增字段的示例值</li>\n<li>添加校准记录的模拟数据</li>\n<li>修改 `GaugeLedgerList.vue` 中的台账编辑弹窗</li>\n<li>使用分组布局（基本信息、技术参数、校准信息、管理信息）</li>\n<li>添加必填项验证规则</li>\n<li>校准周期输入时自动计算下次校准日期</li>\n<li>列表增加「校准状态」指示列</li>\n<li>支持按校准状态筛选</li>\n<li>在台账列表页头部增加「导入」按钮</li>\n<li>实现模拟导入逻辑，支持批量增加台账记录</li>\n<li>导入完成后给予结果反馈（成功条数）</li>\n<li>使用 Tab 页布局：</li>\n<li>添加路由配置</li>\n<li>在详情页「校准记录」Tab 中显示历史校准记录列表</li>\n<li>支持新增校准记录</li>\n<li>新增校准记录时自动更新台账的 `lastCalDate` 和 `nextCalDate`</li>\n<li>支持上传校准证书附件</li>\n<li>定义状态流转规则（状态机）</li>\n<li>在台账列表操作列增加\"状态变更\"按钮</li>\n<li>状态变更时记录变更日志</li>\n<li>限制无效的状态流转（如报废后不能再变更）</li>\n<li>在台账列表页顶部显示\"即将到期\"和\"已过期\"的数量统计卡片</li>\n<li>点击卡片筛选对应状态的记录</li>\n<li>考虑后续集成系统通知/消息推送</li>\n<li>在 `src/router/index.ts` 中添加台账详情页路由</li>\n<li>路由路径：`/inspection-model/gauge-ledgers/:id`</li>\n<li>确认现有菜单「量检具台账」能正确导航到列表页</li>\n<li>验证从列表页进入详情页的导航流程</li>\n</ul>\n</div>\n\n</div>",
    "contentType": "html",
    "updateType": "feature",
    "affectedModules": [
      "质量工具"
    ],
    "relatedChangeId": "2026-02-06-enhance-gauge-lifecycle-management",
    "status": "published",
    "publishedAt": "2026-02-23T16:18:41.682Z",
    "publishedBy": "system",
    "createTime": "2026-02-23T16:18:41.682Z",
    "updateTime": "2026-02-23T16:18:41.682Z",
    "creator": "system",
    "updater": "system",
    "orgId": "org-001"
  },
  {
    "id": "log-2026-02-06-refine-inspection-master-data",
    "version": "v1.0.2",
    "title": "Proposal: 优化设计检验方法与抽样方案",
    "content": "<div class=\"update-log-content\">\n<h2>📊 实现内容</h2>\n<div class=\"section\">\n<h3>前端开发</h3>\n<ul>\n<li>**Data Model**: 更新 Mock 数据及前端类型定义，增加 `orgId` 字段相关逻辑。 <!-- id: 0 --></li>\n<li>**Data Model**: 在 `SamplingRule` 前端类型中增加 `sampleSize` 和 `sampleSizeRate` 字段。 <!-- id: 4 --></li>\n</ul>\n<h3>其他</h3>\n<ul>\n<li>**UI Component**: 优化 `InspMethodList.vue` 的搜索表单，增加组织过滤预览。 <!-- id: 1 --></li>\n<li>**UI Logic**: 在列表页实现 \"集团\" 标签的视觉展示,区分数据来源。 <!-- id: 2 --></li>\n<li>**Refinement**: 完善检验方法编辑弹窗的字段校验（如方法名称必填、唯一性检查）。 <!-- id: 3 --></li>\n<li>**UI Component**: 修改 `SamplingPlanEdit.vue` 中的规则编辑弹窗。 <!-- id: 5 --></li>\n<li>**UI Logic**: 实现基于 `samplingMethod` 的表单字段动态显示切换逻辑。 <!-- id: 6 --></li>\n<li>**UI Logic**: 在编辑页面添加批量范围重叠的校验函数及 UI 提示。 <!-- id: 7 --></li>\n<li>**UX Polish**: 优化嵌套表格的展示样式，确保 Ac/Re 数据清晰易读。 <!-- id: 8 --></li>\n<li>**Validation**: 使用 `openspec validate` 验证所有变更。 <!-- id: 9 --></li>\n<li>**Regression**: 确保调整后的主数据能被检验模板正确引用（模拟验证）。 <!-- id: 10 --></li>\n</ul>\n</div>\n\n</div>",
    "contentType": "html",
    "updateType": "optimize",
    "affectedModules": [
      "质量检验"
    ],
    "relatedChangeId": "2026-02-06-refine-inspection-master-data",
    "status": "published",
    "publishedAt": "2026-02-23T16:18:41.682Z",
    "publishedBy": "system",
    "createTime": "2026-02-23T16:18:41.682Z",
    "updateTime": "2026-02-23T16:18:41.682Z",
    "creator": "system",
    "updater": "system",
    "orgId": "org-001"
  },
  {
    "id": "log-2026-02-23-optimize-insp-template",
    "version": "v1.0.3",
    "title": "Proposal: 优化 QMS 检验模板与方案核心模型设计",
    "content": "<div class=\"update-log-content\">\n<h2>📊 实现内容</h2>\n<div class=\"section\">\n<h3>前端开发</h3>\n<ul>\n<li>**前端实现 (`InspSchemeEdit.vue`)**：</li>\n<li>**前端实现**：</li>\n<li>**规格维护组件**：</li>\n</ul>\n<h3>后端开发</h3>\n<ul>\n<li>**API 实现**：</li>\n</ul>\n<h3>测试</h3>\n<ul>\n<li>编写单元测试：验证 `StrategyMatcher` 逻辑的正确性 (覆盖优先级、通配符等)。</li>\n</ul>\n<h3>其他</h3>\n<ul>\n<li>定义 `InspScheme` 和 `InspSchemeDetail` 的 TypeScript 接口。</li>\n<li>定义 `InspStrategy` (原 InspPlan) 的 TypeScript 接口，支持 `matchDimension` JSON 结构。</li>\n<li>更新 `MaterialSpec` 接口，确保 `inspItemCode` 的关联性。</li>\n<li>**匹配引擎重构**：</li>\n<li>验证功能流程：创建模板 -> 生成方案（引用模板）-> 编辑明细 -> 绑定策略 -> 配置规格。</li>\n</ul>\n</div>\n\n</div>",
    "contentType": "html",
    "updateType": "optimize",
    "affectedModules": [
      "质量检验"
    ],
    "relatedChangeId": "2026-02-23-optimize-insp-template",
    "status": "published",
    "publishedAt": "2026-02-23T16:18:41.682Z",
    "publishedBy": "system",
    "createTime": "2026-02-23T16:18:41.682Z",
    "updateTime": "2026-02-23T16:18:41.682Z",
    "creator": "system",
    "updater": "system",
    "orgId": "org-001"
  }
]
