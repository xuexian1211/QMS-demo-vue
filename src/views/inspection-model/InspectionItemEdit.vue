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
                    <a-tag v-if="form.orgId === null" color="gold">集团标准</a-tag>
                    <a-tag v-else color="blue">本地标准</a-tag>
                    <a-tag v-if="form.dataType" :color="getDataTypeColor(form.dataType)">
                        {{ getDataTypeText(form.dataType) }}
                    </a-tag>
                </div>
            </div>
            <div class="header-actions" v-if="!isView && !isReadOnly">
                <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
            </div>
            <div class="header-readonly-tip" v-if="isReadOnly && !isView">
                <a-alert message="集团标准项目对工厂用户只读，如需修改请联系集团管理员" type="warning" show-icon />
            </div>
        </div>

        <!-- 基本信息 -->
        <a-card class="form-card" title="基本信息">
            <a-form ref="formRef" :model="form" :rules="rules" layout="horizontal" :label-col="{ span: 6 }"
                :wrapper-col="{ span: 16 }">
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="项目编码" name="code">
                            <a-input v-model:value="form.code" :disabled="isView || isEdit || isReadOnly"
                                placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="项目名称" name="name">
                            <a-input v-model:value="form.name" :disabled="isView || isReadOnly" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="分类" name="category">
                            <a-select v-model:value="form.category" :disabled="isView || isReadOnly" placeholder="请选择">
                                <a-select-option value="dimension">尺寸</a-select-option>
                                <a-select-option value="appearance">外观</a-select-option>
                                <a-select-option value="physical_chemical">理化</a-select-option>
                                <a-select-option value="functional">功能</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="数据类型" name="dataType">
                            <a-select v-model:value="form.dataType" :disabled="isView || isReadOnly" placeholder="请选择"
                                @change="handleDataTypeChange">
                                <a-select-option value="quantitative">计量型</a-select-option>
                                <a-select-option value="qualitative">计数型</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="单位" name="uom"
                            :rules="form.dataType === 'quantitative' ? [{ required: true, message: '计量型必填单位' }] : []">
                            <a-input v-model:value="form.uom"
                                :disabled="isView || isReadOnly || form.dataType === 'qualitative'"
                                :placeholder="form.dataType === 'quantitative' ? '必填' : '计数型无需单位'" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="状态" name="status">
                            <a-select v-model:value="form.status" :disabled="isView || isReadOnly">
                                <a-select-option value="enabled">启用</a-select-option>
                                <a-select-option value="disabled">禁用</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="默认检验方法" name="defaultMethodId">
                            <a-select v-model:value="form.defaultMethodId" :disabled="isView || isReadOnly"
                                placeholder="请选择" allow-clear>
                                <a-select-option v-for="method in methodOptions" :key="method.id" :value="method.id">
                                    {{ method.name }}
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="默认量检具类型" name="defaultInstTypeId">
                            <a-select v-model:value="form.defaultInstTypeId" :disabled="isView || isReadOnly"
                                placeholder="请选择" allow-clear>
                                <a-select-option v-for="type in instTypeOptions" :key="type.id" :value="type.id">
                                    {{ type.name }}
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="默认送实验室">
                            <a-switch v-model:checked="form.isLabTestDefault" :disabled="isView || isReadOnly"
                                checked-children="是" un-checked-children="否" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="默认启用SPC">
                            <a-switch v-model:checked="form.isSpcDefault" :disabled="isView || isReadOnly"
                                checked-children="是" un-checked-children="否" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="16">
                        <a-form-item label="描述" name="description" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
                            <a-textarea v-model:value="form.description" :disabled="isView || isReadOnly" :rows="2"
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
                <a-tab-pane key="defects" tab="关联不良现象（默认）">
                    <div class="tab-toolbar" v-if="!isView && !isReadOnly">
                        <a-button type="primary" size="small" @click="openDefectSelector">
                            <PlusOutlined /> 添加关联
                        </a-button>
                        <span class="tab-tip">提示：此处配置的默认不良现象将在添加到检验模板时自动带入</span>
                    </div>
                    <a-table :columns="defectColumns" :data-source="form.relatedDefects" row-key="id" size="small"
                        :pagination="false">
                        <template #bodyCell="{ column, record, index }">
                            <template v-if="column.key === 'severity'">
                                <a-tag :color="getSeverityColor(record.severity)">{{ record.severity }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-button v-if="!isView && !isReadOnly" type="link" danger size="small"
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
    import type { InspectionItemCategory } from '@/types'

    const router = useRouter()
    const route = useRoute()

    // --- 模拟当前用户组织 ---
    // NOTE: 实际应从全局状态获取
    const currentOrgId = ref < string | null > ('1') // 模拟工厂用户，null 代表集团用户

    // --- 页面状态 ---
    const formRef = ref()
    const saving = ref(false)
    const activeTab = ref('defects')

    const isView = computed(() => route.path.includes('/view/'))
    const isEdit = computed(() => route.path.includes('/edit/'))

    /** 判断当前项目是否对当前用户只读（集团项目对工厂用户只读） */
    const isReadOnly = computed(() => {
        // 新增时不是只读
        if (!isEdit.value && !isView.value) return false
        // 集团用户可以编辑所有
        if (currentOrgId.value === null) return false
        // 工厂用户只能编辑本地项目
        return form.orgId === null
    })

    const pageTitle = computed(() => {
        if (isView.value) return '查看检验项目'
        return isEdit.value ? '编辑检验项目' : '新增检验项目'
    })

    // --- 基本信息表单 ---
    const form = reactive({
        id: null as string | null,
        orgId: null as string | null, // 新增时默认为当前用户组织
        code: '',
        name: '',
        category: 'dimension' as InspectionItemCategory,
        dataType: 'quantitative' as 'quantitative' | 'qualitative',
        uom: '',
        defaultMethodId: undefined as string | undefined,
        defaultMethodName: '',
        defaultInstTypeId: undefined as string | undefined,
        defaultInstTypeName: '',
        isLabTestDefault: false,
        isSpcDefault: false,
        description: '',
        status: 'enabled' as 'enabled' | 'disabled',
        relatedDefects: [] as any[]
    })

    const rules = {
        code: [{ required: true, message: '请输入项目编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
        category: [{ required: true, message: '请选择分类', trigger: 'change' }],
        dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }]
    }

    // --- 下拉选项（Mock） ---
    const methodOptions = ref([
        { id: '101', name: '卡尺测量法' },
        { id: '102', name: '硬度计测量' },
        { id: '103', name: '目视检查' },
        { id: '104', name: '涂层测厚仪' },
        { id: '105', name: '盐雾试验法' },
        { id: '106', name: '三坐标测量' }
    ])

    const instTypeOptions = ref([
        { id: '201', name: '0-150mm 数显卡尺' },
        { id: '202', name: '洛氏硬度计' },
        { id: '203', name: '涂层测厚仪' },
        { id: '204', name: '三坐标测量机' },
        { id: '205', name: '表面粗糙度仪' }
    ])

    const getDataTypeColor = (type: string) => {
        return type === 'quantitative' ? 'blue' : 'purple'
    }
    const getDataTypeText = (type: string) => {
        return type === 'quantitative' ? '计量型' : '计数型'
    }

    /** 数据类型切换时清除单位 */
    const handleDataTypeChange = (value: string) => {
        if (value === 'qualitative') {
            form.uom = ''
        }
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
        router.push('/inspection-model/inspection-items')
    }

    const handleSave = async () => {
        try {
            saving.value = true
            await formRef.value?.validate()
            // 新增时设置 orgId 为当前用户组织
            if (!isEdit.value) {
                form.orgId = currentOrgId.value
            }
            message.success('保存成功')
            router.push('/inspection-model/inspection-items')
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
            { id: '105', code: 'DEF-005', name: '色差', severity: 'MI', description: '颜色不均匀' },
            { id: '106', code: 'DEF-006', name: '尺寸超差', severity: 'MA', description: '尺寸超出公差范围' },
            { id: '107', code: 'DEF-007', name: '硬度不足', severity: 'CR', description: '硬度低于标准值' }
        ]

        const id = route.params.id as string | undefined
        if (id) {
            // 模拟加载检验项目数据
            const mockItems: Record<string, any> = {
                '1': {
                    id: '1', orgId: null, code: 'ITEM-G-LENGTH', name: '长度检测',
                    category: 'dimension', dataType: 'quantitative', uom: 'mm',
                    defaultMethodId: '101', defaultMethodName: '卡尺测量法',
                    defaultInstTypeId: '201', defaultInstTypeName: '0-150mm 数显卡尺',
                    isLabTestDefault: false, isSpcDefault: true,
                    description: '集团标准长度检测项目', status: 'enabled',
                    relatedDefects: [
                        { id: '106', code: 'DEF-006', name: '尺寸超差', severity: 'MA', description: '尺寸超出公差范围' }
                    ]
                },
                '2': {
                    id: '2', orgId: null, code: 'ITEM-G-HARDNESS', name: '洛氏硬度',
                    category: 'physical_chemical', dataType: 'quantitative', uom: 'HRC',
                    defaultMethodId: '102', defaultMethodName: '硬度计测量',
                    defaultInstTypeId: '202', defaultInstTypeName: '洛氏硬度计',
                    isLabTestDefault: true, isSpcDefault: true,
                    description: '集团标准硬度检测', status: 'enabled',
                    relatedDefects: [
                        { id: '107', code: 'DEF-007', name: '硬度不足', severity: 'CR', description: '硬度低于标准值' }
                    ]
                },
                '3': {
                    id: '3', orgId: '1', code: 'ITEM-HF-SURFACE', name: '表面外观检查',
                    category: 'appearance', dataType: 'qualitative', uom: '',
                    defaultMethodId: '103', defaultMethodName: '目视检查',
                    defaultInstTypeId: undefined, defaultInstTypeName: '',
                    isLabTestDefault: false, isSpcDefault: false,
                    description: '合肥工厂本地外观检查', status: 'enabled',
                    relatedDefects: [
                        { id: '101', code: 'DEF-001', name: '表面划伤', severity: 'MI', description: '可见划痕' },
                        { id: '102', code: 'DEF-002', name: '气孔', severity: 'MA', description: '表面密集气孔' }
                    ]
                },
                '4': {
                    id: '4', orgId: '1', code: 'ITEM-HF-COATING', name: '涂层厚度',
                    category: 'dimension', dataType: 'quantitative', uom: 'μm',
                    defaultMethodId: '104', defaultMethodName: '涂层测厚仪',
                    defaultInstTypeId: '203', defaultInstTypeName: '涂层测厚仪',
                    isLabTestDefault: false, isSpcDefault: true,
                    description: '合肥工厂专用涂层检测', status: 'enabled',
                    relatedDefects: []
                },
                '5': {
                    id: '5', orgId: '1', code: 'ITEM-HF-SALT', name: '盐雾测试',
                    category: 'functional', dataType: 'qualitative', uom: '',
                    defaultMethodId: '105', defaultMethodName: '盐雾试验法',
                    defaultInstTypeId: undefined, defaultInstTypeName: '',
                    isLabTestDefault: true, isSpcDefault: false,
                    description: '合肥工厂特殊测试项目', status: 'disabled',
                    relatedDefects: []
                }
            }
            const data = mockItems[id]
            if (data) {
                Object.assign(form, data)
            }
        } else {
            // 新增模式：设置 orgId 为当前用户组织
            form.orgId = currentOrgId.value
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
        flex-wrap: wrap;
        gap: 12px;
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

    .header-readonly-tip {
        flex: 1;
        min-width: 300px;
    }

    .form-card {
        margin-bottom: 16px;
    }

    .tab-card {
        margin-bottom: 16px;
    }

    .tab-toolbar {
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .tab-tip {
        color: #999;
        font-size: 12px;
    }
</style>