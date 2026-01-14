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
                <a-form-item label="路线编码">
                    <a-input v-model:value="queryParam.code" placeholder="请输入" allow-clear />
                </a-form-item>
                <a-form-item label="路线名称">
                    <a-input v-model:value="queryParam.name" placeholder="请输入" allow-clear />
                </a-form-item>
                <a-form-item label="关联物料">
                    <a-input v-model:value="queryParam.material" placeholder="请输入" allow-clear />
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
                        <a-tag :color="getStatusColor(record.status)">
                            {{ getStatusText(record.status) }}
                        </a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
                            <a-divider type="vertical" />
                            <a-button type="link" size="small" @click="handleEditPage(record)">编辑</a-button>
                            <a-divider type="vertical" />
                            <a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
                        </a-space>
                    </template>
                </template>
                <!-- Nested Table for Details -->
                <template #expandedRowRender="{ record }">
                    <a-table :columns="innerColumns" :data-source="record.steps" :pagination="false" size="small">
                    </a-table>
                </template>
            </a-table>
        </div>

        <!-- Edit Modal -->
        <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑工艺路线' : '新增工艺路线'" width="800px" @ok="handleSave">
            <a-tabs v-model:activeKey="activeTab">
                <a-tab-pane key="basic" tab="基本信息">
                    <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
                        <a-row :gutter="16">
                            <a-col :span="12">
                                <a-form-item label="路线编码" name="code">
                                    <a-input v-model:value="formState.code" placeholder="请输入" :disabled="isEdit" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="路线名称" name="name">
                                    <a-input v-model:value="formState.name" placeholder="请输入" />
                                </a-form-item>
                            </a-col>
                        </a-row>
                        <a-row :gutter="16">
                            <a-col :span="12">
                                <a-form-item label="关联物料" name="materialId">
                                    <a-select v-model:value="formState.materialId" show-search placeholder="请选择物料"
                                        :filter-option="filterMaterialOption">
                                        <a-select-option v-for="m in materialOptions" :key="m.id" :value="m.id">
                                            {{ m.code }} - {{ m.name }}
                                        </a-select-option>
                                    </a-select>
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="版本号" name="version">
                                    <a-input v-model:value="formState.version" placeholder="如：V1.0" />
                                </a-form-item>
                            </a-col>
                        </a-row>
                        <a-row :gutter="16">
                            <a-col :span="12">
                                <a-form-item label="状态" name="status">
                                    <a-select v-model:value="formState.status">
                                        <a-select-option value="Draft">草稿</a-select-option>
                                        <a-select-option value="Active">生效</a-select-option>
                                        <a-select-option value="Obsolete">失效</a-select-option>
                                    </a-select>
                                </a-form-item>
                            </a-col>
                        </a-row>
                        <a-form-item label="描述" name="description">
                            <a-textarea v-model:value="formState.description" :rows="3" />
                        </a-form-item>
                    </a-form>
                </a-tab-pane>

                <a-tab-pane key="steps" tab="工序明细">
                    <div style="margin-bottom: 8px;">
                        <a-button type="dashed" block @click="handleAddStep">
                            <PlusOutlined /> 添加工序
                        </a-button>
                    </div>
                    <a-table :columns="editStepColumns" :data-source="formState.steps" :pagination="false" size="small"
                        row-key="id">
                        <template #bodyCell="{ column, record, index }">
                            <template v-if="column.key === 'opSeq'">
                                <a-input-number v-model:value="record.opSeq" :min="1" style="width: 60px" />
                            </template>
                            <template v-else-if="column.key === 'opName'">
                                <a-input v-model:value="record.opName" />
                            </template>
                            <template v-else-if="column.key === 'workCenter'">
                                <a-input v-model:value="record.workCenter" />
                            </template>
                            <template v-else-if="column.key === 'description'">
                                <a-input v-model:value="record.description" />
                            </template>
                            <template v-else-if="column.key === 'inspConfig'">
                                <a-space>
                                    <a-tag v-if="record.hasFirstInsp" color="blue" size="small">首检</a-tag>
                                    <a-tag v-if="record.hasPatrolInsp" color="green" size="small">巡检</a-tag>
                                    <a-tag v-if="record.hasFinalInsp" color="orange" size="small">末检</a-tag>
                                    <a-button type="link" size="small" @click="handleConfigInsp(record)">配置</a-button>
                                </a-space>
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-button type="link" danger size="small" @click="handleRemoveStep(index)">移除</a-button>
                            </template>
                        </template>
                    </a-table>
                </a-tab-pane>
            </a-tabs>
        </a-modal>

        <!-- 工序检验配置弹窗 -->
        <OperationInspConfigModal v-model:visible="inspConfigModalVisible" :operationInfo="currentOperation"
            @save="handleSaveInspConfig" />
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { message, Modal } from 'ant-design-vue'
    import {
        PlusOutlined, EditOutlined, DeleteOutlined,
        ExportOutlined, ReloadOutlined
    } from '@ant-design/icons-vue'
    import OperationInspConfigModal from '@/components/OperationInspConfigModal.vue'

    const router = useRouter()

    // --- Search & Table ---
    const loading = ref(false)
    const tableData = ref < any[] > ([])
    const selectedRowKeys = ref < string[] > ([])
    const queryParam = reactive({
        code: '',
        name: '',
        material: ''
    })

    const pagination = reactive({
        current: 1,
        pageSize: 20,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true
    })

    const columns = [
        { title: '路线编码', dataIndex: 'code', key: 'code', width: 150 },
        { title: '路线名称', dataIndex: 'name', key: 'name', width: 200 },
        { title: '关联物料', dataIndex: 'material', key: 'material', width: 150 },
        { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
        { title: '描述', dataIndex: 'description', key: 'description' },
        { title: '操作', key: 'action', width: 150, fixed: 'right' }
    ]

    const innerColumns = [
        { title: '序号', dataIndex: 'opSeq', key: 'opSeq', width: 60 },
        { title: '工序名称', dataIndex: 'opName', key: 'opName', width: 120 },
        { title: '工作中心', dataIndex: 'workCenter', key: 'workCenter', width: 100 },
        { title: '检验配置', key: 'inspConfig', width: 180 },
        { title: '工序描述', dataIndex: 'description', key: 'description' }
    ]

    // 物料下拉选项
    const materialOptions = ref([
        { id: '1', code: 'M001', name: '铝锭' },
        { id: '2', code: 'P001', name: '发动机壳体' },
        { id: '3', code: 'F001', name: '电动车电机' },
    ])

    const filterMaterialOption = (input: string, option: any) => {
        const m = materialOptions.value.find(p => p.id === option.value)
        if (!m) return false
        return m.code.toLowerCase().includes(input.toLowerCase()) ||
            m.name.toLowerCase().includes(input.toLowerCase())
    }

    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            // Mock data
            let data = [
                {
                    id: '1', code: 'PR-001', name: '壳体加工工艺', materialId: '2', version: 'V1.0', status: 'Active', description: '压铸机加工',
                    steps: [
                        { id: 101, opSeq: 10, opName: '熔炼', workCenter: 'WC-01', description: '铝液熔炼', hasFirstInsp: true, hasPatrolInsp: true, hasFinalInsp: false },
                        { id: 102, opSeq: 20, opName: '压铸', workCenter: 'WC-02', description: '高压压铸', hasFirstInsp: true, hasPatrolInsp: true, hasFinalInsp: false },
                        { id: 103, opSeq: 30, opName: '去毛刺', workCenter: 'WC-03', description: '人工去毛刺', hasFirstInsp: false, hasPatrolInsp: false, hasFinalInsp: true },
                    ]
                },
                {
                    id: '2', code: 'PR-002', name: '电机组装工艺', materialId: '3', version: 'V1.0', status: 'Draft', description: '',
                    steps: [
                        { id: 201, opSeq: 10, opName: '绕线', workCenter: 'WC-10', description: '', hasFirstInsp: true, hasPatrolInsp: false, hasFinalInsp: false },
                        { id: 202, opSeq: 20, opName: '总装', workCenter: 'WC-11', description: '', hasFirstInsp: false, hasPatrolInsp: true, hasFinalInsp: true },
                    ]
                }
            ]

            // Filter
            if (queryParam.code) data = data.filter(i => i.code.includes(queryParam.code))
            if (queryParam.name) data = data.filter(i => i.name.includes(queryParam.name))

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
        queryParam.code = ''
        queryParam.name = ''
        queryParam.material = ''
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'green'
            case 'Draft': return 'orange'
            case 'Obsolete': return 'default'
            default: return 'blue'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'Active': return '生效'
            case 'Draft': return '草稿'
            case 'Obsolete': return '失效'
            default: return status
        }
    }

    // --- Actions ---
    const modalVisible = ref(false)
    const isEdit = ref(false)
    const activeTab = ref('basic')
    const formRef = ref()
    const formState = reactive({
        id: null,
        code: '',
        name: '',
        materialId: undefined as string | undefined,
        version: 'V1.0',
        status: 'Draft',
        description: '',
        steps: [] as any[]
    })

    const rules = {
        code: [{ required: true, message: '请输入路线编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入路线名称', trigger: 'blur' }],
        materialId: [{ required: true, message: '请选择关联物料', trigger: 'change' }]
    }

    const editStepColumns = [
        { title: '序号', dataIndex: 'opSeq', key: 'opSeq', width: 80 },
        { title: '工序名称', dataIndex: 'opName', key: 'opName', width: 150 },
        { title: '工作中心', dataIndex: 'workCenter', key: 'workCenter', width: 120 },
        { title: '检验配置', key: 'inspConfig', width: 180 },
        { title: '工序描述', dataIndex: 'description', key: 'description' },
        { title: '操作', key: 'action', width: 80 }
    ]

    const handleAdd = () => {
        isEdit.value = false
        activeTab.value = 'basic'
        Object.assign(formState, { id: null, code: '', name: '', material: '', version: 'V1.0', status: 'Draft', description: '', steps: [] })
        modalVisible.value = true
    }

    const handleEdit = (record: any) => {
        const item = record.id ? record : tableData.value.find(i => i.id === selectedRowKeys.value[0])
        if (!item) return

        isEdit.value = true
        activeTab.value = 'basic'
        // Deep copy for steps
        Object.assign(formState, { ...item, steps: item.steps.map((s: any) => ({ ...s })) })
        modalVisible.value = true
    }

    // 跳转到查看页面
    const handleView = (record: any) => {
        router.push(`/basic-data/process-route/view/${record.id}`)
    }

    // 跳转到编辑页面
    const handleEditPage = (record: any) => {
        router.push(`/basic-data/process-route/edit/${record.id}`)
    }

    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除工艺路线 ${record.name} 吗？`,
            okType: 'danger',
            onOk() {
                tableData.value = tableData.value.filter(i => i.id !== record.id)
                message.success('删除成功')
            }
        })
    }

    const handleBatchDelete = () => {
        Modal.confirm({
            title: '确认批量删除',
            content: `确定删除选中的 ${selectedRowKeys.value.length} 条记录吗？`,
            okType: 'danger',
            onOk() {
                tableData.value = tableData.value.filter(i => !selectedRowKeys.value.includes(i.id))
                selectedRowKeys.value = []
                message.success('删除成功')
            }
        })
    }

    const handleSave = () => {
        formRef.value.validate().then(() => {
            if (isEdit.value) {
                const idx = tableData.value.findIndex(i => i.id === formState.id)
                if (idx > -1) Object.assign(tableData.value[idx], { ...formState, steps: [...formState.steps] })
            } else {
                tableData.value.push({ ...formState, steps: [...formState.steps], id: Date.now().toString() })
            }
            message.success('保存成功')
            modalVisible.value = false
            loadData()
        })
    }

    const handleExport = () => {
        message.success('导出任务已开始')
    }

    // --- Step Actions ---
    const handleAddStep = () => {
        formState.steps.push({
            id: Date.now(),
            opSeq: (formState.steps.length + 1) * 10,
            opName: '',
            workCenter: '',
            description: ''
        })
    }

    const handleRemoveStep = (index: number) => {
        formState.steps.splice(index, 1)
    }

    // --- 工序检验配置 ---
    const inspConfigModalVisible = ref(false)
    const currentOperation = reactive({ id: '', opSeq: 0, opName: '', routeId: '' })

    const handleConfigInsp = (record: any) => {
        Object.assign(currentOperation, {
            id: String(record.id),
            opSeq: record.opSeq,
            opName: record.opName,
            routeId: formState.id || ''
        })
        inspConfigModalVisible.value = true
    }

    const handleSaveInspConfig = (data: any) => {
        // 更新工序的检验配置状态
        const step = formState.steps.find(s => String(s.id) === data.operationId)
        if (step) {
            step.hasFirstInsp = data.firstInspPlans.length > 0
            step.hasPatrolInsp = data.patrolInspPlans.length > 0
            step.hasFinalInsp = data.finalInspPlans.length > 0
        }
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