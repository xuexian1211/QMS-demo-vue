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
        <a-form-item label="编码"><a-input v-model:value="query.code" style="width:160px" /></a-form-item>
        <a-form-item label="名称"><a-input v-model:value="query.name" style="width:200px" /></a-form-item>
        <a-form-item label="原因大类">
          <a-select v-model:value="query.category" style="width:160px" allowClear>
            <a-select-option value="Man">Man</a-select-option>
            <a-select-option value="Machine">Machine</a-select-option>
            <a-select-option value="Material">Material</a-select-option>
            <a-select-option value="Method">Method</a-select-option>
            <a-select-option value="Measurement">Measurement</a-select-option>
            <a-select-option value="Environment">Environment</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="search">查询</a-button>
          <a-button style="margin-left:8px" @click="reset">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="pagination"
      :row-selection="rowSelection"
      row-key="id"
      size="small"
      class="compact-table"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, h, resolveComponent } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'

const router = useRouter()

const data = ref<any[]>([])
const query = reactive({ code: '', name: '', category: '' as any })

const columns = [
  { title: '原因代码', dataIndex: 'code', key: 'code' },
  { title: '原因名称', dataIndex: 'name', key: 'name' },
  { title: '父级ID', dataIndex: 'parentId', key: 'parentId' },
  { title: '原因大类', dataIndex: 'category', key: 'category' },
  { title: '高频', dataIndex: 'isHighFrequency', key: 'isHighFrequency', customRender: ({ text }: any) => text ? '是' : '否' },
  { title: '操作', key: 'actions',
    customRender: ({ record }: any) => {
      const ASpace = resolveComponent('a-space')
      const AButton = resolveComponent('a-button')
      return h(ASpace, null, {
        default: () => [
          h(AButton, { size: 'small', type: 'link', onClick: () => router.push(`/inspection-model/defect-causes/edit/${record.id}`) }, { default: () => '编辑' }),
          h(AButton, { size: 'small', type: 'link', onClick: () => router.push(`/inspection-model/defect-causes/view/${record.id}`) }, { default: () => '查看' })
        ]
      })
    }
  }
]

const selectedRowKeys = ref<any[]>([])
const selectedRows = ref<any[]>([])
const rowSelection = reactive({
  selectedRowKeys,
  onChange: (keys: any[], rows: any[]) => { selectedRowKeys.value = keys; selectedRows.value = rows }
})

const pagination = reactive({ current: 1, pageSize: 20, total: 0, showSizeChanger: true, showQuickJumper: true })

const autoRefresh = ref(false)
let timer: any = null
watch(autoRefresh, (val) => { if (val) { timer = setInterval(load, 15000) } else { if (timer) { clearInterval(timer); timer=null } } })

const load = () => {
  const all = [
    { id: 500, parentId: null, code: 'CA-MAC', name: '设备问题', category: 'Machine', isHighFrequency: false },
    { id: 501, parentId: 500, code: 'CA-MAC-AGING', name: '设备老化', category: 'Machine', isHighFrequency: true }
  ]
  let res = all
  if (query.code) res = res.filter(r => r.code.includes(query.code))
  if (query.name) res = res.filter(r => r.name.includes(query.name))
  if (query.category) res = res.filter(r => r.category===query.category)
  pagination.total = res.length
  data.value = res
}

const search = () => { pagination.current = 1; load() }
const reset = () => { Object.assign(query, { code: '', name: '', category: '' }); search() }
const toCreate = () => router.push('/inspection-model/defect-causes/create')
const toEdit = () => { if (selectedRows.value[0]) router.push(`/inspection-model/defect-causes/edit/${selectedRows.value[0].id}`) }
const confirmDelete = () => { if (selectedRowKeys.value.length===0) return; Modal.confirm({ title:'确认删除', content:`确定删除选中的${selectedRowKeys.value.length}条记录？`, okType:'danger', onOk(){ message.success('删除成功') } }) }

const exportCsv = () => {
  const header = ['原因代码','原因名称','父级ID','原因大类','高频']
  const rows = data.value.map(r => [r.code, r.name, r.parentId??'', r.category, r.isHighFrequency?'是':'否'])
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '不良原因.csv'
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
