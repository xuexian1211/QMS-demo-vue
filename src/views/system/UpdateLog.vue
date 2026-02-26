<template>
  <div class="prd-container">
    <div class="prd-sidebar">
      <div class="sidebar-header">
        <h3>需求文档 (PRD)</h3>
      </div>
      <a-tree v-if="treeData.length > 0" :tree-data="treeData" :default-expand-all="true" @select="onSelect"
        blockNode />
      <div v-else style="padding: 24px; text-align: center; color: #999;">
        未找到文档
      </div>
    </div>
    <div class="prd-content">
      <template v-if="activeNode">
        <h2 class="doc-title">{{ activeNode.title }}</h2>
        <div v-if="isMarkdown" class="markdown-body" v-html="renderedContent"></div>
        <pre v-else class="text-body">{{ activeNode.content }}</pre>
      </template>
      <div v-else class="empty-state">
        <a-empty description="请在左侧选择要查看的文档" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { marked } from 'marked';

  // 读取项目里所有的PRD markdown 和 txt
  // glob 的以 '/' 开头会以项目根目录为基准解析
  const modules = import.meta.glob('/PRD/**/*.{md,txt}', { as: 'raw', eager: true });

  interface TreeNode {
    title: string;
    key: string;
    isLeaf?: boolean;
    content?: string;
    children?: TreeNode[];
    selectable?: boolean;
  }

  const treeData = ref < TreeNode[] > ([]);
  const activeNode = ref < TreeNode | null > (null);

  const buildTree = (records: Record<string, string>) => {
    const root: TreeNode[] = [];

    for (const [path, content] of Object.entries(records)) {
      // path 类似 '/PRD/基础数据/物料产品档案.md'
      const match = path.match(/\/PRD\/(.+)$/);
      if (!match) continue;

      const relativePath = match[1]; // '基础数据/物料产品档案.md'
      const parts = relativePath.split('/');

      let currentLevel = root;
      let currentKey = '';

      parts.forEach((part, index) => {
        currentKey += (currentKey ? '/' : '') + part;
        const isLeaf = index === parts.length - 1;

        let existingNode = currentLevel.find(n => n.title === part);
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
    treeData.value = buildTree(modules as Record<string, string>);
  });

  const onSelect = (selectedKeys: any[], e: any) => {
    const node = e.node.dataRef as TreeNode;
    if (node && node.isLeaf) {
      activeNode.value = node;
    }
  };

  const isMarkdown = computed(() => {
    if (!activeNode.value) return false;
    return activeNode.value.title.toLowerCase().endsWith('.md');
  });

  const renderedContent = computed(() => {
    if (!isMarkdown.value || !activeNode.value?.content) return '';
    return marked.parse(activeNode.value.content);
  });
</script>

<style scoped>
  .prd-container {
    display: flex;
    height: calc(100vh - 104px);
    background: #fff;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .prd-sidebar {
    width: 320px;
    border-right: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    background-color: #fafafa;
  }

  .sidebar-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    background: #fff;
  }

  .sidebar-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .prd-sidebar :deep(.ant-tree) {
    flex: 1;
    overflow-y: auto;
    padding: 12px 8px;
    background-color: transparent;
  }

  .prd-sidebar :deep(.ant-tree-node-content-wrapper) {
    width: 100%;
  }

  .prd-content {
    flex: 1;
    padding: 32px 40px;
    overflow-y: auto;
    background: #fff;
  }

  .doc-title {
    margin-top: 0;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eaecef;
    font-size: 28px;
    font-weight: 600;
    color: #1f2937;
  }

  .empty-state {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

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

  /* 基于 GitHub 风格的 Markdown 样式 */
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
  }

  .markdown-body :deep(h1) {
    font-size: 2em;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: .3em;
  }

  .markdown-body :deep(h2) {
    font-size: 1.5em;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: .3em;
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
    padding: .2em .4em;
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
    border-left: .25em solid #d0d7de;
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
</style>