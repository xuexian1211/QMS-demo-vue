# 提案：重构检验项目基础标准

## 目标
根据 `insp_main_data_req.md` 需求文档，重构“检验项目”（检验特性）功能，支持多组织继承和增强的元数据。这将确保系统能够处理集团级标准和工厂级覆盖，并提供与不良现象及模板更好的集成。

## 背景
当前系统的 `InspectionItem` 实体较为基础，缺乏多组织支持、详细的分类以及与其他主数据实体（检验方法、量检具类型）的强关联。`insp_main_data_req.md` 中的 1.7 和 1.7.1 章节概述了更结构化的方法。

## 方案建议
1.  **数据模型增强**：
    *   增加 `orgId` 以支持多组织（`NULL` 代表集团，特定 ID 代表工厂）。
    *   增加 `category` 分类（尺寸、外观、理化、功能）。
    *   链接 `defaultMethodId` 和 `defaultInstTypeId` 到各自的主数据表。
    *   增加标记：`isLabTest_default`（默认送实验室）、`isSpc_default`（默认 SPC 监控）。
    *   增加 `status`（启用/禁用）。
2.  **UI 重新设计**：
    *   更新 `InspectionItemList.vue` 以显示组织上下文和新字段。
    *   更新 `InspectionItemEdit.vue` 以支持集团/工厂级别的编辑规则（例如，工厂用户可查看集团项目但在本厂创建/编辑自己的项目）。
3.  **技术规约 (Spec Delta)**：
    *   在 `quality-master-data` 下或作为新规约创建 `inspection-item-standard` 能力。

## 依赖关系
- `quality-master-data`（现有的缺陷和原因规约）。
- `inspection-method`（现有的检验方法规约）。
- `instrument-type`（如果尚不存在，则需要量检具类型规约）。
