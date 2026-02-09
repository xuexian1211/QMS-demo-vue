# Capability: inspection-item-standard

## ADDED Requirements

### Requirement: 检验项目多组织标准
系统必须(SHALL)支持集团级和工厂级的检验项目标准。

#### Scenario: 集团标准全厂共享
- **GIVEN** 存在一个 orgId 为 NULL 的检验项目 "硬度测试"
- **WHEN** 工厂 A (orgId=1) 和工厂 B (orgId=2) 查看检验项目列表
- **THEN** 两工厂均可看到 "硬度测试"
- **AND** 该项目标记为 "集团标准"
- **AND** 工厂用户不可编辑该项目

#### Scenario: 工厂标准本地隔离
- **GIVEN** 工厂 A (orgId=1) 创建了一个检验项目 "特殊涂层检查"
- **WHEN** 工厂 B (orgId=2) 查看检验项目列表
- **THEN** 工厂 B 看不到 "特殊涂层检查"

---

### Requirement: 检验项目属性增强
系统必须(SHALL)支持检验项目的详细业务属性。

#### Scenario: 数据类型决定单位必填性
- **WHEN** 创建计量型 (QUANTITATIVE) 检验项目
- **THEN** "单位" (uom) 字段为必选项
- **WHEN** 创建计数型 (QUALITATIVE) 检验项目
- **THEN** "单位" 字段应被禁用或隐藏

#### Scenario: 默认值继承自方法与工具
- **WHEN** 质量工程师为检验项目选择 "默认检验方法"
- **THEN** 系统应自动关联对应的 SOP 附件（见 1.5. 检验方法表）

---

### Requirement: 默认不良现象关联
系统必须(SHALL)允许在基础标准库中为检验项目配置默认的不良现象。

#### Scenario: 自动过滤不良现象
- **GIVEN** 检验项目 "表面检查" 关联了 "划伤" 和 "色差"
- **WHEN** 在检验执行页面对 "表面检查" 进行判定为 NG 时
- **THEN** 缺陷选择器应默认只显示 "划伤" 和 "色差"
- **AND** 允许用户切换到 "全部缺陷" 以选择非默认项 (Optional 防呆设计)
