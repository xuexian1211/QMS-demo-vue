# 任务：重构检验项目基础标准

## 第一阶段：需求与规约 (Requirements & Specs)
- [x] 翻译提案和设计文档为中文
- [x] 编写 `inspection-item-standard` 的技术规约增量 (Spec Delta)
- [x] 评审并批准提案

## 第二阶段：后端实现 (Backend Implementation - Mock/Internal)
- [ ] 更新 `InspItem` 数据模型（MOCK 存储/定义 API 类型结构）【跳过，用户指示】
- [ ] 在数据获取中实现多组织过滤逻辑【跳过，用户指示】

## 第三阶段：前端实现 (Frontend Implementation)
- [x] 更新 `src/views/inspection-model/InspectionItemList.vue`
    - [x] 增加分类、所属组织和状态列
    - [x] 增加组织和分类的过滤功能
    - [x] 增加 SPC/实验室标记列
    - [x] 实现集团项目对工厂用户编辑/删除禁用逻辑
- [x] 更新 `src/views/inspection-model/InspectionItemEdit.vue`
    - [x] 增加新字段（组织标识、分类、默认方法、默认量具类型）
    - [x] 增加 SPC/实验室默认开关
    - [x] 实现集团项目的只读逻辑（带提示）
    - [x] 增强"关联不良现象"页签功能
- [x] 更新 `src/types/index.ts`
    - [x] 增强 InspectionItem 接口，支持新字段

## 第四阶段：验证 (Validation)
- [ ] 验证多组织可见性（通过 MOCK 用户切换）
- [ ] 验证字段规则（编码唯一性、必填项限制）
- [ ] 验证在模板/方案中的继承逻辑（后续集成测试范围）
