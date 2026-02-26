<template>
    <div class="page-container">
        <div class="toolbar">
            <a-space>
                <a-button type="primary" @click="showAddModal">
                    <template #icon>
                        <PlusOutlined />
                    </template>新增映射
                </a-button>
                <a-button :disabled="selectedRowKeys.length !== 1" @click="handleEditSelected">
                    <template #icon>
                        <EditOutlined />
                    </template>编辑
                </a-button>
                <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
                    <template #icon>
                        <DeleteOutlined />
                    </template>删除
                </a-button>
                <a-dropdown :disabled="selectedRowKeys.length === 0">
                    <a-button>状态操作
                        <DownOutlined />
                    </a-button>
                    <template #overlay>
                        <a-menu @click="handleBatchStatusChange">
                            <a-menu-item key="enable">批量启用</a-menu-item>
                            <a-menu-item key="disable">批量禁用</a-menu-item>
                        </a-menu>
                    </template>
                </a-dropdown>
                <a-button @click="fetchData">
                    <template #icon>
                        <ReloadOutlined />
                    </template>刷新
                </a-button>
            </a-space>
        </div>

        <!-- Tabs 页签 -->
        <a-tabs v-model:activeKey="activeTab" type="card" class="mapping-tabs">
            <!-- 页签1：物料编码映射 -->
            <a-tab-pane key="materialMapping" tab="物料编码映射">
                <a-card class="search-card" :bordered="false">
                    <a-form layout="inline" :model="searchForm">
                        <a-form-item label="客户/供应商">
                            <a-input v-model:value="searchForm.partnerName" placeholder="请输入" allow-clear
                                style="width: 160px" />
                        </a-form-item>
                        <a-form-item label="外部物料编码">
                            <a-input v-model:value="searchForm.externalCode" placeholder="请输入" allow-clear
                                style="width: 160px" />
                        </a-form-item>
                        <a-form-item label="内部物料编码">
                            <a-input v-model:value="searchForm.internalCode" placeholder="请输入" allow-clear
                                style="width: 160px" />
                        </a-form-item>
                        <a-form-item label="状态">
                            <a-select v-model:value="searchForm.status" style="width: 100px" placeholder="全部"
                                allow-clear>
                                <a-select-option value="1">启用</a-select-option>
                                <a-select-option value="0">禁用</a-select-option>
                            </a-select>
                        </a-form-item>
                        <a-form-item>
                            <a-button type="primary" @click="handleSearch">查询</a-button>
                            <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
                        </a-form-item>
                    </a-form>
                </a-card>
                <div class="table-container">
                    <a-table :columns="materialMappingColumns" :data-source="filteredMaterialData" :loading="loading"
                        row-key="id" size="middle" :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
                        :pagination="pagination" @change="handleTableChange">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'direction'">
                                <a-tag :color="record.direction === 'customer' ? 'blue' : 'green'">
                                    {{ record.direction === 'customer' ? '客户' : '供应商' }}
                                </a-tag>
                            </template>
                            <template v-if="column.key === 'status'">
                                <a-tag :color="record.status === '1' ? 'green' : 'red'">
                                    {{ record.status === '1' ? '启用' : '禁用' }}
                                </a-tag>
                            </template>
                            <template v-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
                                    <a-divider type="vertical" />
                                    <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
                                    <a-divider type="vertical" />
                                    <a-button type="link" danger size="small"
                                        @click="handleDelete(record)">删除</a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                </div>
            </a-tab-pane>

            <!-- 页签2：CTQ标准协同 -->
            <a-tab-pane key="ctqMapping" tab="CTQ标准协同">
                <!-- CSR 版本联动提醒横幅 -->
                <a-alert v-if="csrVersionAlerts.length > 0" type="warning" show-icon closable
                    style="margin-bottom: 16px;">
                    <template #message>
                        <span>CSR 协议版本变更提醒</span>
                    </template>
                    <template #description>
                        <div v-for="(alert, idx) in csrVersionAlerts" :key="idx" style="margin-bottom: 4px;">
                            ⚠️ 客户 <b>{{ alert.customerName }}</b> 的 CSR 协议已从
                            <a-tag color="red">{{ alert.oldVersion }}</a-tag> 更新至
                            <a-tag color="green">{{ alert.newVersion }}</a-tag>，
                            请核对并同步更新以下 CTQ 参数阈值：
                            <a @click="handleFilterByCsr(alert.customerName)" style="margin-left: 4px;">查看受影响的 CTQ →</a>
                        </div>
                    </template>
                </a-alert>

                <a-card class="search-card" :bordered="false">
                    <a-form layout="inline" :model="ctqSearchForm">
                        <a-form-item label="客户名称">
                            <a-input v-model:value="ctqSearchForm.customerName" placeholder="请输入" allow-clear
                                style="width: 160px" />
                        </a-form-item>
                        <a-form-item label="CTQ特性名称">
                            <a-input v-model:value="ctqSearchForm.ctqName" placeholder="请输入" allow-clear
                                style="width: 160px" />
                        </a-form-item>
                        <a-form-item>
                            <a-button type="primary" @click="handleCtqSearch">查询</a-button>
                            <a-button style="margin-left: 8px" @click="resetCtqSearch">重置</a-button>
                        </a-form-item>
                    </a-form>
                </a-card>
                <div class="table-container">
                    <a-table :columns="ctqColumns" :data-source="filteredCtqData" :loading="loading" row-key="id"
                        size="middle" :pagination="false">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'severity'">
                                <a-tag
                                    :color="record.severity === 'critical' ? 'red' : record.severity === 'major' ? 'orange' : 'blue'">
                                    {{ record.severity === 'critical' ? '关键特性(CC)' : record.severity === 'major' ?
                                    '重要特性(SC)' : '一般特性' }}
                                </a-tag>
                            </template>
                            <template v-if="column.key === 'csrSource'">
                                <a v-if="record.csrClauseId" @click="handleGoToCsr(record)">
                                    {{ record.csrClauseDesc }}
                                </a>
                                <span v-else style="color: #bfbfbf;">未关联</span>
                            </template>
                            <template v-if="column.key === 'csrVersion'">
                                <template v-if="record.csrVersion">
                                    <a-tag :color="record.csrVersionOutdated ? 'red' : 'green'">
                                        {{ record.csrVersion }}
                                    </a-tag>
                                    <a-tooltip v-if="record.csrVersionOutdated" title="CSR 协议版本已更新，请核查本项参数">
                                        <ExclamationCircleOutlined style="color: #ff4d4f; margin-left: 4px;" />
                                    </a-tooltip>
                                </template>
                                <span v-else style="color: #bfbfbf;">—</span>
                            </template>
                            <template v-if="column.key === 'syncStatus'">
                                <a-tag :color="record.syncStatus === 'synced' ? 'green' : 'orange'">
                                    {{ record.syncStatus === 'synced' ? '已同步' : '待同步' }}
                                </a-tag>
                            </template>
                            <template v-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="handleCtqSync(record)">
                                        {{ record.syncStatus === 'synced' ? '重新同步' : '同步至检验项' }}
                                    </a-button>
                                    <a-divider type="vertical" />
                                    <a-button type="link" size="small" @click="handleCtqView(record)">查看</a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                </div>
            </a-tab-pane>

            <!-- 页签3：追溯关系配置 -->
            <a-tab-pane key="traceMapping" tab="追溯关系配置">
                <a-card class="search-card" :bordered="false">
                    <a-form layout="inline" :model="traceSearchForm">
                        <a-form-item label="成品物料">
                            <a-input v-model:value="traceSearchForm.productName" placeholder="请输入" allow-clear
                                style="width: 160px" />
                        </a-form-item>
                        <a-form-item label="客户名称">
                            <a-input v-model:value="traceSearchForm.customerName" placeholder="请输入" allow-clear
                                style="width: 160px" />
                        </a-form-item>
                        <a-form-item>
                            <a-button type="primary" @click="handleTraceSearch">查询</a-button>
                            <a-button style="margin-left: 8px" @click="resetTraceSearch">重置</a-button>
                        </a-form-item>
                    </a-form>
                </a-card>
                <div class="table-container">
                    <a-table :columns="traceColumns" :data-source="filteredTraceData" :loading="loading" row-key="id"
                        size="middle" :pagination="false">
                        <template #bodyCell="{ column, record }">
                            <template v-if="column.key === 'traceLink'">
                                <a-steps :current="4" size="small" style="max-width: 500px">
                                    <a-step :title="record.supplierName" description="供应商" />
                                    <a-step :title="record.rawMaterial" description="原材料" />
                                    <a-step :title="record.processName" description="生产工序" />
                                    <a-step :title="record.productCode" description="成品" />
                                    <a-step :title="record.customerName" description="客户" />
                                </a-steps>
                            </template>
                            <template v-if="column.key === 'action'">
                                <a-space>
                                    <a-button type="link" size="small" @click="handleTraceView(record)">查看链路</a-button>
                                    <a-divider type="vertical" />
                                    <a-button type="link" size="small" @click="handleTraceEdit(record)">编辑</a-button>
                                </a-space>
                            </template>
                        </template>
                    </a-table>
                </div>
            </a-tab-pane>
        </a-tabs>

        <!-- 物料编码映射 新增/编辑 弹窗 -->
        <a-modal v-model:open="modalVisible" :title="modalTitle" width="700px" @ok="handleSubmit" @cancel="handleCancel"
            :footer="isView ? null : undefined">
            <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="映射方向" name="direction">
                            <a-select v-model:value="formData.direction" placeholder="请选择" :disabled="isView">
                                <a-select-option value="customer">客户方向</a-select-option>
                                <a-select-option value="supplier">供应商方向</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="客户/供应商" name="partnerId">
                            <a-select v-model:value="formData.partnerId" placeholder="请选择" :disabled="isView"
                                show-search :filter-option="filterOption">
                                <a-select-option v-for="p in partnerOptions" :key="p.id" :value="p.id">
                                    {{ p.name }} ({{ p.code }})
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="外部物料编码" name="externalCode">
                            <a-input v-model:value="formData.externalCode" placeholder="对方系统中的物料编码"
                                :disabled="isView" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="外部物料名称" name="externalName">
                            <a-input v-model:value="formData.externalName" placeholder="对方系统中的物料名称"
                                :disabled="isView" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="16">
                    <a-col :span="12">
                        <a-form-item label="内部标准物料" name="internalMaterialId">
                            <a-select v-model:value="formData.internalMaterialId" placeholder="请选择本系统物料"
                                :disabled="isView" show-search :filter-option="filterOption">
                                <a-select-option v-for="m in materialOptions" :key="m.id" :value="m.id">
                                    {{ m.name }} ({{ m.code }})
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="12">
                        <a-form-item label="状态" name="status">
                            <a-radio-group v-model:value="formData.status" :disabled="isView">
                                <a-radio value="1">启用</a-radio>
                                <a-radio value="0">禁用</a-radio>
                            </a-radio-group>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-form-item label="备注" name="remark">
                    <a-textarea v-model:value="formData.remark" placeholder="请输入备注" :rows="2" :disabled="isView" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- CTQ 查看弹窗 -->
        <a-modal v-model:open="ctqViewVisible" title="CTQ特性详情" width="700px" :footer="null">
            <a-descriptions :column="2" bordered v-if="ctqViewData">
                <a-descriptions-item label="客户名称">{{ ctqViewData.customerName }}</a-descriptions-item>
                <a-descriptions-item label="CTQ特性名称">{{ ctqViewData.ctqName }}</a-descriptions-item>
                <a-descriptions-item label="严重等级">{{ ctqViewData.severity === 'critical' ? '关键特性(CC)' :
                    ctqViewData.severity === 'major' ? '重要特性(SC)' : '一般特性' }}</a-descriptions-item>
                <a-descriptions-item label="同步状态">{{ ctqViewData.syncStatus === 'synced' ? '已同步' : '待同步'
                    }}</a-descriptions-item>
                <a-descriptions-item label="关联物料">{{ ctqViewData.materialName }}</a-descriptions-item>
                <a-descriptions-item label="关联检验项">{{ ctqViewData.inspItemName || '未关联' }}</a-descriptions-item>
                <a-descriptions-item label="标准要求" :span="2">{{ ctqViewData.standardDesc }}</a-descriptions-item>
                <a-descriptions-item label="来源 CSR" :span="2">
                    <template v-if="ctqViewData.csrClauseId">
                        <a @click="handleGoToCsr(ctqViewData)">{{ ctqViewData.csrClauseDesc }}</a>
                        <a-tag :color="ctqViewData.csrVersionOutdated ? 'red' : 'green'" style="margin-left: 8px;">
                            {{ ctqViewData.csrVersion }}
                        </a-tag>
                        <span v-if="ctqViewData.csrVersionOutdated" style="color: #ff4d4f; margin-left: 4px;">⚠
                            版本已更新，请校验</span>
                    </template>
                    <span v-else style="color: #bfbfbf;">未关联 CSR 条款</span>
                </a-descriptions-item>
            </a-descriptions>
        </a-modal>

        <!-- 追溯链路查看弹窗 -->
        <a-modal v-model:open="traceViewVisible" title="追溯链路详情" width="800px" :footer="null">
            <a-descriptions :column="2" bordered v-if="traceViewData">
                <a-descriptions-item label="成品编码">{{ traceViewData.productCode }}</a-descriptions-item>
                <a-descriptions-item label="成品名称">{{ traceViewData.productName }}</a-descriptions-item>
                <a-descriptions-item label="客户">{{ traceViewData.customerName }}</a-descriptions-item>
                <a-descriptions-item label="生产工序">{{ traceViewData.processName }}</a-descriptions-item>
                <a-descriptions-item label="原材料">{{ traceViewData.rawMaterial }}</a-descriptions-item>
                <a-descriptions-item label="供应商">{{ traceViewData.supplierName }}</a-descriptions-item>
            </a-descriptions>
            <a-divider>追溯链路可视化</a-divider>
            <a-steps :current="4" size="small" direction="vertical">
                <a-step title="客户" :description="traceViewData?.customerName" status="finish" />
                <a-step title="成品" :description="`${traceViewData?.productCode} - ${traceViewData?.productName}`"
                    status="finish" />
                <a-step title="生产工序" :description="traceViewData?.processName" status="finish" />
                <a-step title="原材料" :description="traceViewData?.rawMaterial" status="finish" />
                <a-step title="供应商" :description="traceViewData?.supplierName" status="finish" />
            </a-steps>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { message, Modal } from 'ant-design-vue'
    import {
        PlusOutlined, EditOutlined, DeleteOutlined,
        ReloadOutlined, DownOutlined, ExclamationCircleOutlined
    } from '@ant-design/icons-vue'
    import { useRouter } from 'vue-router'

    // ==================== 通用状态 ====================
    const router = useRouter()
    const loading = ref(false)
    const activeTab = ref('materialMapping')
    const selectedRowKeys = ref < string[] > ([])
    const modalVisible = ref(false)
    const isEditMode = ref(false)
    const isView = ref(false)
    const formRef = ref()

    // ==================== Mock: 客户/供应商下拉选项 ====================
    const partnerOptions = ref([
        { id: 'C001', code: 'CUST001', name: '华为技术有限公司', type: 'customer' },
        { id: 'C002', code: 'CUST002', name: '腾讯科技有限公司', type: 'customer' },
        { id: 'C003', code: 'CUST003', name: '阿里巴巴集团', type: 'customer' },
        { id: 'S001', code: 'SUP001', name: '富士康科技集团', type: 'supplier' },
        { id: 'S002', code: 'SUP002', name: '立讯精密工业', type: 'supplier' },
        { id: 'S003', code: 'SUP003', name: '宁德时代新能源', type: 'supplier' }
    ])

    // ==================== Mock: 内部物料下拉选项 ====================
    const materialOptions = ref([
        { id: 'M001', code: 'MAT-001', name: '铝合金压铸件A' },
        { id: 'M002', code: 'MAT-002', name: '锌合金外壳B' },
        { id: 'M003', code: 'MAT-003', name: '精密连接器C' },
        { id: 'M004', code: 'MAT-004', name: '散热模组D' },
        { id: 'M005', code: 'MAT-005', name: '电池模组E' }
    ])

    // ==================== 页签1：物料编码映射 ====================
    const searchForm = reactive({
        partnerName: '', externalCode: '', internalCode: '', status: undefined as string | undefined
    })

    const formData = reactive({
        id: '', direction: 'customer' as 'customer' | 'supplier', partnerId: undefined as string | undefined,
        externalCode: '', externalName: '', internalMaterialId: undefined as string | undefined,
        status: '1', remark: ''
    })

    const rules = {
        direction: [{ required: true, message: '请选择映射方向', trigger: 'change' }],
        partnerId: [{ required: true, message: '请选择客户/供应商', trigger: 'change' }],
        externalCode: [{ required: true, message: '请输入外部物料编码', trigger: 'blur' }],
        internalMaterialId: [{ required: true, message: '请选择内部物料', trigger: 'change' }]
    }

    const materialMappingData = ref([
        { id: '1', direction: 'customer', partnerId: 'C001', partnerName: '华为技术有限公司', externalCode: 'HW-AL-001', externalName: '铝壳体组件', internalMaterialId: 'M001', internalCode: 'MAT-001', internalName: '铝合金压铸件A', status: '1', remark: '华为定制编码', createTime: '2024-06-01 10:00:00' },
        { id: '2', direction: 'customer', partnerId: 'C002', partnerName: '腾讯科技有限公司', externalCode: 'TX-ZN-002', externalName: '锌合金机壳', internalMaterialId: 'M002', internalCode: 'MAT-002', internalName: '锌合金外壳B', status: '1', remark: '', createTime: '2024-06-02 14:30:00' },
        { id: '3', direction: 'supplier', partnerId: 'S001', partnerName: '富士康科技集团', externalCode: 'FX-CONN-100', externalName: 'Type-C接口组件', internalMaterialId: 'M003', internalCode: 'MAT-003', internalName: '精密连接器C', status: '1', remark: '富士康供货编码', createTime: '2024-06-03 09:15:00' },
        { id: '4', direction: 'supplier', partnerId: 'S003', partnerName: '宁德时代新能源', externalCode: 'CATL-BAT-E50', externalName: '50Ah方壳电芯', internalMaterialId: 'M005', internalCode: 'MAT-005', internalName: '电池模组E', status: '0', remark: '旧编码，已停用', createTime: '2024-05-10 16:00:00' }
    ])

    const materialMappingColumns = [
        { title: '方向', dataIndex: 'direction', key: 'direction', width: 80 },
        { title: '客户/供应商', dataIndex: 'partnerName', key: 'partnerName', width: 160 },
        { title: '外部物料编码', dataIndex: 'externalCode', key: 'externalCode', width: 140 },
        { title: '外部物料名称', dataIndex: 'externalName', key: 'externalName', width: 150 },
        { title: '内部物料编码', dataIndex: 'internalCode', key: 'internalCode', width: 120 },
        { title: '内部物料名称', dataIndex: 'internalName', key: 'internalName', width: 150 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
        { title: '操作', key: 'action', width: 180, fixed: 'right' as const }
    ]

    const filteredMaterialData = computed(() => {
        let data = [...materialMappingData.value]
        if (searchForm.partnerName) data = data.filter(i => i.partnerName.includes(searchForm.partnerName))
        if (searchForm.externalCode) data = data.filter(i => i.externalCode.includes(searchForm.externalCode))
        if (searchForm.internalCode) data = data.filter(i => i.internalCode.includes(searchForm.internalCode))
        if (searchForm.status) data = data.filter(i => i.status === searchForm.status)
        return data
    })

    // ==================== 页签2：CTQ标准协同 ====================
    const ctqSearchForm = reactive({ customerName: '', ctqName: '' })
    const ctqViewVisible = ref(false)
    const ctqViewData = ref < any > (null)

    // NOTE: CTQ mock 数据中加入 CSR 条款来源关联字段
    const ctqMockData = ref([
        { id: 'CTQ001', customerName: '华为技术有限公司', ctqName: '外观光洁度Ra', severity: 'critical', materialName: '铝合金压铸件A', inspItemName: '表面粗糙度检测', standardDesc: 'Ra ≤ 0.8μm，目视无划痕及凹坑', syncStatus: 'synced', csrClauseId: 'CSR-HW-001', csrClauseDesc: '华为CSR V2024.1 - 外观全检要求', csrVersion: 'V2024.1', csrVersionOutdated: true },
        { id: 'CTQ002', customerName: '华为技术有限公司', ctqName: '尺寸公差-长度', severity: 'major', materialName: '铝合金压铸件A', inspItemName: '外径长度检测', standardDesc: '100±0.05mm，三坐标测量', syncStatus: 'synced', csrClauseId: 'CSR-HW-002', csrClauseDesc: '华为CSR V2024.1 - 关键尺寸管控', csrVersion: 'V2024.1', csrVersionOutdated: true },
        { id: 'CTQ003', customerName: '腾讯科技有限公司', ctqName: '抗压强度', severity: 'critical', materialName: '锌合金外壳B', inspItemName: '', standardDesc: '≥ 350MPa，压力试验机检测', syncStatus: 'pending', csrClauseId: null, csrClauseDesc: '', csrVersion: '', csrVersionOutdated: false },
        { id: 'CTQ004', customerName: '阿里巴巴集团', ctqName: '焊接气密性', severity: 'major', materialName: '散热模组D', inspItemName: '气密性检测', standardDesc: '0.5MPa保压30s无泄漏', syncStatus: 'synced', csrClauseId: 'CSR-ALI-001', csrClauseDesc: '阿里CSR V3.0 - 气密性强控条款', csrVersion: 'V3.0', csrVersionOutdated: false }
    ])

    // NOTE: CSR 版本变更提醒数据（模拟：华为协议从 V2024.1 升级到 V2024.2）
    const csrVersionAlerts = ref([
        { customerName: '华为技术有限公司', oldVersion: 'V2024.1', newVersion: 'V2024.2' }
    ])

    const ctqColumns = [
        { title: '客户名称', dataIndex: 'customerName', key: 'customerName', width: 140 },
        { title: 'CTQ特性名称', dataIndex: 'ctqName', key: 'ctqName', width: 130 },
        { title: '严重等级', dataIndex: 'severity', key: 'severity', width: 120 },
        { title: '来源 CSR', dataIndex: 'csrSource', key: 'csrSource', width: 220 },
        { title: 'CSR版本', dataIndex: 'csrVersion', key: 'csrVersion', width: 100 },
        { title: '关联物料', dataIndex: 'materialName', key: 'materialName', width: 140 },
        { title: '标准要求', dataIndex: 'standardDesc', key: 'standardDesc', width: 180, ellipsis: true },
        { title: '同步状态', dataIndex: 'syncStatus', key: 'syncStatus', width: 90 },
        { title: '操作', key: 'action', width: 180, fixed: 'right' as const }
    ]

    const filteredCtqData = computed(() => {
        let data = [...ctqMockData.value]
        if (ctqSearchForm.customerName) data = data.filter(i => i.customerName.includes(ctqSearchForm.customerName))
        if (ctqSearchForm.ctqName) data = data.filter(i => i.ctqName.includes(ctqSearchForm.ctqName))
        return data
    })

    // ==================== 页签3：追溯关系配置 ====================
    const traceSearchForm = reactive({ productName: '', customerName: '' })
    const traceViewVisible = ref(false)
    const traceViewData = ref < any > (null)

    const traceMockData = ref([
        { id: 'TR001', customerName: '华为技术有限公司', productCode: 'FP-001', productName: '5G基站散热壳体', processName: '压铸→CNC→阳极氧化→装配', rawMaterial: '铝合金ADC12', supplierName: '立讯精密工业' },
        { id: 'TR002', customerName: '腾讯科技有限公司', productCode: 'FP-002', productName: '服务器外壳组件', processName: '压铸→喷砂→喷粉→检验', rawMaterial: '锌合金ZA-8', supplierName: '富士康科技集团' },
        { id: 'TR003', customerName: '阿里巴巴集团', productCode: 'FP-003', productName: '数据中心散热模组', processName: '冲压→焊接→气密检测→总装', rawMaterial: '铜管+铝翅片', supplierName: '宁德时代新能源' }
    ])

    const traceColumns = [
        { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 150 },
        { title: '成品编码', dataIndex: 'productCode', key: 'productCode', width: 100 },
        { title: '成品名称', dataIndex: 'productName', key: 'productName', width: 160 },
        { title: '生产工序', dataIndex: 'processName', key: 'processName', width: 200 },
        { title: '原材料', dataIndex: 'rawMaterial', key: 'rawMaterial', width: 130 },
        { title: '供应商', dataIndex: 'supplierName', key: 'supplierName', width: 150 },
        { title: '操作', key: 'action', width: 150, fixed: 'right' as const }
    ]

    const filteredTraceData = computed(() => {
        let data = [...traceMockData.value]
        if (traceSearchForm.productName) data = data.filter(i => i.productName.includes(traceSearchForm.productName))
        if (traceSearchForm.customerName) data = data.filter(i => i.customerName.includes(traceSearchForm.customerName))
        return data
    })

    // ==================== 分页 ====================
    const pagination = reactive({
        current: 1, pageSize: 20, total: 4,
        showSizeChanger: true, showQuickJumper: true
    })

    // ==================== 计算属性 ====================
    const modalTitle = computed(() => {
        if (isView.value) return '查看物料编码映射'
        return isEditMode.value ? '编辑物料编码映射' : '新增物料编码映射'
    })

    // ==================== 方法 ====================
    const filterOption = (input: string, option: any) => {
        const label = option?.children?.[0]?.children || ''
        return String(label).toLowerCase().includes(input.toLowerCase())
    }

    const onSelectChange = (keys: string[]) => { selectedRowKeys.value = keys }

    const handleSearch = () => { pagination.current = 1 }
    const resetSearch = () => {
        Object.assign(searchForm, { partnerName: '', externalCode: '', internalCode: '', status: undefined })
    }
    const handleCtqSearch = () => { }
    const resetCtqSearch = () => { Object.assign(ctqSearchForm, { customerName: '', ctqName: '' }) }
    const handleTraceSearch = () => { }
    const resetTraceSearch = () => { Object.assign(traceSearchForm, { productName: '', customerName: '' }) }

    const handleTableChange = (pag: any) => {
        pagination.current = pag.current
        pagination.pageSize = pag.pageSize
    }

    const showAddModal = () => {
        isEditMode.value = false
        isView.value = false
        modalVisible.value = true
        resetForm()
    }

    const handleEditSelected = () => {
        const record = materialMappingData.value.find(i => i.id === selectedRowKeys.value[0])
        if (record) handleEdit(record)
    }

    const handleEdit = (record: any) => {
        isEditMode.value = true
        isView.value = false
        modalVisible.value = true
        Object.assign(formData, { ...record })
    }

    const handleView = (record: any) => {
        isEditMode.value = true
        isView.value = true
        modalVisible.value = true
        Object.assign(formData, { ...record })
    }

    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '确认删除', content: `确定删除该映射记录吗？`, okType: 'danger',
            onOk() {
                const idx = materialMappingData.value.findIndex(i => i.id === record.id)
                if (idx > -1) { materialMappingData.value.splice(idx, 1); message.success('删除成功') }
            }
        })
    }

    const handleBatchDelete = () => {
        Modal.confirm({
            title: '确认批量删除', content: `确定删除选中的 ${selectedRowKeys.value.length} 条记录吗？`, okType: 'danger',
            onOk() {
                materialMappingData.value = materialMappingData.value.filter(i => !selectedRowKeys.value.includes(i.id))
                selectedRowKeys.value = []
                message.success('批量删除成功')
            }
        })
    }

    const handleBatchStatusChange = ({ key }: { key: string }) => {
        const newStatus = key === 'enable' ? '1' : '0'
        const statusText = key === 'enable' ? '启用' : '禁用'
        Modal.confirm({
            title: `确认批量${statusText}`, content: `确定${statusText}选中的 ${selectedRowKeys.value.length} 条记录吗？`,
            onOk() {
                materialMappingData.value.forEach(item => {
                    if (selectedRowKeys.value.includes(item.id)) item.status = newStatus
                })
                selectedRowKeys.value = []
                message.success(`批量${statusText}成功`)
            }
        })
    }

    const handleSubmit = async () => {
        try {
            await formRef.value.validate()
            const partner = partnerOptions.value.find(p => p.id === formData.partnerId)
            const material = materialOptions.value.find(m => m.id === formData.internalMaterialId)
            if (isEditMode.value) {
                const idx = materialMappingData.value.findIndex(i => i.id === formData.id)
                if (idx > -1) {
                    materialMappingData.value[idx] = {
                        ...formData, partnerName: partner?.name || '', internalCode: material?.code || '',
                        internalName: material?.name || '', createTime: materialMappingData.value[idx].createTime
                    }
                    message.success('更新成功')
                }
            } else {
                const newId = String(Date.now())
                materialMappingData.value.push({
                    ...formData, id: newId, partnerName: partner?.name || '', internalCode: material?.code || '',
                    internalName: material?.name || '', createTime: new Date().toLocaleString()
                })
                message.success('新增成功')
            }
            modalVisible.value = false
        } catch (error) {
            console.error('表单验证失败:', error)
        }
    }

    const handleCancel = () => { modalVisible.value = false; resetForm() }

    const resetForm = () => {
        Object.assign(formData, {
            id: '', direction: 'customer', partnerId: undefined, externalCode: '', externalName: '',
            internalMaterialId: undefined, status: '1', remark: ''
        })
        formRef.value?.resetFields()
    }

    // CTQ 操作
    const handleCtqSync = (record: any) => {
        record.syncStatus = 'synced'
        message.success(`CTQ特性 [${record.ctqName}] 已成功同步至检验项目`)
    }
    const handleCtqView = (record: any) => { ctqViewData.value = record; ctqViewVisible.value = true }

    /** 点击"来源 CSR"超链接 → 跳转到 CSR 条款维护空间页面 */
    const handleGoToCsr = (record: any) => {
        router.push('/basic-data/csr-management')
        message.info(`正在跳转到 CSR 条款维护空间，查看条款：${record.csrClauseDesc}`)
    }

    /** 根据客户名称快速过滤 CTQ 列表，方便用户查看受 CSR 版本变更影响的条目 */
    const handleFilterByCsr = (customerName: string) => {
        ctqSearchForm.customerName = customerName
    }

    // 追溯操作
    const handleTraceView = (record: any) => { traceViewData.value = record; traceViewVisible.value = true }
    const handleTraceEdit = (record: any) => { message.info(`编辑追溯链路 [${record.productName}] 功能开发中...`) }

    const fetchData = () => {
        loading.value = true
        setTimeout(() => { loading.value = false; pagination.total = filteredMaterialData.value.length }, 300)
    }

    onMounted(() => { fetchData() })
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
    }

    .mapping-tabs {
        background: #fff;
        border-radius: 4px;
        padding: 0 16px 16px;
    }

    .search-card {
        margin-bottom: 16px;
    }

    .table-container {
        background: #fff;
        padding: 0 0 16px;
        border-radius: 4px;
    }
</style>