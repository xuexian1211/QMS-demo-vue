# Tasks: 检验方法与抽样方案优化

## Phase 1: 检验方法功能增强

- [x] **Data Model**: 更新 Mock 数据及前端类型定义，增加 `orgId` 字段相关逻辑。 <!-- id: 0 -->
- [x] **UI Component**: 优化 `InspMethodList.vue` 的搜索表单，增加组织过滤预览。 <!-- id: 1 -->
- [x] **UI Logic**: 在列表页实现 "集团" 标签的视觉展示,区分数据来源。 <!-- id: 2 -->
- [x] **Refinement**: 完善检验方法编辑弹窗的字段校验（如方法名称必填、唯一性检查）。 <!-- id: 3 -->

## Phase 2: 抽样方案逻辑重构

- [x] **Data Model**: 在 `SamplingRule` 前端类型中增加 `sampleSize` 和 `sampleSizeRate` 字段。 <!-- id: 4 -->
- [x] **UI Component**: 修改 `SamplingPlanEdit.vue` 中的规则编辑弹窗。 <!-- id: 5 -->
- [x] **UI Logic**: 实现基于 `samplingMethod` 的表单字段动态显示切换逻辑。 <!-- id: 6 -->
- [x] **UI Logic**: 在编辑页面添加批量范围重叠的校验函数及 UI 提示。 <!-- id: 7 -->
- [x] **UX Polish**: 优化嵌套表格的展示样式，确保 Ac/Re 数据清晰易读。 <!-- id: 8 -->

## Phase 3: 验证与集成

- [x] **Validation**: 使用 `openspec validate` 验证所有变更。 <!-- id: 9 -->
- [x] **Regression**: 确保调整后的主数据能被检验模板正确引用（模拟验证）。 <!-- id: 10 -->
