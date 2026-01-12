<template>
  <div class="system-schedule">
    <div class="page-header">
      <h2>系统调度</h2>
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          新建调度任务
        </a-button>
      </a-space>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <a-row :gutter="16">
        <a-col :span="5">
          <a-input 
            v-model:value="searchText" 
            placeholder="搜索任务名称/描述"
            @pressEnter="handleSearch"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="status" placeholder="任务状态" allowClear :options="[
            { value: 'running', label: '运行中' },
            { value: 'stopped', label: '已停止' },
            { value: 'paused', label: '已暂停' },
            { value: 'error', label: '异常' }
          ]" />
        </a-col>
        <a-col :span="4">
          <a-select v-model:value="taskType" placeholder="任务类型" allowClear :options="[
            { value: 'data_sync', label: '数据同步' },
            { value: 'report_generate', label: '报表生成' },
            { value: 'cleanup', label: '数据清理' },
            { value: 'backup', label: '数据备份' },
            { value: 'notification', label: '消息通知' }
          ]" />
        </a-col>
        <a-col :span="5">
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 调度任务列表 -->
    <a-table 
      :columns="columns" 
      :data-source="scheduleTasks" 
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-badge :status="getStatusBadge(record.status)" :text="getStatusText(record.status)" />
        </template>
        <template v-if="column.key === 'cronExpression'">
          <a-tooltip :title="getCronDescription(record.cronExpression)">
            <a-tag color="blue">{{ record.cronExpression }}</a-tag>
          </a-tooltip>
        </template>
        <template v-if="column.key === 'nextRunTime'">
          <span v-if="record.status === 'running'">
            {{ record.nextRunTime }}
          </span>
          <span v-else style="color: #999">-</span>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="handleView(record)">查看</a-button>
            <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
            <a-button 
              type="link" 
              size="small" 
              @click="handleToggleStatus(record)"
              :class="record.status === 'running' ? 'danger-link' : ''"
            >
              {{ record.status === 'running' ? '停止' : '启动' }}
            </a-button>
            <a-popconfirm
              title="确定要删除这个调度任务吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑调度任务模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑调度任务' : '新建调度任务'"
      width="900px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <!-- 基本信息 -->
        <a-divider orientation="left">基本信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="任务名称" name="taskName">
              <a-input v-model:value="formData.taskName" placeholder="请输入任务名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="任务分组" name="taskGroup">
              <a-select v-model:value="formData.taskGroup" placeholder="请选择任务分组" :options="[
                { value: 'system', label: '系统任务' },
                { value: 'business', label: '业务任务' },
                { value: 'data', label: '数据处理' },
                { value: 'report', label: '报表任务' },
                { value: 'maintenance', label: '维护任务' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="任务类型" name="taskType">
              <a-select v-model:value="formData.taskType" placeholder="请选择任务类型" :options="[
                { value: 'data_sync', label: '数据同步' },
                { value: 'report_generate', label: '报表生成' },
                { value: 'cleanup', label: '数据清理' },
                { value: 'backup', label: '数据备份' },
                { value: 'notification', label: '消息通知' },
                { value: 'monitor', label: '监控检查' },
                { value: 'import_export', label: '数据导入导出' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="任务优先级" name="priority">
              <a-select v-model:value="formData.priority" placeholder="请选择优先级" :options="[
                { value: 1, label: '最低 (1)' },
                { value: 3, label: '较低 (3)' },
                { value: 5, label: '普通 (5)' },
                { value: 7, label: '较高 (7)' },
                { value: 9, label: '最高 (9)' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="任务描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="2" placeholder="请输入任务描述" />
        </a-form-item>

        <!-- 调度配置 -->
        <a-divider orientation="left">调度配置</a-divider>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="调度类型" name="scheduleType">
              <a-select v-model:value="formData.scheduleType" placeholder="请选择调度类型" :options="[
                { value: 'cron', label: 'Cron表达式' },
                { value: 'interval', label: '固定间隔' },
                { value: 'once', label: '单次执行' },
                { value: 'manual', label: '手动触发' }
              ]" />
            </a-form-item>
          </a-col>
          <a-col :span="8" v-if="formData.scheduleType === 'cron'">
            <a-form-item label="Cron表达式" name="cronExpression">
              <a-input 
                v-model:value="formData.cronExpression" 
                placeholder="如: 0 0 12 * * ?"
              />
              <div class="cron-help">
                <a-button type="link" size="small" @click="showCronHelper = true">
                  <template #icon><QuestionCircleOutlined /></template>
                  Cron帮助
                </a-button>
                <span class="cron-preview" v-if="cronPreview">{{ cronPreview }}</span>
              </div>
            </a-form-item>
          </a-col>
          <a-col :span="8" v-if="formData.scheduleType === 'interval'">
            <a-form-item label="执行间隔" name="interval">
              <a-input-group compact>
                <a-input-number 
                  v-model:value="formData.intervalValue" 
                  :min="1" 
                  style="width: 60%"
                  placeholder="间隔数值"
                />
                <a-select v-model:value="formData.intervalUnit" style="width: 40%" :options="[
                  { value: 'seconds', label: '秒' },
                  { value: 'minutes', label: '分钟' },
                  { value: 'hours', label: '小时' },
                  { value: 'days', label: '天' }
                ]" />
              </a-input-group>
            </a-form-item>
          </a-col>
          <a-col :span="8" v-if="formData.scheduleType === 'once'">
            <a-form-item label="执行时间" name="executeTime">
              <a-date-picker 
                v-model:value="formData.executeTime" 
                show-time 
                style="width: 100%"
                placeholder="选择执行时间"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="任务状态" name="status">
              <a-select v-model:value="formData.status" placeholder="请选择任务状态" :options="[
                { value: 'running', label: '运行中' },
                { value: 'stopped', label: '已停止' },
                { value: 'paused', label: '已暂停' }
              ]" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 执行配置 -->
        <a-divider orientation="left">执行配置</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="执行类" name="executeClass">
              <a-input v-model:value="formData.executeClass" placeholder="请输入执行类全路径" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="执行方法" name="executeMethod">
              <a-input v-model:value="formData.executeMethod" placeholder="请输入执行方法名" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="任务参数" name="parameters">
          <a-textarea 
              v-model:value="formData.parameters" 
              :rows="3" 
              placeholder='JSON格式的任务参数，如: {"param1":"value1"}'
            />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="超时时间(秒)" name="timeout">
              <a-input-number 
                v-model:value="formData.timeout" 
                :min="0" 
                style="width: 100%" 
                placeholder="0表示无限制"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="重试次数" name="retryCount">
              <a-input-number 
                v-model:value="formData.retryCount" 
                :min="0" 
                style="width: 100%" 
                placeholder="失败重试次数"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="并发执行" name="concurrent">
              <a-switch 
                v-model:checked="formData.concurrent" 
                checked-children="允许" 
                un-checked-children="禁止"
              />
              <div style="margin-top: 4px; color: #999; font-size: 12px;">
                是否允许同一任务并发执行
              </div>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 通知配置 -->
        <a-divider orientation="left">通知配置</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="成功通知" name="successNotification">
              <a-select v-model:value="formData.successNotification" placeholder="请选择通知方式">
                <a-select-option value="none">不通知</a-select-option>
                <a-select-option value="email">邮件通知</a-select-option>
                <a-select-option value="sms">短信通知</a-select-option>
                <a-select-option value="webhook">Webhook通知</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="失败通知" name="failureNotification">
              <a-select v-model:value="formData.failureNotification" placeholder="请选择通知方式">
                <a-select-option value="none">不通知</a-select-option>
                <a-select-option value="email">邮件通知</a-select-option>
                <a-select-option value="sms">短信通知</a-select-option>
                <a-select-option value="webhook">Webhook通知</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="通知接收人" name="notificationRecipients" v-if="formData.successNotification !== 'none' || formData.failureNotification !== 'none'">
          <a-select
            v-model:value="formData.notificationRecipients"
            mode="multiple"
            placeholder="请选择通知接收人"
            style="width: 100%"
          >
            <a-select-option value="admin@company.com">系统管理员</a-select-option>
            <a-select-option value="dev@company.com">开发团队</a-select-option>
            <a-select-option value="ops@company.com">运维团队</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Cron表达式帮助模态框 -->
    <a-modal
      v-model:open="showCronHelper"
      title="Cron表达式帮助"
      width="700px"
      :footer="null"
    >
      <a-table :columns="cronColumns" :data-source="cronExamples" :pagination="false" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'expression'">
            <a-tag color="blue" @click="selectCronExpression(record.expression)">{{ record.expression }}</a-tag>
          </template>
        </template>
      </a-table>
    </a-modal>

    <!-- 查看详情模态框 -->
    <a-modal
      v-model:open="viewModalVisible"
      title="调度任务详情"
      width="800px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="任务ID">{{ viewData.id }}</a-descriptions-item>
        <a-descriptions-item label="任务名称">{{ viewData.taskName }}</a-descriptions-item>
        <a-descriptions-item label="任务类型">{{ getTaskTypeText(viewData.taskType) }}</a-descriptions-item>
        <a-descriptions-item label="任务状态">
          <a-badge :status="getStatusBadge(viewData.status)" :text="getStatusText(viewData.status)" />
        </a-descriptions-item>
        <a-descriptions-item label="Cron表达式">{{ viewData.cronExpression }}</a-descriptions-item>
        <a-descriptions-item label="下次执行时间">{{ viewData.nextRunTime || '-' }}</a-descriptions-item>
        <a-descriptions-item label="执行类">{{ viewData.executeClass }}</a-descriptions-item>
        <a-descriptions-item label="执行方法">{{ viewData.executeMethod }}</a-descriptions-item>
        <a-descriptions-item label="超时时间">{{ viewData.timeout || 0 }}秒</a-descriptions-item>
        <a-descriptions-item label="重试次数">{{ viewData.retryCount }}次</a-descriptions-item>
        <a-descriptions-item label="优先级">{{ viewData.priority }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ viewData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ viewData.updateTime }}</a-descriptions-item>
        <a-descriptions-item label="最后执行时间">{{ viewData.lastRunTime || '-' }}</a-descriptions-item>
        <a-descriptions-item label="任务描述" :span="2">{{ viewData.description || '-' }}</a-descriptions-item>
        <a-descriptions-item label="任务参数" :span="2" v-if="viewData.parameters">
          <pre>{{ viewData.parameters }}</pre>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons-vue'

// 响应式数据
const searchText = ref('')
const status = ref()
const taskType = ref()
const taskGroup = ref('')
const scheduleType = ref('')
const loading = ref(false)
const modalVisible = ref(false)
const viewModalVisible = ref(false)
const showCronHelper = ref(false)
const cronPreview = ref('')
const isEdit = ref(false)
const formRef = ref()
const viewData = ref({})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
})

// Cron表达式示例数据
const cronColumns = [
  { title: '表达式', dataIndex: 'expression', key: 'expression', width: 150 },
  { title: '说明', dataIndex: 'description', key: 'description' },
  { title: '执行时间', dataIndex: 'example', key: 'example' }
]

const cronExamples = [
  { expression: '0 0 12 * * ?', description: '每天中午12点执行', example: '12:00:00' },
  { expression: '0 15 10 ? * *', description: '每天上午10:15执行', example: '10:15:00' },
  { expression: '0 15 10 * * ?', description: '每天上午10:15执行', example: '10:15:00' },
  { expression: '0 15 10 * * ? *', description: '每天上午10:15执行', example: '10:15:00' },
  { expression: '0 15 10 * * ? 2005', description: '2005年每天上午10:15执行', example: '10:15:00' },
  { expression: '0 * 14 * * ?', description: '每天下午2点到2:59期间的每1分钟执行', example: '14:00:00-14:59:00' },
  { expression: '0 0/5 14 * * ?', description: '每天下午2点到2:55期间的每5分钟执行', example: '14:00,14:05...' },
  { expression: '0 0/5 14,18 * * ?', description: '每天下午2点到2:55期间和下午6点到6:55期间的每5分钟执行', example: '14:00,14:05...' },
  { expression: '0 0-5 14 * * ?', description: '每天下午2点到下午2:05期间的每1分钟执行', example: '14:00-14:05' },
  { expression: '0 10,44 14 ? 3 WED', description: '三月的星期三的下午2:10和2:44执行', example: '周三 14:10,14:44' },
  { expression: '0 15 10 ? * MON-FRI', description: '周一至周五的上午10:15执行', example: '工作日 10:15' },
  { expression: '0 15 10 15 * ?', description: '每月15日上午10:15执行', example: '每月15日 10:15' },
  { expression: '0 15 10 L * ?', description: '每月最后一日的上午10:15执行', example: '月末 10:15' },
  { expression: '0 15 10 ? * 6L', description: '每月的最后一个星期五上午10:15执行', example: '最后一个周五 10:15' },
  { expression: '0 15 10 ? * 6L 2002-2005', description: '2002年至2005年的每月的最后一个星期五上午10:15执行', example: '最后一个周五 10:15' },
  { expression: '0 15 10 ? * 6#3', description: '每月的第三个星期五上午10:15执行', example: '第三个周五 10:15' },
  { expression: '0 0 2 1 * ?', description: '每月1号凌晨2点执行', example: '每月1日 02:00' },
  { expression: '0 0 2 * * MON', description: '每周一凌晨2点执行', example: '周一 02:00' },
  { expression: '0 0 2 * * 1', description: '每周一凌晨2点执行（等同于MON）', example: '周一 02:00' },
  { expression: '0 0,30 14-16 ? * 1', description: '每周一下午2点、2:30、3点、3:30、4点、4:30执行', example: '周一 14:00,14:30...' },
  { expression: '0 0/30 * * * ?', description: '每30分钟执行一次', example: '每30分钟' },
  { expression: '0 0 */2 * * ?', description: '每2小时执行一次', example: '每2小时' },
  { expression: '0 0 8-18 * * ?', description: '每天上午8点到下午6点每小时执行', example: '08:00-18:00' }
]

// 表格列配置
const columns = [
  {
    title: '任务ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
    fixed: 'left'
  },
  {
    title: '任务名称',
    dataIndex: 'taskName',
    key: 'taskName',
    width: 180,
    ellipsis: true
  },
  {
    title: '任务类型',
    dataIndex: 'taskType',
    key: 'taskType',
    width: 120
  },
  {
    title: '调度配置',
    key: 'schedule',
    width: 200,
    customRender: ({ record }) => {
      const scheduleType = record.scheduleType || 'cron'
      if (scheduleType === 'cron') {
        return record.cronExpression
      } else if (scheduleType === 'interval') {
        return `每${record.intervalValue || ''}${record.intervalUnit || ''}`
      } else if (scheduleType === 'once') {
        return record.executeTime || '单次执行'
      }
      return '手动触发'
    }
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    width: 80,
    align: 'center'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center'
  },
  {
    title: '执行信息',
    key: 'execution',
    width: 150,
    customRender: ({ record }) => {
      return `${record.executionCount || 0}次执行`
    }
  },
  {
    title: '最近执行',
    dataIndex: 'lastRunTime',
    key: 'lastRunTime',
    width: 150,
    customRender: ({ text }) => text || '从未执行'
  },
  {
    title: '下次执行',
    dataIndex: 'nextRunTime',
    key: 'nextRunTime',
    width: 150,
    customRender: ({ text }) => text || '-'
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    width: 240,
    fixed: 'right'
  }
]

// 表单数据
const formData = reactive({
  taskName: '',
  taskGroup: '',
  taskType: '',
  description: '',
  scheduleType: 'cron',
  cronExpression: '',
  intervalValue: 5,
  intervalUnit: 'minutes',
  executeTime: null,
  status: 'stopped',
  executeClass: '',
  executeMethod: '',
  parameters: '',
  timeout: 0,
  retryCount: 3,
  priority: 5,
  concurrent: false,
  successNotification: 'none',
  failureNotification: 'email',
  notificationRecipients: []
})

// 表单验证规则
const formRules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  taskGroup: [
    { required: true, message: '请选择任务分组', trigger: 'change' }
  ],
  taskType: [
    { required: true, message: '请选择任务类型', trigger: 'change' }
  ],
  scheduleType: [
    { required: true, message: '请选择调度类型', trigger: 'change' }
  ],
  cronExpression: [
    { 
      validator: (rule, value) => {
        if (formData.scheduleType === 'cron' && !value) {
          return Promise.reject('请输入Cron表达式')
        }
        return Promise.resolve()
      }, 
      trigger: 'blur' 
    }
  ],
  interval: [
    { 
      validator: (rule, value) => {
        if (formData.scheduleType === 'interval' && (!formData.intervalValue || !formData.intervalUnit)) {
          return Promise.reject('请设置执行间隔')
        }
        return Promise.resolve()
      }, 
      trigger: 'change' 
    }
  ],
  executeTime: [
    { 
      validator: (rule, value) => {
        if (formData.scheduleType === 'once' && !value) {
          return Promise.reject('请选择执行时间')
        }
        return Promise.resolve()
      }, 
      trigger: 'change' 
    }
  ],
  status: [
    { required: true, message: '请选择任务状态', trigger: 'change' }
  ],
  executeClass: [
    { required: true, message: '请输入执行类', trigger: 'blur' }
  ],
  executeMethod: [
    { required: true, message: '请输入执行方法', trigger: 'blur' }
  ],
  parameters: [
    { 
      validator: (rule, value) => {
        if (value) {
          try {
            JSON.parse(value)
            return Promise.resolve()
          } catch (e) {
            return Promise.reject('任务参数必须是有效的JSON格式')
          }
        }
        return Promise.resolve()
      }, 
      trigger: 'blur' 
    }
  ],
  timeout: [
    { type: 'number', min: 0, message: '超时时间必须大于等于0', trigger: 'blur' }
  ],
  retryCount: [
    { type: 'number', min: 0, message: '重试次数必须大于等于0', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  notificationRecipients: [
    { 
      validator: (rule, value) => {
        if ((formData.successNotification !== 'none' || formData.failureNotification !== 'none') && (!value || value.length === 0)) {
          return Promise.reject('请选择通知接收人')
        }
        return Promise.resolve()
      }, 
      trigger: 'change' 
    }
  ]
}

// 模拟调度任务数据
const scheduleTasks = ref([
  {
    id: 1001,
    taskName: '每日数据同步',
    taskGroup: 'data',
    taskType: 'data_sync',
    status: 'running',
    scheduleType: 'cron',
    cronExpression: '0 0 2 * * ?',
    intervalValue: null,
    intervalUnit: null,
    executeTime: null,
    nextRunTime: '2024-01-16 02:00:00',
    lastRunTime: '2024-01-15 02:00:00',
    executeClass: 'com.qms.task.DataSyncTask',
    executeMethod: 'execute',
    parameters: '{"syncType":"full","targetDb":"mysql"}',
    timeout: 3600,
    retryCount: 3,
    priority: 8,
    concurrent: false,
    successNotification: 'email',
    failureNotification: 'email',
    notificationRecipients: ['admin@company.com', 'dev@company.com'],
    description: '每天凌晨2点执行全量数据同步',
    createTime: '2024-01-10 10:00:00',
    updateTime: '2024-01-15 02:00:00'
  },
  {
    id: 1002,
    taskName: '周报表生成',
    taskGroup: 'report',
    taskType: 'report_generate',
    status: 'running',
    scheduleType: 'cron',
    cronExpression: '0 0 8 ? * MON',
    intervalValue: null,
    intervalUnit: null,
    executeTime: null,
    nextRunTime: '2024-01-22 08:00:00',
    lastRunTime: '2024-01-15 08:00:00',
    executeClass: 'com.qms.task.ReportGenerateTask',
    executeMethod: 'generateWeeklyReport',
    parameters: '{"reportType":"weekly","email":"admin@company.com"}',
    timeout: 1800,
    retryCount: 2,
    priority: 6,
    concurrent: false,
    successNotification: 'email',
    failureNotification: 'webhook',
    notificationRecipients: ['admin@company.com'],
    description: '每周一早上8点生成周报表并发送邮件',
    createTime: '2024-01-08 14:30:00',
    updateTime: '2024-01-15 08:00:00'
  },
  {
    id: 1003,
    taskName: '日志清理任务',
    taskGroup: 'maintenance',
    taskType: 'cleanup',
    status: 'stopped',
    scheduleType: 'cron',
    cronExpression: '0 0 3 1 * ?',
    intervalValue: null,
    intervalUnit: null,
    executeTime: null,
    nextRunTime: null,
    lastRunTime: '2024-01-01 03:00:00',
    executeClass: 'com.qms.task.LogCleanupTask',
    executeMethod: 'cleanup',
    parameters: '{"retentionDays":30,"logTypes":["app","api","system"]}',
    timeout: 1200,
    retryCount: 1,
    priority: 4,
    concurrent: false,
    successNotification: 'none',
    failureNotification: 'email',
    notificationRecipients: ['ops@company.com'],
    description: '每月1号凌晨3点清理30天前的日志文件',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00'
  },
  {
    id: 1004,
    taskName: '实时监控检查',
    taskGroup: 'monitor',
    taskType: 'monitor',
    status: 'running',
    scheduleType: 'interval',
    cronExpression: null,
    intervalValue: 5,
    intervalUnit: 'minutes',
    executeTime: null,
    nextRunTime: '2024-01-15 14:30:00',
    lastRunTime: '2024-01-15 14:25:00',
    executeClass: 'com.qms.task.HealthCheckTask',
    executeMethod: 'check',
    parameters: '{"checks":["cpu","memory","disk","network"]}',
    timeout: 300,
    retryCount: 0,
    priority: 9,
    concurrent: false,
    successNotification: 'none',
    failureNotification: 'sms',
    notificationRecipients: ['ops@company.com'],
    description: '每5分钟检查系统健康状态',
    createTime: '2024-01-01 09:15:00',
    updateTime: '2024-01-15 14:25:00'
  },
  {
    id: 1005,
    taskName: '数据备份任务',
    taskGroup: 'system',
    taskType: 'backup',
    status: 'paused',
    scheduleType: 'cron',
    cronExpression: '0 30 4 * * ?',
    intervalValue: null,
    intervalUnit: null,
    executeTime: null,
    nextRunTime: null,
    lastRunTime: '2024-01-14 04:30:00',
    executeClass: 'com.qms.task.DataBackupTask',
    executeMethod: 'backup',
    parameters: '{"backupType":"full","compress":true,"encrypt":true}',
    timeout: 7200,
    retryCount: 2,
    priority: 9,
    concurrent: false,
    successNotification: 'email',
    failureNotification: 'email',
    notificationRecipients: ['admin@company.com', 'backup@company.com'],
    description: '每天凌晨4:30执行数据备份',
    createTime: '2024-01-05 16:20:00',
    updateTime: '2024-01-14 04:30:00'
  },
  {
    id: 1006,
    taskName: '月度统计报告',
    taskGroup: 'report',
    taskType: 'import_export',
    status: 'running',
    scheduleType: 'cron',
    cronExpression: '0 0 6 5 * ?',
    intervalValue: null,
    intervalUnit: null,
    executeTime: null,
    nextRunTime: '2024-02-05 06:00:00',
    lastRunTime: '2024-01-05 06:00:00',
    executeClass: 'com.qms.task.MonthlyExportTask',
    executeMethod: 'exportStatistics',
    parameters: '{"format":"excel","includeCharts":true}',
    timeout: 3600,
    retryCount: 3,
    priority: 5,
    concurrent: false,
    successNotification: 'email',
    failureNotification: 'webhook',
    notificationRecipients: ['admin@company.com'],
    description: '每月5号导出上月统计数据',
    createTime: '2024-01-01 13:00:00',
    updateTime: '2024-01-05 06:00:00'
  }
])

// 方法
const handleSearch = () => {
  pagination.current = 1
  fetchScheduleTasks()
}

const handleReset = () => {
  searchText.value = ''
  status.value = undefined
  taskType.value = undefined
  handleSearch()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchScheduleTasks()
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  modalVisible.value = true
}

const handleEdit = (record: any) => {
  isEdit.value = true
  Object.assign(formData, record)
  modalVisible.value = true
}

const handleView = (record: any) => {
  viewData.value = record
  viewModalVisible.value = true
}

const handleDelete = (id: number) => {
  const index = scheduleTasks.value.findIndex(item => item.id === id)
  if (index > -1) {
    scheduleTasks.value.splice(index, 1)
    message.success('删除成功')
    fetchScheduleTasks()
  }
}

const handleToggleStatus = (record: any) => {
  const index = scheduleTasks.value.findIndex(item => item.id === record.id)
  if (index > -1) {
    const newStatus = record.status === 'running' ? 'stopped' : 'running'
    scheduleTasks.value[index].status = newStatus
    scheduleTasks.value[index].nextRunTime = newStatus === 'running' ? '2024-01-16 02:00:00' : null
    message.success(`${newStatus === 'running' ? '启动' : '停止'}成功`)
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      const index = scheduleTasks.value.findIndex(item => item.id === formData.id)
      if (index > -1) {
        scheduleTasks.value[index] = { ...formData }
        message.success('更新成功')
      }
    } else {
      const newTask = {
        ...formData,
        id: Date.now(),
        nextRunTime: formData.status === 'running' ? '2024-01-16 02:00:00' : null,
        lastRunTime: null,
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
      }
      scheduleTasks.value.unshift(newTask)
      message.success('创建成功')
    }
    
    modalVisible.value = false
    fetchScheduleTasks()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

const fetchScheduleTasks = () => {
  loading.value = true
  setTimeout(() => {
    pagination.total = scheduleTasks.value.length
    loading.value = false
  }, 500)
}

const resetForm = () => {
  Object.assign(formData, {
    taskName: '',
    taskType: '',
    description: '',
    cronExpression: '',
    status: 'stopped',
    executeClass: '',
    executeMethod: '',
    parameters: '',
    timeout: 0,
    retryCount: 3,
    priority: 5
  })
  formRef.value?.resetFields()
}

// 辅助方法
const getStatusBadge = (status: string) => {
  const badges = {
    running: 'processing',
    stopped: 'default',
    paused: 'warning',
    error: 'error'
  }
  return badges[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts = {
    running: '运行中',
    stopped: '已停止',
    paused: '已暂停',
    error: '异常'
  }
  return texts[status] || status
}

const getTaskTypeText = (type: string) => {
  const types = {
    data_sync: '数据同步',
    report_generate: '报表生成',
    cleanup: '数据清理',
    backup: '数据备份',
    notification: '消息通知'
  }
  return types[type] || type
}

const getTaskGroupLabel = (group: string) => {
  const groupMap = {
    system: '系统任务',
    business: '业务任务',
    data: '数据处理',
    report: '报表任务',
    maintenance: '维护任务'
  }
  return groupMap[group] || group
}

const getScheduleTypeLabel = (type: string) => {
  const typeMap = {
    cron: 'Cron表达式',
    interval: '固定间隔',
    once: '单次执行',
    manual: '手动触发'
  }
  return typeMap[type] || type
}

const getIntervalUnitLabel = (unit: string) => {
  const unitMap = {
    seconds: '秒',
    minutes: '分钟',
    hours: '小时',
    days: '天'
  }
  return unitMap[unit] || unit
}

const getCronDescription = (cron: string) => {
  const descriptions = {
    '0 0 2 * * ?': '每天凌晨2点执行',
    '0 0 8 ? * MON': '每周一早上8点执行',
    '0 0 3 1 * ?': '每月1号凌晨3点执行',
    '0 30 4 * * ?': '每天凌晨4:30执行'
  }
  return descriptions[cron] || '自定义执行时间'
}

const selectCronExpression = (expression: string) => {
  formData.cronExpression = expression
  showCronHelper.value = false
  updateCronPreview()
}

const updateCronPreview = () => {
  if (formData.cronExpression) {
    cronPreview.value = getCronDescription(formData.cronExpression)
  } else {
    cronPreview.value = ''
  }
}

onMounted(() => {
  fetchScheduleTasks()
})
</script>

<style scoped>
.schedule-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.search-form {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.task-name-cell {
  .task-name {
    font-weight: 500;
    color: #262626;
    margin-bottom: 2px;
  }
  
  .task-group {
    font-size: 12px;
    color: #8c8c8c;
  }
}

.schedule-cell {
  .schedule-type {
    font-size: 12px;
    color: #1890ff;
    margin-bottom: 2px;
  }
  
  .schedule-detail {
    font-size: 12px;
    color: #595959;
    font-family: 'Courier New', monospace;
  }
}

.execution-cell {
  .execution-stat {
    font-size: 12px;
    color: #595959;
    margin-bottom: 1px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.last-execution {
  .execution-time {
    font-size: 12px;
    color: #262626;
    margin-bottom: 2px;
  }
  
  .execution-result {
    font-size: 11px;
    
    &.success {
      color: #52c41a;
    }
    
    &.failed {
      color: #ff4d4f;
    }
    
    &.running {
      color: #1890ff;
    }
    
    &.timeout {
      color: #fa8c16;
    }
  }
}

.next-execution {
  .next-time {
    font-size: 12px;
    color: #262626;
    margin-bottom: 2px;
  }
  
  .time-diff {
    font-size: 11px;
    
    &.soon {
      color: #ff4d4f;
    }
    
    &.today {
      color: #fa8c16;
    }
    
    &.future {
      color: #52c41a;
    }
  }
}

.no-execution {
  font-size: 12px;
  color: #bfbfbf;
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.cron-help {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  
  .cron-preview {
    font-size: 12px;
    color: #52c41a;
    font-style: italic;
  }
}

:deep(.ant-table) {
  .ant-table-thead > tr > th {
    background: #fafafa;
    font-weight: 600;
  }
  
  .ant-table-tbody > tr:hover > td {
    background: #f5f5f5;
  }
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}

:deep(.ant-divider) {
  margin: 16px 0 8px 0;
  
  &.ant-divider-with-text {
    .ant-divider-inner-text {
      font-weight: 600;
      color: #262626;
    }
  }
}

:deep(.ant-modal) {
  .ant-modal-body {
    max-height: 70vh;
    overflow-y: auto;
  }
}

:deep(.ant-tag) {
  margin: 0;
}

:deep(.ant-btn-link) {
  padding: 0 4px;
  height: auto;
  line-height: 1.2;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .schedule-page {
    padding: 16px;
  }
  
  .search-form {
    padding: 16px;
  }
  
  .page-actions {
    flex-direction: column;
    
    .ant-btn {
      width: 100%;
    }
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: flex-start;
    
    .ant-btn {
      width: 100%;
      text-align: left;
    }
  }
}

/* 动画效果 */
.table-container {
  transition: all 0.3s ease;
}

:deep(.ant-table-tbody > tr) {
  transition: all 0.2s ease;
}

:deep(.ant-btn) {
  transition: all 0.2s ease;
}

:deep(.ant-modal) {
  .ant-modal-content {
    transition: all 0.3s ease;
  }
}

/* 滚动条样式 */
:deep(.ant-modal-body)::-webkit-scrollbar {
  width: 6px;
}

:deep(.ant-modal-body)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

:deep(.ant-modal-body)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

:deep(.ant-modal-body)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>