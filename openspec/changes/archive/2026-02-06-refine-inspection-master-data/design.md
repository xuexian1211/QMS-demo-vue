# Design: 检验方法与抽样方案优化

## 1. 数据模型演进

### 1.1 检验方法 (QM_MD_InspMethod)
- 增加 `orgId` 字段处理逻辑。
- `operationText` 支持长文本（对应前端 Textarea）。

### 1.2 抽样规则 (QM_MD_SamplingRule)
扩展字段以支持多种抽样逻辑：
- `sampleSizeRate`: 整数类型，存储百分比（0-100）。
- `sampleSize`: 整数类型，存储固定数量。

## 2. 交互逻辑设计

### 2.1 抽样规则动态表单
在抽样方案编辑页面（`SamplingPlanEdit.vue`）添加逻辑：
- `IF samplingMethod == 'PERCENTAGE'`:
  - 显示“样本量比率 (%)”字段。
  - 隐藏“样本量”字段。
  - 隐藏“抽样明细”表格。
- `IF samplingMethod == 'FIXED_QUANTITY'`:
  - 隐藏“样本量比率”字段。
  - 显示“样本量”字段。
  - 隐藏“抽样明细”表格。
- `IF samplingMethod == 'STANDARD_BASED'`:
  - 隐藏“样本量比率”及“样本量”字段。
  - 显示“抽样明细”表格，允许编辑 Ac, Re, BatchSizeMin, BatchSizeMax。

### 2.2 抽样明细冲突校验
- **批量区间连续性**：下一行的 `batchSizeMin` 必须等于上一行的 `batchSizeMax + 1`。
- **Ac/Re 逻辑校验**：`Re` 必须等于 `Ac + 1`（除非有特殊的跳级规则，此处按常规标准校验）。

## 3. 组织机构隔离策略
- 列表查询默认过滤当前用户所属的 `orgId` 以及 `orgId IS NULL` (集团级) 的数据。
- 集团级数据在列表展示时添加特殊标识（如“集团”标签）。
- 只有具备相应权限的用户才能修改集团级数据。

## 4. 路由与菜单
- 保持现有路由配置不变：
  - `/inspection-model/insp-methods` -> `InspMethodList.vue`
  - `/inspection-model/sampling-plans` -> `SamplingPlanList.vue`
  - `/inspection-model/sampling-plans/edit/:id` -> `SamplingPlanEdit.vue`
