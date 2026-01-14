<template>
    <div class="page-container">
        <div class="split-layout">
            <!-- Left Panel: Cause Tree -->
            <div class="left-panel">
                <div class="panel-header">
                    <span class="panel-title">不良原因分类</span>
                    <a-space>
                        <a-tooltip title="刷新">
                            <a-button size="small" shape="circle" @click="loadTree">
                                <template #icon>
                                    <ReloadOutlined />
                                </template>
                            </a-button>
                        </a-tooltip>
                    </a-space>
                </div>
                <div class="tree-container">
                    <a-spin :spinning="treeLoading">
                        <a-tree v-if="treeData.length > 0" v-model:selectedKeys="selectedTreeKeys"
                            v-model:expandedKeys="expandedKeys" :tree-data="treeData"
                            :field-names="{ children: 'children', title: 'name', key: 'id' }" block-node
                            @select="onTreeSelect">
                            <template #title="{ name }">
                                <span class="node-title">{{ name }}</span>
                            </template>
                        </a-tree>
                        <a-empty v-else description="暂无分类数据" class="empty-state" />
                    </a-spin>
                </div>
            </div>

            <!-- Right Panel: Cause List -->
            <div class="right-panel">
                <div class="right-header">
                    <div class="header-info">
                        <div class="category-title">{{ selectedNode ? selectedNode.name : '全部原因' }}</div>
                    </div>
                    <div class="header-actions">
                        <a-button type="primary" @click="handleAdd">
                            <template #icon>
                                <PlusOutlined />
                            </template>
                            新增原因
                        </a-button>
                        <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
                            批量删除
                        </a-button>
                    </div>
                </div>

                <!-- Search Box -->
                <div class="search-box">
                    <a-form layout="inline" :model="queryParam">
                        <a-form-item label="原因代码">
                            <a-input v-model:value="queryParam.causeCode" placeholder="模糊搜索" allow-clear />
                        </a-form-item>
                        <a-form-item label="原因名称">
                            <a-input v-model:value="queryParam.causeName" placeholder="模糊搜索" allow-clear />
                        </a-form-item>
                        <a-form-item>
                            <a-button type="primary" @click="handleSearch">查询</a-button>
                            <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
                        </a-form-item>
                    </a-form>
                </div>

                <!-- Table -->
                <div class="table-container">
                    <a-table :columns="columns" :data-source="tableData" :loading="tableLoading" row-key="id"
                        size="middle" :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
                        :pagination="{ showSizeChanger: true, showQuickJumper: true, showTotal: total => `共 ${total} 条` }">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
                                    <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
                                    <a-button type="link" danger size="small"
                                        @click="handleDelete(record)">删除</a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                </div>
            </div>
        </div>

        <!-- Edit Modal -->
        <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑不良原因' : '新增不良原因'" width="600px" @ok="handleSave">
            <a-tabs v-model:activeKey="activeTab">
                <a-tab-pane key="basic" tab="基本信息">
                    <a-form ref="formRef" :model="formState" layout="vertical" :rules="rules">
                        <a-row :gutter="16">
                            <a-col :span="12">
                                <a-form-item label="原因代码" name="causeCode">
                                    <a-input v-model:value="formState.causeCode" placeholder="请输入" />
                                </a-form-item>
                            </a-col>
                            <a-col :span="12">
                                <a-form-item label="原因名称" name="causeName">
                                    <a-input v-model:value="formState.causeName" placeholder="请输入" />
                                </a-form-item>
                            </a-col>
                        </a-row>
                        <a-row :gutter="16">
                            <a-col :span="12">
                                <a-form-item label="原因类别" name="causeType">
                                    <a-select v-model:value="formState.causeType">
                                        <a-select-option value="Man">人 (Man)</a-select-option>
                                        <a-select-option value="Machine">机 (Machine)</a-select-option>
                                        <a-select-option value="Material">料 (Material)</a-select-option>
                                        <a-select-option value="Method">法 (Method)</a-select-option>
                                        <a-select-option value="Environment">环 (Environment)</a-select-option>
                                    </a-select>
                                </a-form-item>
                            </a-col>
                        </a-row>
                        <a-form-item label="描述" name="description">
                            <a-textarea v-model:value="formState.description" :rows="3" />
                        </a-form-item>
                    </a-form>
                </a-tab-pane>
                <a-tab-pane key="fmea" tab="FMEA关联">
                    <a-empty description="FMEA关联功能将在后续阶段实现" />
                </a-tab-pane>
            </a-tabs>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { message, Modal } from 'ant-design-vue'
    import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue'

    const router = useRouter()

    // --- Left Tree ---
    const treeLoading = ref(false)
    const treeData = ref < any[] > ([])
    const selectedTreeKeys = ref < string[] > ([])
    const expandedKeys = ref < string[] > ([])

    const selectedNode = computed(() => {
        if (selectedTreeKeys.value.length === 0) return null
        const findNode = (list: any[], key: string): any => {
            for (const item of list) {
                if (item.id === key) return item
                if (item.children) {
                    const found = findNode(item.children, key)
                    if (found) return found
                }
            }
            return null
        }
        return findNode(treeData.value, selectedTreeKeys.value[0])
    })

    const loadTree = () => {
        treeLoading.value = true
        setTimeout(() => {
            treeData.value = [
                { id: 'Man', name: '人 (Man)', children: [] },
                { id: 'Machine', name: '机 (Machine)', children: [] },
                { id: 'Material', name: '料 (Material)', children: [] },
                { id: 'Method', name: '法 (Method)', children: [] },
                { id: 'Environment', name: '环 (Environment)', children: [] },
            ]
            treeLoading.value = false
        }, 300)
    }

    const onTreeSelect = (keys: string[]) => {
        handleSearch()
    }

    // --- List & Search ---
    const tableLoading = ref(false)
    const tableData = ref < any[] > ([])
    const selectedRowKeys = ref < string[] > ([])
    const queryParam = reactive({
        causeCode: '',
        causeName: ''
    })

    const columns = [
        { title: '原因代码', dataIndex: 'causeCode', key: 'causeCode', width: 120 },
        { title: '原因名称', dataIndex: 'causeName', key: 'causeName', width: 200 },
        { title: '原因类别', dataIndex: 'causeType', key: 'causeType', width: 120 },
        { title: '描述', dataIndex: 'description', key: 'description' },
        { title: '操作', key: 'action', width: 150 }
    ]

    const handleSearch = () => {
        tableLoading.value = true
        setTimeout(() => {
            // Mock Data
            let res = [
                { id: 1, causeCode: 'C-MAN-001', causeName: '操作不当', causeType: 'Man', description: '员工未按SOP操作' },
                { id: 2, causeCode: 'C-MAC-001', causeName: '设备故障', causeType: 'Machine', description: '主轴跳动过大' },
                { id: 3, causeCode: 'C-MAT-001', causeName: '原料杂质', causeType: 'Material', description: '供应商来料含杂质' }
            ]

            // Filter by Tree Selection
            if (selectedTreeKeys.value.length > 0) {
                res = res.filter(item => item.causeType === selectedTreeKeys.value[0])
            }

            // Filter by Search Query
            if (queryParam.causeCode) {
                res = res.filter(item => item.causeCode.toLowerCase().includes(queryParam.causeCode.toLowerCase()))
            }
            if (queryParam.causeName) {
                res = res.filter(item => item.causeName.includes(queryParam.causeName))
            }

            tableData.value = res
            tableLoading.value = false
        }, 300)
    }

    const handleReset = () => {
        queryParam.causeCode = ''
        queryParam.causeName = ''
        handleSearch()
    }

    const onSelectChange = (keys: string[]) => {
        selectedRowKeys.value = keys
    }

    // --- Edit Modal ---
    const modalVisible = ref(false)
    const isEdit = ref(false)
    const activeTab = ref('basic')
    const formRef = ref()
    const formState = reactive({
        id: null,
        causeCode: '',
        causeName: '',
        causeType: 'Man',
        description: ''
    })

    const rules = {
        causeCode: [{ required: true, message: '请输入原因代码', trigger: 'blur' }],
        causeName: [{ required: true, message: '请输入原因名称', trigger: 'blur' }],
        causeType: [{ required: true, message: '请选择原因类别', trigger: 'change' }]
    }

    const handleAdd = () => {
        router.push('/inspection-model/defect-causes/create')
    }

    const handleView = (record: any) => {
        router.push(`/inspection-model/defect-causes/view/${record.id}`)
    }

    const handleEdit = (record: any) => {
        router.push(`/inspection-model/defect-causes/edit/${record.id}`)
    }

    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除原因 ${record.causeName} 吗？`,
            okType: 'danger',
            onOk() {
                tableData.value = tableData.value.filter(item => item.id !== record.id)
                message.success('删除成功')
            }
        })
    }

    const handleBatchDelete = () => {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除选中的 ${selectedRowKeys.value.length} 条记录吗？`,
            okType: 'danger',
            onOk() {
                tableData.value = tableData.value.filter(item => !selectedRowKeys.value.includes(item.id))
                selectedRowKeys.value = []
                message.success('删除成功')
            }
        })
    }

    const handleSave = () => {
        formRef.value.validate().then(() => {
            if (isEdit.value) {
                const idx = tableData.value.findIndex(item => item.id === formState.id)
                if (idx > -1) Object.assign(tableData.value[idx], formState)
            } else {
                tableData.value.push({ ...formState, id: Date.now() })
            }
            message.success('保存成功')
            modalVisible.value = false
            handleSearch()
        })
    }

    onMounted(() => {
        loadTree()
        handleSearch()
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
        width: 250px;
        min-width: 250px;
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

    .tree-container {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
    }

    .node-title {
        font-size: 14px;
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

    .right-header {
        padding: 16px 24px;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .category-title {
        font-size: 18px;
        font-weight: 600;
    }

    .search-box {
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