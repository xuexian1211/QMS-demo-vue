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
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
              <a-divider type="vertical" />
              <a-button type="link" size="small" @click="handleEdit(record)"
                :disabled="record.status !== 'DRAFT'">编辑</a-button>
              <a-divider type="vertical" />
              <a-dropdown>
                <a-button type="link" size="small">
                  更多
                  <DownOutlined />
                </a-button>
                <template #overlay>
                  <a-menu @click="(e) => handleMenuClick(record, e.key)">
                    <a-menu-item key="submit" :disabled="record.status !== 'DRAFT'">提交审批</a-menu-item>
                    <a-menu-item key="approve" :disabled="record.status !== 'IN_APPROVAL'">审批通过</a-menu-item>
                    <a-menu-item key="obsolete" :disabled="record.status === 'OBSOLETE'">作废</a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="copy">复制方案</a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="delete" danger :disabled="record.status !== 'DRAFT'">删除</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { message, Modal } from 'ant-design-vue'
  import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    ExportOutlined, ReloadOutlined, DownOutlined
  } from '@ant-design/icons-vue'

  const router = useRouter()

  // --- 状态定义 ---
  const loading = ref(false)
  const tableData = ref < any[] > ([])
  const selectedRowKeys = ref < string[] > ([])

  const queryParam = reactive({
    planCode: '',
    planName: '',
    version: '',
    status: undefined as string | undefined
  })

  const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true
  })

  // 列定义
  const columns = [
    { title: '方案编码', dataIndex: 'planCode', key: 'planCode', width: 180 },
    { title: '方案名称', dataIndex: 'planName', key: 'planName', width: 250 },
    { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
    { title: '检验类型', dataIndex: 'inspType', key: 'inspType', width: 100 },
    { title: '关联模板', dataIndex: 'templateName', key: 'templateName', width: 150 },
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

  // --- 数据加载 ---
  const loadData = () => {
    loading.value = true
    setTimeout(() => {
      let data = [
        { id: '601', planCode: 'IP-HFC-CASTING', planName: '合肥工厂-压铸件通用方案', version: 'V1.0', status: 'APPROVED', inspType: 'IPQC', templateName: 'IPQC过程检验模板', updateTime: '2026-01-10 10:00' },
        { id: '602', planCode: 'IQC-A-L1', planName: '来料抽样加严L1', version: 'V1.2', status: 'DRAFT', inspType: 'IQC', templateName: 'IQC原材料检验模板', updateTime: '2026-01-12 14:30' },
        { id: '603', planCode: 'FQC-MOTOR-001', planName: '电机成品检验方案', version: 'V2.0', status: 'IN_APPROVAL', inspType: 'FQC', templateName: 'FQC成品检验模板', updateTime: '2026-01-11 09:15' },
        { id: '604', planCode: 'OQC-EXPORT-001', planName: '出口产品检验方案', version: 'V1.0', status: 'OBSOLETE', inspType: 'OQC', templateName: 'OQC出货检验模板', updateTime: '2025-12-20 16:00' },
      ]

      // 过滤
      if (queryParam.planCode) data = data.filter(i => i.planCode.includes(queryParam.planCode))
      if (queryParam.planName) data = data.filter(i => i.planName.includes(queryParam.planName))
      if (queryParam.version) data = data.filter(i => i.version.includes(queryParam.version))
      if (queryParam.status) data = data.filter(i => i.status === queryParam.status)

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
    router.push('/inspection-model/insp-plans/create')
  }

  const handleView = (record: any) => {
    router.push(`/inspection-model/insp-plans/view/${record.id}`)
  }

  const handleEdit = (record?: any) => {
    const item = record?.id ? record : tableData.value.find(i => i.id === selectedRowKeys.value[0])
    if (!item) return
    if (item.status !== 'DRAFT') {
      message.warning('只有草稿状态的方案可以编辑')
      return
    }
    router.push(`/inspection-model/insp-plans/edit/${item.id}`)
  }

  const handleBatchDelete = () => {
    const draftItems = tableData.value.filter(i => selectedRowKeys.value.includes(i.id) && i.status === 'DRAFT')
    if (draftItems.length === 0) {
      message.warning('只有草稿状态的方案可以删除')
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

  const handleMenuClick = (record: any, key: string) => {
    if (key === 'copy') {
      message.success(`方案 ${record.planCode} 已复制`)
      return
    }

    if (key === 'delete') {
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
    // 导出Excel
    const header = ['方案编码', '方案名称', '版本', '状态', '检验类型', '关联模板', '更新时间']
    const rows = tableData.value.map(r => [r.planCode, r.planName, r.version, getStatusText(r.status), r.inspType, r.templateName, r.updateTime])
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
</style>