<template>
    <a-drawer :visible="visible" :title="`物料检验规格 - ${materialInfo.code} ${materialInfo.name}`" width="900px"
        :destroyOnClose="true" @close="handleClose">
        <div class="spec-container">
            <!-- 工具栏 -->
            <div class="spec-toolbar">
                <a-space>
                    <a-button type="primary" @click="handleAdd">
                        <template #icon>
                            <PlusOutlined />
                        </template>新增
                    </a-button>
                    <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
                        <template #icon>
                            <DeleteOutlined />
                        </template>批量删除
                    </a-button>
                    <a-button @click="handleExport">
                        <template #icon>
                            <ExportOutlined />
                        </template>导出
                    </a-button>
                    <a-button @click="loadSpecData">
                        <template #icon>
                            <ReloadOutlined />
                        </template>刷新
                    </a-button>
                </a-space>
            </div>

            <!-- 规格数据表格 -->
            <a-table :columns="specColumns" :data-source="specData" :loading="loading" row-key="id" size="middle"
                :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }" :pagination="false">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'dataType'">
                        <a-tag :color="record.dataType === 'Quantitative' ? 'blue' : 'purple'">
                            {{ record.dataType === 'Quantitative' ? '计量型' : '计数型' }}
                        </a-tag>
                    </template>
                    <template v-if="column.key === 'specValue'">
                        <span v-if="record.dataType === 'Quantitative'">
                            {{ record.targetValue }} ({{ record.lowerLimit }} ~ {{ record.upperLimit }}) {{ record.unit
                            }}
                        </span>
                        <span v-else>{{ record.standardDesc }}</span>
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
                            <a-divider type="vertical" />
                            <a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </div>

        <!-- 规格编辑弹窗 -->
        <a-modal v-model:visible="editModalVisible" :title="isEditSpec ? '编辑检验规格' : '新增检验规格'" width="600px"
            @ok="handleSaveSpec">
            <a-form ref="specFormRef" :model="specFormState" :rules="specRules" layout="vertical">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="检验项目" name="inspItemId">
                            <a-select v-model:value="specFormState.inspItemId" placeholder="请选择检验项目"
                                @change="handleInspItemChange">
                                <a-select-option v-for="item in inspItemOptions" :key="item.id" :value="item.id">
                                    {{ item.name }}
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="数据类型" name="dataType">
                            <a-select v-model:value="specFormState.dataType" placeholder="请选择"
                                @change="handleDataTypeChange">
                                <a-select-option value="Quantitative">计量型</a-select-option>
                                <a-select-option value="Qualitative">计数型</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>

                <!-- 计量型表单 -->
                <template v-if="specFormState.dataType === 'Quantitative'">
                    <a-row :gutter="16">
                        <a-col :span="8">
                            <a-form-item label="目标值" name="targetValue">
                                <a-input-number v-model:value="specFormState.targetValue" style="width: 100%"
                                    placeholder="请输入" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="上限" name="upperLimit">
                                <a-input-number v-model:value="specFormState.upperLimit" style="width: 100%"
                                    placeholder="请输入" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="8">
                            <a-form-item label="下限" name="lowerLimit">
                                <a-input-number v-model:value="specFormState.lowerLimit" style="width: 100%"
                                    placeholder="请输入" />
                            </a-form-item>
                        </a-col>
                    </a-row>
                    <a-form-item label="单位" name="unit">
                        <a-input v-model:value="specFormState.unit" placeholder="请输入单位" />
                    </a-form-item>
                </template>

                <!-- 计数型表单 -->
                <template v-else>
                    <a-form-item label="标准描述" name="standardDesc">
                        <a-textarea v-model:value="specFormState.standardDesc" :rows="3" placeholder="请输入标准描述" />
                    </a-form-item>
                    <a-row :gutter="16">
                        <a-col :span="12">
                            <a-form-item label="标准代码" name="standardCode">
                                <a-input v-model:value="specFormState.standardCode" placeholder="请输入标准代码" />
                            </a-form-item>
                        </a-col>
                        <a-col :span="12">
                            <a-form-item label="期望值" name="expectedValue">
                                <a-input v-model:value="specFormState.expectedValue" placeholder="如：OK/NG" />
                            </a-form-item>
                        </a-col>
                    </a-row>
                    <a-form-item label="样板图">
                        <a-upload list-type="picture-card" :max-count="1" :file-list="sampleImageList"
                            @change="handleSampleImageChange">
                            <div v-if="sampleImageList.length === 0">
                                <PlusOutlined />
                                <div style="margin-top: 8px">上传</div>
                            </div>
                        </a-upload>
                    </a-form-item>
                </template>

                <a-form-item label="备注" name="remark">
                    <a-textarea v-model:value="specFormState.remark" :rows="2" placeholder="请输入备注" />
                </a-form-item>
            </a-form>
        </a-modal>
    </a-drawer>
</template>

<script setup lang="ts">
    import { ref, reactive, watch } from 'vue'
    import { message, Modal } from 'ant-design-vue'
    import {
        PlusOutlined, DeleteOutlined,
        ExportOutlined, ReloadOutlined
    } from '@ant-design/icons-vue'

    // Props
    const props = defineProps < {
        visible: boolean
        materialInfo: { id: string; code: string; name: string }
    } > ()

    // Emits
    const emit = defineEmits < {
        (e: 'update:visible', value: boolean): void
    }> ()

    // --- 状态定义 ---
    const loading = ref(false)
    const specData = ref < any[] > ([])
    const selectedRowKeys = ref < string[] > ([])
    const editModalVisible = ref(false)
    const isEditSpec = ref(false)
    const specFormRef = ref()
    const sampleImageList = ref < any[] > ([])

    // 检验项目下拉选项（模拟数据）
    const inspItemOptions = ref([
        { id: '1', name: '长度', dataType: 'Quantitative' },
        { id: '2', name: '外观', dataType: 'Qualitative' },
        { id: '3', name: '硬度', dataType: 'Quantitative' },
        { id: '4', name: '表面缺陷', dataType: 'Qualitative' },
    ])

    // 表格列定义
    const specColumns = [
        { title: '检验项目', dataIndex: 'inspItemName', key: 'inspItemName', width: 150 },
        { title: '数据类型', dataIndex: 'dataType', key: 'dataType', width: 100 },
        { title: '规格值', key: 'specValue', width: 250 },
        { title: '备注', dataIndex: 'remark', key: 'remark' },
        { title: '操作', key: 'action', width: 150, fixed: 'right' }
    ]

    // 表单状态
    const specFormState = reactive({
        id: null as string | null,
        inspItemId: undefined as string | undefined,
        inspItemName: '',
        dataType: 'Quantitative' as 'Quantitative' | 'Qualitative',
        // 计量型
        targetValue: undefined as number | undefined,
        upperLimit: undefined as number | undefined,
        lowerLimit: undefined as number | undefined,
        unit: '',
        // 计数型
        standardDesc: '',
        standardCode: '',
        expectedValue: '',
        sampleImage: '',
        // 通用
        remark: ''
    })

    // 表单验证规则
    const specRules = {
        inspItemId: [{ required: true, message: '请选择检验项目', trigger: 'change' }],
        dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
        targetValue: [{ required: true, message: '请输入目标值', trigger: 'blur', type: 'number' }],
        standardDesc: [{ required: true, message: '请输入标准描述', trigger: 'blur' }]
    }

    // --- 监听 ---
    watch(() => props.visible, (val) => {
        if (val && props.materialInfo?.id) {
            loadSpecData()
        }
    })

    // --- 方法 ---
    const handleClose = () => {
        emit('update:visible', false)
    }

    const loadSpecData = () => {
        loading.value = true
        selectedRowKeys.value = []
        setTimeout(() => {
            // 模拟数据 - 根据物料ID加载规格
            const mockData: Record<string, any[]> = {
                '1': [
                    { id: 's1', inspItemId: '1', inspItemName: '长度', dataType: 'Quantitative', targetValue: 100, upperLimit: 101, lowerLimit: 99, unit: 'mm', remark: '' },
                    { id: 's2', inspItemId: '2', inspItemName: '外观', dataType: 'Qualitative', standardDesc: '无明显划痕、凹坑', standardCode: 'STD-001', expectedValue: 'OK', remark: '' },
                ],
                '2': [
                    { id: 's3', inspItemId: '3', inspItemName: '硬度', dataType: 'Quantitative', targetValue: 60, upperLimit: 65, lowerLimit: 55, unit: 'HRC', remark: '' },
                ],
                '3': []
            }
            specData.value = mockData[props.materialInfo.id] || []
            loading.value = false
        }, 300)
    }

    const onSelectChange = (keys: string[]) => {
        selectedRowKeys.value = keys
    }

    const resetSpecForm = () => {
        Object.assign(specFormState, {
            id: null,
            inspItemId: undefined,
            inspItemName: '',
            dataType: 'Quantitative',
            targetValue: undefined,
            upperLimit: undefined,
            lowerLimit: undefined,
            unit: '',
            standardDesc: '',
            standardCode: '',
            expectedValue: '',
            sampleImage: '',
            remark: ''
        })
        sampleImageList.value = []
    }

    const handleAdd = () => {
        isEditSpec.value = false
        resetSpecForm()
        editModalVisible.value = true
    }

    const handleEdit = (record: any) => {
        isEditSpec.value = true
        Object.assign(specFormState, { ...record })
        if (record.sampleImage) {
            sampleImageList.value = [{ uid: '-1', name: 'sample.png', status: 'done', url: record.sampleImage }]
        } else {
            sampleImageList.value = []
        }
        editModalVisible.value = true
    }

    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除该检验规格吗？`,
            okType: 'danger',
            onOk() {
                specData.value = specData.value.filter(i => i.id !== record.id)
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
                specData.value = specData.value.filter(i => !selectedRowKeys.value.includes(i.id))
                selectedRowKeys.value = []
                message.success('批量删除成功')
            }
        })
    }

    const handleSaveSpec = () => {
        specFormRef.value.validate().then(() => {
            // 计量型表单验证：下限不能大于上限
            if (specFormState.dataType === 'Quantitative') {
                if (specFormState.lowerLimit !== undefined && specFormState.upperLimit !== undefined) {
                    if (specFormState.lowerLimit > specFormState.upperLimit) {
                        message.error('下限不能大于上限')
                        return
                    }
                }
            }

            // 获取检验项目名称
            const inspItem = inspItemOptions.value.find(i => i.id === specFormState.inspItemId)
            specFormState.inspItemName = inspItem?.name || ''

            if (isEditSpec.value) {
                const idx = specData.value.findIndex(i => i.id === specFormState.id)
                if (idx > -1) Object.assign(specData.value[idx], { ...specFormState })
            } else {
                specData.value.push({ ...specFormState, id: Date.now().toString() })
            }
            message.success('保存成功')
            editModalVisible.value = false
        }).catch(() => {
            message.error('请完善必填项')
        })
    }

    const handleExport = () => {
        message.success('导出任务已开始')
    }

    const handleInspItemChange = (itemId: string) => {
        const item = inspItemOptions.value.find(i => i.id === itemId)
        if (item) {
            specFormState.dataType = item.dataType as 'Quantitative' | 'Qualitative'
        }
    }

    const handleDataTypeChange = () => {
        // 切换数据类型时重置对应字段
        if (specFormState.dataType === 'Quantitative') {
            specFormState.standardDesc = ''
            specFormState.standardCode = ''
            specFormState.expectedValue = ''
            specFormState.sampleImage = ''
            sampleImageList.value = []
        } else {
            specFormState.targetValue = undefined
            specFormState.upperLimit = undefined
            specFormState.lowerLimit = undefined
            specFormState.unit = ''
        }
    }

    const handleSampleImageChange = (info: any) => {
        sampleImageList.value = info.fileList
        if (info.file.status === 'done') {
            specFormState.sampleImage = info.file.response?.url || ''
        }
    }
</script>

<style scoped>
    .spec-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .spec-toolbar {
        display: flex;
        justify-content: flex-start;
    }
</style>