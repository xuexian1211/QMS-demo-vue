<template>
  <div class="page-container">
    <div class="toolbar">
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <template #icon>
            <PlusOutlined />
          </template>新增
        </a-button>
        <a-button :disabled="selectedRowKeys.length !== 1" @click="handleEdit">
          <template #icon>
            <EditOutlined />
          </template>编辑
        </a-button>
        <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
          <template #icon>
            <DeleteOutlined />
          </template>删除
        </a-button>
        <a-button @click="handleExport">
          <template #icon>
            <ExportOutlined />
          </template>导出
        </a-button>
        <a-button @click="loadData">
          <template #icon>
            <ReloadOutlined />
          </template>刷新
        </a-button>
      </a-space>
    </div>

    <a-card class="search-card" :bordered="false">
      <a-form layout="inline" :model="queryParam">
        <a-form-item label="方案编码">
          <a-input v-model:value="queryParam.planCode" placeholder="请输入" allow-clear style="width: 160px" />
        </a-form-item>
        <a-form-item label="方案名称">
          <a-input v-model:value="queryParam.planName" placeholder="请输入" allow-clear style="width: 200px" />
        </a-form-item>
        <a-form-item label="版本">
          <a-input v-model:value="queryParam.version" placeholder="如：V1.0" allow-clear style="width: 100px" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="queryParam.status" style="width: 120px" allow-clear placeholder="请选择">
            <a-select-option value="DRAFT">草稿</a-select-option>
            <a-select-option value="IN_APPROVAL">审批中</a-select-option>
            <a-select-option value="APPROVED">已批准</a-select-option>
            <a-select-option value="OBSOLETE">已作废</a-select-option>
          </a-select>
        </a-form-item>
        <!-- ✨ 归属组织多选筛选 -->
        <a-form-item label="归属组织">
          <a-select v-model:value="queryParam.orgIds" mode="multiple" style="min-width: 200px; max-width: 300px"
            allow-clear placeholder="不限（全部）" :options="orgOptions" :max-tag-count="2" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <div class="table-container">
      <a-table :columns="columns" :data-source="tableData" :loading="loading" row-key="id" size="middle"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }" :pagination="pagination"
        @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <!-- ✨ 状态列 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <!-- ✨ 归属组织列 -->
          <template v-if="column.key === 'orgId'">
            <a-tag v-if="record.orgId === null" color="gold">集团</a-tag>
            <a-tag v-else color="cyan">{{ getOrgName(record.orgId) }}</a-tag>
          </template>
          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
              <a-divider type="vertical" />
              <a-button type="link" size="small" @click="handleEdit(record)"
                :disabled="record.status !== 'DRAFT' || record.orgId === null">编辑</a-button>
              <a-divider type="vertical" />
              <a-dropdown>
                <a-button type="link" size="small">
                  更多
                  <DownOutlined />
                </a-button>
                <template #overlay>
                  <a-menu @click="(e: any) => handleMenuClick(record, e.key)">
                    <a-menu-item key="submit" :disabled="record.status !== 'DRAFT'">提交审批</a-menu-item>
                    <a-menu-item key="approve" :disabled="record.status !== 'IN_APPROVAL'">审批通过</a-menu-item>
                    <a-menu-item key="obsolete" :disabled="record.status === 'OBSOLETE'">作废</a-menu-item>
                    <a-menu-divider />
                    <!-- ✨ 复制方案 -->
                    <a-menu-item key="copy">
                      <CopyOutlined /> 复制方案
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="delete" danger
                      :disabled="record.status !== 'DRAFT' || record.orgId === null">删除</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- ✨ 复制方案弹窗 -->
    <a-modal v-model:open="copyModal.visible" title="复制方案" ok-text="确认复制" cancel-text="取消" @ok="confirmCopy">
      <a-alert type="info" show-icon style="margin-bottom:16px">
        <template #message>
          复制将创建一个独立的草稿方案，包含原方案的所有检验项目明细，可在此基础上修改。
        </template>
      </a-alert>
      <a-form :model="copyForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="源方案">
          <span class="copy-source-label">{{ copyModal.source?.planCode }} - {{ copyModal.source?.planName }}</span>
        </a-form-item>
        <a-form-item label="目标编码" required>
          <a-input v-model:value="copyForm.planCode" placeholder="新方案编码，需唯一" />
        </a-form-item>
        <a-form-item label="目标名称" required>
          <a-input v-model:value="copyForm.planName" placeholder="新方案名称" />
        </a-form-item>
        <!-- ✨ 复制时可指定归属组织 -->
        <a-form-item label="归属组织" required>
          <a-select v-model:value="copyForm.orgId" placeholder="选择新方案所属组织" :options="orgOptionsWithGroup" />
        </a-form-item>
        <a-form-item label="新版本">
          <a-input v-model:value="copyForm.version" placeholder="如: V1.0" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { message, Modal } from 'ant-design-vue'
  import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    ExportOutlined, ReloadOutlined, DownOutlined, CopyOutlined
  } from '@ant-design/icons-vue'

  const router = useRouter()

  // --- 组织选项 (Mock) ---
  // NOTE: 实际应从全局 store 或 API 加载
  const ORG_MAP: Record<string, string> = {
    'ORG001': '合肥工厂',
    'ORG002': '芜湖工厂',
    'ORG003': '宁波工厂',
  }

  const orgOptions = [
    { value: 'GROUP', label: '集团（通用）' },
    { value: 'ORG001', label: '合肥工厂' },
    { value: 'ORG002', label: '芜湖工厂' },
    { value: 'ORG003', label: '宁波工厂' },
  ]

  /** 用于复制弹窗，含集团选项 */
  const orgOptionsWithGroup = orgOptions

  const getOrgName = (orgId: string | null) => {
    if (orgId === null) return '集团'
    return ORG_MAP[orgId] ?? orgId
  }

  // --- 状态定义 ---
  const loading = ref(false)
  const tableData = ref < any[] > ([])
  const selectedRowKeys = ref < string[] > ([])

  const queryParam = reactive({
    planCode: '',
    planName: '',
    version: '',
    status: undefined as string | undefined,
    /** ✨ 归属组织多选，空数组代表全部 */
    orgIds: [] as string[]
  })

  const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true
  })

  // ✨ 新增"归属"列
  const columns = [
    { title: '方案编码', dataIndex: 'planCode', key: 'planCode', width: 180 },
    { title: '方案名称', dataIndex: 'planName', key: 'planName', width: 220 },
    { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
    { title: '归属', key: 'orgId', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
    { title: '检验类型', dataIndex: 'inspType', key: 'inspType', width: 100 },
    { title: '关联模板', dataIndex: 'templateName', key: 'templateName', width: 160 },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 160 },
    { title: '操作', key: 'action', width: 200, fixed: 'right' }
  ]

  // 状态显示
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      DRAFT: 'default',
      IN_APPROVAL: 'processing',
      APPROVED: 'success',
      OBSOLETE: 'error'
    }
    return colorMap[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      DRAFT: '草稿',
      IN_APPROVAL: '审批中',
      APPROVED: '已批准',
      OBSOLETE: '已作废'
    }
    return textMap[status] || status
  }

  // --- Mock 数据源（含 orgId） ---
  const mockAllData = [
    { id: '601', planCode: 'IP-HFC-CASTING', planName: '合肥工厂-压铸件通用方案', version: 'V1.0', orgId: 'ORG001', status: 'APPROVED', inspType: 'IPQC', templateName: 'IPQC过程检验模板', updateTime: '2026-01-10 10:00' },
    { id: '602', planCode: 'IQC-A-L1', planName: '来料抽样加严L1', version: 'V1.2', orgId: null, status: 'DRAFT', inspType: 'IQC', templateName: 'IQC原材料检验模板', updateTime: '2026-01-12 14:30' },
    { id: '603', planCode: 'FQC-MOTOR-001', planName: '电机成品检验方案', version: 'V2.0', orgId: 'ORG002', status: 'IN_APPROVAL', inspType: 'FQC', templateName: 'FQC成品检验模板', updateTime: '2026-01-11 09:15' },
    { id: '604', planCode: 'OQC-EXPORT-001', planName: '出口产品检验方案', version: 'V1.0', orgId: null, status: 'OBSOLETE', inspType: 'OQC', templateName: 'OQC出货检验模板', updateTime: '2025-12-20 16:00' },
    { id: '605', planCode: 'IQC-NB-COMMON', planName: '宁波工厂-来料通用方案', version: 'V1.0', orgId: 'ORG003', status: 'APPROVED', inspType: 'IQC', templateName: 'IQC原材料检验模板', updateTime: '2026-01-08 09:00' },
  ]

  // --- 数据加载 ---
  const loadData = () => {
    loading.value = true
    setTimeout(() => {
      let data = [...mockAllData]

      // 文本筛选
      if (queryParam.planCode) data = data.filter(i => i.planCode.includes(queryParam.planCode))
      if (queryParam.planName) data = data.filter(i => i.planName.includes(queryParam.planName))
      if (queryParam.version) data = data.filter(i => i.version.includes(queryParam.version))
      if (queryParam.status) data = data.filter(i => i.status === queryParam.status)

      // ✨ 多组织筛选：'GROUP' 对应 orgId===null，其他对应 orgId 值
      if (queryParam.orgIds.length > 0) {
        data = data.filter(i => {
          if (queryParam.orgIds.includes('GROUP') && i.orgId === null) return true
          if (i.orgId !== null && queryParam.orgIds.includes(i.orgId)) return true
          return false
        })
      }

      tableData.value = data
      pagination.total = data.length
      loading.value = false
    }, 300)
  }

  const handleSearch = () => {
    pagination.current = 1
    loadData()
  }

  const handleReset = () => {
    queryParam.planCode = ''
    queryParam.planName = ''
    queryParam.version = ''
    queryParam.status = undefined
    queryParam.orgIds = []
    handleSearch()
  }

  const handleTableChange = (pag: any) => {
    pagination.current = pag.current
    pagination.pageSize = pag.pageSize
    loadData()
  }

  const onSelectChange = (keys: string[]) => {
    selectedRowKeys.value = keys
  }

  // --- 操作 ---
  const handleAdd = () => {
    router.push('/inspection-model/insp-schemes/create')
  }

  const handleView = (record: any) => {
    router.push(`/inspection-model/insp-schemes/view/${record.id}`)
  }

  const handleEdit = (record?: any) => {
    const item = record?.id ? record : tableData.value.find(i => i.id === selectedRowKeys.value[0])
    if (!item) return
    if (item.status !== 'DRAFT') {
      message.warning('只有草稿状态的方案可以编辑')
      return
    }
    if (item.orgId === null) {
      message.warning('集团级方案不可直接编辑，请复制为本地方案后修改')
      return
    }
    router.push(`/inspection-model/insp-schemes/edit/${item.id}`)
  }

  const handleBatchDelete = () => {
    const draftItems = tableData.value.filter(i => selectedRowKeys.value.includes(i.id) && i.status === 'DRAFT' && i.orgId !== null)
    if (draftItems.length === 0) {
      message.warning('只有草稿状态的本地方案可以删除')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除选中的 ${draftItems.length} 条草稿方案吗？`,
      okType: 'danger',
      onOk() {
        tableData.value = tableData.value.filter(i => !draftItems.map(d => d.id).includes(i.id))
        selectedRowKeys.value = []
        message.success('删除成功')
      }
    })
  }

  // ─── ✨ 复制方案弹窗 ────────────────────────────────────────────
  const copyModal = reactive < { visible: boolean; source: any | null } > ({
    visible: false,
    source: null
  })
  const copyForm = reactive({
    planCode: '',
    planName: '',
    orgId: undefined as string | undefined,
    version: 'V1.0'
  })

  function openCopyModal(record: any) {
    copyModal.source = record
    copyForm.planCode = record.planCode + '-COPY'
    copyForm.planName = record.planName + '（副本）'
    copyForm.orgId = record.orgId ?? 'ORG001'
    copyForm.version = 'V1.0'
    copyModal.visible = true
  }

  function confirmCopy() {
    if (!copyForm.planCode.trim() || !copyForm.planName.trim() || !copyForm.orgId) {
      message.error('请填写完整的目标编码、名称和归属组织')
      return
    }
    // Mock 克隆：生成新记录并插入到列表
    const newRecord = {
      ...copyModal.source,
      id: `copy-${Date.now()}`,
      planCode: copyForm.planCode,
      planName: copyForm.planName,
      orgId: copyForm.orgId === 'GROUP' ? null : copyForm.orgId,
      version: copyForm.version,
      status: 'DRAFT',
      updateTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16)
    }
    mockAllData.unshift(newRecord)
    loadData()
    copyModal.visible = false
    message.success(`方案已复制为「${copyForm.planName}」（草稿），可到列表中继续编辑`)
  }

  const handleMenuClick = (record: any, key: string) => {
    if (key === 'copy') {
      openCopyModal(record)
      return
    }

    if (key === 'delete') {
      if (record.orgId === null) {
        message.warning('集团级方案不允许删除')
        return
      }
      Modal.confirm({
        title: '确认删除',
        content: `确定删除方案 ${record.planName} 吗？`,
        okType: 'danger',
        onOk() {
          tableData.value = tableData.value.filter(i => i.id !== record.id)
          message.success('删除成功')
        }
      })
      return
    }

    // 状态变更
    const statusMap: Record<string, string> = {
      submit: 'IN_APPROVAL',
      approve: 'APPROVED',
      obsolete: 'OBSOLETE'
    }
    const newStatus = statusMap[key]
    if (newStatus) {
      Modal.confirm({
        title: '确认操作',
        content: `确定将方案 ${record.planName} 的状态变更为 ${getStatusText(newStatus)} 吗？`,
        onOk() {
          record.status = newStatus
          message.success('状态变更成功')
        }
      })
    }
  }

  const handleExport = () => {
    const header = ['方案编码', '方案名称', '版本', '归属', '状态', '检验类型', '关联模板', '更新时间']
    const rows = tableData.value.map(r => [
      r.planCode, r.planName, r.version,
      r.orgId === null ? '集团' : getOrgName(r.orgId),
      getStatusText(r.status), r.inspType, r.templateName, r.updateTime
    ])
    const table = `<table><thead><tr>${header.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    const blob = new Blob(["\ufeff" + table], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '检验方案.xls'
    a.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  }

  onMounted(() => {
    loadData()
  })
</script>

<style scoped>
  .page-container {
    padding: 24px;
    background: #f0f2f5;
    min-height: calc(100vh - 64px);
  }

  .toolbar {
    background: #fff;
    padding: 16px;
    border-radius: 4px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
  }

  .search-card {
    margin-bottom: 16px;
  }

  .table-container {
    background: #fff;
    padding: 16px;
    border-radius: 4px;
  }

  .copy-source-label {
    color: #1890ff;
    font-weight: 500;
  }
</style>