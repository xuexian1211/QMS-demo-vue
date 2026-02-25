# 优化基础数据管理 (Optimize Basic Data Management) - 任务清单

## 1. 多组织架构支持 (Multi-Organization Support)
- [x] 在 `CustomerArchive.vue`（客户档案）中添加 `orgId` (所属组织) 的选择器以及前台查询、列表展示功能。
- [x] 在 `SupplierArchive.vue`（供应商档案）中添加 `orgId` (所属组织) 的选择器以及前台查询、列表展示功能。
- [x] 在 `MaterialProduct.vue`（物料/产品档案）中添加 `orgId` (所属组织) 的选择器以及前台查询、列表展示功能。
- [x] 更新上述三个 Vue 文件中的 Mock 数据生成逻辑，引入拟真的 `orgId` 占位标识（如 "1" 代表合肥工厂，"2" 代表芜湖工厂，"Group" 或是空值 代表集团共有全局数据）。

## 2. 层级数据的高级布局重构 (Advanced Layouts for Hierarchical Data)
- [x] 修改 `MaterialCategory.vue`（物料分类），改造为左侧使用 Tree 树形组件，右侧展示详情或表格的布局结构。
- [x] 更新 `MaterialProduct.vue`（物料产品档案），嵌入左侧树状组件，以便用户可以通过左侧点击物料分类来动态过滤右侧的物料产品表格。

## 3. 数据批量处理功能增强 (Data Loading Features)
- [x] 在 `CustomerArchive.vue` 的工具栏中增加带有下拉菜单的"导入 (Import)"按钮，实现模板下载和界面的文件上传入口功能支持。
- [x] 引入（或前台模拟实现） Excel 解析的逻辑，并在 `SupplierArchive.vue` 及 `MaterialProduct.vue` 界面中同等接入"导入 (Import)"的界面及交互支持。

## 4. 资质附件管理完善 (Qualification Attachments Management)
- [x] 在 `CustomerArchive.vue` 的编辑模态框中新增"附件"页签或独立区块，提供占位式的上传组件（Upload Component）。
- [x] 在 `SupplierArchive.vue` 的编辑模态框中新增"资质及附件管理"功能区块，支持多附件的上传，并且针对类似体系认证证书的附件能够支持设置有效到期日并进行相关展示。
