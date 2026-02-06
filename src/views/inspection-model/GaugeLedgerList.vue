<template>
  <div class="page-container">
    <div class="split-layout">
      <!-- Left Panel: Gauge Type Tree -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">量检具类型</span>
          <a-space>
            <a-tooltip title="新增根类型">
              <a-button type="primary" size="small" shape="circle" @click="handleAddRootType">
                <template #icon>
                  <PlusOutlined />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="刷新">
              <a-button size="small" shape="circle" @click="loadTypes">
                <template #icon>
                  <ReloadOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </div>

        <div class="search-box">
          <a-input v-model:value="typeSearch" placeholder="搜索类型" allow-clear size="small">
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
        </div>

        <div class="tree-container">
          <a-spin :spinning="typeLoading">
            <a-tree v-if="treeData.length > 0" v-model:selectedKeys="selectedTypeKeys"
              v-model:expandedKeys="expandedKeys" :tree-data="filteredTreeData"
              :field-names="{ children: 'children', title: 'typeName', key: 'id' }" block-node @select="onTypeSelect">
              <template #title="{ typeName, data }">
                <div class="tree-node-content">
                  <span class="node-title">{{ typeName }}</span>
                  <div class="node-actions">
                    <PlusOutlined class="action-icon" title="添加子类型" @click.stop="handleAddSubType(data)" />
                    <EditOutlined class="action-icon" title="编辑" @click.stop="handleEditType(data)" />
                    <DeleteOutlined class="action-icon" title="删除" @click.stop="handleDeleteType(data)" />
                  </div>
                </div>
              </template>
            </a-tree>
            <a-empty v-else description="暂无类型数据" class="empty-state" />
          </a-spin>
        </div>
      </div>

      <!-- Right Panel: Gauge Ledger List -->
      <div class="right-panel">
        <div v-if="!selectedType" class="empty-selection">
          <a-empty description="请选择左侧类型查看台账" />
        </div>

        <div v-else class="content-wrapper">
          <div class="right-header">
            <div class="header-info">
              <div class="category-title">{{ selectedType.typeName }}</div>
              <div class="category-meta">
                <a-tag color="blue">精度: {{ selectedType.precision }}</a-tag>
                <a-tag :color="selectedType.isMsaRequired ? 'orange' : 'green'">
                  {{ selectedType.isMsaRequired ? '需MSA' : '不需MSA' }}
                </a-tag>
              </div>
            </div>
            <div class="header-actions">
              <a-button type="primary" @click="handleAddLedger">
                <template #icon>
                  <PlusOutlined />
                </template>
                新增设备
              </a-button>
              <a-button danger :disabled="selectedLedgerKeys.length === 0" @click="handleBatchDeleteLedgers">
                批量删除
              </a-button>
              <a-upload :show-upload-list="false" :custom-request="handleImport">
                <a-button>导入</a-button>
              </a-upload>
              <a-button @click="handleExport">导出</a-button>
            </div>
          </div>

          <div class="ledger-search-box">
            <a-form layout="inline" :model="ledgerQuery">
              <a-form-item label="量具编号">
                <a-input v-model:value="ledgerQuery.gaugeNo" placeholder="模糊搜索" allow-clear />
              </a-form-item>
              <a-form-item label="量具名称">
                <a-input v-model:value="ledgerQuery.gaugeName" placeholder="模糊搜索" allow-clear />
              </a-form-item>
              <a-form-item label="状态">
                <a-select v-model:value="ledgerQuery.status" style="width: 120px" allow-clear placeholder="请选择">
                  <a-select-option value="IN_USE">在用</a-select-option>
                  <a-select-option value="CALIBRATING">校准中</a-select-option>
                  <a-select-option value="SEALED">封存</a-select-option>
                  <a-select-option value="SCRAPPED">报废</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="校准日期">
                <a-range-picker v-model:value="ledgerQuery.dateRange" />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="searchLedgers">查询</a-button>
                <a-button style="margin-left: 8px" @click="resetLedgerSearch">重置</a-button>
              </a-form-item>
            </a-form>
          </div>

          <div class="table-container">
            <a-table :columns="ledgerColumns" :data-source="ledgerData" :loading="ledgerLoading" row-key="id"
              size="middle" :row-selection="{ selectedRowKeys: selectedLedgerKeys, onChange: onLedgerSelectChange }"
              :pagination="{ showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条` }">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
                </template>
                <template v-else-if="column.key === 'calStatus'">
                  <a-tag :color="getCalStatusColor(record.nextCalDate)">
                    {{ getCalStatusText(record.nextCalDate) }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="handleViewLedger(record)">查看</a-button>
                    <a-button type="link" size="small" @click="handleEditLedger(record)">编辑</a-button>
                    <a-button type="link" danger size="small" @click="handleDeleteLedger(record)">删除</a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </div>
    </div>

    <!-- Type Edit Modal -->
    <a-modal v-model:visible="typeModalVisible" :title="typeModalTitle" @ok="saveType">
      <a-form layout="vertical" :model="typeForm">
        <a-form-item label="父级类型">
          <a-input :value="parentTypeName" disabled />
        </a-form-item>
        <a-form-item label="类型名称" required><a-input v-model:value="typeForm.typeName" /></a-form-item>
        <a-form-item label="精度/分辨率" required><a-input-number v-model:value="typeForm.precision" style="width: 100%"
            :min="0" :step="0.01" /></a-form-item>
        <a-form-item label="是否需MSA">
          <a-switch v-model:checked="typeForm.isMsaRequired" checked-children="是" un-checked-children="否" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Ledger Edit Modal -->
    <a-modal v-model:visible="ledgerModalVisible" :title="isEditLedger ? '编辑量检具台账' : '新增量检具台账'" width="700px"
      @ok="saveLedger">
      <a-form layout="vertical" :model="ledgerForm">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属类型">
              <a-input :value="selectedType?.typeName" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="量具编号" required><a-input v-model:value="ledgerForm.gaugeNo" /></a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="量具名称" required><a-input v-model:value="ledgerForm.gaugeName" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="规格型号"><a-input v-model:value="ledgerForm.model" /></a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="制造商"><a-input v-model:value="ledgerForm.manufacturer" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="量程范围"><a-input v-model:value="ledgerForm.measureRange" /></a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="分辨率"><a-input-number v-model:value="ledgerForm.resolution"
                style="width:100%" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="保管人"><a-input v-model:value="ledgerForm.custodian" /></a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="存放位置"><a-input v-model:value="ledgerForm.location" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" required>
              <a-select v-model:value="ledgerForm.status">
                <a-select-option value="IN_USE">在用</a-select-option>
                <a-select-option value="CALIBRATING">校准中</a-select-option>
                <a-select-option value="SEALED">封存</a-select-option>
                <a-select-option value="SCRAPPED">报废</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="下次校准日期"><a-date-picker v-model:value="ledgerForm.nextCalDate"
                style="width:100%" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="购置日期"><a-date-picker v-model:value="ledgerForm.purchaseDate"
                style="width:100%" /></a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="描述"><a-textarea v-model:value="ledgerForm.description" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import dayjs from 'dayjs'
  import { message, Modal } from 'ant-design-vue'
  import {
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined
  } from '@ant-design/icons-vue'
  import type { GaugeStatus } from '@/types'

  const router = useRouter()

  // --- State ---
  const typeLoading = ref(false)
  const rawTreeData = ref < any[] > ([])
  const typeSearch = ref('')
  const selectedTypeKeys = ref < number[] > ([])
  const expandedKeys = ref < number[] > ([])

  const ledgerLoading = ref(false)
  const ledgerData = ref < any[] > ([])
  const selectedLedgerKeys = ref < number[] > ([])

  // Modal State
  const typeModalVisible = ref(false)
  const isEditType = ref(false)
  const typeForm = reactive({ id: null, parentId: null, typeName: '', precision: 0.01, isMsaRequired: false })
  const parentTypeName = ref('根节点')

  const ledgerModalVisible = ref(false)
  const isEditLedger = ref(false)
  const ledgerForm = reactive({
    id: null as number | null,
    gaugeNo: '',
    gaugeName: '',
    model: '',
    manufacturer: '',
    serialNo: '',
    measureRange: '',
    resolution: 0.01,
    accuracy: '',
    calibrationCycle: 12,
    lastCalDate: null as any,
    nextCalDate: null as any,
    status: 'IN_USE' as GaugeStatus,
    location: '',
    custodian: '',
    certificateNo: '',
    purchaseDate: null as any,
    description: ''
  })

  const ledgerQuery = reactive({
    gaugeNo: '',
    gaugeName: '',
    status: undefined,
    dateRange: [] as any[]
  })

  // --- Left Panel: Gauge Type Logic ---

  const treeData = computed(() => rawTreeData.value)

  const filteredTreeData = computed(() => {
    if (!typeSearch.value) return treeData.value
    return treeData.value
  })

  const selectedType = computed(() => {
    if (selectedTypeKeys.value.length === 0) return null
    const findNode = (nodes: any[], key: number): any => {
      for (const node of nodes) {
        if (node.id === key) return node
        if (node.children) {
          const found = findNode(node.children, key)
          if (found) return found
        }
      }
      return null
    }
    return findNode(treeData.value, selectedTypeKeys.value[0])
  })

  const loadTypes = () => {
    typeLoading.value = true
    setTimeout(() => {
      rawTreeData.value = [
        {
          id: 301, typeName: '数显卡尺', parentId: null, precision: 0.01, isMsaRequired: true,
          children: [
            { id: 3011, typeName: '数显卡尺-A品牌', parentId: 301, precision: 0.01, isMsaRequired: true }
          ]
        },
        {
          id: 302, typeName: '塞尺', parentId: null, precision: 0.05, isMsaRequired: false,
          children: []
        }
      ]
      expandedKeys.value = [301]
      typeLoading.value = false
    }, 500)
  }

  const onTypeSelect = (keys: number[]) => {
    if (keys.length > 0) {
      loadLedgers(keys[0])
    } else {
      ledgerData.value = []
    }
  }

  const handleAddRootType = () => {
    isEditType.value = false
    parentTypeName.value = '根类型'
    Object.assign(typeForm, { id: null, parentId: null, typeName: '', precision: 0.01, isMsaRequired: false })
    typeModalTitle.value = '新增根量检具类型'
    typeModalVisible.value = true
  }

  const handleAddSubType = (parent: any) => {
    isEditType.value = false
    parentTypeName.value = parent.typeName
    Object.assign(typeForm, { id: null, parentId: parent.id, typeName: '', precision: parent.precision, isMsaRequired: parent.isMsaRequired })
    typeModalTitle.value = '新增子量检具类型'
    typeModalVisible.value = true
  }

  const handleEditType = (node: any) => {
    isEditType.value = true
    parentTypeName.value = node.parentId ? '上级ID:' + node.parentId : '根类型'
    Object.assign(typeForm, { ...node })
    typeModalTitle.value = '编辑量检具类型'
    typeModalVisible.value = true
  }

  const handleDeleteType = (node: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除类型 ${node.typeName} 及其下属所有台账吗？`,
      okType: 'danger',
      onOk() {
        message.success('类型已删除')
        loadTypes()
        selectedTypeKeys.value = []
        ledgerData.value = []
      }
    })
  }

  const typeModalTitle = ref('')

  const saveType = () => {
    message.success('类型保存成功')
    typeModalVisible.value = false
    loadTypes()
  }

  // --- Right Panel: Ledger Logic ---

  const ledgerColumns = [
    { title: '量具编号', dataIndex: 'gaugeNo', key: 'gaugeNo', width: 120 },
    { title: '量具名称', dataIndex: 'gaugeName', key: 'gaugeName', width: 140 },
    { title: '规格型号', dataIndex: 'model', key: 'model', width: 100 },
    { title: '制造商', dataIndex: 'manufacturer', key: 'manufacturer', width: 100 },
    { title: '量程', dataIndex: 'measureRange', key: 'measureRange', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
    { title: '校准状态', key: 'calStatus', width: 90 },
    { title: '下次校准', dataIndex: 'nextCalDate', key: 'nextCalDate', width: 110 },
    { title: '保管人', dataIndex: 'custodian', key: 'custodian', width: 80 },
    { title: '操作', key: 'action', width: 180 }
  ]

  const loadLedgers = (typeId: number) => {
    ledgerLoading.value = true
    setTimeout(() => {
      // Mock Data
      let data: any[] = []
      if (typeId === 301 || typeId === 3011) {
        data = [
          {
            id: 1001,
            gaugeNo: 'G-001',
            gaugeName: '数显卡尺01',
            model: 'M-150',
            manufacturer: '三丰',
            serialNo: 'SN2023001',
            measureRange: '0-150mm',
            resolution: 0.01,
            accuracy: '±0.02mm',
            calibrationCycle: 12,
            lastCalDate: '2023-06-15',
            nextCalDate: '2024-06-15',
            status: 'IN_USE' as GaugeStatus,
            location: '产线A',
            custodian: '张三',
            certificateNo: 'CAL-2023-0001',
            description: '产线A使用'
          },
          {
            id: 1002,
            gaugeNo: 'G-002',
            gaugeName: '数显卡尺02',
            model: 'M-150',
            manufacturer: '三丰',
            serialNo: 'SN2023002',
            measureRange: '0-150mm',
            resolution: 0.01,
            accuracy: '±0.02mm',
            calibrationCycle: 12,
            lastCalDate: '2023-09-01',
            nextCalDate: dayjs().add(10, 'day').format('YYYY-MM-DD'),
            status: 'IN_USE' as GaugeStatus,
            location: '产线B',
            custodian: '李四',
            certificateNo: 'CAL-2023-0002',
            description: '即将到期校准'
          },
          {
            id: 1003,
            gaugeNo: 'G-003',
            gaugeName: '数显卡尺03',
            model: 'M-200',
            manufacturer: '三丰',
            serialNo: 'SN2022003',
            measureRange: '0-200mm',
            resolution: 0.01,
            accuracy: '±0.03mm',
            calibrationCycle: 12,
            lastCalDate: '2022-12-01',
            nextCalDate: '2023-12-01',
            status: 'CALIBRATING' as GaugeStatus,
            location: '计量室',
            custodian: '王五',
            certificateNo: '',
            description: '送外校准中'
          }
        ]
      }

      // Filter logic
      if (ledgerQuery.gaugeNo) {
        data = data.filter(item => item.gaugeNo.includes(ledgerQuery.gaugeNo))
      }
      if (ledgerQuery.gaugeName) {
        data = data.filter(item => item.gaugeName.includes(ledgerQuery.gaugeName))
      }
      if (ledgerQuery.status) {
        data = data.filter(item => item.status === ledgerQuery.status)
      }
      if (ledgerQuery.dateRange && ledgerQuery.dateRange.length === 2) {
        const start = ledgerQuery.dateRange[0].format('YYYY-MM-DD')
        const end = ledgerQuery.dateRange[1].format('YYYY-MM-DD')
        data = data.filter(item => item.nextCalDate >= start && item.nextCalDate <= end)
      }

      ledgerData.value = data
      ledgerLoading.value = false
    }, 300)
  }

  const searchLedgers = () => {
    if (selectedType.value) {
      loadLedgers(selectedType.value.id)
    }
  }

  const resetLedgerSearch = () => {
    ledgerQuery.gaugeNo = ''
    ledgerQuery.gaugeName = ''
    ledgerQuery.status = undefined
    ledgerQuery.dateRange = []
    searchLedgers()
  }

  const onLedgerSelectChange = (keys: number[]) => {
    selectedLedgerKeys.value = keys
  }

  const handleAddLedger = () => {
    isEditLedger.value = false
    Object.assign(ledgerForm, {
      id: null,
      gaugeNo: '',
      gaugeName: selectedType.value?.typeName || '',
      model: '',
      manufacturer: '',
      serialNo: '',
      measureRange: '',
      resolution: 0.01,
      accuracy: '',
      calibrationCycle: 12,
      lastCalDate: null,
      nextCalDate: null,
      status: 'IN_USE',
      location: '',
      custodian: '',
      certificateNo: '',
      purchaseDate: null,
      description: ''
    })
    ledgerModalVisible.value = true
  }

  const handleEditLedger = (record: any) => {
    isEditLedger.value = true
    const formData = { ...record }
    if (formData.nextCalDate) formData.nextCalDate = dayjs(formData.nextCalDate)
    if (formData.lastCalDate) formData.lastCalDate = dayjs(formData.lastCalDate)
    if (formData.purchaseDate) formData.purchaseDate = dayjs(formData.purchaseDate)
    Object.assign(ledgerForm, formData)
    ledgerModalVisible.value = true
  }

  const handleDeleteLedger = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除量具 ${record.gaugeNo} 吗？`,
      okType: 'danger',
      onOk() {
        ledgerData.value = ledgerData.value.filter(l => l.id !== record.id)
        message.success('删除成功')
      }
    })
  }

  const handleBatchDeleteLedgers = () => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定删除选中的 ${selectedLedgerKeys.value.length} 条记录吗？`,
      okType: 'danger',
      onOk() {
        ledgerData.value = ledgerData.value.filter(l => !selectedLedgerKeys.value.includes(l.id))
        selectedLedgerKeys.value = []
        message.success('批量删除成功')
      }
    })
  }

  const saveLedger = () => {
    if (!ledgerForm.gaugeNo || !ledgerForm.gaugeName) {
      message.warn('请填写必填项')
      return
    }

    // Convert form data for saving
    const saveData = { ...ledgerForm }
    if (saveData.nextCalDate) saveData.nextCalDate = dayjs(saveData.nextCalDate).format('YYYY-MM-DD')
    if (saveData.lastCalDate) saveData.lastCalDate = dayjs(saveData.lastCalDate).format('YYYY-MM-DD')
    if (saveData.purchaseDate) saveData.purchaseDate = dayjs(saveData.purchaseDate).format('YYYY-MM-DD')

    if (isEditLedger.value) {
      const idx = ledgerData.value.findIndex(l => l.id === ledgerForm.id)
      if (idx !== -1) Object.assign(ledgerData.value[idx], saveData)
    } else {
      ledgerData.value.push({ ...saveData, id: Date.now() })
    }
    message.success('台账保存成功')
    ledgerModalVisible.value = false
  }

  const handleExport = () => {
    message.success('导出任务已开始...')
  }

  const handleImport = (options: any) => {
    const { onProgress, onSuccess } = options
    onProgress({ percent: 0 })

    // 模拟导入延迟
    setTimeout(() => {
      onProgress({ percent: 100 })

      // 模拟导入的数据
      const mockImportedData = [
        {
          id: Date.now() + 1,
          gaugeNo: 'IMP-001',
          gaugeName: `${selectedType.value?.typeName} (导入1)`,
          model: 'M-IMP-1',
          manufacturer: 'Import Brand',
          status: 'IN_USE',
          nextCalDate: dayjs().add(6, 'month').format('YYYY-MM-DD'),
          custodian: '用户A'
        },
        {
          id: Date.now() + 2,
          gaugeNo: 'IMP-002',
          gaugeName: `${selectedType.value?.typeName} (导入2)`,
          model: 'M-IMP-2',
          manufacturer: 'Import Brand',
          status: 'IN_USE',
          nextCalDate: dayjs().add(10, 'month').format('YYYY-MM-DD'),
          custodian: '用户B'
        }
      ]

      ledgerData.value.unshift(...mockImportedData)
      onSuccess(true)
      message.success(`成功导入 ${mockImportedData.length} 条数据`)
    }, 1500)
  }

  // 查看量检具详情
  const handleViewLedger = (record: any) => {
    router.push(`/inspection-model/gauge-ledgers/${record.id}`)
  }

  // 状态颜色映射
  const getStatusColor = (status: GaugeStatus) => {
    switch (status) {
      case 'IN_USE': return 'green'
      case 'CALIBRATING': return 'orange'
      case 'SEALED': return 'gray'
      case 'SCRAPPED': return 'red'
      default: return 'default'
    }
  }

  // 状态文本映射
  const getStatusText = (status: GaugeStatus) => {
    switch (status) {
      case 'IN_USE': return '在用'
      case 'CALIBRATING': return '校准中'
      case 'SEALED': return '封存'
      case 'SCRAPPED': return '报废'
      default: return status
    }
  }

  // 校准状态颜色（基于下次校准日期）
  const getCalStatusColor = (nextCalDate: string) => {
    if (!nextCalDate) return 'default'
    const today = dayjs()
    const nextCal = dayjs(nextCalDate)
    const daysUntil = nextCal.diff(today, 'day')

    if (daysUntil < 0) return 'red'       // 已过期
    if (daysUntil <= 14) return 'orange'  // 即将到期
    return 'green'                         // 正常
  }

  // 校准状态文本
  const getCalStatusText = (nextCalDate: string) => {
    if (!nextCalDate) return '-'
    const today = dayjs()
    const nextCal = dayjs(nextCalDate)
    const daysUntil = nextCal.diff(today, 'day')

    if (daysUntil < 0) return '已过期'
    if (daysUntil <= 14) return '即将到期'
    return '正常'
  }

  onMounted(() => {
    loadTypes()
  })
</script>

<style scoped>
  .page-container {
    height: calc(100vh - 64px);
    background-color: #f0f2f5;
    padding: 16px;
    overflow: hidden;
  }

  .split-layout {
    display: flex;
    height: 100%;
    gap: 16px;
  }

  /* Left Panel */
  .left-panel {
    width: 300px;
    min-width: 300px;
    background: white;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  }

  .panel-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .panel-title {
    font-weight: 600;
    font-size: 16px;
    color: #1f1f1f;
  }

  .search-box {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .tree-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  :deep(.ant-tree-node-content-wrapper) {
    width: 100%;
  }

  .tree-node-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 8px;
    width: 100%;
  }

  .node-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-actions {
    display: none;
    gap: 8px;
  }

  :deep(.ant-tree-treenode:hover) .node-actions {
    display: flex;
  }

  .action-icon {
    font-size: 12px;
    color: #8c8c8c;
    transition: color 0.2s;
  }

  .action-icon:hover {
    color: #1890ff;
  }

  /* Right Panel */
  .right-panel {
    flex: 1;
    background: white;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  }

  .empty-selection {
    margin: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .right-header {
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .category-title {
    font-size: 20px;
    font-weight: 500;
    color: #1f1f1f;
    margin-bottom: 8px;
  }

  .category-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ledger-search-box {
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
  }

  .table-container {
    flex: 1;
    overflow: hidden;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }
</style>