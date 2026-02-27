# 检验计划模型设计架构 (Design Inspection Plan Architecture)

## 数据模型 (ERD 简述)
核心实体 `InspectionPlan` 包含以下概念设计：
- `id`: 表主键 (PK)
- `org_id`: 组织机构 (FK)，支持多组织，关联所属事业部/工厂
- `scheme_id`: 关联的检验方案 (FK)，承接底层检测特征结构
- `plan_code`: 计划编号，自动生成，支持业务编码规则
- `plan_name`: 计划名称，如：XX压铸件进料年度检验计划
- `plan_status`: 状态控制 (Draft, Active, Suspended)
- `inspect_type`: 检验类型 Enum (IQC, IPQC, FQC, OQC, 巡检)
- `material_id`: 关联物料档案 (ID)，支持多规格配置
- `trigger_type`: 触发器类型 (Event, Time, Manual, Quantity)
- `match_rules`: 触发配置 JSON（匹配ERP单据等逻辑条件配置）
- `executor_id`: 默认责任检验员 (FK)
- `copy_from_id`: 自关联，溯源复制源记录，保障降维/多组织派发清晰
- `is_latest_version`: 布尔判定字段，多版本共存中标识最终活性版本

## 动态属性覆盖 (Dynamic Parameter Override)
虽然“方案”预设了规格标准，在“计划”层要求微调（例如同类型压铸件在特定生产线要求极高精度）。
- **设计**: 使用 `parameter_override` (JSON格式) 进行阈值差异存储，在生成任务时系统优先获取 `parameter_override` 判断是否对原有特征明细实行了自定义覆盖重写。

## 高级动作与快速响应 (Advanced Actions)
基于现有的方案上的不良现象锁定特性，计划层进一步扩增“快速响应等级”。
若设定的关键物料及锁定现象条件被触发，根据计划的配置项直接发送邮件/钉钉告警请求给质量经理级别的责任岗。

## 复制与多组织继承 (Copy and Inheritance)
- 集团定义通用标准级检验计划模板。
- 下属工厂进行“复制”。保留并引用核心方案结构，且仅修改自身的触发频率以及地方检验责任人员，使得方案体系的一致性与实施落地的灵活性得以统筹管理。
