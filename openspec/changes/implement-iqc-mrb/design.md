# 数据模型与架构设计

## 1. 概述
当前架构通过 WMS 或 SRM 系统的接口深度互联，实现了智能触发的进料检验。产生的检验任务（`qms_insp_task`）通过本地化微调和严谨的抽样计算规则下发给质检员操作界面。若检验不合格或部分项目触发红线拦截，则强制生成 MRB 异常评审记录（`qms_mrb_record`），随后启动包含各部门协作的多分支线上审批流及闭环处理机制。

## 2. 核心实体模型与关键数据

### 2.1 检验任务表 (`qms_insp_task`) 与策略模型
- **前置匹配条件**：`org_id`（工厂代码）、`material_code`（物料编码）、`source_bill_type`（业务类型，如IQC）。
- **策略与快照**：一旦命中相关策略，自动关联并生成 `scheme_id` 快照。处理任务覆盖（如加严、特殊公差调整）。
- **优先级匹配 (`priority`)**：支持数字或级别设定，优先执行特需任务（例如新供应商强制 `HIGH` 高优先级 P5）。
- **状态字段 (`status`)**：`PENDING` -> `IN_PROGRESS` -> `COMPLETED`。

### 2.2 检验结果主表 (`qms_insp_result`) 联通检验规则
- **统计字段**：保存动态抽样计算值 `sample_qty`（样本量 n）、`accept_qty`（允收数 Ac）、`reject_qty`（拒收数 Re）。
- **判定与联动**：保存整体判定结果 `result_status` (`QUALIFIED` / `UNQUALIFIED`)。与前置系统交互实现：如果 `QUALIFIED`，通知 WMS 解锁库存；更新 SQM 模块内的供应商绩效。

### 2.3 检验结果明细表 (`qms_insp_result_detail`)
- **特性防呆指导**：继承方案设定的 `char_class`（Major/CC/SC 等关键功能/安全特性分类）。
- **结果记录**：`measured_value` 实测数值，与上下限实时比对得出 `judgment`。
- **强制阻断**：当 `judgment` 为 `FAIL` 时，质检员必须录入字典中的 `phenomenon_code`。
- **实验关联**：若标记为 `LAB`，则后台关联并触发子单实验室送检，阻塞主单完成状态直至报告可用。

### 2.4 MRB 异常审理单表 (`qms_mrb_record`) 与评审流
当 `result_status` 为 `UNQUALIFIED` 或存在一票否决现象时自动生成。
- **隔离标识与推送**：自动通过消息 API （如钉钉集成）推送 SQE，指导车间对实物附挂 🔴红色不合格 或 🟡黄色可疑品标识。
- **工作流转 (`review_status`)**：`DRAFT` -> `UNDER_REVIEW` (可触发多阶段、多人员的会签机制) -> `APPROVED` (多级审核完成) -> `CLOSED`。
- **处理闭环 (`disposition`)**：明确退货(RTV)、挑选/返修、让步接收(特采)、报废。各个路径自动生成派生行为（如特采强制生成偏离申请连带；返工要求内部故障成本 COQ 挂载）。
- **纠防关联 (`action_flags`)**：处理中自动引发系统警告以决定是否启动 8D 系统表单建单及后续对 FMEA 数据、方案库的补全。
