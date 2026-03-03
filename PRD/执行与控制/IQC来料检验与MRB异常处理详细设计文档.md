# IQC 来料检验执行与 MRB 进料不良异常处理 — 详细设计文档

> **版本**: V2.0  
> **日期**: 2026-03-02  
> **模块位置**: 生产质量管理 > 来料检验 / 异常处理  

---

## 1. 概述

本文档描述 IQC 来料检验任务管理与 MRB (Material Review Board) 来料不合格品审理的完整业务需求，覆盖从 WMS/SRM 收货信号触发、检验计划匹配、动态抽样、检验执行防呆，到不合格自动生单、在线多部门会签评审、结构化处置分支及 8D 闭环预防的端到端链条。

---

## 2. IQC 来料检验任务管理

### 2.1 业务触发与任务生成逻辑

| 编号 | 需求项 | 说明 |
|------|--------|------|
| T-01 | **接口触发** | WMS 或 SRM 完成收货登记并绑定"生产指令卡"后，通过 WebAPI 向 QMS 发送报检信号 |
| T-02 | **计划匹配** | 根据 `OrgId`(工厂代码)、`物料编码`、`业务类型(IQC)` 检索匹配的生效检验计划 |
| T-03 | **优先级匹配** | 多策略命中时按优先级执行（如新供应商前3批 P5 > 常规抽检 P20） |
| T-04 | **方案快照** | 自动引用关联方案的"检验项目明细"和"抽样规则"（如 AQL 0.65 Level-II） |
| T-05 | **参数覆盖** | 支持计划中的"本地化微调"覆盖原始规格值（如平面度公差 0.05→0.03） |

### 2.2 检验执行需求

| 编号 | 需求项 | 说明 |
|------|--------|------|
| E-01 | **特性分类指引** | 界面清晰标识特性分类 Major / CC(关键特性) / SC(重要特性)，指引检验员关注要点 |
| E-02 | **动态抽样计算** | 根据收货数量及 AQL 标准自动计算样本量(n)、允收数(Ac)、拒收数(Re) |
| E-03 | **实验室联动** | 标记"实验室"的检验项自动生成实验室检测任务并关联 IQC 源单号 |
| E-04 | **自动判定** | 实测值录入后自动与规格上下限比对，单项判定 PASS/FAIL |
| E-05 | **不良锁定拦截** | 录入被标记为"锁定"的不良现象时，系统强制拦截提交并升级至高级别审批 |
| E-06 | **强制选择** | FAIL 项目必须选择预设字典中的不良现象代码后方可提交 |

### 2.3 结果反馈与闭环

| 编号 | 需求项 | 说明 |
|------|--------|------|
| R-01 | **库存解锁** | 合格后自动调用 WMS 接口更新放行标识，解锁库存上架 |
| R-02 | **绩效回写** | 检验结果自动计入供应商绩效模型，影响合格率及后续检验策略 |
| R-03 | **MRB 自动触发** | 不合格结果自动生成 MRB 审理单并通知 SQE |

---

## 3. MRB 来料不合格品审理

### 3.1 触发与建单

| 编号 | 需求项 | 说明 |
|------|--------|------|
| M-01 | **自动发起** | IQC 不合格或致命缺陷预警时自动生成《来料不合格品审理单》并推送 SQE |
| M-02 | **标识管理** | 指导 IQC 人员粘贴 🔴红色不合格标签 或 🟡黄色可疑品标签 进行隔离 |

### 3.2 在线评审流程

| 编号 | 需求项 | 说明 |
|------|--------|------|
| V-01 | **会签机制** | SQE 组织 MRB 小组(质量、技术、采购、生产)在线评审，通过钉钉推送审批任务 |
| V-02 | **风险定级** | 根据不合格影响程度进行致命/严重/轻微三级定级 |
| V-03 | **分级审批** | 致命/大批量缺陷需更高层级审批（品质总监/总经理） |

### 3.3 处置分支

| 处置方式 | 后续操作 |
|----------|----------|
| **退货(RTV)** | 调用 WMS 接口更新不合格数，采购退货，ERP 冲抵应付 |
| **挑选/返修** | 记录工时及辅料成本 → 计入「内部故障成本(COQ)」；合格品重入库流程 |
| **让步接收(特采)** | 强制关联《偏离申请单》，实物加贴让步标识；降价损失计入「外部故障成本」 |
| **报废** | 更新库存冲减，计入报废成本 |

### 3.4 纠正与预防闭环

| 编号 | 需求项 | 说明 |
|------|--------|------|
| P-01 | **8D 触发** | 严重或重复发生的不良，强制要求供应商提供 8D 整改报告 |
| P-02 | **知识沉淀** | 结案时提示是否更新 FMEA、检验方案、供应商经验库 |
| P-03 | **连续预警** | 同一供应商连续出现同类不良时，系统阻止直接结案需先建 8D 单 |

---

## 4. 数据模型设计

### 4.1 检验任务表 (`qms_insp_task`)

| 字段 | 类型 | 说明 |
|------|------|------|
| task_no | VARCHAR(30) | 唯一任务编号 |
| org_id | VARCHAR(20) | 工厂代码 |
| material_code | VARCHAR(30) | 物料编码 |
| batch_no | VARCHAR(30) | 批次号 |
| supplier_code | VARCHAR(20) | 供应商代码 |
| scheme_id | BIGINT | 关联检验方案快照 ID |
| strategy_name | VARCHAR(100) | 匹配的策略名称 |
| aql_level | VARCHAR(30) | AQL 水平 (如 AQL 0.65 Level-II) |
| is_override | BOOLEAN | 是否有本地化参数覆盖 |
| quantity | INT | 来料总数量 |
| sample_qty | INT | 动态计算样本量(n) |
| accept_qty | INT | 允收数(Ac) |
| reject_qty | INT | 拒收数(Re) |
| priority | ENUM | 优先级 (HIGH/MEDIUM/LOW) |
| status | ENUM | PENDING → IN_PROGRESS → COMPLETED |
| result_status | ENUM | QUALIFIED / UNQUALIFIED |

### 4.2 检验结果明细表 (`qms_insp_result_detail`)

| 字段 | 类型 | 说明 |
|------|------|------|
| item_code | VARCHAR(20) | 检验项编码 |
| char_class | ENUM | 特性分类 (CC/SC/MAJOR/一般) |
| insp_mode | ENUM | 检验模式 (ONSITE/LAB) |
| data_type | ENUM | 数据类型 (QUANTITATIVE/COUNTING) |
| target_value | DECIMAL | 目标值 |
| upper_limit / lower_limit | DECIMAL | 上下限 |
| is_override_spec | BOOLEAN | 是否覆盖参数 |
| measured_value | VARCHAR | 实测值/结果 |
| judgment | ENUM | PASS / FAIL |
| phenomenon_code | VARCHAR(20) | 不良现象代码 |

### 4.3 MRB 异常审理单 (`qms_mrb_record`)

| 字段 | 类型 | 说明 |
|------|------|------|
| record_no | VARCHAR(30) | 审理单号 |
| task_id | BIGINT | 关联 IQC 任务 |
| risk_level | ENUM | CRITICAL / MAJOR / MINOR |
| isolation_tag | ENUM | RED / YELLOW |
| review_status | ENUM | DRAFT → UNDER_REVIEW → APPROVED → CLOSED |
| disposition | ENUM | RETURN / REWORK / CONCESSION / DISCARD |
| rework_hours | DECIMAL | 返修工时 |
| rework_material_cost | DECIMAL | 辅料成本 |
| deviation_no | VARCHAR(30) | 偏离申请单号 (特采必填) |
| concession_cost | DECIMAL | 让步降价损失 |
| cause_code | VARCHAR(20) | 根本原因分类 |
| has_8d | BOOLEAN | 是否关联 8D |
| require_force_8d | BOOLEAN | 是否强制 8D |

---

## 5. 页面清单

| 序号 | 页面名称 | 路由 | 说明 |
|------|----------|------|------|
| 1 | IQC 来料检验任务列表 | `/production-quality/quality-inspection/iqc-task-list` | 任务总览，含策略来源、AQL 抽样参数展示 |
| 2 | IQC 检验执行 | `/production-quality/quality-inspection/iqc-task-execution/:id` | 检验填报、特性指引、自动判定、锁定拦截 |
| 3 | MRB 来料不合格品审理 | `/production-quality/exception-handling/mrb-records` | 审理列表、会签评审、处置分支、8D 闭环 |
