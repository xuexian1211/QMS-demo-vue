## 1. 类型与数据
- [x] 1.1 在 `src/types/index.ts` 新增 `DocVersionRecord` 接口
- [x] 1.2 在 `src/api/document.ts` 新增 `getDocumentById()`、`getVersionHistory()` mock函数

## 2. 编辑页面
- [x] 2.1 新建 `src/views/documents/DocumentEdit.vue`（create/edit/view 三模式）
- [x] 2.2 PLM文档所有字段只读，状态固定显示"已发布"
- [x] 2.3 历史版本 Tab 展示版本列表

## 3. 路由
- [x] 3.1 注册 `/quality-system/document-management/create`、`/view/:id`、`/edit/:id` 三条路由

## 4. 列表页更新
- [x] 4.1 列表增加"分类"列（bizScene + docModule 中文标签）
- [x] 4.2 操作列：新增跳转、查看跳转、编辑跳转
- [x] 4.3 PLM文档状态在列表中强制显示"已发布"
