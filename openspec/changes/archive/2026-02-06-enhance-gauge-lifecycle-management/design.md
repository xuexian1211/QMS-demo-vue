# 设计文档：量检具全生命周期管理

## 架构概述

本设计基于现有 `GaugeLedgerList.vue` 组件，扩展量检具台账的数据模型和管理功能，实现量检具全生命周期管理。

## 数据模型设计

### 1. 量检具台账扩展 (GaugeLedger)

**现有字段**：
```typescript
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
```

**扩展后字段**：
```typescript
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
```

### 2. 校准记录表 (CalibrationRecord)

```typescript
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
```

### 3. 状态变更记录表 (GaugeStatusLog)

```typescript
interface GaugeStatusLog {
  id: number
  gaugeId: number         // 关联量检具台账
  fromStatus: GaugeStatus // 原状态
  toStatus: GaugeStatus   // 新状态
  reason: string          // 变更原因
  operator: string        // 操作人
  operateTime: string     // 操作时间
}
```

## 页面组件设计

### 1. GaugeLedgerList.vue 修改

**表格列扩展**：增加校准状态指示列

**新增操作按钮**：
- 「查看」：进入详情页
- 「编辑」：编辑台账信息（弹窗）
- 「删除」：删除台账

### 2. GaugeLedgerDetail.vue（新增）

**布局结构**（参考 `InspPlanEdit.vue` 风格）：

```
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
```

**代码结构**：

```vue
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
```

## 状态流转规则

```typescript
const gaugeStatusTransitions: Record<GaugeStatus, GaugeStatus[]> = {
  'IN_USE': ['CALIBRATING', 'SEALED', 'SCRAPPED'],
  'CALIBRATING': ['IN_USE', 'SEALED', 'SCRAPPED'],
  'SEALED': ['IN_USE', 'SCRAPPED'],
  'SCRAPPED': []  // 终态
}
```

## 校准到期预警规则

```typescript
function getCalibrationAlertLevel(nextCalDate: string): 'normal' | 'warning' | 'danger' {
  const today = dayjs()
  const nextCal = dayjs(nextCalDate)
  const daysUntil = nextCal.diff(today, 'day')

  if (daysUntil < 0) return 'danger'       // 已过期 - 红色
  if (daysUntil <= 14) return 'warning'    // 即将到期 - 橙色
  return 'normal'                           // 正常 - 绿色
}
```

## 路由配置

```typescript
{
  path: '/inspection-model/gauge-ledgers/:id',
  name: 'GaugeLedgerDetail',
  component: () => import('@/views/inspection-model/GaugeLedgerDetail.vue'),
  meta: { title: '量检具详情' }
}
```

