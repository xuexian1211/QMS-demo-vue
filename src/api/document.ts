import type {
  ControlledDocument,
  ControlledDocQueryParams,
  DocCategoryNode,
  DocVersionRecord
} from '@/types'

// TODO: Connect to Real API

export const DOC_CATEGORY_TREE: DocCategoryNode[] = [
  {
    key: 'system-planning',
    title: '体系策划与基础管理',
    bizScene: 'system-planning',
    children: [
      { key: 'system-docs', title: '体系文件', bizScene: 'system-planning', docModule: 'system-docs', primaryStorage: 'QMS', isLeaf: true },
      { key: 'basic-data-docs', title: '基础数据图档', bizScene: 'system-planning', docModule: 'basic-data-docs', primaryStorage: 'PLM', isLeaf: true }
    ]
  },
  {
    key: 'product-design',
    title: '产品设计与开发 (APQP)',
    bizScene: 'product-design',
    children: [
      { key: 'core-engineering', title: '核心工程图档', bizScene: 'product-design', docModule: 'core-engineering', primaryStorage: 'PLM', isLeaf: true },
      { key: 'five-tools', title: '五大工具文档', bizScene: 'product-design', docModule: 'five-tools', primaryStorage: 'PLM', isLeaf: true }
    ]
  },
  {
    key: 'production-process',
    title: '生产过程与现场执行',
    bizScene: 'production-process',
    children: [
      { key: 'work-instructions', title: '作业指导书', bizScene: 'production-process', docModule: 'work-instructions', primaryStorage: 'QMS', isLeaf: true },
      { key: 'visual-management', title: '现场目视化', bizScene: 'production-process', docModule: 'visual-management', primaryStorage: 'QMS', isLeaf: true }
    ]
  },
  {
    key: 'quality-inspection',
    title: '质量检验与监控记录',
    bizScene: 'quality-inspection',
    children: [
      { key: 'inspection-reports', title: '检验报告', bizScene: 'quality-inspection', docModule: 'inspection-reports', primaryStorage: 'QMS', isLeaf: true },
      { key: 'test-reports', title: '实验/测试报告', bizScene: 'quality-inspection', docModule: 'test-reports', primaryStorage: 'QMS', isLeaf: true }
    ]
  },
  {
    key: 'exception-management',
    title: '异常管理与持续改进',
    bizScene: 'exception-management',
    children: [
      { key: 'ncr-handling', title: '不合格处理', bizScene: 'exception-management', docModule: 'ncr-handling', primaryStorage: 'QMS', isLeaf: true },
      { key: 'problem-solving', title: '问题解决', bizScene: 'exception-management', docModule: 'problem-solving', primaryStorage: 'QMS', isLeaf: true },
      { key: 'audit-management', title: '审核管理', bizScene: 'exception-management', docModule: 'audit-management', primaryStorage: 'QMS', isLeaf: true }
    ]
  }
]

const MOCK_DOCS: ControlledDocument[] = [
  { id: '1', docNo: 'QM-SYS-001', docName: '质量手册', version: 'V2.1', bizScene: 'system-planning', docModule: 'system-docs', docType: '质量手册', storageSource: 'QMS', status: 'PUBLISHED', fileSize: '2.5MB', fileFormat: 'PDF', uploader: '张三', publishedAt: '2024-01-10', createTime: '2024-01-01', updateTime: '2024-01-10', creator: '张三', updater: '张三', orgId: 'org1' },
  { id: '2', docNo: 'QM-SYS-002', docName: 'IQC检验程序', version: 'V1.5', bizScene: 'system-planning', docModule: 'system-docs', docType: '程序文件', storageSource: 'QMS', status: 'PUBLISHED', fileSize: '1.2MB', fileFormat: 'PDF', uploader: '李四', publishedAt: '2024-01-08', createTime: '2024-01-01', updateTime: '2024-01-08', creator: '李四', updater: '李四', orgId: 'org1' },
  { id: '3', docNo: 'PLM-ENG-001', docName: '产品总成图纸', version: 'V3.0', bizScene: 'product-design', docModule: 'core-engineering', docType: '产品图纸', storageSource: 'PLM', status: 'PUBLISHED', fileSize: '15.2MB', fileFormat: 'DWG', plmDocId: 'PLM-20240101-001', plmSyncTime: '2024-02-01 09:00', uploader: '系统同步', createTime: '2024-01-01', updateTime: '2024-02-01', creator: 'PLM', updater: 'PLM', orgId: 'org1' },
  { id: '4', docNo: 'PLM-ENG-002', docName: '零件3D模型', version: 'V2.0', bizScene: 'product-design', docModule: 'core-engineering', docType: '3D模型', storageSource: 'PLM', status: 'PUBLISHED', fileSize: '32.8MB', fileFormat: 'STEP', plmDocId: 'PLM-20240101-002', plmSyncTime: '2024-02-01 09:00', uploader: '系统同步', createTime: '2024-01-01', updateTime: '2024-02-01', creator: 'PLM', updater: 'PLM', orgId: 'org1' },
  { id: '5', docNo: 'PLM-FMEA-001', docName: 'DFMEA分析报告', version: 'V1.2', bizScene: 'product-design', docModule: 'five-tools', docType: 'DFMEA', storageSource: 'PLM', status: 'PUBLISHED', fileSize: '4.5MB', fileFormat: 'XLSX', plmDocId: 'PLM-20240101-003', plmSyncTime: '2024-02-01 09:00', uploader: '系统同步', createTime: '2024-01-01', updateTime: '2024-02-01', creator: 'PLM', updater: 'PLM', orgId: 'org1' },
  { id: '6', docNo: 'QM-WI-001', docName: '焊接作业指导书', version: 'V1.0', bizScene: 'production-process', docModule: 'work-instructions', docType: '作业指导书', storageSource: 'QMS', status: 'PUBLISHED', fileSize: '856KB', fileFormat: 'PDF', uploader: '王五', publishedAt: '2024-01-15', createTime: '2024-01-10', updateTime: '2024-01-15', creator: '王五', updater: '王五', orgId: 'org1' },
  { id: '7', docNo: 'QM-IQC-RPT-001', docName: 'IQC检验报告-202401', version: 'V1.0', bizScene: 'quality-inspection', docModule: 'inspection-reports', docType: '检验报告', storageSource: 'QMS', status: 'PUBLISHED', fileSize: '1.8MB', fileFormat: 'PDF', uploader: '赵六', publishedAt: '2024-01-31', createTime: '2024-01-31', updateTime: '2024-01-31', creator: '赵六', updater: '赵六', orgId: 'org1' },
  { id: '8', docNo: 'QM-NCR-001', docName: 'NCR-20240115-001', version: 'V1.0', bizScene: 'exception-management', docModule: 'ncr-handling', docType: 'NCR报告', storageSource: 'QMS', status: 'PUBLISHED', fileSize: '512KB', fileFormat: 'PDF', uploader: '孙七', publishedAt: '2024-01-16', createTime: '2024-01-15', updateTime: '2024-01-16', creator: '孙七', updater: '孙七', orgId: 'org1' },
  { id: '9', docNo: 'QM-8D-001', docName: '8D报告-供应商A质量问题', version: 'V2.0', bizScene: 'exception-management', docModule: 'problem-solving', docType: '8D报告', storageSource: 'QMS', status: 'DRAFT', fileSize: '1.1MB', fileFormat: 'DOCX', uploader: '周八', createTime: '2024-02-01', updateTime: '2024-02-05', creator: '周八', updater: '周八', orgId: 'org1' }
]

export function getDocumentList(params: ControlledDocQueryParams): ControlledDocument[] {
  let result = [...MOCK_DOCS]
  if (params.bizScene) result = result.filter(d => d.bizScene === params.bizScene)
  if (params.docModule) result = result.filter(d => d.docModule === params.docModule)
  if (params.storageSource) result = result.filter(d => d.storageSource === params.storageSource)
  if (params.status) result = result.filter(d => d.status === params.status)
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    result = result.filter(d => d.docName.toLowerCase().includes(kw) || d.docNo.toLowerCase().includes(kw))
  }
  return result
}

export function getDocumentById(id: string): ControlledDocument | undefined {
  return MOCK_DOCS.find(d => d.id === id)
}

const MOCK_VERSIONS: Record<string, DocVersionRecord[]> = {
  '1': [
    { version: 'V2.1', operator: '张三', operateTime: '2024-01-10 09:30', status: 'PUBLISHED', remark: '年度修订' },
    { version: 'V2.0', operator: '张三', operateTime: '2023-06-01 14:00', status: 'OBSOLETE' },
    { version: 'V1.0', operator: '李四', operateTime: '2022-01-15 10:00', status: 'OBSOLETE' }
  ],
  '3': [
    { version: 'V3.0', operator: '系统同步', operateTime: '2024-02-01 09:00', status: 'PUBLISHED', remark: 'PLM同步' },
    { version: 'V2.0', operator: '系统同步', operateTime: '2023-08-10 09:00', status: 'OBSOLETE' }
  ]
}

export function getVersionHistory(id: string): DocVersionRecord[] {
  return MOCK_VERSIONS[id] ?? []
}
