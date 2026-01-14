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
  orgId: string
  categoryCode: string
  categoryName: string
  parentId: string | null
  level: number
  sortOrder: number
  description?: string
  status: 'enabled' | 'disabled'
  children?: DefectCategory[]
}

/** 不良现象 */
export interface DefectPhenomenon extends BaseEntity {
  orgId: string
  code: string
  name: string
  categoryId: string
  severity: 'CR' | 'MA' | 'MI'
  processType?: string
  description?: string
  status: 'enabled' | 'disabled'
  /** 关联的不良原因ID列表 */
  relatedCauseIds?: string[]
}

/** 不良原因 */
export interface DefectCause extends BaseEntity {
  orgId: string
  code: string
  name: string
  parentId: string | null
  level: number
  sortOrder: number
  description?: string
  status: 'enabled' | 'disabled'
  children?: DefectCause[]
  /** 关联的不良现象ID列表 */
  relatedPhenomenonIds?: string[]
}

/** 检验项目 */
export interface InspectionItem extends BaseEntity {
  orgId: string
  code: string
  name: string
  dataType: 'quantitative' | 'qualitative'
  method?: string
  standard?: string
  description?: string
  status: 'enabled' | 'disabled'
  /** 关联的不良现象ID列表 */
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

/** 物料检验规格 */
export interface MaterialSpec extends BaseEntity {
  orgId: string
  materialId: string
  specCode: string
  specName: string
  specType: 'quantitative' | 'qualitative'
  // 计量型
  targetValue?: number
  upperLimit?: number
  lowerLimit?: number
  unit?: string
  // 计数型
  standardDesc?: string
  standardCode?: string
  expectedValue?: string
  sampleImage?: string
  sortOrder: number
  status: 'enabled' | 'disabled'
}

/** 检验模板 */
export interface InspTemplate extends BaseEntity {
  orgId: string
  templateCode: string
  templateName: string
  version: string
  inspType: 'IQC' | 'IPQC' | 'FQC' | 'OQC'
  status: 'draft' | 'pending' | 'approved' | 'deprecated'
  description?: string
  details?: InspTemplateDetail[]
}

/** 检验模板明细 */
export interface InspTemplateDetail extends BaseEntity {
  templateId: string
  sortOrder: number
  inspItemId: string
  inspItemName: string
  inspMethodId?: string
  inspMethodName?: string
  samplingPlanId?: string
  samplingPlanName?: string
  gaugeTypeId?: string
  gaugeTypeName?: string
  specType: 'quantitative' | 'qualitative'
  // 计量型规格
  targetValue?: number
  upperLimit?: number
  lowerLimit?: number
  unit?: string
  // 计数型规格
  standardDesc?: string
  // IPQC 频次
  frequencyType?: 'time' | 'quantity' | 'batch'
  frequencyValue?: number
  frequencyUnit?: string
  // 开关配置
  spcEnabled: boolean
  labRequired: boolean
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