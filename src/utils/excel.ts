/**
 * 数据导出工具
 * 用于将表格数据导出为 CSV 或 Excel 格式
 */

/**
 * 将数据导出为 CSV 文件
 * @param data 要导出的数据数组
 * @param columns 列定义，格式为 { title: string, dataIndex: string }[]
 * @param filename 文件名（不含扩展名）
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { title: string; dataIndex: string }[],
  filename: string = 'export'
): void {
  if (!data || data.length === 0) {
    console.warn('没有数据可导出')
    return
  }

  // 构建 CSV 标题行
  const headers = columns.map(col => col.title)
  
  // 构建 CSV 数据行
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.dataIndex]
      // 处理特殊字符：逗号、引号、换行符
      if (value === null || value === undefined) {
        return ''
      }
      const strValue = String(value)
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return strValue
    })
  })

  // 组合 CSV 内容（使用 BOM 头以支持中文）
  const BOM = '\uFEFF'
  const csvContent = BOM + [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

  // 创建 Blob 并下载
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 将数据导出为 Excel 格式（简易版，实际上是带 .xlsx 扩展名的 CSV）
 * 如需真正的 XLSX 格式，请安装 xlsx 库
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: { title: string; dataIndex: string }[],
  filename: string = 'export'
): void {
  // 简易实现：使用 CSV 格式但保存为 .xlsx 扩展名
  // 注意：这不是真正的 Excel 格式，但大多数 Excel 版本可以打开
  exportToCSV(data, columns, filename)
}

/**
 * 通用导出函数 - 自动识别列定义
 * @param data 数据数组
 * @param columnMapping 列映射 { dataIndex: title }
 * @param filename 文件名
 */
export function exportData<T extends Record<string, any>>(
  data: T[],
  columnMapping: Record<string, string>,
  filename: string = 'export'
): void {
  const columns = Object.entries(columnMapping).map(([dataIndex, title]) => ({
    title,
    dataIndex
  }))
  exportToCSV(data, columns, filename)
}

/**
 * 组合式函数 - 用于 Vue 组件中的导出功能
 */
export function useExport() {
  const exportTableToCSV = <T extends Record<string, any>>(
    data: T[],
    columns: { title: string; dataIndex: string }[],
    filename?: string
  ) => {
    exportToCSV(data, columns, filename)
  }

  const exportWithMapping = <T extends Record<string, any>>(
    data: T[],
    columnMapping: Record<string, string>,
    filename?: string
  ) => {
    exportData(data, columnMapping, filename)
  }

  return {
    exportTableToCSV,
    exportWithMapping,
    exportToCSV,
    exportToExcel,
    exportData
  }
}
