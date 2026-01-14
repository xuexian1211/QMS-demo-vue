<template>
    <a-drawer :visible="visible" :title="drawerTitle" width="800px" :destroyOnClose="true" @close="handleClose">
        <div class="plan-container">
            <!-- 工具栏 -->
            <div class="plan-toolbar">
                <a-space>
                    <a-button type="primary" @click="handleAdd">
                        <template #icon>
                            <PlusOutlined />
                        </template>新增绑定
                    </a-button>
                    <a-button @click="loadPlanData">
                        <template #icon>
                            <ReloadOutlined />
                        </template>刷新
                    </a-button>
                </a-space>
            </div>

            <!-- 绑定列表 -->
            <a-table :columns="planColumns" :data-source="planData" :loading="loading" row-key="id" size="middle"
                :pagination="false">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'isDefault'">
                        <a-tag v-if="record.isDefault" color="gold">默认</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
                            <a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
                        </a-space>
                    </template>
                </template>
            </a-table>

            <!-- 空状态 -->
            <a-empty v-if="planData.length === 0 && !loading" description="暂无绑定的检验方案">
                <a-button type="primary" @click="handleAdd">新增绑定</a-button>
            </a-empty>
        </div>

        <!-- 绑定编辑弹窗 -->
        <a-modal v-model:visible="editModalVisible" :title="isEditBinding ? '编辑绑定' : '新增绑定'" width="500px"
            @ok="handleSaveBinding">
            <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical">
                <a-form-item label="检验方案" name="planId">
                    <a-select v-model:value="formState.planId" placeholder="请选择检验方案" show-search
                        :filter-option="filterPlanOption">
                        <a-select-option v-for="plan in planOptions" :key="plan.id" :value="plan.id">
                            {{ plan.code }} - {{ plan.name }}
                        </a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="优先级" name="priority">
                    <a-input-number v-model:value="formState.priority" :min="1" :max="99" style="width: 100%"
                        placeholder="数字越小优先级越高" />
                </a-form-item>
                <a-form-item label="设为默认">
                    <a-switch v-model:checked="formState.isDefault" />
                    <span style="margin-left: 8px; color: #666;">默认方案将在创建检验任务时自动选择</span>
                </a-form-item>
                <a-form-item label="备注" name="remark">
                    <a-textarea v-model:value="formState.remark" :rows="2" placeholder="请输入备注" />
                </a-form-item>
            </a-form>
        </a-modal>
    </a-drawer>
</template>

<script setup lang="ts">
    import { ref, reactive, watch, computed } from 'vue'
    import { message, Modal } from 'ant-design-vue'
    import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'

    // Props
    const props = defineProps < {
        visible: boolean
  materialInfo: { id: string; code: string; name: string }
  inspType: 'IQC' | 'FQC' | 'OQC'
    } > ()

    // Emits
    const emit = defineEmits < {
  (e: 'update:visible', value: boolean): void
}> ()

    // --- 状态定义 ---
    const loading = ref(false)
    const planData = ref < any[] > ([])
    const editModalVisible = ref(false)
    const isEditBinding = ref(false)
    const formRef = ref()

    const drawerTitle = computed(() => {
        const typeNames: Record<string, string> = {
            IQC: 'IQC来料检验',
            FQC: 'FQC成品检验',
            OQC: 'OQC出货检验'
        }
        return `${typeNames[props.inspType]}方案 - ${props.materialInfo.code} ${props.materialInfo.name}`
    })

    // 可选择的检验方案（模拟数据）
    const planOptions = ref([
        { id: 'p1', code: 'IQC-001', name: '来料标准检验方案' },
        { id: 'p2', code: 'IQC-002', name: '来料加严检验方案' },
        { id: 'p3', code: 'FQC-001', name: '成品标准检验方案' },
        { id: 'p4', code: 'FQC-002', name: '成品全检方案' },
        { id: 'p5', code: 'OQC-001', name: '出货抽样检验方案' },
    ])

    // 表格列
    const planColumns = [
        { title: '方案编码', dataIndex: 'planCode', key: 'planCode', width: 150 },
        { title: '方案名称', dataIndex: 'planName', key: 'planName', width: 200 },
        { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
        { title: '默认', key: 'isDefault', width: 80 },
        { title: '备注', dataIndex: 'remark', key: 'remark' },
        { title: '操作', key: 'action', width: 120 }
    ]

    // 表单状态
    const formState = reactive({
        id: null as string | null,
        planId: undefined as string | undefined,
        priority: 1,
        isDefault: false,
        remark: ''
    })

    const formRules = {
        planId: [{ required: true, message: '请选择检验方案', trigger: 'change' }],
        priority: [{ required: true, message: '请输入优先级', trigger: 'blur', type: 'number' }]
    }

    // --- 监听 ---
    watch(() => props.visible, (val) => {
        if (val && props.materialInfo?.id) {
            loadPlanData()
        }
    })

    // --- 方法 ---
    const handleClose = () => {
        emit('update:visible', false)
    }

    const filterPlanOption = (input: string, option: any) => {
        const plan = planOptions.value.find(p => p.id === option.value)
        if (!plan) return false
        return plan.code.toLowerCase().includes(input.toLowerCase()) ||
            plan.name.toLowerCase().includes(input.toLowerCase())
    }

    const loadPlanData = () => {
        loading.value = true
        setTimeout(() => {
            // 模拟数据 - 根据物料ID和检验类型加载绑定
            const mockData: Record<string, Record<string, any[]>> = {
                '1': {
                    'IQC': [
                        { id: 'b1', planId: 'p1', planCode: 'IQC-001', planName: '来料标准检验方案', priority: 1, isDefault: true, remark: '' },
                        { id: 'b2', planId: 'p2', planCode: 'IQC-002', planName: '来料加严检验方案', priority: 2, isDefault: false, remark: '供应商质量问题时启用' },
                    ],
                    'FQC': [],
                    'OQC': []
                },
                '2': {
                    'IQC': [],
                    'FQC': [
                        { id: 'b3', planId: 'p3', planCode: 'FQC-001', planName: '成品标准检验方案', priority: 1, isDefault: true, remark: '' },
                    ],
                    'OQC': []
                },
                '3': {
                    'IQC': [],
                    'FQC': [
                        { id: 'b4', planId: 'p4', planCode: 'FQC-002', planName: '成品全检方案', priority: 1, isDefault: true, remark: '' },
                    ],
                    'OQC': [
                        { id: 'b5', planId: 'p5', planCode: 'OQC-001', planName: '出货抽样检验方案', priority: 1, isDefault: true, remark: '' },
                    ]
                }
            }
            const materialData = mockData[props.materialInfo.id] || {}
            planData.value = materialData[props.inspType] || []
            loading.value = false
        }, 300)
    }

    const resetForm = () => {
        Object.assign(formState, {
            id: null,
            planId: undefined,
            priority: 1,
            isDefault: false,
            remark: ''
        })
    }

    const handleAdd = () => {
        isEditBinding.value = false
        resetForm()
        editModalVisible.value = true
    }

    const handleEdit = (record: any) => {
        isEditBinding.value = true
        Object.assign(formState, { ...record })
        editModalVisible.value = true
    }

    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除与 ${record.planName} 的绑定吗？`,
            okType: 'danger',
            onOk() {
                planData.value = planData.value.filter(i => i.id !== record.id)
                message.success('删除成功')
            }
        })
    }

    const handleSaveBinding = () => {
        formRef.value.validate().then(() => {
            // 获取方案信息
            const plan = planOptions.value.find(p => p.id === formState.planId)

            // 如果设为默认，取消其他默认
            if (formState.isDefault) {
                planData.value.forEach(p => { p.isDefault = false })
            }

            if (isEditBinding.value) {
                const idx = planData.value.findIndex(i => i.id === formState.id)
                if (idx > -1) {
                    Object.assign(planData.value[idx], {
                        ...formState,
                        planCode: plan?.code,
                        planName: plan?.name
                    })
                }
            } else {
                planData.value.push({
                    ...formState,
                    id: Date.now().toString(),
                    planCode: plan?.code,
                    planName: plan?.name
                })
            }
            message.success('保存成功')
            editModalVisible.value = false
        }).catch(() => {
            message.error('请完善必填项')
        })
    }
</script>

<style scoped>
    .plan-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .plan-toolbar {
        display: flex;
        justify-content: flex-start;
    }
</style>