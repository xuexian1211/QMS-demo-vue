# 增强量检具全生命周期管理

## Why

当前系统的量检具管理功能仅实现了基础的台账录入和类型分类,缺少符合 IATF16949 质量体系要求的完整生命周期管理能力。具体问题包括:

1. **数据模型不完整**: 缺少制造商、量程、校准周期等关键技术参数,无法满足质量追溯要求
2. **校准管理缺失**: 没有校准记录管理和到期预警机制,存在使用过期量检具的合规风险
3. **状态流转不规范**: 缺少标准化的设备状态机定义,无法有效管理设备从购入到报废的完整生命周期

这些问题导致质量管理人员无法有效追踪量检具的校准状态和使用历史,影响质量数据的可靠性和合规性。

## 变更摘要

基于需求文档第四部分 1.4 量检具类型库及项目规范 `SF-QMS-project.md` 中定义的量检具管理需求，对现有 `GaugeLedgerList.vue` 进行功能增强，实现量检具全生命周期管理。

## 问题背景

### 现状分析

当前系统已实现：
- ✅ **量检具类型树**：左侧树状分类结构，支持新增/编辑/删除类型
- ✅ **量检具台账列表**：右侧表格展示，包含基础字段（量具编号、名称、规格型号、状态、下次校准日期）
- ✅ **基础 CRUD 操作**：新增/编辑/删除/批量删除/导出

根据 `SF-QMS-project.md` 第 922-927 行定义的完整需求，尚未实现：
- ❌ **校准管理**：内部校准、外部校准、校准计划、校准记录
- ❌ **MSA 测量系统分析**：GR&R 分析、偏倚分析、线性分析、稳定性分析
- ❌ **维护管理**：日常维护、故障维修、报废管理
- ❌ **追溯管理**：溯源管理、不确定度评估、使用规范

### 对照需求文档差距

| 需求文档字段 | 现有实现 | 差距 |
|-------------|---------|------|
| `typeName` 类型名称 | ✅ 已实现 | - |
| `precision` 精度 | ✅ 已实现 | - |
| `isMsaRequired` 是否需 MSA | ✅ UI 显示 | ❌ 无 MSA 流程集成 |
| 校准周期 | ❌ 台账只有下次校准日期 | 缺少校准周期字段和校准记录管理 |
| 量程范围 | ❌ 未实现 | 缺少量程上限/下限字段 |

## 提案范围

本提案聚焦于**第一阶段**需求，增强现有量检具台账功能，扩展数据模型和关键管理功能：

1. **扩展台账数据模型**：增加量程、校准周期、制造商、有效期等必要字段
2. **校准管理功能**：校准计划、校准记录、校准到期预警
3. **状态生命周期管理**：完善状态流转（在用 → 校准中 → 封存 → 报废）

> [!NOTE]
> MSA 测量系统分析、高级维护管理、追溯管理等功能计划在后续阶段实现，本提案不涉及。

## What Changes


### 能力 1：扩展量检具台账数据模型

#### 新增字段

```typescript
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
```

### 能力 2：校准管理功能

#### 数据模型

```typescript
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
```

#### UI 功能

- 台账详情页新增「校准记录」Tab 页
- 支持记录每次校准的结果和证书
- 校准到期提醒列表页（提前 N 天预警）

### 能力 3：状态生命周期管理

#### 状态流转规则

```
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
```

#### 业务规则

1. **校准到期预警**：距离下次校准日期 ≤ 14 天时，在列表中高亮提醒
2. **超期自动封存**：校准日期已过的量检具自动标记为"待校准"状态
3. **状态变更记录**：每次状态变更自动记录日志

## 验证计划

### 手动验证

1. **台账扩展字段验证**
   - 启动开发服务器：`npm run dev`
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

