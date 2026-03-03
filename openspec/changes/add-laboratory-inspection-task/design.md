# 架构设计：实验室送检机制（包含盲测与留样）

## 1. 系统角色与业务流转图
1. **检验员 (IQC/IPQC等)**：在源头执行基础检验，如果涉及实验室项目则自动触发/或者手工创建实验室任务。
2. **实验室接样员**：接收样品，扫码生成标签，指定台账存放库位。
3. **实验操作员/分析员**：
   - 执行内部检测（常规或盲测模式），如果是盲测，历史数据对当前人不可见。
   - 调用 IoT 接口获取或手动录入。
   - 进行留样标识，并在到期前执行销毁/退还处置。
4. **实验室主任/AQE**：判定委外需求，发起委外申请；审核系统自动生成的实验报告。
5. **品质总监/SQE**：接收超出预警线、致命超标报警，跟进异常单据。

## 2. 核心数据模型扩展与新增

* `qms_lab_task` (实验室主记录)
  * `task_no`: 实验室任务编号 (PK)
  * `source_task_no`: 来源单号
  * ...
  * `is_blind_test`: 是否需要启用盲测模式 (BOOLEAN)
  * `is_urgent`: 加急标识 (BOOLEAN，驱动4H超时报警)

* `qms_lab_result` (实验室结果记录)
  * `task_no`: 关联任务
  * `measured_value`: 实际测量值 (IoT采集或手工)
  * `judgment`: 自动比对判定的 PASS/FAIL 结果

* **[新增] `qms_lab_sample` (留样管理台账)**
  * `sample_code`: 样品唯一标识
  * `material_code`: 物料编码
  * `location`: 库房存放库位
  * `status`: 留样状态 (`RETAINED`留样中, `DISPOSED`已销毁, `RETURNED`已退还)
  * `deposit_date`: 存入日期
  * `retention_date`: 预定销毁日 (如：自动推算三个月后)
  * `handler`: 留样负责人/处置人

* **[新增] `qms_lab_report` (检测试验报告库)**
  * `report_no`: 体系内流转的报告编号
  * `task_no`: 关联具体的分析任务
  * `file_url`: 自动生成及归档的 PDF / 第三方委外报告附件
  * `judgment`: 综合判定结论
  * `review_status`: 内部报告审核状态

## 3. 集成与预警控制设计 (Interlocking & Alerts)
- **设备互联 (IoT)**：对于大批量读取设备（CMM/拉力机），优先实现 MQTT 订阅和数据推流，以 `sample_code` 为关键字回传 QMS，更新 `qms_lab_result`。
- **盲测模式 (Blind Test)**：对于特定实验开启，读取 `is_blind_test` 标识，前端视图隐藏相关操作人过去测试类似参数的历史列表。
- **预警推送与互锁**：
  - 触发：普通试验超过24小时、加急试验超过4小时未生成结果。
  - 措施：通过钉钉 Webhook 通知“实验室主任”。
  - 互锁：致命结果(FAIL)根据源头任务调用 WMS API拦截该 `batch_no` 库存。
- **留样到期监控**：基于定时任务引擎按日扫描 `qms_lab_sample` 中即将到达 `retention_date` 的样品，触发销毁/回收通知。
