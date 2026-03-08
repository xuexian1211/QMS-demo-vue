<template>
  <div class="project-docs-page">
    <aside v-if="!isMobile" class="sidebar-shell">
      <div class="sidebar-rail" aria-label="文档目录快捷操作">
        <a-button
          class="sidebar-rail__button"
          type="text"
          :aria-label="sidebarExpanded ? '收起目录' : '展开目录'"
          @click="toggleSidebarExpanded"
        >
          <template #icon>
            <MenuFoldOutlined v-if="sidebarExpanded" />
            <MenuUnfoldOutlined v-else />
          </template>
        </a-button>
      </div>

      <div v-if="sidebarExpanded" class="docs-sidebar">
        <div class="sidebar-header">
          <p class="sidebar-eyebrow">Knowledge Hub</p>
          <h3>QMS 项目文档</h3>
        </div>

        <div class="sidebar-search">
          <a-input
            v-model:value="searchQuery"
            allow-clear
            size="small"
            placeholder="Go to file"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
        </div>

        <div class="sidebar-summary">
          <span class="sidebar-count">{{ visibleLeafCount }} / {{ leafCount }}</span>
          <span class="sidebar-hint">{{ searchQuery ? '筛选结果' : '全部文档' }}</span>
        </div>

        <div v-if="filteredTreeData.length > 0" class="sidebar-tree-actions">
          <a-button size="small" type="text" @click="expandAll">全部展开</a-button>
          <a-button size="small" type="text" @click="collapseAll">全部收起</a-button>
        </div>

        <div v-if="filteredTreeData.length > 0" class="sidebar-tree">
          <a-tree
            :tree-data="filteredTreeData"
            :expanded-keys="expandedKeys"
            :auto-expand-parent="autoExpandParent"
            :selected-keys="selectedKeys"
            @expand="onExpand"
            @select="onSelect"
            blockNode
          />
        </div>
        <div v-else class="sidebar-empty">
          {{ searchQuery ? '未找到匹配的文档' : '未找到可用文档' }}
        </div>
      </div>
    </aside>

    <main class="docs-content">
      <div class="mobile-toolbar">
        <a-button class="mobile-toolbar__trigger" @click="sidebarOpen = true">
          <template #icon>
            <MenuUnfoldOutlined />
          </template>
          文档目录
        </a-button>
        <div v-if="activeNode" class="mobile-toolbar__meta">
          <span class="mobile-toolbar__name">{{ activeNode.title }}</span>
          <a-tag color="blue">{{ currentDocType }}</a-tag>
        </div>
      </div>

      <template v-if="activeNode">
        <header class="doc-header">
          <div class="doc-header__main">
            <p class="doc-breadcrumb">QMS-Docs / {{ currentSection }}</p>
            <h2 class="doc-title">{{ activeNode.title }}</h2>
            <div class="doc-meta">
              <a-tag color="processing">{{ currentDocType }}</a-tag>
              <span class="doc-meta__hint">支持移动端阅读、表格横滑和 Mermaid 图表展示</span>
            </div>
          </div>
          <div class="doc-actions">
            <a-button @click="downloadMd">
              <template #icon>
                <FileMarkdownOutlined />
              </template>
              下载 MD
            </a-button>
            <a-button @click="downloadPdf">
              <template #icon>
                <FilePdfOutlined />
              </template>
              导出 PDF
            </a-button>
          </div>
        </header>

        <section class="doc-reader">
          <div
            v-if="isMarkdown"
            ref="markdownBodyRef"
            class="markdown-body"
            v-html="renderedContent"
          ></div>
          <pre v-else class="text-body">{{ activeNode.content }}</pre>
        </section>
      </template>

      <div v-else class="empty-state">
        <a-empty description="请选择要阅读的项目文档">
          <a-button type="primary" @click="openPrimaryNavigation">打开目录</a-button>
        </a-empty>
      </div>
    </main>

    <a-drawer
      v-model:open="sidebarOpen"
      placement="left"
      width="84vw"
      class="docs-drawer"
      title="项目文档目录"
    >
      <div class="sidebar-search sidebar-search--drawer">
        <a-input
          v-model:value="searchQuery"
          allow-clear
          placeholder="Go to file"
        >
          <template #prefix>
            <SearchOutlined />
          </template>
        </a-input>
      </div>

      <div v-if="filteredTreeData.length > 0" class="sidebar-tree-actions sidebar-tree-actions--drawer">
        <a-button size="small" type="text" @click="expandAll">全部展开</a-button>
        <a-button size="small" type="text" @click="collapseAll">全部收起</a-button>
      </div>

      <div v-if="filteredTreeData.length > 0" class="sidebar-tree sidebar-tree--drawer">
        <a-tree
          :tree-data="filteredTreeData"
          :expanded-keys="expandedKeys"
          :auto-expand-parent="autoExpandParent"
          :selected-keys="selectedKeys"
          @expand="onExpand"
          @select="onSelect"
          blockNode
        />
      </div>
      <a-empty v-else :description="searchQuery ? '未找到匹配的文档' : '未找到可用文档'" />
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  FileMarkdownOutlined,
  FilePdfOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'
import { marked } from 'marked'
import mermaid from 'mermaid'

type GlobImport = (pattern: string, options: {
  query: string
  import: string
  eager: boolean
}) => Record<string, string>

const modules = (import.meta as ImportMeta & { glob: GlobImport }).glob('/QMS-Docs/**/*.{md,txt}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface TreeNode {
  title: string
  key: string
  isLeaf?: boolean
  content?: string
  children?: TreeNode[]
  selectable?: boolean
}

const treeData = ref<TreeNode[]>([])
const activeNode = ref<TreeNode | null>(null)
const selectedKeys = ref<string[]>([])
const expandedKeys = ref<string[]>([])
const autoExpandParent = ref(true)
const markdownBodyRef = ref<HTMLElement | null>(null)
const sidebarOpen = ref(false)
const sidebarExpanded = ref(true)
const isMobile = ref(false)
const searchQuery = ref('')

const leafCount = computed(() => countLeafNodes(treeData.value))
const filteredTreeData = computed(() => filterTree(treeData.value, searchQuery.value))
const visibleLeafCount = computed(() => countLeafNodes(filteredTreeData.value))
const allExpandableKeys = computed(() => collectExpandableKeys(filteredTreeData.value))
const isMarkdown = computed(() => activeNode.value?.title.toLowerCase().endsWith('.md') ?? false)
const currentDocType = computed(() => (isMarkdown.value ? 'Markdown' : 'Text'))
const currentSection = computed(() => activeNode.value?.key.split('/')[0] || '文档中心')

const renderedContent = computed(() => {
  if (!isMarkdown.value || !activeNode.value?.content) return ''
  return marked.parse(activeNode.value.content) as string
})

const buildTree = (records: Record<string, string>): TreeNode[] => {
  const root: TreeNode[] = []

  for (const [path, content] of Object.entries(records)) {
    const match = path.match(/\/QMS-Docs\/(.+)$/)
    if (!match) continue

    const parts = match[1].split('/')
    let currentLevel = root
    let currentKey = ''

    parts.forEach((part, index) => {
      currentKey += `${currentKey ? '/' : ''}${part}`
      const isLeaf = index === parts.length - 1

      let existingNode = currentLevel.find((node) => node.title === part)
      if (!existingNode) {
        existingNode = {
          title: part,
          key: currentKey,
          isLeaf,
          selectable: isLeaf,
          children: isLeaf ? undefined : [],
          content: isLeaf ? content : undefined,
        }
        currentLevel.push(existingNode)
      }

      if (!isLeaf && existingNode.children) {
        currentLevel = existingNode.children
      }
    })
  }

  return root
}

const countLeafNodes = (nodes: TreeNode[]): number => {
  return nodes.reduce((total, node) => {
    if (node.isLeaf) return total + 1
    return total + countLeafNodes(node.children ?? [])
  }, 0)
}

const cloneTreeNode = (node: TreeNode): TreeNode => ({
  ...node,
  children: node.children?.map(cloneTreeNode),
})

const collectExpandableKeys = (nodes: TreeNode[]): string[] => {
  return nodes.flatMap((node) => {
    if (!node.children?.length) return []
    return [node.key, ...collectExpandableKeys(node.children)]
  })
}

const filterTree = (nodes: TreeNode[], rawQuery: string): TreeNode[] => {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return nodes

  return nodes.reduce<TreeNode[]>((results, node) => {
    const titleMatched = node.title.toLowerCase().includes(query)

    if (titleMatched) {
      results.push(cloneTreeNode(node))
      return results
    }

    const filteredChildren = filterTree(node.children ?? [], query)
    if (filteredChildren.length > 0) {
      results.push({
        ...node,
        children: filteredChildren,
      })
    }

    return results
  }, [])
}

const findFirstLeaf = (nodes: TreeNode[]): TreeNode | null => {
  for (const node of nodes) {
    if (node.isLeaf) return node
    const childLeaf = findFirstLeaf(node.children ?? [])
    if (childLeaf) return childLeaf
  }
  return null
}

const updateViewport = () => {
  isMobile.value = window.innerWidth <= 960
  if (isMobile.value) {
    sidebarOpen.value = false
    sidebarExpanded.value = false
  }
}

const openPrimaryNavigation = () => {
  if (isMobile.value) {
    sidebarOpen.value = true
    return
  }

  sidebarExpanded.value = true
}

const toggleSidebarExpanded = () => {
  if (isMobile.value) {
    sidebarOpen.value = !sidebarOpen.value
    return
  }

  sidebarExpanded.value = !sidebarExpanded.value
}

const expandAll = () => {
  expandedKeys.value = [...allExpandableKeys.value]
  autoExpandParent.value = false
}

const collapseAll = () => {
  expandedKeys.value = []
  autoExpandParent.value = false
}

const onExpand = (keys: string[]) => {
  expandedKeys.value = keys
  autoExpandParent.value = false
}

const selectNode = (node: TreeNode) => {
  activeNode.value = node
  selectedKeys.value = [node.key]

  if (isMobile.value) {
    sidebarOpen.value = false
  }

  nextTick(() => {
    renderMermaidDiagrams()
  })
}

const onSelect = (_selectedKeys: string[], event: { node: { dataRef?: TreeNode } }) => {
  const node = event.node.dataRef
  if (node?.isLeaf) {
    selectNode(node)
  }
}

const renderMermaidDiagrams = async () => {
  if (!markdownBodyRef.value) return

  const mermaidBlocks = markdownBodyRef.value.querySelectorAll(
    'pre code.language-mermaid, code.language-mermaid'
  )

  for (const block of Array.from(mermaidBlocks)) {
    const code = block.textContent || ''
    const pre = block.closest('pre') || block

    try {
      const id = `mermaid-${Math.random().toString(36).slice(2)}`
      const { svg } = await mermaid.render(id, code)
      const wrapper = document.createElement('div')
      wrapper.className = 'mermaid-diagram'
      wrapper.innerHTML = svg
      pre.parentNode?.replaceChild(wrapper, pre)
    } catch (error) {
      console.error('Mermaid 图表渲染失败:', error)
      const errorDiv = document.createElement('div')
      errorDiv.className = 'mermaid-error'
      errorDiv.textContent = 'Mermaid 图表渲染失败，请检查语法后重试。'
      pre.parentNode?.insertBefore(errorDiv, pre)
    }
  }
}

const downloadMd = () => {
  if (!activeNode.value?.content) return
  const blob = new Blob([activeNode.value.content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${activeNode.value.title.replace(/\.[^.]+$/, '')}.md`
  anchor.click()
  URL.revokeObjectURL(url)
}

const downloadPdf = () => {
  if (!activeNode.value) return
  window.print()
}

watch(filteredTreeData, () => {
  expandedKeys.value = [...allExpandableKeys.value]
  autoExpandParent.value = true
}, { immediate: true })

onMounted(() => {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  })

  treeData.value = buildTree(modules as Record<string, string>)
  const firstLeaf = findFirstLeaf(treeData.value)
  if (firstLeaf) {
    selectNode(firstLeaf)
  }

  updateViewport()
  if (!isMobile.value) {
    sidebarExpanded.value = true
  }
  window.addEventListener('resize', updateViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
})
</script>

<style scoped>
.project-docs-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: calc(100vh - 104px);
  background:
    radial-gradient(circle at top left, rgba(22, 119, 255, 0.08), transparent 28%),
    linear-gradient(180deg, #f7faff 0%, #eef3f8 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.sidebar-shell {
  display: grid;
  grid-template-columns: 56px auto;
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.92);
}

.sidebar-rail {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-right: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(255, 255, 255, 0.92);
}

.sidebar-rail__button {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  color: #57606a;
  touch-action: manipulation;
}

.sidebar-rail__button:focus-visible,
.mobile-toolbar__trigger:focus-visible,
.sidebar-search :deep(.ant-input-affix-wrapper-focused) {
  outline: 2px solid #1677ff;
  outline-offset: 2px;
}

.docs-sidebar {
  width: 296px;
  height: calc(100vh - 104px);
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(18px);
}

.sidebar-header {
  padding: 20px 20px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.sidebar-eyebrow {
  margin: 0 0 6px;
  color: #1677ff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  line-height: 1.3;
  text-wrap: balance;
}

.sidebar-search {
  padding: 12px 20px 10px;
}

.sidebar-search :deep(.ant-input-affix-wrapper) {
  border-radius: 10px;
  border-color: #d0d7de;
  background: #f6f8fa;
}

.sidebar-search :deep(.ant-input) {
  background: transparent;
}

.sidebar-search :deep(.ant-input-prefix) {
  color: #57606a;
}

.sidebar-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 20px 8px;
}

.sidebar-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e8f3ff;
  color: #1677ff;
  font-size: 12px;
  font-weight: 600;
}

.sidebar-hint {
  color: #57606a;
  font-size: 12px;
}

.sidebar-tree-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px 10px;
}

.sidebar-tree-actions :deep(.ant-btn) {
  border-radius: 8px;
  color: #57606a;
}

.sidebar-tree {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 8px 12px 20px;
  scrollbar-gutter: stable;
}

.sidebar-empty {
  padding: 40px 24px;
  color: #64748b;
  text-align: center;
}

.docs-sidebar :deep(.ant-tree) {
  background: transparent;
}

.docs-sidebar :deep(.ant-tree-treenode) {
  align-items: flex-start;
}

.docs-sidebar :deep(.ant-tree-node-content-wrapper) {
  width: 100%;
  min-height: 34px;
  padding: 6px 10px;
  border-radius: 8px;
}

.docs-sidebar :deep(.ant-tree-node-content-wrapper:hover) {
  background: #f6f8fa;
}

.docs-sidebar :deep(.ant-tree-node-content-wrapper.ant-tree-node-selected) {
  background: #ddf4ff;
  color: #0969da;
}

.docs-content {
  min-width: 0;
  padding: 28px;
  overflow-y: auto;
}

.mobile-toolbar {
  display: none;
}

.doc-header {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  padding: 22px 24px;
  border: 1px solid rgba(208, 215, 222, 0.9);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
}

.doc-header__main {
  min-width: 0;
}

.doc-breadcrumb {
  margin: 0 0 10px;
  color: #57606a;
  font-size: 13px;
}

.doc-title {
  margin: 0;
  color: #1f2328;
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.2;
  word-break: break-word;
  text-wrap: balance;
}

.doc-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.doc-meta__hint {
  color: #57606a;
  font-size: 13px;
}

.doc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex-shrink: 0;
}

.doc-actions :deep(.ant-btn) {
  min-height: 38px;
  border-radius: 10px;
}

.doc-reader {
  max-width: 960px;
  margin: 0 auto;
  padding: 28px clamp(16px, 3vw, 40px);
  border: 1px solid rgba(208, 215, 222, 0.9);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 28px rgba(140, 149, 159, 0.12);
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 100%;
  padding: 48px 16px;
}

.text-body {
  margin: 0;
  padding: 20px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid #d0d7de;
  border-radius: 12px;
  background: #f6f8fa;
  color: #1f2328;
  font-size: 14px;
  line-height: 1.8;
  font-family: 'Cascadia Code', 'SFMono-Regular', Consolas, monospace;
}

.markdown-body {
  color: #1f2328;
  font-size: clamp(15px, 1vw + 12px, 17px);
  line-height: 1.85;
  word-break: break-word;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 32px 0 16px;
  color: #1f2328;
  font-weight: 700;
  line-height: 1.3;
  scroll-margin-top: 112px;
  text-wrap: balance;
}

.markdown-body :deep(h1) {
  padding-bottom: 0.4em;
  border-bottom: 1px solid #d8dee4;
  font-size: clamp(28px, 4vw, 40px);
}

.markdown-body :deep(h2) {
  padding-bottom: 0.35em;
  border-bottom: 1px solid #d8dee4;
  font-size: clamp(22px, 3vw, 30px);
}

.markdown-body :deep(h3) {
  font-size: clamp(18px, 2vw, 22px);
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(blockquote),
.markdown-body :deep(table),
.markdown-body :deep(pre) {
  margin: 0 0 18px;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.4em;
}

.markdown-body :deep(li) {
  margin-bottom: 8px;
}

.markdown-body :deep(a) {
  color: #0969da;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.markdown-body :deep(code) {
  padding: 0.18em 0.45em;
  border-radius: 6px;
  background: rgba(175, 184, 193, 0.2);
  font-size: 0.9em;
  font-family: 'Cascadia Code', 'SFMono-Regular', Consolas, monospace;
}

.markdown-body :deep(pre) {
  overflow: auto;
  padding: 18px;
  border: 1px solid #d0d7de;
  border-radius: 12px;
  background: #0d1117;
  color: #e6edf3;
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.markdown-body :deep(blockquote) {
  padding: 0 16px;
  border-left: 4px solid #d0d7de;
  color: #57606a;
}

.markdown-body :deep(table) {
  display: block;
  width: 100%;
  overflow-x: auto;
  border-spacing: 0;
  border-collapse: collapse;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  padding: 10px 12px;
  border: 1px solid #d0d7de;
  white-space: nowrap;
}

.markdown-body :deep(table tr:nth-child(2n)) {
  background: #f6f8fa;
}

.markdown-body :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 20px auto;
  border-radius: 12px;
}

.markdown-body :deep(.mermaid-diagram) {
  overflow-x: auto;
  margin: 20px 0;
  padding-bottom: 6px;
}

.markdown-body :deep(.mermaid-diagram svg) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
}

.markdown-body :deep(.mermaid-error) {
  margin-bottom: 16px;
  padding: 12px 16px;
  border: 1px solid #ff818266;
  border-radius: 12px;
  background: #ffebe9;
  color: #cf222e;
}

.docs-drawer :deep(.ant-drawer-body) {
  padding: 12px 8px 16px;
  overscroll-behavior: contain;
}

.sidebar-search--drawer {
  padding: 0 8px 12px;
}

.sidebar-tree-actions--drawer {
  padding: 0 4px 10px;
}

.sidebar-tree--drawer :deep(.ant-tree-node-content-wrapper) {
  min-height: 42px;
}

@media (min-width: 961px) {
  .project-docs-page {
    grid-template-columns: auto minmax(0, 1fr);
  }
}

@media (max-width: 960px) {
  .project-docs-page {
    display: block;
    min-height: calc(100vh - 88px);
    border-radius: 16px;
  }

  .sidebar-shell {
    display: none;
  }

  .docs-content {
    padding: 14px;
  }

  .mobile-toolbar {
    position: sticky;
    top: 0;
    z-index: 6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    padding: 12px 14px;
    border: 1px solid rgba(208, 215, 222, 0.9);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(14px);
  }

  .mobile-toolbar__trigger {
    min-height: 38px;
    border-radius: 10px;
    touch-action: manipulation;
  }

  .mobile-toolbar__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    margin-left: auto;
  }

  .mobile-toolbar__name {
    max-width: 160px;
    overflow: hidden;
    color: #334155;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .doc-header {
    position: static;
    margin-bottom: 14px;
    padding: 16px;
    border-radius: 18px;
  }

  .doc-actions {
    width: 100%;
  }

  .doc-actions :deep(.ant-btn) {
    flex: 1;
    justify-content: center;
  }

  .doc-reader {
    padding: 18px 16px;
    border-radius: 18px;
  }

  .markdown-body {
    font-size: 15px;
    line-height: 1.75;
  }

  .markdown-body :deep(h1),
  .markdown-body :deep(h2),
  .markdown-body :deep(h3),
  .markdown-body :deep(h4),
  .markdown-body :deep(h5),
  .markdown-body :deep(h6) {
    scroll-margin-top: 88px;
  }

  .markdown-body :deep(table th),
  .markdown-body :deep(table td) {
    min-width: 120px;
  }
}

@media print {
  .sidebar-shell,
  .mobile-toolbar,
  .doc-actions {
    display: none !important;
  }

  .project-docs-page {
    display: block;
    min-height: auto;
    background: #fff;
    box-shadow: none;
  }

  .docs-content,
  .doc-reader {
    padding: 0;
    overflow: visible;
    border: none;
    box-shadow: none;
  }

  .doc-header {
    position: static;
    padding: 0 0 16px;
    border: none;
    background: #fff;
  }

  .markdown-body :deep(.mermaid-diagram svg) {
    page-break-inside: avoid;
  }

  .markdown-body :deep(h1),
  .markdown-body :deep(h2),
  .markdown-body :deep(h3) {
    page-break-after: avoid;
  }
}
</style>
