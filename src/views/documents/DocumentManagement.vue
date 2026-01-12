<template>
  <div class="document-management">
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索文档名称、编号"
          style="width: 300px; margin-right: 16px;"
          @search="handleSearch"
        />
        <a-select v-model:value="categoryFilter" placeholder="分类筛选" style="width: 120px; margin-right: 16px;">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="manual">操作手册</a-select-option>
          <a-select-option value="procedure">程序文件</a-select-option>
          <a-select-option value="standard">标准规范</a-select-option>
          <a-select-option value="record">记录表单</a-select-option>
        </a-select>
        <a-select v-model:value="statusFilter" placeholder="状态筛选" style="width: 120px;">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="active">有效</a-select-option>
          <a-select-option value="obsolete">作废</a-select-option>
        </a-select>
      </div>
      <div>
        <a-upload :file-list="fileList" :before-upload="beforeUpload" @change="handleUploadChange">
          <a-button>
            <UploadOutlined /> 上传文档
          </a-button>
        </a-upload>
      </div>
    </div>

    <a-table :columns="columns" :data-source="documentData" :pagination="pagination">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'category'">
          <a-tag :color="getCategoryColor(record.category)">{{ getCategoryText(record.category) }}</a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">
            {{ record.status === 'active' ? '有效' : '作废' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="viewDocument(record)">查看</a-button>
          <a-button type="link" size="small" @click="downloadDocument(record)">下载</a-button>
          <a-button type="link" size="small" @click="editDocument(record)">编辑</a-button>
          <a-button type="link" size="small" @click="versionHistory(record)">版本历史</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import type { UploadFile, UploadProps } from 'ant-design-vue'

const searchText = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const fileList = ref<UploadFile[]>([])

const columns = [
  { title: '文档编号', dataIndex: 'docNo', key: 'docNo' },
  { title: '文档名称', dataIndex: 'docName', key: 'docName' },
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '分类', dataIndex: 'category', key: 'category' },
  { title: '文件大小', dataIndex: 'fileSize', key: 'fileSize' },
  { title: '上传人', dataIndex: 'uploader', key: 'uploader' },
  { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' }
]

const documentData = ref([
  {
    key: '1',
    docNo: 'QM-MAN-001',
    docName: '质量手册',
    version: 'V2.1',
    category: 'manual',
    fileSize: '2.5MB',
    uploader: '张三',
    uploadTime: '2023-11-14 09:30',
    status: 'active'
  },
  {
    key: '2',
    docNo: 'QM-PRO-002',
    docName: 'IQC检验程序',
    version: 'V1.5',
    category: 'procedure',
    fileSize: '1.2MB',
    uploader: '李四',
    uploadTime: '2023-11-13 14:20',
    status: 'active'
  },
  {
    key: '3',
    docNo: 'QM-STD-003',
    docName: '汽车零配件检验标准',
    version: 'V3.0',
    category: 'standard',
    fileSize: '3.8MB',
    uploader: '王五',
    uploadTime: '2023-11-12 10:15',
    status: 'active'
  },
  {
    key: '4',
    docNo: 'QM-REC-004',
    docName: '检验记录表',
    version: 'V1.0',
    category: 'record',
    fileSize: '156KB',
    uploader: '赵六',
    uploadTime: '2023-11-11 16:45',
    status: 'obsolete'
  }
])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 4,
  showSizeChanger: true,
  showQuickJumper: true
})

const handleSearch = () => {
  console.log('搜索文档:', searchText.value)
}

const getCategoryColor = (category: string) => {
  const colors = {
    manual: 'blue',
    procedure: 'green',
    standard: 'orange',
    record: 'purple'
  }
  return colors[category] || 'default'
}

const getCategoryText = (category: string) => {
  const texts = {
    manual: '操作手册',
    procedure: '程序文件',
    standard: '标准规范',
    record: '记录表单'
  }
  return texts[category] || category
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    console.error('文件大小不能超过10MB!')
  }
  return false
}

const handleUploadChange = (info: any) => {
  console.log('上传状态:', info)
}

const viewDocument = (record: any) => {
  console.log('查看文档:', record)
}

const downloadDocument = (record: any) => {
  console.log('下载文档:', record)
}

const editDocument = (record: any) => {
  console.log('编辑文档:', record)
}

const versionHistory = (record: any) => {
  console.log('版本历史:', record)
}
</script>

<style scoped>
.document-management {
  padding: 24px;
  background: #fff;
}
</style>