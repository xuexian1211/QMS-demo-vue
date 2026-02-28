## 1. 结构与模型
- [x] 1.1 在 `src/types/index.ts` 中定义 `ControlledDocument` 接口，包含 `storageSource` (QMS|PLM)、`bizScene` (一级分类)、`docModule` (二级分类) 等关键字段。
- [ ] 1.2 在 `src/api/document.ts` 实现支持混合数据源的获取逻辑（Mock 环境下模拟 PLM 与 QMS 的分类交织数据）。

## 2. 文档树开发 (5大业务场景)
- [ ] 2.1 开发 `DocCategoryTree.vue` 组件，初始化加载 5 大业务场景及 sub-modules。
- [ ] 2.2 实现树节点的“数据源所有权”标识，用于在交互中区分管理逻辑。

## 3. 右侧列表与联动权限
- [ ] 3.1 增加工具栏权限动态判定：当选中二级分类的核心文档主存为 PLM 时，禁用“新增”、“删除”按钮，显示“从PLM同步”。
- [ ] 3.2 实现表格列的自适应：针对“核心工程图档”增加版本追溯链接；针对“检验报告”增加报告预览入口。

## 4. 特殊模块处理 (APQP/异常管理)
- [ ] 4.1 针对 APQP 模块，增加与 PLM 文档状态的联动逻辑说明。
- [ ] 4.2 针对异常管理模块，实现 NCR/8D 报告在 QMS 内部的生命周期表单。

## 5. 菜单与路由
- [ ] 5.1 注册 `quality-system/document-management` 路由，并同步更新 `MainLayout.vue` 侧边栏。
