# 任务：更新项目文档功能

1. **更新路由和菜单**
   - 更新 `router/index.ts`，将 `UpdateLog` 路由重命名为 `ProjectDocs`。
   - 更新主布局（MainLayout）或菜单配置，在界面上显示为“项目文档”而不是“系统更新日志”。

2. **将 UpdateLog.vue 重构为 ProjectDocs.vue**
   - 将 `src/views/system/UpdateLog.vue` 重命名为 `src/views/system/ProjectDocs.vue`。
   - 将侧边栏标题从 "需求文档 (PRD)" 更改为 "QMS-Docs"。
   - 修改 `import.meta.glob` 调用，改为从 `/QMS-Docs/**/*.{md,txt}` 读取代码，而不是继续读取 `/PRD`。

3. **增强树形数据结构**
   - 更新树解析逻辑，确保 `QMS-BRD` 和 `QMS-PRD` 在新的根节点 `QMS-Docs` 下正确分组。

4. **添加 Mermaid 图表支持**
   - 在组件中安装或配置 Mermaid.js。
   - 增强 markdown 渲染方法，解析格式化的 mermaid 代码块，将其渲染并显示为 SVG 图表。

5. **实现导出/下载功能**
   - 在内容区域右上角添加下载按钮组（包括 MD 和 PDF 两个按钮）。
   - 实现 `下载 MD`：前端创建 Blob 对象并触发浏览器对 `activeNode.content` 的直接下载。
   - 实现 `下载 PDF`：使用 `window.print`（配合打印媒体查询进行样式控制）或使用客户端的 PDF 生成库来实现 PDF 导出。

6. **验证更改**
   - 验证来自 `QMS-Docs/QMS-BRD` 和 `QMS-Docs/QMS-PRD` 的 markdown 文件能够正常在左侧目录显示并且右侧渲染正确。
   - 验证 Mermaid 图表能够正确渲染，无任何错乱或 js 报错信息。
   - 验证 MD 和 PDF 文件的下载功能正常工作并能成功打开。
