import type {
  ControlledDocStatus,
  DocBizScene,
  DocModule,
  DocStorageSource,
  DocumentCategory,
  DocumentLanguage,
  DocumentSecurityLevel,
  DocumentType
} from '@/types'

export interface LabelOption<T extends string> {
  value: T
  label: string
  shortLabel?: string
}

function createLabelMap<T extends string>(options: LabelOption<T>[]) {
  return Object.fromEntries(options.map(option => [option.value, option.label])) as Record<T, string>
}

export const STORAGE_SOURCE_OPTIONS: LabelOption<DocStorageSource>[] = [
  { value: 'PLM', label: 'PLM 主存', shortLabel: 'PLM' },
  { value: 'QMS', label: 'QMS 主存', shortLabel: 'QMS' }
]

export const DOC_STATUS_OPTIONS: LabelOption<ControlledDocStatus>[] = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'UNDER_REVISION', label: '修订中' },
  { value: 'RELEASED', label: '已发布' },
  { value: 'OBSOLETE', label: '已作废' }
]

export const DOC_TYPE_OPTIONS: LabelOption<DocumentType>[] = [
  { value: 'DRAWING', label: '图纸' },
  { value: 'SPECIFICATION', label: '规格书' },
  { value: 'PROCEDURE', label: '作业指导书' },
  { value: 'STANDARD', label: '标准' },
  { value: 'CERTIFICATE', label: '证书' },
  { value: 'REPORT', label: '报告' }
]

export const DOC_CATEGORY_OPTIONS: LabelOption<DocumentCategory>[] = [
  { value: 'DESIGN', label: '设计文档' },
  { value: 'PROCESS', label: '工艺文档' },
  { value: 'QUALITY', label: '质量文档' },
  { value: 'PURCHASING', label: '采购文档' }
]

export const DOC_SECURITY_LEVEL_OPTIONS: LabelOption<DocumentSecurityLevel>[] = [
  { value: 'PUBLIC', label: '公开' },
  { value: 'INTERNAL', label: '内部' },
  { value: 'CONFIDENTIAL', label: '机密' },
  { value: 'SECRET', label: '秘密' }
]

export const DOC_LANGUAGE_OPTIONS: LabelOption<DocumentLanguage>[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
  { value: 'ja-JP', label: '日本語' }
]

export const BIZ_SCENE_OPTIONS: LabelOption<DocBizScene>[] = [
  { value: 'system-planning', label: '体系策划与基础管理' },
  { value: 'product-design', label: '产品设计与开发（APQP）' },
  { value: 'production-process', label: '生产过程与现场执行' },
  { value: 'quality-inspection', label: '质量检验与监控记录' },
  { value: 'exception-management', label: '异常管理与持续改进' }
]

export const MODULE_OPTIONS: Record<DocBizScene, LabelOption<DocModule>[]> = {
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

export const STORAGE_SOURCE_LABEL_MAP = createLabelMap(STORAGE_SOURCE_OPTIONS)
export const DOC_STATUS_LABEL_MAP = createLabelMap(DOC_STATUS_OPTIONS)
export const DOC_TYPE_LABEL_MAP = createLabelMap(DOC_TYPE_OPTIONS)
export const DOC_CATEGORY_LABEL_MAP = createLabelMap(DOC_CATEGORY_OPTIONS)
export const DOC_SECURITY_LEVEL_LABEL_MAP = createLabelMap(DOC_SECURITY_LEVEL_OPTIONS)
export const DOC_LANGUAGE_LABEL_MAP = createLabelMap(DOC_LANGUAGE_OPTIONS)
export const BIZ_SCENE_LABEL_MAP = createLabelMap(BIZ_SCENE_OPTIONS)
export const MODULE_LABEL_MAP = Object.fromEntries(
  Object.values(MODULE_OPTIONS)
    .flat()
    .map(option => [option.value, option.label])
) as Record<DocModule, string>

export const STORAGE_SOURCE_COLOR_MAP: Record<DocStorageSource, string> = {
  PLM: 'blue',
  QMS: 'green'
}

export function getModuleOptions(scene?: DocBizScene) {
  return scene ? MODULE_OPTIONS[scene] ?? [] : []
}

export function getDefaultModule(scene: DocBizScene) {
  return MODULE_OPTIONS[scene][0].value
}

export function getStatusTone(status: ControlledDocStatus) {
  const toneMap: Record<ControlledDocStatus, string> = {
    DRAFT: 'default',
    UNDER_REVISION: 'processing',
    RELEASED: 'success',
    OBSOLETE: 'error'
  }
  return toneMap[status]
}

export function formatFileSize(fileSize?: number) {
  if (!fileSize) return '-'

  const units = ['B', 'KB', 'MB', 'GB']
  let size = fileSize
  let index = 0

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)}${units[index]}`
}

export function splitCommaValue(value?: string) {
  if (!value) return []
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export function isExpiringSoon(expiryDate?: string, days = 30) {
  if (!expiryDate) return false

  const expiry = new Date(expiryDate)
  const today = new Date()
  const deadline = new Date(today)
  deadline.setDate(deadline.getDate() + days)

  return expiry >= today && expiry <= deadline
}
