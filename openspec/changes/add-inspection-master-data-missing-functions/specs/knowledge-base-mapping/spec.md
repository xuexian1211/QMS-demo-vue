# 知识库关联管理

## ADDED Requirements

### Requirement: 现象-原因关联管理
The system MUST support phenomenon-cause relationship management to enable intelligent recommendation functionality. 系统应支持现象-原因关联管理，实现智能推荐功能

#### Scenario: 质量工程师在不良现象编辑页管理关联原因
- 当质量工程师在编辑不良现象时
- 系统应显示"关联原因"标签页
- 系统应提供双侧穿梭框选择器
- 系统应在左侧显示可选原因列表
- 系统应在右侧显示已选原因列表

#### Scenario: 质量工程师搜索原因列表
- 当质量工程师在左侧原因列表中输入搜索关键词时
- 系统应过滤原因列表，显示匹配的原因
- 系统应支持按原因名称或代码搜索

#### Scenario: 质量工程师添加关联原因
- 当质量工程师从左侧选择原因并点击"添加"按钮时
- 系统应将选中的原因移动到右侧已选列表
- 系统应允许设置该原因的权重（默认为0）

#### Scenario: 质量工程师移除关联原因
- 当质量工程师从右侧选择原因并点击"移除"按钮时
- 系统应将选中的原因移动到左侧可选列表
- 系统应删除该关联关系

#### Scenario: 质量工程师设置关联原因权重
- 当质量工程师在右侧已选列表中修改某个原因的权重值时
- 系统应保存该权重值
- 系统应根据权重值对已选原因进行排序

#### Scenario: 系统保存现象-原因关联
- 当质量工程师点击"保存"按钮时
- 系统应保存当前现象的所有关联原因和权重
- 系统应提示"关联关系保存成功"

### Requirement: 原因-FMEA关联管理
The system MUST support cause-FMEA relationship management to enable QMS-FMEA integration. 系统应支持原因-FMEA关联管理，实现QMS与FMEA的联动

#### Scenario: 质量工程师在不良原因编辑页管理FMEA关联
- 当质量工程师在编辑不良原因时
- 系统应显示"FMEA关联"标签页
- 系统应显示已关联的FMEA失效模式列表

#### Scenario: 质量工程师添加FMEA关联
- 当质量工程师点击"添加FMEA"按钮时
- 系统应显示FMEA失效模式选择器
- 系统应允许用户多选FMEA失效模式
- 系统应在用户确认后将选中的失效模式添加到关联列表

#### Scenario: 质量工程师删除FMEA关联
- 当质量工程师点击某个FMEA失效模式的"删除"按钮时
- 系统应显示确认对话框
- 系统应在用户确认后删除该FMEA关联

#### Scenario: 系统保存原因-FMEA关联
- 当质量工程师点击"保存"按钮时
- 系统应保存当前原因的所有FMEA关联
- 系统应提示"关联关系保存成功"

### Requirement: 知识库智能推荐
The system MUST provide intelligent recommendations based on the knowledge base during inspection execution. 系统应在检验执行时基于知识库进行智能推荐

#### Scenario: 检验员选择不良现象时推荐原因
- 当检验员在检验执行页面选择不良现象时
- 系统应根据现象-原因关联查询相关原因
- 系统应按权重从高到低排序推荐原因
- 系统应在原因选择框中显示推荐原因列表

#### Scenario: 检验员查看原因的FMEA信息
- 当检验员选择某个不良原因时
- 系统应查询该原因关联的FMEA失效模式
- 系统应在界面上显示关联的FMEA失效模式信息
- 系统应提供链接跳转到FMEA详情页面

#### Scenario: 系统在NCR流程中提示关联信息
- 当质量工程师在NCR流程中选择不良原因时
- 系统应显示该原因关联的FMEA失效模式
- 系统应提示"该原因关联的FMEA失效模式可能需要重新评估"

### Requirement: 现象-原因关联独立管理页面
The system MUST support an independent phenomenon-cause relationship management page (optional). 系统应支持现象-原因关联的独立管理页面（可选）

#### Scenario: 质量工程师访问现象-原因关联管理页面
- 当质量工程师访问"现象-原因关联"页面时
- 系统应显示左侧不良现象树
- 系统应显示右侧关联原因穿梭框

#### Scenario: 质量工程师在树中选择不良现象
- 当质量工程师在左侧树中选择某个不良现象时
- 系统应加载该现象已关联的原因列表
- 系统应在右侧已选列表中显示关联原因

#### Scenario: 质量工程师批量管理关联关系
- 当质量工程师使用独立管理页面时
- 系统应支持批量添加、删除关联关系
- 系统应支持批量设置权重
- 系统应支持导出关联关系数据

### Requirement: 关联数据一致性管理
The system MUST support relationship data consistency management. 系统应支持关联数据的一致性管理

#### Scenario: 删除不良现象时级联删除关联
- 当质量工程师删除某个不良现象时
- 系统应级联删除该现象的所有现象-原因关联记录
- 系统应提示"已删除X条关联记录"

#### Scenario: 删除不良原因时级联删除关联
- 当质量工程师删除某个不良原因时
- 系统应级联删除该原因的所有原因-FMEA关联记录
- 系统应级联删除该原因的所有现象-原因关联记录
- 系统应提示"已删除X条关联记录"

#### Scenario: 删除FMEA失效模式时清理关联
- 当用户在外部FMEA系统中删除失效模式时
- 系统应在下次同步时清理对应的关联记录
- 系统应标记关联为无效或删除

### Requirement: 知识库关联数据查询统计
The system MUST support knowledge base relationship data query and statistics. 系统应支持知识库关联数据的查询和统计

#### Scenario: 质量工程师查询现象的关联原因
- 当质量工程师搜索某个不良现象时
- 系统应显示该现象的所有关联原因
- 系统应显示每个原因的权重和关联时间

#### Scenario: 质量工程师统计高频原因
- 当质量工程师查看知识库统计时
- 系统应显示被关联次数最多的原因列表
- 系统应支持按组织、分类筛选统计

#### Scenario: 系统推荐高频原因标记
- 当某个原因的关联次数超过阈值时
- 系统应提示质量工程师是否将该原因标记为"高频原因"
- 系统应支持自动或手动标记高频原因
