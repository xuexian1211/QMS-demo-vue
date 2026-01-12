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