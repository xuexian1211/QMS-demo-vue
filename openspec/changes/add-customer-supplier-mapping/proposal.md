# 基础数据：客供关系映射功能 (Basic Data: Customer-Supplier Mapping)

## Context
当前系统在 `src/views/basic-data/` 目录下同时存在 `CustomerArchive.vue` (客户档案)、`SupplierArchive.vue` (供应商档案) 和 `CustomerSupplier.vue` (客商资料管理)。根据最新的 PRD (`QMS系统菜单重构方案.md` 和 `基础数据与质量主数据_需求文档.md`)的设计，基础数据应将客户和供应商独立作为档案管理，而“客供关系映射”功能负责“针对包含特殊供应链关系的企业，维护两者联动的映射结构”。
目前的 `CustomerSupplier.vue` 实际上是一个把客户和供应商混在一个表里的 CRUD 页面（使用 `partnerType` 区分），这与最新的 PRD 架构规划不符。

## Proposed Change
重构 `CustomerSupplier.vue`，将其从“多合一客商 CRUD” 转化为真正的“客供关系映射”管理页面。
该页面只负责在已经建档的“客户”与“供应商”之间建立明确的映射关系（例如：同一企业实体、代工关系、VMI 关联等），从而支持在复杂的 OQC 和 IQC 业务流转中正确识别客供联动。

## Capabilities
因此，我们将引入 1 个核心 Capability：
- `customer-supplier-mapping`: 提供将现有客户档案与供应商档案进行配对、解绑及映射类型定义的功能。
