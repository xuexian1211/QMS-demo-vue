# 舜富QMS系统 - API接口设计规范

## 1. API设计总览

### 1.1 API架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway层                             │
├─────────────────────────────────────────────────────────────────┤
│  - 统一入口  - 认证授权  - 限流熔断  - 日志审计  - 协议转换       │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                       微服务API层                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ APQP     │ │ 变化点   │ │ CAPA     │ │ QRQC     │           │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 检验系统 │ │ MSA/SPC  │ │ 审核管理 │ │ 报表中心 │           │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      外部系统集成层                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ ERP     │ │ MES     │ │ SRM     │ │ WMS     │ │ CRM     │   │
│  │ System  │ │ System  │ │ System  │ │ System  │ │ System  │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 API规范标准

#### 1.2.1 RESTful API设计原则

| 设计原则 | 说明 |
|---------|------|
| 资源导向 | URL代表资源,使用名词复数形式 |
| HTTP方法 | GET(查询), POST(创建), PUT(更新), DELETE(删除) |
| 状态码 | 使用标准HTTP状态码 |
| 版本控制 | URL路径版本控制 `/api/v1/` |
| 统一响应 | 统一的响应数据格式 |
| 分页查询 | 统一分页参数 |

#### 1.2.2 API命名规范

```
资源路径格式: /api/{version}/{module}/{resource}

示例:
- GET    /api/v1/users           # 获取用户列表
- GET    /api/v1/users/{id}     # 获取单个用户
- POST   /api/v1/users           # 创建用户
- PUT    /api/v1/users/{id}     # 更新用户
- DELETE /api/v1/users/{id}     # 删除用户

子资源示例:
- GET    /api/v1/users/{id}/roles           # 获取用户的角色列表
- POST   /api/v1/users/{id}/roles/{roleId}  # 给用户分配角色
```

#### 1.2.3 统一响应格式

```json
// 成功响应
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 业务数据
  },
  "timestamp": 1706722800000,
  "traceId": "abc123def456"
}

// 列表响应
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  },
  "timestamp": 1706722800000,
  "traceId": "abc123def456"
}

// 错误响应
{
  "code": 400,
  "message": "参数验证失败",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "username",
        "message": "用户名不能为空"
      }
    ]
  },
  "timestamp": 1706722800000,
  "traceId": "abc123def456"
}
```

#### 1.2.4 统一分页参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码,默认1 |
| pageSize | Integer | 否 | 每页数量,默认20,最大100 |
| sortBy | String | 否 | 排序字段 |
| sortOrder | String | 否 | 排序方向(ASC/DESC),默认DESC |

#### 1.2.5 HTTP状态码定义

| 状态码 | 说明 | 使用场景 |
|--------|------|---------|
| 200 | OK | 成功 |
| 201 | Created | 创建成功 |
| 204 | No Content | 删除成功 |
| 400 | Bad Request | 参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 业务验证失败 |
| 429 | Too Many Requests | 限流 |
| 500 | Internal Server Error | 服务器错误 |
| 503 | Service Unavailable | 服务不可用 |

---

## 2. 核心业务API接口

### 2.1 认证授权API

#### 2.1.1 用户登录

```
POST /api/v1/auth/login

请求体:
{
  "username": "admin",
  "password": "hashed_password",
  "clientType": "WEB",
  "captcha": "abcd"
}

响应:
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 7200,
    "userInfo": {
      "userId": 1,
      "username": "admin",
      "realName": "管理员",
      "departmentName": "质量部",
      "position": "质量经理",
      "avatar": "/api/v1/files/avatar/1.jpg",
      "roles": ["QUALITY_MANAGER", "ADMIN"]
    }
  }
}
```

#### 2.1.2 刷新Token

```
POST /api/v1/auth/refresh

请求体:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

响应:
{
  "code": 200,
  "message": "Token刷新成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200
  }
}
```

#### 2.1.3 获取用户权限

```
GET /api/v1/auth/permissions

响应:
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "menus": [
      {
        "id": 1,
        "menuName": "首页",
        "menuCode": "DASHBOARD",
        "icon": "dashboard",
        "path": "/dashboard",
        "parentId": null,
        "sortOrder": 1,
        "children": []
      }
    ],
    "permissions": [
      "user:view",
      "user:create",
      "user:update",
      "user:delete"
    ],
    "dataPermissions": {
      "type": "DEPT_AND_CHILD",
      "deptIds": [1, 2, 3]
    }
  }
}
```

---

### 2.2 变化点管理API

#### 2.2.1 创建变化点

```
POST /api/v1/change-points

请求体:
{
  "changeTitle": "铝压铸模具更换",
  "changeType": "MACHINE",
  "changeSubType": "MOLD_CHANGE",
  "changeSource": "INTERNAL_IMPROVEMENT",
  "departmentId": 1,
  "plannedChangeDate": "2025-02-01",
  "changeCategory": "MAJOR",
  "changeDescription": "由于模具寿命到期,需要更换新的铝压铸模具",
  "changeReason": "当前模具已达到50万次压铸寿命,需要更换以保证产品质量",
  "changePlan": "1. 停机拆卸旧模具\n2. 安装新模具\n3. 调试参数\n4. 试生产\n5. 质量验证",
  "verificationPlan": "首件检验+前50件全检+后续正常抽样",
  "affectedProducts": [
    {
      "productId": 1001,
      "productName": "变速箱壳体"
    }
  ],
  "affectedProcesses": [
    {
      "processId": "P001",
      "processName": "铝压铸"
    }
  ]
}

响应:
{
  "code": 200,
  "message": "变化点创建成功",
  "data": {
    "changeId": 10001,
    "changeNumber": "CP202501001",
    "changeStatus": "DRAFT",
    "createdTime": "2025-01-16T10:30:00Z"
  }
}
```

#### 2.2.2 查询变化点列表

```
GET /api/v1/change-points?page=1&pageSize=20&status=APPROVED&changeType=MACHINE

响应:
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "items": [
      {
        "changeId": 10001,
        "changeNumber": "CP202501001",
        "changeTitle": "铝压铸模具更换",
        "changeType": "MACHINE",
        "changeCategory": "MAJOR",
        "changeStatus": "APPROVED",
        "riskLevel": "MEDIUM",
        "requesterName": "张三",
        "requestDate": "2025-01-15T08:00:00Z",
        "plannedChangeDate": "2025-02-01",
        "costImpact": 50000.00
      }
    ],
    "total": 156,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

#### 2.2.3 变化点审批

```
POST /api/v1/change-points/{changeId}/approval

请求体:
{
  "approvalNode": "DEPT_MANAGER",
  "approvalDecision": "APPROVED",
  "approvalComment": "同意实施,注意做好质量验证"
}

响应:
{
  "code": 200,
  "message": "审批成功",
  "data": {
    "approvalId": 5001,
    "changeId": 10001,
    "approvalStatus": "APPROVED",
    "approvalTime": "2025-01-16T14:00:00Z"
  }
}
```

#### 2.2.4 变化点影响分析

```
POST /api/v1/change-points/{changeId}/impact-analysis

请求体:
{
  "analyses": [
    {
      "impactType": "QUALITY",
      "impactDescription": "新模具前50件可能出现尺寸不稳定",
      "severity": "MEDIUM",
      "probability": "OCCASIONAL",
      "mitigationMeasures": "前50件全检,连续10件合格后转为正常抽样",
      "responsiblePersonId": 1001,
      "targetDate": "2025-02-02"
    },
    {
      "impactType": "COST",
      "impactDescription": "新模具采购成本50万,安装调试成本2万",
      "severity": "HIGH",
      "probability": "CERTAIN",
      "mitigationMeasures": "计入年度预算",
      "responsiblePersonId": 2001,
      "targetDate": "2025-01-20"
    }
  ]
}

响应:
{
  "code": 200,
  "message": "影响分析创建成功",
  "data": {
    "analysisCount": 2,
    "highRiskCount": 1,
    "mediumRiskCount": 1
  }
}
```

---

### 2.3 CAPA管理API

#### 2.3.1 创建CAPA

```
POST /api/v1/capa

请求体:
{
  "capaType": "CORRECTIVE",
  "sourceType": "CUSTOMER_COMPLAINT",
  "sourceId": 8001,
  "sourceNumber": "CC202501001",
  "problemDescription": "客户投诉变速箱壳体存在气孔缺陷,不良率达到15%",
  "problemCategory": "PRODUCT_QUALITY",
  "severity": "HIGH",
  "priority": "URGENT",
  "targetCompletionDate": "2025-02-15"
}

响应:
{
  "code": 200,
  "message": "CAPA创建成功",
  "data": {
    "capaId": 60001,
    "capaNumber": "CAPA202501001",
    "capaStatus": "OPEN",
    "createdTime": "2025-01-16T10:00:00Z"
  }
}
```

#### 2.3.2 创建5Why分析

```
POST /api/v1/capa/{capaId}/five-why-analysis

请求体:
{
  "analyses": [
    {
      "analysisOrder": 1,
      "question": "为什么变速箱壳体出现气孔缺陷?",
      "answer": "压铸过程中模具排气不畅",
      "verificationMethod": "检查模具排气槽",
      "isRootCause": false
    },
    {
      "analysisOrder": 2,
      "question": "为什么模具排气不畅?",
      "answer": "排气槽被铝渣堵塞",
      "verificationMethod": "拆模检查",
      "isRootCause": false
    },
    {
      "analysisOrder": 3,
      "question": "为什么排气槽会被铝渣堵塞?",
      "answer": "压铸温度过高,导致铝液飞溅",
      "verificationMethod": "对比不同温度下的压铸质量",
      "isRootCause": false
    },
    {
      "analysisOrder": 4,
      "question": "为什么压铸温度过高?",
      "answer": "温度传感器故障,显示温度比实际温度低50度",
      "verificationMethod": "用红外测温仪实际测量",
      "isRootCause": true
    },
    {
      "analysisOrder": 5,
      "question": "为什么温度传感器故障?",
      "answer": "传感器未按计划进行校准",
      "verificationMethod": "检查校准记录",
      "isRootCause": true
    }
  ]
}

响应:
{
  "code": 200,
  "message": "5Why分析创建成功",
  "data": {
    "analysisId": 7001,
    "rootCauseIdentified": true,
    "rootCauseDescription": "温度传感器未按时校准导致故障,进而引起压铸温度过高,铝液飞溅堵塞排气槽"
  }
}
```

#### 2.3.3 创建纠正措施

```
POST /api/v1/capa/{capaId}/corrective-actions

请求体:
{
  "actionDescription": "更换故障温度传感器",
  "actionType": "PERMANENT",
  "objective": "恢复准确的温度监控",
  "targetDate": "2025-01-17",
  "responsiblePersonId": 1001,
  "departmentId": 3,
  "requiredResources": "备用温度传感器1台",
  "budget": 5000.00
}

响应:
{
  "code": 200,
  "message": "纠正措施创建成功",
  "data": {
    "correctiveId": 8001,
    "actionNumber": "CA202501001-001",
    "actionStatus": "PENDING",
    "createdTime": "2025-01-16T11:00:00Z"
  }
}
```

#### 2.3.4 CAPA有效性验证

```
POST /api/v1/capa/{capaId}/effectiveness-verification

请求体:
{
  "verificationType": "MONITORING",
  "verificationPeriodStart": "2025-01-17",
  "verificationPeriodEnd": "2025-02-15",
  "verificationMethod": "监控变速箱壳体气孔不良率",
  "verificationCriteria": "连续4周不良率低于0.5%",
  "dataCollected": {
    "week1": 0.3,
    "week2": 0.2,
    "week3": 0.1,
    "week4": 0.15
  },
  "analysisResult": "4周平均不良率0.1875%,远低于目标0.5%,措施有效"
}

响应:
{
  "code": 200,
  "message": "有效性验证创建成功",
  "data": {
    "verificationId": 9001,
    "effectivenessScore": 96.25,
    "effectivenessLevel": "EXCELLENT",
    "followUpRequired": false
  }
}
```

---

### 2.4 QRQC快速响应API

#### 2.4.1 创建QRQC事件

```
POST /api/v1/qrqc/events

请求体:
{
  "eventType": "QUALITY_ISSUE",
  "severity": "HIGH",
  "detectionTime": "2025-01-16T09:30:00Z",
  "detectionLocation": "铝压铸车间A线",
  "detectionPersonId": 1001,
  "detectionDepartmentId": 4,
  "eventDescription": "A线压铸变速箱壳体发现批量气孔缺陷,已生产500件,抽样20件发现8件不合格",
  "immediateImpact": "可能导致客户交付延迟",
  "affectedProduct": "变速箱壳体",
  "affectedBatch": "BATCH20250116-001",
  "affectedQuantity": 500,
  "customerId": 101,
  "workOrderId": "WO20250116-001",
  "processStep": "铝压铸"
}

响应:
{
  "code": 200,
  "message": "QRQC事件创建成功",
  "data": {
    "eventId": 100001,
    "eventNumber": "QRQC20250116001",
    "qrqcStatus": "OPEN",
    "responseTargetTime": "2025-01-16T13:30:00Z", // 4小时内组建团队
    "containmentTargetTime": "2025-01-17T09:30:00Z" // 24小时内完成围堵
  }
}
```

#### 2.4.2 QRQC团队组建

```
POST /api/v1/qrqc/events/{eventId}/team

请求体:
{
  "teamName": "变速箱壳体气孔问题QRQC团队",
  "teamLeaderId": 1001,
  "formationTime": "2025-01-16T11:00:00Z",
  "teamMembers": [
    {
      "userId": 1001,
      "role": "LEADER",
      "responsibility": "团队负责人,统筹协调",
      "contactPhone": "13800138001"
    },
    {
      "userId": 2001,
      "role": "QUALITY",
      "responsibility": "质量分析,问题诊断",
      "contactPhone": "13800138002"
    },
    {
      "userId": 3001,
      "role": "ENGINEERING",
      "responsibility": "工艺分析,技术支持",
      "contactPhone": "13800138003"
    },
    {
      "userId": 4001,
      "role": "PRODUCTION",
      "responsibility": "生产协调,围堵实施",
      "contactPhone": "13800138004"
    }
  ],
  "meetingLocation": "质量部会议室1",
  "meetingTime": "2025-01-16T11:30:00Z"
}

响应:
{
  "code": 200,
  "message": "QRQC团队组建成功",
  "data": {
    "teamId": 50001,
    "teamSize": 4,
    "status": "ACTIVE"
  }
}
```

#### 2.4.3 QRQC现场调查

```
POST /api/v1/qrqc/events/{eventId}/investigation

请求体:
{
  "investigationDate": "2025-01-16T12:00:00Z",
  "investigatorId": 2001,
  "investigationLocation": "铝压铸车间A线",
  "investigationType": "ON_SITE",
  "findings": "1. 检查A线温度传感器发现显示温度异常\n2. 检查模具发现排气槽严重堵塞\n3. 与操作员交流得知温度传感器已报警但未处理",
  "evidenceCollected": [
    "温度传感器读数记录.pdf",
    "模具照片.jpg",
    "不良品照片.jpg"
  ],
  "witnesses": [
    {
      "name": "操作工李四",
      "statement": "早上8点温度传感器报警,但为了赶产量继续生产"
    }
  ],
  "preliminaryCause": "温度传感器故障导致压铸温度过高,铝液飞溅堵塞排气槽",
  "nextSteps": "立即更换温度传感器,清理模具排气槽,隔离已生产批次"
}

响应:
{
  "code": 200,
  "message": "现场调查记录创建成功",
  "data": {
    "investigationId": 60001,
    "status": "COMPLETED",
    "createdTime": "2025-01-16T12:30:00Z"
  }
}
```

#### 2.4.4 QRQC围堵措施

```
POST /api/v1/qrqc/events/{eventId}/containment

请求体:
{
  "containmentDescription": "隔离BATCH20250116-001批次产品,进行100%检验,将不合格品返工或报废",
  "containmentType": "INSPECTION",
  "affectedProduct": "变速箱壳体",
  "affectedBatch": "BATCH20250116-001",
  "affectedQuantity": 500,
  "quarantineLocation": "待检区C区",
  "inspectionMethod": "全检,重点检查气孔缺陷",
  "sampleSize": 500,
  "inspectedQuantity": 500,
  "nonconformingQuantity": 75,
  "responsiblePersonId": 1001,
  "plannedDate": "2025-01-16",
  "actualDate": "2025-01-16"
}

响应:
{
  "code": 200,
  "message": "围堵措施创建成功",
  "data": {
    "containmentId": 70001,
    "containmentStatus": "COMPLETED",
    "nonconformingRate": 15.0,
    "createdTime": "2025-01-16T15:00:00Z"
  }
}
```

#### 2.4.5 QRQC24小时响应跟踪

```
GET /api/v1/qrqc/events/{eventId}/24h-tracking

响应:
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "eventId": 100001,
    "eventNumber": "QRQC20250116001",
    "tracking": [
      {
        "trackingId": 80001,
        "milestone": "REPORTING_1H",
        "plannedTime": "2025-01-16T10:30:00Z",
        "actualTime": "2025-01-16T10:15:00Z",
        "status": "ACHIEVED",
        "responsiblePersonName": "张三"
      },
      {
        "trackingId": 80002,
        "milestone": "TEAM_ASSEMBLY_4H",
        "plannedTime": "2025-01-16T13:30:00Z",
        "actualTime": "2025-01-16T11:00:00Z",
        "status": "ACHIEVED",
        "responsiblePersonName": "张三"
      },
      {
        "trackingId": 80003,
        "milestone": "INVESTIGATION_12H",
        "plannedTime": "2025-01-16T21:30:00Z",
        "actualTime": "2025-01-16T12:30:00Z",
        "status": "ACHIEVED",
        "responsiblePersonName": "李四"
      },
      {
        "trackingId": 80004,
        "milestone": "CONTAINMENT_24H",
        "plannedTime": "2025-01-17T09:30:00Z",
        "actualTime": null,
        "status": "PENDING",
        "responsiblePersonName": "张三"
      }
    ],
    "overallStatus": "IN_PROGRESS",
    "completedMilestones": 3,
    "totalMilestones": 4,
    "completionRate": 75.0
  }
}
```

---

## 3. 外部系统集成API

### 3.1 ERP系统集成API

#### 3.1.1 同步物料主数据

```
POST /api/v1/integration/erp/sync-materials

请求体:
{
  "syncType": "FULL", // FULL: 全量同步, INCREMENTAL: 增量同步
  "syncDate": "2025-01-16",
  "materialCodes": ["MAT001", "MAT002", "MAT003"]
}

响应:
{
  "code": 200,
  "message": "同步成功",
  "data": {
    "syncBatchId": "SYNC20250116001",
    "startTime": "2025-01-16T10:00:00Z",
    "endTime": "2025-01-16T10:05:00Z",
    "totalRecords": 1000,
    "successCount": 998,
    "failedCount": 2,
    "failedRecords": [
      {
        "materialCode": "MAT500",
        "errorMessage": "物料编码格式错误"
      },
      {
        "materialCode": "MAT999",
        "errorMessage": "物料不存在于ERP中"
      }
    ],
    "successRate": 99.8
  }
}
```

#### 3.1.2 同步客户主数据

```
POST /api/v1/integration/erp/sync-customers

请求体:
{
  "syncType": "INCREMENTAL",
  "lastSyncTime": "2025-01-15T00:00:00Z"
}

响应:
{
  "code": 200,
  "message": "同步成功",
  "data": {
    "syncBatchId": "SYNC20250116002",
    "startTime": "2025-01-16T10:10:00Z",
    "endTime": "2025-01-16T10:12:00Z",
    "totalRecords": 50,
    "successCount": 50,
    "failedCount": 0,
    "successRate": 100.0
  }
}
```

#### 3.1.3 推送检验结果到ERP

```
POST /api/v1/integration/erp/push-inspection-results

请求体:
{
  "inspectionLotNumber": "IL20250116-001",
  "materialCode": "MAT001",
  "batchNumber": "BATCH20250116-001",
  "inspectionDate": "2025-01-16",
  "inspectionResult": "ACCEPT",
  "inspectorId": 1001,
  "inspectorName": "张三",
  "quantityInspected": 500,
  "nonconformingQuantity": 10,
  "defectDetails": [
    {
      "defectCode": "D001",
      "defectName": "气孔",
      "quantity": 8
    },
    {
      "defectCode": "D002",
      "defectName": "飞边",
      "quantity": 2
    }
  ]
}

响应:
{
  "code": 200,
  "message": "推送成功",
  "data": {
    "erpInspectionId": "ERP_INS20250116001",
    "pushTime": "2025-01-16T15:00:00Z",
    "status": "SUCCESS"
  }
}
```

---

### 3.2 MES系统集成API

#### 3.2.1 获取工单信息

```
GET /api/v1/integration/mes/work-order/{workOrderId}

响应:
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "workOrderId": "WO20250116-001",
    "workOrderType": "NORMAL",
    "materialId": 1001,
    "materialCode": "MAT001",
    "materialName": "变速箱壳体",
    "planQuantity": 1000,
    "actualQuantity": 850,
    "status": "IN_PROGRESS",
    "startTime": "2025-01-16T08:00:00Z",
    "estimatedEndTime": "2025-01-16T16:00:00Z",
    "productionLine": "A线",
    "equipmentId": "EQ001",
    "operatorId": 4001,
    "batchNumbers": ["BATCH20250116-001", "BATCH20250116-002"]
  }
}
```

#### 3.2.2 接收生产过程参数

```
POST /api/v1/integration/mes/receive-process-params

请求体:
{
  "equipmentId": "EQ001",
  "processStep": "铝压铸",
  "timestamp": "2025-01-16T14:30:00Z",
  "parameters": [
    {
      "parameterName": "压射压力",
      "parameterValue": 85.5,
      "unit": "MPa",
      "minThreshold": 75.0,
      "maxThreshold": 95.0,
      "isAbnormal": false
    },
    {
      "parameterName": "压射速度",
      "parameterValue": 2.5,
      "unit": "m/s",
      "minThreshold": 2.0,
      "maxThreshold": 3.0,
      "isAbnormal": false
    },
    {
      "parameterName": "模具温度",
      "parameterValue": 220.0,
      "unit": "°C",
      "minThreshold": 200.0,
      "maxThreshold": 240.0,
      "isAbnormal": false
    },
    {
      "parameterName": "铝液温度",
      "parameterValue": 680.0,
      "unit": "°C",
      "minThreshold": 650.0,
      "maxThreshold": 700.0,
      "isAbnormal": false
    }
  ],
  "batchNumber": "BATCH20250116-001",
  "workOrderId": "WO20250116-001",
  "operatorId": 4001
}

响应:
{
  "code": 200,
  "message": "接收成功",
  "data": {
    "receiveBatchId": "MES20250116001",
    "receiveTime": "2025-01-16T14:30:05Z",
    "status": "SUCCESS"
  }
}
```

#### 3.2.3 推送质量异常到MES

```
POST /api/v1/integration/mes/push-quality-alert

请求体:
{
  "alertType": "QUALITY_ANOMALY",
  "alertLevel": "HIGH",
  "alertTime": "2025-01-16T14:35:00Z",
  "equipmentId": "EQ001",
  "processStep": "铝压铸",
  "workOrderId": "WO20250116-001",
  "batchNumber": "BATCH20250116-001",
  "alertDescription": "连续3件产品检测到气孔缺陷,建议停机检查",
  "recommendation": "1. 停止生产\n2. 检查温度传感器\n3. 检查模具排气槽\n4. 通知QRQC团队",
  "affectedProducts": [
    {
      "serialNumber": "SN20250116-0001",
      "batchNumber": "BATCH20250116-001",
      "defectType": "气孔"
    }
  ],
  "reportedBy": 2001,
  "qrqcEventId": 100001
}

响应:
{
  "code": 200,
  "message": "推送成功",
  "data": {
    "mesAlertId": "MES_ALERT20250116001",
    "pushTime": "2025-01-16T14:35:05Z",
    "status": "SUCCESS"
  }
}
```

---

### 3.3 WMS系统集成API

#### 3.3.1 获取批次信息

```
GET /api/v1/integration/wms/batch/{batchNumber}

响应:
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "batchNumber": "BATCH20250116-001",
    "materialId": 1001,
    "materialCode": "MAT001",
    "materialName": "变速箱壳体",
    "quantity": 500,
    "unit": "件",
    "productionDate": "2025-01-16",
    "productionOrderId": "PO20250116-001",
    "qualityStatus": "PENDING_INSPECTION",
    "warehouseLocation": "待检区C区",
    "inspectorId": 1001,
    "inspectionDate": "2025-01-16T15:00:00Z",
    "status": "QUARANTINED"
  }
}
```

#### 3.3.2 更新批次质量状态

```
PUT /api/v1/integration/wms/batch/{batchNumber}/quality-status

请求体:
{
  "qualityStatus": "ACCEPTED",
  "inspectionLotNumber": "IL20250116-001",
  "inspectionResult": "ACCEPT",
  "acceptedQuantity": 490,
  "rejectedQuantity": 10,
  "reworkQuantity": 0,
  "scrapQuantity": 10,
  "verifiedBy": 1001,
  "verifiedTime": "2025-01-16T16:00:00Z",
  "remarks": "10件气孔缺陷报废,其余合格"
}

响应:
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "batchNumber": "BATCH20250116-001",
    "previousStatus": "PENDING_INSPECTION",
    "newStatus": "ACCEPTED",
    "updateTime": "2025-01-16T16:00:05Z"
  }
}
```

---

### 3.4 CRM系统集成API

#### 3.4.1 接收客户投诉

```
POST /api/v1/integration/crm/receive-complaint

请求体:
{
  "complaintNumber": "CRM_CC20250116001",
  "customerId": 101,
  "customerName": "某某汽车公司",
  "contactPerson": "质量经理王五",
  "contactPhone": "13900139001",
  "complaintDate": "2025-01-15T14:00:00Z",
  "productCode": "MAT001",
  "productName": "变速箱壳体",
  "batchNumber": "BATCH20250115-001",
  "complaintType": "PRODUCT_QUALITY",
  "severity": "HIGH",
  "complaintDescription": "我司在装配过程中发现变速箱壳体存在气孔缺陷,不良率15%,严重影响装配进度,请立即处理",
  "attachments": ["defect_photo_1.jpg", "defect_photo_2.jpg"],
  "requiredResponseTime": "2025-01-16T14:00:00Z"
}

响应:
{
  "code": 200,
  "message": "接收成功",
  "data": {
    "qmsComplaintId": 8001,
    "complaintNumber": "CC20250115001",
    "complaintStatus": "OPEN",
    "receiveTime": "2025-01-16T08:00:00Z",
    "qrqcEventId": 100001,
    "capaId": 60001
  }
}
```

#### 3.4.2 推送投诉处理结果

```
POST /api/v1/integration/crm/push-complaint-result

请求体:
{
  "crmComplaintNumber": "CRM_CC20250116001",
  "qmsComplaintId": 8001,
  "qmsComplaintNumber": "CC20250115001",
  "rootCause": "温度传感器未按时校准导致故障,压铸温度过高,铝液飞溅堵塞模具排气槽",
  "correctiveActions": [
    "更换故障温度传感器",
    "清理模具排气槽",
    "重新校准温度传感器"
  ],
  "preventiveActions": [
    "建立温度传感器定期校准计划",
    "增加设备点检频率",
    "建立温度异常停机机制"
  ],
  "compensationPlan": "不合格品返工或报废,免费补发合格品",
  "estimatedCompletionDate": "2025-01-20",
  "responsiblePersonName": "张三",
  "contactPhone": "13800138001",
  "status": "IN_PROGRESS"
}

响应:
{
  "code": 200,
  "message": "推送成功",
  "data": {
    "crmResponseId": "CRM_RESP20250116001",
    "pushTime": "2025-01-16T17:00:00Z",
    "status": "SUCCESS"
  }
}
```

---

## 4. 文件管理API

### 4.1 文件上传

```
POST /api/v1/files/upload
Content-Type: multipart/form-data

表单参数:
- file: 文件
- category: 文件类别 (DOCUMENT, IMAGE, VIDEO, DRAWING)
- module: 所属模块 (CHANGE_POINT, CAPA, QRQC, INSPECTION, etc.)
- businessId: 业务ID
- description: 文件描述

响应:
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "fileId": "F20250116001",
    "fileName": "defect_photo_1.jpg",
    "filePath": "/files/2025/01/16/F20250116001.jpg",
    "fileSize": 2048576,
    "fileType": "image/jpeg",
    "uploadTime": "2025-01-16T10:00:00Z",
    "fileUrl": "https://qms.shunfu.com/api/v1/files/F20250116001"
  }
}
```

### 4.2 文件下载

```
GET /api/v1/files/{fileId}/download

响应:
二进制文件流
```

### 4.3 文件预览

```
GET /api/v1/files/{fileId}/preview

响应:
- 图片: 返回图片二进制流
- PDF: 返回PDF预览URL
- 文档: 返回在线预览页面URL
```

---

## 5. 报表与导出API

### 5.1 导出Excel报表

```
POST /api/v1/reports/export/excel

请求体:
{
  "reportType": "INSPECTION_SUMMARY",
  "reportName": "检验汇总报表",
  "queryConditions": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "departmentId": 1,
    "materialCode": "MAT001"
  },
  "columns": [
    {
      "field": "inspectionDate",
      "title": "检验日期",
      "width": 120
    },
    {
      "field": "materialCode",
      "title": "物料编码",
      "width": 120
    },
    {
      "field": "batchNumber",
      "title": "批次号",
      "width": 150
    },
    {
      "field": "inspectionResult",
      "title": "检验结果",
      "width": 100
    }
  ]
}

响应:
{
  "code": 200,
  "message": "导出成功",
  "data": {
    "taskId": "EXPORT20250116001",
    "status": "PROCESSING",
    "downloadUrl": null,
    "estimatedTime": 30
  }
}

// 查询导出任务状态
GET /api/v1/reports/export/task/{taskId}

响应:
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "taskId": "EXPORT20250116001",
    "status": "COMPLETED",
    "downloadUrl": "https://qms.shunfu.com/api/v1/reports/download/EXPORT20250116001",
    "fileName": "检验汇总报表_20250101-20250131.xlsx",
    "fileSize": 1048576,
    "createTime": "2025-01-16T10:00:00Z",
    "completeTime": "2025-01-16T10:00:30Z"
  }
}
```

---

## 6. 消息通知API

### 6.1 创建消息通知

```
POST /api/v1/notifications

请求体:
{
  "notificationType": "CHANGE_POINT_APPROVAL",
  "title": "变化点待审批",
  "content": "您有一个变化点(CP202501001)需要审批,请及时处理",
  "priority": "HIGH",
  "targetUsers": [1001, 1002],
  "targetRoles": ["QUALITY_MANAGER", "DEPT_MANAGER"],
  "businessType": "CHANGE_POINT",
  "businessId": 10001,
  "actionUrl": "/change-points/10001/approval",
  "expireTime": "2025-01-17T10:00:00Z"
}

响应:
{
  "code": 200,
  "message": "通知创建成功",
  "data": {
    "notificationId": 90001,
    "sentTime": "2025-01-16T10:00:00Z",
    "targetUserCount": 2,
    "sentChannels": ["SYSTEM", "EMAIL", "SMS"]
  }
}
```

### 6.2 查询消息列表

```
GET /api/v1/notifications?page=1&pageSize=20&status=UNREAD&priority=HIGH

响应:
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "items": [
      {
        "notificationId": 90001,
        "notificationType": "CHANGE_POINT_APPROVAL",
        "title": "变化点待审批",
        "content": "您有一个变化点(CP202501001)需要审批,请及时处理",
        "priority": "HIGH",
        "readStatus": "UNREAD",
        "createTime": "2025-01-16T10:00:00Z",
        "actionUrl": "/change-points/10001/approval",
        "businessType": "CHANGE_POINT",
        "businessId": 10001
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

## 7. API安全策略

### 7.1 认证机制

| 认证方式 | 使用场景 | 说明 |
|---------|---------|------|
| JWT Token | 所有API调用 | 访问令牌,有效期2小时 |
| Refresh Token | 刷新访问令牌 | 有效期7天 |
| API Key | 系统间集成 | 固定密钥,用于ERP/MES等系统调用 |

### 7.2 签名验证

对于关键API,使用签名验证:

```
签名算法: HMAC-SHA256
签名参数: timestamp + requestId + requestBody (按字典序排序)
签名密钥: 每个系统分配独立密钥

签名生成:
signature = HMAC-SHA256(apiSecret, timestamp + requestId + sortedParams)
```

### 7.3 限流策略

| 限流维度 | 限制策略 | 说明 |
|---------|---------|------|
| IP限流 | 1000次/分钟 | 防止恶意攻击 |
| 用户限流 | 100次/分钟 | 防止滥用 |
| 系统限流 | 10000次/分钟 | 整体负载保护 |

### 7.4 权限控制

```
权限控制模型: RBAC + 数据权限

API注解示例:
@PreAuthorize("hasRole('QUALITY_MANAGER')")
@PreAuthorize("hasPermission(#changeId, 'CHANGE_POINT_APPROVE')")
@DataPermission(scopeType = "DEPT_AND_CHILD", deptIdField = "departmentId")
```

---

## 8. API文档规范

### 8.1 OpenAPI 3.0规范

所有API遵循OpenAPI 3.0规范,自动生成API文档。

```
访问地址: https://qms.shunfu.com/api/docs
Swagger UI: https://qms.shunfu.com/api/swagger-ui.html
```

### 8.2 API版本控制

采用URL路径版本控制:

```
/api/v1/... - 当前版本
/api/v2/... - 未来版本
```

版本兼容性策略:
- v1版本至少维护1年
- v2版本必须向后兼容v1的核心API
- 废弃API提前3个月通知

---

## 9. API测试规范

### 9.1 单元测试

所有API必须编写单元测试:

```java
@SpringBootTest
@AutoConfigureMockMvc
class ChangePointControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testCreateChangePoint() throws Exception {
        mockMvc.perform(post("/api/v1/change-points")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                {
                    "changeTitle": "铝压铸模具更换",
                    "changeType": "MACHINE",
                    "changeDescription": "测试变化点"
                }
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.changeNumber").exists());
    }
}
```

### 9.2 集成测试

关键业务流程编写集成测试:

```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class QRQCFastResponseTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testQRQCCompleteFlow() throws Exception {
        // 1. 创建QRQC事件
        // 2. 组建团队
        // 3. 现场调查
        // 4. 实施围堵
        // 5. 验证24小时响应
    }
}
```

---

## 10. API监控与告警

### 10.1 监控指标

| 指标 | 阈值 | 告警级别 |
|-----|------|---------|
| 响应时间 | >3秒 | WARNING |
| 响应时间 | >10秒 | CRITICAL |
| 错误率 | >1% | WARNING |
| 错误率 | >5% | CRITICAL |
| QPS | >1000 | WARNING |
| QPS | >5000 | CRITICAL |

### 10.2 日志记录

所有API调用记录详细日志:

```
日志级别: INFO
日志格式: [timestamp] [traceId] [userId] [method] [url] [params] [responseCode] [duration]
日志存储: Elasticsearch + Kibana
日志保留: 90天
```

---

## 总结

本API设计规范为舜富QMS系统提供了完整的接口定义,包括:

1. **认证授权**: 登录、Token刷新、权限获取
2. **核心业务**: 变化点、CAPA、QRQC等11个核心模块的完整API
3. **系统集成**: ERP/MES/SRM/WMS/CRM 5大系统的集成接口
4. **辅助功能**: 文件管理、报表导出、消息通知
5. **安全策略**: 认证、签名、限流、权限控制
6. **测试规范**: 单元测试、集成测试
7. **监控告警**: 监控指标、日志记录

所有API遵循RESTful设计原则,采用统一响应格式,支持版本控制,提供完整的OpenAPI文档。
