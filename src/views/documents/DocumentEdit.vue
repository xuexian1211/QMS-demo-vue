<template>
    <div class="page-container">
        <!-- 页头 -->
        <div class="page-header">
            <div class="header-left">
                <a-button type="text" @click="handleBack" class="back-button">
                    <template #icon><ArrowLeftOutlined /></template>
                    返回
                </a-button>
                <div class="title-section">
                    <h2 class="page-title">{{ pageTitle }}</h2>
                    <a-tag v-if="form.version" color="blue">{{ form.version }}</a-tag>
                    <a-tag :color="getDisplayStatusColor()">{{ getDisplayStatusText() }}</a-tag>
                    <a-tag v-if="isPLM" color="blue">PLM来源</a-tag>
                </div>
            </div>
            <div class="header-actions" v-if="!isView && !isPLM">
                <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
            </div>
        </div>

        <!-- 基本信息卡片 -->
        <a-card class="form-card" title="基本信息">
            <a-form ref="formRef" :model="form" :rules="rules" layout="horizontal" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="文档编号" name="docNo">
                            <a-input v-model:value="form.docNo" :disabled="isView || isEdit || isPLM" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="文档名称" name="docName">
                            <a-input v-model:value="form.docName" :disabled="isView || isPLM" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="文档类型" name="docType">
                            <a-input v-model:value="form.docType" :disabled="isView || isPLM" placeholder="请输入" />
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="业务场景" name="bizScene">
                            <a-select v-model:value="form.bizScene" :disabled="isView || isPLM" placeholder="请选择">
                                <a-select-option v-for="s in BIZ_SCENE_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="文档模块" name="docModule">
                            <a-select v-model:value="form.docModule" :disabled="isView || isPLM" placeholder="请选择">
                                <a-select-option v-for="m in filteredModuleOptions" :key="m.value" :value="m.value">{{ m.label }}</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="主存来源">
                            <a-select v-model:value="form.storageSource" :disabled="isView || isEdit || isPLM" placeholder="请选择">
                                <a-select-option value="QMS">QMS</a-select-option>
                                <a-select-option value="PLM">PLM</a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="8">
                        <a-form-item label="版本号">
                            <a-input v-model:value="form.version" :disabled="isView || isPLM" placeholder="如：V1.0" />
                        </a-form-item>
                    </a-col>
                    <a-col :span="8">
                        <a-form-item label="状态">
                            <template v-if="isPLM">
                                <a-tag color="success">已发布</a-tag>
                            </template>
                            <template v-else-if="isView">
                                <a-tag :color="statusColorMap[form.status]">{{ statusTextMap[form.status] }}</a-tag>
                            </template>
                            <template v-else>
                                <a-select v-model:value="form.status" placeholder="请选择">
                                    <a-select-option value="DRAFT">草稿</a-select-option>
                                    <a-select-option value="IN_APPROVAL">审批中</a-select-option>
                                    <a-select-option value="PUBLISHED">已发布</a-select-option>
                                    <a-select-option value="OBSOLETE">已作废</a-select-option>
                                </a-select>
                            </template>
                        </a-form-item>
                    </a-col>
                    <a-col v-if="isPLM" :span="8">
                        <a-form-item label="PLM同步时间">
                            <span>{{ form.plmSyncTime || '-' }}</span>
                        </a-form-item>
                    </a-col>
                </a-row>
                <a-row :gutter="24">
                    <a-col :span="16">
                        <a-form-item label="备注" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
                            <a-textarea v-model:value="form.remark" :disabled="isView || isPLM" :rows="2" placeholder="请输入备注" />
                        </a-form-item>
                    </a-col>
                </a-row>
            </a-form>
        </a-card>

        <!-- 文件预览卡片 -->
        <a-card class="detail-card" title="文件预览">
            <template #extra>
                <a-space>
                    <a-button size="small" @click="handleDownload">下载文件</a-button>
                    <a-button v-if="!isView && !isPLM" type="primary" size="small">上传新版本</a-button>
                </a-space>
            </template>
            <div class="preview-placeholder">
                <FileOutlined style="font-size: 48px; color: #bfbfbf;" />
                <p style="color: #999; margin-top: 12px;">{{ form.docName || '文档' }}.{{ form.fileFormat?.toLowerCase() || 'pdf' }}</p>
                <p style="color: #bfbfbf; font-size: 12px;">文件预览区域（演示占位）</p>
            </div>
        </a-card>

        <!-- 历史版本卡片 -->
        <a-card class="detail-card" title="历史版本">
            <a-table
                :columns="versionColumns"
                :data-source="versionHistory"
                :pagination="false"
                row-key="version"
                size="small"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'status'">
                        <a-tag :color="statusColorMap[record.status]">{{ statusTextMap[record.status] }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <a-button type="link" size="small">预览此版本</a-button>
                    </template>
                </template>
            </a-table>
            <a-empty v-if="versionHistory.length === 0" description="暂无历史版本" />
        </a-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined, FileOutlined } from '@ant-design/icons-vue'
import { getDocumentById, getVersionHistory } from '@/api/document'
import type { ControlledDocStatus, DocVersionRecord } from '@/types'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const saving = ref(false)

const isView = computed(() => route.path.includes('/view/'))
const isEdit = computed(() => route.path.includes('/edit/'))
const isPLM = computed(() => form.storageSource === 'PLM')
const pageTitle = computed(() => isView.value ? '查看文档' : isEdit.value ? '编辑文档' : '新增文档')

const form = reactive({
    docNo: '', docName: '', docType: '', version: 'V1.0',
    bizScene: 'system-planning' as string,
    docModule: 'system-docs' as string,
    storageSource: 'QMS' as string,
    status: 'DRAFT' as ControlledDocStatus,
    remark: '', plmSyncTime: '', fileFormat: ''
})

const versionHistory = ref<DocVersionRecord[]>([])

const statusColorMap: Record<ControlledDocStatus, string> = {
    DRAFT: 'default', IN_APPROVAL: 'processing', PUBLISHED: 'success', OBSOLETE: 'error'
}
const statusTextMap: Record<ControlledDocStatus, string> = {
    DRAFT: '草稿', IN_APPROVAL: '审批中', PUBLISHED: '已发布', OBSOLETE: '已作废'
}

const rules = {
    docNo: [{ required: true, message: '请输入文档编号', trigger: 'blur' }],
    docName: [{ required: true, message: '请输入文档名称', trigger: 'blur' }],
    docType: [{ required: true, message: '请输入文档类型', trigger: 'blur' }]
}

const BIZ_SCENE_OPTIONS = [
    { value: 'system-planning', label: '体系策划与基础管理' },
    { value: 'product-design', label: '产品设计与开发 (APQP)' },
    { value: 'production-process', label: '生产过程与现场执行' },
    { value: 'quality-inspection', label: '质量检验与监控记录' },
    { value: 'exception-management', label: '异常管理与持续改进' }
]

const MODULE_OPTIONS: Record<string, { value: string; label: string }[]> = {
    'system-planning': [
        { value: 'system-docs', label: '体系文件' },
        { value: 'basic-data-docs', label: '基础数据图档' }
    ],
    'product-design': [
        { value: 'core-engineering', label: '核心工程图档' },
        { value: 'five-tools', label: '五大工具文档' }
    ],
    'production-process': [
        { value: 'work-instructions', label: '作业指导书' },
        { value: 'visual-management', label: '现场目视化' }
    ],
    'quality-inspection': [
        { value: 'inspection-reports', label: '检验报告' },
        { value: 'test-reports', label: '实验/测试报告' }
    ],
    'exception-management': [
        { value: 'ncr-handling', label: '不合格处理' },
        { value: 'problem-solving', label: '问题解决' },
        { value: 'audit-management', label: '审核管理' }
    ]
}

const filteredModuleOptions = computed(() => MODULE_OPTIONS[form.bizScene] ?? [])

const versionColumns = [
    { title: '版本号', dataIndex: 'version', key: 'version', width: 100 },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '操作时间', dataIndex: 'operateTime', key: 'operateTime', width: 180 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '操作', key: 'action', width: 120 }
]

function getDisplayStatusColor(): string {
    if (isPLM.value) return 'success'
    return statusColorMap[form.status] || 'default'
}

function getDisplayStatusText(): string {
    if (isPLM.value) return '已发布'
    return statusTextMap[form.status] || form.status
}

function handleBack() {
    router.push('/quality-system/document-management')
}

async function handleSave() {
    try {
        saving.value = true
        await formRef.value?.validate()
        // TODO: Connect to Real API
        message.success('保存成功')
        router.push('/quality-system/document-management')
    } catch {
        message.error('请完善必填项')
    } finally {
        saving.value = false
    }
}

function handleDownload() {
    // TODO: Connect to Real API
    message.success(`开始下载: ${form.docName}.${form.fileFormat?.toLowerCase() || 'pdf'}`)
}

onMounted(() => {
    const id = route.params.id as string
    if (id) {
        const doc = getDocumentById(id)
        if (doc) {
            Object.assign(form, {
                docNo: doc.docNo, docName: doc.docName, docType: doc.docType,
                version: doc.version, bizScene: doc.bizScene, docModule: doc.docModule,
                storageSource: doc.storageSource, status: doc.status,
                remark: doc.remark ?? '', plmSyncTime: doc.plmSyncTime ?? '',
                fileFormat: doc.fileFormat ?? ''
            })
            versionHistory.value = getVersionHistory(id)
        }
    }
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

.detail-card {
    margin-bottom: 16px;
}

.detail-card :deep(.ant-card-body) {
    padding: 16px;
}

.preview-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    background: #fafafa;
    border: 1px dashed #d9d9d9;
    border-radius: 4px;
}
</style>
