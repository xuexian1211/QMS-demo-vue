## MODIFIED Requirements

### Requirement: QMS文档全生命周期编辑
系统MUST提供新增/编辑表单，仅对 `storageSource=QMS` 的文档开放写操作。

#### Scenario: 新增QMS文档
- **WHEN** 用户点击"新增文档"
- **THEN** 跳转至 create 页面，表单可填写 docNo、docName、docType、version、bizScene、docModule、status、remark

#### Scenario: PLM文档只读
- **WHEN** 用户查看 `storageSource=PLM` 的文档
- **THEN** 所有字段禁用，状态固定显示"已发布"，无保存按钮

### Requirement: 历史版本查看
系统MUST在文档查看页提供历史版本列表。

#### Scenario: 查看历史版本
- **WHEN** 用户在查看页切换到"历史版本" Tab
- **THEN** 展示该文档的版本记录列表（版本号、操作人、时间、状态）

### Requirement: 列表分类列
系统MUST在文档列表中显示每条记录的业务场景和模块分类。

#### Scenario: 不依赖树选择识别分类
- **WHEN** 用户未选择左侧分类树节点
- **THEN** 列表中每行仍显示该文档所属的一级场景和二级模块中文名称
