<template>
  <div class="document-management">
    <aside class="document-management__sidebar">
      <a-card :bordered="false" class="tree-card">
        <template #title>
          <div class="panel-title">文档分类</div>
        </template>
        <p class="panel-tip">按业务场景和模块快速收敛范围，PLM 模块默认只读引用。</p>
        <a-tree
          :tree-data="categoryTree"
          :selected-keys="selectedKeys"
          default-expand-all
          @select="handleTreeSelect"
        >
          <template #title="{ title, primaryStorage }">
            <div class="tree-node">
              <span>{{ title }}</span>
              <a-tag v-if="primaryStorage" :color="getStorageSourceColor(primaryStorage)" size="small">
                {{ primaryStorage }}
              </a-tag>
            </div>
          </template>
        </a-tree>
      </a-card>
    </aside>

    <main class="document-management__main">
      <a-card :bordered="false" class="hero-card">
        <div class="hero-card__content">
          <div>
            <div class="hero-card__eyebrow">Controlled Documents</div>
            <h1 class="hero-card__title">受控文档管理</h1>
            <p class="hero-card__desc">
              统一管理 QMS 自建文档与 PLM 同步文档，字段命名和状态枚举已按《舜富PLM接口文档》4.5 节对齐。
            </p>
          </div>
          <a-space wrap>
            <a-button type="primary" @click="handleAdd">
              <template #icon><PlusOutlined /></template>
              新增文档
            </a-button>
            <a-button :disabled="selectedRowKeys.length !== 1 || !canEditSelected" @click="handleEditSelected">
              <template #icon><EditOutlined /></template>
              编辑
            </a-button>
            <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
              <template #icon><DeleteOutlined /></template>
              删除
            </a-button>
            <a-button @click="handleExport">
              <template #icon><ExportOutlined /></template>
              导出
            </a-button>
            <a-button @click="loadData">
              <template #icon><ReloadOutlined /></template>
              刷新
            </a-button>
          </a-space>
        </div>
      </a-card>

      <section class="summary-grid">
        <a-card v-for="card in summaryCards" :key="card.key" :bordered="false" class="summary-card">
          <div class="summary-card__label">{{ card.label }}</div>
          <div class="summary-card__value">{{ card.value }}</div>
          <div class="summary-card__hint">{{ card.hint }}</div>
        </a-card>
      </section>

      <a-card :bordered="false" class="search-card">
        <template #title>
          <div class="panel-title">筛选条件</div>
        </template>
        <a-form layout="vertical" :model="queryParam">
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12" :lg="8" :xl="4">
              <a-form-item label="文档编号">
                <a-input v-model:value="queryParam.documentId" allow-clear placeholder="支持模糊匹配" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :lg="8" :xl="4">
              <a-form-item label="关键字">
                <a-input v-model:value="queryParam.keyword" allow-clear placeholder="名称 / 关键词 / 产品编码" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :lg="8" :xl="4">
              <a-form-item label="文档状态">
                <a-select v-model:value="queryParam.documentStatus" allow-clear placeholder="全部状态">
                  <a-select-option v-for="option in DOC_STATUS_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :lg="8" :xl="4">
              <a-form-item label="文档类型">
                <a-select v-model:value="queryParam.documentType" allow-clear placeholder="全部类型">
                  <a-select-option v-for="option in DOC_TYPE_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :lg="8" :xl="4">
              <a-form-item label="主存来源">
                <a-select v-model:value="queryParam.storageSource" allow-clear placeholder="全部来源">
                  <a-select-option v-for="option in STORAGE_SOURCE_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.shortLabel }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :lg="8" :xl="4">
              <a-form-item label="密级">
                <a-select v-model:value="queryParam.securityLevel" allow-clear placeholder="全部密级">
                  <a-select-option v-for="option in DOC_SECURITY_LEVEL_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <div class="search-actions">
            <a-space wrap>
              <a-button type="primary" @click="handleSearch">查询</a-button>
              <a-button @click="handleReset">重置</a-button>
              <span class="search-actions__hint">
                当前范围：{{ selectedNode ? selectedNode.title : '全部分类' }}
              </span>
            </a-space>
          </div>
        </a-form>
      </a-card>

      <a-card :bordered="false" class="table-card">
        <template #title>
          <div class="panel-title">文档清单</div>
        </template>
        <a-table
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="pagination"
          :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
          :scroll="{ x: 1560 }"
          row-key="id"
          size="middle"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'documentName'">
              <a-button type="link" class="name-link" @click="handlePreview(record)">
                {{ record.documentName }}
              </a-button>
              <div class="cell-subtitle">{{ record.documentId }}</div>
            </template>

            <template v-else-if="column.key === 'category'">
              <div>{{ getBizSceneLabel(record.bizScene) }}</div>
              <div class="cell-subtitle">{{ getModuleLabel(record.docModule) }}</div>
            </template>

            <template v-else-if="column.key === 'documentType'">
              <a-tag>{{ getDocumentTypeLabel(record.documentType) }}</a-tag>
            </template>

            <template v-else-if="column.key === 'storageSource'">
              <a-tag :color="getStorageSourceColor(record.storageSource)">
                {{ record.storageSource }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'securityLevel'">
              <a-tag :color="getSecurityLevelColor(record.securityLevel)">
                {{ getSecurityLevelLabel(record.securityLevel) }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'documentStatus'">
              <a-tag :color="getRecordStatusColor(record)">
                {{ getRecordStatusText(record) }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'effectiveDate'">
              <div>{{ record.effectiveDate || '-' }}</div>
              <div v-if="record.expiryDate" class="cell-subtitle">失效：{{ record.expiryDate }}</div>
            </template>

            <template v-else-if="column.key === 'action'">
              <a-space size="small">
                <a-button type="link" @click="handlePreview(record)">预览</a-button>
                <a-divider type="vertical" />
                <a-button type="link" @click="handleDownload(record)">下载</a-button>
                <a-divider type="vertical" />
                <a-dropdown>
                  <a-button type="link">
                    更多
                    <DownOutlined />
                  </a-button>
                  <template #overlay>
                    <a-menu @click="handleMenuEvent(record, $event)">
                      <a-menu-item key="view">查看详情</a-menu-item>
                      <a-menu-item key="edit" :disabled="!canEdit(record)">编辑</a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="UNDER_REVISION" :disabled="!isQmsDocument(record) || record.documentStatus !== 'DRAFT'">
                        提交审批
                      </a-menu-item>
                      <a-menu-item key="RELEASED" :disabled="!isQmsDocument(record) || record.documentStatus !== 'UNDER_REVISION'">
                        审批通过
                      </a-menu-item>
                      <a-menu-item key="OBSOLETE" :disabled="!isQmsDocument(record) || record.documentStatus === 'OBSOLETE'">
                        作废
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="history">查看历史版本</a-menu-item>
                      <a-menu-item v-if="record.storageSource === 'PLM'" key="sync">同步版本</a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="delete" danger :disabled="!isQmsDocument(record) || record.documentStatus !== 'DRAFT'">
                        删除
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </main>

    <a-modal v-model:open="historyModalVisible" title="历史版本" width="860px" :footer="null">
      <a-alert type="info" show-icon class="history-alert">
        <template #message>
          文档编号：<strong>{{ currentDocForHistory?.documentId }}</strong>
          <span class="history-alert__split">|</span>
          文档名称：<strong>{{ currentDocForHistory?.documentName }}</strong>
        </template>
      </a-alert>
      <a-timeline mode="left">
        <a-timeline-item
          v-for="item in historyData"
          :key="item.documentVersion"
          :color="getStatusTone(item.documentStatus)"
        >
          <template #dot>
            <div class="history-dot">{{ item.documentVersion }}</div>
          </template>
          <a-card size="small" class="history-item">
            <a-row :gutter="16">
              <a-col :span="6">
                <div class="history-label">状态</div>
                <a-tag :color="getStatusTone(item.documentStatus)">
                  {{ getStatusLabel(item.documentStatus) }}
                </a-tag>
              </a-col>
              <a-col :span="8">
                <div class="history-label">操作时间</div>
                <div>{{ item.operateTime }}</div>
              </a-col>
              <a-col :span="4">
                <div class="history-label">操作人</div>
                <div>{{ item.operator }}</div>
              </a-col>
              <a-col :span="6">
                <div class="history-label">备注</div>
                <div>{{ item.remark || '-' }}</div>
              </a-col>
            </a-row>
            <div class="history-actions">
              <a-space>
                <a-button type="link" @click="handleViewHistoryVersion(item)">查看详情</a-button>
                <a-button
                  v-if="item.documentStatus === 'OBSOLETE'"
                  type="link"
                  @click="handleRestoreVersion(item)"
                >
                  恢复此版本
                </a-button>
              </a-space>
            </div>
          </a-card>
        </a-timeline-item>
      </a-timeline>
    </a-modal>

    <a-drawer
      v-model:open="previewDrawerVisible"
      :title="previewDoc?.documentName"
      width="760"
      placement="right"
      destroy-on-close
    >
      <template #extra>
        <a-space>
          <a-button v-if="previewDoc?.previewUrl" size="small" @click="openPreviewUrl(previewDoc.previewUrl)">在线预览</a-button>
          <a-button size="small" @click="handleDownload(previewDoc!)">下载文件</a-button>
          <a-button type="primary" size="small" @click="handleView(previewDoc!)">查看详情</a-button>
        </a-space>
      </template>

      <div v-if="previewDoc" class="preview-panel">
        <div class="preview-summary">
          <div class="preview-summary__title">{{ previewDoc.documentId }}</div>
          <div class="preview-summary__meta">
            <a-tag :color="getStorageSourceColor(previewDoc.storageSource)">{{ previewDoc.storageSource }}</a-tag>
            <a-tag :color="getRecordStatusColor(previewDoc)">{{ getRecordStatusText(previewDoc) }}</a-tag>
            <a-tag v-if="previewDoc.securityLevel" :color="getSecurityLevelColor(previewDoc.securityLevel)">
              {{ getSecurityLevelLabel(previewDoc.securityLevel) }}
            </a-tag>
          </div>
          <p class="preview-summary__desc">{{ previewDoc.description || '暂无摘要描述。' }}</p>
        </div>

        <a-descriptions bordered :column="2" size="small" class="preview-descriptions">
          <a-descriptions-item label="文档类型">{{ getDocumentTypeLabel(previewDoc.documentType) }}</a-descriptions-item>
          <a-descriptions-item label="文档分类">
            {{ getDocumentCategoryLabel(previewDoc.documentCategory) }}
          </a-descriptions-item>
          <a-descriptions-item label="版本">{{ previewDoc.documentVersion }}</a-descriptions-item>
          <a-descriptions-item label="文件信息">
            {{ previewDoc.fileFormat || '-' }} / {{ formatFileSize(previewDoc.fileSize) }}
          </a-descriptions-item>
          <a-descriptions-item label="业务场景">{{ getBizSceneLabel(previewDoc.bizScene) }}</a-descriptions-item>
          <a-descriptions-item label="文档模块">{{ getModuleLabel(previewDoc.docModule) }}</a-descriptions-item>
          <a-descriptions-item label="生效日期">{{ previewDoc.effectiveDate || '-' }}</a-descriptions-item>
          <a-descriptions-item label="失效日期">
            <span>{{ previewDoc.expiryDate || '-' }}</span>
            <a-tag v-if="isExpiringSoon(previewDoc.expiryDate)" color="orange" class="inline-tag">30 天内到期</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="关联产品">{{ previewDoc.relatedProductCode || '-' }}</a-descriptions-item>
          <a-descriptions-item label="关联物料">{{ previewDoc.relatedMaterialCode || '-' }}</a-descriptions-item>
          <a-descriptions-item label="审批人">{{ previewDoc.approver || '-' }}</a-descriptions-item>
          <a-descriptions-item label="最近更新时间">{{ previewDoc.updateTime }}</a-descriptions-item>
          <a-descriptions-item label="PLM 更新时间" :span="2">
            {{ previewDoc.plmUpdateTime || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="preview-frame-shell">
          <iframe
            v-if="previewDoc.previewUrl"
            :src="previewDoc.previewUrl"
            title="文档预览"
            class="preview-frame"
          />
          <div v-else class="preview-empty">
            <FileOutlined class="preview-empty__icon" />
            <div class="preview-empty__title">当前文档暂不支持在线预览</div>
            <div class="preview-empty__desc">可以继续查看详情字段，或直接下载原始文件。</div>
          </div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import type { TablePaginationConfig } from 'ant-design-vue'
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExportOutlined,
  FileOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { DOC_CATEGORY_TREE, getDocumentList, getVersionHistory } from '@/api/document'
import {
  BIZ_SCENE_LABEL_MAP,
  DOC_CATEGORY_LABEL_MAP,
  DOC_SECURITY_LEVEL_LABEL_MAP,
  DOC_SECURITY_LEVEL_OPTIONS,
  DOC_STATUS_LABEL_MAP,
  DOC_STATUS_OPTIONS,
  DOC_TYPE_LABEL_MAP,
  DOC_TYPE_OPTIONS,
  STORAGE_SOURCE_COLOR_MAP,
  STORAGE_SOURCE_OPTIONS,
  formatFileSize,
  getStatusTone,
  isExpiringSoon,
  MODULE_LABEL_MAP
} from '@/views/documents/documentMeta'
import type {
  ControlledDocument,
  ControlledDocStatus,
  DocCategoryNode,
  DocVersionRecord,
  DocStorageSource,
  DocumentSecurityLevel,
  DocumentType
} from '@/types'

const route = useRoute()
const router = useRouter()

const categoryTree = DOC_CATEGORY_TREE
const loading = ref(false)
const selectedKeys = ref<string[]>([])
const selectedNode = ref<DocCategoryNode | null>(null)
const selectedRowKeys = ref<string[]>([])
const filteredRows = ref<ControlledDocument[]>([])
const tableData = ref<ControlledDocument[]>([])
const previewDrawerVisible = ref(false)
const previewDoc = ref<ControlledDocument | null>(null)
const historyModalVisible = ref(false)
const historyData = ref<DocVersionRecord[]>([])
const currentDocForHistory = ref<ControlledDocument | null>(null)

const queryParam = reactive({
  documentId: '',
  keyword: '',
  documentStatus: undefined as ControlledDocStatus | undefined,
  documentType: undefined as DocumentType | undefined,
  storageSource: undefined as DocStorageSource | undefined,
  securityLevel: undefined as DocumentSecurityLevel | undefined
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const columns = computed(() => [
  { title: '文档名称', dataIndex: 'documentName', key: 'documentName', width: 240, fixed: 'left' as const },
  { title: '分类', key: 'category', width: 190 },
  { title: '文档类型', dataIndex: 'documentType', key: 'documentType', width: 120 },
  { title: '版本', dataIndex: 'documentVersion', key: 'documentVersion', width: 90 },
  { title: '主存', dataIndex: 'storageSource', key: 'storageSource', width: 90 },
  { title: '密级', dataIndex: 'securityLevel', key: 'securityLevel', width: 100 },
  { title: '生效 / 失效', dataIndex: 'effectiveDate', key: 'effectiveDate', width: 160 },
  { title: '状态', dataIndex: 'documentStatus', key: 'documentStatus', width: 110 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 170 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' as const }
])

const summaryCards = computed(() => {
  const records = filteredRows.value
  const releasedCount = records.filter(item => item.documentStatus === 'RELEASED').length
  const plmCount = records.filter(item => item.storageSource === 'PLM').length
  const expiringCount = records.filter(item => isExpiringSoon(item.expiryDate)).length

  return [
    { key: 'total', label: '当前结果', value: records.length, hint: '筛选后文档总数' },
    { key: 'released', label: '已发布', value: releasedCount, hint: '可直接查阅与分发' },
    { key: 'plm', label: 'PLM 文档', value: plmCount, hint: '主数据来自 PLM，只读同步' },
    { key: 'expiring', label: '即将到期', value: expiringCount, hint: '未来 30 天内需要复审' }
  ]
})

const canEditSelected = computed(() => {
  if (selectedRowKeys.value.length !== 1) return false
  const target = filteredRows.value.find(item => item.id === selectedRowKeys.value[0])
  return target ? canEdit(target) : false
})

function isQmsDocument(record: ControlledDocument) {
  return record.storageSource === 'QMS'
}

function canEdit(record: ControlledDocument) {
  return isQmsDocument(record) && record.documentStatus === 'DRAFT'
}

function getRecordStatusColor(record: ControlledDocument) {
  return record.storageSource === 'PLM' ? 'success' : getStatusTone(record.documentStatus)
}

function getStatusLabel(status: ControlledDocStatus) {
  return DOC_STATUS_LABEL_MAP[status]
}

function getBizSceneLabel(scene: ControlledDocument['bizScene']) {
  return BIZ_SCENE_LABEL_MAP[scene]
}

function getModuleLabel(module: ControlledDocument['docModule']) {
  return MODULE_LABEL_MAP[module]
}

function getDocumentTypeLabel(type: ControlledDocument['documentType']) {
  return DOC_TYPE_LABEL_MAP[type]
}

function getDocumentCategoryLabel(category?: ControlledDocument['documentCategory']) {
  return category ? DOC_CATEGORY_LABEL_MAP[category] : '-'
}

function getSecurityLevelLabel(level?: ControlledDocument['securityLevel']) {
  return level ? DOC_SECURITY_LEVEL_LABEL_MAP[level] : '-'
}

function getSecurityLevelColor(level?: ControlledDocument['securityLevel']) {
  if (level === 'SECRET') return 'red'
  if (level === 'CONFIDENTIAL') return 'orange'
  return 'default'
}

function getStorageSourceColor(source: DocStorageSource) {
  return STORAGE_SOURCE_COLOR_MAP[source]
}

function getRecordStatusText(record: ControlledDocument) {
  return record.storageSource === 'PLM' ? '已发布' : getStatusLabel(record.documentStatus)
}

function findNode(tree: DocCategoryNode[], key: string): DocCategoryNode | null {
  for (const node of tree) {
    if (node.key === key) return node
    if (node.children?.length) {
      const match = findNode(node.children, key)
      if (match) return match
    }
  }
  return null
}

function syncRouteQuery() {
  const query: Record<string, string> = {}

  if (selectedKeys.value[0]) query.category = selectedKeys.value[0]
  if (queryParam.documentId) query.documentId = queryParam.documentId
  if (queryParam.keyword) query.keyword = queryParam.keyword
  if (queryParam.documentStatus) query.documentStatus = queryParam.documentStatus
  if (queryParam.documentType) query.documentType = queryParam.documentType
  if (queryParam.storageSource) query.storageSource = queryParam.storageSource
  if (queryParam.securityLevel) query.securityLevel = queryParam.securityLevel
  if (pagination.current > 1) query.page = String(pagination.current)
  if (pagination.pageSize !== 10) query.pageSize = String(pagination.pageSize)

  router.replace({ query })
}

function loadData() {
  loading.value = true

  const node = selectedNode.value
  const result = getDocumentList({
    bizScene: node?.bizScene,
    docModule: node?.isLeaf ? node.docModule : undefined,
    documentId: queryParam.documentId || undefined,
    keyword: queryParam.keyword || undefined,
    documentStatus: queryParam.documentStatus,
    documentType: queryParam.documentType,
    storageSource: queryParam.storageSource,
    securityLevel: queryParam.securityLevel
  })

  filteredRows.value = result
  pagination.total = result.length

  const maxPage = Math.max(1, Math.ceil(result.length / pagination.pageSize))
  if (pagination.current > maxPage) {
    pagination.current = maxPage
  }

  const start = (pagination.current - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  tableData.value = result.slice(start, end)
  selectedRowKeys.value = selectedRowKeys.value.filter(key => result.some(item => item.id === key))

  syncRouteQuery()
  loading.value = false
}

function applyRouteQuery() {
  const { query } = route
  queryParam.documentId = String(query.documentId ?? '')
  queryParam.keyword = String(query.keyword ?? '')
  queryParam.documentStatus = query.documentStatus as ControlledDocStatus | undefined
  queryParam.documentType = query.documentType as DocumentType | undefined
  queryParam.storageSource = query.storageSource as DocStorageSource | undefined
  queryParam.securityLevel = query.securityLevel as DocumentSecurityLevel | undefined

  pagination.current = Number(query.page ?? 1)
  pagination.pageSize = Number(query.pageSize ?? 10)

  const categoryKey = query.category ? String(query.category) : ''
  selectedKeys.value = categoryKey ? [categoryKey] : []
  selectedNode.value = categoryKey ? findNode(categoryTree, categoryKey) : null
}

function handleTreeSelect(keys: string[]) {
  selectedKeys.value = keys
  selectedNode.value = keys[0] ? findNode(categoryTree, keys[0]) : null
  pagination.current = 1
  loadData()
}

function handleSearch() {
  pagination.current = 1
  loadData()
}

function handleReset() {
  queryParam.documentId = ''
  queryParam.keyword = ''
  queryParam.documentStatus = undefined
  queryParam.documentType = undefined
  queryParam.storageSource = undefined
  queryParam.securityLevel = undefined
  pagination.current = 1
  loadData()
}

function handleTableChange(page: TablePaginationConfig) {
  pagination.current = page.current ?? 1
  pagination.pageSize = page.pageSize ?? 10
  loadData()
}

function onSelectChange(keys: string[]) {
  selectedRowKeys.value = keys
}

function handleAdd() {
  router.push('/quality-system/document-management/create')
}

function handleView(record: ControlledDocument) {
  router.push(`/quality-system/document-management/view/${record.id}`)
}

function handlePreview(record: ControlledDocument) {
  previewDoc.value = record
  previewDrawerVisible.value = true
}

function openPreviewUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function handleDownload(record: ControlledDocument) {
  if (record.downloadUrl) {
    window.open(record.downloadUrl, '_blank', 'noopener,noreferrer')
  }
  message.success(`已发起下载：${record.documentName}`)
}

function handleEditRow(record: ControlledDocument) {
  if (!canEdit(record)) {
    message.warning('仅允许编辑 QMS 草稿状态的文档。')
    return
  }
  router.push(`/quality-system/document-management/edit/${record.id}`)
}

function handleEditSelected() {
  const target = filteredRows.value.find(item => item.id === selectedRowKeys.value[0])
  if (target) handleEditRow(target)
}

function handleBatchDelete() {
  const deletable = filteredRows.value.filter(
    item => selectedRowKeys.value.includes(item.id) && isQmsDocument(item) && item.documentStatus === 'DRAFT'
  )

  if (deletable.length === 0) {
    message.warning('至少选择一条可删除的 QMS 草稿文档。')
    return
  }

  Modal.confirm({
    title: '确认删除',
    content: `确定删除已选中的 ${deletable.length} 条草稿文档吗？`,
    okType: 'danger',
    onOk() {
      selectedRowKeys.value = []
      message.success('演示环境已模拟删除操作。')
      loadData()
    }
  })
}

function handleMenuEvent(record: ControlledDocument, event: { key: string | number }) {
  handleMenuClick(record, String(event.key))
}

function handleMenuClick(record: ControlledDocument, key: string) {
  if (key === 'view') {
    handleView(record)
    return
  }

  if (key === 'edit') {
    handleEditRow(record)
    return
  }

  if (key === 'history') {
    currentDocForHistory.value = record
    historyData.value = getVersionHistory(record.id)
    historyModalVisible.value = true
    return
  }

  if (key === 'sync') {
    message.success(`已发起 ${record.documentId} 的 PLM 版本同步。`)
    return
  }

  if (key === 'delete') {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除文档「${record.documentName}」吗？`,
      okType: 'danger',
      onOk() {
        message.success('演示环境已模拟删除操作。')
        loadData()
      }
    })
    return
  }

  const nextStatus = key as ControlledDocStatus
  Modal.confirm({
    title: '确认状态变更',
    content: `确定将文档「${record.documentName}」变更为「${getStatusLabel(nextStatus)}」吗？`,
    onOk() {
      record.documentStatus = nextStatus
      message.success('状态已更新。')
    }
  })
}

function handleViewHistoryVersion(item: DocVersionRecord) {
  if (!currentDocForHistory.value) return
  router.push(`/quality-system/document-management/view/${currentDocForHistory.value.id}?version=${item.documentVersion}`)
}

function handleRestoreVersion(item: DocVersionRecord) {
  Modal.confirm({
    title: '恢复历史版本',
    content: `确定基于 ${item.documentVersion} 创建新的草稿版本吗？`,
    onOk() {
      message.success(`已基于 ${item.documentVersion} 创建新草稿。`)
      historyModalVisible.value = false
    }
  })
}

function handleExport() {
  message.success('已创建导出任务，稍后可在消息中心查看。')
}

onMounted(() => {
  applyRouteQuery()
  loadData()
})
</script>

<style scoped>
.document-management {
  display: flex;
  gap: 16px;
  min-height: 100%;
  padding: 16px;
  background:
    radial-gradient(circle at top left, rgba(24, 144, 255, 0.08), transparent 28%),
    linear-gradient(180deg, #f5f7fb 0%, #eef2f6 100%);
}

.document-management__sidebar {
  width: 280px;
  min-width: 280px;
}

.document-management__main {
  flex: 1;
  min-width: 0;
}

.tree-card,
.hero-card,
.search-card,
.table-card,
.summary-card {
  border-radius: 18px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
}

.panel-tip {
  margin: 0 0 12px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.hero-card {
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f5faff 100%);
}

.hero-card__content {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.hero-card__eyebrow {
  margin-bottom: 6px;
  color: #1677ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-card__title {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
  line-height: 1.2;
}

.hero-card__desc {
  max-width: 780px;
  margin: 10px 0 0;
  color: #475569;
  line-height: 1.7;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card__label {
  color: #64748b;
  font-size: 13px;
}

.summary-card__value {
  margin-top: 8px;
  color: #0f172a;
  font-size: 28px;
  font-weight: 700;
}

.summary-card__hint {
  margin-top: 8px;
  color: #94a3b8;
  font-size: 12px;
}

.search-card,
.table-card {
  margin-bottom: 16px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
}

.search-actions__hint {
  color: #64748b;
}

.name-link {
  padding-inline: 0;
}

.cell-subtitle {
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.6;
}

.history-alert {
  margin-bottom: 16px;
}

.history-alert__split {
  margin: 0 12px;
  color: #94a3b8;
}

.history-dot {
  min-width: 68px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #1677ff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.history-item {
  margin-bottom: 10px;
  background: #f8fafc;
  border-radius: 14px;
}

.history-label {
  margin-bottom: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.history-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-summary {
  padding: 16px;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.preview-summary__title {
  color: #0f172a;
  font-size: 20px;
  font-weight: 600;
}

.preview-summary__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.preview-summary__desc {
  margin: 12px 0 0;
  color: #475569;
  line-height: 1.7;
}

.preview-descriptions {
  border-radius: 16px;
  overflow: hidden;
}

.inline-tag {
  margin-left: 8px;
}

.preview-frame-shell {
  overflow: hidden;
  border: 1px solid #dbe2ea;
  border-radius: 18px;
  background: #fff;
}

.preview-frame {
  width: 100%;
  height: 460px;
  border: 0;
  background: #fff;
}

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 32px 16px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.8), rgba(255, 255, 255, 0.98)),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 12px,
      rgba(148, 163, 184, 0.08) 12px,
      rgba(148, 163, 184, 0.08) 24px
    );
}

.preview-empty__icon {
  font-size: 42px;
  color: #94a3b8;
}

.preview-empty__title {
  margin-top: 12px;
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
}

.preview-empty__desc {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .document-management {
    flex-direction: column;
  }

  .document-management__sidebar {
    width: 100%;
    min-width: 0;
  }

  .hero-card__content {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .document-management {
    padding: 12px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
