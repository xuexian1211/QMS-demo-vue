/**
 * 缺陷管理 API 服务
 * 包含：缺陷分类、不良现象、不良原因的统一管理
 */

import type { DefectCategory, DefectPhenomenon, DefectCause, PhenomenonCauseMapping } from '@/types'

// ===============================
// Mock 数据
// ===============================

/** Mock 缺陷分类数据（支持多组织） */
const mockCategories: DefectCategory[] = [
  // 集团级分类
  { 
    id: '1', 
    orgId: undefined,  // NULL 表示集团级
    categoryCode: 'DCAT-APP', 
    categoryName: '外观缺陷', 
    parentId: null,
    description: '产品表面相关缺陷',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  { 
    id: '11', 
    orgId: undefined,
    categoryCode: 'DCAT-APP-CAST', 
    categoryName: '铸造外观', 
    parentId: 1,
    description: '铸造特有外观缺陷',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  { 
    id: '12', 
    orgId: undefined,
    categoryCode: 'DCAT-APP-MACH', 
    categoryName: '机加外观', 
    parentId: 1,
    description: '机加特有外观缺陷',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  { 
    id: '2', 
    orgId: undefined,
    categoryCode: 'DCAT-DIM', 
    categoryName: '尺寸缺陷', 
    parentId: null,
    description: '尺寸公差超差',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  { 
    id: '3', 
    orgId: undefined,
    categoryCode: 'DCAT-FUNC', 
    categoryName: '性能缺陷', 
    parentId: null,
    description: '功能测试失效',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  // 工厂级分类示例
  { 
    id: '101', 
    orgId: 1,  // 合肥工厂
    categoryCode: 'DCAT-APP-HF', 
    categoryName: '合肥外观', 
    parentId: 1,
    description: '合肥工厂特有外观缺陷',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'user1',
    updater: 'user1'
  }
]

/** Mock 不良现象数据 */
const mockPhenomena: DefectPhenomenon[] = [
  {
    id: '1001',
    orgId: undefined,  // 集团级
    code: 'DEF-001',
    name: '表面划伤',
    categoryId: 1,
    severity: 'MI',
    processType: '全工序',
    description: '可见划痕',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  {
    id: '1002',
    orgId: undefined,
    code: 'DEF-002',
    name: '气孔',
    categoryId: 11,
    severity: 'MA',
    processType: '压铸',
    description: '表面密集气孔',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  {
    id: '2001',
    orgId: undefined,
    code: 'DIM-001',
    name: '长度超差',
    categoryId: 2,
    severity: 'MA',
    processType: '机加',
    description: '长度尺寸超出公差范围',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  // 工厂级现象示例
  {
    id: '10001',
    orgId: 1,  // 合肥工厂
    code: 'DEF-HF-001',
    name: '合肥特有缺陷',
    categoryId: 101,
    severity: 'MI',
    processType: '压铸',
    description: '合肥工厂特有缺陷',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'user1',
    updater: 'user1'
  }
]

/** Mock 不良原因数据（树状结构） */
const mockCauses: DefectCause[] = [
  // 根原因 - 人
  {
    id: '1',
    orgId: undefined,
    code: 'C-MAN',
    name: '人员问题',
    category: 'Man',
    parentId: null,
    isHighFrequency: false,
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  // 子原因 - 人
  {
    id: '11',
    orgId: undefined,
    code: 'C-MAN-001',
    name: '操作不当',
    category: 'Man',
    parentId: 1,
    isHighFrequency: true,  // 高频原因
    description: '员工未按SOP操作',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  {
    id: '12',
    orgId: undefined,
    code: 'C-MAN-002',
    name: '技能不足',
    category: 'Man',
    parentId: 1,
    isHighFrequency: false,
    description: '员工技能培训不足',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  // 子子原因 - 人
  {
    id: '111',
    orgId: undefined,
    code: 'C-MAN-001-01',
    name: '未按SOP操作',
    category: 'Man',
    parentId: 11,
    isHighFrequency: true,
    description: '员工未严格按照标准作业程序操作',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  
  // 根原因 - 机
  {
    id: '2',
    orgId: undefined,
    code: 'C-MAC',
    name: '设备问题',
    category: 'Machine',
    parentId: null,
    isHighFrequency: false,
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  {
    id: '21',
    orgId: undefined,
    code: 'C-MAC-001',
    name: '设备故障',
    category: 'Machine',
    parentId: 2,
    isHighFrequency: true,
    description: '主轴跳动过大',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  
  // 根原因 - 料
  {
    id: '3',
    orgId: undefined,
    code: 'C-MAT',
    name: '物料问题',
    category: 'Material',
    parentId: null,
    isHighFrequency: false,
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  {
    id: '31',
    orgId: undefined,
    code: 'C-MAT-001',
    name: '原料杂质',
    category: 'Material',
    parentId: 3,
    isHighFrequency: true,
    description: '供应商来料含杂质',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  
  // 根原因 - 法
  {
    id: '4',
    orgId: undefined,
    code: 'C-MET',
    name: '方法问题',
    category: 'Method',
    parentId: null,
    isHighFrequency: false,
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  {
    id: '41',
    orgId: undefined,
    code: 'C-MET-001',
    name: '工艺参数',
    category: 'Method',
    parentId: 4,
    isHighFrequency: false,
    description: '温度设置不当',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  
  // 根原因 - 环
  {
    id: '5',
    orgId: undefined,
    code: 'C-ENV',
    name: '环境问题',
    category: 'Environment',
    parentId: null,
    isHighFrequency: false,
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  },
  {
    id: '51',
    orgId: undefined,
    code: 'C-ENV-001',
    name: '环境温度',
    category: 'Environment',
    parentId: 5,
    isHighFrequency: false,
    description: '车间温度过高',
    createTime: '2024-01-01',
    updateTime: '2024-01-01',
    creator: 'system',
    updater: 'system'
  }
]

/** Mock 现象-原因关联数据 */
const mockMappings: PhenomenonCauseMapping[] = [
  {
    phenomenonId: 1001,  // 表面划伤
    orgId: 0,
    causeId: 11,  // 操作不当
    weight: 8,
    causeName: '操作不当',
    causeCode: 'C-MAN-001',
    causeType: 'Man'
  },
  {
    phenomenonId: 1001,
    orgId: 0,
    causeId: 21,  // 设备故障
    weight: 5,
    causeName: '设备故障',
    causeCode: 'C-MAC-001',
    causeType: 'Machine'
  },
  {
    phenomenonId: 1002,  // 气孔
    orgId: 0,
    causeId: 31,  // 原料杂质
    weight: 9,
    causeName: '原料杂质',
    causeCode: 'C-MAT-001',
    causeType: 'Material'
  },
  {
    phenomenonId: 1002,
    orgId: 0,
    causeId: 41,  // 工艺参数
    weight: 7,
    causeName: '工艺参数',
    causeCode: 'C-MET-001',
    causeType: 'Method'
  }
]

// ===============================
// 工具函数
// ===============================

/**
 * 构建树形结构
 * @param items 扁平化的数据列表
 * @param parentId 父节点ID，默认为null（根节点）
 * @returns 树形结构数据
 */
export function buildTree<T extends { id: any; parentId?: any; children?: T[] }>(
  items: T[],
  parentId: any = null
): T[] {
  return items
    .filter(item => item.parentId === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }))
    .sort((a: any, b: any) => {
      // 高频原因优先（如果有 isHighFrequency 字段）
      if ('isHighFrequency' in a && 'isHighFrequency' in b) {
        if (a.isHighFrequency && !b.isHighFrequency) return -1
        if (!a.isHighFrequency && b.isHighFrequency) return 1
      }
      // 按名称排序
      return (a.name || '').localeCompare(b.name || '')
    })
}

/**
 * 多组织数据过滤
 * @param items 所有数据
 * @param userOrgId 用户所属组织ID
 * @returns 过滤后的数据（集团级 + 本工厂）
 */
export function filterByOrg<T extends { orgId?: number }>(
  items: T[],
  userOrgId?: number
): T[] {
  return items.filter(item =>
    item.orgId === undefined ||  // 集团级数据（orgId = NULL）
    item.orgId === userOrgId  // 本工厂数据
  )
}

// ===============================
// API 服务
// ===============================

export const defectApi = {
  /**
   * 获取缺陷分类树
   * @param orgId 组织ID（可选）
   */
  getCategoryTree: (orgId?: number) => {
    const filtered = filterByOrg(mockCategories, orgId)
    return Promise.resolve(buildTree(filtered))
  },

  /**
   * 获取不良现象列表
   * @param categoryId 分类ID（可选）
   * @param orgId 组织ID（可选）
   */
  getPhenomena: (categoryId?: number, orgId?: number) => {
    let filtered = filterByOrg(mockPhenomena, orgId)
    if (categoryId) {
      filtered = filtered.filter(p => p.categoryId === categoryId)
    }
    return Promise.resolve(filtered)
  },

  /**
   * 获取不良原因树
   * @param orgId 组织ID（可选）
   */
  getCauseTree: (orgId?: number) => {
    const filtered = filterByOrg(mockCauses, orgId)
    return Promise.resolve(buildTree(filtered))
  },

  /**
   * 获取所有不良原因（扁平列表）
   * @param orgId 组织ID（可选）
   */
  getAllCauses: (orgId?: number) => {
    const filtered = filterByOrg(mockCauses, orgId)
    return Promise.resolve(filtered)
  },

  /**
   * 获取高频原因列表
   * @param orgId 组织ID（可选）
   */
  getHighFrequencyCauses: (orgId?: number) => {
    const filtered = filterByOrg(mockCauses, orgId)
    return Promise.resolve(filtered.filter(c => c.isHighFrequency))
  },

  /**
   * 获取现象-原因关联
   * @param phenomenonId 现象ID
   */
  getPhenomenonCauseMappings: (phenomenonId: number) => {
    const mappings = mockMappings.filter(m => m.phenomenonId === phenomenonId)
    // 按权重降序排序
    return Promise.resolve(mappings.sort((a, b) => b.weight - a.weight))
  },

  /**
   * 添加现象-原因关联
   * @param mapping 关联数据
   */
  addPhenomenonCauseMapping: (mapping: PhenomenonCauseMapping) => {
    mockMappings.push(mapping)
    return Promise.resolve({ success: true })
  },

  /**
   * 更新关联权重
   * @param phenomenonId 现象ID
   * @param causeId 原因ID
   * @param weight 新权重
   */
  updateMappingWeight: (phenomenonId: number, causeId: number, weight: number) => {
    const mapping = mockMappings.find(
      m => m.phenomenonId === phenomenonId && m.causeId === causeId
    )
    if (mapping) {
      mapping.weight = weight
    }
    return Promise.resolve({ success: true })
  },

  /**
   * 删除现象-原因关联
   * @param phenomenonId 现象ID
   * @param causeId 原因ID
   */
  deletePhenomenonCauseMapping: (phenomenonId: number, causeId: number) => {
    const index = mockMappings.findIndex(
      m => m.phenomenonId === phenomenonId && m.causeId === causeId
    )
    if (index !== -1) {
      mockMappings.splice(index, 1)
    }
    return Promise.resolve({ success: true })
  }
}
