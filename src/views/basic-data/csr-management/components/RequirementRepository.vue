<template>
    <div class="requirement-repository">
        <div class="table-operations">
            <a-space>
                <a-button type="primary" @click="handleAdd">新增条款</a-button>
                <a-button @click="handleImport">导入</a-button>
                <a-button @click="handleExport">导出</a-button>
            </a-space>
            <a-space>
                <a-input-search v-model:value="searchText" placeholder="请输入客户名称/条款关键字" style="width: 250px"
                    @search="onSearch" />
                <a-select v-model:value="searchType" style="width: 120px" @change="onSearch">
                    <a-select-option value="">所有类型</a-select-option>
                    <a-select-option value="体系要求">体系要求</a-select-option>
                    <a-select-option value="过程要求">过程要求</a-select-option>
                    <a-select-option value="交付要求">交付要求</a-select-option>
                </a-select>
            </a-space>
        </div>

        <a-table :columns="columns" :data-source="tableData" :pagination="pagination" bordered>
            <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'severity'">
                    <a-tag :color="getSeverityColor(record.severity)">
                        {{ record.severity }}
                    </a-tag>
                </template>
                <template v-if="column.dataIndex === 'action'">
                    <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
                    <a-button type="link" size="small" @click="handleConfig(record)">配置映射</a-button>
                    <a-popconfirm title="确定要删除该条款吗？" @confirm="handleDelete(record)">
                        <a-button type="link" size="small" danger>删除</a-button>
                    </a-popconfirm>
                </template>
            </template>
        </a-table>

        <!-- 新增/编辑弹窗 -->
        <a-modal v-model:visible="modalVisible" :title="modalTitle" @ok="handleModalOk" @cancel="handleModalCancel"
            width="600px">
            <a-form :model="formData" :rules="rules" ref="formRef" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="关联客户" name="customerName">
                    <a-input v-model:value="formData.customerName" placeholder="请输入客户名称" />
                </a-form-item>
                <a-form-item label="要求版本" name="version">
                    <a-input v-model:value="formData.version" placeholder="请输入版本号, 如 V1.0" />
                </a-form-item>
                <a-form-item label="要求类别" name="type">
                    <a-select v-model:value="formData.type" placeholder="请选择要求类别">
                        <a-select-option value="体系要求">体系要求</a-select-option>
                        <a-select-option value="过程要求">过程要求</a-select-option>
                        <a-select-option value="交付要求">交付要求</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="严格度等级" name="severity">
                    <a-select v-model:value="formData.severity" placeholder="请选择严格度等级">
                        <a-select-option value="一般">一般</a-select-option>
                        <a-select-option value="重要">重要</a-select-option>
                        <a-select-option value="强控">强控</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="标准约束" name="standardValue">
                    <a-input v-model:value="formData.standardValue" placeholder="请输入要求的标准,如 24h, 100%" />
                </a-form-item>
                <a-form-item label="条款内容描述" name="description">
                    <a-textarea v-model:value="formData.description" :rows="4" placeholder="请输入具体的协议内容描述" />
                </a-form-item>
                <a-form-item label="相关附件" name="attachment">
                    <a-upload>
                        <a-button>
                            <upload-outlined></upload-outlined>
                            上传文件
                        </a-button>
                    </a-upload>
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive } from 'vue'
    import { message } from 'ant-design-vue'

    const searchText = ref('')
    const searchType = ref('')

    // 定义表格列
    const columns = [
        { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 120 },
        { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
        { title: '类别', dataIndex: 'type', key: 'type', width: 100 },
        { title: '严格度', dataIndex: 'severity', key: 'severity', width: 100 },
        { title: '标准约束', dataIndex: 'standardValue', key: 'standardValue', width: 120 },
        { title: '条款描述', dataIndex: 'description', key: 'description' },
        { title: '操作', dataIndex: 'action', key: 'action', width: 200, fixed: 'right' as const }
    ]

    // 模拟数据
    const tableData = ref([
        {
            id: '1',
            customerName: '特斯拉(Tesla)',
            version: 'V2024.1',
            type: '交付要求',
            severity: '强控',
            standardValue: '每 500 件',
            description: '每生产 500 件必须做一次全尺寸和可靠性实验'
        },
        {
            id: '2',
            customerName: '大众汽车(VW)',
            version: 'V9.0',
            type: '体系要求',
            severity: '重要',
            standardValue: '15 Years',
            description: '质量记录（PPAP, FMEA，控制计划）需保存至少 15 年'
        },
        {
            id: '3',
            customerName: '宝马(BMW)',
            version: 'V5.2',
            type: '过程要求',
            severity: '强控',
            standardValue: '24h/48h',
            description: '发生A类客诉时，24小时内提供D3(围堵措施)，48小时内提供D8(长期措施)'
        }
    ])

    const pagination = {
        total: tableData.value.length,
        current: 1,
        pageSize: 10
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case '强控': return 'red'
            case '重要': return 'orange'
            case '一般': return 'blue'
            default: return 'default'
        }
    }

    const onSearch = () => {
        message.info('触发搜索')
    }

    // 弹窗表单状态
    const modalVisible = ref(false)
    const modalTitle = ref('新增 CSR 条款')
    const formRef = ref()
    const formData = reactive({
        id: '',
        customerName: '',
        version: '',
        type: '',
        severity: '',
        standardValue: '',
        description: ''
    })

    const rules = {
        customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
        type: [{ required: true, message: '请选择类别', trigger: 'change' }],
        severity: [{ required: true, message: '请选择严格度', trigger: 'change' }]
    }

    const handleAdd = () => {
        modalTitle.value = '新增 CSR 条款'
        Object.keys(formData).forEach(key => (formData as any)[key] = '')
        modalVisible.value = true
    }

    const handleEdit = (record: any) => {
        modalTitle.value = '编辑 CSR 条款'
        Object.assign(formData, record)
        modalVisible.value = true
    }

    const handleConfig = (record: any) => {
        message.info(`跳转配置业务映射：${record.customerName}`)
    }

    const handleDelete = (record: any) => {
        message.success('删除成功')
        tableData.value = tableData.value.filter(item => item.id !== record.id)
    }

    const handleImport = () => {
        message.info('打开导入文件弹窗，解析 PDF 手册')
    }

    const handleExport = () => {
        message.success('导出记录成功')
    }

    const handleModalOk = () => {
        formRef.value.validate().then(() => {
            message.success('保存成功')
            modalVisible.value = false
        }).catch((err: any) => {
            console.log('Validate Failed:', err)
        })
    }

    const handleModalCancel = () => {
        modalVisible.value = false
        formRef.value?.resetFields()
    }
</script>

<style scoped>
    .requirement-repository {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .table-operations {
        display: flex;
        justify-content: space-between;
        margin-bottom: 16px;
    }
</style>