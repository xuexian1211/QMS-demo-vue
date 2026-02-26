// 通用接口定义
export interface BaseEntity {
  id: string
  createTime: string
  updateTime: string
  creator: string
  updater: string
}

// 用户相关
export interface User extends BaseEntity {
  username: string
  realName: string
  email: string
  phone: string
  departmentId: string
  roleId: string
  status: 'active' | 'inactive'
}

// 供应商相关
export interface Supplier extends BaseEntity {
  code: string
  name: string
  type: 'material' | 'part' | 'service'
  level: 'A' | 'B' | 'C'
  contact: string
  phone: string
  email: string
  address: string
  status: 'active' | 'inactive' | 'blacklist'
}

// 质量检验相关
export interface InspectionRecord extends BaseEntity {
  inspectionNo: string
  type: 'IQC' | 'IPQC' | 'FQC' | 'OQC'
  materialId: string
  materialName: string
  materialCode: string
  supplierId?: string
  supplierName?: string
  batchNo: string
  quantity: number
  status: 'pending' | 'processing' | 'qualified' | 'unqualified'
  inspector: string
  inspectionDate: string
  result?: string
  remark?: string
  details?: InspectionDetail[]
}

export interface InspectionDetail {
  id: string
  itemId: string
  itemName: string
  standard: string
  actualValue: string
  result: 'qualified' | 'unqualified'
  remark?: string
}

// 客诉相关
export interface CustomerComplaint extends BaseEntity {
  complaintNo: string
  customerId: string
  customerName: string
  productId: string
  productName: string
  batchNo: string
  complaintType: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  handler: string
  handleDate?: string
  result?: string
}

// FMEA相关
export interface FMEARecord extends BaseEntity {
  analysisNo: string
  product: string
  type: 'design' | 'process' | 'system'
  version: string
  owner: string
  status: 'draft' | 'approved' | 'archived'
  details: FMEADetail[]
}

export interface FMEADetail {
  id: string
  process: string
  failureMode: string
  failureEffect: string
  severity: number
  occurrence: number
  detection: number
  rpn: number
  action: string
}

// MSA相关
export interface MSARecord extends BaseEntity {
  analysisNo: string
  gaugeName: string
  characteristic: string
  gaugeRR: number
  ndc: number
  ev: number
  av: number
  pv: number
  tv: number
  measureData: MSAMeasureData[]
}

export interface MSAMeasureData {
  id: string
  part: string
  operator1: number
  operator2: number
  operator3: number
}

// SPC相关
export interface SPCRecord extends BaseEntity {
  sampleNo: string
  process: string
  parameter: string
  value1: number
  value2: number
  value3: number
  mean: number
  range: number
  time: string
}

// ===============================
// 检验业务类型定义
// ===============================

/** 缺陷分类 */
export interface DefectCategory extends BaseEntity {
  orgId?: number  // ✨ 组织ID，NULL表示集团级
  categoryCode: string
  categoryName: string
  parentId?: number | null
  level?: number
  sortOrder?: number
  description?: string
  status?: 'enabled' | 'disabled'
  children?: DefectCategory[]
}

/** 不良现象 */
export interface DefectPhenomenon extends BaseEntity {
  orgId?: number  // ✨ 组织ID，NULL表示集团级
  code: string
  name: string
  categoryId: number
  severity: 'CR' | 'MA' | 'MI'
  processType?: string
  description?: string
  status?: 'enabled' | 'disabled'
  /** 关联的不良原因（含权重） */
  relatedCauses?: PhenomenonCauseMapping[]
}

/** 不良原因 */
export interface DefectCause extends BaseEntity {
  orgId?: number  // ✨ 组织ID，NULL表示集团级
  code: string
  name: string
  category: 'Man' | 'Machine' | 'Material' | 'Method' | 'Environment'  // 5M分类
  parentId?: number | null  // ✨ 父原因ID，支持树状结构
  isHighFrequency: boolean  // ✨ 是否高频原因
  level?: number
  sortOrder?: number
  description?: string
  status?: 'enabled' | 'disabled'
  children?: DefectCause[]  // 子原因列表
  /** 关联的不良现象ID列表 */
  relatedPhenomenonIds?: string[]
}

/** 现象-原因关联映射（知识库） */
export interface PhenomenonCauseMapping {
  phenomenonId: number
  orgId: number  // ✨ 组织ID
  causeId: number
  weight: number  // ✨ 权重/发生频率 (1-10)
  // 冗余字段（用于显示）
  causeName?: string
  causeCode?: string
  causeType?: string
}

/** 检验项目分类 */
export type InspectionItemCategory = 'dimension' | 'appearance' | 'physical_chemical' | 'functional'

/** 检验项目 */
export interface InspectionItem extends BaseEntity {
  /** 组织ID，NULL/空表示集团级标准，有值表示工厂级私有 */
  orgId: string | null
  /** 项目编码，组织内唯一 */
  code: string
  /** 项目名称 */
  name: string
  /** 分类：尺寸/外观/理化/功能 */
  category: InspectionItemCategory
  /** 数据类型：计量型/计数型 */
  dataType: 'quantitative' | 'qualitative'
  /** 单位（计量型必填） */
  uom?: string
  /** 默认检验方法ID */
  defaultMethodId?: string
  /** 默认检验方法名称（冗余） */
  defaultMethodName?: string
  /** 默认量检具类型ID */
  defaultInstTypeId?: string
  /** 默认量检具类型名称（冗余） */
  defaultInstTypeName?: string
  /** 默认是否送检实验室 */
  isLabTestDefault: boolean
  /** 默认是否启用SPC监控 */
  isSpcDefault: boolean
  /** 描述 */
  description?: string
  /** 状态：启用/禁用 */
  status: 'enabled' | 'disabled'
  /** 关联的不良现象ID列表（默认缺陷映射） */
  relatedDefectIds?: string[]
}

/** 量检具类型 */
export interface MeasureType extends BaseEntity {
  orgId: string
  typeCode: string
  typeName: string
  parentId: string | null
  level: number
  sortOrder: number
  precision?: string
  msaRequired: boolean
  description?: string
  status: 'enabled' | 'disabled'
  children?: MeasureType[]
}

// ===============================
// 量检具管理类型定义
// ===============================

/** 量检具状态 */
export type GaugeStatus = 'IN_USE' | 'CALIBRATING' | 'SEALED' | 'SCRAPPED'

/** 校准类型 */
export type CalibrationType = 'INTERNAL' | 'EXTERNAL'

/** 校准结果 */
export type CalibrationResult = 'PASS' | 'FAIL' | 'CONDITIONAL'

/** 量检具台账 */
export interface GaugeLedger extends BaseEntity {
  // === 基本信息 ===
  gaugeNo: string           // 量具编号（唯一）
  gaugeName: string         // 量具名称
  typeId: string            // 关联量检具类型
  typeName?: string         // 冗余：类型名称
  model?: string            // 规格型号
  description?: string      // 描述/备注

  // === 技术参数 ===
  manufacturer?: string     // 制造商/厂家
  serialNo?: string         // 出厂序列号
  measureRange?: string     // 量程范围（如 "0-150mm"）
  resolution?: number       // 分辨率/分度值
  accuracy?: string         // 精度等级

  // === 校准信息 ===
  calibrationCycle?: number // 校准周期（月）
  lastCalDate?: string      // 上次校准日期
  nextCalDate?: string      // 下次校准日期
  certificateNo?: string    // 当前有效检定证书编号

  // === 管理信息 ===
  status: GaugeStatus       // 当前状态
  purchaseDate?: string     // 购置日期
  expiryDate?: string       // 有效期/预计报废日期
  location?: string         // 存放位置/使用部门
  custodian?: string        // 保管人/责任人
  attachmentIds?: string[]  // 附件列表（证书、说明书等）
}

/** 校准记录 */
export interface CalibrationRecord extends BaseEntity {
  gaugeId: string                 // 关联量检具台账
  calibrationType: CalibrationType // 校准类型
  calibrationDate: string         // 校准日期
  nextCalDate: string             // 下次校准日期
  result: CalibrationResult       // 校准结果
  calibrationOrg?: string         // 校准机构
  calibrator?: string             // 校准人员
  certificateNo?: string          // 证书编号
  beforeValue?: string            // 校准前数据/读数
  afterValue?: string             // 校准后数据/读数
  deviation?: string              // 偏差值
  conclusion?: string             // 结论/备注
  attachmentIds?: string[]        // 附件（校准证书扫描件等）
}

/** 量检具状态变更日志 */
export interface GaugeStatusLog extends BaseEntity {
  gaugeId: string           // 关联量检具台账
  fromStatus: GaugeStatus   // 原状态
  toStatus: GaugeStatus     // 新状态
  reason?: string           // 变更原因
  operator: string          // 操作人
  operateTime: string       // 操作时间
}



/** 物料检验规格 */
export interface MaterialSpec extends BaseEntity {
  orgId: string
  materialId: string
  /** 关联检验项目Code（通过Code关联，解耦Scheme ID） */
  inspItemCode: string
  inspItemName?: string
  specCode: string
  specName: string
  specType: 'quantitative' | 'qualitative'
  /** 数据类型（与 InspItem 对齐） */
  dataType?: 'QUANTITATIVE' | 'QUALITATIVE'
  // 计量型
  targetValue?: number
  upperLimit?: number
  lowerLimit?: number
  unit?: string
  uom?: string
  // 计数型
  standardDesc?: string
  standardCode?: string
  expectedValue?: string
  sampleImage?: string
  sortOrder: number
  status: 'enabled' | 'disabled'
}

/** 检验模板状态 */
export type InspTemplateStatus = 'DRAFT' | 'IN_APPROVAL' | 'APPROVED' | 'OBSOLETE'

/** 特性分类 */
export type CharacteristicClass = 'SC' | 'CC' | 'Major' | 'Minor'

/** 检验模板 */
export interface InspTemplate extends BaseEntity {
  orgId: string
  templateCode: string
  templateName: string
  version: string
  inspType: 'IQC' | 'IPQC' | 'FQC' | 'OQC'
  status: InspTemplateStatus
  /** 工作流实例ID（审批流） */
  workflowInstanceId?: string
  description?: string
  details?: InspTemplateDetail[]
}

/** 检验模板明细 */
export interface InspTemplateDetail extends BaseEntity {
  templateId: string
  sortOrder: number
  /** 检验项目ID */
  inspItemId: string
  /** 检验项目名称（冗余，防止主数据修改） */
  inspItemName: string
  /** 特性分类：SC-特殊特性/CC-关键特性/Major-主要/Minor-次要 */
  characteristicClass: CharacteristicClass
  /** 抽样规则编码（引用 L1 抽样规则） */
  samplingRuleCode: string
  samplingRuleName?: string
  /** 检验方法（从主数据默认带出，可修改） */
  inspMethodId?: string
  inspMethodName?: string
  /** 量检具类型（从主数据默认带出，可修改） */
  gaugeTypeId?: string
  gaugeTypeName?: string
  // IPQC 频次配置
  frequencyType?: 'PER_TIME' | 'PER_QUANTITY' | 'PER_BATCH'
  frequencyValue?: number
  frequencyUnit?: string
  // 开关配置（从主数据默认带出，可修改）
  /** 是否启用SPC监控 */
  spcEnabled: boolean
  /** 是否送检实验室 */
  labRequired: boolean
  /** SIP文件附件 */
  attachmentId?: string
  /** 关联的不良现象ID列表（用于防错） */
  relatedPhenomenonIds?: string[]
}

// ===============================
// 检验方案类型定义 (L3)
// ===============================

/** 检验方案状态 */
export type InspPlanStatus = 'DRAFT' | 'IN_APPROVAL' | 'APPROVED' | 'OBSOLETE'

/** 业务上下文类型 */
export type InspContextType = 'IQC' | 'IPQC' | 'FQC' | 'OQC'

/** IPQC 类型 */
export type IpqcType = 'FAI' | 'PATROL' | 'LAI'

/** 触发条件 */
export type TriggerCondition = 'ALWAYS' | 'ON_NEW_SUPPLIER_FIRST_N_BATCHES' | 'ON_ECN_FIRST_N_BATCHES'

// ===============================
// 检验方案 (InspScheme) - 新架构 L3
// ===============================

/** 检验方案（独立的执行指令集，可基于模板创建后独立编辑） */
export interface InspScheme extends BaseEntity {
  orgId: string
  /** 方案编码 */
  schemeCode: string
  /** 方案名称 */
  schemeName: string
  /** 版本号 */
  version: string
  /** 检验类型 */
  inspType: InspContextType
  /** 状态 */
  status: InspPlanStatus
  /** 来源模板ID（可选，用于追溯） */
  sourceTemplateId?: string
  /** 来源模板名称（冗余） */
  sourceTemplateName?: string
  /** 描述 */
  description?: string
  /** 明细行 */
  details?: InspSchemeDetail[]
  /** 绑定策略列表 */
  strategies?: InspStrategy[]
}

/** 检验方案明细（支持在方案层面独立增删改，不影响原模板） */
export interface InspSchemeDetail extends BaseEntity {
  /** 关联方案ID */
  schemeId: string
  /** 排序 */
  sortOrder: number
  /** 检验项目ID */
  inspItemId: string
  /** 检验项目名称（冗余） */
  inspItemName: string
  /** 特性分类 */
  characteristicClass: CharacteristicClass
  /** 抽样规则编码 */
  samplingRuleCode: string
  samplingRuleName?: string
  /** 检验方法 */
  inspMethodId?: string
  inspMethodName?: string
  /** 量检具类型 */
  gaugeTypeId?: string
  gaugeTypeName?: string
  /** IPQC 频次配置 */
  frequencyType?: 'PER_TIME' | 'PER_QUANTITY' | 'PER_BATCH'
  frequencyValue?: number
  frequencyUnit?: string
  /** 是否启用SPC监控 */
  spcEnabled: boolean
  /** 是否送检实验室 */
  labRequired: boolean
  /** SIP 附件 */
  attachmentId?: string
  /** 关联不良现象（防错） */
  relatedPhenomenonIds?: string[]
  /** 是否为从模板复制的行（仅前端展示用） */
  fromTemplate?: boolean
}

/** 匹配维度（支持多维度灵活绑定） */
export interface MatchDimension {
  /** 物料ID */
  materialId?: string
  materialCode?: string
  materialName?: string
  /** 物料组ID */
  materialGroupId?: string
  /** 供应商ID（IQC） */
  supplierId?: string
  supplierName?: string
  /** 客户ID（OQC） */
  customerId?: string
  customerName?: string
  /** 工序号（IPQC） */
  operationNo?: string
  operationName?: string
  /** IPQC 类型（IPQC） */
  ipqcType?: IpqcType
}

/** 检验策略（将业务上下文路由到某个 InspScheme，一个 Scheme 支持多个 Strategy） */
export interface InspStrategy extends BaseEntity {
  orgId: string
  /** 绑定的方案ID */
  schemeId: string
  /** 业务上下文类型 */
  contextType: InspContextType
  /** 匹配维度（JSON结构，替代扁平字段更灵活） */
  matchDimension: MatchDimension
  /** 优先级（数值越小越优先） */
  priority: number
  /** 触发条件 */
  triggerCondition: TriggerCondition
  /** 触发条件值（如前N批） */
  triggerValue?: number
  /** 描述 */
  description?: string
}

/** 检验计划触发器类型 */
export type PlanTriggerType = 'EVENT' | 'TIME' | 'QUANTITY' | 'MANUAL'

/** 检验计划状态（新模型，含挂起） */
export type InspPlanModelStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'OBSOLETE'

/** 事件触发配置 */
export interface EventTriggerConfig {
  /** ERP 单据类型 (如: PURCHASE_RECEIVE, PRODUCTION_ORDER) */
  erpDocType?: string
  /** ERP 单据状态触发条件 (如: SUBMITTED, APPROVED) */
  erpDocStatus?: string
  /** 自定义事件名称 (如: material_arrival) */
  customEvent?: string
  /** 匹配条件描述 */
  matchDescription?: string
}

/** 周期触发配置 */
export interface TimeTriggerConfig {
  /** Cron 表达式 (如: 0 0 8 * * ?) */
  cronExpression?: string
  /** 频率类型: hourly/daily/weekly/monthly */
  frequencyType?: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  /** 频率值 (如: 每4小时 -> frequencyType=HOURLY, frequencyValue=4) */
  frequencyValue?: number
  /** 执行时间描述 */
  scheduleDescription?: string
}

/** 数量/批次触发配置 */
export interface QuantityTriggerConfig {
  /** 每 N 件/模触发 */
  quantityThreshold?: number
  /** 单位: PIECES / MOLD / BATCH */
  quantityUnit?: 'PIECES' | 'MOLD' | 'BATCH'
}

/** 参数覆盖项 */
export interface ParameterOverride {
  /** 方案明细ID (关联 InspSchemeDetail.id) */
  schemeDetailId: string
  /** 项目名称（冗余展示） */
  inspItemName?: string
  /** 覆盖的目标值 */
  targetValue?: number
  /** 覆盖的上限 */
  upperLimit?: number
  /** 覆盖的下限 */
  lowerLimit?: number
  /** 覆盖的量检具类型ID */
  gaugeTypeId?: string
  /** 覆盖的量检具类型名称 */
  gaugeTypeName?: string
  /** 覆盖备注 */
  overrideReason?: string
}

/** 快速响应配置 */
export interface QuickResponseConfig {
  /** 是否启用快速响应 */
  enabled: boolean
  /** 响应级别: NORMAL / HIGH / CRITICAL */
  responseLevel?: 'NORMAL' | 'HIGH' | 'CRITICAL'
  /** 关联锁定的不良现象ID列表 */
  lockedPhenomenonIds?: string[]
  /** 是否发送邮件告警 */
  emailAlert?: boolean
  /** 邮件接收人列表 */
  emailRecipients?: string[]
  /** 是否发送钉钉告警 */
  dingTalkAlert?: boolean
  /** 钉钉群Webhook或接收人 */
  dingTalkRecipients?: string[]
  /** 告警消息模板 */
  alertTemplate?: string
}

/** 不良处理方式 */
export type DefectDisposition = 'SCRAP' | 'REWORK' | 'CONCESSION' | 'RETURN_SUPPLIER'

/** 检验计划（新模型） */
export interface InspPlan extends BaseEntity {
  /** 组织机构ID，NULL/空 表示集团级 */
  orgId: string | null
  /** 关联的检验方案ID */
  schemeId?: string
  /** 关联的检验方案名称（冗余） */
  schemeName?: string
  /** 计划编号，自动生成 */
  planCode: string
  /** 计划名称 */
  planName: string
  /** 版本号 */
  version: string
  /** 计划状态 */
  planStatus: InspPlanModelStatus
  /** 检验类型 */
  inspType: InspContextType | 'PATROL'
  /** 关联物料ID */
  materialId?: string
  /** 关联物料编码（冗余） */
  materialCode?: string
  /** 关联物料名称（冗余） */
  materialName?: string
  /** 触发器类型 */
  triggerType: PlanTriggerType
  /** 事件触发配置 */
  eventTrigger?: EventTriggerConfig
  /** 周期触发配置 */
  timeTrigger?: TimeTriggerConfig
  /** 数量触发配置 */
  quantityTrigger?: QuantityTriggerConfig
  /** 匹配规则 JSON（兼容旧字段，存储 ERP 单据匹配逻辑等） */
  matchRules?: Record<string, any>
  /** 默认检验员ID */
  executorId?: string
  /** 默认检验员名称 */
  executorName?: string
  /** 备选检验员ID */
  backupExecutorId?: string
  /** 备选检验员名称 */
  backupExecutorName?: string
  /** 审核人ID */
  reviewerId?: string
  /** 审核人名称 */
  reviewerName?: string
  /** 参数覆盖列表（对方案明细的阈值微调） */
  parameterOverrides?: ParameterOverride[]
  /** 快速响应配置 */
  quickResponse?: QuickResponseConfig
  /** 不良处理方式 */
  defectDisposition?: DefectDisposition
  /** 复制来源计划ID（自关联，溯源） */
  copyFromId?: string | null
  /** 复制来源计划编码（冗余展示） */
  copyFromCode?: string
  /** 是否为最新版本 */
  isLatestVersion: boolean
  /** 描述/备注 */
  description?: string
  // --- 旧架构兼容字段 ---
  /** 关联检验模板编码（旧） */
  templateCode?: string
  templateName?: string
  contextType?: InspContextType
  supplierId?: string
  supplierName?: string
  customerId?: string
  customerName?: string
  operationNo?: string
  operationName?: string
  ipqcType?: IpqcType
  triggerCondition?: TriggerCondition
  triggerValue?: number
  priority?: number
  /** 旧 status 兼容 */
  status?: InspPlanStatus
}

// ===============================
// 基础数据类型定义
// ===============================


/** 物料/产品 */
export interface MaterialProduct extends BaseEntity {
  orgId: string
  code: string
  name: string
  category: 'raw' | 'semi' | 'finished' | 'other'
  specification?: string
  model?: string
  unitId?: string
  unitName?: string
  weight?: number
  volume?: number
  supplierId?: string
  supplierName?: string
  processRouteId?: string
  processRouteName?: string
  description?: string
  status: 'enabled' | 'disabled'
}

/** 计量单位 */
export interface UnitCommon extends BaseEntity {
  orgId: string
  unitCode: string
  unitName: string
  unitType: 'length' | 'weight' | 'volume' | 'quantity' | 'time' | 'other'
  baseUnit?: string
  conversionRate?: number
  description?: string
  status: 'enabled' | 'disabled'
}

/** 工艺路线 */
export interface ProcessRoute extends BaseEntity {
  orgId: string
  routeCode: string
  routeName: string
  version: string
  materialId?: string
  materialName?: string
  description?: string
  status: 'draft' | 'approved' | 'deprecated'
  operations?: ProcessOperation[]
}

/** 工序 */
export interface ProcessOperation extends BaseEntity {
  routeId: string
  operationCode: string
  operationName: string
  sortOrder: number
  workCenterId?: string
  workCenterName?: string
  standardTime?: number
  timeUnit?: string
  inspRequired: boolean
  inspTemplateId?: string
  inspTemplateName?: string
  description?: string
}

/** 客户档案 */
export interface Customer extends BaseEntity {
  orgId: string
  customerCode: string
  customerName: string
  customerType: 'enterprise' | 'individual'
  level: 'A' | 'B' | 'C' | 'D'
  contact?: string
  phone?: string
  email?: string
  address?: string
  region?: string
  description?: string
  status: 'active' | 'inactive'
}

// ===============================
// 系统更新日志类型定义
// ===============================

/** 更新日志 */
export interface UpdateLog extends BaseEntity {
  orgId: string
  version: string
  title: string
  content: string
  contentType: 'html' | 'markdown'
  updateType: 'feature' | 'fix' | 'optimize' | 'breaking'
  affectedModules: string[]
  relatedChangeId?: string
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  publishedBy?: string
}

/** 更新日志列表查询参数 */
export interface UpdateLogQueryParams {
  page?: number
  pageSize?: number
  version?: string
  updateType?: 'feature' | 'fix' | 'optimize' | 'breaking'
  status?: 'draft' | 'published' | 'archived'
  startDate?: string
  endDate?: string
  keyword?: string
}

/** 更新日志创建/更新请求 */
export interface UpdateLogFormData {
  version: string
  title: string
  content: string
  contentType: 'html' | 'markdown'
  updateType: 'feature' | 'fix' | 'optimize' | 'breaking'
  affectedModules: string[]
  relatedChangeId?: string
}

// ===============================
// 功能设计文档类型定义
// ===============================

/** 设计任务 */
export interface DesignTask {
  id: string
  taskNumber: string
  title: string
  description: string
  assigneeRole: 'frontend' | 'backend' | 'test' | 'all'
  status: 'pending' | 'in-progress' | 'completed'
  estimatedHours?: number
  dependencies: string[]
  completedAt?: string
  createdAt: string
  updatedAt: string
}

/** 功能设计文档 */
export interface DesignDocument {
  id: string
  updateLogId: string
  title: string
  documentType: 'frontend' | 'backend' | 'test' | 'general'
  tasks: DesignTask[]
  createdAt: string
  createdBy: string
  updatedAt: string
  orgId: string
}

/** 设计文档查询参数 */
export interface DesignDocumentQueryParams {
  updateLogId: string
  documentType?: 'frontend' | 'backend' | 'test' | 'general'
}

/** 设计文档创建请求 */
export interface DesignDocumentFormData {
  updateLogId: string
  title: string
  documentType: 'frontend' | 'backend' | 'test' | 'general'
  tasks: Omit<DesignTask, 'id' | 'createdAt' | 'updatedAt'>[]
}

/** 任务状态更新请求 */
export interface TaskStatusUpdateRequest {
  status: 'pending' | 'in-progress' | 'completed'
}

// ===============================
// API 响应类型定义
// ===============================

/** 分页响应 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 通用 API 响应 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

/** 更新日志统计 */
export interface UpdateLogStats {
  totalCount: number
  draftCount: number
  publishedCount: number
  archivedCount: number
  unreadCount: number
}

/** 设计文档进度统计 */
export interface DesignDocumentProgress {
  documentType: 'frontend' | 'backend' | 'test' | 'general'
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  completionRate: number
}