<template>
    <div class="page-container">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-left">
                <a-button type="text" @click="handleBack" class="back-button">
                    <template #icon>
                        <ArrowLeftOutlined />
                    </template>
                    返回
                </a-button>
                <div class="title-section">
                    <h2 class="page-title">{{ pageTitle }}</h2>
                    <a-tag v-if="form.dataType" :color="getDataTypeColor(form.dataType)">
                        {{ getDataTypeText(form.dataType) }}
                    </a-tag>
                </div>
            </div>
            <div class="header-actions" v-if="!isView">
                <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
            </div>
        </div>

        <!-- 基本信息 -->
        <a-card class="form-card" title="基本信息">
            <a-form ref="formRef" :model="form" :rules="rules" layout="horizontal" :label-col="{ span: 6 }"
                :wrapper-col="{ span: 16 }">
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="项目编码" name="code">
                            <a-input v-model:value="form.code" :disabled="isView || isEdit" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="项目名称" name="name">
                            <a-input v-model:value="form.name" :disabled="isView" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="数据类型" name="dataType">
                            <a-select v-model:value="form.dataType" :disabled="isView" placeholder="请选择">
                                <a-select-option value="QUANTITATIVE">计量型</a-select-option>
                                <a-select-option value="QUALITATIVE">计数型</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="检验方法" name="method">
                            <a-input v-model:value="form.method" :disabled="isView" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="检验工具" name="tool">
                            <a-input v-model:value="form.tool" :disabled="isView" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="16">
                        <a-form-item label="描述" name="description" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
                            <a-textarea v-model:value="form.description" :disabled="isView" :rows="2"
                                placeholder="请输入描述" />
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>
        </a-card>

        <!-- Tab页签 -->
        <a-card class="tab-card">
            <a-tabs v-model:activeKey="activeTab">
                <!-- 关联不良现象Tab -->
                <a-tab-pane key="defects" tab="关联不良现象">
                    <div class="tab-toolbar" v-if="!isView">
                        <a-button type="primary" size="small" @click="openDefectSelector">
                            <PlusOutlined /> 添加关联
                        </a-button>
                    </div>
                    <a-table :columns="defectColumns" :data-source="form.relatedDefects" row-key="id" size="small"
                        :pagination="false">
                        <template #bodyCell="{ column, record, index }">
                            <template v-if="column.key === 'severity'">
                                <a-tag :color="getSeverityColor(record.severity)">{{ record.severity }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-button v-if="!isView" type="link" danger size="small"
                                    @click="handleRemoveDefect(index)">移除</a-button>
                            </template>
                        </template>
                    </a-table>
                    <a-empty v-if="form.relatedDefects.length === 0" description="暂无关联不良现象，请添加" />
                </a-tab-pane>
            </a-tabs>
        </a-card>

        <!-- 缺陷选择器弹窗 -->
        <a-modal v-model:visible="defectSelectorVisible" title="选择不良现象" width="600px" @ok="confirmDefectSelection">
            <a-table :columns="selectorDefectColumns" :data-source="availableDefects" :loading="defectLoading"
                row-key="id" size="small"
                :row-selection="{ selectedRowKeys: selectedDefectKeys, onChange: onDefectSelectChange }">
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
    import { useRoute, useRouter } from 'vue-router'
    import { message } from 'ant-design-vue'
    import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons-vue'

    const router = useRouter()
    const route = useRoute()

    // --- 页面状态 ---
    const formRef = ref()
    const saving = ref(false)
    const activeTab = ref('defects')

    const isView = computed(() => route.path.includes('/view/'))
    const isEdit = computed(() => route.path.includes('/edit/'))
    const pageTitle = computed(() => {
        if (isView.value) return '查看检验项目'
        return isEdit.value ? '编辑检验项目' : '新增检验项目'
    })

    // --- 基本信息表单 ---
    const form = reactive({
        id: null as string | null,
        code: '',
        name: '',
        dataType: 'QUANTITATIVE' as string,
        method: '',
        tool: '',
        description: '',
        relatedDefects: [] as any[]
    })

    const rules = {
        code: [{ required: true, message: '请输入项目编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
        dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }]
    }

    const getDataTypeColor = (type: string) => {
        return type === 'QUANTITATIVE' ? 'blue' : 'purple'
    }
    const getDataTypeText = (type: string) => {
        return type === 'QUANTITATIVE' ? '计量型' : '计数型'
    }

    // --- 关联不良现象Tab ---
    const defectColumns = [
        { title: '现象代码', dataIndex: 'code', key: 'code', width: 120 },
        { title: '现象名称', dataIndex: 'name', key: 'name', width: 180 },
        { title: '严重等级', key: 'severity', width: 100 },
        { title: '描述', dataIndex: 'description', key: 'description' },
        { title: '操作', key: 'action', width: 80 }
    ]

    const selectorDefectColumns = [
        { title: '现象代码', dataIndex: 'code', key: 'code', width: 100 },
        { title: '现象名称', dataIndex: 'name', key: 'name', width: 150 },
        { title: '严重等级', key: 'severity', width: 80 },
        { title: '描述', dataIndex: 'description', key: 'description' }
    ]

    const getSeverityColor = (level: string) => {
        switch (level) {
            case 'CR': return 'red'
            case 'MA': return 'orange'
            case 'MI': return 'blue'
            default: return 'default'
        }
    }

    // --- 缺陷选择器 ---
    const defectSelectorVisible = ref(false)
    const defectLoading = ref(false)
    const availableDefects = ref < any[] > ([])
    const selectedDefectKeys = ref < string[] > ([])
    const allDefects = ref < any[] > ([])

    const openDefectSelector = () => {
        defectLoading.value = true
        setTimeout(() => {
            // 过滤已关联的
            const existingIds = form.relatedDefects.map(d => d.id)
            availableDefects.value = allDefects.value.filter(d => !existingIds.includes(d.id))
            selectedDefectKeys.value = []
            defectLoading.value = false
        }, 200)
        defectSelectorVisible.value = true
    }

    const onDefectSelectChange = (keys: string[]) => {
        selectedDefectKeys.value = keys
    }

    const confirmDefectSelection = () => {
        const newDefects = allDefects.value.filter(d => selectedDefectKeys.value.includes(d.id))
        form.relatedDefects.push(...newDefects)
        defectSelectorVisible.value = false
        message.success(`已添加 ${newDefects.length} 个不良现象`)
    }

    const handleRemoveDefect = (index: number) => {
        form.relatedDefects.splice(index, 1)
    }

    // --- 页面操作 ---
    const handleBack = () => {
        router.push('/inspection-model/insp-items')
    }

    const handleSave = async () => {
        try {
            saving.value = true
            await formRef.value?.validate()
            message.success('保存成功')
            router.push('/inspection-model/insp-items')
        } catch (e) {
            message.error('请完善必填项')
        } finally {
            saving.value = false
        }
    }

    // --- 数据加载 ---
    const loadData = () => {
        // 加载所有可用的不良现象
        allDefects.value = [
            { id: '101', code: 'DEF-001', name: '表面划伤', severity: 'MI', description: '可见划痕' },
            { id: '102', code: 'DEF-002', name: '气孔', severity: 'MA', description: '表面密集气孔' },
            { id: '103', code: 'DEF-003', name: '裂纹', severity: 'CR', description: '产品裂纹' },
            { id: '104', code: 'DEF-004', name: '变形', severity: 'MA', description: '产品变形' },
            { id: '105', code: 'DEF-005', name: '色差', severity: 'MI', description: '颜色不均匀' }
        ]

        const id = route.params.id as string | undefined
        if (id) {
            // 模拟加载检验项目数据
            const mockItems: Record<string, any> = {
                '1': {
                    id: '1', code: 'IT-001', name: '外观检查', dataType: 'QUALITATIVE', method: '目视检查', tool: '放大镜',
                    description: '检查产品表面外观',
                    relatedDefects: [
                        { id: '101', code: 'DEF-001', name: '表面划伤', severity: 'MI', description: '可见划痕' },
                        { id: '102', code: 'DEF-002', name: '气孔', severity: 'MA', description: '表面密集气孔' }
                    ]
                },
                '2': {
                    id: '2', code: 'IT-002', name: '尺寸测量', dataType: 'QUANTITATIVE', method: '卡尺测量', tool: '三坐标',
                    description: '测量产品关键尺寸',
                    relatedDefects: []
                },
                '3': {
                    id: '3', code: 'IT-003', name: '硬度检测', dataType: 'QUANTITATIVE', method: '硬度计测量', tool: '洛氏硬度计',
                    description: '检测材料硬度',
                    relatedDefects: []
                }
            }
            const data = mockItems[id]
            if (data) {
                Object.assign(form, data)
            }
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

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        background: #fff;
        padding: 16px;
        border-radius: 4px;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .back-button {
        padding: 0;
    }

    .title-section {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .page-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }

    .form-card {
        margin-bottom: 16px;
    }

    .tab-card {
        margin-bottom: 16px;
    }

    .tab-toolbar {
        margin-bottom: 12px;
    }
</style>