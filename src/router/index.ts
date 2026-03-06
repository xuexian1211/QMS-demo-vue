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
  // IQC 来料检验任务列表
  {
    path: '/production-quality/quality-inspection/iqc-task-list',
    name: 'IqcTaskList',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: 'IQC来料检验任务' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/quality-inspection/IqcTaskList.vue')
      }
    ]
  },
  // IQC 检验执行页
  {
    path: '/production-quality/quality-inspection/iqc-task-execution/:id',
    name: 'IqcTaskExecution',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: 'IQC检验执行', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/quality-inspection/IqcTaskExecution.vue')
      }
    ]
  },
  // MRB 进料不良异常处理记录
  {
    path: '/production-quality/exception-handling/mrb-records',
    name: 'MrbRecordList',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: 'MRB异常处理记录' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/exception-handling/MrbRecordList.vue')
      }
    ]
  },
  // 实验室检测任务看板
  {
    path: '/production-quality/laboratory/lab-task-board',
    name: 'LabTaskBoard',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '实验室送检任务' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/laboratory/LabTaskBoard.vue')
      }
    ]
  },
  // 实验室检测执行列表
  {
    path: '/production-quality/laboratory/lab-task-execution',
    name: 'LabTaskExecutionList',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '实验室检测执行' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/laboratory/LabTaskExecutionList.vue')
      }
    ]
  },
  // 实验室检测执行详情页（带任务ID参数）
  {
    path: '/production-quality/laboratory/lab-task-execution/:id',
    name: 'LabTaskExecution',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '实验室检测执行', hideInMenu: true },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/laboratory/LabTaskExecution.vue')
      }
    ]
  },
  // 委外检测管理
  {
    path: '/production-quality/laboratory/outsource-test',
    name: 'OutsourceTestManage',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '委外检测管理' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/laboratory/OutsourceTestManage.vue')
      }
    ]
  },
  // 留样管理台账
  {
    path: '/production-quality/laboratory/sample-retention',
    name: 'SampleRetention',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '留样管理台账' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/laboratory/SampleRetention.vue')
      }
    ]
  },
  // 检测/试验报告库
  {
    path: '/production-quality/laboratory/report-library',
    name: 'LabReportLibrary',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检测/试验报告库' },
    children: [
      {
        path: '',
        component: () => import('@/views/production-quality/laboratory/LabReportLibrary.vue')
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
  // ========================
  // 变化点管理模块 - 所有 PC 端路由
  // ========================
  {
    path: '/production-quality/change-point/dashboard',
    name: 'ChangePointDashboard',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '变化点中央看板' },
    children: [{ path: '', component: () => import('@/views/production-quality/change-point/ChangePointDashboard.vue') }]
  },
  {
    path: '/production-quality/change-point/list',
    name: 'ChangePointList',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '变化点台账与追溯' },
    children: [{ path: '', component: () => import('@/views/production-quality/change-point/ChangePointList.vue') }]
  },
  {
    path: '/production-quality/change-point/list/create',
    name: 'ChangePointCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '新增变化点申报', hideInMenu: true },
    children: [{ path: '', component: () => import('@/views/production-quality/change-point/ChangePointEdit.vue') }]
  },
  {
    path: '/production-quality/change-point/list/edit/:id',
    name: 'ChangePointEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '编辑变化点处理单', hideInMenu: true },
    children: [{ path: '', component: () => import('@/views/production-quality/change-point/ChangePointEdit.vue') }]
  },
  {
    path: '/production-quality/change-point/list/view/:id',
    name: 'ChangePointView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '查看变化点处理单', hideInMenu: true },
    children: [{ path: '', component: () => import('@/views/production-quality/change-point/ChangePointEdit.vue') }]
  },
  {
    path: '/production-quality/change-point/verification',
    name: 'VerificationCenter',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '试生产验证任务中心' },
    children: [{ path: '', component: () => import('@/views/production-quality/change-point/VerificationCenter.vue') }]
  },
  {
    path: '/production-quality/change-point/risk-matrix',
    name: 'RiskMatrixConfig',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '风险矩阵与规则配置' },
    children: [{ path: '', component: () => import('@/views/production-quality/change-point/RiskMatrixConfig.vue') }]
  },
  // ========================
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
  // 项目文档 - 统一浏览 QMS-BRD 与 QMS-PRD 文档，支持 Mermaid 渲染和 MD/PDF 导出
  {
    path: '/system/project-docs',
    name: 'ProjectDocs',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '项目文档' },
    children: [
      {
        path: '',
        component: () => import('@/views/system/ProjectDocs.vue')
      }
    ]
  },
  {
    path: '/quality-system/document-management',
    name: 'DocumentManagement',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '受控文档管理' },
    children: [
      {
        path: '',
        component: () => import('@/views/documents/DocumentManagement.vue')
      }
    ]
  },
  {
    path: '/quality-system/document-management/create',
    name: 'DocumentCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '新增文档', hideInMenu: true },
    children: [{ path: '', component: () => import('@/views/documents/DocumentEdit.vue') }]
  },
  {
    path: '/quality-system/document-management/view/:id',
    name: 'DocumentView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '查看文档', hideInMenu: true },
    children: [{ path: '', component: () => import('@/views/documents/DocumentEdit.vue') }]
  },
  {
    path: '/quality-system/document-management/edit/:id',
    name: 'DocumentEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '编辑文档', hideInMenu: true },
    children: [{ path: '', component: () => import('@/views/documents/DocumentEdit.vue') }]
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
  // 工艺路线编辑页面
  {
    path: '/basic-data/process-route/create',
    name: 'ProcessRouteCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '新增工艺路线' },
    children: [
      { path: '', component: () => import('@/views/basic-data/ProcessRouteEdit.vue') }
    ]
  },
  {
    path: '/basic-data/process-route/view/:id',
    name: 'ProcessRouteView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '查看工艺路线' },
    children: [
      { path: '', component: () => import('@/views/basic-data/ProcessRouteEdit.vue') }
    ]
  },
  {
    path: '/basic-data/process-route/edit/:id',
    name: 'ProcessRouteEditPage',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '编辑工艺路线' },
    children: [
      { path: '', component: () => import('@/views/basic-data/ProcessRouteEdit.vue') }
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
    path: '/basic-data/customer-supplier-mapping',
    name: 'CustomerSupplierMapping',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '客供关系映射' },
    children: [
      {
        path: '',
        component: () => import('@/views/basic-data/CustomerSupplierMapping.vue')
      }
    ]
  },
  {
    path: '/basic-data/csr-management',
    name: 'CsrManagement',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '顾客特殊要求(CSR)' },
    children: [
      {
        path: '',
        component: () => import('@/views/basic-data/csr-management/index.vue')
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
        redirect: '/inspection-model/defect-phenomena'
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
    path: '/inspection-model/sampling-plans',
    name: 'InspectionModelSamplingPlans',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '抽样方案管理' },
    children: [
      { path: '', component: () => import('@/views/inspection-model/SamplingPlanList.vue') }
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
    name: 'InspectionItemCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验项目-新增', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspectionItemEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/inspection-items/edit/:id',
    name: 'InspectionItemEditPage',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验项目-编辑', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspectionItemEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/inspection-items/view/:id',
    name: 'InspectionItemView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验项目-查看', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspectionItemEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/defect-causes/create',
    name: 'DefectCauseCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '不良原因-新增', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/DefectCauseEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/defect-causes/edit/:id',
    name: 'DefectCauseEditPage',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '不良原因-编辑', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/DefectCauseEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/defect-causes/view/:id',
    name: 'DefectCauseView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '不良原因-查看', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/DefectCauseEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/sampling-plans/create',
    name: 'SamplingPlanCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '抽样方案-新增', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/SamplingPlanEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/sampling-plans/edit/:id',
    name: 'SamplingPlanEditPage',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '抽样方案-编辑', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/SamplingPlanEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/sampling-plans/view/:id',
    name: 'SamplingPlanView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '抽样方案-查看', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/SamplingPlanEdit.vue') }
    ]
  },


  // ─── 检验方案（原 insp-plans → 重命名为 insp-schemes）─────────────
  {
    path: '/inspection-model/insp-schemes',
    name: 'InspectionModelInspSchemes',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方案管理' },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspPlanList.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-schemes/create',
    name: 'InspectionModelInspSchemeCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方案-新增', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspSchemeEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-schemes/edit/:id',
    name: 'InspectionModelInspSchemeEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方案-编辑', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspSchemeEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-schemes/view/:id',
    name: 'InspectionModelInspSchemeView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验方案-查看', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspSchemeEdit.vue') }
    ]
  },

  // ─── 检验计划模型（全新模块）──────────────────────────────────
  {
    path: '/inspection-model/insp-plan-model',
    name: 'InspPlanModelList',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验计划模型' },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspPlanModelList.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-plan-model/create',
    name: 'InspPlanModelCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验计划-新增', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspPlanModelEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-plan-model/edit/:id',
    name: 'InspPlanModelEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验计划-编辑', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspPlanModelEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-plan-model/view/:id',
    name: 'InspPlanModelView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验计划-查看', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspPlanModelEdit.vue') }
    ]
  },

  // 检验模板管理
  {
    path: '/inspection-model/insp-templates',
    name: 'InspectionModelInspTemplates',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验模板管理' },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspTemplateList.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-templates/create',
    name: 'InspectionModelInspTemplateCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验模板-新增', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspTemplateEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-templates/edit/:id',
    name: 'InspectionModelInspTemplateEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验模板-编辑', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspTemplateEdit.vue') }
    ]
  },
  {
    path: '/inspection-model/insp-templates/view/:id',
    name: 'InspectionModelInspTemplateView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '检验模板-查看', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/InspTemplateEdit.vue') }
    ]
  },
  // 物料档案编辑页面
  {
    path: '/basic-data/material/create',
    name: 'MaterialProductCreate',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '新增物料' },
    children: [
      { path: '', component: () => import('@/views/basic-data/MaterialProductEdit.vue') }
    ]
  },
  {
    path: '/basic-data/material/view/:id',
    name: 'MaterialProductView',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '查看物料' },
    children: [
      { path: '', component: () => import('@/views/basic-data/MaterialProductEdit.vue') }
    ]
  },
  {
    path: '/basic-data/material/edit/:id',
    name: 'MaterialProductEdit',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '编辑物料' },
    children: [
      { path: '', component: () => import('@/views/basic-data/MaterialProductEdit.vue') }
    ]
  },

  // 量检具台账管理
  {
    path: '/inspection-model/gauge-ledgers',
    name: 'GaugeLedgerList',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '量检具台账' },
    children: [
      { path: '', component: () => import('@/views/inspection-model/GaugeLedgerList.vue') }
    ]
  },
  {
    path: '/inspection-model/gauge-ledgers/:id',
    name: 'GaugeLedgerDetail',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '量检具详情', hideInMenu: true },
    children: [
      { path: '', component: () => import('@/views/inspection-model/GaugeLedgerDetail.vue') }
    ]
  },
  // 检验任务触发模拟器
  {
    path: '/system/task-trigger-simulator',
    name: 'TaskTriggerSimulator',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '触发模拟器' },
    children: [
      { path: '', component: () => import('@/views/system/TaskTriggerSimulator.vue') }
    ]
  },
  // 检验任务触发日志
  {
    path: '/system/task-trigger-log',
    name: 'TaskTriggerLog',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { title: '任务触发日志' },
    children: [
      { path: '', component: () => import('@/views/system/TaskTriggerLog.vue') }
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
