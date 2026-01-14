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
                <a-form-item label="物料编码">
                    <a-input v-model:value="queryParam.code" placeholder="请输入" allow-clear />
                </a-form-item>
                <a-form-item label="物料名称">
                    <a-input v-model:value="queryParam.name" placeholder="请输入" allow-clear />
                </a-form-item>
                <a-form-item label="物料分类">
                    <a-select v-model:value="queryParam.category" style="width: 150px" allow-clear placeholder="请选择">
                        <a-select-option value="Raw">原材料</a-select-option>
                        <a-select-option value="Semi">半成品</a-select-option>
                        <a-select-option value="Finish">成品</a-select-option>
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
                    <template v-if="column.key === 'routeCount'">
                        <a-button type="link" size="small" @click="handleViewRoutes(record)">
                            {{ record.routeCount || 0 }}
                        </a-button>
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
            </a-table>
        </div>

        <!-- Edit Modal -->
        <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑物料档案' : '新增物料档案'" width="700px" @ok="handleSave">
            <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="物料编码" name="code">
                            <a-input v-model:value="formState.code" placeholder="请输入" :disabled="isEdit" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="物料名称" name="name">
                            <a-input v-model:value="formState.name" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="物料分类" name="category">
                            <a-select v-model:value="formState.category" placeholder="请选择">
                                <a-select-option value="Raw">原材料</a-select-option>
                                <a-select-option value="Semi">半成品</a-select-option>
                                <a-select-option value="Finish">成品</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="单位" name="unit">
                            <a-input v-model:value="formState.unit" placeholder="如：kg, pcs" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="规格型号" name="spec">
                            <a-input v-model:value="formState.spec" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="来源" name="source">
                            <a-select v-model:value="formState.source">
                                <a-select-option value="Make">自制</a-select-option>
                                <a-select-option value="Buy">外购</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-form-item label="备注" name="remark">
                    <a-textarea v-model:value="formState.remark" :rows="3" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 检验规格抽屉 -->
        <MaterialSpecDrawer v-model:visible="specDrawerVisible" :materialInfo="currentMaterial" />

        <!-- 工艺路线抽屉 -->
        <MaterialRouteDrawer v-model:visible="routeDrawerVisible" :materialInfo="currentMaterial" />

        <!-- 检验方案抽屉 -->
        <MaterialInspPlanDrawer v-model:visible="inspPlanDrawerVisible" :materialInfo="currentMaterial"
            :inspType="currentInspType" />
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted } from 'vue'
    import { message, Modal } from 'ant-design-vue'
    import {
        PlusOutlined, EditOutlined, DeleteOutlined,
        ExportOutlined, ReloadOutlined, DownOutlined
    } from '@ant-design/icons-vue'
    import { useRouter } from 'vue-router'
    import MaterialSpecDrawer from '@/components/MaterialSpecDrawer.vue'
    import MaterialRouteDrawer from '@/components/MaterialRouteDrawer.vue'
    import MaterialInspPlanDrawer from '@/components/MaterialInspPlanDrawer.vue'
    import { useExport } from '@/utils/excel'

    const router = useRouter()

    // --- Search & Table ---
    const loading = ref(false)
    const tableData = ref < any[] > ([])
    const selectedRowKeys = ref < string[] > ([])
    const queryParam = reactive({
        code: '',
        name: '',
        category: undefined
    })

    const pagination = reactive({
        current: 1,
        pageSize: 20,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true
    })

    const columns = [
        { title: '物料编码', dataIndex: 'code', key: 'code', width: 120 },
        { title: '物料名称', dataIndex: 'name', key: 'name', width: 150 },
        { title: '规格型号', dataIndex: 'spec', key: 'spec', width: 120 },
        { title: '分类', dataIndex: 'category', key: 'category', width: 80 },
        { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
        { title: '来源', dataIndex: 'source', key: 'source', width: 60 },
        { title: '工艺路线数', key: 'routeCount', width: 100 },
        { title: '操作', key: 'action', width: 280, fixed: 'right' }
    ]

    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            // Mock data
            let data = [
                { id: '1', code: 'M001', name: '铝锭', spec: 'ADC12', category: 'Raw', unit: 'kg', source: 'Buy', routeCount: 1 },
                { id: '2', code: 'P001', name: '发动机壳体', spec: 'V1.0', category: 'Semi', unit: 'pcs', source: 'Make', routeCount: 2 },
                { id: '3', code: 'F001', name: '电动车电机', spec: '500W', category: 'Finish', unit: 'set', source: 'Make', routeCount: 0 },
            ]

            // Filter
            if (queryParam.code) data = data.filter(i => i.code.includes(queryParam.code))
            if (queryParam.name) data = data.filter(i => i.name.includes(queryParam.name))
            if (queryParam.category) data = data.filter(i => i.category === queryParam.category)

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
        queryParam.category = undefined
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

    // --- Actions ---
    const modalVisible = ref(false)
    const isEdit = ref(false)
    const formRef = ref()
    const formState = reactive({
        id: null,
        code: '',
        name: '',
        spec: '',
        category: undefined,
        unit: '',
        source: 'Buy',
        remark: ''
    })

    const rules = {
        code: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
        category: [{ required: true, message: '请选择分类', trigger: 'change' }]
    }

    const handleAdd = () => {
        isEdit.value = false
        Object.assign(formState, { id: null, code: '', name: '', spec: '', category: undefined, unit: '', source: 'Buy', remark: '' })
        modalVisible.value = true
    }

    const handleEdit = (record: any) => {
        // If clicked from row, record is passed. If from toolbar, finding from selection
        const item = record.id ? record : tableData.value.find(i => i.id === selectedRowKeys.value[0])
        if (!item) return

        isEdit.value = true
        Object.assign(formState, { ...item })
        modalVisible.value = true
    }

    // 跳转到查看页面
    const handleView = (record: any) => {
        router.push(`/basic-data/material/view/${record.id}`)
    }

    // 跳转到编辑页面
    const handleEditPage = (record: any) => {
        router.push(`/basic-data/material/edit/${record.id}`)
    }

    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除物料 ${record.name} 吗？`,
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
                if (idx > -1) Object.assign(tableData.value[idx], formState)
            } else {
                tableData.value.push({ ...formState, id: Date.now().toString() })
            }
            message.success('保存成功')
            modalVisible.value = false
            loadData()
        })
    }

    const handleExport = () => {
        if (tableData.value.length === 0) {
            message.warning('暂无数据可导出')
            return
        }
        const exportColumns = [
            { title: '物料编码', dataIndex: 'code' },
            { title: '物料名称', dataIndex: 'name' },
            { title: '规格型号', dataIndex: 'spec' },
            { title: '分类', dataIndex: 'category' },
            { title: '单位', dataIndex: 'unit' },
            { title: '来源', dataIndex: 'source' }
        ]
        const { exportToCSV } = useExport()
        exportToCSV(tableData.value, exportColumns, '物料档案')
        message.success('导出成功')
    }

    // --- 检验规格抽屉 ---
    const specDrawerVisible = ref(false)
    const currentMaterial = reactive({ id: '', code: '', name: '' })

    const handleViewSpec = (record: any) => {
        Object.assign(currentMaterial, { id: record.id, code: record.code, name: record.name })
        specDrawerVisible.value = true
    }

    // --- 工艺路线抽屉 ---
    const routeDrawerVisible = ref(false)

    const handleViewRoutes = (record: any) => {
        Object.assign(currentMaterial, { id: record.id, code: record.code, name: record.name })
        routeDrawerVisible.value = true
    }

    // --- 检验方案抽屉 ---
    const inspPlanDrawerVisible = ref(false)
    const currentInspType = ref < 'IQC' | 'FQC' | 'OQC' > ('IQC')

    const handleInspConfigClick = (record: any, key: string) => {
        Object.assign(currentMaterial, { id: record.id, code: record.code, name: record.name })
        if (key === 'spec') {
            specDrawerVisible.value = true
        } else {
            currentInspType.value = key as 'IQC' | 'FQC' | 'OQC'
            inspPlanDrawerVisible.value = true
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