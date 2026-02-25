# 检验计划管理架构设计 (Inspection Plan Architecture Design)

## 数据模型 (Data Model)
核心实体 `InspectionPlan` 表字段概念：
- `id`: 表主键
- `orgId`: 数据控制域隔离字段（为空则为集团级）
- `planCode`: 检验大纲号
- `planName`: 方案中文全称
- `version`: 技术版本号(管控追溯)
- `inspType`: 检验过程类型（`IQC/IPQC/FQC/OQC`）
- `templateName`: 引用的底层检测表原始模板外键名称
- `status`: 生命周期状态（DRAFT, IN_APPROVAL, APPROVED, OBSOLETE）

关联实体概念设计：
- `InspectionPlanItem`: 检验特征明细列表，多对一关联至 `InspectionPlan`
- `InspectionPlanAQL`: 对应的 AQL 放行细则设定
- `InspectionPlanCondition`: 用于匹配特定料号库或生产上下文的映射规则

## 多组织隔离与权限控制 (Multi-Org & Permissions)
- **集团和工厂层级的重用继承保护**：对于属于集团级定义 (`orgId === null` 或类似标识) 的原始检验方案，厂级作业人员仅可查看和复制，不允许直接编辑和删除。
- **降维复制**：允许通过副本复制向导，将集团方案或其它组织的可视方案直接复制为本组织归属的 DRAFT 状态的新方案。

## 状态生命周期 (State Machine)
检验方案强依赖状态流转：
1. **DRAFT**（草稿）：可全量编辑基本信息和检验项。
2. **IN_APPROVAL**（审批中）：锁定编辑，等待审批。
3. **APPROVED**（已批准）：不可变状态，实际供业务环境挂载使用。若需修改或升级只能通过生成新版本的 DRAFT 或者复制出新的方案号来实现。
4. **OBSOLETE**（作废）
