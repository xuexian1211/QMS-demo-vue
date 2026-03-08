<template>
  <div class="document-edit">
    <a-card :bordered="false" class="page-header">
      <div class="page-header__main">
        <a-button type="text" class="page-header__back" @click="handleBack">
          <template #icon><ArrowLeftOutlined /></template>
          返回列表
        </a-button>
        <div>
          <div class="page-header__eyebrow">Document Workspace</div>
          <h1 class="page-header__title">{{ pageTitle }}</h1>
          <p class="page-header__desc">
            文档表单字段已与 PLM 4.5 文档元数据接口对齐，PLM 来源文档保持只读展示。
          </p>
        </div>
      </div>
      <div class="page-header__meta">
        <a-space wrap>
          <a-tag v-if="form.documentVersion" color="blue">{{ form.documentVersion }}</a-tag>
          <a-tag :color="displayStatusColor">{{ displayStatusText }}</a-tag>
          <a-tag :color="getStorageSourceColor(form.storageSource)">{{ form.storageSource }}</a-tag>
        </a-space>
        <a-space v-if="showSaveAction" wrap>
          <a-button @click="handleBack">取消</a-button>
          <a-button type="primary" :loading="saving" @click="handleSave">保存</a-button>
        </a-space>
      </div>
    </a-card>

    <div class="document-edit__layout">
      <section class="document-edit__main">
        <a-card :bordered="false" class="form-card">
          <template #title>
            <div class="card-title">基础信息</div>
          </template>
          <a-form ref="formRef" layout="vertical" :model="form" :rules="rules">
            <a-row :gutter="16">
              <a-col :xs="24" :md="12">
                <a-form-item label="文档编号" name="documentId">
                  <a-input
                    v-model:value="form.documentId"
                    :disabled="isView || isEdit || isPlmDocument"
                    placeholder="如：QM-IQC-RPT-001"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="文档名称" name="documentName">
                  <a-input v-model:value="form.documentName" :disabled="isReadonly" placeholder="请输入文档完整名称" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="文档类型" name="documentType">
                  <a-select v-model:value="form.documentType" :disabled="isReadonly" placeholder="请选择文档类型">
                    <a-select-option v-for="option in DOC_TYPE_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="文档版本" name="documentVersion">
                  <a-input v-model:value="form.documentVersion" :disabled="isReadonly" placeholder="如：V1.0 / Rev.A" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="文档状态" name="documentStatus">
                  <template v-if="isPlmDocument">
                    <a-tag color="success">已发布</a-tag>
                  </template>
                  <template v-else-if="isView">
                    <a-tag :color="displayStatusColor">{{ displayStatusText }}</a-tag>
                  </template>
                  <template v-else>
                    <a-select v-model:value="form.documentStatus" placeholder="请选择状态">
                      <a-select-option v-for="option in DOC_STATUS_OPTIONS" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </a-select-option>
                    </a-select>
                  </template>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="业务场景" name="bizScene">
                  <a-select v-model:value="form.bizScene" :disabled="isReadonly" placeholder="请选择业务场景">
                    <a-select-option v-for="option in BIZ_SCENE_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="文档模块" name="docModule">
                  <a-select v-model:value="form.docModule" :disabled="isReadonly" placeholder="请选择文档模块">
                    <a-select-option v-for="option in moduleOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="主存来源" name="storageSource">
                  <a-select v-model:value="form.storageSource" :disabled="isView || isEdit || isPlmDocument" placeholder="请选择来源">
                    <a-select-option v-for="option in STORAGE_SOURCE_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.shortLabel }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <a-card :bordered="false" class="form-card">
          <template #title>
            <div class="card-title">受控属性</div>
          </template>
          <a-form layout="vertical" :model="form">
            <a-row :gutter="16">
              <a-col :xs="24" :md="8">
                <a-form-item label="文档分类" name="documentCategory">
                  <a-select v-model:value="form.documentCategory" :disabled="isReadonly" placeholder="请选择文档分类">
                    <a-select-option v-for="option in DOC_CATEGORY_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="密级" name="securityLevel">
                  <a-select v-model:value="form.securityLevel" :disabled="isReadonly" placeholder="请选择密级">
                    <a-select-option v-for="option in DOC_SECURITY_LEVEL_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="语言" name="language">
                  <a-select v-model:value="form.language" :disabled="isReadonly" placeholder="请选择语言">
                    <a-select-option v-for="option in DOC_LANGUAGE_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="作者" name="author">
                  <a-input v-model:value="form.author" :disabled="isReadonly" placeholder="请输入作者" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="部门" name="department">
                  <a-input v-model:value="form.department" :disabled="isReadonly" placeholder="请输入部门" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="审批人" name="approver">
                  <a-input v-model:value="form.approver" :disabled="isReadonly" placeholder="请输入审批人" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="批准日期" name="approvalDate">
                  <a-date-picker v-model:value="approvalDateValue" :disabled="isReadonly" class="full-width" value-format="YYYY-MM-DD" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="生效日期" name="effectiveDate">
                  <a-date-picker v-model:value="effectiveDateValue" :disabled="isReadonly" class="full-width" value-format="YYYY-MM-DD" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="失效日期" name="expiryDate">
                  <a-date-picker v-model:value="expiryDateValue" :disabled="isReadonly" class="full-width" value-format="YYYY-MM-DD" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>

        <a-card :bordered="false" class="form-card">
          <template #title>
            <div class="card-title">关联信息与访问地址</div>
          </template>
          <a-form layout="vertical" :model="form">
            <a-row :gutter="16">
              <a-col :xs="24" :md="8">
                <a-form-item label="关联产品编码">
                  <a-input v-model:value="form.relatedProductCode" :disabled="isReadonly" placeholder="多个编码用逗号分隔" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="关联产品版本">
                  <a-input v-model:value="form.relatedProductVersion" :disabled="isReadonly" placeholder="多个版本用逗号分隔" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="关联物料编码">
                  <a-input v-model:value="form.relatedMaterialCode" :disabled="isReadonly" placeholder="多个编码用逗号分隔" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="下载地址">
                  <a-input v-model:value="form.downloadUrl" :disabled="isReadonly" placeholder="请输入 downloadUrl" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="预览地址">
                  <a-input v-model:value="form.previewUrl" :disabled="isReadonly" placeholder="请输入 previewUrl" />
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item label="关键词">
                  <a-input v-model:value="form.keywords" :disabled="isReadonly" placeholder="示例：IATF16949, 来料检验, 样件承认" />
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item label="文档摘要">
                  <a-textarea v-model:value="form.description" :disabled="isReadonly" :rows="4" placeholder="请输入摘要说明" />
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item label="备注">
                  <a-textarea v-model:value="form.remark" :disabled="isReadonly" :rows="3" placeholder="请输入补充说明" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>
      </section>

      <aside class="document-edit__side">
        <a-card :bordered="false" class="side-card">
          <template #title>
            <div class="card-title">元数据概览</div>
          </template>
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="文件格式">{{ form.fileFormat || '-' }}</a-descriptions-item>
            <a-descriptions-item label="文件大小">{{ formatFileSize(form.fileSize) }}</a-descriptions-item>
            <a-descriptions-item label="下载地址">
              <a-button type="link" class="link-button" @click="handleDownload" :disabled="!form.downloadUrl">下载文件</a-button>
            </a-descriptions-item>
            <a-descriptions-item label="在线预览">
              <a-button type="link" class="link-button" @click="handleOpenPreview" :disabled="!form.previewUrl">打开预览</a-button>
            </a-descriptions-item>
            <a-descriptions-item label="PLM 创建时间">{{ form.plmCreateTime || '-' }}</a-descriptions-item>
            <a-descriptions-item label="PLM 更新时间">{{ form.plmUpdateTime || '-' }}</a-descriptions-item>
            <a-descriptions-item label="PLM 操作人">{{ form.plmOperator || '-' }}</a-descriptions-item>
            <a-descriptions-item label="校验值">{{ form.checksum || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card :bordered="false" class="side-card">
          <template #title>
            <div class="card-title">在线预览</div>
          </template>
          <div class="preview-shell">
            <iframe v-if="form.previewUrl" :src="form.previewUrl" title="文档预览" class="preview-frame" />
            <div v-else class="preview-empty">
              <FileOutlined class="preview-empty__icon" />
              <div class="preview-empty__title">暂无可用预览地址</div>
              <div class="preview-empty__desc">可以先保存元数据，或补充 `previewUrl` 后再查看。</div>
            </div>
          </div>
        </a-card>

        <a-card :bordered="false" class="side-card">
          <template #title>
            <div class="card-title">历史版本</div>
          </template>
          <a-table
            :columns="versionColumns"
            :data-source="versionHistory"
            :pagination="false"
            row-key="documentVersion"
            size="small"
            :scroll="{ x: 520 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'documentStatus'">
                <a-tag :color="getStatusTone(record.documentStatus)">{{ getStatusLabel(record.documentStatus) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button type="link" class="link-button" @click="handleViewHistoryVersion(record)">查看</a-button>
              </template>
            </template>
          </a-table>
          <a-empty v-if="versionHistory.length === 0" description="暂无历史版本" />
        </a-card>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { ArrowLeftOutlined, FileOutlined } from '@ant-design/icons-vue'
import { getDocumentById, getVersionHistory } from '@/api/document'
import {
  BIZ_SCENE_OPTIONS,
  DOC_CATEGORY_OPTIONS,
  DOC_LANGUAGE_OPTIONS,
  DOC_SECURITY_LEVEL_OPTIONS,
  DOC_STATUS_LABEL_MAP,
  DOC_STATUS_OPTIONS,
  DOC_TYPE_OPTIONS,
  STORAGE_SOURCE_COLOR_MAP,
  STORAGE_SOURCE_OPTIONS,
  formatFileSize,
  getDefaultModule,
  getModuleOptions,
  getStatusTone
} from '@/views/documents/documentMeta'
import type { ControlledDocument, DocVersionRecord } from '@/types'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const saving = ref(false)
const versionHistory = ref<DocVersionRecord[]>([])

const isView = computed(() => route.path.includes('/view/'))
const isEdit = computed(() => route.path.includes('/edit/'))

function createEmptyDocument(): ControlledDocument {
  const today = new Date().toISOString().slice(0, 10)

  return {
    id: '',
    orgId: 'ORG-HF-01',
    documentId: '',
    documentName: '',
    documentType: 'DRAWING',
    documentVersion: 'V1.0',
    documentStatus: 'DRAFT',
    bizScene: 'system-planning',
    docModule: getDefaultModule('system-planning'),
    storageSource: 'QMS',
    language: 'zh-CN',
    securityLevel: 'INTERNAL',
    documentCategory: 'QUALITY',
    effectiveDate: today,
    fileFormat: 'PDF',
    fileSize: 0,
    createTime: '',
    updateTime: '',
    creator: '当前用户',
    updater: '当前用户'
  }
}

const form = reactive<ControlledDocument>(createEmptyDocument())

const isPlmDocument = computed(() => form.storageSource === 'PLM')
const isReadonly = computed(() => isView.value || isPlmDocument.value)
const showSaveAction = computed(() => !isView.value && !isPlmDocument.value)
const pageTitle = computed(() => {
  if (isView.value) return '查看文档'
  if (isEdit.value) return '编辑文档'
  return '新建文档'
})
const displayStatusColor = computed(() => (isPlmDocument.value ? 'success' : getStatusTone(form.documentStatus)))
const displayStatusText = computed(() => (isPlmDocument.value ? '已发布' : getStatusLabel(form.documentStatus)))
const moduleOptions = computed(() => getModuleOptions(form.bizScene))

function getStatusLabel(status: ControlledDocument['documentStatus']) {
  return DOC_STATUS_LABEL_MAP[status]
}

function getStorageSourceColor(source: ControlledDocument['storageSource']) {
  return STORAGE_SOURCE_COLOR_MAP[source]
}

const approvalDateValue = computed({
  get: () => form.approvalDate,
  set: (value?: string) => {
    form.approvalDate = value
  }
})

const effectiveDateValue = computed({
  get: () => form.effectiveDate,
  set: (value?: string) => {
    form.effectiveDate = value
  }
})

const expiryDateValue = computed({
  get: () => form.expiryDate,
  set: (value?: string) => {
    form.expiryDate = value
  }
})

const rules = {
  documentId: [{ required: true, message: '请输入文档编号', trigger: 'blur' }],
  documentName: [{ required: true, message: '请输入文档名称', trigger: 'blur' }],
  documentType: [{ required: true, message: '请选择文档类型', trigger: 'change' }],
  effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
  expiryDate: [
    {
      validator: async (_rule: unknown, value?: string) => {
        if (!value || !form.effectiveDate) return
        if (value < form.effectiveDate) {
          throw new Error('失效日期不能早于生效日期')
        }
      },
      trigger: 'change'
    }
  ]
}

const versionColumns = [
  { title: '版本', dataIndex: 'documentVersion', key: 'documentVersion', width: 100 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 90 },
  { title: '时间', dataIndex: 'operateTime', key: 'operateTime', width: 170 },
  { title: '状态', dataIndex: 'documentStatus', key: 'documentStatus', width: 110 },
  { title: '操作', key: 'action', width: 80 }
]

watch(
  () => form.bizScene,
  scene => {
    const nextOptions = getModuleOptions(scene)
    if (nextOptions.length > 0 && !nextOptions.some(option => option.value === form.docModule)) {
      form.docModule = nextOptions[0].value
    }
  }
)

function handleBack() {
  router.push('/quality-system/document-management')
}

function handleOpenPreview() {
  if (!form.previewUrl) {
    message.warning('当前文档未配置预览地址。')
    return
  }
  window.open(form.previewUrl, '_blank', 'noopener,noreferrer')
}

function handleDownload() {
  if (!form.downloadUrl) {
    message.warning('当前文档未配置下载地址。')
    return
  }
  window.open(form.downloadUrl, '_blank', 'noopener,noreferrer')
  message.success(`已发起下载：${form.documentName || form.documentId}`)
}

async function handleSave() {
  try {
    saving.value = true
    await formRef.value?.validate()
    message.success('文档元数据已保存（演示环境）。')
    router.push('/quality-system/document-management')
  } catch {
    message.error('请先完善必填信息和日期校验。')
  } finally {
    saving.value = false
  }
}

function handleViewHistoryVersion(record: DocVersionRecord) {
  if (!route.params.id) {
    message.info(`当前为新建模式，版本 ${record.documentVersion} 仅供参考。`)
    return
  }
  router.push(`/quality-system/document-management/view/${route.params.id}?version=${record.documentVersion}`)
}

onMounted(() => {
  const id = route.params.id as string | undefined

  if (!id) return

  const detail = getDocumentById(id)
  if (!detail) {
    message.error('未找到对应文档。')
    router.push('/quality-system/document-management')
    return
  }

  Object.assign(form, detail)
  versionHistory.value = getVersionHistory(id)
})
</script>

<style scoped>
.document-edit {
  min-height: 100%;
  padding: 16px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.08), transparent 24%),
    linear-gradient(180deg, #f6f8fb 0%, #eef2f7 100%);
}

.page-header,
.form-card,
.side-card {
  border-radius: 18px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f7fbff 100%);
}

.page-header__main {
  display: flex;
  gap: 16px;
}

.page-header__back {
  padding-inline: 0;
}

.page-header__eyebrow {
  margin-bottom: 6px;
  color: #1677ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-header__title {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
  line-height: 1.2;
}

.page-header__desc {
  max-width: 760px;
  margin: 10px 0 0;
  color: #475569;
  line-height: 1.7;
}

.page-header__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.document-edit__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.9fr);
  gap: 16px;
}

.document-edit__main,
.document-edit__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.full-width {
  width: 100%;
}

.link-button {
  padding-inline: 0;
}

.preview-shell {
  overflow: hidden;
  border: 1px solid #dbe2ea;
  border-radius: 16px;
  background: #fff;
}

.preview-frame {
  width: 100%;
  height: 360px;
  border: 0;
}

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 24px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.8), rgba(255, 255, 255, 0.98)),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 12px,
      rgba(148, 163, 184, 0.08) 12px,
      rgba(148, 163, 184, 0.08) 24px
    );
}

.preview-empty__icon {
  font-size: 42px;
  color: #94a3b8;
}

.preview-empty__title {
  margin-top: 12px;
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
}

.preview-empty__desc {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 1100px) {
  .document-edit__layout {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }

  .page-header__meta {
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .document-edit {
    padding: 12px;
  }

  .page-header__main {
    flex-direction: column;
  }
}
</style>
