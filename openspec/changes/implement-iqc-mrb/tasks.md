# 任务列表

- [x] 1. **搭建页面组件结构及路由**
   - 细化 `IqcTaskExecution.vue` 的交互，体现特性分类 (Major/CC/SC) 的指引 UI。
   - 完善 `MrbRecordList.vue` 的交互逻辑，支持复杂的在线评审、缺陷明细展示及 8D 触发弹窗。

- [x] 2. **实现 IQC 任务自动生成与拉取业务**
   - 定义前端任务请求接口结构 `fetchTaskWithAqlScope`，处理来自 WMS/SRM 的接口快照。
   - 处理"本地化微调参数"，确保任务列表中获取的公差及抽样参数 (`n, Ac, Re`) 与检验模型实时匹配且准确。

- [x] 3. **构建动态抽样计算与执行检验表单**
   - 在 `IqcTaskExecution.vue`，实现接收数量后动态通过 AQL 计算 `sample_qty` 的逻辑呈现。
   - 对 `qms_insp_result_detail` 层面的观测数执行自动超差报警拦截；对"致命缺陷"执行立即全单锁死拦截。
   - 为触发实验室业务（如硬度、拉力检测）留出外部接口，允许这些特殊行处于 `WAIT_LAB` 的状态。

- [x] 4. **完成与闭环任务、WMS 库存回调及触发 MRB 流程**
   - 开发前端 API 提交 `result_status` ；若为 `QUALIFIED` 模拟向 WMS 返回解锁货位的 API 回拨记录。
   - 对处于 `UNQUALIFIED` 的检验，给出红色警戒，确认提交后在后台触发推入 `qms_mrb_record` 及向 SQE 的站内信提示。

- [x] 5. **执行 MRB 在线审理流与处理对策生成**
   - 展现待评审的 `MRB` 任务，展示导致不良的具体现象追踪源 `defectDetails`。
   - 提供权限受控的审理动作：DRAFT (生成隔离红/黄标通知) -> UNDER_REVIEW (可供各部门评审员协同输入) -> APPROVED。
   - 根据处理决定 (`RETURN`, `REWORK`, `CONCESSION`, `DISCARD`) 呈现不同的下挂表单要求（例如，特采要求附上批准表关联编号和外失成本损失核算预估）。
   - 在关闭记录前，增加"触发8D要求"、"更新知识库/控制计划"的 Flag 打勾保存提醒。
