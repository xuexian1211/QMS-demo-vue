# Change: 受控文档 CRUD 补全与状态约束

## Why
当前受控文档列表缺少新增/查看/编辑入口，无文档预览和历史版本功能，PLM文档状态管控不严格。

## What Changes
- 补全 DocumentEdit.vue（create/edit/view 三模式）
- 文档查看页包含历史版本 Tab
- 列表增加分类列，操作列补全跳转入口
- PLM来源文档状态固定为"已发布"，不可编辑

## Impact
- Affected specs: controlled-document-crud
- Affected code:
  - `src/types/index.ts`：新增 `DocVersionRecord`
  - `src/api/document.ts`：新增 `getDocumentById`、`getVersionHistory`
  - `src/views/documents/DocumentEdit.vue`：新建
  - `src/views/documents/DocumentManagement.vue`：更新列和操作
  - `src/router/index.ts`：注册3条新路由
