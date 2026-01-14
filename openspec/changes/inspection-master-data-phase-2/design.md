# 设计：检验主数据第二阶段

## 数据架构

### 关系建模
鉴于当前的客户端/模拟架构，关系将使用 ID 引用数组进行建模：

1. **现象 <-> 原因**：
   - `DefectPhenomenon` 实体将包含 `relatedCauseIds: string[]`
   - `DefectCause` 实体将包含 `relatedPhenomenonIds: string[]`
   - **约束**：应用程序逻辑必须确保这些保持同步（模拟参照完整性）。

2. **检验项目 <-> 缺陷**：
   - `InspectionItem` 实体将包含 `relatedDefectIds: string[]`
   - 原因：在定义检验项目时，我们需要知道要查找哪些缺陷。

### UI 组件

#### 关联管理器
一个可复用的组件 `AssociationManager.vue`（或类似逻辑），用于：
- 接受所有可用目标项目的列表（例如，所有原因）。
- 接受当前选定 ID 的列表。
- 将选定的项目显示为标签。
- 提供“添加”按钮，打开一个带有可搜索表格/列表的模态框以选择更多项目。

### 数据互操作性

#### 导出策略
- 创建一个 `useExport` 组合式函数。
- 功能：将当前表格 `dataSource` 转换为 CSV/Excel。
- 实现：如果不需要大型库，则使用标准的 `Blob` 和 `URL.createObjectURL` 进行 CSV 下载，或者如果可用则使用 `xlsx`。我们将从健壮的 CSV 导出开始。

#### 导入策略
- 用于 UI 演示的模拟实现。
- “点击导入 -> 选择文件 -> 显示加载中 -> 提示成功 -> 刷新列表”。

