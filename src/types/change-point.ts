/**
 * 变化点管理模块 - 类型定义
 */

/** 变化点类型：4M1E + 其他 */
export type ChangePointType = 'man' | 'machine' | 'material' | 'method' | 'environment' | 'measure' | 'other'

/** 风险等级 */
export type RiskLevel = 'low' | 'medium' | 'high'

/** 变化点状态流转 */
export type ChangePointStatus =
  | 'draft'       // 草稿
  | 'submitted'   // 已提报
  | 'approving'   // 审批中
  | 'approved'    // 已批准（等待锁机/试产）
  | 'locked'      // 已锁机（试生产验证中）
  | 'verifying'   // 验证中
  | 'released'    // 已放行（验证通过，MES已解锁）
  | 'rejected'    // 已驳回
  | 'closed'      // 已闭环

/** 申请人信息 */
export interface ChangePointReporter {
  id: string
  name: string
  department: string
  team?: string
}

/** 4M1E 变化点明细 */
export interface ChangePointDetail {
  changeType: ChangePointType
  changeSubType: string       // 如"新员工上岗" / "设备大修"
  changeDescription: string
  affectedProduct?: string    // 受影响产品
  affectedProcess?: string    // 受影响工序
  affectedMachine?: string    // 受影响机台编号
  affectedMaterial?: string   // 受影响物料
}

/** 变化点处理单 */
export interface ChangePointRecord {
  id: string
  recordNo: string              // 单号，如 CPR-20240305-001
  title: string                 // 变化点标题

  // 提报信息
  reporter: ChangePointReporter
  reportTime: string
  changeDetail: ChangePointDetail

  // 风险评估
  riskLevel: RiskLevel
  riskScore?: number
  riskDescription?: string

  // 状态
  status: ChangePointStatus

  // 审批信息
  approver?: string
  approveTime?: string
  approveComment?: string

  // MES 互锁
  mesLockTime?: string          // 锁机时间
  mesUnlockTime?: string        // 解锁时间
  mesLockLog?: MesLockLog[]     // MES锁机日志

  // 验证信息
  verificationPlan?: VerificationPlan
  verificationTaskId?: string

  // 闭环信息
  closedBy?: string
  closeTime?: string
  closeComment?: string
  relatedDocUpdates?: string[]  // 关联文件变更记录

  // 附件
  attachments?: string[]

  // 创建/更新时间
  createTime: string
  updateTime: string

  // 知识库
  savedToKnowledge?: boolean
}

/** MES 锁机日志 */
export interface MesLockLog {
  id: string
  action: 'lock' | 'unlock' | 'violation'  // 操作类型（violation = 盲动报工）
  machinePsId?: string     // 机台/工单 ID
  machineNo?: string
  operatorTime: string
  result: 'success' | 'fail'
  note?: string
}

/** 试生产验证方案 */
export interface VerificationPlan {
  id: string
  changePointId: string
  planTitle: string
  requiredCount: number        // 要求连续合格件数（如3件）
  completedCount: number       // 已完成件数
  passedCount: number          // 已合格件数
  verifier: string             // 验证责任人（IPQC）
  qeApprover: string           // QE 审批人
  deadline: string             // 截止时间
  status: 'pending' | 'running' | 'passed' | 'failed'
  taskItems: VerificationTaskItem[]
  createTime: string
  updateTime: string
}

/** 单件验证任务记录 */
export interface VerificationTaskItem {
  id: string
  sequence: number              // 序号（第几件）
  inspector: string
  inspectTime: string
  result: 'pass' | 'fail' | 'pending'
  note?: string
  attachments?: string[]
}

/** 风险矩阵规则条目 */
export interface RiskMatrixRule {
  id: string
  changeType: ChangePointType
  subType: string
  keyword: string               // 匹配关键词
  defaultRiskLevel: RiskLevel
  requireQEApproval: boolean
  requireDirectorApproval: boolean
  requireMesLock: boolean
  description?: string
  isActive: boolean
}

/** 预警通知 */
export interface AlertRecord {
  id: string
  changePointId: string
  recordNo: string
  alertType: 'blind_move' | 'verification_timeout'  // 盲动预警 / 超时预警
  severity: 'red' | 'orange'
  message: string
  triggerTime: string
  notifiedUsers: string[]
  isRead: boolean
}

/** 4M1E 类型标签配置 */
export const CHANGE_TYPE_OPTIONS = [
  { value: 'man', label: '人 (Man)', icon: '👷', color: '#1890ff', description: '涉及人员的变化' },
  { value: 'machine', label: '机 (Machine)', icon: '🏭', color: '#722ed1', description: '涉及设备/模具的变化' },
  { value: 'material', label: '料 (Material)', icon: '📦', color: '#fa8c16', description: '涉及物料/原材料的变化' },
  { value: 'method', label: '法 (Method)', icon: '📋', color: '#13c2c2', description: '涉及工艺/方法的变化' },
  { value: 'environment', label: '环 (Environment)', icon: '🌡️', color: '#52c41a', description: '涉及生产环境的变化' },
  { value: 'measure', label: '测 (Measure)', icon: '📐', color: '#eb2f96', description: '涉及测量系统的变化' },
  { value: 'other', label: '其他 (Other)', icon: '📝', color: '#8c8c8c', description: '其他类型变化' },
] as const

/** 变化点状态展示配置 */
export const STATUS_CONFIG: Record<ChangePointStatus, { label: string; color: string; dotColor: string }> = {
  draft:      { label: '草稿',     color: 'default', dotColor: '#8c8c8c' },
  submitted:  { label: '已提报',   color: 'blue',    dotColor: '#1890ff' },
  approving:  { label: '审批中',   color: 'processing', dotColor: '#fa8c16' },
  approved:   { label: '已批准',   color: 'cyan',    dotColor: '#13c2c2' },
  locked:     { label: '已锁机',   color: 'error',   dotColor: '#ff4d4f' },
  verifying:  { label: '验证中',   color: 'warning', dotColor: '#faad14' },
  released:   { label: '已放行',   color: 'success', dotColor: '#52c41a' },
  rejected:   { label: '已驳回',   color: 'red',     dotColor: '#ff4d4f' },
  closed:     { label: '已闭环',   color: 'purple',  dotColor: '#722ed1' },
}

/** 风险等级展示配置 */
export const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low:    { label: '低风险', color: '#52c41a', bgColor: '#f6ffed' },
  medium: { label: '中风险', color: '#faad14', bgColor: '#fffbe6' },
  high:   { label: '高风险', color: '#ff4d4f', bgColor: '#fff2f0' },
}
