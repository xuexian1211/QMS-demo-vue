# Spec: 检验策略绑定 (Inspection Strategy Binding)

## ADDED Requirements

### Requirement: [REQ-STRAT-001] 基于上下文的方案匹配
系统 SHALL 支持根据业务上下文 (Business Context) 查找唯一适用的检验方案 (InspScheme)。
业务上下文包括但不限于：物料 (Material)、供应商 (Supplier)、工序 (Operation)、检验类型 (Type) 等。

#### Scenario: 供应商特定方案
- **GIVEN**: 存在方案 A (关联 S01供应商 + M001物料) 和方案 B (关联 M001物料)。
- **WHEN**: 系统接收到来自 S01 供应商的 M001 物料收货通知。
- **THEN**: 系统应优先匹配到方案 A。

#### Scenario: 默认/通用方案
- **GIVEN**: 存在方案 B (关联 M001物料)。
- **WHEN**: 系统接收到来自 S02 (新供应商) 的 M001 物料收货通知。
- **THEN**: 系统因未找到特定供应商的方案，应回退匹配到通用方案 B。

### Requirement: [REQ-STRAT-002] 优先级仲裁机制
当多个策略同时匹配当前上下文时，系统 SHALL 根据预设的优先级 (Priority) 确定唯一胜出的方案。
优先级数值越小，优先级越高。

#### Scenario: 临时加严策略
- **GIVEN**: 
    - 策略 A：优先级 100，匹配 M001。
    - 策略 B：优先级 10 (高)，匹配 M001 + "前3批"。
- **WHEN**: M001 的第 2 批次收货。
- **THEN**: 策略 B 胜出，系统执行加严方案。
- **WHEN**: M001 的第 4 批次收货。
- **THEN**: 策略 B 失效 (条件不满足)，策略 A 胜出，系统执行常规方案。

### Requirement: [REQ-STRAT-003] 多维度绑定配置
系统 SHALL 提供界面允许用户为同一个检验方案配置多个不同的绑定策略。

#### Scenario: 一方案多用
- **GIVEN**: 创建了一个“通用电子料检验方案”。
- **WHEN**: 用户创建策略 1：绑定到物料组“电阻”。
- **WHEN**: 用户创建策略 2：绑定到物料组“电容”。
- **THEN**: “电阻”和“电容”类物料在收货时，均会使用该通用方案。
