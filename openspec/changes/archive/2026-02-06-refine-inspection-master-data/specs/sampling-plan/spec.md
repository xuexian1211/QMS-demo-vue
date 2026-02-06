# Sampling Plan Specification

## ADDED Requirements

### Requirement: 动态抽样规则配置

系统必须(SHALL)根据抽样方案的“抽样方法”动态切换抽样规则的输入内容。

#### Scenario: 固定数量抽样只需配置样本量
- **GIVEN** 抽样方案的抽样方法为 "FIXED_QUANTITY"
- **WHEN** 用户添加或编辑抽样规则
- **THEN** 系统应显示 "样本量" 输入框
- **AND** 隐藏 "样本量比率" 和 "抽样明细表"

#### Scenario: 百分比抽样只需配置比例
- **GIVEN** 抽样方案的抽样方法为 "PERCENTAGE"
- **WHEN** 用户添加或编辑抽样规则
- **THEN** 系统应显示 "样本量比率 (%)" 输入框
- **AND** 隐藏 "样本量" 和 "抽样明细表"

#### Scenario: 国标抽样必须配置范围明细
- **GIVEN** 抽样方案的抽样方法为 "STANDARD_BASED"
- **WHEN** 用户编辑抽样规则
- **THEN** 系统应显示 "抽样明细表"
- **AND** 要求输入批次范围 (Min/Max)、样本量、Ac、Re
- **AND** 隐藏单一的样本量和比例输入框

---

### Requirement: 抽样明细数据校验

系统必须(SHALL)检验抽样明细行的逻辑严谨性。

#### Scenario: 批量范围不得重叠
- **WHEN** 用户保存抽样明细
- **AND** 存在两个明细行的批量范围存在交集
- **THEN** 系统应报错并阻止保存

#### Scenario: Ac/Re 判定逻辑校验
- **WHEN** 用户录入 Ac=1, Re=1
- **THEN** 系统应校验 Re 必须大于 Ac，并推荐 Re = Ac + 1
