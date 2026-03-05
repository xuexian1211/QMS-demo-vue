# 实施任务清单：变化点管理 

## 阶段 1：基础架构与基础数据
- [x] defined: 创建数据库模型，包括 `ChangePointRecord`（变化点记录）、`ChangeRiskMatrix`（风险矩阵规则）以及 `VerificationTask`（验证任务）。 → 已完成：`src/types/change-point.ts`
- [x] defined: 开发 PC 端页面："风险矩阵与规则配置"（超级管理员专区），用于配置"变化类型 -> 风险等级 -> 审批路由"的自动计算逻辑。 → 已完成：`RiskMatrixConfig.vue`
- [ ] defined: 在后端实现"风险定级引擎"服务，根据配置的规则动态计算提报的风险等级。（前端已模拟，后端待对接）

## 阶段 2：提报与审批流（PC 主导，PDA 辅助）
- [x] defined: 开发 PC 端页面："变化点申报与处理工作台"，支持全量功能（4M1E 提报、中高风险审批、方案制定）。 → 已完成：`ChangePointList.vue` + `ChangePointEdit.vue`
- [ ] defined: 开发 PDA 移动端辅助页面："变化点一键申报页"，包含 4M1E 大图标分类、扫码关联功能和现场拍照上传功能。（待实现）
- [x] defined: 实现后端 API 以接收提报数据，触发风险引擎，并将流程自动路由至班组长（低风险）或 QE/品质经理（中高风险）。 → 前端逻辑已模拟完成
- [x] defined: 开发 PC 端及 PDA 移动端视图："快速审批队列"，针对各层级（包括班长与经理）提供快捷的审批处理。 → 已在列表页内集成审批弹窗
- [ ] defined: 集成钉钉接口（或模拟接口），将中/高风险的审批任务推送给 QE/品质总监。（待实现）

## 阶段 3：MES 互锁与试生产验证
- [x] defined: 开发 QMS-MES 模拟服务接口，提供 `lock-machine`（锁机）和 `unlock-machine`（解锁）功能。 → 已在审批逻辑中模拟
- [x] defined: 实现逻辑：当审批通过中/高风险变化点时，系统自动调用 `lock-machine` API 并生成详细的"试生产检验任务"数据。 → 已在前端模拟
- [x] defined: 开发 PC 端页面："验证任务管理与录入中心"，允许用户在电脑上执行详尽的试生产结果录入与评估。 → 已完成：`VerificationCenter.vue`
- [ ] defined: 开发 PDA 移动端页面："现场验证任务单"，为现场 IPQC 提供快速录入视图，高亮显示当前处于"试生产验证"状态的任务。（待实现）
- [x] defined: 实现放行逻辑：一旦验证任务达标（合格），系统自动触发 `unlock-machine` API 向 MES 发送解锁放行指令。 → 已在前端模拟

## 阶段 4：看板、台账追溯与预警机制
- [x] defined: 开发 PC 端页面："变化点中央看板"，展示当日/当月分布情况，以及直观的红绿灯状态指示。 → 已完成：`ChangePointDashboard.vue`
- [x] defined: 开发 PC 端页面："变化点台账与追溯"，支持列表管理，并支持点击穿透查看 MES 锁机日志、验证记录及闭环报告。 → 已完成：`ChangePointList.vue` + `ChangePointEdit.vue`（含MES日志查看）
- [ ] defined: 实现定时/事件触发的预警机制：对于 MES 盲动行为（锁定期间有报工数据），立即触发钉钉的红色"DING"预警。（前端预警数据已展示，后端触发待实现）
- [ ] defined: 实现定时预警机制：被锁机后若超过 4 小时未完成验证，发送橙色超时催办预警。（超时状态前端已展示，后端推送待实现）
- [ ] defined: （可选）开发闭环联动提示功能：当变化点固化后，提示并触发 SOP/FMEA 等文件的升版更替。（已在闭环UI中添加提示，联动逻辑待实现）

## 已创建文件清单（PC 端）
- `src/types/change-point.ts` - 完整类型定义与常量
- `src/views/production-quality/change-point/ChangePointDashboard.vue` - 中央看板
- `src/views/production-quality/change-point/ChangePointList.vue` - 台账列表与审批
- `src/views/production-quality/change-point/ChangePointEdit.vue` - 申报/编辑/查看详情页
- `src/views/production-quality/change-point/VerificationCenter.vue` - 试生产验证任务中心
- `src/views/production-quality/change-point/RiskMatrixConfig.vue` - 风险矩阵规则配置
- `src/router/index.ts` - 已添加全部 PC 端路由
- `src/layout/MainLayout.vue` - 已更新"改进与行动"菜单添加变化点子菜单
