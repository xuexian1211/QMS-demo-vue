# 检验计划功能规格 (Inspection Plan Specifications)

## ADDED Requirements

### Requirement: 检验计划高级查询与列表视图
The system MUST provide an advanced query and list view for inspection plans, allowing filtering by status and multiple organizations.

#### Scenario: 过滤与查看列表
- **When** 用户进入检验计划列表页，并选择特定的状态（如草稿）和组织
- **Then** 系统成功过滤并展示符合条件的方案代码、名称、版本等信息

### Requirement: 检验计划状态流转控制
The inspection plan MUST follow a strict lifecycle (DRAFT, IN_APPROVAL, APPROVED, OBSOLETE) enforcing edit locks appropriately.

#### Scenario: 状态改变与编辑锁定
- **When** 质量工程师将 DRAFT 状态的检验计划提交审批
- **Then** 状态变更为 IN_APPROVAL，系统在此后不再允许任何直接的表单编辑

### Requirement: 集团与工厂层级的重用继承保护
The system MUST protect Group-level inspection plans from being edited or deleted by factory-level users.

#### Scenario: 拦截非法编辑
- **When** 工厂级质检员尝试编辑或删除属于集团级（orgId 为空）的检验方案
- **Then** 系统隐蔽前端编辑入口并在 API 层抛出无权修改通用标准的异常

### Requirement: 检验方案副本复制向导
The system MUST provide a wizard to clone an existing inspection plan into a new DRAFT plan under a potentially different target organization.

#### Scenario: 跨组织复制方案
- **When** 用户选中一个集团标准并点击“复制方案”，填入新的目标组织和编码后确认
- **Then** 系统将原方案及其下挂载的所有特征规格全量复制，生成针对目标组织的一套新 DRAFT 草稿方案

### Requirement: 检验模板挂载与关联明细深度定制
The system MUST allow users to link a base template to a DRAFT plan and subsequently independently customize the inherited inspection items.

#### Scenario: 深度定制特征规格
- **When** 工程师在编辑关联了模板的方案时，修改了下方列表中某一项特征的公差上下限并保存
- **Then** 修改仅在此业务方案自身生效，底层原始模板的数据保持不变
