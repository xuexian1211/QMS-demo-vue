# customer-supplier-mapping Specification

## Purpose
TBD - created by archiving change add-customer-supplier-mapping. Update Purpose after archive.
## Requirements
### Requirement: 客供物料跨系统编码映射
系统 MUST 提供客供物料编码映射列表，允许将客户或供应商特定的物料编码与 QMS 系统内部标准物料档案（MaterialProduct）进行绑定，以消除系统间的沟通壁垒。

#### Scenario: 用户为特定客户建立物料编码映射
When 用户在客供关系映射中进入“物料编码映射”页签
And 选择某外资客户，并在输入框中填入其客户系统物料编码 "A100"
And 绑定系统内标准物料代码 "MAT-001"
Then 系统应保存此映射关系
And 在创建对该客户的出货检验(OQC)或接受客诉时，系统 MUST 支持通过客户物料编码 "A100" 直接检索到 "MAT-001"。

### Requirement: 客户特殊特性(CTQ)与检验标准协同
系统 MUST 支持将特定客户的质量特殊特性要求(CTQ)映射到对应的物料检验项目与标准中，并关联至特定的供应商或自制工序。

#### Scenario: 将客户 CTQ 同步至检验标准
When 用户管理某客户产品的 CTQ 参数（例如：某外观光洁度要求达标级别 1）
And 用户将该客户的 CTQ 指标映射至对应的物料来料检验或成品检验步骤
Then 系统在生成针对该物料及特定客户交付订单的检验任务时，MUST 自动包含该 CTQ 检验项，确保标准同步。

### Requirement: 追溯链路的基础关系绑定
系统 MUST 允许用户构建“客户-成品-生产工序-原材料-供应商”的全链路基础映射配置，用于在产生质量缺陷（如客诉）时辅助逆向溯源和正向追踪。

#### Scenario: 客户投诉触发逆向溯源预处理
When 发生关联特定客户的严重投诉
And 用户依据系统内的客供链路分析
Then 系统 MUST 能够根据映射关系表，精准协助列出负责供应相关原材料的核心供应商列表，以便展开 RCA（根本原因分析）。

