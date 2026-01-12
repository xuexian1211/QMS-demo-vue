<template>
  <div class="page-container">
    <div class="toolbar">
      <a-button type="primary" @click="toCreate">新增</a-button>
      <a-button :disabled="selectedRowKeys.length!==1" @click="toEdit">编辑</a-button>
      <a-button :disabled="selectedRowKeys.length===0" danger @click="confirmDelete">删除</a-button>
      <a-button @click="exportCsv">导出</a-button>
      <a-switch v-model:checked="autoRefresh" checked-children="自动刷新" un-checked-children="自动刷新" />
      <a-button @click="load">刷新</a-button>
    </div>
    <a-card title="搜索条件" size="small" class="search-card">
      <a-form layout="inline" :model="query">
        <a-form-item label="编码"><a-input v-model:value="query.code" style="width:180px" /></a-form-item>
        <a-form-item label="名称"><a-input v-model:value="query.name" style="width:220px" /></a-form-item>
        <a-form-item label="分类">
          <a-select v-model:value="query.category" style="width:160px" allowClear :options="categoryOptions" />
        </a-form-item>
        <a-form-item label="数据类型">
          <a-select v-model:value="query.dataType" style="width:160px" allowClear :options="dataTypeOptions" />
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

const categoryOptions = [
  { value: '尺寸', label: '尺寸' },
  { value: '外观', label: '外观' },
  { value: '理化', label: '理化' },
  { value: '功能', label: '功能' }
]
const dataTypeOptions = [
  { value: 'QUANTITATIVE', label: '计量' },
  { value: 'QUALITATIVE', label: '计数' }
]

const data = ref<any[]>([])
const query = reactive({ code: '', name: '', category: undefined as any, dataType: undefined as any })

const columns = [
  { title: '编码', dataIndex: 'code', key: 'code' },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '分类', dataIndex: 'category', key: 'category' },
  { title: '数据类型', dataIndex: 'dataType', key: 'dataType' },
  { title: '默认方法ID', dataIndex: 'defaultMethodId', key: 'defaultMethodId' },
  { title: '默认量具类型ID', dataIndex: 'defaultInstTypeId', key: 'defaultInstTypeId' },
  { title: '操作', key: 'actions', customRender: ({ record }: any) => {
    const ASpace = resolveComponent('a-space')
    const AButton = resolveComponent('a-button')
    return h(ASpace, null, { default: () => [
      h(AButton, { size: 'small', type: 'link', onClick: () => router.push(`/inspection-model/inspection-items/edit/${record.id}`) }, { default: () => '编辑' }),
      h(AButton, { size: 'small', type: 'link', onClick: () => router.push(`/inspection-model/inspection-items/view/${record.id}`) }, { default: () => '查看' }),
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
    { id: 101, code: 'CHAR-DIM-001', name: '壳体A面平面度', category: '尺寸', dataType: 'QUANTITATIVE', defaultMethodId: 201, defaultInstTypeId: 301 },
    { id: 102, code: 'CHAR-APP-001', name: '外观划伤', category: '外观', dataType: 'QUALITATIVE', defaultMethodId: 202, defaultInstTypeId: 302 }
  ]
  let res = all
  if (query.code) res = res.filter(r => r.code.includes(query.code))
  if (query.name) res = res.filter(r => r.name.includes(query.name))
  if (query.category!==undefined) res = res.filter(r => r.category === query.category)
  if (query.dataType!==undefined) res = res.filter(r => r.dataType === query.dataType)
  pagination.total = res.length
  data.value = res
}

const search = () => { pagination.current = 1; load() }
const reset = () => { Object.assign(query, { code: '', name: '', category: undefined, dataType: undefined }); search() }
const toCreate = () => router.push('/inspection-model/inspection-items/create')
const toEdit = () => { if (selectedRows.value[0]) router.push(`/inspection-model/inspection-items/edit/${selectedRows.value[0].id}`) }
const confirmDelete = () => { if (!selectedRowKeys.value.length) return; Modal.confirm({ title:'确认删除', content:`确定删除选中的${selectedRowKeys.value.length}条记录？`, okType:'danger', onOk(){ message.success('删除成功') } }) }

const exportCsv = () => {
  const header = ['编码','名称','分类','数据类型','默认方法ID','默认量具类型ID']
  const rows = data.value.map(r => [r.code, r.name, r.category, r.dataType, r.defaultMethodId||'', r.defaultInstTypeId||''])
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '检验项目.csv'
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

