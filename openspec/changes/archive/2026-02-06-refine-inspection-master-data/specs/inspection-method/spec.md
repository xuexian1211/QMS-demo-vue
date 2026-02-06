# Inspection Method Specification

## ADDED Requirements

### Requirement: 检验方法多组织隔离与引用

系统必须(SHALL)支持检验方法的多组织管理，实现集团标准与工厂私有方法的并存。

#### Scenario: 工厂用户看到集团和本工厂的检验方法
- **GIVEN** 存在一个集团级方法 "通用卡尺测量" (orgId=NULL)
- **AND** 存在一个合肥工厂方法 "蓝牙卡尺测量" (orgId=1)
- **WHEN** 合肥工厂用户查看检验方法列表
- **THEN** 列表中应同时显示以上两种方法
- **AND** 集团级方法应显示 "集团" 标签

#### Scenario: 方法名称在组织内唯一
- **WHEN** 用户在同一组织下尝试创建同名方法
- **THEN** 系统应拦截并提示 "方法名称已存在"

---

### Requirement: 检验方法附件管理

系统必须(SHALL)允许为检验方法关联指导书附件。

#### Scenario: 上传作业指导书
- **WHEN** 用户编辑检验方法时录入附件名称或 ID
- **THEN** 系统应保存该关联关系
- **AND** 检验任务执行时可据此索引对应的 SIP 文件
