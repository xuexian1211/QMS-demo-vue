<template>
    <div class="page-container">
        <div class="toolbar">
            <a-space>
                <a-button type="primary" @click="handleAdd">
                    <template #icon>
                        <PlusOutlined />
                    </template>新增
                </a-button>
                <a-button :disabled="selectedRowKeys.length !== 1 || !canEditSelected" @click="handleEdit">
                    <template #icon>
                        <EditOutlined />
                    </template>编辑
                </a-button>
                <a-button danger :disabled="selectedRowKeys.length === 0 || !canDeleteSelected"
                    @click="handleBatchDelete">
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
                        <a-form-item label="分类">
                            <a-select v-model:value="queryParam.category" style="width: 100%" allow-clear
                                placeholder="请选择">
                                <a-select-option value="dimension">尺寸</a-select-option>
                                <a-select-option value="appearance">外观</a-select-option>
                                <a-select-option value="physical_chemical">理化</a-select-option>
                                <a-select-option value="functional">功能</a-select-option>
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
                        <a-form-item label="数据类型">
                            <a-select v-model:value="queryParam.dataType" style="width: 100%" allow-clear
                                placeholder="请选择">
                                <a-select-option value="quantitative">计量型</a-select-option>
                                <a-select-option value="qualitative">计数型</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="6">
                        <a-form-item label="所属组织">
                            <a-select v-model:value="queryParam.orgIds" style="width: 100%" allow-clear
                                placeholder="请选择" mode="multiple" :max-tag-count="2">
                                <a-select-option v-for="org in orgOptions" :key="org.id" :value="org.id">
                                    {{ org.name }}
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="6">
                        <a-form-item label="状态">
                            <a-select v-model:value="queryParam.status" style="width: 100%" allow-clear
                                placeholder="请选择">
                                <a-select-option value="enabled">启用</a-select-option>
                                <a-select-option value="disabled">禁用</a-select-option>
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
                    <!-- 所属组织列 -->
                    <template v-if="column.key === 'orgId'">
                        <a-tag :color="getOrgColor(record.orgId)">
                            {{ getOrgName(record.orgId) }}
                        </a-tag>
                    </template>
                    <!-- 分类列 -->
                    <template v-else-if="column.key === 'category'">
                        <span>{{ getCategoryLabel(record.category) }}</span>
                    </template>
                    <!-- 数据类型列 -->
                    <template v-else-if="column.key === 'dataType'">
                        <a-tag :color="record.dataType === 'quantitative' ? 'blue' : 'purple'">
                            {{ record.dataType === 'quantitative' ? '计量型' : '计数型' }}
                        </a-tag>
                    </template>
                    <!-- SPC/实验室标记 -->
                    <template v-else-if="column.key === 'flags'">
                        <a-space>
                            <a-tag v-if="record.isSpcDefault" color="green">SPC</a-tag>
                            <a-tag v-if="record.isLabTestDefault" color="orange">实验室</a-tag>
                        </a-space>
                    </template>
                    <!-- 状态列 -->
                    <template v-else-if="column.key === 'status'">
                        <a-tag :color="record.status === 'enabled' ? 'success' : 'default'">
                            {{ record.status === 'enabled' ? '启用' : '禁用' }}
                        </a-tag>
                    </template>
                    <!-- 操作列 -->
                    <template v-else-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
                            <a-divider type="vertical" />
                            <a-button type="link" size="small" @click="handleEdit(record)"
                                :disabled="!canEdit(record)">编辑</a-button>
                            <a-divider type="vertical" />
                            <a-button type="link" danger size="small" @click="handleDelete(record)"
                                :disabled="!canEdit(record)">删除</a-button>
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
                                        <a-select-option value="quantitative">计量型</a-select-option>
                                        <a-select-option value="qualitative">计数型</a-select-option>
                                    </a-select>
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="单位" name="uom">
                                    <a-input v-model:value="formState.uom" placeholder="计量型必填"
                                        :disabled="formState.dataType === 'qualitative'" />
                                </a-form-item>
                            </a-col>
                        </a-row>
                        <a-form-item label="检验方法" name="defaultMethodId">
                            <a-input v-model:value="formState.defaultMethodName" placeholder="关联检验方法" />
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
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { message, Modal } from 'ant-design-vue'
    import {
        PlusOutlined, EditOutlined, DeleteOutlined,
        ExportOutlined, ReloadOutlined, DownOutlined, UpOutlined
    } from '@ant-design/icons-vue'
    import { useExport } from '@/utils/excel'
    import type { InspectionItemCategory } from '@/types'

    const router = useRouter()

    // --- 模拟当前用户组织 ---
    // NOTE: 实际应从全局状态获取
    const currentOrgId = ref < string | null > ('1') // 模拟工厂用户，null 代表集团用户

    // --- Search & Table ---
    const loading = ref(false)
    const searchExpanded = ref(false)
    const tableData = ref < any[] > ([])
    const selectedRowKeys = ref < string[] > ([])
    // --- 组织选项（Mock） ---
    const orgOptions = ref([
        { id: 'GROUP', name: '集团', color: 'gold' },
        { id: '1', name: '合肥工厂', color: 'blue' },
        { id: '2', name: '芜湖工厂', color: 'green' }
    ])

    /** 获取组织名称 */
    const getOrgName = (orgId: string | null) => {
        if (orgId === null) return '集团'
        const org = orgOptions.value.find(o => o.id === orgId)
        return org ? org.name : orgId
    }

    /** 获取组织标签颜色 */
    const getOrgColor = (orgId: string | null) => {
        if (orgId === null) return 'gold'
        const org = orgOptions.value.find(o => o.id === orgId)
        return org ? org.color : 'default'
    }

    const queryParam = reactive({
        code: '',
        name: '',
        category: undefined as InspectionItemCategory | undefined,
        dataType: undefined as 'quantitative' | 'qualitative' | undefined,
        orgIds: [] as string[],  // 改为数组，支持多选
        status: undefined as 'enabled' | 'disabled' | undefined
    })

    const pagination = reactive({
        current: 1,
        pageSize: 20,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true
    })

    const columns = [
        { title: '项目编码', dataIndex: 'code', key: 'code', width: 120 },
        { title: '项目名称', dataIndex: 'name', key: 'name', width: 150 },
        { title: '所属组织', dataIndex: 'orgId', key: 'orgId', width: 90 },
        { title: '分类', dataIndex: 'category', key: 'category', width: 80 },
        { title: '数据类型', dataIndex: 'dataType', key: 'dataType', width: 90 },
        { title: '单位', dataIndex: 'uom', key: 'uom', width: 60 },
        { title: '默认方法', dataIndex: 'defaultMethodName', key: 'defaultMethodName', width: 120, ellipsis: true },
        { title: '标记', key: 'flags', width: 100 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 70 },
        { title: '操作', key: 'action', width: 180, fixed: 'right' }
    ]

    /** 分类标签映射 */
    const getCategoryLabel = (category: InspectionItemCategory) => {
        const map: Record<InspectionItemCategory, string> = {
            dimension: '尺寸',
            appearance: '外观',
            physical_chemical: '理化',
            functional: '功能'
        }
        return map[category] || category
    }

    /** 判断当前用户是否可以编辑该记录（集团项目对工厂用户只读） */
    const canEdit = (record: any) => {
        // 集团用户可以编辑所有
        if (currentOrgId.value === null) return true
        // 工厂用户只能编辑本地项目
        return record.orgId !== null
    }

    /** 判断选中的项目是否可编辑 */
    const canEditSelected = computed(() => {
        if (selectedRowKeys.value.length !== 1) return false
        const record = tableData.value.find(i => i.id === selectedRowKeys.value[0])
        return record ? canEdit(record) : false
    })

    /** 判断选中的项目是否可删除 */
    const canDeleteSelected = computed(() => {
        if (selectedRowKeys.value.length === 0) return false
        return selectedRowKeys.value.every(id => {
            const record = tableData.value.find(i => i.id === id)
            return record ? canEdit(record) : false
        })
    })

    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            // Mock data - 增强版数据（包含集团、合肥工厂、芜湖工厂）
            let data = [
                // 集团标准（orgId = null）
                { id: '1', orgId: null, code: 'ITEM-G-LENGTH', name: '长度检测', category: 'dimension' as InspectionItemCategory, dataType: 'quantitative', uom: 'mm', defaultMethodId: '101', defaultMethodName: '卡尺测量法', isSpcDefault: true, isLabTestDefault: false, description: '集团标准长度检测项目', status: 'enabled' },
                { id: '2', orgId: null, code: 'ITEM-G-HARDNESS', name: '洛氏硬度', category: 'physical_chemical' as InspectionItemCategory, dataType: 'quantitative', uom: 'HRC', defaultMethodId: '102', defaultMethodName: '硬度计测量', isSpcDefault: true, isLabTestDefault: true, description: '集团标准硬度检测', status: 'enabled' },
                // 合肥工厂（orgId = '1'）
                { id: '3', orgId: '1', code: 'ITEM-HF-SURFACE', name: '表面外观检查', category: 'appearance' as InspectionItemCategory, dataType: 'qualitative', uom: '', defaultMethodId: '103', defaultMethodName: '目视检查', isSpcDefault: false, isLabTestDefault: false, description: '合肥工厂本地外观检查', status: 'enabled' },
                { id: '4', orgId: '1', code: 'ITEM-HF-COATING', name: '涂层厚度', category: 'dimension' as InspectionItemCategory, dataType: 'quantitative', uom: 'μm', defaultMethodId: '104', defaultMethodName: '涂层测厚仪', isSpcDefault: true, isLabTestDefault: false, description: '合肥工厂专用涂层检测', status: 'enabled' },
                { id: '5', orgId: '1', code: 'ITEM-HF-SALT', name: '盐雾测试', category: 'functional' as InspectionItemCategory, dataType: 'qualitative', uom: '', defaultMethodId: '105', defaultMethodName: '盐雾试验法', isSpcDefault: false, isLabTestDefault: true, description: '合肥工厂特殊测试项目', status: 'disabled' },
                // 芜湖工厂（orgId = '2'）
                { id: '6', orgId: '2', code: 'ITEM-WH-TORQUE', name: '扭矩检测', category: 'functional' as InspectionItemCategory, dataType: 'quantitative', uom: 'N·m', defaultMethodId: '106', defaultMethodName: '扭矩扳手测量', isSpcDefault: true, isLabTestDefault: false, description: '芜湖工厂扭矩检测项目', status: 'enabled' },
                { id: '7', orgId: '2', code: 'ITEM-WH-WEIGHT', name: '重量检测', category: 'dimension' as InspectionItemCategory, dataType: 'quantitative', uom: 'g', defaultMethodId: '107', defaultMethodName: '电子秤称重', isSpcDefault: false, isLabTestDefault: false, description: '芜湖工厂重量检测项目', status: 'enabled' },
            ]

            // 过滤逻辑
            if (queryParam.code) data = data.filter(i => i.code.toLowerCase().includes(queryParam.code.toLowerCase()))
            if (queryParam.name) data = data.filter(i => i.name.includes(queryParam.name))
            if (queryParam.category) data = data.filter(i => i.category === queryParam.category)
            if (queryParam.dataType) data = data.filter(i => i.dataType === queryParam.dataType)
            if (queryParam.status) data = data.filter(i => i.status === queryParam.status)
            // 多选组织过滤
            if (queryParam.orgIds && queryParam.orgIds.length > 0) {
                data = data.filter(i => {
                    // GROUP 代表集团（orgId = null）
                    if (queryParam.orgIds.includes('GROUP') && i.orgId === null) return true
                    // 其他 ID 代表具体工厂
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
        queryParam.code = ''
        queryParam.name = ''
        queryParam.category = undefined
        queryParam.dataType = undefined
        queryParam.orgIds = []
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

    // --- Actions ---
    const modalVisible = ref(false)
    const isEdit = ref(false)
    const activeTab = ref('basic')
    const formRef = ref()
    const formState = reactive({
        id: null as string | null,
        code: '',
        name: '',
        category: 'dimension' as InspectionItemCategory,
        dataType: 'quantitative' as 'quantitative' | 'qualitative',
        uom: '',
        defaultMethodId: '',
        defaultMethodName: '',
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
        if (!canEdit(item)) {
            message.warning('集团标准项目不可编辑')
            return
        }
        router.push(`/inspection-model/inspection-items/edit/${item.id}`)
    }

    const handleDelete = (record: any) => {
        if (!canEdit(record)) {
            message.warning('集团标准项目不可删除')
            return
        }
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
        if (!canDeleteSelected.value) {
            message.warning('选中的项目中包含集团标准，不可删除')
            return
        }
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
            { title: '所属组织', dataIndex: 'orgId', formatter: (v: string | null) => v ? '本地' : '集团' },
            { title: '分类', dataIndex: 'category', formatter: getCategoryLabel },
            { title: '数据类型', dataIndex: 'dataType', formatter: (v: string) => v === 'quantitative' ? '计量型' : '计数型' },
            { title: '单位', dataIndex: 'uom' },
            { title: '默认方法', dataIndex: 'defaultMethodName' },
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