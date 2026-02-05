# Change: 完整实现质量主数据不良现象和不良原因管理

## Why

在完成核心缺陷修复（`fix-defect-management-core-issues`）后，系统仍缺少以下重要功能：

1. **FMEA 关联功能** - 无法实现 QMS 与 FMEA 的双向追溯和动态更新
2. **严重等级升级流程** - CR 级不良现象未自动触发 8D/QRQC 流程
3. **智能推荐算法** - 仅有简单的高频标记，缺少基于历史数据的智能推荐
4. **5M1E 体系不完整** - 缺少 Measurement（测量）类别

这些功能是需求文档（`insp_main_data_req.md` 第四部分）的重要组成部分，对于提升系统的专业性、自动化程度和用户体验至关重要。

本次变更在**提案一（最小修复）**的基础上，完整实现所有需求功能，使系统 100% 符合需求文档设计。

## What Changes

### 1. 数据模型扩展

#### 1.1 新增 FMEA 关联表 (CauseFmeaMapping)
- ✨ 新增表 `QM_MD_CauseFmeaMapping`
- 字段：`id`, `orgId`, `causeId`, `fmeaFailureModeId`, `fmeaType`, `rpn`

#### 1.2 扩展不良原因类别
- ✨ 增加 `Measurement` 类别（从 5M 扩展到 5M1E）

#### 1.3 扩展不良现象（支持升级流程）
- ✨ 新增 `autoEscalate: boolean` 字段 - 是否自动升级
- ✨ 新增 `escalateType: string` 字段 - 升级流程类型（8D/QRQC/NCR）
- ✨ 新增 `escalateCondition: string` 字段 - 升级条件

### 2. 前端功能增强

#### 2.1 FMEA 关联功能
- ✨ 新增 `FmeaSelector.vue` 组件 - FMEA 选择器
- ✨ 在 `DefectCauseEdit.vue` 中实现"FMEA 关联" Tab
- ✨ 支持选择 FMEA 失效模式
- ✨ 显示关联的 RPN 值
- ✨ 支持双向追溯

#### 2.2 严重等级升级流程
- ✨ 新增 `EscalateFlowConfig.vue` 组件 - 升级流程配置
- ✨ CR 级现象自动勾选"自动升级"
- ✨ 支持选择升级流程类型（8D/QRQC/NCR）
- ✨ 支持设置升级条件
- ✨ 检验结果录入时自动触发升级

#### 2.3 智能推荐算法
- ✨ 新增 `recommendationEngine.ts` 服务 - 推荐引擎
- ✨ 新增 `RecommendationPanel.vue` 组件 - 推荐面板
- ✨ 基于历史数据分析高频原因
- ✨ 基于现象-原因关联权重排序
- ✨ 基于时间衰减（近期数据权重更高）
- ✨ 显示推荐理由

#### 2.4 5M1E 体系完善
- ✨ 增加 Measurement（测量）类别
- ✨ 左侧树增加"测"节点
- ✨ 示例数据补充测量相关原因

### 3. 新增组件和服务

#### 3.1 新增组件
- `src/components/FmeaSelector.vue` - FMEA 选择器
- `src/components/RecommendationPanel.vue` - 推荐面板
- `src/components/EscalateFlowConfig.vue` - 升级流程配置

#### 3.2 新增服务
- `src/services/recommendationEngine.ts` - 推荐引擎
- `src/services/escalateFlowService.ts` - 升级流程服务
- `src/api/fmeaApi.ts` - FMEA API

### 4. 业务逻辑增强

#### 4.1 FMEA 双向追溯
- QMS 原因 → FMEA 失效模式：查看关联的 FMEA 项
- FMEA 失效模式 → QMS 原因：查看可能的根本原因
- RPN 变化时，提示更新 QMS 原因分析

#### 4.2 自动升级流程
- 检验结果录入时，检测 CR 级不良
- 自动创建 8D/QRQC 任务
- 发送通知给相关人员

#### 4.3 智能推荐逻辑
- 综合评分：历史关联 + 高频标记 + 工序相似度 + 时间衰减
- 推荐理由生成
- 用户反馈收集（采纳/忽略）

## Impact

### 受影响的前端文件

**新增文件**:
- `src/components/FmeaSelector.vue`
- `src/components/RecommendationPanel.vue`
- `src/components/EscalateFlowConfig.vue`
- `src/services/recommendationEngine.ts`
- `src/services/escalateFlowService.ts`
- `src/api/fmeaApi.ts`

**修改文件**:
- `src/types/index.ts` - 扩展类型定义
- `src/views/inspection-model/DefectCauseEdit.vue` - FMEA 关联 Tab
- `src/views/inspection-model/DefectPhenomenonList.vue` - 推荐面板
- `src/views/inspection-model/DefectPhenomenonEdit.vue` - 升级流程配置
- `src/views/inspection-model/DefectCauseList.vue` - 增加 Measurement 类别
- `src/api/defectManagement.ts` - 扩展 API

### 受影响的后端

- 新增 `QM_MD_CauseFmeaMapping` 表
- 扩展 `QM_MD_DefectPhenomenon` 表（升级流程字段）
- 扩展 `QM_MD_DefectCause` 表（Measurement 类别）
- 新增升级流程触发接口
- 新增推荐算法接口

### 用户体验提升

- ✅ FMEA 与 QMS 无缝集成，知识复用
- ✅ CR 级不良自动升级，快速响应
- ✅ 智能推荐原因，提高录入效率
- ✅ 5M1E 体系完整，分析更全面

### 依赖关系

本提案**依赖于** `fix-defect-management-core-issues` 提案，必须在其完成后才能实施。
