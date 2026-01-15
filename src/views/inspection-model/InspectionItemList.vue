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
            <a-form :model="queryParam" :label-col="{ span: 24 }" :wrapper-col="{ span: 24 }">
                <a-row :gutter="16">
                    <a-col :span="6">
                        <a-form-item label="项目编码">
                            <a-input v-model:value="queryParam.code" placeholder="请输入" allow-clear />
                        </a-form-item>
                    </a-col>
                    <a-col :span="6">
                        <a-form-item label="项目名称">
                            <a-input v-model:value="queryParam.name" placeholder="请输入" allow-clear />
                        </a-form-item>
                    </a-col>
                    <a-col :span="6">
                        <a-form-item label="数据类型">
                            <a-select v-model:value="queryParam.dataType" style="width: 100%" allow-clear
                                placeholder="请选择">
                                <a-select-option value="Quantitative">计量型</a-select-option>
                                <a-select-option value="Qualitative">计数型</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="6">
                        <a-form-item label=" " :colon="false">
                            <a-space>
                                <a-button type="primary" @click="handleSearch">查询</a-button>
                                <a-button @click="handleReset">重置</a-button>
                                <a @click="searchExpanded = !searchExpanded" style="line-height: 32px;">
                                    {{ searchExpanded ? '收起' : '展开' }}
                                    <DownOutlined v-if="!searchExpanded" />
                                    <UpOutlined v-else />
                                </a>
                            </a-space>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="16" v-show="searchExpanded">
                    <a-col :span="6">
                        <a-form-item label="检验方法">
                            <a-input v-model:value="queryParam.method" placeholder="请输入" allow-clear />
                        </a-form-item>
                    </a-col>
                    <a-col :span="6">
                        <a-form-item label="单位">
                            <a-input v-model:value="queryParam.unit" placeholder="请输入" allow-clear />
                        </a-form-item>
                    </a-col>
                    <a-col :span="6">
                        <a-form-item label="创建时间">
                            <a-range-picker v-model:value="queryParam.createTimeRange" style="width: 100%" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="6">
                        <a-form-item label="状态">
                            <a-select v-model:value="queryParam.status" style="width: 100%" allow-clear
                                placeholder="请选择">
                                <a-select-option value="1">启用</a-select-option>
                                <a-select-option value="0">禁用</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>
        </a-card>

        <div class="table-container">
            <a-table :columns="columns" :data-source="tableData" :loading="loading" row-key="id" size="middle"
                :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }" :pagination="pagination"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'dataType'">
                        <a-tag :color="record.dataType === 'Quantitative' ? 'blue' : 'purple'">
                            {{ record.dataType === 'Quantitative' ? '计量型' : '计数型' }}
                        </a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
                            <a-divider type="vertical" />
                            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
                            <a-divider type="vertical" />
                            <a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </div>

        <!-- Edit Modal -->
        <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑检验项目' : '新增检验项目'" width="600px" @ok="handleSave">
            <a-tabs v-model:activeKey="activeTab">
                <a-tab-pane key="basic" tab="基本信息">
                    <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
                        <a-row :gutter="16">
                            <a-col :span="12">
                                <a-form-item label="项目编码" name="code">
                                    <a-input v-model:value="formState.code" placeholder="请输入" :disabled="isEdit" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="项目名称" name="name">
                                    <a-input v-model:value="formState.name" placeholder="请输入" />
                                </a-form-item>
                            </a-col>
                        </a-row>
                        <a-row :gutter="16">
                            <a-col :span="12">
                                <a-form-item label="数据类型" name="dataType">
                                    <a-select v-model:value="formState.dataType">
                                        <a-select-option value="Quantitative">计量型</a-select-option>
                                        <a-select-option value="Qualitative">计数型</a-select-option>
                                    </a-select>
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="单位" name="unit">
                                    <a-input v-model:value="formState.unit" placeholder="计量型必填"
                                        :disabled="formState.dataType === 'Qualitative'" />
                                </a-form-item>
                            </a-col>
                        </a-row>
                        <a-form-item label="检验方法" name="method">
                            <a-input v-model:value="formState.method" placeholder="关联检验方法" />
                        </a-form-item>
                        <a-form-item label="描述" name="description">
                            <a-textarea v-model:value="formState.description" :rows="3" />
                        </a-form-item>
                    </a-form>
                </a-tab-pane>

                <a-tab-pane key="phenomenon" tab="关联不良现象">
                    <div style="margin-bottom: 8px;">
                        <a-button type="dashed" block @click="openDefectSelector">
                            <PlusOutlined /> 添加关联不良现象
                        </a-button>
                    </div>
                    <a-table :columns="relatedDefectColumns" :data-source="relatedDefects" :pagination="false"
                        size="small" row-key="id">
                        <template #bodyCell="{ column, record, index }">
                            <template v-if="column.key === 'severity'">
                                <a-tag :color="getSeverityColor(record.severity)">{{ record.severity }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="editDefectRelation(record)">编辑</a-button>
                                    <a-button type="link" danger size="small"
                                        @click="removeDefect(record.id)">移除</a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                    <a-empty v-if="relatedDefects.length === 0" description="尚未关联任何不良现象，点击上方按钮添加" />
                </a-tab-pane>
            </a-tabs>
        </a-modal>

        <!-- 缺陷选择器模态框 -->
        <a-modal v-model:visible="defectSelectorVisible" title="选择不良现象" width="600px" @ok="confirmDefectSelection">
            <a-table :columns="defectColumns" :data-source="availableDefects" :loading="defectLoading" row-key="id"
                size="small" :row-selection="{ selectedRowKeys: selectedDefectKeys, onChange: onDefectSelectChange }">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'severity'">
                        <a-tag :color="getSeverityColor(record.severity)">{{ record.severity }}</a-tag>
                    </template>
                </template>
            </a-table>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { message, Modal } from 'ant-design-vue'
    import {
        PlusOutlined, EditOutlined, DeleteOutlined,
        ExportOutlined, ReloadOutlined, DownOutlined, UpOutlined
    } from '@ant-design/icons-vue'
    import { useExport } from '@/utils/excel'

    const router = useRouter()

    // --- Search & Table ---
    const loading = ref(false)
    const searchExpanded = ref(false)
    const tableData = ref < any[] > ([])
    const selectedRowKeys = ref < string[] > ([])
    const queryParam = reactive({
        code: '',
        name: '',
        dataType: undefined,
        method: '',
        unit: '',
        createTimeRange: undefined,
        status: undefined
    })

    const pagination = reactive({
        current: 1,
        pageSize: 20,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true
    })

    const columns = [
        { title: '项目编码', dataIndex: 'code', key: 'code', width: 150 },
        { title: '项目名称', dataIndex: 'name', key: 'name', width: 200 },
        { title: '数据类型', dataIndex: 'dataType', key: 'dataType', width: 100 },
        { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
        { title: '检验方法', dataIndex: 'method', key: 'method', width: 150 },
        { title: '描述', dataIndex: 'description', key: 'description' },
        { title: '操作', key: 'action', width: 200, fixed: 'right' }
    ]

    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            // Mock data
            let data = [
                { id: '1', code: 'I-001', name: '长度', dataType: 'Quantitative', unit: 'mm', method: '卡尺测量', description: '测量工件长度' },
                { id: '2', code: 'I-002', name: '外观', dataType: 'Qualitative', unit: '', method: '目视', description: '检查表面是否有划痕' },
                { id: '3', code: 'I-003', name: '硬度', dataType: 'Quantitative', unit: 'HRC', method: '硬度计', description: '表面硬度' },
            ]

            // Filter
            if (queryParam.code) data = data.filter(i => i.code.includes(queryParam.code))
            if (queryParam.name) data = data.filter(i => i.name.includes(queryParam.name))
            if (queryParam.dataType) data = data.filter(i => i.dataType === queryParam.dataType)

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
        queryParam.dataType = undefined
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
    const activeTab = ref('basic')
    const formRef = ref()
    const formState = reactive({
        id: null,
        code: '',
        name: '',
        dataType: 'Quantitative',
        unit: '',
        method: '',
        description: ''
    })

    const rules = {
        code: [{ required: true, message: '请输入项目编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
        dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }]
    }

    const handleAdd = () => {
        router.push('/inspection-model/inspection-items/create')
    }

    const handleView = (record: any) => {
        router.push(`/inspection-model/inspection-items/view/${record.id}`)
    }

    const handleEdit = (record: any) => {
        const item = record.id ? record : tableData.value.find(i => i.id === selectedRowKeys.value[0])
        if (!item) return
        router.push(`/inspection-model/inspection-items/edit/${item.id}`)
    }

    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除检验项目 ${record.name} 吗？`,
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
            { title: '项目编码', dataIndex: 'code' },
            { title: '项目名称', dataIndex: 'name' },
            { title: '数据类型', dataIndex: 'dataType' },
            { title: '单位', dataIndex: 'unit' },
            { title: '检验方法', dataIndex: 'method' },
            { title: '描述', dataIndex: 'description' }
        ]
        const { exportToCSV } = useExport()
        exportToCSV(tableData.value, exportColumns, '检验项目')
        message.success('导出成功')
    }

    onMounted(() => {
        loadData()
    })

    // --- 关联不良现象功能 ---
    const relatedDefects = ref < any[] > ([])
    const defectSelectorVisible = ref(false)
    const defectLoading = ref(false)
    const availableDefects = ref < any[] > ([])
    const selectedDefectKeys = ref < string[] > ([])

    const defectColumns = [
        { title: '现象代码', dataIndex: 'code', key: 'code', width: 100 },
        { title: '现象名称', dataIndex: 'name', key: 'name', width: 150 },
        { title: '严重等级', dataIndex: 'severity', key: 'severity', width: 80 },
        { title: '描述', dataIndex: 'description', key: 'description' }
    ]

    // 关联缺陷表格列定义
    const relatedDefectColumns = [
        { title: '现象代码', dataIndex: 'code', key: 'code', width: 100 },
        { title: '现象名称', dataIndex: 'name', key: 'name', width: 150 },
        { title: '严重等级', dataIndex: 'severity', key: 'severity', width: 80 },
        { title: '描述', dataIndex: 'description', key: 'description' },
        { title: '操作', key: 'action', width: 120 }
    ]

    // 编辑关联
    const editDefectRelation = (record: any) => {
        message.info(`编辑关联: ${record.name}`)
    }

    const getSeverityColor = (level: string) => {
        switch (level) {
            case 'CR': return 'red'
            case 'MA': return 'orange'
            case 'MI': return 'blue'
            default: return 'default'
        }
    }

    const openDefectSelector = () => {
        defectLoading.value = true
        // 加载可用缺陷列表（模拟数据）
        setTimeout(() => {
            availableDefects.value = [
                { id: '101', code: 'DEF-001', name: '表面划伤', severity: 'MI', description: '可见划痕' },
                { id: '102', code: 'DEF-002', name: '气孔', severity: 'MA', description: '表面密集气孔' },
                { id: '103', code: 'DEF-003', name: '裂纹', severity: 'CR', description: '产品裂纹' },
                { id: '104', code: 'DEF-004', name: '变形', severity: 'MA', description: '产品变形' },
                { id: '105', code: 'DEF-005', name: '色差', severity: 'MI', description: '颜色不均匀' }
            ]
            // 过滤已关联的缺陷
            const relatedIds = relatedDefects.value.map(d => d.id)
            availableDefects.value = availableDefects.value.filter(d => !relatedIds.includes(d.id))
            selectedDefectKeys.value = []
            defectLoading.value = false
        }, 300)
        defectSelectorVisible.value = true
    }

    const onDefectSelectChange = (keys: string[]) => {
        selectedDefectKeys.value = keys
    }

    const confirmDefectSelection = () => {
        const selected = availableDefects.value.filter(d => selectedDefectKeys.value.includes(d.id))
        relatedDefects.value.push(...selected)
        defectSelectorVisible.value = false
        message.success(`已添加 ${selected.length} 个关联缺陷`)
    }

    const removeDefect = (defectId: string) => {
        relatedDefects.value = relatedDefects.value.filter(d => d.id !== defectId)
    }
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

    .defect-tab-content {
        padding: 8px 0;
    }

    .defect-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .defect-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
</style>