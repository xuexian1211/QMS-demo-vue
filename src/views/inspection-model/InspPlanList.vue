<template>
  <div class="page-container">
    <div class="toolbar">
      <a-button type="primary" @click="toCreate">新增</a-button>
      <a-button :disabled="selectedRowKeys.length!==1" @click="toEdit">编辑</a-button>
      <a-button :disabled="selectedRowKeys.length===0" danger @click="confirmDelete">删除</a-button>
      <a-button @click="exportExcel">导出Excel</a-button>
      <a-switch v-model:checked="autoRefresh" checked-children="自动刷新" un-checked-children="自动刷新" />
      <a-button @click="load">刷新</a-button>
    </div>
    <a-card title="搜索条件" size="small" class="search-card">
      <a-form layout="inline" :model="query">
        <a-form-item label="方案编码"><a-input v-model:value="query.planCode" style="width:200px" /></a-form-item>
        <a-form-item label="方案名称"><a-input v-model:value="query.planname" style="width:240px" /></a-form-item>
        <a-form-item label="版本"><a-input v-model:value="query.version" style="width:140px" /></a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="query.status" style="width:160px" allowClear :options="statusOptions" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="search">查询</a-button>
          <a-button style="margin-left:8px" @click="reset">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
    <a-table :columns="columns" :data-source="data" :pagination="pagination" :row-selection="rowSelection" row-key="id" size="small" class="compact-table" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, h, resolveComponent } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'

const router = useRouter()

const statusOptions = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'IN_APPROVAL', label: '审批中' },
  { value: 'APPROVED', label: '已批准' },
  { value: 'OBSOLETE', label: '已作废' }
]

const data = ref<any[]>([])
const query = reactive({ planCode: '', planname: '', version: '', status: undefined as any })

const columns = [
  { title: '方案编码', dataIndex: 'planCode', key: 'planCode' },
  { title: '方案名称', dataIndex: 'planname', key: 'planname' },
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '流程ID', dataIndex: 'workflowInstanceId', key: 'workflowInstanceId' },
  { title: '操作', key: 'actions', width: 160, customRender: ({ record }: any) => {
    const ASpace = resolveComponent('a-space')
    const AButton = resolveComponent('a-button')
    return h(ASpace, null, { default: () => [
      h(AButton, { size: 'small', type: 'link', onClick: () => router.push(`/inspection-model/insp-plans/edit/${record.id}`) }, { default: () => '编辑' }),
      h(AButton, { size: 'small', type: 'link', onClick: () => router.push(`/inspection-model/insp-plans/view/${record.id}`) }, { default: () => '查看' })
    ] }) } },
]

const selectedRowKeys = ref<any[]>([])
const selectedRows = ref<any[]>([])
const rowSelection = reactive({ selectedRowKeys, onChange: (keys: any[], rows: any[]) => { selectedRowKeys.value = keys; selectedRows.value = rows } })

const pagination = reactive({ current: 1, pageSize: 20, total: 0, showSizeChanger: true, showQuickJumper: true })

const autoRefresh = ref(false)
let timer: any = null
watch(autoRefresh, (val) => { if (val) { timer = setInterval(load, 15000) } else { if (timer) { clearInterval(timer); timer=null } } })

const load = () => {
  const all = [
    { id: 601, orgId: 1, planCode: 'IP-HFC-CASTING', planname: '合肥工厂-压铸件通用方案', version: 'V1.0', status: 'APPROVED', workflowInstanceId: 1001 },
    { id: 602, orgId: 1, planCode: 'IQC-A-L1', planname: '来料抽样加严L1', version: 'V1.2', status: 'DRAFT', workflowInstanceId: 0 }
  ]
  let res = all
  if (query.planCode) res = res.filter(r => r.planCode.includes(query.planCode))
  if (query.planname) res = res.filter(r => r.planname.includes(query.planname))
  if (query.version) res = res.filter(r => r.version.includes(query.version))
  if (query.status!==undefined) res = res.filter(r => r.status === query.status)
  pagination.total = res.length
  data.value = res
}

const search = () => { pagination.current = 1; load() }
const reset = () => { Object.assign(query, { planCode: '', planname: '', version: '', status: undefined }); search() }
const toCreate = () => router.push('/inspection-model/insp-plans/create')
const toEdit = () => { if (selectedRows.value[0]) router.push(`/inspection-model/insp-plans/edit/${selectedRows.value[0].id}`) }
const confirmDelete = () => { if (!selectedRowKeys.value.length) return; Modal.confirm({ title:'确认删除', content:`确定删除选中的${selectedRowKeys.value.length}条记录？`, okType:'danger', onOk(){ message.success('删除成功') } }) }

const exportExcel = () => {
  const header = ['方案编码','方案名称','版本','状态','流程ID']
  const rows = data.value.map(r => [r.planCode, r.planname, r.version, r.status, r.workflowInstanceId||''])
  const table = `<table><thead><tr>${header.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${String(cell).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  const blob = new Blob(["\ufeff"+table], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '检验方案.xls'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(load)
</script>

<style scoped>
.page-container { padding:24px; background:#f5f5f5; min-height:calc(100vh - 60px) }
.toolbar { display:flex; gap:8px; background:#fff; padding:12px 16px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.06); margin-bottom:12px }
.search-card { margin-bottom:12px }
.search-card :deep(.ant-card-body) { padding:12px }
.compact-table :deep(.ant-table-thead > tr > th) { background:#fafafa; font-weight:600; padding:8px 12px }
.compact-table :deep(.ant-table-tbody > tr > td) { padding:8px 12px }
@media (max-width:768px){ .page-container{ padding:8px } .toolbar{ flex-wrap:wrap } }
</style>

