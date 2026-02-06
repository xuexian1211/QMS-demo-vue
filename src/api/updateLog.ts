import type {
  UpdateLog,
  UpdateLogQueryParams,
  UpdateLogFormData,
  DesignDocument,
  DesignDocumentQueryParams,
  DesignTask,
  TaskStatusUpdateRequest,
  PageResult,
  ApiResponse,
  UpdateLogStats,
  DesignDocumentProgress
} from '@/types'
import { generatedUpdateLogs } from './generated-update-logs'

// Mock 数据生成器
const generateMockUpdateLogs = (): UpdateLog[] => {
  // 只使用从 OpenSpec 自动生成的真实更新日志
  const logs: UpdateLog[] = [...generatedUpdateLogs]
  
  return logs
}

const generateMockDesignDocuments = (updateLogId: string): DesignDocument[] => {
  const documentTypes: Array<'frontend' | 'backend' | 'test' | 'general'> = ['frontend', 'backend', 'test', 'general']
  
  // 如果是量检具增强功能，返回真实任务
  if (updateLogId === 'log-enhance-gauge-lifecycle-management') {
    return documentTypes.map((type, index) => ({
      id: `doc-${updateLogId}-${index}`,
      updateLogId,
      title: `${type === 'frontend' ? '前端' : type === 'backend' ? '后端' : type === 'test' ? '测试' : '通用'}任务文档`,
      documentType: type,
      tasks: generateGaugeManagementTasks(type),
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedAt: new Date().toISOString(),
      orgId: 'org-001'
    }))
  }

  return documentTypes.map((type, index) => ({
    id: `doc-${updateLogId}-${index}`,
    updateLogId,
    title: `${type === 'frontend' ? '前端' : type === 'backend' ? '后端' : type === 'test' ? '测试' : '通用'}任务文档`,
    documentType: type,
    tasks: generateMockTasks(type, 5),
    createdAt: new Date().toISOString(),
    createdBy: 'admin',
    updatedAt: new Date().toISOString(),
    orgId: 'org-001'
  }))
}

const generateGaugeManagementTasks = (role: string): DesignTask[] => {
  const tasks: Record<string, DesignTask[]> = {
    frontend: [
      {
        id: 'task-fe-1',
        taskNumber: '1.1',
        title: '创建 GaugeLedgerDetail.vue 详情页',
        description: '实现顶部概览卡片 + 底部多页签交互布局，包含校准记录时间线。',
        assigneeRole: 'frontend',
        status: 'completed',
        estimatedHours: 8,
        dependencies: [],
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-fe-2',
        taskNumber: '1.2',
        title: '重构 GaugeLedgerList.vue 编辑弹窗',
        description: '实现表单字段的逻辑分组（基本/技术/校准/管理）及校验规则。',
        assigneeRole: 'frontend',
        status: 'completed',
        estimatedHours: 4,
        dependencies: [],
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-fe-3',
        taskNumber: '1.3',
        title: '封装 CalibrationRecordModal 业务弹窗',
        description: '独立封装校准结果录入逻辑，支持自动关联有效期更新。',
        assigneeRole: 'frontend',
        status: 'completed',
        estimatedHours: 4,
        dependencies: ['task-fe-1'],
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-fe-4',
        taskNumber: '1.4',
        title: '实现台账批量导入 (Import) 功能',
        description: '集成 a-upload 组件，实现模拟导入延迟及前端数据插入回显。',
        assigneeRole: 'frontend',
        status: 'completed',
        estimatedHours: 6,
        dependencies: [],
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    backend: [
      {
        id: 'task-be-1',
        taskNumber: '2.1',
        title: '扩展 GaugeLedger 类型定义',
        description: '在 src/types/index.ts 中增加 12+ 质量属性字段。',
        assigneeRole: 'backend',
        status: 'completed',
        estimatedHours: 2,
        dependencies: [],
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-be-2',
        taskNumber: '2.2',
        title: '定义状态机枚举 GaugeStatus',
        description: '确立 IN_USE, CALIBRATING, SEALED, SCRAPPED 的业务状态标识。',
        assigneeRole: 'backend',
        status: 'completed',
        estimatedHours: 1,
        dependencies: [],
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    test: [
      {
        id: 'task-test-1',
        taskNumber: '3.1',
        title: '生产环境 Vite Build 构建测试',
        description: '验证并修复 Vue 3 生产模式下的 v-model 属性绑定冲突错误。',
        assigneeRole: 'test',
        status: 'completed',
        estimatedHours: 4,
        dependencies: [],
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-test-2',
        taskNumber: '3.2',
        title: '全链路业务闭环验证',
        description: '模拟「购入-入库-校准-延期-报废」完整生命周期逻辑一致性测试。',
        assigneeRole: 'test',
        status: 'completed',
        estimatedHours: 8,
        dependencies: [],
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    general: [
      {
        id: 'task-gen-1',
        taskNumber: '4.1',
        title: '同步 OpenSpec 需求规格至更新日志',
        description: '实现设计文档与更新日志的深度绑定，确保文档追溯。',
        assigneeRole: 'general' as any,
        status: 'completed',
        estimatedHours: 2,
        dependencies: [],
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
  return tasks[role] || []
}


const generateMockTasks = (role: string, count: number): DesignTask[] => {
  const statuses: Array<'pending' | 'in-progress' | 'completed'> = ['pending', 'in-progress', 'completed']
  
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${role}-${i + 1}`,
    taskNumber: `${i + 1}.${i + 1}`,
    title: `${role === 'frontend' ? '前端' : role === 'backend' ? '后端' : role === 'test' ? '测试' : '通用'}任务 ${i + 1}`,
    description: `这是${role}任务 ${i + 1} 的详细描述`,
    assigneeRole: role as any,
    status: statuses[i % 3],
    estimatedHours: (i + 1) * 2,
    dependencies: i > 0 ? [`task-${role}-${i}`] : [],
    completedAt: statuses[i % 3] === 'completed' ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
}

// Mock 数据存储
let mockUpdateLogs = generateMockUpdateLogs()
let mockDesignDocuments: DesignDocument[] = []

// 模拟网络延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

// ===============================
// 更新日志 API
// ===============================

/**
 * 获取更新日志列表
 */
export const getUpdateLogs = async (params: UpdateLogQueryParams): Promise<ApiResponse<PageResult<UpdateLog>>> => {
  await delay()
  
  let filteredLogs = [...mockUpdateLogs]
  
  // 筛选
  if (params.version) {
    filteredLogs = filteredLogs.filter(log => log.version.includes(params.version!))
  }
  if (params.updateType) {
    filteredLogs = filteredLogs.filter(log => log.updateType === params.updateType)
  }
  if (params.status) {
    filteredLogs = filteredLogs.filter(log => log.status === params.status)
  }
  if (params.keyword) {
    filteredLogs = filteredLogs.filter(log => 
      log.title.includes(params.keyword!) || log.content.includes(params.keyword!)
    )
  }
  
  // 分页
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return {
    code: 200,
    message: '查询成功',
    success: true,
    data: {
      list: filteredLogs.slice(start, end),
      total: filteredLogs.length,
      page,
      pageSize
    }
  }
}

/**
 * 获取更新日志详情
 */
export const getUpdateLogById = async (id: string): Promise<ApiResponse<UpdateLog>> => {
  await delay()
  
  const log = mockUpdateLogs.find(l => l.id === id)
  if (!log) {
    return {
      code: 404,
      message: '更新日志不存在',
      success: false,
      data: null as any
    }
  }
  
  return {
    code: 200,
    message: '查询成功',
    success: true,
    data: log
  }
}

/**
 * 创建更新日志
 */
export const createUpdateLog = async (data: UpdateLogFormData): Promise<ApiResponse<UpdateLog>> => {
  await delay()
  
  const newLog: UpdateLog = {
    id: `log-${Date.now()}`,
    orgId: 'org-001',
    ...data,
    status: 'draft',
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    creator: 'admin',
    updater: 'admin'
  }
  
  mockUpdateLogs.unshift(newLog)
  
  return {
    code: 200,
    message: '创建成功',
    success: true,
    data: newLog
  }
}

/**
 * 更新更新日志
 */
export const updateUpdateLog = async (id: string, data: UpdateLogFormData): Promise<ApiResponse<UpdateLog>> => {
  await delay()
  
  const index = mockUpdateLogs.findIndex(l => l.id === id)
  if (index === -1) {
    return {
      code: 404,
      message: '更新日志不存在',
      success: false,
      data: null as any
    }
  }
  
  mockUpdateLogs[index] = {
    ...mockUpdateLogs[index],
    ...data,
    updateTime: new Date().toISOString(),
    updater: 'admin'
  }
  
  return {
    code: 200,
    message: '更新成功',
    success: true,
    data: mockUpdateLogs[index]
  }
}

/**
 * 删除更新日志
 */
export const deleteUpdateLog = async (id: string): Promise<ApiResponse<void>> => {
  await delay()
  
  const index = mockUpdateLogs.findIndex(l => l.id === id)
  if (index === -1) {
    return {
      code: 404,
      message: '更新日志不存在',
      success: false,
      data: undefined
    }
  }
  
  mockUpdateLogs.splice(index, 1)
  
  return {
    code: 200,
    message: '删除成功',
    success: true,
    data: undefined
  }
}

/**
 * 发布更新日志
 */
export const publishUpdateLog = async (id: string): Promise<ApiResponse<UpdateLog>> => {
  await delay()
  
  const index = mockUpdateLogs.findIndex(l => l.id === id)
  if (index === -1) {
    return {
      code: 404,
      message: '更新日志不存在',
      success: false,
      data: null as any
    }
  }
  
  mockUpdateLogs[index] = {
    ...mockUpdateLogs[index],
    status: 'published',
    publishedAt: new Date().toISOString(),
    publishedBy: 'admin',
    updateTime: new Date().toISOString()
  }
  
  return {
    code: 200,
    message: '发布成功',
    success: true,
    data: mockUpdateLogs[index]
  }
}

/**
 * 归档更新日志
 */
export const archiveUpdateLog = async (id: string): Promise<ApiResponse<UpdateLog>> => {
  await delay()
  
  const index = mockUpdateLogs.findIndex(l => l.id === id)
  if (index === -1) {
    return {
      code: 404,
      message: '更新日志不存在',
      success: false,
      data: null as any
    }
  }
  
  mockUpdateLogs[index] = {
    ...mockUpdateLogs[index],
    status: 'archived',
    updateTime: new Date().toISOString()
  }
  
  return {
    code: 200,
    message: '归档成功',
    success: true,
    data: mockUpdateLogs[index]
  }
}

/**
 * 获取更新日志统计
 */
export const getUpdateLogStats = async (): Promise<ApiResponse<UpdateLogStats>> => {
  await delay()
  
  const stats: UpdateLogStats = {
    totalCount: mockUpdateLogs.length,
    draftCount: mockUpdateLogs.filter(l => l.status === 'draft').length,
    publishedCount: mockUpdateLogs.filter(l => l.status === 'published').length,
    archivedCount: mockUpdateLogs.filter(l => l.status === 'archived').length,
    unreadCount: Math.floor(Math.random() * 5) // 模拟未读数量
  }
  
  return {
    code: 200,
    message: '查询成功',
    success: true,
    data: stats
  }
}

// ===============================
// 设计文档 API
// ===============================

/**
 * 获取设计文档列表
 */
export const getDesignDocuments = async (params: DesignDocumentQueryParams): Promise<ApiResponse<DesignDocument[]>> => {
  await delay()
  
  // 如果没有 mock 数据,生成一些
  if (mockDesignDocuments.length === 0 || !mockDesignDocuments.some(d => d.updateLogId === params.updateLogId)) {
    const newDocs = generateMockDesignDocuments(params.updateLogId)
    mockDesignDocuments.push(...newDocs)
  }
  
  let docs = mockDesignDocuments.filter(d => d.updateLogId === params.updateLogId)
  
  if (params.documentType) {
    docs = docs.filter(d => d.documentType === params.documentType)
  }
  
  return {
    code: 200,
    message: '查询成功',
    success: true,
    data: docs
  }
}

/**
 * 创建设计文档
 */
export const createDesignDocument = async (data: any): Promise<ApiResponse<DesignDocument>> => {
  await delay()
  
  const newDoc: DesignDocument = {
    id: `doc-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
    createdBy: 'admin',
    updatedAt: new Date().toISOString(),
    orgId: 'org-001'
  }
  
  mockDesignDocuments.push(newDoc)
  
  return {
    code: 200,
    message: '创建成功',
    success: true,
    data: newDoc
  }
}

/**
 * 更新任务状态
 */
export const updateTaskStatus = async (
  docId: string,
  taskId: string,
  data: TaskStatusUpdateRequest
): Promise<ApiResponse<DesignTask>> => {
  await delay()
  
  const doc = mockDesignDocuments.find(d => d.id === docId)
  if (!doc) {
    return {
      code: 404,
      message: '设计文档不存在',
      success: false,
      data: null as any
    }
  }
  
  const task = doc.tasks.find(t => t.id === taskId)
  if (!task) {
    return {
      code: 404,
      message: '任务不存在',
      success: false,
      data: null as any
    }
  }
  
  task.status = data.status
  task.updatedAt = new Date().toISOString()
  if (data.status === 'completed') {
    task.completedAt = new Date().toISOString()
  }
  
  return {
    code: 200,
    message: '更新成功',
    success: true,
    data: task
  }
}

/**
 * 获取设计文档进度统计
 */
export const getDesignDocumentProgress = async (updateLogId: string): Promise<ApiResponse<DesignDocumentProgress[]>> => {
  await delay()
  
  const docs = mockDesignDocuments.filter(d => d.updateLogId === updateLogId)
  
  const progress: DesignDocumentProgress[] = docs.map(doc => {
    const totalTasks = doc.tasks.length
    const completedTasks = doc.tasks.filter(t => t.status === 'completed').length
    const inProgressTasks = doc.tasks.filter(t => t.status === 'in-progress').length
    const pendingTasks = doc.tasks.filter(t => t.status === 'pending').length
    
    return {
      documentType: doc.documentType,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
  })
  
  return {
    code: 200,
    message: '查询成功',
    success: true,
    data: progress
  }
}
