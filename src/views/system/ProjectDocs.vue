<template>
  <div class="project-docs-container">
    <!-- 左侧侧边栏 -->
    <div class="docs-sidebar">
      <div class="sidebar-header">
        <h3>QMS-Docs</h3>
      </div>
      <a-tree
        v-if="treeData.length > 0"
        :tree-data="treeData"
        :default-expand-all="true"
        @select="onSelect"
        blockNode
      />
      <div v-else style="padding: 24px; text-align: center; color: #999;">
        未找到文档
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="docs-content">
      <template v-if="activeNode">
        <!-- 文档标题栏：标题 + 下载按钮 -->
        <div class="doc-header">
          <h2 class="doc-title">{{ activeNode.title }}</h2>
          <div class="doc-actions">
            <a-tooltip title="下载 Markdown 原文">
              <a-button type="default" size="small" @click="downloadMd">
                ⬇ 下载 MD
              </a-button>
            </a-tooltip>
            <a-tooltip title="导出并打印为 PDF">
              <a-button type="default" size="small" @click="downloadPdf" style="margin-left: 8px;">
                🖨 下载 PDF
              </a-button>
            </a-tooltip>
          </div>
        </div>

        <!-- Markdown 内容渲染区 -->
        <div
          v-if="isMarkdown"
          ref="markdownBodyRef"
          class="markdown-body"
          v-html="renderedContent"
        ></div>
        <!-- 纯文本内容渲染区 -->
        <pre v-else class="text-body">{{ activeNode.content }}</pre>
      </template>

      <!-- 空态提示 -->
      <div v-else class="empty-state">
        <a-empty description="请在左侧选择要查看的文档" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick } from 'vue';
  import { marked } from 'marked';
  import mermaid from 'mermaid';

  // NOTE: 从 /QMS-Docs 目录的 BRD 和 PRD 子文件夹中读取所有 markdown 和 txt 文件
  // glob 以 '/' 开头以项目根目录为基准解析
  const modules = import.meta.glob('/QMS-Docs/**/*.{md,txt}', {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  interface TreeNode {
    title: string;
    key: string;
    isLeaf?: boolean;
    content?: string;
    children?: TreeNode[];
    selectable?: boolean;
  }

  const treeData = ref<TreeNode[]>([]);
  const activeNode = ref<TreeNode | null>(null);
  const markdownBodyRef = ref<HTMLElement | null>(null);

  /**
   * 将文件路径记录构建为树形结构
   * 根节点为 QMS-Docs 下的各子文件夹（QMS-BRD / QMS-PRD）
   */
  const buildTree = (records: Record<string, string>): TreeNode[] => {
    const root: TreeNode[] = [];

    for (const [path, content] of Object.entries(records)) {
      // path 类似 '/QMS-Docs/QMS-BRD/xxx.md'
      const match = path.match(/\/QMS-Docs\/(.+)$/);
      if (!match) continue;

      const relativePath = match[1]; // 'QMS-BRD/xxx.md'
      const parts = relativePath.split('/');

      let currentLevel = root;
      let currentKey = '';

      parts.forEach((part, index) => {
        currentKey += (currentKey ? '/' : '') + part;
        const isLeaf = index === parts.length - 1;

        let existingNode = currentLevel.find((n) => n.title === part);
        if (!existingNode) {
          existingNode = {
            title: part,
            key: currentKey,
            isLeaf,
            selectable: isLeaf,
          };
          if (isLeaf) {
            existingNode.content = content as string;
          } else {
            existingNode.children = [];
          }
          currentLevel.push(existingNode);
        }

        if (!isLeaf) {
          currentLevel = existingNode.children!;
        }
      });
    }
    return root;
  };

  onMounted(() => {
    // NOTE: 初始化 mermaid，使用默认主题，禁用自动初始化由代码手动控制
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });

    treeData.value = buildTree(modules as Record<string, string>);
  });

  const onSelect = (selectedKeys: string[], e: any) => {
    const node = e.node.dataRef as TreeNode;
    if (node && node.isLeaf) {
      activeNode.value = node;
      // NOTE: 切换文档后需要重新渲染 Mermaid 图表
      nextTick(() => {
        renderMermaidDiagrams();
      });
    }
  };

  const isMarkdown = computed(() => {
    if (!activeNode.value) return false;
    return activeNode.value.title.toLowerCase().endsWith('.md');
  });

  /**
   * 将 Markdown 原文渲染为 HTML
   * 使用 marked 解析标准 markdown 语法
   */
  const renderedContent = computed(() => {
    if (!isMarkdown.value || !activeNode.value?.content) return '';
    // NOTE: marked.parse 解析全部 markdown，包括 mermaid 代码块（保留为 <pre><code class="language-mermaid">）
    // 后续在 renderMermaidDiagrams 中再将其替换为 SVG
    return marked.parse(activeNode.value.content) as string;
  });

  /**
   * 在 DOM 更新后，查找所有 mermaid 代码块并将其渲染为 SVG 图表
   */
  const renderMermaidDiagrams = async () => {
    if (!markdownBodyRef.value) return;

    // 查找所有 language-mermaid 代码块
    const mermaidBlocks = markdownBodyRef.value.querySelectorAll(
      'pre code.language-mermaid, code.language-mermaid'
    );

    for (const block of Array.from(mermaidBlocks)) {
      const code = block.textContent || '';
      const pre = block.closest('pre') || block;

      try {
        // NOTE: 使用唯一 id 避免多图表冲突
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code);

        // 用 SVG 替换原始代码块
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-diagram';
        wrapper.innerHTML = svg;
        pre.parentNode?.replaceChild(wrapper, pre);
      } catch (err) {
        // FIXME: 渲染失败时保留原始代码块，添加错误标记
        console.error('Mermaid 图表渲染失败:', err);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mermaid-error';
        errorDiv.textContent = '⚠ Mermaid 图表渲染失败，请检查语法';
        pre.parentNode?.insertBefore(errorDiv, pre);
      }
    }
  };

  /**
   * 下载当前文档的 Markdown 原文
   * 直接通过 Blob + <a> 触发浏览器下载
   */
  const downloadMd = () => {
    if (!activeNode.value?.content) return;
    const blob = new Blob([activeNode.value.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // 去掉文件后缀再加 .md，确保文件名正确
    a.download = activeNode.value.title.replace(/\.[^.]+$/, '') + '.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * 将当前文档内容导出为 PDF
   * 使用 window.print() + 打印媒体查询，保留 Mermaid SVG 图表
   */
  const downloadPdf = () => {
    if (!activeNode.value) return;
    window.print();
  };
</script>

<style scoped>
  /* ===== 整体布局 ===== */
  .project-docs-container {
    display: flex;
    height: calc(100vh - 104px);
    background: #fff;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  /* ===== 左侧侧边栏 ===== */
  .docs-sidebar {
    width: 320px;
    border-right: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    background-color: #fafafa;
    overflow-y: auto;
  }

  .sidebar-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .sidebar-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .docs-sidebar :deep(.ant-tree) {
    flex: 1;
    overflow-y: auto;
    padding: 12px 8px;
    background-color: transparent;
  }

  .docs-sidebar :deep(.ant-tree-node-content-wrapper) {
    width: 100%;
  }

  /* ===== 右侧内容区 ===== */
  .docs-content {
    flex: 1;
    padding: 32px 40px;
    overflow-y: auto;
    background: #fff;
  }

  /* 标题行：标题 + 下载按钮右对齐 */
  .doc-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eaecef;
    gap: 16px;
  }

  .doc-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    flex: 1;
    word-break: break-word;
  }

  .doc-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .empty-state {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ===== 纯文本 ===== */
  .text-body {
    white-space: pre-wrap;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    font-size: 14px;
    line-height: 1.6;
    color: #374151;
    background: #f9fafb;
    padding: 24px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  /* ===== GitHub 风格 Markdown 样式 ===== */
  .markdown-body {
    font-size: 15px;
    line-height: 1.6;
    color: #24292f;
    word-wrap: break-word;
  }

  .markdown-body :deep(h1),
  .markdown-body :deep(h2),
  .markdown-body :deep(h3),
  .markdown-body :deep(h4),
  .markdown-body :deep(h5),
  .markdown-body :deep(h6) {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
    /* NOTE: scroll-margin-top 支持锚点导航时正确滚动 */
    scroll-margin-top: 80px;
  }

  .markdown-body :deep(h1) {
    font-size: 2em;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: 0.3em;
  }

  .markdown-body :deep(h2) {
    font-size: 1.5em;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: 0.3em;
  }

  .markdown-body :deep(h3) {
    font-size: 1.25em;
  }

  .markdown-body :deep(h4) {
    font-size: 1em;
  }

  .markdown-body :deep(p) {
    margin-top: 0;
    margin-bottom: 16px;
  }

  .markdown-body :deep(code) {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  }

  .markdown-body :deep(pre) {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 6px;
    margin-bottom: 16px;
  }

  .markdown-body :deep(pre code) {
    background-color: transparent;
    padding: 0;
  }

  .markdown-body :deep(blockquote) {
    padding: 0 1em;
    color: #57606a;
    border-left: 0.25em solid #d0d7de;
    margin: 0 0 16px 0;
  }

  .markdown-body :deep(ul),
  .markdown-body :deep(ol) {
    padding-left: 2em;
    margin-top: 0;
    margin-bottom: 16px;
  }

  .markdown-body :deep(li) {
    word-wrap: break-all;
  }

  .markdown-body :deep(li > p) {
    margin-top: 16px;
  }

  .markdown-body :deep(table) {
    border-spacing: 0;
    border-collapse: collapse;
    margin-top: 0;
    margin-bottom: 16px;
    width: 100%;
  }

  .markdown-body :deep(table th),
  .markdown-body :deep(table td) {
    padding: 6px 13px;
    border: 1px solid #d0d7de;
  }

  .markdown-body :deep(table tr) {
    background-color: #ffffff;
    border-top: 1px solid #d0d7de;
  }

  .markdown-body :deep(table tr:nth-child(2n)) {
    background-color: #f6f8fa;
  }

  .markdown-body :deep(img) {
    max-width: 100%;
    box-sizing: content-box;
  }

  /* ===== Mermaid 图表容器 ===== */
  .markdown-body :deep(.mermaid-diagram) {
    margin: 16px 0;
    text-align: center;
    overflow-x: auto;
  }

  .markdown-body :deep(.mermaid-diagram svg) {
    max-width: 100%;
    height: auto;
  }

  /* Mermaid 渲染失败的错误提示 */
  .markdown-body :deep(.mermaid-error) {
    padding: 12px 16px;
    background: #fff2f0;
    border: 1px solid #ffccc7;
    border-radius: 6px;
    color: #cf1322;
    font-size: 14px;
    margin-bottom: 16px;
  }

  /* ===== 打印媒体查询（PDF 导出样式） ===== */
  @media print {
    /* 隐藏不需要打印的 UI 元素 */
    .docs-sidebar,
    .doc-actions {
      display: none !important;
    }

    .project-docs-container {
      height: auto;
      box-shadow: none;
    }

    .docs-content {
      padding: 0;
      overflow: visible;
    }

    /* 确保 Mermaid SVG 图表在打印时正确显示 */
    .markdown-body :deep(.mermaid-diagram svg) {
      page-break-inside: avoid;
    }

    /* 标题不允许在打印时断页 */
    .markdown-body :deep(h1),
    .markdown-body :deep(h2),
    .markdown-body :deep(h3) {
      page-break-after: avoid;
    }
  }
</style>
