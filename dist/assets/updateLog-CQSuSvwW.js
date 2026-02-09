const g=[{id:"log-refine-inspection-master-data",version:"v1.2.0",title:"Change: 优化设计检验方法与抽样方案",content:`<div class="update-log-content">
<h2>📋 变更背景</h2>
<div class="section">
<p>为了对齐《质量检验主数据模型设计》文档，系统对检验方法和抽样方案进行了深度优化，重点解决了抽样逻辑不完整、多组织支持不足以及数据一致性校验薄弱的问题。</p>
</div>

<h2>✨ 主要变更</h2>
<div class="section">
<h3>1. 检验方法 (Inspection Method) 优化</h3>
<ul>
<li><strong>多组织隔离与引用</strong>：支持标记为“集团”或特定工厂，实现集团标准与工厂私有方法的并存。对于工厂用户，列表中会同时显示集团级（带“集团”标签）和本工厂的方法。</li>
<li><strong>附件管理增强</strong>：支持为检验方法关联指导书附件ID（如 SIP 文件），便于检验执行时调取。</li>
<li><strong>唯一性校验</strong>：实现了方法名称在同一组织下的唯一性校验。</li>
</ul>

<h3>2. 抽样方案 (Sampling Plan) 优化</h3>
<ul>
<li><strong>动态表单交互</strong>：抽样规则编辑器根据抽样方法（国标、固定数量、百分比、全检）动态切换表单项。</li>
<li><strong>可编辑明细表</strong>：国标模式下支持直接编辑 Ac、Re、批量上下限等明细数据。</li>
<li><strong>强化业务校验</strong>：增加了批量范围重叠检测以及 Ac/Re 逻辑校验（Re 必须大于 Ac）。</li>
</ul>
</div>

<h2>📊 实现内容</h2>
<div class="section">
<h3>前端开发</h3>
<ul>
<li>重构 <code>SamplingPlanEdit.vue</code> 实现动态表单逻辑与 Alert 提示</li>
<li>增强 <code>SamplingPlanList.vue</code> 支持多组织过滤</li>
<li>增强 <code>InspMethodList.vue</code> 支持多组织逻辑与标签显示</li>
<li>实现检验方法名称唯一性校验 (Mock 实现)</li>
</ul>
<h3>其他</h3>
<ul>
<li>更新 <code>src/types/index.ts</code> 中的 <code>UpdateLog</code> 相关定义</li>
<li>维护 OpenSpec 规格文档与任务进度</li>
</ul>
</div>

<h2>⚠️ 影响范围</h2>
<div class="section">
<ul>
<li><strong>受影响模块</strong>：质量主数据、检验模型管理</li>
<li><strong>用户操作</strong>：检验员在配置时能获得更好的引导和更强的数据约束。</li>
</ul>
</div>
</div>`,contentType:"html",updateType:"feature",affectedModules:["质量主数据","质量检验"],relatedChangeId:"refine-inspection-master-data",status:"published",publishedAt:"2026-02-06T10:15:00.000Z",publishedBy:"system",createTime:"2026-02-06T10:15:00.000Z",updateTime:"2026-02-06T10:15:00.000Z",creator:"system",updater:"system",orgId:"org-001"},{id:"log-enhance-gauge-lifecycle-management",version:"v1.1.0",title:"Change: 增强量检具全生命周期管理",content:`<div class="update-log-content">
<h2>📄 Original Proposal (proposal.md)</h2>
<pre>
# 增强量检具全生命周期管理

## 变更摘要

基于需求文档第四部分 1.4 量检具类型库及项目规范 \`SF-QMS-project.md\` 中定义的量检具管理需求，对现有 \`GaugeLedgerList.vue\` 进行功能增强，实现量检具全生命周期管理。

## 问题背景

### 现状分析

当前系统已实现：
- ✅ **量检具类型树**：左侧树状分类结构，支持新增/编辑/删除类型
- ✅ **量检具台账列表**：右侧表格展示，包含基础字段（量具编号、名称、规格型号、状态、下次校准日期）
- ✅ **基础 CRUD 操作**：新增/编辑/删除/批量删除/导出

根据 \`SF-QMS-project.md\` 第 922-927 行定义的完整需求，尚未实现：
- ❌ **校准管理**：内部校准、外部校准、校准计划、校准记录
- ❌ **MSA 测量系统分析**：GR&R 分析、偏倚分析、线性分析、稳定性分析
- ❌ **维护管理**：日常维护、故障维修、报废管理
- ❌ **追溯管理**：溯源管理、不确定度评估、使用规范

### 对照需求文档差距

| 需求文档字段 | 现有实现 | 差距 |
|-------------|---------|------|
| \`typeName\` 类型名称 | ✅ 已实现 | - |
| \`precision\` 精度 | ✅ 已实现 | - |
| \`isMsaRequired\` 是否需 MSA | ✅ UI 显示 | ❌ 无 MSA 流程集成 |
| 校准周期 | ❌ 台账只有下次校准日期 | 缺少校准周期字段和校准记录管理 |
| 量程范围 | ❌ 未实现 | 缺少量程上限/下限字段 |

## 提案范围

本提案聚焦于**第一阶段**需求，增强现有量检具台账功能，扩展数据模型和关键管理功能：

1. **扩展台账数据模型**：增加量程、校准周期、制造商、有效期等必要字段
2. **校准管理功能**：校准计划、校准记录、校准到期预警
3. **状态生命周期管理**：完善状态流转（在用 → 校准中 → 封存 → 报废）

> [!NOTE]
> MSA 测量系统分析、高级维护管理、追溯管理等功能计划在后续阶段实现，本提案不涉及。

## 提案变更

### 能力 1：扩展量检具台账数据模型

#### 新增字段

\`\`\`typescript
interface GaugeLedger {
  // 现有字段
  id: number
  gaugeNo: string       // 量具编号
  gaugeName: string     // 量具名称
  typeId: number        // 类型ID
  model: string         // 规格型号
  status: GaugeStatus   // 状态
  nextCalDate: string   // 下次校准日期
  description: string   // 描述

  // 新增字段
  manufacturer: string        // 制造商/厂家
  serialNo: string            // 出厂序列号
  measureRange: string        // 量程范围 (如 "0-150mm")
  resolution: number          // 分辨率/分度值
  accuracy: string            // 精度等级
  calibrationCycle: number    // 校准周期（月）
  lastCalDate: string         // 上次校准日期
  purchaseDate: string        // 购置日期
  expiryDate: string          // 有效期/报废日期
  location: string            // 存放位置/使用部门
  custodian: string           // 保管人
  certificateNo: string       // 检定证书编号
  attachmentIds: string[]     // 附件（证书、说明书等）
}

type GaugeStatus = 'IN_USE' | 'CALIBRATING' | 'SEALED' | 'SCRAPPED'
\`\`\`

### 能力 2：校准管理功能

#### 数据模型

\`\`\`typescript
interface CalibrationRecord {
  id: number
  gaugeId: number           // 关联量检具台账
  calibrationType: 'INTERNAL' | 'EXTERNAL'  // 校准类型：内校/外校
  calibrationDate: string   // 校准日期
  nextCalDate: string       // 下次校准日期
  result: 'PASS' | 'FAIL' | 'CONDITIONAL'  // 校准结果
  calibrationOrg: string    // 校准机构
  calibrator: string        // 校准人员
  certificateNo: string     // 证书编号
  beforeValue: string       // 校准前数据
  afterValue: string        // 校准后数据
  deviation: string         // 偏差值
  conclusion: string        // 结论/备注
  attachmentIds: string[]   // 附件（校准证书等）
}
\`\`\`

#### UI 功能

- 台账详情页新增「校准记录」Tab 页
- 支持记录每次校准的结果和证书
- 校准到期提醒列表页（提前 N 天预警）

### 能力 3：状态生命周期管理

#### 状态流转规则

\`\`\`
┌─────────┐  校准完成(合格)  ┌─────────┐
│  在用   │ <────────────── │ 校准中  │
│ IN_USE  │ ──────────────> │CALIBR..│
└────┬────┘  送去校准        └────┬────┘
     │                           │
     │ 封存                       │ 校准不合格
     ↓                           ↓
┌─────────┐                ┌─────────┐
│  封存   │ ─────────────> │  报废   │
│ SEALED  │    报废处理     │SCRAPPED │
└─────────┘                └─────────┘
\`\`\`

#### 业务规则

1. **校准到期预警**：距离下次校准日期 ≤ 14 天时，在列表中高亮提醒
2. **超期自动封存**：校准日期已过的量检具自动标记为"待校准"状态
3. **状态变更记录**：每次状态变更自动记录日志

## 验证计划

### 手动验证

1. **台账扩展字段验证**
   - 启动开发服务器：\`npm run dev\`
   - 访问量检具台账页面
   - 新增量检具，验证新增字段（制造商、量程、校准周期等）能够正确保存和展示

2. **校准记录功能验证**
   - 选择一个量检具，进入详情页
   - 在「校准记录」Tab 页新增一条校准记录
   - 验证校准记录正确保存，且自动更新台账的「上次校准日期」和「下次校准日期」

3. **状态流转验证**
   - 验证量检具可以从「在用」变更为「校准中」
   - 验证校准完成后可以变更回「在用」
   - 验证「报废」状态的量检具不能再变更为其他状态
</pre>

<h2>📐 Technical Design (design.md)</h2>
<pre>
# 设计文档：量检具全生命周期管理

## 架构概述

本设计基于现有 \`GaugeLedgerList.vue\` 组件，扩展量检具台账的数据模型和管理功能，实现量检具全生命周期管理。

## 数据模型设计

### 1. 量检具台账扩展 (GaugeLedger)

**现有字段**：
\`\`\`typescript
interface GaugeLedger {
  id: number
  gaugeNo: string
  gaugeName: string
  typeId: number
  model: string
  status: string
  nextCalDate: string
  description: string
}
\`\`\`

**扩展后字段**：
\`\`\`typescript
interface GaugeLedger {
  // === 基本信息 ===
  id: number
  gaugeNo: string           // 量具编号（唯一）
  gaugeName: string         // 量具名称
  typeId: number            // 关联量检具类型
  typeName: string          // 冗余：类型名称
  model: string             // 规格型号
  description: string       // 描述/备注

  // === 技术参数 ===
  manufacturer: string      // 制造商/厂家
  serialNo: string          // 出厂序列号
  measureRange: string      // 量程范围（如 "0-150mm"）
  resolution: number        // 分辨率/分度值
  accuracy: string          // 精度等级

  // === 校准信息 ===
  calibrationCycle: number  // 校准周期（月）
  lastCalDate: string       // 上次校准日期
  nextCalDate: string       // 下次校准日期
  certificateNo: string     // 当前有效检定证书编号

  // === 管理信息 ===
  status: GaugeStatus       // 当前状态
  purchaseDate: string      // 购置日期
  expiryDate: string        // 有效期/预计报废日期
  location: string          // 存放位置/使用部门
  custodian: string         // 保管人/责任人
  attachmentIds: string[]   // 附件列表（证书、说明书等）
}

type GaugeStatus = 'IN_USE' | 'CALIBRATING' | 'SEALED' | 'SCRAPPED'
\`\`\`

### 2. 校准记录表 (CalibrationRecord)

\`\`\`typescript
interface CalibrationRecord {
  id: number
  gaugeId: number                   // 关联量检具台账
  calibrationType: CalibrationType  // 校准类型
  calibrationDate: string           // 校准日期
  nextCalDate: string               // 下次校准日期
  result: CalibrationResult         // 校准结果
  calibrationOrg: string            // 校准机构
  calibrator: string                // 校准人员
  certificateNo: string             // 证书编号
  beforeValue: string               // 校准前数据/读数
  afterValue: string                // 校准后数据/读数
  deviation: string                 // 偏差值
  conclusion: string                // 结论/备注
  attachmentIds: string[]           // 附件（校准证书扫描件等）
  createdAt: string                 // 创建时间
  createdBy: string                 // 创建人
}

type CalibrationType = 'INTERNAL' | 'EXTERNAL'
type CalibrationResult = 'PASS' | 'FAIL' | 'CONDITIONAL'
\`\`\`

### 3. 状态变更记录表 (GaugeStatusLog)

\`\`\`typescript
interface GaugeStatusLog {
  id: number
  gaugeId: number         // 关联量检具台账
  fromStatus: GaugeStatus // 原状态
  toStatus: GaugeStatus   // 新状态
  reason: string          // 变更原因
  operator: string        // 操作人
  operateTime: string     // 操作时间
}
\`\`\`

## 页面组件设计

### 1. GaugeLedgerList.vue 修改

**表格列扩展**：增加校准状态指示列

**新增操作按钮**：
- 「查看」：进入详情页
- 「编辑」：编辑台账信息（弹窗）
- 「删除」：删除台账

### 2. GaugeLedgerDetail.vue（新增）

**布局结构**（参考 \`InspPlanEdit.vue\` 风格）：

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ ← 返回        量检具详情: G-001 数显卡尺        [编辑] [校准] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 基本信息 Card                                           │ │
│ │ ┌───────────────┬───────────────┬───────────────┐      │ │
│ │ │ 量具编号      │ 量具名称      │ 规格型号      │      │ │
│ │ ├───────────────┼───────────────┼───────────────┤      │ │
│ │ │ 制造商        │ 量程范围      │ 精度等级      │      │ │
│ │ ├───────────────┼───────────────┼───────────────┤      │ │
│ │ │ 校准周期      │ 上次校准      │ 下次校准      │      │ │
│ │ ├───────────────┼───────────────┼───────────────┤      │ │
│ │ │ 状态          │ 保管人        │ 存放位置      │      │ │
│ │ └───────────────┴───────────────┴───────────────┘      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tab Card                                                │ │
│ │ [校准记录] [状态变更] [附件]                             │ │
│ │ ┌───────────────────────────────────────────────────┐  │ │
│ │ │ Tab 内容区域                                       │  │ │
│ │ └───────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
\`\`\`

**代码结构**：

\`\`\`vue
<template>
  <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <a-button type="text" @click="handleBack">
          <template #icon><ArrowLeftOutlined /></template>返回
        </a-button>
        <div class="title-section">
          <h2>量检具详情: {{ gauge.gaugeNo }}</h2>
          <a-tag :color="getStatusColor(gauge.status)">{{ getStatusText(gauge.status) }}</a-tag>
        </div>
      </div>
      <div class="header-actions">
        <a-button type="primary" @click="handleEdit">编辑</a-button>
        <a-button @click="handleCalibration">校准</a-button>
      </div>
    </div>

    <!-- 基本信息 Card -->
    <a-card class="form-card" title="基本信息">
      <a-descriptions :column="3" bordered>
        <a-descriptions-item label="量具编号">{{ gauge.gaugeNo }}</a-descriptions-item>
        <a-descriptions-item label="量具名称">{{ gauge.gaugeName }}</a-descriptions-item>
        <a-descriptions-item label="规格型号">{{ gauge.model }}</a-descriptions-item>
        <a-descriptions-item label="制造商">{{ gauge.manufacturer }}</a-descriptions-item>
        <a-descriptions-item label="量程范围">{{ gauge.measureRange }}</a-descriptions-item>
        <a-descriptions-item label="精度等级">{{ gauge.accuracy }}</a-descriptions-item>
        <a-descriptions-item label="校准周期">{{ gauge.calibrationCycle }} 个月</a-descriptions-item>
        <a-descriptions-item label="上次校准">{{ gauge.lastCalDate }}</a-descriptions-item>
        <a-descriptions-item label="下次校准">{{ gauge.nextCalDate }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(gauge.status)">{{ getStatusText(gauge.status) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="保管人">{{ gauge.custodian }}</a-descriptions-item>
        <a-descriptions-item label="存放位置">{{ gauge.location }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- Tab Card -->
    <a-card class="tab-card">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="calibration" tab="校准记录">
          <div class="tab-toolbar">
            <a-button type="primary" size="small" @click="handleAddCalibration">
              <template #icon><PlusOutlined /></template>新增校准
            </a-button>
          </div>
          <a-table :columns="calibrationColumns" :data-source="calibrationRecords" />
        </a-tab-pane>
        <a-tab-pane key="statusLog" tab="状态变更">
          <a-timeline>
            <a-timeline-item v-for="log in statusLogs" :key="log.id">
              <p>{{ log.operateTime }} - {{ log.operator }}</p>
              <p>{{ log.fromStatus }} → {{ log.toStatus }}</p>
              <p>原因：{{ log.reason }}</p>
            </a-timeline-item>
          </a-timeline>
        </a-tab-pane>
        <a-tab-pane key="attachments" tab="附件">
          <a-upload><a-button>上传附件</a-button></a-upload>
          <a-table :columns="attachmentColumns" :data-source="attachments" />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>
\`\`\`

## 状态流转规则

\`\`\`typescript
const gaugeStatusTransitions: Record<GaugeStatus, GaugeStatus[]> = {
  'IN_USE': ['CALIBRATING', 'SEALED', 'SCRAPPED'],
  'CALIBRATING': ['IN_USE', 'SEALED', 'SCRAPPED'],
  'SEALED': ['IN_USE', 'SCRAPPED'],
  'SCRAPPED': []  // 终态
}
\`\`\`

## 校准到期预警规则

\`\`\`typescript
function getCalibrationAlertLevel(nextCalDate: string): 'normal' | 'warning' | 'danger' {
  const today = dayjs()
  const nextCal = dayjs(nextCalDate)
  const daysUntil = nextCal.diff(today, 'day')

  if (daysUntil < 0) return 'danger'       // 已过期 - 红色
  if (daysUntil <= 14) return 'warning'    // 即将到期 - 橙色
  return 'normal'                           // 正常 - 绿色
}
\`\`\`

## 路由配置

\`\`\`typescript
{
  path: '/inspection-model/gauge-ledgers/:id',
  name: 'GaugeLedgerDetail',
  component: () => import('@/views/inspection-model/GaugeLedgerDetail.vue'),
  meta: { title: '量检具详情' }
}
\`\`\`
</pre>

<h2>✅ Implementation Tasks (tasks.md)</h2>
<pre>
# 任务清单：增强量检具全生命周期管理

## 阶段 1：数据模型扩展

### 任务 1.1：扩展量检具台账类型定义 [优先级: P0]
- [ ] 在 \`src/types/index.ts\` 中扩展 \`GaugeLedger\` 接口，新增字段：
  - \`manufacturer\` 制造商
  - \`serialNo\` 出厂序列号
  - \`measureRange\` 量程范围
  - \`resolution\` 分辨率
  - \`accuracy\` 精度等级
  - \`calibrationCycle\` 校准周期（月）
  - \`lastCalDate\` 上次校准日期
  - \`purchaseDate\` 购置日期
  - \`expiryDate\` 有效期
  - \`location\` 存放位置
  - \`custodian\` 保管人
  - \`certificateNo\` 检定证书编号
  - \`attachmentIds\` 附件列表
- [ ] 定义 \`GaugeStatus\` 枚举类型
- [ ] 定义 \`CalibrationRecord\` 校准记录接口

### 任务 1.2：扩展模拟数据 [优先级: P0]
- [ ] 更新 \`GaugeLedgerList.vue\` 中的模拟数据，包含新增字段的示例值
- [ ] 添加校准记录的模拟数据

---

## 阶段 2：台账表单扩展

### 任务 2.1：扩展台账编辑弹窗 [优先级: P0]
- [ ] 修改 \`GaugeLedgerList.vue\` 中的台账编辑弹窗
- [ ] 使用分组布局（基本信息、技术参数、校准信息、管理信息）
- [ ] 添加必填项验证规则
- [ ] 校准周期输入时自动计算下次校准日期

### 任务 2.2：扩展台账列表显示 [优先级: P1]
- [ ] 列表增加「校准状态」指示列
  - 正常（绿色）：距下次校准 > 14 天
  - 即将到期（橙色）：距下次校准 ≤ 14 天
  - 已过期（红色）：已超过校准日期
- [ ] 支持按校准状态筛选

### 任务 2.3：实现批量导入功能 [优先级: P1]
- [ ] 在台账列表页头部增加「导入」按钮
- [ ] 实现模拟导入逻辑，支持批量增加台账记录
- [ ] 导入完成后给予结果反馈（成功条数）

---

## 阶段 3：台账详情页

### 任务 3.1：创建台账详情页组件 [优先级: P0]
- [ ] 创建 \`GaugeLedgerDetail.vue\` 组件
- [ ] 使用 Tab 页布局：
  - Tab 1: 基本信息
  - Tab 2: 校准记录
  - Tab 3: 状态变更记录
- [ ] 添加路由配置

### 任务 3.2：实现校准记录管理 [优先级: P0]
- [ ] 在详情页「校准记录」Tab 中显示历史校准记录列表
- [ ] 支持新增校准记录
- [ ] 新增校准记录时自动更新台账的 \`lastCalDate\` 和 \`nextCalDate\`
- [ ] 支持上传校准证书附件

---

## 阶段 4：状态生命周期管理

### 任务 4.1：实现状态流转逻辑 [优先级: P1]
- [ ] 定义状态流转规则（状态机）
- [ ] 在台账列表操作列增加"状态变更"按钮
- [ ] 状态变更时记录变更日志
- [ ] 限制无效的状态流转（如报废后不能再变更）

### 任务 4.2：实现校准到期预警 [优先级: P1]
- [ ] 在台账列表页顶部显示"即将到期"和"已过期"的数量统计卡片
- [ ] 点击卡片筛选对应状态的记录
- [ ] 考虑后续集成系统通知/消息推送

---

## 阶段 5：路由和菜单更新

### 任务 5.1：更新路由配置 [优先级: P0]
- [ ] 在 \`src/router/index.ts\` 中添加台账详情页路由
- [ ] 路由路径：\`/inspection-model/gauge-ledgers/:id\`

### 任务 5.2：验证菜单导航 [优先级: P2]
- [ ] 确认现有菜单「量检具台账」能正确导航到列表页
- [ ] 验证从列表页进入详情页的导航流程

---

## 验收标准

1. **功能完整性**
   - [ ] 台账表单可录入所有新增字段
   - [ ] 校准记录可正确新增和查看
   - [ ] 状态流转符合定义的规则
   - [ ] 支持台账数据的批量导入功能

2. **用户体验**
   - [ ] 校准到期状态有明显的视觉提示
   - [ ] 表单布局清晰，分组合理
   - [ ] 操作有适当的确认提示

3. **数据一致性**
   - [ ] 新增校准记录后，台账的校准日期字段自动更新
   - [ ] 状态变更有完整的日志记录
</pre>
</div>`,contentType:"html",updateType:"feature",affectedModules:["质量主数据","量检具管理"],relatedChangeId:"enhance-gauge-lifecycle-management",status:"published",publishedAt:"2026-02-06T07:51:34.000Z",publishedBy:"system",createTime:"2026-02-06T07:51:34.000Z",updateTime:"2026-02-06T07:51:34.000Z",creator:"system",updater:"system",orgId:"org-001"},{id:"log-add-update-log-management",version:"v1.0.0",title:"Change: 新增系统更新日志管理",content:`<div class="update-log-content">
<h2>📊 实现内容</h2>
<div class="section">
<h3>前端开发</h3>
<ul>
<li>4.1 创建 \`src/views/system/UpdateLog.vue\` 组件</li>
<li>5.1 创建 \`src/views/system/UpdateLogEditor.vue\` 组件</li>
<li>5.2 集成富文本编辑器组件(如 TinyMCE 或 Quill)</li>
<li>6.1 创建 \`src/views/system/UpdateLogDetail.vue\` 详情页面组件</li>
<li>6.7 实现按角色筛选 Tab(全部/前端/后端/测试)</li>
<li>7.5 实现任务角色分类逻辑(根据关键词匹配前端/后端/测试)</li>
<li>11.2 实现前端路由守卫权限校验</li>
<li>12.1 单元测试:更新日志组件测试</li>
</ul>
<h3>后端开发</h3>
<ul>
<li>1.3 定义更新日志 API 请求/响应类型</li>
<li>1.5 定义设计文档 API 请求/响应类型</li>
<li>2.1 设计数据库表结构 \`update_logs\` 和 \`design_documents\`</li>
<li>7.7 调用更新日志创建 API 保存生成的日志</li>
<li>7.8 调用设计文档创建 API 批量保存解析的任务</li>
<li>9.1 创建 \`src/api/updateLog.ts\` API 服务文件</li>
<li>9.2 封装所有更新日志相关的 API 调用</li>
<li>11.4 后端 API 接口权限校验</li>
<li>12.2 集成测试:API 接口测试</li>
</ul>
<h3>测试</h3>
<ul>
<li>7.10 测试自动生成流程(端到端测试)</li>
<li>12.3 端到端测试:完整流程测试</li>
<li>12.4 手动测试所有功能点</li>
<li>12.5 性能测试(列表加载、富文本编辑器性能)</li>
</ul>
<h3>其他</h3>
<ul>
<li>1.1 定义更新日志 TypeScript 接口类型 (\`src/types/index.ts\`)</li>
<li>1.2 制定更新日志数据结构(版本号、标题、内容、影响范围、状态、发布时间等)</li>
<li>1.4 定义功能设计文档 TypeScript 接口类型(DesignDocument, DesignTask)</li>
<li>2.2 实现更新日志列表查询接口 \`GET /api/update-logs\`</li>
<li>2.3 实现更新日志详情查询接口 \`GET /api/update-logs/:id\`</li>
<li>2.4 实现更新日志创建接口 \`POST /api/update-logs\`</li>
<li>2.5 实现更新日志更新接口 \`PUT /api/update-logs/:id\`</li>
<li>2.6 实现更新日志删除接口 \`DELETE /api/update-logs/:id\`</li>
<li>2.7 实现更新日志发布接口 \`POST /api/update-logs/:id/publish\`</li>
<li>2.8 实现设计文档列表查询接口 \`GET /api/design-documents?updateLogId=xxx\`</li>
<li>2.9 实现设计文档创建接口 \`POST /api/design-documents\`(支持批量)</li>
<li>2.10 实现设计文档更新接口 \`PUT /api/design-documents/:id\`</li>
<li>2.11 实现设计任务状态更新接口 \`PATCH /api/design-documents/:id/tasks/:taskId\`</li>
<li>3.1 在 \`router/index.ts\` 中新增更新日志相关路由</li>
<li>3.2 在 \`MainLayout.vue\` 顶部导航栏添加更新日志按钮(📝图标)</li>
<li>3.3 实现更新日志按钮的徽章数字提示(显示未读更新数量)</li>
<li>4.2 实现列表页面布局(工具栏 + 搜索表单 + 数据表格)</li>
<li>4.3 实现数据表格配置(列定义、分页、排序)</li>
<li>4.4 实现搜索和筛选功能(按版本号、日期范围、状态筛选)</li>
<li>4.5 实现操作按钮(新增、编辑、删除、查看详情、发布)</li>
<li>4.6 实现数据加载和状态管理</li>
<li>5.3 实现表单字段(版本号、标题、更新类型、影响范围等)</li>
<li>5.4 实现表单验证规则</li>
<li>5.5 实现保存为草稿和发布功能</li>
<li>5.6 实现预览功能</li>
<li>6.2 实现版本信息展示</li>
<li>6.3 实现更新内容渲染(支持 Markdown 或 HTML)</li>
<li>6.4 实现影响范围和相关链接展示</li>
<li>6.5 实现返回列表和编辑按钮</li>
<li>6.6 实现功能设计文档关联区域</li>
<li>6.8 实现设计任务列表展示(任务编号、标题、状态、工时、依赖)</li>
<li>6.9 实现任务状态切换功能(标记为完成/进行中)</li>
<li>6.10 实现任务依赖关系可视化(点击跳转到依赖任务)</li>
<li>7.1 研究 \`openspec archive\` 命令的钩子机制或扩展点</li>
<li>7.2 创建提案归档时的自动生成脚本 \`scripts/generate-update-log.js\`</li>
<li>7.3 解析 \`proposal.md\` 生成更新日志内容(标题、内容、影响范围)</li>
<li>7.4 解析 \`tasks.md\` 提取任务结构(识别##阶段、识别任务项)</li>
<li>7.6 实现任务依赖关系解析(解析Dependencies部分)</li>
<li>7.9 关联设计文档到更新日志记录(updateLogId)</li>
<li>8.1 扩展消息通知 Store(\`src/stores/notification.ts\`如不存在则创建)</li>
<li>8.2 实现新更新日志发布时的通知推送</li>
<li>8.3 在消息通知下拉框中显示更新日志通知</li>
<li>8.4 实现点击通知跳转到更新日志详情</li>
<li>8.5 实现未读更新日志计数徽章</li>
<li>9.3 实现错误处理和统一响应格式</li>
<li>9.4 添加请求拦截器和响应拦截器</li>
<li>10.1 应用 JNPF 风格的页面布局</li>
<li>10.2 实现响应式设计(支持移动端查看)</li>
<li>10.3 添加加载状态和骨架屏</li>
<li>10.4 优化动画和过渡效果</li>
<li>10.5 添加空状态提示</li>
<li>11.1 定义更新日志管理权限(查看、创建、编辑、删除、发布)</li>
<li>11.3 实现页面按钮级权限控制</li>
<li>13.1 编写用户使用文档</li>
<li>13.2 编写开发者技术文档</li>
<li>13.3 更新系统菜单配置文档</li>
<li>13.4 准备演示数据和截图</li>
<li>13.5 代码审查和优化</li>
</ul>
</div>

</div>`,contentType:"html",updateType:"feature",affectedModules:[],relatedChangeId:"add-update-log-management",status:"published",publishedAt:"2026-02-04T14:54:18.799Z",publishedBy:"system",createTime:"2026-02-04T14:54:18.801Z",updateTime:"2026-02-04T14:54:18.801Z",creator:"system",updater:"system",orgId:"org-001"}],p=()=>[...g],m=n=>{const e=["frontend","backend","test","general"];return n==="log-enhance-gauge-lifecycle-management"?e.map((t,i)=>({id:`doc-${n}-${i}`,updateLogId:n,title:`${t==="frontend"?"前端":t==="backend"?"后端":t==="test"?"测试":"通用"}任务文档`,documentType:t,tasks:S(t),createdAt:new Date().toISOString(),createdBy:"admin",updatedAt:new Date().toISOString(),orgId:"org-001"})):e.map((t,i)=>({id:`doc-${n}-${i}`,updateLogId:n,title:`${t==="frontend"?"前端":t==="backend"?"后端":t==="test"?"测试":"通用"}任务文档`,documentType:t,tasks:b(t,5),createdAt:new Date().toISOString(),createdBy:"admin",updatedAt:new Date().toISOString(),orgId:"org-001"}))},S=n=>({frontend:[{id:"task-fe-1",taskNumber:"1.1",title:"创建 GaugeLedgerDetail.vue 详情页",description:"实现顶部概览卡片 + 底部多页签交互布局，包含校准记录时间线。",assigneeRole:"frontend",status:"completed",estimatedHours:8,dependencies:[],completedAt:new Date().toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},{id:"task-fe-2",taskNumber:"1.2",title:"重构 GaugeLedgerList.vue 编辑弹窗",description:"实现表单字段的逻辑分组（基本/技术/校准/管理）及校验规则。",assigneeRole:"frontend",status:"completed",estimatedHours:4,dependencies:[],completedAt:new Date().toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},{id:"task-fe-3",taskNumber:"1.3",title:"封装 CalibrationRecordModal 业务弹窗",description:"独立封装校准结果录入逻辑，支持自动关联有效期更新。",assigneeRole:"frontend",status:"completed",estimatedHours:4,dependencies:["task-fe-1"],completedAt:new Date().toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},{id:"task-fe-4",taskNumber:"1.4",title:"实现台账批量导入 (Import) 功能",description:"集成 a-upload 组件，实现模拟导入延迟及前端数据插入回显。",assigneeRole:"frontend",status:"completed",estimatedHours:6,dependencies:[],completedAt:new Date().toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}],backend:[{id:"task-be-1",taskNumber:"2.1",title:"扩展 GaugeLedger 类型定义",description:"在 src/types/index.ts 中增加 12+ 质量属性字段。",assigneeRole:"backend",status:"completed",estimatedHours:2,dependencies:[],completedAt:new Date().toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},{id:"task-be-2",taskNumber:"2.2",title:"定义状态机枚举 GaugeStatus",description:"确立 IN_USE, CALIBRATING, SEALED, SCRAPPED 的业务状态标识。",assigneeRole:"backend",status:"completed",estimatedHours:1,dependencies:[],completedAt:new Date().toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}],test:[{id:"task-test-1",taskNumber:"3.1",title:"生产环境 Vite Build 构建测试",description:"验证并修复 Vue 3 生产模式下的 v-model 属性绑定冲突错误。",assigneeRole:"test",status:"completed",estimatedHours:4,dependencies:[],completedAt:new Date().toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},{id:"task-test-2",taskNumber:"3.2",title:"全链路业务闭环验证",description:"模拟「购入-入库-校准-延期-报废」完整生命周期逻辑一致性测试。",assigneeRole:"test",status:"completed",estimatedHours:8,dependencies:[],completedAt:new Date().toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}],general:[{id:"task-gen-1",taskNumber:"4.1",title:"同步 OpenSpec 需求规格至更新日志",description:"实现设计文档与更新日志的深度绑定，确保文档追溯。",assigneeRole:"general",status:"completed",estimatedHours:2,dependencies:[],completedAt:new Date().toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}]})[n]||[],b=(n,e)=>{const t=["pending","in-progress","completed"];return Array.from({length:e},(i,a)=>({id:`task-${n}-${a+1}`,taskNumber:`${a+1}.${a+1}`,title:`${n==="frontend"?"前端":n==="backend"?"后端":n==="test"?"测试":"通用"}任务 ${a+1}`,description:`这是${n}任务 ${a+1} 的详细描述`,assigneeRole:n,status:t[a%3],estimatedHours:(a+1)*2,dependencies:a>0?[`task-${n}-${a}`]:[],completedAt:t[a%3]==="completed"?new Date().toISOString():void 0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}))};let s=p(),o=[];const r=(n=300)=>new Promise(e=>setTimeout(e,n)),I=async n=>{await r();let e=[...s];n.version&&(e=e.filter(l=>l.version.includes(n.version))),n.updateType&&(e=e.filter(l=>l.updateType===n.updateType)),n.status&&(e=e.filter(l=>l.status===n.status)),n.keyword&&(e=e.filter(l=>l.title.includes(n.keyword)||l.content.includes(n.keyword)));const t=n.page||1,i=n.pageSize||20,a=(t-1)*i,d=a+i;return{code:200,message:"查询成功",success:!0,data:{list:e.slice(a,d),total:e.length,page:t,pageSize:i}}},y=async n=>{await r();const e=s.find(t=>t.id===n);return e?{code:200,message:"查询成功",success:!0,data:e}:{code:404,message:"更新日志不存在",success:!1,data:null}},D=async n=>{await r();const e={id:`log-${Date.now()}`,orgId:"org-001",...n,status:"draft",createTime:new Date().toISOString(),updateTime:new Date().toISOString(),creator:"admin",updater:"admin"};return s.unshift(e),{code:200,message:"创建成功",success:!0,data:e}},f=async(n,e)=>{await r();const t=s.findIndex(i=>i.id===n);return t===-1?{code:404,message:"更新日志不存在",success:!1,data:null}:(s[t]={...s[t],...e,updateTime:new Date().toISOString(),updater:"admin"},{code:200,message:"更新成功",success:!0,data:s[t]})},A=async n=>{await r();const e=s.findIndex(t=>t.id===n);return e===-1?{code:404,message:"更新日志不存在",success:!1,data:void 0}:(s.splice(e,1),{code:200,message:"删除成功",success:!0,data:void 0})},h=async n=>{await r();const e=s.findIndex(t=>t.id===n);return e===-1?{code:404,message:"更新日志不存在",success:!1,data:null}:(s[e]={...s[e],status:"published",publishedAt:new Date().toISOString(),publishedBy:"admin",updateTime:new Date().toISOString()},{code:200,message:"发布成功",success:!0,data:s[e]})},T=async n=>{await r();const e=s.findIndex(t=>t.id===n);return e===-1?{code:404,message:"更新日志不存在",success:!1,data:null}:(s[e]={...s[e],status:"archived",updateTime:new Date().toISOString()},{code:200,message:"归档成功",success:!0,data:s[e]})},L=async n=>{if(await r(),o.length===0||!o.some(t=>t.updateLogId===n.updateLogId)){const t=m(n.updateLogId);o.push(...t)}let e=o.filter(t=>t.updateLogId===n.updateLogId);return n.documentType&&(e=e.filter(t=>t.documentType===n.documentType)),{code:200,message:"查询成功",success:!0,data:e}},v=async(n,e,t)=>{await r();const i=o.find(d=>d.id===n);if(!i)return{code:404,message:"设计文档不存在",success:!1,data:null};const a=i.tasks.find(d=>d.id===e);return a?(a.status=t.status,a.updatedAt=new Date().toISOString(),t.status==="completed"&&(a.completedAt=new Date().toISOString()),{code:200,message:"更新成功",success:!0,data:a}):{code:404,message:"任务不存在",success:!1,data:null}},k=async n=>(await r(),{code:200,message:"查询成功",success:!0,data:o.filter(i=>i.updateLogId===n).map(i=>{const a=i.tasks.length,d=i.tasks.filter(c=>c.status==="completed").length,l=i.tasks.filter(c=>c.status==="in-progress").length,u=i.tasks.filter(c=>c.status==="pending").length;return{documentType:i.documentType,totalTasks:a,completedTasks:d,inProgressTasks:l,pendingTasks:u,completionRate:a>0?Math.round(d/a*100):0}})});export{T as a,y as b,D as c,A as d,v as e,L as f,I as g,k as h,h as p,f as u};
