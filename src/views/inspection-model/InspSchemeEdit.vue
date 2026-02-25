<template>
  <div class="scheme-edit-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <a-button type="text" @click="handleBack" class="back-btn">
          <template #icon><ArrowLeftOutlined /></template>
          返回
        </a-button>
        <div class="title-block">
          <h2 class="page-title">{{ pageTitle }}</h2>
          <a-tag v-if="form.version" color="blue">{{ form.version }}</a-tag>
          <a-tag :color="statusColor(form.status)">{{ statusText(form.status) }}</a-tag>
          <!-- 组织归属标识 -->
          <a-tag v-if="form.orgId === null" color="gold">集团方案</a-tag>
          <a-tag v-else color="cyan">本地方案</a-tag>
          <a-tag v-if="form.sourceTemplateName" color="purple">
            <template #icon><CopyOutlined /></template>
            源自: {{ form.sourceTemplateName }}
          </a-tag>
        </div>
      </div>
      <a-space v-if="!isView && !isReadOnly">
        <a-button @click="handleSave" :loading="saving">保存草稿</a-button>
        <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
      </a-space>
    </div>

    <!-- 集团方案只读提示 -->
    <a-alert
      v-if="isReadOnly"
      type="warning"
      show-icon
      message="集团级方案对工厂用户只读，如需修改请联系集团管理员，或基于此方案创建一个新的本地方案。"
      style="margin-bottom:16px"
    />

    <!-- 基本信息卡片 -->
    <a-card class="info-card" title="基本信息">
      <a-form ref="formRef" :model="form" :rules="rules" layout="horizontal"
        :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-row :gutter="24">
          <a-col :span="8">
            <a-form-item label="方案编码" name="schemeCode">
              <a-input v-model:value="form.schemeCode" :disabled="isView || isEdit || isReadOnly" placeholder="如: SCH-IQC-001" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="方案名称" name="schemeName">
              <a-input v-model:value="form.schemeName" :disabled="isView || isReadOnly" placeholder="请输入方案名称" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="版本" name="version">
              <a-input v-model:value="form.version" :disabled="isView || isReadOnly" placeholder="如: V1.0" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="8">
            <a-form-item label="检验类型" name="inspType">
              <a-select v-model:value="form.inspType" :disabled="isView || isReadOnly" placeholder="请选择">
                <a-select-option value="IQC">IQC 来料检验</a-select-option>
                <a-select-option value="IPQC">IPQC 过程检验</a-select-option>
                <a-select-option value="FQC">FQC 成品检验</a-select-option>
                <a-select-option value="OQC">OQC 出货检验</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="引用模板">
              <a-select
                v-model:value="selectedTemplateId"
                :disabled="isView || isReadOnly || details.length > 0"
                placeholder="选择模板可自动带出检验项目"
                allow-clear
                @change="handleTemplateChange"
              >
                <a-select-option v-for="t in templateOptions" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.version }})
                </a-select-option>
              </a-select>
              <div class="field-hint" v-if="details.length > 0 && !isView">
                <InfoCircleOutlined /> 已有明细，需清空后才能重新引用模板
              </div>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态">
              <a-tag :color="statusColor(form.status)">{{ statusText(form.status) }}</a-tag>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="16">
            <a-form-item label="描述" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-textarea v-model:value="form.description" :disabled="isView || isReadOnly" :rows="2" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- Tab 区域 -->
    <a-card class="tab-card">
      <a-tabs v-model:activeKey="activeTab">

        <!-- ① 检验项目明细 -->
        <a-tab-pane key="details">
          <template #tab>
            <span>
              检验项目明细
              <a-badge :count="details.length" :offset="[6,-2]" color="#1890ff" />
            </span>
          </template>

          <div class="tab-toolbar" v-if="!isView && !isReadOnly">
            <a-space>
              <a-button type="primary" size="small" @click="handleAddDetail">
                <template #icon><PlusOutlined /></template>新增检验项目
              </a-button>
              <a-button size="small" danger @click="handleClearDetails" v-if="details.length > 0">
                <template #icon><DeleteOutlined /></template>清空所有
              </a-button>
              <a-tooltip title="明细行来自模板时标记蓝色，新增行为绿色">
                <QuestionCircleOutlined style="cursor:pointer;color:#8c8c8c" />
              </a-tooltip>
            </a-space>
          </div>

          <a-table
            :columns="detailColumns"
            :data-source="details"
            row-key="id"
            size="small"
            :pagination="false"
            :row-class-name="(r:any) => r.fromTemplate ? 'row-from-template' : 'row-custom'"
          >
            <template #bodyCell="{ column, record, index }">
              <!-- 序号 -->
              <template v-if="column.key === 'sortOrder'">
                <span class="sort-badge">{{ index + 1 }}</span>
              </template>

              <!-- 检验项目（行内选择） -->
              <template v-if="column.key === 'inspItemName'">
                <template v-if="!isView && record._editing">
                  <a-select
                    v-model:value="record.inspItemId"
                    size="small" style="width:160px"
                    @change="(v:string) => onItemSelect(record, v)"
                  >
                    <a-select-option v-for="item in itemOptions" :key="item.id" :value="item.id">
                      {{ item.name }}
                    </a-select-option>
                  </a-select>
                </template>
                <template v-else>
                  <a-tooltip :title="record.fromTemplate ? '来自模板' : '自定义添加'">
                    <a-tag :color="record.fromTemplate ? 'blue' : 'green'" style="margin:0">
                      {{ record.inspItemName }}
                    </a-tag>
                  </a-tooltip>
                </template>
              </template>

              <!-- 特性分类 -->
              <template v-if="column.key === 'characteristicClass'">
                <template v-if="!isView && record._editing">
                  <a-select v-model:value="record.characteristicClass" size="small" style="width:90px">
                    <a-select-option value="SC">SC-特殊</a-select-option>
                    <a-select-option value="CC">CC-关键</a-select-option>
                    <a-select-option value="Major">主要</a-select-option>
                    <a-select-option value="Minor">次要</a-select-option>
                  </a-select>
                </template>
                <template v-else>
                  <a-tag :color="classColor(record.characteristicClass)">{{ record.characteristicClass }}</a-tag>
                </template>
              </template>

              <!-- 抽样规则 -->
              <template v-if="column.key === 'samplingRuleName'">
                <template v-if="!isView && record._editing">
                  <a-select v-model:value="record.samplingRuleCode" size="small" style="width:160px"
                    @change="(v:string) => record.samplingRuleName = samplingRules.find(r=>r.code===v)?.name || v">
                    <a-select-option v-for="r in samplingRules" :key="r.code" :value="r.code">{{ r.name }}</a-select-option>
                  </a-select>
                </template>
                <template v-else>{{ record.samplingRuleName || record.samplingRuleCode }}</template>
              </template>

              <!-- 检验方法 -->
              <template v-if="column.key === 'inspMethodName'">
                <template v-if="!isView && record._editing">
                  <a-select v-model:value="record.inspMethodId" size="small" style="width:130px" allow-clear
                    @change="(v:string) => record.inspMethodName = methodOptions.find(m=>m.id===v)?.name || ''">
                    <a-select-option v-for="m in methodOptions" :key="m.id" :value="m.id">{{ m.name }}</a-select-option>
                  </a-select>
                </template>
                <template v-else>{{ record.inspMethodName || '-' }}</template>
              </template>

              <!-- SPC 开关 -->
              <template v-if="column.key === 'spcEnabled'">
                <a-switch v-model:checked="record.spcEnabled" :disabled="isView || isReadOnly" size="small" />
              </template>

              <!-- 实验室 -->
              <template v-if="column.key === 'labRequired'">
                <a-switch v-model:checked="record.labRequired" :disabled="isView || isReadOnly" size="small" />
              </template>

              <!-- 操作 -->
              <template v-if="column.key === 'action'">
                <a-space v-if="!isView && !isReadOnly">
                  <template v-if="record._editing">
                    <a-button type="link" size="small" @click="record._editing = false">完成</a-button>
                  </template>
                  <template v-else>
                    <a-button type="link" size="small" @click="record._editing = true">编辑</a-button>
                  </template>
                  <a-button type="link" danger size="small" @click="handleRemoveDetail(record)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- ② 绑定策略 -->
        <a-tab-pane key="strategies">
          <template #tab>
            <span>
              适用策略 (上下文绑定)
              <a-badge :count="strategies.length" :offset="[6,-2]" color="#52c41a" />
            </span>
          </template>

          <div class="tab-toolbar" v-if="!isView && !isReadOnly">
            <a-space>
              <a-button type="primary" size="small" @click="handleAddStrategy">
                <template #icon><PlusOutlined /></template>新增策略
              </a-button>
              <a-button size="small" @click="showMatchSim = true">
                <template #icon><PlayCircleOutlined /></template>匹配模拟器
              </a-button>
            </a-space>
          </div>

          <a-table
            :columns="strategyColumns"
            :data-source="strategies"
            row-key="id"
            size="small"
            :pagination="false"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'contextType'">
                <a-tag color="blue">{{ record.contextType }}</a-tag>
              </template>
              <template v-if="column.key === 'matchSummary'">
                <a-space wrap>
                  <a-tag v-if="record.matchDimension?.materialName" color="orange">
                    物料: {{ record.matchDimension.materialName }}
                  </a-tag>
                  <a-tag v-if="record.matchDimension?.supplierName" color="red">
                    供应商: {{ record.matchDimension.supplierName }}
                  </a-tag>
                  <a-tag v-if="record.matchDimension?.customerName" color="geekblue">
                    客户: {{ record.matchDimension.customerName }}
                  </a-tag>
                  <a-tag v-if="record.matchDimension?.operationName" color="purple">
                    工序: {{ record.matchDimension.operationName }}
                  </a-tag>
                  <a-tag v-if="record.matchDimension?.ipqcType" color="volcano">
                    IPQC类型: {{ record.matchDimension.ipqcType }}
                  </a-tag>
                  <a-tag v-if="!record.matchDimension?.materialName && !record.matchDimension?.supplierName && !record.matchDimension?.customerName && !record.matchDimension?.operationName" color="default">
                    通用（兜底）
                  </a-tag>
                </a-space>
              </template>
              <template v-if="column.key === 'triggerCondition'">
                <span>{{ triggerConditionText(record.triggerCondition) }}</span>
                <span v-if="record.triggerValue"> (前 {{ record.triggerValue }} 批)</span>
              </template>
              <template v-if="column.key === 'priority'">
                <a-tag :color="record.priority <= 10 ? 'red' : record.priority <= 50 ? 'orange' : 'default'">
                  P{{ record.priority }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-space v-if="!isView && !isReadOnly">
                  <a-button type="link" size="small" @click="openStrategyEdit(record)">编辑</a-button>
                  <a-button type="link" danger size="small" @click="handleRemoveStrategy(record)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- ③ 物料检验规格 -->
        <a-tab-pane key="materialSpec">
          <template #tab>
            <span>物料规格 <a-badge :count="materialSpecs.length" :offset="[6,-2]" color="#722ed1" /></span>
          </template>
          <div class="tab-toolbar" v-if="!isView && !isReadOnly">
            <a-button type="primary" size="small" @click="handleAddSpec">
              <template #icon><PlusOutlined /></template>新增规格
            </a-button>
          </div>
          <a-table :columns="specColumns" :data-source="materialSpecs" row-key="id" size="small" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'dataType'">
                <a-tag :color="record.dataType === 'QUANTITATIVE' ? 'blue' : 'purple'">
                  {{ record.dataType === 'QUANTITATIVE' ? '计量型' : '计数型' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'spec'">
                <span v-if="record.dataType === 'QUANTITATIVE'">
                  {{ record.lowerLimit }} ~ {{ record.upperLimit }} {{ record.uom }}
                  <a-tag color="cyan" style="margin-left:4px">目标: {{ record.targetValue }}</a-tag>
                </span>
                <span v-else>{{ record.standardDesc || record.expectedValue }}</span>
              </template>
              <template v-if="column.key === 'action'">
                <a-space v-if="!isView && !isReadOnly">
                  <a-button type="link" size="small" @click="openSpecEdit(record)">编辑</a-button>
                  <a-button type="link" danger size="small" @click="handleRemoveSpec(record)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- ④ 不良现象绑定 -->
        <a-tab-pane key="phenomenon" tab="不良现象防错配置">
          <div class="tab-toolbar" v-if="!isView && !isReadOnly">
            <a-button type="primary" size="small" @click="handleAddPhenomenon">
              <template #icon><PlusOutlined /></template>新增绑定
            </a-button>
          </div>
          <a-table :columns="phenomenonColumns" :data-source="phenomenonMaps" row-key="id" size="small" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'severity'">
                <a-tag :color="severityColor(record.severity)">{{ record.severity }}</a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" danger size="small" @click="handleRemovePhenomenon(record)" v-if="!isView && !isReadOnly">删除</a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

      </a-tabs>
    </a-card>

    <!-- 策略编辑弹窗 -->
    <a-modal
      v-model:visible="showStrategyModal"
      :title="editingStrategy?.id?.startsWith('new') ? '新增绑定策略' : '编辑绑定策略'"
      width="680px"
      @ok="saveStrategy"
      ok-text="确定"
      cancel-text="取消"
    >
      <a-alert type="info" show-icon style="margin-bottom:16px">
        <template #message>
          策略定义"什么情况下"使用本方案。同一方案可绑定多条策略，优先级越小优先级越高。
        </template>
      </a-alert>
      <a-form v-if="editingStrategy" :model="editingStrategy" :label-col="{span:6}" :wrapper-col="{span:16}">
        <a-form-item label="业务类型" required>
          <a-select v-model:value="editingStrategy.contextType">
            <a-select-option value="IQC">IQC 来料检验</a-select-option>
            <a-select-option value="IPQC">IPQC 过程检验</a-select-option>
            <a-select-option value="FQC">FQC 成品检验</a-select-option>
            <a-select-option value="OQC">OQC 出货检验</a-select-option>
          </a-select>
        </a-form-item>
        <a-divider>匹配维度（不填则通用匹配）</a-divider>
        <a-alert type="warning" show-icon style="margin-bottom:12px">
          <template #message>
            <span v-if="editingStrategy.contextType === 'IQC'">IQC: 可按 <b>物料 + 供应商</b> 匹配</span>
            <span v-else-if="editingStrategy.contextType === 'IPQC'">IPQC: 可按 <b>物料 + 工序 + IPQC类型</b> 匹配</span>
            <span v-else-if="editingStrategy.contextType === 'FQC'">FQC: 内部成品检验，仅按 <b>物料</b> 匹配（无供应商/客户）</span>
            <span v-else-if="editingStrategy.contextType === 'OQC'">OQC: 出货检验，可按 <b>物料 + 客户</b> 匹配（无供应商）</span>
          </template>
        </a-alert>
        <a-form-item label="物料">
          <a-select v-model:value="editingStrategy.matchDimension.materialId" allow-clear placeholder="不限物料"
            @change="(v:string) => editingStrategy!.matchDimension.materialName = materialOptions.find(m=>m.id===v)?.name || ''">
            <a-select-option v-for="m in materialOptions" :key="m.id" :value="m.id">
              {{ m.code }} - {{ m.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="供应商" v-if="editingStrategy.contextType === 'IQC'">
          <a-select v-model:value="editingStrategy.matchDimension.supplierId" allow-clear placeholder="不限供应商"
            @change="(v:string) => editingStrategy!.matchDimension.supplierName = supplierOptions.find(s=>s.id===v)?.name || ''">
            <a-select-option v-for="s in supplierOptions" :key="s.id" :value="s.id">{{ s.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="客户" v-if="editingStrategy.contextType === 'OQC'">
          <a-select v-model:value="editingStrategy.matchDimension.customerId" allow-clear placeholder="不限客户"
            @change="(v:string) => editingStrategy!.matchDimension.customerName = customerOptions.find(c=>c.id===v)?.name || ''">
            <a-select-option v-for="c in customerOptions" :key="c.id" :value="c.id">{{ c.code }} - {{ c.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="工序" v-if="editingStrategy.contextType === 'IPQC'">
          <a-select v-model:value="editingStrategy.matchDimension.operationNo" allow-clear placeholder="不限工序"
            @change="(v:string) => editingStrategy!.matchDimension.operationName = operationOptions.find(o=>o.no===v)?.name || ''">
            <a-select-option v-for="o in operationOptions" :key="o.no" :value="o.no">{{ o.no }} {{ o.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="IPQC 类型" v-if="editingStrategy.contextType === 'IPQC'">
          <a-select v-model:value="editingStrategy.matchDimension.ipqcType" allow-clear placeholder="不限类型">
            <a-select-option value="FAI">FAI 首件检验</a-select-option>
            <a-select-option value="PATROL">PATROL 巡检</a-select-option>
            <a-select-option value="LAI">LAI 末件检验</a-select-option>
          </a-select>
        </a-form-item>
        <a-divider>策略参数</a-divider>
        <a-form-item label="触发条件">
          <a-select v-model:value="editingStrategy.triggerCondition">
            <a-select-option value="ALWAYS">总是触发</a-select-option>
            <a-select-option value="ON_NEW_SUPPLIER_FIRST_N_BATCHES">新供应商前N批</a-select-option>
            <a-select-option value="ON_ECN_FIRST_N_BATCHES">工程变更后前N批</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="前N批" v-if="editingStrategy.triggerCondition !== 'ALWAYS'">
          <a-input-number v-model:value="editingStrategy.triggerValue" :min="1" :max="99" style="width:120px" />
          <span style="margin-left:8px;color:#8c8c8c">批</span>
        </a-form-item>
        <a-form-item label="优先级" extra="数值越小越优先，建议：精确匹配=10，通用匹配=99">
          <a-input-number v-model:value="editingStrategy.priority" :min="1" :max="999" style="width:120px" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="editingStrategy.description" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 匹配模拟器弹窗 -->
    <a-modal v-model:visible="showMatchSim" title="策略匹配模拟器" width="700px" @ok="runMatchSim" ok-text="开始模拟">
      <a-alert type="info" show-icon style="margin-bottom:16px">
        <template #message>输入业务上下文参数，验证当前方案策略的匹配逻辑是否符合预期。</template>
      </a-alert>
      <a-form :model="simContext" :label-col="{span:6}" :wrapper-col="{span:16}">
        <a-form-item label="业务类型">
          <a-select v-model:value="simContext.contextType">
            <a-select-option value="IQC">IQC</a-select-option>
            <a-select-option value="IPQC">IPQC</a-select-option>
            <a-select-option value="FQC">FQC</a-select-option>
            <a-select-option value="OQC">OQC</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="物料">
          <a-select v-model:value="simContext.materialId" allow-clear placeholder="请选择">
            <a-select-option v-for="m in materialOptions" :key="m.id" :value="m.id">{{ m.code }} - {{ m.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="供应商" v-if="simContext.contextType === 'IQC'">
          <a-select v-model:value="simContext.supplierId" allow-clear placeholder="请选择">
            <a-select-option v-for="s in supplierOptions" :key="s.id" :value="s.id">{{ s.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="客户" v-if="simContext.contextType === 'OQC'">
          <a-select v-model:value="simContext.customerId" allow-clear placeholder="请选择">
            <a-select-option v-for="c in customerOptions" :key="c.id" :value="c.id">{{ c.code }} - {{ c.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="工序" v-if="simContext.contextType === 'IPQC'">
          <a-select v-model:value="simContext.operationNo" allow-clear placeholder="请选择">
            <a-select-option v-for="o in operationOptions" :key="o.no" :value="o.no">{{ o.no }} {{ o.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="IPQC类型" v-if="simContext.contextType === 'IPQC'">
          <a-select v-model:value="simContext.ipqcType" allow-clear placeholder="请选择">
            <a-select-option value="FAI">FAI 首件检验</a-select-option>
            <a-select-option value="PATROL">PATROL 巡检</a-select-option>
            <a-select-option value="LAI">LAI 末件检验</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
      <a-divider>模拟结果</a-divider>
      <div v-if="simResult" class="sim-result">
        <a-result
          :status="simResult.matched ? 'success' : 'warning'"
          :title="simResult.matched ? `✅ 匹配到策略 (优先级 P${simResult.strategy?.priority})` : '⚠️ 未匹配到任何策略'"
        >
          <template #subTitle>
            <div v-if="simResult.matched">
              <a-descriptions bordered size="small" :column="2">
                <a-descriptions-item label="匹配类型">{{ simResult.matchType }}</a-descriptions-item>
                <a-descriptions-item label="触发条件">{{ triggerConditionText(simResult.strategy?.triggerCondition) }}</a-descriptions-item>
              </a-descriptions>
            </div>
            <div v-else>当前方案无策略可匹配此业务上下文，建议添加兜底（通用）策略。</div>
          </template>
        </a-result>
      </div>
      <a-empty v-else description="请填写条件后点击「开始模拟」" />
    </a-modal>

    <!-- 物料规格编辑弹窗 -->
    <a-modal v-model:visible="showSpecModal" title="物料检验规格" width="600px" @ok="saveSpec">
      <a-form v-if="editingSpec" :model="editingSpec" :label-col="{span:6}" :wrapper-col="{span:16}">
        <a-form-item label="物料">
          <a-select v-model:value="editingSpec.materialId" placeholder="请选择物料"
            @change="(v:string) => editingSpec!.materialCode = materialOptions.find(m=>m.id===v)?.code || ''">
            <a-select-option v-for="m in materialOptions" :key="m.id" :value="m.id">{{ m.code }} - {{ m.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="检验项目">
          <a-select v-model:value="editingSpec.inspItemCode" placeholder="请选择项目">
            <a-select-option v-for="d in details" :key="d.inspItemId" :value="d.inspItemId">
              {{ d.inspItemName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="数据类型">
          <a-radio-group v-model:value="editingSpec.dataType">
            <a-radio value="QUANTITATIVE">计量型（有公差）</a-radio>
            <a-radio value="QUALITATIVE">计数型（描述标准）</a-radio>
          </a-radio-group>
        </a-form-item>
        <template v-if="editingSpec.dataType === 'QUANTITATIVE'">
          <a-form-item label="目标值">
            <a-input-number v-model:value="editingSpec.targetValue" style="width:140px" />
            <a-input v-model:value="editingSpec.uom" placeholder="单位" style="width:70px;margin-left:8px" />
          </a-form-item>
          <a-form-item label="上限 (USL)">
            <a-input-number v-model:value="editingSpec.upperLimit" style="width:140px" />
          </a-form-item>
          <a-form-item label="下限 (LSL)">
            <a-input-number v-model:value="editingSpec.lowerLimit" style="width:140px" />
          </a-form-item>
        </template>
        <template v-else>
          <a-form-item label="标准描述">
            <a-textarea v-model:value="editingSpec.standardDesc" :rows="3" placeholder="如：表面无划伤，色泽均匀" />
          </a-form-item>
          <a-form-item label="期望值">
            <a-input v-model:value="editingSpec.expectedValue" placeholder="如：OK / PASS" />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined,
  CopyOutlined, InfoCircleOutlined, QuestionCircleOutlined, PlayCircleOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

// ─── 状态 ────────────────────────────────
const formRef = ref()
const saving = ref(false)
const activeTab = ref('details')

const isView = computed(() => route.path.includes('/view/'))
const isEdit = computed(() => route.path.includes('/edit/'))
const pageTitle = computed(() => isView.value ? '查看检验方案' : isEdit.value ? '编辑检验方案' : '新增检验方案')

// NOTE: 实际项目中应从全局 store（Pinia）获取，null 表示集团用户，有值则为具体工厂ID
const currentOrgId = ref<string | null>('ORG001')

/**
 * 集团级方案（orgId === null）对工厂级用户只读
 * 工厂级用户（currentOrgId !== null）只能编辑本组织的方案
 */
const isReadOnly = computed(() => {
  if (!isEdit.value && !isView.value) return false
  if (currentOrgId.value === null) return false
  return form.orgId === null
})

// ─── 基本表单 ─────────────────────────────
const form = reactive({
  id: null as string | null,
  /** 组织ID：null 表示集团级方案，有值表示工厂级私有方案 */
  orgId: null as string | null,
  schemeCode: '',
  schemeName: '',
  version: 'V1.0',
  inspType: undefined as string | undefined,
  status: 'DRAFT',
  sourceTemplateId: undefined as string | undefined,
  sourceTemplateName: undefined as string | undefined,
  description: ''
})

const rules = {
  schemeCode: [{ required: true, message: '请输入方案编码', trigger: 'blur' }],
  schemeName: [{ required: true, message: '请输入方案名称', trigger: 'blur' }],
  inspType: [{ required: true, message: '请选择检验类型', trigger: 'change' }],
}

// ─── 模板选择 ─────────────────────────────
const selectedTemplateId = ref<string | undefined>(undefined)

const templateOptions = ref([
  { id: 'T001', name: 'IQC-原材料通用模板', version: 'V1.0', details: [
    { inspItemId: 'ITEM001', inspItemName: '外观检查', characteristicClass: 'Major', samplingRuleCode: 'AQL-L2-N-0.65', samplingRuleName: 'AQL 0.65 Level-II', spcEnabled: false, labRequired: false },
    { inspItemId: 'ITEM002', inspItemName: '尺寸测量', characteristicClass: 'CC', samplingRuleCode: 'AQL-L2-N-1.0', samplingRuleName: 'AQL 1.0 Level-II', spcEnabled: true, labRequired: false },
  ]},
  { id: 'T002', name: 'IPQC-过程检验模板', version: 'V2.0', details: [
    { inspItemId: 'ITEM003', inspItemName: '硬度测试', characteristicClass: 'SC', samplingRuleCode: 'AQL-L2-N-0.65', samplingRuleName: 'AQL 0.65 Level-II', spcEnabled: true, labRequired: true },
    { inspItemId: 'ITEM004', inspItemName: '表面粗糙度', characteristicClass: 'CC', samplingRuleCode: 'AQL-L2-N-1.0', samplingRuleName: 'AQL 1.0 Level-II', spcEnabled: true, labRequired: false },
  ]},
  { id: 'T003', name: 'FQC-成品检验模板', version: 'V1.2', details: [
    { inspItemId: 'ITEM005', inspItemName: '功能测试', characteristicClass: 'SC', samplingRuleCode: 'FULL_INSPECT', samplingRuleName: '全检', spcEnabled: false, labRequired: false },
  ]}
])

function handleTemplateChange(templateId: string) {
  if (!templateId) { form.sourceTemplateId = undefined; form.sourceTemplateName = undefined; return }
  const tpl = templateOptions.value.find(t => t.id === templateId)
  if (!tpl) return
  Modal.confirm({
    title: '引用模板',
    content: `将从模板「${tpl.name}」复制 ${tpl.details.length} 个检验项目到当前方案，继续吗？`,
    onOk() {
      form.sourceTemplateId = tpl.id
      form.sourceTemplateName = tpl.name
      details.value = tpl.details.map((d, i) => ({
        id: `from-tpl-${i}-${Date.now()}`,
        schemeId: '',
        sortOrder: i + 1,
        ...d,
        inspMethodId: undefined,
        inspMethodName: '',
        gaugeTypeId: undefined,
        gaugeTypeName: '',
        labRequired: d.labRequired ?? false,
        relatedPhenomenonIds: [],
        fromTemplate: true,
        _editing: false,
        createTime: '', updateTime: '', creator: '', updater: ''
      }))
      message.success(`已从模板复制 ${tpl.details.length} 个检验项目，可在此基础上继续编辑`)
    },
    onCancel() { selectedTemplateId.value = undefined }
  })
}

// ─── 检验项目明细 ──────────────────────────
const details = ref<any[]>([])

const detailColumns = [
  { title: '#', key: 'sortOrder', width: 50 },
  { title: '检验项目', key: 'inspItemName', dataIndex: 'inspItemName', width: 170 },
  { title: '特性分类', key: 'characteristicClass', width: 110 },
  { title: '抽样规则', key: 'samplingRuleName', width: 180 },
  { title: '检验方法', key: 'inspMethodName', width: 150 },
  { title: 'SPC', key: 'spcEnabled', width: 60 },
  { title: '实验室', key: 'labRequired', width: 65 },
  { title: '操作', key: 'action', width: 110, fixed: 'right' }
]

const itemOptions = ref([
  { id: 'ITEM001', name: '外观检查', dataType: 'qualitative' },
  { id: 'ITEM002', name: '尺寸测量', dataType: 'quantitative' },
  { id: 'ITEM003', name: '硬度测试', dataType: 'quantitative' },
  { id: 'ITEM004', name: '表面粗糙度', dataType: 'quantitative' },
  { id: 'ITEM005', name: '功能测试', dataType: 'qualitative' },
  { id: 'ITEM006', name: '引脚平整度', dataType: 'quantitative' },
])

const samplingRules = ref([
  { code: 'AQL-L2-N-0.65', name: 'AQL 0.65 Level-II 正常' },
  { code: 'AQL-L2-N-1.0',  name: 'AQL 1.0 Level-II 正常' },
  { code: 'AQL-L2-T-0.65', name: 'AQL 0.65 Level-II 加严' },
  { code: 'FULL_INSPECT',  name: '全检' },
])

const methodOptions = ref([
  { id: 'M001', name: '目视检查' },
  { id: 'M002', name: '卡尺测量' },
  { id: 'M003', name: '三坐标测量' },
  { id: 'M004', name: '洛氏硬度计测量' },
])

function onItemSelect(record: any, itemId: string) {
  const found = itemOptions.value.find(i => i.id === itemId)
  if (found) record.inspItemName = found.name
}

function handleAddDetail() {
  details.value.push({
    id: `new-${Date.now()}`,
    schemeId: '',
    sortOrder: details.value.length + 1,
    inspItemId: undefined,
    inspItemName: '（请选择项目）',
    characteristicClass: 'Minor',
    samplingRuleCode: 'AQL-L2-N-1.0',
    samplingRuleName: 'AQL 1.0 Level-II 正常',
    inspMethodId: undefined,
    inspMethodName: '',
    spcEnabled: false,
    labRequired: false,
    fromTemplate: false,
    _editing: true,
    createTime: '', updateTime: '', creator: '', updater: ''
  })
}

function handleRemoveDetail(record: any) {
  details.value = details.value.filter(d => d.id !== record.id)
}

function handleClearDetails() {
  Modal.confirm({
    title: '确认清空',
    content: '将清空所有检验项目明细，操作不可撤销，确认吗？',
    okType: 'danger',
    onOk() {
      details.value = []
      selectedTemplateId.value = undefined
      form.sourceTemplateId = undefined
      form.sourceTemplateName = undefined
    }
  })
}

// ─── 检验策略 ─────────────────────────────
const strategies = ref<any[]>([])
const showStrategyModal = ref(false)
const editingStrategy = ref<any>(null)

const strategyColumns = [
  { title: '业务类型', key: 'contextType', width: 130 },
  { title: '适用范围（匹配维度）', key: 'matchSummary' },
  { title: '触发条件', key: 'triggerCondition', width: 180 },
  { title: '优先级', key: 'priority', width: 80 },
  { title: '操作', key: 'action', width: 110 }
]

function handleAddStrategy() {
  editingStrategy.value = {
    id: `new-${Date.now()}`,
    schemeId: '',
    contextType: form.inspType || 'IQC',
    matchDimension: { materialId: undefined, supplierId: undefined, customerId: undefined, operationNo: undefined, ipqcType: undefined },
    priority: 50,
    triggerCondition: 'ALWAYS',
    triggerValue: undefined,
    description: '',
    createTime: '', updateTime: '', creator: '', updater: '',
    // NOTE: 策略归属于当前方案所在组织
    orgId: form.orgId ?? currentOrgId.value ?? ''
  }
  showStrategyModal.value = true
}

function openStrategyEdit(record: any) {
  editingStrategy.value = JSON.parse(JSON.stringify(record))
  showStrategyModal.value = true
}

function saveStrategy() {
  if (!editingStrategy.value) return
  const idx = strategies.value.findIndex(s => s.id === editingStrategy.value.id)
  if (idx >= 0) {
    strategies.value[idx] = editingStrategy.value
  } else {
    strategies.value.push(editingStrategy.value)
  }
  showStrategyModal.value = false
  message.success('策略已保存')
}

function handleRemoveStrategy(record: any) {
  strategies.value = strategies.value.filter(s => s.id !== record.id)
  message.success('已删除策略')
}

// ─── 匹配模拟器 ───────────────────────────
const showMatchSim = ref(false)
const simContext = reactive({ contextType: 'IQC', materialId: undefined as string | undefined, supplierId: undefined as string | undefined, customerId: undefined as string | undefined, operationNo: undefined as string | undefined, ipqcType: undefined as string | undefined })
const simResult = ref<any>(null)

function runMatchSim() {
  simResult.value = null
  const matched = strategies.value
    .filter(s => s.contextType === simContext.contextType)
    .filter(s => {
      const d = s.matchDimension
      if (d.materialId && d.materialId !== simContext.materialId) return false
      if (d.supplierId && d.supplierId !== simContext.supplierId) return false
      if (d.customerId && d.customerId !== simContext.customerId) return false
      if (d.operationNo && d.operationNo !== simContext.operationNo) return false
      if (d.ipqcType && d.ipqcType !== simContext.ipqcType) return false
      return true
    })
    .sort((a: any, b: any) => a.priority - b.priority)

  if (matched.length > 0) {
    const best = matched[0]
    const dims: string[] = []
    if (best.matchDimension?.materialName) dims.push('物料')
    if (best.matchDimension?.supplierName) dims.push('供应商')
    if (best.matchDimension?.customerName) dims.push('客户')
    if (best.matchDimension?.operationName) dims.push('工序')
    if (best.matchDimension?.ipqcType) dims.push('IPQC类型')
    simResult.value = {
      matched: true,
      strategy: best,
      matchType: dims.length > 0 ? dims.join(' + ') + ' 匹配' : '通用匹配'
    }
  } else {
    simResult.value = { matched: false }
  }
}

// ─── 物料规格 ─────────────────────────────
const materialSpecs = ref<any[]>([])
const showSpecModal = ref(false)
const editingSpec = ref<any>(null)

const specColumns = [
  { title: '物料', dataIndex: 'materialCode', key: 'materialCode', width: 120 },
  { title: '检验项目', dataIndex: 'inspItemName', key: 'inspItemName', width: 130 },
  { title: '数据类型', key: 'dataType', width: 100 },
  { title: '规格标准', key: 'spec' },
  { title: '操作', key: 'action', width: 100 }
]

function handleAddSpec() {
  editingSpec.value = {
    id: `new-${Date.now()}`,
    materialId: undefined, materialCode: '',
    inspItemCode: undefined, inspItemName: '',
    dataType: 'QUANTITATIVE',
    targetValue: undefined, upperLimit: undefined, lowerLimit: undefined, uom: 'mm',
    standardDesc: '', expectedValue: '', specCode: '', specName: '',
    specType: 'quantitative', sortOrder: materialSpecs.value.length + 1, status: 'enabled',
    // NOTE: 规格归属于当前方案所在组织
    orgId: form.orgId ?? currentOrgId.value ?? '',
    createTime: '', updateTime: '', creator: '', updater: ''
  }
  showSpecModal.value = true
}

function openSpecEdit(record: any) {
  editingSpec.value = JSON.parse(JSON.stringify(record))
  showSpecModal.value = true
}

function saveSpec() {
  if (!editingSpec.value) return
  // 补充 inspItemName
  const detailItem = details.value.find(d => d.inspItemId === editingSpec.value.inspItemCode)
  if (detailItem) editingSpec.value.inspItemName = detailItem.inspItemName
  const idx = materialSpecs.value.findIndex(s => s.id === editingSpec.value.id)
  if (idx >= 0) materialSpecs.value[idx] = editingSpec.value
  else materialSpecs.value.push(editingSpec.value)
  showSpecModal.value = false
  message.success('规格已保存')
}

function handleRemoveSpec(record: any) {
  materialSpecs.value = materialSpecs.value.filter(s => s.id !== record.id)
}

// ─── 不良现象 ─────────────────────────────
const phenomenonMaps = ref<any[]>([])
const phenomenonColumns = [
  { title: '检验项目', dataIndex: 'itemName', key: 'itemName', width: 150 },
  { title: '不良现象', dataIndex: 'phenomenonName', key: 'phenomenonName' },
  { title: '严重等级', key: 'severity', width: 100 },
  { title: '操作', key: 'action', width: 80 }
]

function handleAddPhenomenon() {
  phenomenonMaps.value.push({
    id: `new-${Date.now()}`,
    itemName: details.value[0]?.inspItemName || '外观检查',
    phenomenonName: '表面划伤',
    severity: 'MI'
  })
  message.success('已添加示例，请编辑')
}

function handleRemovePhenomenon(record: any) {
  phenomenonMaps.value = phenomenonMaps.value.filter(p => p.id !== record.id)
}

// ─── 选项数据 ─────────────────────────────
const materialOptions = ref([
  { id: 'MAT001', code: 'M001', name: '铝合金压铸件' },
  { id: 'MAT002', code: 'M002', name: '电子元器件A' },
  { id: 'MAT003', code: 'M003', name: '塑料注塑件' },
])
const supplierOptions = ref([
  { id: 'SUP001', name: '供应商甲（主力）' },
  { id: 'SUP002', name: '供应商乙（备用）' },
  { id: 'SUP003', name: '供应商丙（新供应商）' },
])
const customerOptions = ref([
  { id: 'CUST001', code: 'CUST-01', name: '客户A（大众）' },
  { id: 'CUST002', code: 'CUST-02', name: '客户B（通用）' },
  { id: 'CUST003', code: 'CUST-03', name: '客户C（丰田）' },
])
const operationOptions = ref([
  { no: 'OP010', name: '焊接' },
  { no: 'OP020', name: '组装' },
  { no: 'OP030', name: '测试' },
])

// ─── 工具函数 ─────────────────────────────
const statusColor = (s: string) => ({ DRAFT: 'default', IN_APPROVAL: 'processing', APPROVED: 'success', OBSOLETE: 'error' }[s] || 'default')
const statusText = (s: string) => ({ DRAFT: '草稿', IN_APPROVAL: '审批中', APPROVED: '已批准', OBSOLETE: '已作废' }[s] || s)
const classColor = (c: string) => ({ SC: 'red', CC: 'orange', Major: 'blue', Minor: 'default' }[c] || 'default')
const severityColor = (s: string) => ({ CR: 'red', MA: 'orange', MI: 'blue' }[s] || 'default')
const triggerConditionText = (t: string) => ({
  ALWAYS: '总是触发',
  ON_NEW_SUPPLIER_FIRST_N_BATCHES: '新供应商前N批',
  ON_ECN_FIRST_N_BATCHES: '工程变更前N批'
}[t] || t)

// ─── 保存 & 返回 ──────────────────────────
const handleBack = () => router.push('/inspection-model/insp-plans')

const handleSave = async () => {
  try {
    saving.value = true
    await formRef.value?.validate()
    if (details.value.length === 0) {
      message.warning('方案至少需要包含一个检验项目')
      return
    }
    // TODO: 调用 API 保存
    message.success('方案保存成功')
    router.push('/inspection-model/insp-plans')
  } catch {
    message.error('请完善必填项')
  } finally {
    saving.value = false
  }
}

// ─── 初始化 ───────────────────────────────
onMounted(() => {
  const id = route.params.id as string | undefined
  if (id) {
    /**
     * HACK: Mock 数据区分两种场景：
     * - id='1' 或无特殊处理 → 加载「集团级方案」(orgId=null)，用于演示工厂用户的只读效果
     * - id='2' → 加载「本地方案」(orgId = currentOrgId)，工厂用户可编辑
     * 实际应从 API 获取并根据返回 orgId 决定
     */
    const isGroupScheme = id !== '2'
    Object.assign(form, {
      id,
      orgId: isGroupScheme ? null : currentOrgId.value,
      schemeCode: isGroupScheme ? 'SCH-IQC-G001' : 'SCH-IQC-001',
      schemeName: isGroupScheme ? '集团通用-电子料IQC方案' : '合肥工厂-电子料IQC专用方案',
      version: 'V1.0',
      inspType: 'IQC',
      status: 'APPROVED',
      sourceTemplateId: 'T001',
      sourceTemplateName: 'IQC-原材料通用模板',
      description: isGroupScheme
        ? '集团统一制定，适用于所有工厂的电子类物料来料检验。'
        : '用于IC芯片类物料的来料检验，额外增加了引脚平整度检查。'
    })
    selectedTemplateId.value = 'T001'
    const schemeOrgId = isGroupScheme ? null : currentOrgId.value
    details.value = [
      { id: 'd1', schemeId: id, sortOrder: 1, inspItemId: 'ITEM001', inspItemName: '外观检查', characteristicClass: 'Major', samplingRuleCode: 'AQL-L2-N-0.65', samplingRuleName: 'AQL 0.65 Level-II', spcEnabled: false, labRequired: false, fromTemplate: true, _editing: false, createTime:'', updateTime:'', creator:'', updater:'' },
      { id: 'd2', schemeId: id, sortOrder: 2, inspItemId: 'ITEM002', inspItemName: '尺寸测量',  characteristicClass: 'CC',    samplingRuleCode: 'AQL-L2-N-1.0',  samplingRuleName: 'AQL 1.0 Level-II', spcEnabled: true, labRequired: false, fromTemplate: true, _editing: false, createTime:'', updateTime:'', creator:'', updater:'' },
      { id: 'd3', schemeId: id, sortOrder: 3, inspItemId: 'ITEM006', inspItemName: '引脚平整度', characteristicClass: 'SC',   samplingRuleCode: 'FULL_INSPECT',   samplingRuleName: '全检',             spcEnabled: false, labRequired: false, fromTemplate: false, _editing: false, createTime:'', updateTime:'', creator:'', updater:'' },
    ]
    strategies.value = [
      { id: 's1', schemeId: id, contextType: 'IQC', matchDimension: { materialId: 'MAT002', materialName: '电子元器件A' }, priority: 20, triggerCondition: 'ALWAYS', orgId: schemeOrgId, createTime:'', updateTime:'', creator:'', updater:'' },
      { id: 's2', schemeId: id, contextType: 'IQC', matchDimension: { materialId: 'MAT002', materialName: '电子元器件A', supplierId: 'SUP003', supplierName: '供应商丙（新供应商）' }, priority: 5, triggerCondition: 'ON_NEW_SUPPLIER_FIRST_N_BATCHES', triggerValue: 3, orgId: schemeOrgId, createTime:'', updateTime:'', creator:'', updater:'' },
    ]
    materialSpecs.value = [
      { id: 'sp1', materialId: 'MAT002', materialCode: 'M002', inspItemCode: 'ITEM006', inspItemName: '引脚平整度', dataType: 'QUANTITATIVE', targetValue: 0.05, upperLimit: 0.1, lowerLimit: 0, uom: 'mm', specCode: 'SP001', specName: '引脚平整度规格', specType: 'quantitative', sortOrder: 1, status: 'enabled', orgId: schemeOrgId, createTime:'', updateTime:'', creator:'', updater:'' }
    ]
    phenomenonMaps.value = [
      { id: 'p1', itemName: '外观检查', phenomenonName: '表面划伤', severity: 'MI' },
      { id: 'p2', itemName: '外观检查', phenomenonName: '引脚变形', severity: 'MA' },
    ]
  } else {
    // 新增模式：orgId 默认为当前用户所在组织
    form.orgId = currentOrgId.value
  }
})
</script>

<style scoped>
.scheme-edit-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}

.header-left { display: flex; align-items: center; gap: 16px; }
.back-btn { padding: 0; }
.title-block { display: flex; align-items: center; gap: 8px; }
.page-title { margin: 0; font-size: 18px; font-weight: 600; }

.info-card { margin-bottom: 16px; border-radius: 8px; }
.tab-card  { border-radius: 8px; }

.tab-toolbar { margin-bottom: 12px; }

.field-hint {
  font-size: 12px;
  color: #fa8c16;
  margin-top: 4px;
}

.sort-badge {
  display: inline-flex;
  width: 22px; height: 22px;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 12px;
  color: #595959;
}

.sim-result { margin-top: -24px; }

/* 行颜色区分：来自模板 vs 自定义 */
:deep(.row-from-template) td { background: #f0f5ff !important; }
:deep(.row-custom) td { background: #f6ffed !important; }
</style>
