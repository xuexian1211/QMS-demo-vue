# 设计文档: 检验主数据管理缺失功能

## 架构概述

本设计补充检验主数据管理系统的缺失功能，与现有功能（不良现象库、不良原因库、量检具台账、检验项目库、检验方法库、抽样方案、检验方案）共同构成完整的检验主数据管理体系。

## 数据模型设计

### 1. 缺陷分类表 (QM_MD_DefectCategory)

**数据结构**：
```typescript
interface DefectCategory {
  id: number
  orgId: number | null
  categoryCode: string
  categoryName: string
  parentId: number | null
  description?: string
}
```

**业务规则**：
- 支持树状结构，parentId指向自身表中的id
- orgId为NULL表示集团级标准
- orgId + categoryCode组合唯一

**UI设计**：
- 左侧：树状分类展示
- 右侧：选中分类后显示其信息
- 支持新增根分类、子分类
- 支持编辑、删除（带级联删除确认）

### 2. 量检具类型表 (QM_MD_MeasureType)

**数据结构**：
```typescript
interface MeasureType {
  id: number
  orgId: number | null
  typeName: string
  precision: number
  isMsaRequired: boolean
  parentId?: number | null  // 支持树状结构
}
```

**业务规则**：
- 定义量具的类别要求，非具体设备台账
- orgId为NULL表示集团通用类型
- 支持树状结构（如：卡尺 → 数显卡尺 → 0-150mm数显卡尺）

**UI设计**：
- 左侧：树状类型展示
- 右侧：选中类型后显示其信息
- 支持新增根类型、子类型
- 显示精度、MSA要求等属性

### 3. 物料检验规格表 (QM_MD_MaterialSpec)

**数据结构**：
```typescript
interface MaterialSpec {
  id: number
  orgId: number
  materialId: string
  inspItemCode: string
  dataType: 'QUANTITATIVE' | 'QUALITATIVE'

  // 计量型属性
  targetValue?: number
  upperLimit?: number
  lowerLimit?: number
  uom?: string

  // 计数型属性
  standardText?: string
  standardCode?: string
  expectedValue?: string
  attachmentId?: string
}
```

**业务规则**：
- 多态表，兼容计量与计数两种数据类型
- 同一物料在不同工厂可以有不同的规格（orgId隔离）
- orgId + materialId + inspItemCode构成唯一键

**UI设计**：
- 列表页：显示物料、检验项目、数据类型、规格信息摘要
- 表单页：根据数据类型动态显示不同字段
  - 计量型：目标值、上限、下限、单位
  - 计数型：标准描述、标准代码、期望值、样板图上传

### 4. 检验模板主表 (QM_CFG_InspTemplate)

**数据结构**：
```typescript
interface InspTemplate {
  id: number
  orgId: number
  templateCode: string
  templateName: string
  version: string
  status: 'DRAFT' | 'IN_APPROVAL' | 'APPROVED' | 'OBSOLETE'
  workflowInstanceId?: number
}
```

**业务规则**：
- 需版本管理（V1.0, V1.1）
- 状态流转：草稿→审批中→已批准→作废
- orgId + templateCode + version构成业务唯一键

**UI设计**：
- 列表页：显示模板编码、名称、版本、状态
- 状态标签显示：草稿（灰色）、审批中（蓝色）、已批准（绿色）、作废（红色）

### 5. 检验模板明细表 (QM_CFG_InspTemplateDetail)

**数据结构**：
```typescript
interface InspTemplateDetail {
  id: number
  templateId: number
  itemId: number
  itemName: string  // 冗余字段，防特性库修改
  sortOrder: number
  samplingRuleCode: string
  characteristicClass: 'SC' | 'CC' | 'MAJOR' | 'MINOR'
  inspMethodCode?: number
  instrumentTypeId?: number
  isLabTest: boolean
  isSpc: boolean
  frequencyType?: 'PER_TIME' | 'PER_QUANTITY'
  frequencyValue?: number
  frequencyUnit?: string
  attachmentId?: string
}
```

**UI设计**：
- 使用表格行内编辑或弹出表单编辑
- 支持拖拽排序
- 关联检验项目、抽样规则、检验方法、量检具类型使用下拉选择

### 6. 现象-原因关联知识库 (QM_MD_PhenomenonCaseKnowledgeMapping)

**数据结构**：
```typescript
interface PhenomenonCauseMapping {
  id: number
  phenomenonId: number
  orgId: number
  causeId: number
  weight: number  // 权重/发生频率，用于排序推荐
}
```

**业务规则**：
- 当检验员选择不良现象时，系统可推荐常见原因
- 按权重排序推荐

**UI设计**：
- 双侧穿梭框选择器
- 左侧：可选原因列表
- 右侧：已选原因列表，支持设置权重

### 7. 不良原因与FMEA关联表 (QM_MD_CauseFmeaMapping)

**数据结构**：
```typescript
interface CauseFmeaMapping {
  id: number
  orgId: number
  causeId: number
  fmeaFailureModeId: string
}
```

**业务规则**：
- 建立QMS根本原因与PFMEA失效模式的桥梁
- orgId + causeId + fmeaFailureModeId组合唯一

**UI设计**：
- 不良原因编辑页增加FMEA关联Tab
- 支持多选FMEA失效模式

## 页面组件设计

### 新增页面组件

1. **DefectCategory.vue** - 缺陷分类管理
   - 位置：`src/views/inspection-model/DefectCategory.vue`
   - 布局：左右分栏（树状分类 + 详情）

2. **MeasureType.vue** - 量检具类型管理
   - 位置：`src/views/inspection-model/MeasureType.vue`
   - 布局：左右分栏（树状类型 + 详情）

3. **MaterialSpec.vue** - 物料检验规格管理
   - 位置：`src/views/inspection-model/MaterialSpec.vue`
   - 列表页：表格展示
   - 编辑弹窗：根据数据类型动态显示表单

4. **InspTemplateList.vue** - 检验模板列表
   - 位置：`src/views/inspection-model/InspTemplateList.vue`
   - 布局：标准列表页

5. **InspTemplateEdit.vue** - 检验模板编辑
   - 位置：`src/views/inspection-model/InspTemplateEdit.vue`
   - 布局：头部信息 + 明细表格 + 操作区

6. **PhenomenonCauseMapping.vue** - 现象-原因关联管理
   - 位置：`src/views/inspection-model/PhenomenonCauseMapping.vue`
   - 布局：左右分栏（现象树 + 关联原因穿梭框）

### 现有页面扩展

1. **DefectCauseEdit.vue** - 增加FMEA关联Tab
   - 新增Tab页展示关联的FMEA失效模式
   - 支持添加、删除关联

2. **DefectPhenomenonEdit.vue** - 增加原因关联Tab
   - 新增Tab页展示关联的不良原因
   - 使用穿梭框管理关联关系，支持设置权重

## 路由设计

```typescript
// src/router/index.ts 新增路由
{
  path: '/inspection-model',
  component: () => import('@/views/inspection-model/index.vue'),
  children: [
    // 现有路由...
    {
      path: 'defect-category',
      name: 'DefectCategory',
      component: () => import('@/views/inspection-model/DefectCategory.vue'),
      meta: { title: '缺陷分类管理' }
    },
    {
      path: 'measure-type',
      name: 'MeasureType',
      component: () => import('@/views/inspection-model/MeasureType.vue'),
      meta: { title: '量检具类型管理' }
    },
    {
      path: 'material-spec',
      name: 'MaterialSpec',
      component: () => import('@/views/inspection-model/MaterialSpec.vue'),
      meta: { title: '物料检验规格' }
    },
    {
      path: 'insp-template',
      name: 'InspTemplate',
      component: () => import('@/views/inspection-model/InspTemplateList.vue'),
      meta: { title: '检验模板' }
    },
    {
      path: 'insp-template/:id',
      name: 'InspTemplateEdit',
      component: () => import('@/views/inspection-model/InspTemplateEdit.vue'),
      meta: { title: '编辑检验模板' }
    },
    {
      path: 'phenomenon-cause-mapping',
      name: 'PhenomenonCauseMapping',
      component: () => import('@/views/inspection-model/PhenomenonCauseMapping.vue'),
      meta: { title: '现象-原因关联' }
    }
  ]
}
```

## 数据一致性考虑

### 缺陷分类与不良现象
- 缺陷分类删除时，需要检查是否被不良现象引用
- 如果被引用，提示用户先解除引用或允许级联删除

### 量检具类型与量检具台账
- 量检具类型删除时，需要检查是否被量检具台账引用
- 如果被引用，提示用户先解除引用或允许级联删除

### 物料检验规格与检验模板
- 物料检验规格是检验模板的补充数据，运行时动态加载
- 不强引用，允许规格独立管理

### 知识库关联
- 现象-原因关联和原因-FMEA关联均为独立表
- 删除现象或原因时，级联删除对应的关联记录

## 性能考虑

1. **树状数据加载** - 缺陷分类和量检具类型树建议使用懒加载
2. **表格分页** - 物料检验规格列表使用分页加载
3. **关联数据缓存** - 检验模板明细关联的检验项目、抽样规则等数据考虑前端缓存
4. **表单验证** - 复杂表单（如检验模板编辑）考虑实时验证

## 安全考虑

1. **权限控制** - 不同角色对不同功能的访问权限
2. **组织隔离** - orgId确保数据组织隔离
3. **版本控制** - 检验模板的版本管理防止误修改
4. **审计日志** - 关键操作记录审计日志

## 未来扩展

1. **批量导入导出** - 支持Excel批量导入规格和模板
2. **模板复制** - 检验模板支持复制功能
3. **智能推荐算法** - 基于历史数据优化知识库推荐算法
4. **规格变更通知** - 规格变更时通知相关检验员
