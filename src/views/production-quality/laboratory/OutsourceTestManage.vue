<template>
    <div class="outsource-test-manage">
        <div class="page-title-bar">
            <h3 style="margin: 0">🏢 委外检测管理</h3>
            <span class="subtitle">管理发送至第三方检测机构的进度与回传报告</span>
        </div>

        <!-- 搜索筛选 -->
        <div class="search-form">
            <a-form layout="inline" :model="queryParams">
                <a-form-item label="任务编号">
                    <a-input v-model:value="queryParams.taskNo" placeholder="LAB-..." allow-clear
                        style="width: 160px" />
                </a-form-item>
                <a-form-item label="委外机构">
                    <a-input v-model:value="queryParams.orgName" placeholder="机构名称" allow-clear style="width: 160px" />
                </a-form-item>
                <a-form-item label="状态">
                    <a-select v-model:value="queryParams.status" placeholder="全部" allow-clear style="width: 140px">
                        <a-select-option value="PENDING_SEND">待寄出</a-select-option>
                        <a-select-option value="IN_TRANSIT">运输中</a-select-option>
                        <a-select-option value="TESTING">检测中</a-select-option>
                        <a-select-option value="REPORT_RECEIVED">报告已回</a-select-option>
                        <a-select-option value="CLOSED">已关闭</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item>
                    <a-space>
                        <a-button type="primary" @click="handleSearch">查询</a-button>
                        <a-button @click="handleReset">重置</a-button>
                    </a-space>
                </a-form-item>
            </a-form>
        </div>

        <!-- 数据表格 -->
        <a-table :columns="columns" :data-source="tableData" :loading="loading" row-key="id" :scroll="{ x: 1600 }"
            size="small" :pagination="{ showTotal: (t: number) => `共 ${t} 条`, showSizeChanger: true }">
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'taskNo'">
                    <a @click="handleView(record)">{{ record.taskNo }}</a>
                </template>

                <template v-if="column.key === 'outsourceStatus'">
                    <a-badge :status="outsourceStatusBadge[record.outsourceStatus]"
                        :text="outsourceStatusLabel[record.outsourceStatus]" />
                </template>

                <template v-if="column.key === 'priority'">
                    <a-tag
                        :color="record.priority === 'CRITICAL' ? 'red' : record.priority === 'URGENT' ? 'orange' : 'default'">
                        {{ record.priority === 'CRITICAL' ? '紧急' : record.priority === 'URGENT' ? '加急' : '常规' }}
                    </a-tag>
                </template>

                <template v-if="column.key === 'trackingNo'">
                    <span v-if="record.trackingNo" style="font-family: monospace; color: #1890ff">{{ record.trackingNo
                        }}</span>
                    <span v-else style="color: #999">未填写</span>
                </template>

                <template v-if="column.key === 'reportFile'">
                    <a-tag v-if="record.reportUploaded" color="success">✅ 已上传</a-tag>
                    <a-tag v-else color="warning">待上传</a-tag>
                </template>

                <template v-if="column.key === 'action'">
                    <a-space>
                        <a-button v-if="record.outsourceStatus === 'PENDING_SEND'" type="link" size="small"
                            @click="handleFillTracking(record)">填写快递</a-button>
                        <a-button v-if="record.outsourceStatus === 'TESTING' || record.outsourceStatus === 'IN_TRANSIT'"
                            type="primary" size="small" @click="handleUploadReport(record)">上传报告</a-button>
                        <a-button type="link" size="small" @click="handleView(record)">详情</a-button>
                    </a-space>
                </template>
            </template>
        </a-table>

        <!-- 快递信息弹窗 -->
        <a-modal v-model:open="trackingModalVisible" title="填写物流快递信息" @ok="handleTrackingConfirm">
            <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="快递公司" required>
                    <a-select v-model:value="trackingForm.carrier" placeholder="选择快递公司">
                        <a-select-option value="SF">顺丰快递</a-select-option>
                        <a-select-option value="JD">京东物流</a-select-option>
                        <a-select-option value="ZTO">中通快递</a-select-option>
                        <a-select-option value="OTHER">其他</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="快递单号" required>
                    <a-input v-model:value="trackingForm.trackingNo" placeholder="请输入快递单号" />
                </a-form-item>
                <a-form-item label="寄出日期">
                    <a-date-picker v-model:value="trackingForm.sendDate" style="width: 100%" />
                </a-form-item>
                <a-form-item label="备注">
                    <a-textarea v-model:value="trackingForm.remark" :rows="2" placeholder="备注信息" />
                </a-form-item>
            </a-form>
        </a-modal>

        <!-- 上传报告弹窗 -->
        <a-modal v-model:open="uploadModalVisible" title="上传委外检测报告" @ok="handleUploadConfirm" :width="600">
            <a-alert message="请上传第三方检测机构出具的正式检测报告" type="info" show-icon style="margin-bottom: 16px" />
            <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-form-item label="判定结果" required>
                    <a-radio-group v-model:value="uploadForm.judgment">
                        <a-radio value="PASS">合格 (PASS)</a-radio>
                        <a-radio value="FAIL">不合格 (FAIL)</a-radio>
                        <a-radio value="CONDITIONAL">有条件接受</a-radio>
                    </a-radio-group>
                </a-form-item>
                <a-form-item label="报告附件" required>
                    <a-upload :max-count="3" :before-upload="() => false">
                        <a-button>
                            <template #icon>
                                <UploadOutlined />
                            </template>
                            选择文件
                        </a-button>
                    </a-upload>
                </a-form-item>
                <a-form-item label="关键数据摘录">
                    <a-textarea v-model:value="uploadForm.dataSummary" :rows="3" placeholder="摘录报告中的关键检测数据" />
                </a-form-item>
                <a-form-item label="备注">
                    <a-textarea v-model:value="uploadForm.remark" :rows="2" />
                </a-form-item>
            </a-form>
            <a-alert v-if="uploadForm.judgment === 'FAIL'" message="⚠️ 判定为不合格时，系统将自动触发钉钉通知品质相关人员" type="warning"
                show-icon style="margin-top: 8px" />
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { message } from 'ant-design-vue'
    import { UploadOutlined } from '@ant-design/icons-vue'
    import dayjs from 'dayjs'

    const router = useRouter()
    const loading = ref(false)

    const queryParams = reactive({ taskNo: '', orgName: '', status: undefined as string | undefined })

    interface OutsourceRecord {
        id: string; taskNo: string; inspItemName: string; materialCode: string; materialName: string
        batchNo: string; externalOrgName: string; externalContact: string; outsourceStatus: string
        priority: string; trackingNo: string; carrier: string; sendDate: string
        reportUploaded: boolean; quotation: number; expectedDate: string; createTime: string
    }

    const tableData = ref < OutsourceRecord[] > ([])

    const outsourceStatusBadge: Record<string, string> = {
        PENDING_SEND: 'warning', IN_TRANSIT: 'processing', TESTING: 'processing', REPORT_RECEIVED: 'success', CLOSED: 'default'
    }
    const outsourceStatusLabel: Record<string, string> = {
        PENDING_SEND: '待寄出', IN_TRANSIT: '运输中', TESTING: '检测中', REPORT_RECEIVED: '报告已回', CLOSED: '已关闭'
    }

    const columns = [
        { title: '任务编号', dataIndex: 'taskNo', key: 'taskNo', width: 170, fixed: 'left' as const },
        { title: '检验项目', dataIndex: 'inspItemName', key: 'inspItemName', width: 150 },
        { title: '物料', dataIndex: 'materialCode', key: 'materialCode', width: 120 },
        { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 130 },
        { title: '委外机构', dataIndex: 'externalOrgName', key: 'externalOrgName', width: 180 },
        { title: '状态', key: 'outsourceStatus', width: 110 },
        { title: '优先级', key: 'priority', width: 80 },
        { title: '快递单号', key: 'trackingNo', width: 160 },
        { title: '报价(元)', dataIndex: 'quotation', key: 'quotation', width: 90 },
        { title: '报告', key: 'reportFile', width: 90 },
        { title: '预期完成', dataIndex: 'expectedDate', key: 'expectedDate', width: 120 },
        { title: '操作', key: 'action', width: 180, fixed: 'right' as const }
    ]

    // 快递弹窗
    const trackingModalVisible = ref(false)
    const trackingForm = reactive({ carrier: '', trackingNo: '', sendDate: null as any, remark: '' })
    const currentRecord = ref < OutsourceRecord | null > (null)

    // 上传弹窗
    const uploadModalVisible = ref(false)
    const uploadForm = reactive({ judgment: 'PASS', dataSummary: '', remark: '' })

    const loadData = () => {
        loading.value = true
        setTimeout(() => {
            const now = dayjs()
            tableData.value = [
                {
                    id: '1', taskNo: 'LAB-20260302-0005', inspItemName: 'ROHS有害物质检测', materialCode: 'M010',
                    materialName: '镀镍螺栓', batchNo: 'B20260228-10', externalOrgName: 'SGS通标标准技术服务',
                    externalContact: '张工 13800138000', outsourceStatus: 'TESTING', priority: 'CRITICAL',
                    trackingNo: 'SF1234567890', carrier: 'SF', sendDate: now.subtract(2, 'day').format('YYYY-MM-DD'),
                    reportUploaded: false, quotation: 3500, expectedDate: '2026-03-05',
                    createTime: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss')
                },
                {
                    id: '2', taskNo: 'LAB-20260301-0008', inspItemName: '镀层厚度测量', materialCode: 'M015',
                    materialName: '电镀紧固件', batchNo: 'B20260225-03', externalOrgName: 'TÜV莱茵',
                    externalContact: '李工 13900139000', outsourceStatus: 'REPORT_RECEIVED', priority: 'NORMAL',
                    trackingNo: 'JD9876543210', carrier: 'JD', sendDate: now.subtract(5, 'day').format('YYYY-MM-DD'),
                    reportUploaded: true, quotation: 2800, expectedDate: '2026-03-03',
                    createTime: now.subtract(6, 'day').format('YYYY-MM-DD HH:mm:ss')
                },
                {
                    id: '3', taskNo: 'LAB-20260303-0010', inspItemName: '疲劳寿命测试', materialCode: 'M020',
                    materialName: '弹簧钢片', batchNo: 'B20260303-08', externalOrgName: '国家弹簧检测中心',
                    externalContact: '赵工 13700137000', outsourceStatus: 'PENDING_SEND', priority: 'URGENT',
                    trackingNo: '', carrier: '', sendDate: '',
                    reportUploaded: false, quotation: 5200, expectedDate: '2026-03-10',
                    createTime: now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss')
                }
            ]
            loading.value = false
        }, 400)
    }

    const handleSearch = () => loadData()
    const handleReset = () => {
        queryParams.taskNo = ''; queryParams.orgName = ''; queryParams.status = undefined
        loadData()
    }

    const handleFillTracking = (record: OutsourceRecord) => {
        currentRecord.value = record
        Object.assign(trackingForm, { carrier: '', trackingNo: '', sendDate: null, remark: '' })
        trackingModalVisible.value = true
    }

    const handleTrackingConfirm = () => {
        if (!trackingForm.carrier || !trackingForm.trackingNo) {
            message.warning('请填写快递公司和快递单号')
            return
        }
        message.success('物流信息已录入，系统已通知委外机构准备接收')
        trackingModalVisible.value = false
        loadData()
    }

    const handleUploadReport = (record: OutsourceRecord) => {
        currentRecord.value = record
        Object.assign(uploadForm, { judgment: 'PASS', dataSummary: '', remark: '' })
        uploadModalVisible.value = true
    }

    const handleUploadConfirm = () => {
        message.success('委外报告已上传，检测数据已同步至实验室任务')
        uploadModalVisible.value = false
        loadData()
    }

    const handleView = (record: OutsourceRecord) => {
        router.push(`/production-quality/laboratory/lab-task-execution/${record.id}?mode=view`)
    }

    onMounted(() => loadData())
</script>

<style scoped>
    .outsource-test-manage {
        padding: 16px;
        background: #f0f2f5;
        min-height: calc(100vh - 130px);
    }

    .page-title-bar {
        background: #fff;
        padding: 16px 20px;
        border-radius: 6px;
        margin-bottom: 16px;
        display: flex;
        align-items: baseline;
        gap: 12px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    .subtitle {
        color: #999;
        font-size: 13px;
    }

    .search-form {
        background: #fff;
        padding: 16px;
        border-radius: 6px 6px 0 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .ant-table-wrapper {
        background: #fff;
        border-radius: 0 0 6px 6px;
    }
</style>