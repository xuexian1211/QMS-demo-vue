# Tasks: 检验模板与方案核心模型优化实施计划

## 1. 模型定义与类型增强
- [x] 定义 `InspScheme` 和 `InspSchemeDetail` 的 TypeScript 接口。
- [x] 定义 `InspStrategy` (原 InspPlan) 的 TypeScript 接口，支持 `matchDimension` JSON 结构。
- [x] 更新 `MaterialSpec` 接口，确保 `inspItemCode` 的关联性。
- [x] 在模型定义中全面增加 `orgId` 字段以支持多组织。

## 2. 检验方案 (InspScheme) 管理
- [x] **API 实现**：
    - [x] `createSchemeFromTemplate(templateId)`: 复制模板及明细。
    - [x] `updateSchemeDetail`: 支持增删改方案明细行。
- [x] **前端实现 (`InspSchemeEdit.vue`)**：
    - [x] 创建独立的方案编辑页面。
    - [x] 实现\"导入模板\"功能。
    - [x] 实现明细行的行内编辑 (Item, Method, SamplingRule)。
    - [x] **UI 布局重构**：参考检验模板，实现 4 页签布局（明细、不良现象、策略、规格）。
    - [x] 实现\"明细不良现象绑定\"页签逻辑。

## 3. 检验策略 (InspStrategy) 管理
- [x] **匹配引擎重构**：
    - [x] 实现基于 `matchDimension` 和 `priority` 的通用匹配逻辑。
    - [x] 支持\"新供应商前N批\"的计数器逻辑 (需要 Redis 或 DB 状态存储)。
- [x] **前端实现**：
    - [x] 在 `InspSchemeEdit.vue` 中增加\"策略绑定\"视图。
    - [x] **弹窗增强**：支持物料组、客户过滤，支持 IPQC 类型绑定。
    - [x] 实现策略配置弹窗：选择上下文 (Material, Supplier...) -> 绑定 Scheme。

## 4. 物料规格 (MaterialSpec) 管理
- [x] **规格维护组件**：
    - [x] 开发 `MaterialSpecEditor` 组件，嵌入到\"物料管理\"或\"方案管理\"中。
    - [x] 支持根据 ItemCode 自动匹配当前方案的项目列表，填报公差。
    - [x] **规格联动与同步**：实现从物料档案自动拉取规格，并支持双向同步功能。

## 5. 验证与演示
- [x] 编写单元测试：验证 `StrategyMatcher` 逻辑的正确性 (覆盖优先级、通配符等)。
- [x] 创建实施说明文档：总结已完成的工作和使用示例。

## 后续工作（需要后端配合）
- [ ] 实现后端 API 接口
- [ ] 实现从模板复制明细的后端逻辑
- [ ] 实现批次计数器（Redis/DB）
- [ ] 端到端集成测试
- [ ] 与现有模块集成（检验模板、物料管理等）
