<template>
    <div class="page-container">
        <div class="split-layout">
            <!-- ✨ 左侧：不良原因层级树（重构） -->
            <div class="left-panel">
                <div class="panel-header">
                    <span class="panel-title">不良原因树</span>
                    <a-space>
                        <a-tooltip title="添加根原因">
                            <a-button type="primary" size="small" shape="circle" @click="handleAddRootCause">
                                <template #icon>
                                    <PlusOutlined />
                                </template>
                            </a-button>
                        </a-tooltip>
                        <a-tooltip title="刷新">
                            <a-button size="small" shape="circle" @click="loadCauseTree">
                                <template #icon>
                                    <ReloadOutlined />
                                </template>
                            </a-button>
                        </a-tooltip>
                    </a-space>
                </div>

                <!-- ✨ 组织过滤 -->
                <div class="filter-box">
                    <a-select v-model:value="selectedOrgId" placeholder="选择组织过滤" allow-clear style="width: 100%"
                        size="small" @change="loadCauseTree">
                        <a-select-option :value="undefined">全部（集团级+本工厂）</a-select-option>
                        <a-select-option :value="1">合肥工厂</a-select-option>
                        <a-select-option :value="2">芜湖工厂</a-select-option>
                    </a-select>
                </div>

                <div class="search-box">
                    <a-input v-model:value="treeSearch" placeholder="搜索原因" allow-clear size="small">
                        <template #prefix>
                            <SearchOutlined />
                        </template>
                    </a-input>
                </div>

                <div class="tree-container">
                    <a-spin :spinning="treeLoading">
                        <a-tree v-if="causeTreeData.length > 0" v-model:selectedKeys="selectedCauseKeys"
                            v-model:expandedKeys="expandedKeys" :tree-data="filteredCauseTree"
                            :field-names="{ children: 'children', title: 'name', key: 'id' }" block-node
                            @select="onCauseSelect">
                            <template #title="{ name, data }">
                                <div class="tree-node-content">
                                    <span class="node-title">
                                        <!-- ✨ 高频标记 -->
                                        <StarFilled v-if="data.isHighFrequency" class="high-freq-icon" />
                                        <!-- ✨ 组织标识 -->
                                        <a-tag v-if="data.orgId !== undefined" size="small" color="blue">
                                            {{ getOrgName(data.orgId) }}
                                        </a-tag>
                                        <a-tag v-else size="small" color="green">集团</a-tag>
                                        {{ name }}
                                    </span>
                                    <div class="node-actions">
                                        <PlusOutlined class="action-icon" title="添加子原因"
                                            @click.stop="handleAddSubCause(data)" />
                                        <EditOutlined class="action-icon" title="编辑"
                                            @click.stop="handleEditCause(data)" />
                                        <DeleteOutlined class="action-icon" title="删除"
                                            @click.stop="handleDeleteCause(data)" />
                                    </div>
                                </div>
                            </template>
                        </a-tree>
                        <a-empty v-else description="暂无原因数据" class="empty-state" />
                    </a-spin>
                </div>
            </div>

            <!-- 右侧：原因列表 -->
            <div class="right-panel">
                <div class="right-header">
                    <div class="header-info">
                        <div class="category-title">{{ selectedCause ? selectedCause.name : '全部原因' }}</div>
                        <div class="category-meta" v-if="selectedCause">
                            <a-tag color="blue">{{ selectedCause.code }}</a-tag>
                            <a-tag :color="getCategoryColor(selectedCause.category)">
                                {{ getCategoryText(selectedCause.category) }}
                            </a-tag>
                            <a-tag v-if="selectedCause.isHighFrequency" color="orange">
                                <StarFilled /> 高频原因
                            </a-tag>
                        </div>
                    </div>
                    <div class="header-actions">
                        <a-space>
                            <a-checkbox v-model:checked="showHighFreqOnly" @change="handleFilterChange">
                                仅显示高频原因
                            </a-checkbox>
                            <a-button type="primary" @click="handleAddRootCause">
                                <template #icon>
                                    <PlusOutlined />
                                </template>
                                新增根原因
                            </a-button>
                        </a-space>
                    </div>
                </div>

                <!-- 搜索表单 -->
                <div class="search-box">
                    <a-form layout="inline" :model="queryParam">
                        <a-form-item label="原因代码">
                            <a-input v-model:value="queryParam.code" placeholder="模糊搜索" allow-clear />
                        </a-form-item>
                        <a-form-item label="原因名称">
                            <a-input v-model:value="queryParam.name" placeholder="模糊搜索" allow-clear />
                        </a-form-item>
                        <a-form-item label="原因类别">
                            <a-select v-model:value="queryParam.category" placeholder="选择类别" allow-clear
                                style="width: 120px">
                                <a-select-option value="Man">人</a-select-option>
                                <a-select-option value="Machine">机</a-select-option>
                                <a-select-option value="Material">料</a-select-option>
                                <a-select-option value="Method">法</a-select-option>
                                <a-select-option value="Environment">环</a-select-option>
                            </a-select>
                        </a-form-item>
                        <a-form-item>
                            <a-button type="primary" @click="handleSearch">查询</a-button>
                            <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
                        </a-form-item>
                    </a-form>
                </div>

                <!-- 表格 -->
                <div class="table-container">
                    <a-table :columns="columns" :data-source="filteredTableData" :loading="tableLoading" row-key="id"
                        size="middle"
                        :pagination="{ showSizeChanger: true, showQuickJumper: true, showTotal: total => `共 ${total} 条` }">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'category'">
                                <a-tag :color="getCategoryColor(record.category)">{{ getCategoryText(record.category)
                                    }}</a-tag>
                            </template>
                            <template v-else-if="column.key === 'isHighFrequency'">
                                <a-tag v-if="record.isHighFrequency" color="orange">
                                    <StarFilled /> 高频
                                </a-tag>
                                <span v-else>-</span>
                            </template>
                            <template v-else-if="column.key === 'orgId'">
                                <a-tag v-if="record.orgId !== undefined" color="blue">{{ getOrgName(record.orgId)
                                    }}</a-tag>
                                <a-tag v-else color="green">集团级</a-tag>
                            </template>
                            <template v-else-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="handleEditCause(record)">编辑</a-button>
                                    <a-button type="link" size="small"
                                        @click="handleAddSubCause(record)">添加子原因</a-button>
                                    <a-button type="link" danger size="small"
                                        @click="handleDeleteCause(record)">删除</a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                </div>
            </div>
        </div>

        <!-- ✨ 原因编辑弹窗（重构） -->
        <a-modal v-model:visible="causeModalVisible" :title="causeModalTitle" @ok="saveCause" width="700px">
            <a-form layout="vertical" :model="causeForm">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="原因代码" required>
                            <a-input v-model:value="causeForm.code" placeholder="如：C-MAN-001" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="原因名称" required>
                            <a-input v-model:value="causeForm.name" placeholder="如：操作不当" />
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="原因类别（5M）" required>
                            <a-select v-model:value="causeForm.category">
                                <a-select-option value="Man">人 (Man)</a-select-option>
                                <a-select-option value="Machine">机 (Machine)</a-select-option>
                                <a-select-option value="Material">料 (Material)</a-select-option>
                                <a-select-option value="Method">法 (Method)</a-select-option>
                                <a-select-option value="Environment">环 (Environment)</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <!-- ✨ 组织选择器 -->
                        <a-form-item label="所属组织">
                            <a-select v-model:value="causeForm.orgId" allow-clear placeholder="留空表示集团级">
                                <a-select-option :value="undefined">集团级（全局可见）</a-select-option>
                                <a-select-option :value="1">合肥工厂</a-select-option>
                                <a-select-option :value="2">芜湖工厂</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-row :gutter="16">
                    <a-col :span="12">
                        <!-- ✨ 父原因选择器 -->
                        <a-form-item label="父原因">
                            <a-tree-select v-model:value="causeForm.parentId" :tree-data="parentCauseOptions"
                                :field-names="{ children: 'children', label: 'name', value: 'id' }"
                                placeholder="选择父原因（留空表示根原因）" allow-clear tree-default-expand-all>
                            </a-tree-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <!-- ✨ 高频原因开关 -->
                        <a-form-item label="高频原因">
                            <a-switch v-model:checked="causeForm.isHighFrequency" checked-children="是"
                                un-checked-children="否" />
                            <span style="margin-left: 8px; color: #999; font-size: 12px;">
                                高频原因会在选择器中优先显示
                            </span>
                        </a-form-item>
                    </a-col>
                </a-row>

                <a-form-item label="描述">
                    <a-textarea v-model:value="causeForm.description" :rows="3" placeholder="详细描述该原因" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { message, Modal } from 'ant-design-vue'
    import {
        PlusOutlined,
        ReloadOutlined,
        SearchOutlined,
        EditOutlined,
        DeleteOutlined,
        StarFilled
    } from '@ant-design/icons-vue'
    import { defectApi } from '@/api/defectManagement'
    import type { DefectCause } from '@/types'

    // --- 状态定义 ---
    const treeLoading = ref(false)
    const causeTreeData = ref < DefectCause[] > ([])
    const allCauses = ref < DefectCause[] > ([])
    const selectedCauseKeys = ref < number[] > ([])
    const expandedKeys = ref < number[] > ([])
    const treeSearch = ref('')
    const selectedOrgId = ref < number | undefined > (undefined)

    const tableLoading = ref(false)
    const showHighFreqOnly = ref(false)
    const queryParam = reactive({
        code: '',
        name: '',
        category: undefined as string | undefined
    })

    const causeModalVisible = ref(false)
    const isEditCause = ref(false)
    const causeForm = reactive < Partial < DefectCause >> ({
        code: '',
        name: '',
        category: 'Man',
        orgId: undefined,
        parentId: undefined,
        isHighFrequency: false,
        description: ''
    })

    // --- 计算属性 ---
    const selectedCause = computed(() => {
        if (selectedCauseKeys.value.length === 0) return null
        const findCause = (list: DefectCause[], id: number): DefectCause | null => {
            for (const item of list) {
                if (item.id === id.toString()) return item
                if (item.children) {
                    const found = findCause(item.children, id)
                    if (found) return found
                }
            }
            return null
        }
        return findCause(causeTreeData.value, selectedCauseKeys.value[0])
    })

    const filteredCauseTree = computed(() => {
        if (!treeSearch.value) return causeTreeData.value
        const filterTree = (list: DefectCause[]): DefectCause[] => {
            return list.filter(item => {
                const match = item.name?.toLowerCase().includes(treeSearch.value.toLowerCase()) ||
                    item.code?.toLowerCase().includes(treeSearch.value.toLowerCase())
                if (match) return true
                if (item.children) {
                    const filteredChildren = filterTree(item.children)
                    if (filteredChildren.length > 0) {
                        item.children = filteredChildren
                        return true
                    }
                }
                return false
            })
        }
        return filterTree(JSON.parse(JSON.stringify(causeTreeData.value)))
    })

    const filteredTableData = computed(() => {
        let data = [...allCauses.value]

        // 高频过滤
        if (showHighFreqOnly.value) {
            data = data.filter(c => c.isHighFrequency)
        }

        // 搜索过滤
        if (queryParam.code) {
            data = data.filter(c => c.code?.toLowerCase().includes(queryParam.code.toLowerCase()))
        }
        if (queryParam.name) {
            data = data.filter(c => c.name?.toLowerCase().includes(queryParam.name.toLowerCase()))
        }
        if (queryParam.category) {
            data = data.filter(c => c.category === queryParam.category)
        }

        return data
    })

    const causeModalTitle = computed(() => {
        if (isEditCause.value) return '编辑不良原因'
        if (causeForm.parentId) return '添加子原因'
        return '添加根原因'
    })

    const parentCauseOptions = computed(() => {
        // 编辑时排除自己及其子节点
        if (isEditCause.value && causeForm.id) {
            const excludeIds = new Set < string > ([causeForm.id.toString()])
            const collectChildIds = (cause: DefectCause) => {
                if (cause.children) {
                    cause.children.forEach(child => {
                        excludeIds.add(child.id)
                        collectChildIds(child)
                    })
                }
            }
            const current = allCauses.value.find(c => c.id === causeForm.id)
            if (current) collectChildIds(current)

            const filterTree = (list: DefectCause[]): DefectCause[] => {
                return list.filter(c => !excludeIds.has(c.id)).map(c => ({
                    ...c,
                    children: c.children ? filterTree(c.children) : undefined
                }))
            }
            return filterTree(causeTreeData.value)
        }
        return causeTreeData.value
    })

    // --- 表格列定义 ---
    const columns = [
        { title: '原因代码', dataIndex: 'code', key: 'code', width: 120 },
        { title: '原因名称', dataIndex: 'name', key: 'name', width: 150 },
        { title: '原因类别', key: 'category', width: 100 },
        { title: '高频标记', key: 'isHighFrequency', width: 100 },
        { title: '所属组织', key: 'orgId', width: 120 },
        { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
        { title: '操作', key: 'action', width: 200, fixed: 'right' }
    ]

    // --- 工具函数 ---
    const getCategoryColor = (category: string) => {
        const map: Record<string, string> = {
            Man: 'blue',
            Machine: 'cyan',
            Material: 'orange',
            Method: 'purple',
            Environment: 'green'
        }
        return map[category] || 'default'
    }

    const getCategoryText = (category: string) => {
        const map: Record<string, string> = {
            Man: '人',
            Machine: '机',
            Material: '料',
            Method: '法',
            Environment: '环'
        }
        return map[category] || category
    }

    const getOrgName = (orgId: number) => {
        const map: Record<number, string> = {
            1: '合肥',
            2: '芜湖'
        }
        return map[orgId] || `工厂${orgId}`
    }

    // --- 数据加载 ---
    const loadCauseTree = async () => {
        treeLoading.value = true
        try {
            const tree = await defectApi.getCauseTree(selectedOrgId.value)
            causeTreeData.value = tree

            const all = await defectApi.getAllCauses(selectedOrgId.value)
            allCauses.value = all

            // 默认展开所有节点
            const collectIds = (list: DefectCause[]): number[] => {
                const ids: number[] = []
                list.forEach(item => {
                    ids.push(Number(item.id))
                    if (item.children) {
                        ids.push(...collectIds(item.children))
                    }
                })
                return ids
            }
            expandedKeys.value = collectIds(tree)
        } catch (error) {
            message.error('加载原因树失败')
        } finally {
            treeLoading.value = false
        }
    }

    // --- 树节点操作 ---
    const onCauseSelect = (keys: number[]) => {
        selectedCauseKeys.value = keys
    }

    const handleAddRootCause = () => {
        isEditCause.value = false
        Object.assign(causeForm, {
            id: undefined,
            code: '',
            name: '',
            category: 'Man',
            orgId: selectedOrgId.value,
            parentId: undefined,
            isHighFrequency: false,
            description: ''
        })
        causeModalVisible.value = true
    }

    const handleAddSubCause = (parent: DefectCause) => {
        isEditCause.value = false
        Object.assign(causeForm, {
            id: undefined,
            code: '',
            name: '',
            category: parent.category,  // 继承父原因的类别
            orgId: parent.orgId,  // 继承父原因的组织
            parentId: Number(parent.id),
            isHighFrequency: false,
            description: ''
        })
        causeModalVisible.value = true
    }

    const handleEditCause = (cause: DefectCause) => {
        isEditCause.value = true
        Object.assign(causeForm, {
            ...cause,
            parentId: cause.parentId ? Number(cause.parentId) : undefined
        })
        causeModalVisible.value = true
    }

    const handleDeleteCause = (cause: DefectCause) => {
        // 检查是否有子原因
        const hasChildren = cause.children && cause.children.length > 0

        Modal.confirm({
            title: '确认删除',
            content: hasChildren
                ? `该原因有 ${cause.children!.length} 个子原因，删除后子原因也将被删除。确认删除吗？`
                : `确认删除原因"${cause.name}"吗？`,
            okText: '确认',
            cancelText: '取消',
            okType: 'danger',
            onOk: async () => {
                try {
                    // 这里应该调用删除API
                    message.success('删除成功')
                    loadCauseTree()
                } catch (error) {
                    message.error('删除失败')
                }
            }
        })
    }

    const saveCause = async () => {
        try {
            // 这里应该调用保存API
            if (isEditCause.value) {
                message.success('更新成功')
            } else {
                message.success('添加成功')
            }
            causeModalVisible.value = false
            loadCauseTree()
        } catch (error) {
            message.error('保存失败')
        }
    }

    // --- 搜索和过滤 ---
    const handleSearch = () => {
        // 搜索逻辑已在 computed 中实现
    }

    const handleReset = () => {
        queryParam.code = ''
        queryParam.name = ''
        queryParam.category = undefined
    }

    const handleFilterChange = () => {
        // 过滤逻辑已在 computed 中实现
    }

    // --- 生命周期 ---
    onMounted(() => {
        loadCauseTree()
    })
</script>

<style scoped>
    .page-container {
        height: 100%;
        padding: 16px;
        background: #f0f2f5;
    }

    .split-layout {
        display: flex;
        gap: 16px;
        height: 100%;
    }

    .left-panel {
        width: 320px;
        background: white;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .right-panel {
        flex: 1;
        background: white;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .panel-header {
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .panel-header .panel-title {
        font-size: 16px;
        font-weight: 500;
    }

    .filter-box,
    .search-box {
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
    }

    .tree-container {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
    }

    .tree-node-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding-right: 8px;
    }

    .tree-node-content .node-title {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .tree-node-content .node-title .high-freq-icon {
        color: #faad14;
        font-size: 14px;
    }

    .tree-node-content .node-actions {
        display: none;
        gap: 8px;
    }

    .tree-node-content .node-actions .action-icon {
        cursor: pointer;
        color: #1890ff;
        font-size: 14px;
    }

    .tree-node-content .node-actions .action-icon:hover {
        color: #40a9ff;
    }

    .tree-node-content:hover .node-actions {
        display: flex;
    }

    .right-header {
        padding: 16px;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .right-header .header-info .category-title {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 8px;
    }

    .right-header .header-info .category-meta {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .table-container {
        flex: 1;
        overflow: hidden;
        padding: 16px;
    }

    .empty-state {
        padding: 40px 0;
    }
</style>