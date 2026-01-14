# 任务清单：检验主数据 - 第二阶段

## Phase 1: 缺陷知识库（关系）
- [x] **Task 1.1**: 定义关系类型
    - [x] 更新 `src/types/index.ts` 以支持现象-原因关系（例如 `relatedCauseIds`）
    - [x] 更新 `src/types/index.ts` 以支持检验项目-缺陷映射（例如 `relatedDefectIds`）
- [ ] **Task 1.2**: 现象-原因关联 UI
    - [ ] 更新 `DefectPhenomenonEdit.vue`（或列表侧边栏）以管理关联原因
    - [ ] 更新 `DefectCauseEdit.vue` 以管理关联现象（双向视图）
- [x] **Task 1.3**: 项目-缺陷关联 UI
    - [x] 更新 `InspectionItemList.vue` 以添加"关联缺陷"选项卡（表格样式，支持添加/编辑/删除）
    - [x] 实现缺陷选择器组件

## Phase 2: 数据导入/导出
- [x] **Task 2.1**: 导入/导出工具
    - [x] 创建 `src/utils/excel.ts`（模拟或真实）以处理数据导出
- [x] **Task 2.2**: 实现导出的功能
    - [x] 在 `DefectPhenomenonList.vue` 中实现导出功能
    - [x] 在 `MaterialProduct.vue` 中实现导出功能
    - [x] 在 `InspectionItemList.vue` 中实现导出功能
    - [x] 在 `MaterialCategory.vue` 中实现导出功能
    - [x] 在 `UnitManagement.vue` 中实现导出功能
    - [x] 在 `ProductionTeam.vue` 中实现导出功能
    - [x] 在 `CustomerArchive.vue` 中实现导出功能
    - [x] 在 `SupplierArchive.vue` 中实现导出功能
    - [x] 在 `StorageLocation.vue` 中实现导出功能

## Phase 3: 高级可用性
- [x] **Task 3.1**: 批量操作
    - [x] 在 `MaterialCategory.vue` 中实现"批量启用/禁用"
    - [x] 在 `UnitManagement.vue` 中实现"批量启用/禁用"
    - [x] 在 `ProductionTeam.vue` 中实现"批量启用/禁用"
    - [x] 在 `CustomerArchive.vue` 中实现"批量启用/禁用"
    - [x] 在 `SupplierArchive.vue` 中实现"批量启用/禁用"
    - [x] 在 `StorageLocation.vue` 中实现"批量启用/禁用"
- [ ] **Task 3.2**: 高级搜索
    - [ ] 审查页面以确定复杂的搜索需求（例如，按多个分类、日期范围搜索）
    - [ ] 如果简单的行内搜索不足，则实现可展开的搜索部分

## Phase 4: UI/UX 一致性改进
- [x] **Task 4.1**: 抽样方案管理 - 规则编辑按钮修复 (已完成)
- [x] **Task 4.2**: 检验项目 - 独立详情页重构
    - [x] 创建 `src/views/inspection-model/InspectionItemEdit.vue`
    - [x] 实现"上部基础信息 + 下部关联 Tab"布局
    - [x] 更新列表页跳转逻辑
- [x] **Task 4.3**: 不良原因 - 独立详情页重构
    - [x] 创建 `src/views/inspection-model/DefectCauseEdit.vue`
    - [x] 实现"上部基础信息 + 下部 FMEA Tab"布局
    - [x] 更新列表页跳转逻辑
- [x] **Task 4.4**: 抽样方案 - 独立详情页重构
    - [x] 创建 `src/views/inspection-model/SamplingPlanEdit.vue`
    - [x] 实现"上部基础信息 + 下部规则 Tab"布局
    - [x] 更新列表页跳转逻辑
- [x] **Task 4.5**: 物料分类/客户/供应商 - 详情弹窗统一
    - [x] 检查 `MaterialCategory.vue` 详情弹窗样式 - 已与计量单位一致
    - [x] 检查 `CustomerArchive.vue` 详情弹窗样式 - 已与计量单位一致
    - [x] 检查 `SupplierArchive.vue` 详情弹窗样式 - 已与计量单位一致
