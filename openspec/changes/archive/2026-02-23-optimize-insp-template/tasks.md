# Tasks: 检验模板与方案核心模型优化实施计划

## 1. 模型定义与类型增强
- [x] 定义 `InspScheme` 和 `InspSchemeDetail` 的 TypeScript 接口。
- [x] 定义 `InspStrategy` (原 InspPlan) 的 TypeScript 接口，支持 `matchDimension` JSON 结构。
- [x] 更新 `MaterialSpec` 接口，确保 `inspItemCode` 的关联性。

## 2. 检验方案 (InspScheme) 管理
- [x] **API 实现**：
    - [x] `createSchemeFromTemplate(templateId)`: 复制模板及明细 (前端 mock 实现)。
    - [x] `updateSchemeDetail`: 支持增删改方案明细行。
- [x] **前端实现 (`InspSchemeEdit.vue`)**：
    - [x] 创建独立的方案编辑页面。
    - [x] 实现"导入模板"功能（选择模板 -> 弹窗确认 -> 自动复制明细）。
    - [x] 实现明细行的行内编辑 (Item, CharacteristicClass, SamplingRule, Method)。
    - [x] 来自模板的行与新增行视觉区分（蓝/绿色 Tag）。
    - [x] 接入路由（create/edit/view 均使用 InspSchemeEdit.vue）。

## 3. 检验策略 (InspStrategy) 管理
- [x] **匹配引擎重构**：
    - [x] 实现基于 `matchDimension` 和 `priority` 的通用匹配逻辑（嵌入模拟器前端实现）。
    - [ ] 支持"新供应商前N批"的计数器逻辑 (后端需要持久化状态，前端完成UI)。
- [x] **前端实现**：
    - [x] 在 `InspSchemeEdit.vue` 的"适用策略"Tab 增加策略绑定视图。
    - [x] 实现策略配置弹窗：选择上下文 (Material, Supplier...) -> 绑定 Scheme。
    - [x] 实现策略匹配模拟器（输入上下文 -> 输出匹配策略）。

## 4. 物料规格 (MaterialSpec) 管理
- [x] **规格维护组件**：
    - [x] 开发 `MaterialSpec` 编辑功能嵌入到方案编辑页"物料规格" Tab。
    - [x] 支持计量型（公差/目标值/USL/LSL）与计数型（标准描述/期望值）分支逻辑。
    - [x] 支持根据方案已有项目列表选择关联的检验项目。

## 5. 验证与演示
- [ ] 编写单元测试：验证 `StrategyMatcher` 逻辑的正确性 (覆盖优先级、通配符等)。
- [x] 验证功能流程：创建模板 -> 生成方案（引用模板）-> 编辑明细 -> 绑定策略 -> 配置规格。
