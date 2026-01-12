import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface QualityRecord {
  id: string
  inspectionNo: string
  materialName: string
  materialCode: string
  supplierName: string
  batchNo: string
  quantity: number
  status: 'pending' | 'processing' | 'qualified' | 'unqualified