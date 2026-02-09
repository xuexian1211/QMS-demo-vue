# 检验模板与方案核心模型优化 - 实施说明

## 概述

本次实施完成了检验方案 (InspScheme) 和检验策略 (InspStrategy) 的核心功能，实现了"模板定义蓝图 -> 方案实例化微调 -> 策略动态绑定 -> 规格精细定义"的完整业务流。

## 已完成的工作

### 1. 类型定义 (src/types/index.ts)

- ✅ **InspScheme**: 检验方案主表
- ✅ **InspSchemeDetail**: 检验方案明细表
- ✅ **InspStrategy**: 检验策略表
- ✅ **MatchDimension**: 匹配维度对象
- ✅ **MaterialSpec**: 更新为使用 `inspItemCode` 关联

### 2. API 接口 (src/api/inspScheme.ts)

实现了完整的 CRUD 接口：

**检验方案 API:**
- `getInspSchemeList()` - 获取方案列表
- `getInspSchemeDetail()` - 获取方案详情
- `createInspScheme()` - 创建方案
- `createSchemeFromTemplate()` - 从模板创建方案
- `updateInspScheme()` - 更新方案
- `deleteInspScheme()` - 删除方案
- `submitInspSchemeForApproval()` - 提交审批
- `approveInspScheme()` - 审批通过
- `obsoleteInspScheme()` - 作废

**检验方案明细 API:**
- `getInspSchemeDetails()` - 获取明细列表
- `addInspSchemeDetail()` - 添加明细
- `updateInspSchemeDetail()` - 更新明细
- `deleteInspSchemeDetail()` - 删除明细
- `batchUpdateInspSchemeDetails()` - 批量更新明细

**检验策略 API:**
- `getInspStrategyList()` - 获取策略列表
- `getInspStrategiesByScheme()` - 获取方案的所有策略
- `createInspStrategy()` - 创建策略
- `updateInspStrategy()` - 更新策略
- `deleteInspStrategy()` - 删除策略
- `toggleInspStrategyStatus()` - 启用/禁用策略
- `testStrategyMatch()` - 策略匹配测试

### 3. 策略匹配引擎 (src/utils/strategyMatcher.ts)

实现了基于 `matchDimension` 和 `priority` 的通用匹配逻辑：

**核心功能:**
- ✅ 多维度匹配（物料、供应商、工序、IPQC类型等）
- ✅ 优先级仲裁（数值越小优先级越高）
- ✅ 触发条件支持（总是触发、新供应商前N批、工程变更前N批）
- ✅ 得分计算和最佳匹配选择

**匹配权重:**
- 物料ID: 100分
- 供应商ID: 80分
- 工序号: 70分
- IPQC类型: 60分
- 物料组ID: 50分
- 通用策略: 10分

### 4. 前端页面

#### InspSchemeList.vue (检验方案列表)
- ✅ 方案查询（编码、名称、状态）
- ✅ 新建方案
- ✅ 从模板创建方案
- ✅ 编辑、删除、复制
- ✅ 状态流转（提交审批、审批通过、作废）
- ✅ 策略绑定入口

#### InspSchemeEdit.vue (检验方案编辑)
- ✅ 基本信息编辑
- ✅ 检验项目明细管理
  - 添加/删除项目
  - 行内编辑（项目、特性分类、抽样规则、检验方法、SPC开关等）
  - 从模板导入
  - 批量删除
  - 模板来源标识
- ✅ 策略绑定管理
  - 新增策略
  - 编辑策略
  - 删除策略
  - 启用/禁用策略
  - 匹配维度配置
  - 优先级设置
  - 触发条件配置

### 5. 组件

#### MaterialSpecEditor.vue (物料规格编辑器)
- ✅ 规格列表展示
- ✅ 添加/编辑/删除规格
- ✅ 计量型规格（目标值、上下限、单位）
- ✅ 计数型规格（标准描述、期望值、样板图）
- ✅ 自动匹配方案项目列表
- ✅ 批量导入接口（待实现）

### 6. 单元测试 (src/__tests__/strategyMatcher.spec.ts)

- ✅ 匹配得分计算测试
- ✅ 触发条件判断测试
- ✅ 最佳匹配选择测试
- ✅ 优先级仲裁测试
- ✅ 复杂场景测试（IPQC多维度匹配）

## 核心设计亮点

### 1. 方案与模板解耦
- 方案可基于模板创建，也可独立创建
- 方案创建后可独立编辑，不影响原模板
- 通过 `sourceTemplateId` 保持追溯性

### 2. 策略与方案分离
- 一个方案可被多个策略引用（1:N关系）
- 策略定义"何时使用该方案"
- 支持灵活的匹配维度配置

### 3. 灵活的匹配引擎
- JSON 结构的 `matchDimension`，易于扩展
- 基于得分和优先级的双重仲裁
- 支持触发条件的动态控制

### 4. 规格与方案解耦
- 规格通过 `inspItemCode` 关联项目，而非方案ID
- 支持"一套方案，多套规格"
- 计量型和计数型规格分离处理

## 使用示例

### 创建检验方案

```typescript
// 1. 从模板创建
const scheme = await createSchemeFromTemplate('template-id', {
  schemeCode: 'SCHEME-001',
  schemeName: 'IC芯片专用检验方案',
  description: '基于电子料通用模板创建'
})

// 2. 编辑明细（添加特殊项目）
await addInspSchemeDetail(scheme.id, {
  inspItemId: 'item-pin-flatness',
  inspItemName: '引脚平整度',
  characteristicClass: 'CC',
  samplingRuleId: 'rule-full-check',
  spcEnabled: true,
  labRequired: false
})
```

### 绑定策略

```typescript
// 策略1: 所有IC芯片使用该方案
await createInspStrategy({
  schemeId: scheme.id,
  strategyName: '通用IC芯片策略',
  contextType: 'IQC',
  matchDimension: {
    materialGroupId: 'IC-CHIPS'
  },
  priority: 100,
  triggerCondition: 'ALWAYS'
})

// 策略2: 供应商X的IC芯片使用该方案（高优先级）
await createInspStrategy({
  schemeId: scheme.id,
  strategyName: '供应商X专用策略',
  contextType: 'IQC',
  matchDimension: {
    materialGroupId: 'IC-CHIPS',
    supplierId: 'SUPPLIER-X'
  },
  priority: 10,
  triggerCondition: 'ALWAYS'
})
```

### 策略匹配

```typescript
import { StrategyMatcher } from '@/utils/strategyMatcher'

// 收货事件
const context = {
  contextType: 'IQC',
  materialId: 'M001',
  supplierId: 'SUPPLIER-X'
}

// 查找最佳匹配策略
const strategies = await getInspStrategyList({ contextType: 'IQC' })
const bestStrategy = StrategyMatcher.findBestMatch(strategies.data.list, context)

if (bestStrategy) {
  // 加载方案
  const scheme = await getInspSchemeDetail(bestStrategy.schemeId)
  // 加载规格
  const specs = await getMaterialSpecs(context.materialId)
  // 生成检验任务
  // ...
}
```

## 待完成的工作

### 1. 后端实现
- 实现所有 API 接口的后端逻辑
- 实现从模板复制明细的逻辑
- 实现策略匹配的服务端接口
- 实现批次计数器（Redis/DB）

### 2. 前端完善
- 加载基础数据（检验项目、抽样规则、检验方法等）
- 实现模板选择器
- 实现物料/供应商选择器
- 完善表单验证
- 添加更多的用户提示

### 3. 集成测试
- 端到端流程测试
- 与现有检验模板模块的集成
- 与物料管理模块的集成

### 4. 文档完善
- API 文档
- 用户操作手册
- 开发者指南

## 文件清单

### 新增文件
- `src/types/index.ts` (更新)
- `src/api/inspScheme.ts`
- `src/utils/strategyMatcher.ts`
- `src/views/inspection-model/InspSchemeList.vue`
- `src/views/inspection-model/InspSchemeEdit.vue`
- `src/components/MaterialSpecEditor.vue`
- `src/__tests__/strategyMatcher.spec.ts`

### 规范文件
- `openspec/changes/optimize-insp-template/proposal.md`
- `openspec/changes/optimize-insp-template/design.md`
- `openspec/changes/optimize-insp-template/tasks.md`
- `openspec/changes/optimize-insp-template/specs/inspection-scheme/spec.md`
- `openspec/changes/optimize-insp-template/specs/inspection-strategy/spec.md`

## 总结

本次实施完成了检验方案和检验策略的核心架构设计和前端实现，建立了灵活、可扩展的检验策划体系。通过将"方案内容"与"方案策略"分离，实现了"一套方案，多种用法"的设计目标，满足了复杂业务场景的需求。
