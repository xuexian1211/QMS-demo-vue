import type {
  ControlledDocument,
  ControlledDocQueryParams,
  DocCategoryNode,
  DocVersionRecord
} from '@/types'
import {
  BIZ_SCENE_OPTIONS,
  MODULE_OPTIONS
} from '@/views/documents/documentMeta'

// TODO: Connect to Real API

export const DOC_CATEGORY_TREE: DocCategoryNode[] = BIZ_SCENE_OPTIONS.map(scene => ({
  key: scene.value,
  title: scene.label,
  bizScene: scene.value,
  children: MODULE_OPTIONS[scene.value].map(module => ({
    key: module.value,
    title: module.label,
    bizScene: scene.value,
    docModule: module.value,
    primaryStorage: ['basic-data-docs', 'core-engineering', 'five-tools'].includes(module.value) ? 'PLM' : 'QMS',
    isLeaf: true
  }))
}))

const MOCK_DOCS: ControlledDocument[] = [
  {
    id: '1',
    orgId: 'ORG-HF-01',
    documentId: 'QM-SYS-001',
    documentName: '质量手册',
    documentType: 'STANDARD',
    documentVersion: 'V2.1',
    documentStatus: 'RELEASED',
    bizScene: 'system-planning',
    docModule: 'system-docs',
    storageSource: 'QMS',
    fileFormat: 'PDF',
    fileSize: 2621440,
    language: 'zh-CN',
    securityLevel: 'INTERNAL',
    documentCategory: 'QUALITY',
    keywords: 'IATF16949,体系文件,质量手册',
    description: '公司级质量管理体系总纲文件，定义过程职责和控制要求。',
    author: '张三',
    department: '质量管理部',
    approver: '李经理',
    approvalDate: '2026-01-10',
    effectiveDate: '2026-01-10',
    expiryDate: '2027-01-10',
    downloadUrl: 'https://qms.shunfu.com/api/v1/files/download/qm-sys-001',
    previewUrl: 'https://qms.shunfu.com/api/v1/files/preview/qm-sys-001',
    checksum: 'sha256-001',
    remark: '年度修订版',
    uploader: '张三',
    publishedAt: '2026-01-10 09:30:00',
    createTime: '2025-12-28 09:00:00',
    updateTime: '2026-01-10 09:30:00',
    creator: '张三',
    updater: '张三'
  },
  {
    id: '2',
    orgId: 'ORG-HF-01',
    documentId: 'QM-SYS-002',
    documentName: 'IQC 检验程序',
    documentType: 'PROCEDURE',
    documentVersion: 'V1.5',
    documentStatus: 'UNDER_REVISION',
    bizScene: 'system-planning',
    docModule: 'system-docs',
    storageSource: 'QMS',
    fileFormat: 'PDF',
    fileSize: 1294336,
    language: 'zh-CN',
    securityLevel: 'INTERNAL',
    documentCategory: 'QUALITY',
    keywords: 'IQC,来料检验,程序文件',
    description: '定义来料检验流程、判定规则和异常升级路径。',
    author: '李四',
    department: '质量管理部',
    approver: '王总监',
    approvalDate: '2025-11-18',
    effectiveDate: '2025-11-18',
    expiryDate: '2026-11-18',
    relatedMaterialCode: 'MAT-AL-001,MAT-PL-002',
    downloadUrl: 'https://qms.shunfu.com/api/v1/files/download/qm-sys-002',
    previewUrl: 'https://qms.shunfu.com/api/v1/files/preview/qm-sys-002',
    checksum: 'sha256-002',
    remark: '待审批后生效',
    uploader: '李四',
    createTime: '2025-11-11 14:20:00',
    updateTime: '2026-03-02 10:15:00',
    creator: '李四',
    updater: '李四'
  },
  {
    id: '3',
    orgId: 'ORG-HF-01',
    documentId: 'DRW-2024-001',
    documentName: '智能控制器主板装配图',
    documentType: 'DRAWING',
    documentVersion: 'V3.1',
    documentStatus: 'RELEASED',
    bizScene: 'product-design',
    docModule: 'core-engineering',
    storageSource: 'PLM',
    fileFormat: 'PDF',
    fileSize: 2457600,
    language: 'zh-CN',
    securityLevel: 'CONFIDENTIAL',
    relatedProductCode: 'PROD-2024-001',
    relatedProductVersion: 'V2.1',
    relatedMaterialCode: 'MAT-CTRL-001',
    documentCategory: 'DESIGN',
    keywords: '装配图,主板,控制器',
    description: '控制器主板装配结构图，包含关键尺寸和安装要求。',
    author: '张工程师',
    department: '研发部',
    approver: '李经理',
    approvalDate: '2026-02-18',
    effectiveDate: '2026-02-18',
    expiryDate: '2027-02-18',
    plmStoragePath: '/projects/controller/docs/drawing/DRW-2024-001',
    downloadUrl: 'https://plm.shunfu.com/documents/DRW-2024-001/download',
    previewUrl: 'https://plm.shunfu.com/documents/DRW-2024-001/preview',
    checksum: 'sha256-003',
    remark: 'PLM 实时同步',
    plmCreateTime: '2026-01-15 14:30:00',
    plmUpdateTime: '2026-03-05 09:15:00',
    plmOperator: '张工程师',
    uploader: '系统同步',
    createTime: '2026-01-15 14:30:00',
    updateTime: '2026-03-05 09:15:00',
    creator: 'PLM',
    updater: 'PLM'
  },
  {
    id: '4',
    orgId: 'ORG-HF-01',
    documentId: 'SPEC-2024-018',
    documentName: '逆变器关键尺寸规格书',
    documentType: 'SPECIFICATION',
    documentVersion: 'V2.0',
    documentStatus: 'RELEASED',
    bizScene: 'product-design',
    docModule: 'core-engineering',
    storageSource: 'PLM',
    fileFormat: 'PDF',
    fileSize: 1835008,
    language: 'en-US',
    securityLevel: 'CONFIDENTIAL',
    relatedProductCode: 'PROD-2024-002',
    relatedProductVersion: 'Rev.B',
    relatedMaterialCode: 'MAT-SHELL-008',
    documentCategory: 'DESIGN',
    keywords: 'specification,尺寸公差,逆变器',
    description: '定义逆变器壳体与关键配合面的尺寸要求及检验规范。',
    author: 'Liu Engineer',
    department: 'R&D',
    approver: 'Chen Manager',
    approvalDate: '2026-01-25',
    effectiveDate: '2026-01-25',
    expiryDate: '2026-12-31',
    plmStoragePath: '/projects/inverter/specs/SPEC-2024-018',
    downloadUrl: 'https://plm.shunfu.com/documents/SPEC-2024-018/download',
    previewUrl: 'https://plm.shunfu.com/documents/SPEC-2024-018/preview',
    checksum: 'sha256-004',
    remark: '英文版供海外客户共用',
    plmCreateTime: '2025-12-18 11:00:00',
    plmUpdateTime: '2026-01-25 16:40:00',
    plmOperator: 'Liu Engineer',
    uploader: '系统同步',
    createTime: '2025-12-18 11:00:00',
    updateTime: '2026-01-25 16:40:00',
    creator: 'PLM',
    updater: 'PLM'
  },
  {
    id: '5',
    orgId: 'ORG-HF-01',
    documentId: 'FMEA-2024-006',
    documentName: '电控总成 DFMEA 分析表',
    documentType: 'REPORT',
    documentVersion: 'V1.3',
    documentStatus: 'RELEASED',
    bizScene: 'product-design',
    docModule: 'five-tools',
    storageSource: 'PLM',
    fileFormat: 'XLSX',
    fileSize: 4718592,
    language: 'zh-CN',
    securityLevel: 'SECRET',
    relatedProductCode: 'PROD-2024-001',
    relatedProductVersion: 'V2.1',
    relatedMaterialCode: 'MAT-CTRL-001,MAT-PCB-007',
    documentCategory: 'DESIGN',
    keywords: 'DFMEA,风险评估,五大工具',
    description: '面向电控总成的设计失效模式与影响分析表。',
    author: '周工艺',
    department: '研发质量部',
    approver: '赵总监',
    approvalDate: '2026-02-20',
    effectiveDate: '2026-02-20',
    expiryDate: '2027-02-20',
    plmStoragePath: '/projects/controller/five-tools/FMEA-2024-006',
    downloadUrl: 'https://plm.shunfu.com/documents/FMEA-2024-006/download',
    previewUrl: 'https://plm.shunfu.com/documents/FMEA-2024-006/preview',
    checksum: 'sha256-005',
    plmCreateTime: '2026-02-01 08:30:00',
    plmUpdateTime: '2026-02-20 17:40:00',
    plmOperator: '周工艺',
    uploader: '系统同步',
    createTime: '2026-02-01 08:30:00',
    updateTime: '2026-02-20 17:40:00',
    creator: 'PLM',
    updater: 'PLM'
  },
  {
    id: '6',
    orgId: 'ORG-HF-01',
    documentId: 'WI-WELD-001',
    documentName: '焊接作业指导书',
    documentType: 'PROCEDURE',
    documentVersion: 'V1.0',
    documentStatus: 'RELEASED',
    bizScene: 'production-process',
    docModule: 'work-instructions',
    storageSource: 'QMS',
    fileFormat: 'PDF',
    fileSize: 876544,
    language: 'zh-CN',
    securityLevel: 'INTERNAL',
    relatedProductCode: 'PROD-2024-001',
    relatedMaterialCode: 'MAT-SOLDER-003',
    documentCategory: 'PROCESS',
    keywords: '焊接,作业指导书,现场执行',
    description: '焊接工序作业要求、设备点检与质量防错要求。',
    author: '王五',
    department: '制造部',
    approver: '何经理',
    approvalDate: '2026-01-15',
    effectiveDate: '2026-01-15',
    expiryDate: '2026-06-30',
    downloadUrl: 'https://qms.shunfu.com/api/v1/files/download/wi-weld-001',
    previewUrl: 'https://qms.shunfu.com/api/v1/files/preview/wi-weld-001',
    checksum: 'sha256-006',
    remark: '到期前需复审',
    uploader: '王五',
    publishedAt: '2026-01-15 08:30:00',
    createTime: '2026-01-10 08:30:00',
    updateTime: '2026-01-15 08:30:00',
    creator: '王五',
    updater: '王五'
  },
  {
    id: '7',
    orgId: 'ORG-HF-01',
    documentId: 'QM-IQC-RPT-001',
    documentName: 'IQC 检验报告 2026-02',
    documentType: 'REPORT',
    documentVersion: 'V1.0',
    documentStatus: 'RELEASED',
    bizScene: 'quality-inspection',
    docModule: 'inspection-reports',
    storageSource: 'QMS',
    fileFormat: 'PDF',
    fileSize: 1887436,
    language: 'zh-CN',
    securityLevel: 'INTERNAL',
    relatedProductCode: 'PROD-2024-001',
    relatedMaterialCode: 'MAT-PCB-007',
    documentCategory: 'QUALITY',
    keywords: 'IQC,检验报告,来料',
    description: '2 月份关键原材料 IQC 判定结果和批次追溯记录。',
    author: '赵六',
    department: '来料质量科',
    approver: '刘主管',
    approvalDate: '2026-02-28',
    effectiveDate: '2026-02-28',
    expiryDate: '2027-02-28',
    downloadUrl: 'https://qms.shunfu.com/api/v1/files/download/qm-iqc-rpt-001',
    previewUrl: 'https://qms.shunfu.com/api/v1/files/preview/qm-iqc-rpt-001',
    checksum: 'sha256-007',
    uploader: '赵六',
    publishedAt: '2026-02-28 16:20:00',
    createTime: '2026-02-28 16:20:00',
    updateTime: '2026-02-28 16:20:00',
    creator: '赵六',
    updater: '赵六'
  },
  {
    id: '8',
    orgId: 'ORG-HF-01',
    documentId: 'NCR-20260301-001',
    documentName: '不合格品处置报告',
    documentType: 'REPORT',
    documentVersion: 'V1.0',
    documentStatus: 'RELEASED',
    bizScene: 'exception-management',
    docModule: 'ncr-handling',
    storageSource: 'QMS',
    fileFormat: 'PDF',
    fileSize: 524288,
    language: 'zh-CN',
    securityLevel: 'CONFIDENTIAL',
    relatedProductCode: 'PROD-2024-003',
    relatedMaterialCode: 'MAT-CASE-021',
    documentCategory: 'QUALITY',
    keywords: 'NCR,异常处置,让步接收',
    description: '记录 3 月异常批次的围堵、原因分析和处置结论。',
    author: '孙七',
    department: '质量工程部',
    approver: '秦经理',
    approvalDate: '2026-03-01',
    effectiveDate: '2026-03-01',
    expiryDate: '2027-03-01',
    downloadUrl: 'https://qms.shunfu.com/api/v1/files/download/ncr-20260301-001',
    previewUrl: 'https://qms.shunfu.com/api/v1/files/preview/ncr-20260301-001',
    checksum: 'sha256-008',
    uploader: '孙七',
    publishedAt: '2026-03-01 18:00:00',
    createTime: '2026-03-01 13:00:00',
    updateTime: '2026-03-01 18:00:00',
    creator: '孙七',
    updater: '孙七'
  },
  {
    id: '9',
    orgId: 'ORG-HF-01',
    documentId: '8D-20260305-002',
    documentName: '供应商 A 焊点虚焊 8D 报告',
    documentType: 'REPORT',
    documentVersion: 'V2.0',
    documentStatus: 'DRAFT',
    bizScene: 'exception-management',
    docModule: 'problem-solving',
    storageSource: 'QMS',
    fileFormat: 'DOCX',
    fileSize: 1130496,
    language: 'zh-CN',
    securityLevel: 'CONFIDENTIAL',
    relatedProductCode: 'PROD-2024-001',
    relatedMaterialCode: 'MAT-PCB-007',
    documentCategory: 'QUALITY',
    keywords: '8D,供应商质量,焊点',
    description: '面向供应商来料虚焊问题的闭环改善报告，当前为待提交流程草稿。',
    author: '周八',
    department: 'SQE',
    effectiveDate: '2026-03-05',
    expiryDate: '2026-12-31',
    remark: '待补充根因验证数据',
    uploader: '周八',
    createTime: '2026-03-05 10:10:00',
    updateTime: '2026-03-08 18:35:00',
    creator: '周八',
    updater: '周八'
  }
]

export function getDocumentList(params: ControlledDocQueryParams): ControlledDocument[] {
  let result = [...MOCK_DOCS]

  if (params.bizScene) result = result.filter(item => item.bizScene === params.bizScene)
  if (params.docModule) result = result.filter(item => item.docModule === params.docModule)
  if (params.storageSource) result = result.filter(item => item.storageSource === params.storageSource)
  if (params.documentStatus) result = result.filter(item => item.documentStatus === params.documentStatus)
  if (params.documentType) result = result.filter(item => item.documentType === params.documentType)
  if (params.documentCategory) result = result.filter(item => item.documentCategory === params.documentCategory)
  if (params.securityLevel) result = result.filter(item => item.securityLevel === params.securityLevel)

  if (params.documentId) {
    const keyword = params.documentId.toLowerCase()
    result = result.filter(item => item.documentId.toLowerCase().includes(keyword))
  }

  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    result = result.filter(item =>
      item.documentName.toLowerCase().includes(keyword) ||
      item.documentId.toLowerCase().includes(keyword) ||
      item.keywords?.toLowerCase().includes(keyword) ||
      item.relatedProductCode?.toLowerCase().includes(keyword)
    )
  }

  return result.sort((left, right) => right.updateTime.localeCompare(left.updateTime))
}

export function getDocumentById(id: string): ControlledDocument | undefined {
  const target = MOCK_DOCS.find(item => item.id === id)
  return target ? { ...target } : undefined
}

const MOCK_VERSIONS: Record<string, DocVersionRecord[]> = {
  '1': [
    { documentVersion: 'V2.1', operator: '张三', operateTime: '2026-01-10 09:30:00', documentStatus: 'RELEASED', remark: '年度修订', source: 'MANUAL' },
    { documentVersion: 'V2.0', operator: '张三', operateTime: '2025-06-01 14:00:00', documentStatus: 'OBSOLETE', remark: '已被新版本替代', source: 'MANUAL' },
    { documentVersion: 'V1.0', operator: '李四', operateTime: '2024-01-15 10:00:00', documentStatus: 'OBSOLETE', remark: '初始发布版本', source: 'MANUAL' }
  ],
  '3': [
    { documentVersion: 'V3.1', operator: '系统同步', operateTime: '2026-03-05 09:15:00', documentStatus: 'RELEASED', remark: 'PLM 同步新版本', source: 'PLM_SYNC' },
    { documentVersion: 'V3.0', operator: '系统同步', operateTime: '2026-02-10 10:20:00', documentStatus: 'OBSOLETE', remark: '被 V3.1 替代', source: 'PLM_SYNC' },
    { documentVersion: 'V2.0', operator: '系统同步', operateTime: '2025-10-08 09:00:00', documentStatus: 'OBSOLETE', remark: '历史版本', source: 'PLM_SYNC' }
  ],
  '6': [
    { documentVersion: 'V1.0', operator: '王五', operateTime: '2026-01-15 08:30:00', documentStatus: 'RELEASED', remark: '首次发布', source: 'MANUAL' }
  ],
  '9': [
    { documentVersion: 'V2.0', operator: '周八', operateTime: '2026-03-08 18:35:00', documentStatus: 'DRAFT', remark: '补充围堵措施和责任人', source: 'MANUAL' },
    { documentVersion: 'V1.0', operator: '周八', operateTime: '2026-03-05 10:10:00', documentStatus: 'OBSOLETE', remark: '旧版草稿', source: 'RESTORE' }
  ]
}

export function getVersionHistory(id: string): DocVersionRecord[] {
  return (MOCK_VERSIONS[id] ?? []).map(item => ({ ...item }))
}
