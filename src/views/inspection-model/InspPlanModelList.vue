<template>
    <div class="page-container">
        <div class="toolbar">
            <a-space>
                <a-button type="primary" @click="handleAdd">
                    <template #icon>
                        <PlusOutlined />
                    </template>新增计划
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
                <a-button @click="loadData">
                    <template #icon>
                        <ReloadOutlined />
                    </template>刷新
                </a-button>
            </a-space>
        </div>

        <a-card class="search-card" :bordered="false">
            <a-form layout="inline" :model="queryParam">
                <a-form-item label="计划编码">
                    <a-input v-model:value="queryParam.planCode" placeholder="请输入" allow-clear style="width: 160px" />
                </a-form-item>
                <a-form-item label="计划名称">
                    <a-input v-model:value="queryParam.planName" placeholder="请输入" allow-clear style="width: 200px" />
                </a-form-item>
                <a-form-item label="状态">
                    <a-select v-model:value="queryParam.planStatus" style="width: 120px" allow-clear placeholder="请选择">
                        <a-select-option value="DRAFT">草稿</a-select-option>
                        <a-select-option value="ACTIVE">生效</a-select-option>
                        <a-select-option value="SUSPENDED">挂起</a-select-option>
                        <a-select-option value="OBSOLETE">已作废</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="触发类型">
                    <a-select v-model:value="queryParam.triggerType" style="width: 120px" allow-clear placeholder="请选择">
                        <a-select-option value="EVENT">事件驱动</a-select-option>
                        <a-select-option value="TIME">周期驱动</a-select-option>
                        <a-select-option value="QUANTITY">数量驱动</a-select-option>
                        <a-select-option value="MANUAL">手动</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="归属组织">
                    <a-select v-model:value="queryParam.orgIds" mode="multiple"
                        style="min-width: 200px; max-width: 300px" allow-clear placeholder="不限" :options="orgOptions"
                        :max-tag-count="2" />
                </a-form-item>
                <a-form-item>
                    <a-button type="primary" @click="handleSearch">查询</a-button>
                    <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
                </a-form-item>
            </a-form>
        </a-card>

        <div class="table-container">
            <a-table :columns="columns" :data-source="tableData" :loading="loading" row-key="id" size="middle"
                :row-selection="{ selectedRowKeys, onChange: onSelectChange }" :pagination="pagination"
                @change="handleTableChange" :scroll="{ x: 1600 }">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'planStatus'">
                        <a-tag :color="getStatusColor(record.planStatus)">{{ getStatusText(record.planStatus) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'orgId'">
                        <a-tag v-if="record.orgId === null" color="gold">集团</a-tag>
                        <a-tag v-else color="cyan">{{ getOrgName(record.orgId) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'triggerType'">
                        <a-tag :color="getTriggerColor(record.triggerType)">{{ getTriggerText(record.triggerType)
                            }}</a-tag>
                    </template>
                    <template v-if="column.key === 'isLatestVersion'">
                        <a-tag v-if="record.isLatestVersion" color="green">最新</a-tag>
                        <a-tag v-else color="default">旧版</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-space>
                            <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
                            <a-divider type="vertical" />
                            <a-button type="link" size="small" @click="handleEdit(record)"
                                :disabled="record.planStatus !== 'DRAFT'">编辑</a-button>
                            <a-divider type="vertical" />
                            <a-dropdown>
                                <a-button type="link" size="small">更多
                                    <DownOutlined />
                                </a-button>
                                <template #overlay>
                                    <a-menu @click="(e: any) => handleMenuClick(record, e.key)">
                                        <a-menu-item key="activate" :disabled="record.planStatus !== 'DRAFT'">
                                            <CheckCircleOutlined /> 激活生效
                                        </a-menu-item>
                                        <a-menu-item key="suspend" :disabled="record.planStatus !== 'ACTIVE'">
                                            <PauseCircleOutlined /> 挂起
                                        </a-menu-item>
                                        <a-menu-item key="resume" :disabled="record.planStatus !== 'SUSPENDED'">
                                            <PlayCircleOutlined /> 恢复
                                        </a-menu-item>
                                        <a-menu-item key="newVersion"
                                            :disabled="record.planStatus !== 'ACTIVE' && record.planStatus !== 'SUSPENDED'">
                                            <BranchesOutlined /> 发布新版本
                                        </a-menu-item>
                                        <a-menu-item key="obsolete" :disabled="record.planStatus === 'OBSOLETE'">
                                            <StopOutlined /> 作废
                                        </a-menu-item>
                                        <a-menu-divider />
                                        <a-menu-item key="copy">
                                            <CopyOutlined /> 复制计划
                                        </a-menu-item>
                                        <a-menu-divider />
                                        <a-menu-item key="delete" danger
                                            :disabled="record.planStatus !== 'DRAFT'">删除</a-menu-item>
                                    </a-menu>
                                </template>
                            </a-dropdown>
                        </a-space>
                    </template>
                </template>
            </a-table>
        </div>

        <!-- 复制计划弹窗 -->
        <a-modal v-model:open="copyModal.visible" title="复制检验计划" ok-text="确认复制" cancel-text="取消" @ok="confirmCopy">
            <a-alert type="info" show-icon style="margin-bottom: 16px">
                <template #message>
                    复制将创建一个独立的草稿计划，保留原计划关联的方案结构。可选择继承模式。
                </template>
            </a-alert>
            <a-form :model="copyForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="源计划">
                    <span class="copy-source-label">{{ copyModal.source?.planCode }} - {{ copyModal.source?.planName
                        }}</span>
                </a-form-item>
                <a-form-item label="目标编码" required>
                    <a-input v-model:value="copyForm.planCode" placeholder="新计划编码" />
                </a-form-item>
                <a-form-item label="目标名称" required>
                    <a-input v-model:value="copyForm.planName" placeholder="新计划名称" />
                </a-form-item>
                <a-form-item label="归属组织" required>
                    <a-select v-model:value="copyForm.orgId" placeholder="选择所属组织" :options="orgOptions" />
                </a-form-item>
                <a-form-item label="新版本">
                    <a-input v-model:value="copyForm.version" placeholder="如: V1.0" />
                </a-form-item>
                <a-form-item label="继承模式">
                    <a-radio-group v-model:value="copyForm.inheritMode">
                        <a-radio value="full">完全复制（含触发与参数覆盖）</a-radio>
                        <a-radio value="partial">仅基础配置</a-radio>
                    </a-radio-group>
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 发布新版本弹窗 -->
        <a-modal v-model:open="newVersionModal.visible" title="发布新版本" ok-text="确认发布" cancel-text="取消"
            @ok="confirmNewVersion">
            <a-alert type="warning" show-icon style="margin-bottom: 16px">
                <template #message>将基于当前计划创建新版本草稿，可选择是否作废旧版。</template>
            </a-alert>
            <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="当前版本">{{ newVersionModal.source?.version }}</a-form-item>
                <a-form-item label="新版本号" required>
                    <a-input v-model:value="newVersionForm.version" placeholder="如: V2.0" />
                </a-form-item>
                <a-form-item label="作废旧版">
                    <a-switch v-model:checked="newVersionForm.obsoleteOld" />
                    <span style="margin-left: 8px; color: #999">勾选后旧版本将自动作废</span>
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { message, Modal } from 'ant-design-vue'
    import {
        PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
        DownOutlined, CopyOutlined, CheckCircleOutlined,
        PauseCircleOutlined, PlayCircleOutlined, BranchesOutlined, StopOutlined
    } from '@ant-design/icons-vue'
    import type { InspPlanModelStatus, PlanTriggerType } from '@/types'

    const router = useRouter()

    // --- 组织 ---
    const ORG_MAP: Record<string, string> = {
        'ORG001': '合肥工厂', 'ORG002': '芜湖工厂', 'ORG003': '宁波工厂'
    }
    const orgOptions = [
        { value: 'GROUP', label: '集团（通用）' },
        { value: 'ORG001', label: '合肥工厂' },
        { value: 'ORG002', label: '芜湖工厂' },
        { value: 'ORG003', label: '宁波工厂' },
    ]
    const getOrgName = (orgId: string | null) => orgId === null ? '集团' : (ORG_MAP[orgId] ?? orgId)

    // --- 状态 ---
    const loading = ref(false)
    const tableData = ref < any[] > ([])
    const selectedRowKeys = ref < string[] > ([])

    const queryParam = reactive({
        planCode: '',
        planName: '',
        planStatus: undefined as InspPlanModelStatus | undefined,
        triggerType: undefined as PlanTriggerType | undefined,
        orgIds: [] as string[]
    })

    const pagination = reactive({ current: 1, pageSize: 20, total: 0, showSizeChanger: true, showQuickJumper: true })

    const columns = [
        { title: '计划编码', dataIndex: 'planCode', key: 'planCode', width: 180 },
        { title: '计划名称', dataIndex: 'planName', key: 'planName', width: 220 },
        { title: '版本', dataIndex: 'version', key: 'version', width: 70 },
        { title: '归属', key: 'orgId', width: 100 },
        { title: '状态', key: 'planStatus', width: 90 },
        { title: '最新版', key: 'isLatestVersion', width: 80 },
        { title: '检验类型', dataIndex: 'inspType', key: 'inspType', width: 100 },
        { title: '触发类型', key: 'triggerType', width: 100 },
        { title: '关联方案', dataIndex: 'schemeName', key: 'schemeName', width: 160 },
        { title: '责任人', dataIndex: 'executorName', key: 'executorName', width: 100 },
        { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 150 },
        { title: '操作', key: 'action', width: 200, fixed: 'right' as const }
    ]

    const getStatusColor = (s: string) => ({ DRAFT: 'default', ACTIVE: 'success', SUSPENDED: 'warning', OBSOLETE: 'error' }[s] || 'default')
    const getStatusText = (s: string) => ({ DRAFT: '草稿', ACTIVE: '生效', SUSPENDED: '挂起', OBSOLETE: '已作废' }[s] || s)
    const getTriggerColor = (t: string) => ({ EVENT: 'blue', TIME: 'orange', QUANTITY: 'purple', MANUAL: 'default' }[t] || 'default')
    const getTriggerText = (t: string) => ({ EVENT: '事件驱动', TIME: '周期驱动', QUANTITY: '数量驱动', MANUAL: '手动' }[t] || t)

    // --- Mock 数据 ---
    const mockAllData: any[] = [
        { id: '701', planCode: 'PLN-HFC-IQC-001', planName: '合肥-压铸件进料检验计划', version: 'V1.0', orgId: 'ORG001', planStatus: 'ACTIVE', inspType: 'IQC', triggerType: 'EVENT', schemeName: '压铸件IQC方案', executorName: '张三', isLatestVersion: true, copyFromId: null, updateTime: '2026-01-10 10:00' },
        { id: '702', planCode: 'PLN-GROUP-IQC-L1', planName: '集团来料加严检验计划L1', version: 'V1.2', orgId: null, planStatus: 'DRAFT', inspType: 'IQC', triggerType: 'EVENT', schemeName: 'IQC标准方案', executorName: '', isLatestVersion: true, copyFromId: null, updateTime: '2026-01-12 14:30' },
        { id: '703', planCode: 'PLN-WH-PATROL-001', planName: '芜湖-电机巡检计划', version: 'V2.0', orgId: 'ORG002', planStatus: 'ACTIVE', inspType: 'PATROL', triggerType: 'TIME', schemeName: 'IPQC巡检方案', executorName: '李四', isLatestVersion: true, copyFromId: null, updateTime: '2026-01-11 09:15' },
        { id: '704', planCode: 'PLN-GROUP-OQC-001', planName: '集团出货检验计划', version: 'V1.0', orgId: null, planStatus: 'OBSOLETE', inspType: 'OQC', triggerType: 'MANUAL', schemeName: 'OQC标准方案', executorName: '王五', isLatestVersion: false, copyFromId: null, updateTime: '2025-12-20 16:00' },
        { id: '705', planCode: 'PLN-NB-IPQC-QTY', planName: '宁波-注塑批量检计划', version: 'V1.0', orgId: 'ORG003', planStatus: 'ACTIVE', inspType: 'IPQC', triggerType: 'QUANTITY', schemeName: 'IPQC注塑方案', executorName: '赵六', isLatestVersion: true, copyFromId: null, updateTime: '2026-01-08 09:00' },
        { id: '706', planCode: 'PLN-HFC-IQC-001', planName: '合肥-压铸件检验计划(旧)', version: 'V0.9', orgId: 'ORG001', planStatus: 'SUSPENDED', inspType: 'IQC', triggerType: 'EVENT', schemeName: '压铸件IQC方案', executorName: '张三', isLatestVersion: false, copyFromId: null, updateTime: '2025-12-15 08:30' },
    ]

    // --- 加载 ---
    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            let data = [...mockAllData]
            if (queryParam.planCode) data = data.filter(i => i.planCode.includes(queryParam.planCode))
            if (queryParam.planName) data = data.filter(i => i.planName.includes(queryParam.planName))
            if (queryParam.planStatus) data = data.filter(i => i.planStatus === queryParam.planStatus)
            if (queryParam.triggerType) data = data.filter(i => i.triggerType === queryParam.triggerType)
            if (queryParam.orgIds.length > 0) {
                data = data.filter(i => {
                    if (queryParam.orgIds.includes('GROUP') && i.orgId === null) return true
                    return i.orgId !== null && queryParam.orgIds.includes(i.orgId)
                })
            }
            tableData.value = data
            pagination.total = data.length
            loading.value = false
        }, 300)
    }
    const handleSearch = () => { pagination.current = 1; loadData() }
    const handleReset = () => {
        queryParam.planCode = ''; queryParam.planName = ''
        queryParam.planStatus = undefined; queryParam.triggerType = undefined; queryParam.orgIds = []
        handleSearch()
    }
    const handleTableChange = (pag: any) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; loadData() }
    const onSelectChange = (keys: string[]) => { selectedRowKeys.value = keys }

    // --- 操作 ---
    const handleAdd = () => router.push('/inspection-model/insp-plan-model/create')
    const handleView = (record: any) => router.push(`/inspection-model/insp-plan-model/view/${record.id}`)
    const handleEdit = (record?: any) => {
        const item = record?.id ? record : tableData.value.find(i => i.id === selectedRowKeys.value[0])
        if (!item) return
        if (item.planStatus !== 'DRAFT') { message.warning('只有草稿状态的计划可以编辑'); return }
        router.push(`/inspection-model/insp-plan-model/edit/${item.id}`)
    }
    const handleBatchDelete = () => {
        const items = tableData.value.filter(i => selectedRowKeys.value.includes(i.id) && i.planStatus === 'DRAFT')
        if (items.length === 0) { message.warning('只有草稿状态的计划可以删除'); return }
        Modal.confirm({
            title: '确认删除', content: `确定删除 ${items.length} 条草稿计划？`, okType: 'danger',
            onOk() { tableData.value = tableData.value.filter(i => !items.map(d => d.id).includes(i.id)); selectedRowKeys.value = []; message.success('删除成功') }
        })
    }

    // --- 复制 ---
    const copyModal = reactive < { visible: boolean; source: any | null } > ({ visible: false, source: null })
    const copyForm = reactive({ planCode: '', planName: '', orgId: undefined as string | undefined, version: 'V1.0', inheritMode: 'full' as 'full' | 'partial' })
    function openCopyModal(record: any) {
        copyModal.source = record; copyForm.planCode = record.planCode + '-COPY'; copyForm.planName = record.planName + '（副本）'
        copyForm.orgId = record.orgId ?? 'ORG001'; copyForm.version = 'V1.0'; copyForm.inheritMode = 'full'; copyModal.visible = true
    }
    function confirmCopy() {
        if (!copyForm.planCode.trim() || !copyForm.planName.trim() || !copyForm.orgId) { message.error('请填写完整信息'); return }
        mockAllData.unshift({
            ...copyModal.source, id: `copy-${Date.now()}`, planCode: copyForm.planCode, planName: copyForm.planName,
            orgId: copyForm.orgId === 'GROUP' ? null : copyForm.orgId, version: copyForm.version, planStatus: 'DRAFT',
            isLatestVersion: true, copyFromId: copyModal.source?.id,
            triggerType: copyForm.inheritMode === 'full' ? copyModal.source?.triggerType : 'MANUAL',
            updateTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16)
        })
        loadData(); copyModal.visible = false; message.success(`已复制为「${copyForm.planName}」`)
    }

    // --- 新版本 ---
    const newVersionModal = reactive < { visible: boolean; source: any | null } > ({ visible: false, source: null })
    const newVersionForm = reactive({ version: '', obsoleteOld: true })
    function openNewVersionModal(record: any) {
        newVersionModal.source = record
        const m = (record.version || 'V1.0').match(/V(\d+)\.(\d+)/)
        newVersionForm.version = m ? `V${parseInt(m[1])}.${parseInt(m[2]) + 1}` : 'V2.0'
        newVersionForm.obsoleteOld = true; newVersionModal.visible = true
    }
    function confirmNewVersion() {
        if (!newVersionForm.version.trim()) { message.error('请输入新版本号'); return }
        const src = newVersionModal.source
        mockAllData.unshift({ ...src, id: `ver-${Date.now()}`, version: newVersionForm.version, planStatus: 'DRAFT', isLatestVersion: true, copyFromId: src?.id, updateTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16) })
        if (newVersionForm.obsoleteOld) { src.planStatus = 'OBSOLETE'; src.isLatestVersion = false } else { src.isLatestVersion = false }
        loadData(); newVersionModal.visible = false; message.success(`新版本 ${newVersionForm.version} 已创建`)
    }

    // --- 菜单操作 ---
    const handleMenuClick = (record: any, key: string) => {
        if (key === 'copy') { openCopyModal(record); return }
        if (key === 'newVersion') { openNewVersionModal(record); return }
        if (key === 'delete') {
            Modal.confirm({ title: '确认删除', content: `确定删除 ${record.planName}？`, okType: 'danger', onOk() { tableData.value = tableData.value.filter(i => i.id !== record.id); message.success('删除成功') } })
            return
        }
        const statusMap: Record<string, InspPlanModelStatus> = { activate: 'ACTIVE', suspend: 'SUSPENDED', resume: 'ACTIVE', obsolete: 'OBSOLETE' }
        const newStatus = statusMap[key]
        if (newStatus) {
            Modal.confirm({
                title: '确认操作', content: `确定将「${record.planName}」变更为「${getStatusText(newStatus)}」？`,
                onOk() { record.planStatus = newStatus; message.success('状态变更成功') }
            })
        }
    }

    onMounted(() => loadData())
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

    .copy-source-label {
        color: #1890ff;
        font-weight: 500;
    }
</style>