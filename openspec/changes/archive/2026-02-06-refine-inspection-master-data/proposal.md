# Proposal: 优化设计检验方法与抽样方案

## Why
当前检验方法和抽样方案的实现虽然已有基础，但与《质量检验主数据模型设计》文档（insp_main_data_req.md）中的详细设计存在不一致：
1. **抽样方案逻辑不完整**：目前未能根据不同的抽样方法（固定数量、百分比、国标等）动态展示和应用对应的规则字段（如样本量、样本量比率）。
2. **缺乏多组织支持**：检验方法尚未实现集团级与工厂级数据的隔离与引用逻辑。
3. **数据一致性校验不足**：抽样规则的批量范围重叠校验、Ac/Re判定逻辑等在现有UI中较为薄弱。

## What Changes
本提议旨在按照需求文档 1.5 及 1.6 章节的内容，重新梳理并优化相关功能：

### 1. 检验方法 (Inspection Method) 优化
- **字段对齐**：完整支持 `id`, `orgId`, `methodName`, `operationText`, `attachmentId`。
- **多组织逻辑**：支持标记为"集团"或"特定工厂"，并实现相应的可见性逻辑。

### 2. 抽样方案 (Sampling Plan) 优化
- **方案分类逻辑**：
  - **固定数量 (FIXED_QUANTITY)**：规则层级直接配置 `sampleSize`。
  - **百分比 (PERCENTAGE)**：规则层级直接配置 `sampleSizeRate`。
  - **国标/标准 (STANDARD_BASED)**：关联 `QM_MD_SamplingRuleDetail` 明细表（Ac/Re 矩阵）。
  - **全检 (FULL_INSPECTION)**：无需配置样本量。
- **UI 交互增强**：
  - 在编辑页面，根据选择的“抽样方法”动态切换规则编辑的表单项。
  - 添加批量范围的重叠校验。
  - 优化主从表展示（抽样方案 -> 抽样规则 -> 抽样明细）。

## Impact
- **数据模型**：更新 `QM_MD_SamplingRule` 以包含 `sampleSize` 和 `sampleSizeRate`。
- **用户面**：提升配置抽样方案的灵活性和准确性。
- **系统面**：为后续的检验任务自动计算样本量奠定基础。

## Verification Plan
### Automated Tests
- 后端数据校验逻辑测试（批量范围不重叠）。
- 抽样计算逻辑单元测试。

### Manual Verification
- 验证不同抽样方法下的表单切换逻辑。
- 验证多组织下的检验方法可见性。
