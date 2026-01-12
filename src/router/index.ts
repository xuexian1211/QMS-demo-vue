import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
      return isLoggedIn ? '/dashboard' : '/login'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '工作台' },
    children: [
      {
        path: '',
        component: () => import('@/views/Dashboard.vue')
      }
    ]
  },
  {
    path: '/leadership',
    name: 'Leadership',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '领导驾驶舱' },
    children: [
      {
        path: '',
        component: () => import('@/views/Leadership.vue')
      }
    ]
  },
  {
    path: '/production-quality/problem-management/problem-types',
    name: 'ProblemTypes',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '问题类型' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/problem-management/ProblemTypes.vue')
      }
    ]
  },
  {
    path: '/production-quality/problem-management/problem-list',
    name: 'ProblemList',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '问题管理' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/problem-management/ProblemList.vue')
      }
    ]
  },
  {
    path: '/production-quality/quality-inspection/inspection-templates',
    name: 'InspectionTemplates',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验模板' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/quality-inspection/InspectionTemplates.vue')
      }
    ]
  },
  {
    path: '/production-quality/quality-inspection/inspection-rules',
    name: 'InspectionRules',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验规则' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/quality-inspection/InspectionRules.vue')
      }
    ]
  },
  {
    path: '/production-quality/quality-inspection/iqc-checklist',
    name: 'IQCChecklist',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '来料检验单(IQC)' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/quality-inspection/IQCChecklist.vue')
      }
    ]
  },
  {
    path: '/production-quality/quality-inspection/ipqc-checklist',
    name: 'IPQCChecklist',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '过程检验单(IPQC)' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/quality-inspection/IPQCChecklist.vue')
      }
    ]
  },
  {
    path: '/production-quality/quality-inspection/fqc-checklist',
    name: 'FQCChecklist',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '成品检验单(FQC)' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/quality-inspection/FQCChecklist.vue')
      }
    ]
  },
  {
    path: '/production-quality/quality-inspection/oqc-checklist',
    name: 'OQCChecklist',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '出货检验单(OQC)' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/quality-inspection/OQCChecklist.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/material-disposal',
    name: 'MaterialDisposal',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '来料不合格处置单' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/MaterialDisposal.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/material-disposal/create',
    name: 'MaterialDisposalCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '来料不合格处置单-新增' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/MaterialDisposalCreate.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/material-disposal/edit',
    name: 'MaterialDisposalEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '来料不合格处置单-编辑', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/MaterialDisposalEdit.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/material-disposal/edit/test',
    name: 'MaterialDisposalEditTest',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '来料不合格处置单-编辑测试', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/MaterialDisposalEditTest.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/material-disposal/view',
    name: 'MaterialDisposalView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '来料不合格处置单-查看', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/MaterialDisposalView.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/process-disposal',
    name: 'ProcessDisposal',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '过程不合格品处置单' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/ProcessDisposal.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/process-disposal/create',
    name: 'ProcessDisposalCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '过程不合格品处置单-新增', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/ProcessDisposalEdit.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/process-disposal/edit/:id',
    name: 'ProcessDisposalEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '过程不合格品处置单-编辑', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/ProcessDisposalEdit.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/process-disposal/view/:id',
    name: 'ProcessDisposalView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '过程不合格品处置单-查看', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/ProcessDisposalView.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/product-disposal',
    name: 'ProductDisposal',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '成品不合格处置单' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/ProductDisposal.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/change-point-application',
    name: 'ChangePointApplication',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '变化点申请单' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/ChangePointApplication.vue')
      }
    ]
  },
  {
    path: '/production-quality/exception-handling/qrqc-response',
    name: 'QRQCResponse',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: 'QRQC快速反应单' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/QRQCResponse.vue')
      }
    ]
  },
  {
    path: '/supplier',
    name: 'Supplier',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '供方管理' },
    children: [
      {
        path: '',
        component: () => import('@/views/supplier/SupplierManagement.vue')
      }
    ]
  },
  {
    path: '/customer',
    name: 'Customer',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '客诉管理' },
    children: [
      {
        path: '',
        component: () => import('@/views/customer/CustomerComplaint.vue')
      }
    ]
  },
  {
    path: '/system',
    name: 'System',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '系统管理' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/Index.vue')
      }
    ]
  },
  {
    path: '/system/announcement',
    name: 'SystemAnnouncement',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '系统公告' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/Announcement.vue')
      }
    ]
  },
  {
    path: '/system/config',
    name: 'SystemConfig',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '系统配置' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/Config.vue')
      }
    ]
  },
  {
    path: '/system/menu',
    name: 'SystemMenu',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '菜单管理' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/Menu.vue')
      }
    ]
  },
  {
    path: '/system/log',
    name: 'SystemLog',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '系统日志' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/SystemLog.vue')
      }
    ]
  },
  {
    path: '/system/api-log',
    name: 'ApiLog',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '接口日志' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/ApiLog.vue')
      }
    ]
  },
  {
    path: '/system/schedule',
    name: 'SystemSchedule',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '系统调度' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/Schedule.vue')
      }
    ]
  },
  {
    path: '/system/monitor',
    name: 'SystemMonitor',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '系统监控' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/Monitor.vue')
      }
    ]
  },
  {
    path: '/system/template',
    name: 'SystemTemplate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '系统模板' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/template/TemplateManagement.vue')
      },
      {
        path: 'space',
        name: 'SpaceTemplate',
        component: () => import('@/views/system/template/TemplateManagement.vue'),
        meta: { title: '空间模板' }
      },
      {
        path: 'print',
        name: 'PrintTemplate',
        component: () => import('@/views/system/template/TemplateManagement.vue'),
        meta: { title: '打印模板' }
      },
      {
        path: 'message',
        name: 'MessageTemplate',
        component: () => import('@/views/system/template/TemplateManagement.vue'),
        meta: { title: '消息模板' }
      }
    ]
  },
  {
    path: '/system/data-dictionary',
    name: 'SystemDataDictionary',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '数据字典' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/DataDictionary.vue')
      }
    ]
  },
  {
    path: '/system/data-app',
    name: 'DataApp',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '数据应用' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/data-app/DataApplication.vue')
      },
      {
        path: 'api',
        name: 'DataApi',
        component: () => import('@/views/system/data-app/DataApplication.vue'),
        meta: { title: '数据接口' }
      },
      {
        path: 'region',
        name: 'AdministrativeRegion',
        component: () => import('@/views/system/data-app/DataApplication.vue'),
        meta: { title: '行政区划' }
      }
    ]
  },
  {
    path: '/system/permission',
    name: 'SystemPermission',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '系统权限' },
    children: [
      {
        path: '',
        redirect: '/system/permission/organization'
      },
      {
        path: 'organization',
        name: 'Organization',
        component: () => import('@/views/system/permission/Organization.vue'),
        meta: { title: '组织单位' }
      },
      {
        path: 'department',
        name: 'Department',
        component: () => import('@/views/system/permission/Department.vue'),
        meta: { title: '部门管理' }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/system/permission/User.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/system/permission/Role.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: 'permission',
        name: 'Permission',
        component: () => import('@/views/system/permission/Permission.vue'),
        meta: { title: '权限管理' }
      },
      {
        path: 'position',
        name: 'Position',
        component: () => import('@/views/system/permission/Position.vue'),
        meta: { title: '岗位管理' }
      }
    ]
  },
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '文档管理' },
    children: [
      {
        path: '',
        component: () => import('@/views/documents/DocumentManagement.vue')
      }
    ]
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '质量报告' },
    children: [
      {
        path: '',
        component: () => import('@/views/reports/ReportManagement.vue')
      }
    ]
  },
  {
    path: '/tools/spc',
    name: 'SPC',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: 'SPC统计过程控制' },
    children: [
      {
        path: '',
        component: () => import('@/views/tools/SPC.vue')
      }
    ]
  },
  {
    path: '/tools/fmea',
    name: 'FMEA',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: 'FMEA失效模式分析' },
    children: [
      {
        path: '',
        component: () => import('@/views/tools/FMEA.vue')
      }
    ]
  },
  {
    path: '/tools/msa',
    name: 'MSA',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: 'MSA测量系统分析' },
    children: [
      {
        path: '',
        component: () => import('@/views/tools/MSA.vue')
      }
    ]
  },
  {
    path: '/basic-data',
    name: 'BasicData',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '基础数据' },
    children: [
      {
        path: '',
        redirect: '/basic-data/material-category'
      }
    ]
  },
  {
    path: '/basic-data/material-category',
    name: 'MaterialCategory',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '物料分类' },
    children: [
      {
        path: '',
        component: () => import('@/views/basic-data/MaterialCategory.vue')
      }
    ]
  },
  {
    path: '/basic-data/material',
    name: 'Material',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '物料/产品' },
    children: [
      {
        path: '',
        component: () => import('@/views/basic-data/MaterialProduct.vue')
      }
    ]
  },
  {
    path: '/basic-data/unit',
    name: 'Unit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '计量单位' },
    children: [
      {
        path: '',
        component: () => import('@/views/basic-data/UnitManagement.vue')
      }
    ]
  },
  {
    path: '/basic-data/process-route',
    name: 'ProcessRoute',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '工艺路线' },
    children: [
      {
        path: '',
        component: () => import('@/views/basic-data/ProcessRoute.vue')
      }
    ]
  },
  {
    path: '/basic-data/production-team',
    name: 'ProductionTeam',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '生产班组' },
    children: [
      {
        path: '',
        component: () => import('@/views/basic-data/ProductionTeam.vue')
      }
    ]
  },
  {
    path: '/basic-data/customer-archive',
    name: 'CustomerArchive',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '客户档案' },
    children: [
      {
        path: '',
        component: () => import('@/views/basic-data/CustomerArchive.vue')
      }
    ]
  },
  {
    path: '/basic-data/supplier-archive',
    name: 'SupplierArchive',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '供应商档案' },
    children: [
      {
        path: '',
        component: () => import('@/views/basic-data/SupplierArchive.vue')
      }
    ]
  },
  {
    path: '/basic-data/storage-location',
    name: 'StorageLocation',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '存储地点' },
    children: [
      {
        path: '',
        component: () => import('@/views/basic-data/StorageLocation.vue')
      }
    ]
  },
  {
    path: '/inspection-model',
    name: 'InspectionModel',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验数据模型' },
    children: [
      {
        path: '',
        redirect: '/inspection-model/defect-categories'
      }
    ]
  },
  {
    path: '/inspection-model/defect-phenomena',
    name: 'InspectionModelDefectPhenomena',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '不良现象管理' },
    children: [
      {
        path: '',
        component: () => import('@/views/inspection-model/DefectPhenomenonList.vue')
      }
    ]
  },
  {
    path: '/inspection-model/defect-phenomena/create',
    name: 'InspectionModelDefectPhenomenonCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '不良现象-新增', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/inspection-model/DefectPhenomenonEdit.vue')
      }
    ]
  },
  {
    path: '/inspection-model/defect-phenomena/edit/:id',
    name: 'InspectionModelDefectPhenomenonEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '不良现象-编辑', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/inspection-model/DefectPhenomenonEdit.vue')
      }
    ]
  },
  {
    path: '/inspection-model/defect-phenomena/view/:id',
    name: 'InspectionModelDefectPhenomenonView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '不良现象-查看', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/inspection-model/DefectPhenomenonEdit.vue')
      }
    ]
  },

  {
    path: '/inspection-model/defect-causes',
    name: 'InspectionModelDefectCauses',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '不良原因管理' },
    children: [
      {
        path: '',
        component: () => import('@/views/inspection-model/DefectCauseList.vue')
      }
    ]
  },
  {
    path: '/inspection-model/gauge-ledgers',
    name: 'InspectionModelGaugeLedgers',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '量检具台账' },
    children: [
      {
        path: '',
        component: () => import('@/views/inspection-model/GaugeLedgerList.vue')
      }
    ]
  },
  {
    path: '/inspection-model/insp-methods',
    name: 'InspectionModelInspMethods',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方法管理' },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspMethodList.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-methods/create',
    name: 'InspectionModelInspMethodCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方法-新增', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspMethodEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-methods/edit/:id',
    name: 'InspectionModelInspMethodEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方法-编辑', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspMethodEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-methods/view/:id',
    name: 'InspectionModelInspMethodView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方法-查看', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspMethodEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/sampling-plans',
    name: 'InspectionModelSamplingPlans',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '抽样方案管理' },
    children: [
      { path: '', component: () => import('@/views/inspection-model/SamplingPlanList.vue') }
    ]
  },
  {
    path: '/inspection-model/sampling-plans/create',
    name: 'InspectionModelSamplingPlanCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '抽样方案-新增', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/SamplingPlanEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/sampling-plans/edit/:id',
    name: 'InspectionModelSamplingPlanEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '抽样方案-编辑', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/SamplingPlanEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/sampling-plans/view/:id',
    name: 'InspectionModelSamplingPlanView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '抽样方案-查看', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/SamplingPlanEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/inspection-items',
    name: 'InspectionModelInspectionItems',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验项目管理' },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspectionItemList.vue') }
    ]
  },
  {
    path: '/inspection-model/inspection-items/create',
    name: 'InspectionModelInspectionItemCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验项目-新增', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspectionItemEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/inspection-items/edit/:id',
    name: 'InspectionModelInspectionItemEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验项目-编辑', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspectionItemEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/inspection-items/view/:id',
    name: 'InspectionModelInspectionItemView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验项目-查看', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspectionItemEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-plans',
    name: 'InspectionModelInspPlans',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方案管理' },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspPlanList.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-plans/create',
    name: 'InspectionModelInspPlanCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方案-新增', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspPlanEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-plans/edit/:id',
    name: 'InspectionModelInspPlanEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方案-编辑', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspPlanEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-plans/view/:id',
    name: 'InspectionModelInspPlanView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方案-查看', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspPlanEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/defect-causes/create',
    name: 'InspectionModelDefectCauseCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '不良原因-新增', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/inspection-model/DefectCauseEdit.vue')
      }
    ]
  },
  {
    path: '/inspection-model/defect-causes/edit/:id',
    name: 'InspectionModelDefectCauseEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '不良原因-编辑', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/inspection-model/DefectCauseEdit.vue')
      }
    ]
  },
  {
    path: '/inspection-model/defect-causes/view/:id',
    name: 'InspectionModelDefectCauseView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '不良原因-查看', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/inspection-model/DefectCauseEdit.vue')
      }
    ]
  },
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  
  // 白名单页面，不需要登录
  const whiteList = ['/login']
  
  if (whiteList.includes(to.path)) {
    // 如果已登录且访问登录页，重定向到首页
    if (isLoggedIn) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    // 其他页面需要登录
    if (isLoggedIn) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router
