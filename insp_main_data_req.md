### QMS主数据模型设计

﻿

### 一、整体逻辑关系图（推荐先理解）

#### 	逻辑图解说

1. ① 基础标准库: 这是系统的地基，定义了所有可复用的标准化信息，如测什么、怎么测、用什么测、怎么抽样、有哪些不良。
2. ② 检验方案配置: 这是系统的大脑。质量工程师利用基础标准库中的“零件”，来配置具体的检验方案模版 (B1)、物料规格 (B2)，并通过方案绑定策略 (B3)，定义好在什么情况下使用哪个方案。
3. ③ 业务事件触发: 系统的运行由真实的业务事件驱动。无论是ERP传来的来料、MES传来的报工，还是WMS传来的发货，都会携带关键的上下文信息。
4. ④ 检验执行与记录:
   - 当一个业务事件 (C) 发生时，它会首先触发方案绑定策略 (B3)。
   - 绑定策略根据事件的上下文（如物料、供应商、工序），并结合自身的优先级和触发条件，找到唯一胜出的检验方案 (B1)。
   - 系统加载该方案的模版，并拉取对应的物料规格 (B2)，最终“组装”成一个具体的待检任务 (D1)。
   - 检验员执行任务，产生检验结果 (D2)。
5. ⑤ 分析与改善:
   - 所有检验结果 (D2) 汇入数据湖，为SPC、柏拉图等分析报表提供数据源。
   - 分析的结果（如某个原因被确认为高频）可以反过来更新基础标准库 (A)，形成一个持续改进的闭环。

![image.png](https://atlas.pingcode.com/files/public/6936907af11757812827bf13?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWRfZm9yX3B1YmljX2ltYWdlIjoiOTJmYzc4ZjQ3NGQ5NDYzOGEyYTBlZDc1ZTA1OWFhOTUiLCJ0ZWFtX2Zvcl9wdWJsaWNfaW1hZ2UiOiI2OTExYjE1YzUzODhkNGNlNDBhM2JhMzUiLCJpc19pbnRlcm5hbF90b2tlbiI6dHJ1ZSwiaWF0IjoxNzY1MTc2NzMxLCJleHAiOjE3NjUxODc1MzF9.uOvk1zdW0V5jOZdbV6GlOO4yBl6RN15p8774BlNgTag)

﻿![image.png](https://atlas.pingcode.com/files/public/6936908ef11757812827bf17?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWRfZm9yX3B1YmljX2ltYWdlIjoiOTJmYzc4ZjQ3NGQ5NDYzOGEyYTBlZDc1ZTA1OWFhOTUiLCJ0ZWFtX2Zvcl9wdWJsaWNfaW1hZ2UiOiI2OTExYjE1YzUzODhkNGNlNDBhM2JhMzUiLCJpc19pbnRlcm5hbF90b2tlbiI6dHJ1ZSwiaWF0IjoxNzY1MTc2NzMxLCJleHAiOjE3NjUxODc1MzF9.uOvk1zdW0V5jOZdbV6GlOO4yBl6RN15p8774BlNgTag)

###  二、QMS质量检验主数据模型详情

基于此模型，整理了详细的**QMS质量检验主数据清单**。为了方便导入和理解，我将其分为三个层级：

1. **L1 基础标准库**（通用字典，全厂共用）
2. **L2 检验规划层**（将标准组装成模板）
3. **L3 规格与策略层**（定义具体的数值和触发条件）

#### 1. L1 基础标准库 (Base Standard)

*这是系统的“字典”，定义了所有可复用的标准化信息。*

| 数据实体         | 表名代码 (参考)            | 关键字段 (必填项)                                        | 业务逻辑说明                                    |
| ---------------- | -------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| **缺陷分类**     | `QM_MD_DefectCategory`     | 分类代码, 分类名称, 父级ID                               | 支持树状结构，如“铸造缺陷 -> 气孔”。            |
| **不良现象库**   | `QM_MD_DefectPhenomenon`   | 现象代码, 名称, **严重等级(CR/MA/MI)**, 关联分类ID       | 严重等级可触发自动升级流程（如CR级触发8D）。    |
| **不良原因库**   | `QM_MD_DefectCause`        | 原因代码, 名称, 类别(5M1E), 是否高频                     | 用于分析改进，支持关联FMEA失效模式。            |
| **检验方法**     | `QM_MD_InspMethod`         | 方法名称, 操作步骤(SOP), 附件                            | 定义“怎么测”，如“三坐标自动测量法”。            |
| **量检具类型**   | `QM_MD_MeasureType`        | 类型名称, 精度, 是否需MSA                                | 定义“用什么测”，如“0-150mm数显卡尺”。           |
| **抽样规则主表** | `QM_MD_SamplingRule`       | 规则名称(如GB2828-L2-0.65), AQL值, 检验水平(I/II)        | 定义抽样标准的核心逻辑（正常/加严/放宽）。      |
| **抽样明细表**   | `QM_MD_SamplingRuleDetail` | 批量范围(Min/Max), 样本量, Ac(接收数), Re(拒收数)        | **系统自动计算依据**。根据批量自动带出样本量。  |
| **检验项目库**   | `QM_MD_InspItem`           | 项目名称(如长度/硬度), **数据类型(计量/计数)**, 默认工具 | 基础特性库。定义是否默认送实验室、是否SPC监控。 |

#### 2. L2 检验规划层 (Templates)

*这是系统的“蓝图”，定义了检验的框架，但不包含具体公差数值。*

| 数据实体          | 表名代码 (参考)             | 关键字段 (必填项)                                    | 业务逻辑说明                                                 |
| ----------------- | --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| **检验模板头**    | `QM_CFG_InspTemplate`       | 模板编码, 名称, **版本号**, 状态                     | 需版本管理（V1.0, V1.1）。状态包括：草稿/已批准/作废。       |
| **模板明细行**    | `QM_CFG_InspTemplateDetail` | 关联检验项目, **抽样规则**, 特性分类(SC/CC), SPC开关 | **核心配置**。定义该模板包含哪些检查项，以及每项怎么抽样。此表不定义具体公差（由L3定义）。 |
| **项目-不良映射** | `QM_MD_InspItemPhenomenon`  | 模板明细ID, 关联不良现象ID                           | **防呆设计**。限制检验员只能选择与该项目相关的不良（如“尺寸”项不能选“色差”）。 |

#### 3. L3 规格与策略层 (Spec & Strategy)

*这是系统的“大脑”，解决“不同供应商/不同工序标准不同”的复杂场景。*

| 数据实体         | 表名代码 (参考)      | 关键字段 (必填项)                                    | 业务逻辑说明                                                 |
| ---------------- | -------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| **物料检验规格** | `QM_MD_MaterialSpec` | 物料ID, 检验项目ID, **目标值, 上限(USL), 下限(LSL)** | **最关键的数据**。将通用的“项目”与具体的“物料”绑定，定义具体的公差范围（±0.02）。 |
| **检验方案策略** | `QM_CFG_InspPlan`    | 业务上下文(IQC/IPQC), 触发条件, **优先级**, 关联模板 | **策略绑定引擎**。定义在什么情况（如新供应商、首件、特定客户）下，调用哪个检验模板。 |

### 💡 针对模型设计的实施建议

1. **数据收集顺序**：
   - 请优先收集 **L1 基础标准库**（特别是缺陷库和抽样规则），这是地基。
   - 然后整理 **L3 物料检验规格**（Excel中通常称为“检验标准书”或“SIP数据”），这是工作量最大的部分。
2. **关于“检验方案策略”的理解**：
   - 模型中 `QM_CFG_InspPlan` 设计得非常巧妙。在整理数据时，不需要为每个物料都建一个方案。
   - **建议策略**：先建立一个“通用方案”（优先级低，匹配所有物料），然后再针对“特殊客户”或“新供应商”建立“特殊方案”（优先级高）。﻿

### 三、关键业务规则（系统需强制校验）

1. 检验方案必须包含至少1个检验项目。
2. 检验方案中的明细行，即每个检验项目在方案中必须指定唯一有效的检验标准（考虑物料/版本匹配）。
3. 不良现象只能从与其关联的检验项目中选择（防止“尺寸检验”选“色差”）。
4. 若检验项目标记为CTQ，则其检验结果必须自动同步至SPC模块。
5. 严重缺陷（如安全相关）触发时，系统自动升级至QRQC或8D流程。



### 四、各对象详细设计

#### 	1.1. 缺陷分类表 (QM_MD_DefectCategory) 


| 字段名       | 类型   | 必填 | 说明           | 示例                                            |
| ------------ | ------ | ---- | -------------- | ----------------------------------------------- |
| id           | Long   | Y    | 主键           | 1                                               |
| orgId        | Long   | N    | 组织ID         | NULL                                            |
| categoryCode | String | Y    | 分类代码，唯一 | DCAT-APP                                        |
| categoryName | String | Y    | 分类名称       | 外观缺陷                                        |
| parentId     | Long   | N    | 父级ID         | NULL (用于支持多级分类，如：铸造缺陷 -> 气孔类) |
| description  | String | N    | 描述           | 所有与产品表面相关的缺陷                        |

- 说明: 建立一个结构化、可分层的缺陷分类体系。
- 逻辑: 多组织: orgId 为 NULL 表示集团级缺陷分类标准。工厂可以引用集团标准，也可以在本地创建私有分类。 parentId 指向自身表中的 id ，实现树状结构。
- 规则: orgId + categoryCode 的组合必须唯一。 parentId 指向自身表中的 id ，如果为 NULL 或 0 ，则表示为顶级分类。
- 示例: 

 (1, 'DCAT-APP', '外观缺陷', NULL, '所有与产品表面相关的缺陷') 

 (2, 'DCAT-DIM', '尺寸缺陷', NULL, '所有与尺寸公差相关的缺陷') 

 (3, 'DCAT-CAST', '铸造缺陷', NULL, '压铸过程产生的缺陷') 

 (4, 'DCAT-CAST-POR', '气孔类缺陷', 3, '铸造缺陷下的子分类') -> 父级是“铸造缺陷”

- 业务场景: 集团定义了“外观”、“尺寸”、“性能”三大缺陷分类。合肥工厂在“外观”大类下，可以自己扩展出“压铸外观”、“机加外观”、“喷涂外观”等更细的子分类，便于进行更精细的统计分析。

#### 1.2. 不良现象库 (QM_MD_DefectPhenomenon)



|             |        |      |                                    |                                                              |
| ----------- | ------ | ---- | ---------------------------------- | ------------------------------------------------------------ |
| 字段名      | 类型   | 必填 | 说明                               | 示例                                                         |
| id          | Long   | Y    | 主键                               | 401                                                          |
| orgId       | Long   | N    | 组织ID                             | 1                                                            |
| categoryId  | Long   | Y    | 不良类型ID，外键 -> DefectCategory | 1                                                            |
| code        | String | Y    | 现象代码，唯一                     | DEF-APP-01                                                   |
| name        | String | Y    | 现象名称                           | 划伤                                                         |
| severity    | Enum   | Y    | 严重等级                           | MI 枚举值：致命、主要、次要。(触发升级流程，如自动围堵、预警) |
| processType | String | N    | 适用工序类型                       | 压铸 (欠铸, 冷隔), 机加工 (尺寸偏大, 螺纹烂牙)               |
| Description | String | N    | 描述                               | 补充说明                                                     |

- 说明: 定义检验员在现场看到的客观不良事实。 severity 的取值范围包括： CR (致命), MA (主要), MI (次要)。该字段可触发升级流程，如自动围堵、预警。
- 逻辑: 多组织: orgId 为 NULL 表示集团标准不良现象。
- 规则: categoryId 是必填项。 orgId + code 的组合必须唯一。
- 示例: (401, 1, 1, 'DEF-APP-01', '划伤', 'MI') 
- 业务场景: 集团定义了“划伤”、“碰伤”等通用不良现象。合肥工厂的压铸车间，可以创建自己私有的、非常具体的不良现象，如“模具粘料拉伤”，并将其归类于“外观缺陷”下。

#### 1.3.1. 不良原因库 (QM_MD_DefectCause) 

﻿

|                 |         |      |                             |                                                          |
| --------------- | ------- | ---- | --------------------------- | -------------------------------------------------------- |
| 字段名          | 类型    | 必填 | 说明                        | 示例                                                     |
| id              | Long    | Y    | 主键                        | 501                                                      |
| orgId           | Long    | N    | 组织ID                      | 1                                                        |
| parentId        | Long    | N    | 父级ID                      | 500                                                      |
| code            | String  | Y    | 原因代码，唯一              | CA-MAC-AGING                                             |
| name            | String  | Y    | 原因名称                    | 设备老化 ， 铝液含氢量过高 、 模具冷却水堵塞 、 刀具磨损 |
| category        | Enum    | Y    | 原因大类 (5M1E)             | Machine                                                  |
| isHighFrequency | Boolean | Y    | 是否高频原因,用于经验库推荐 | True                                                     |

- 说明: 定义导致不良的根本原因。是质量问题的“病因”。通常用于 NCR 或 MRB 流程，由工程师分析后录入。支持无限层级的树状结构，用于深度根本原因分析（如5Why分析法），并集成了经验库推荐和FMEA联动的功能。 category 的取值范围包括： Man , Machine , Material , Method , Measurement , Environment 。
- 逻辑: 

1. 多组织: orgId 为 NULL 表示集团级通用原因库。 parentId 实现原因的层级嵌套。 isHighFrequency 用于智能推荐。
2. 原因子类: 通过 parentId 字段实现。 parentId 指向自身表中的 id 。如果 parentId 为 NULL ，则表示为顶级原因分类（如：人、机、料、法、环）。子级原因可以层层嵌套，形成原因树。
3. 高频推荐: isHighFrequency 字段暂由系统管理员或资深工程师维护，后期可根据历史数据分析后自动标记。在工程师进行原因分析时，系统可优先推荐标记为 True 的原因，加速问题诊断。
4. FMEA关联: 与FMEA的关联通过一个独立的“关联表”实现，见下一节。

- 规则: orgId + code 的组合必须唯一。 parentId 必须指向本表中已存在的 id ，或者为 NULL 。
- 示例: 

1. 顶级原因: (500, NULL, 'CA-MAC', '设备问题', 'Machine', False) 
2. 二级原因(子类): (501, 500, 'CA-MAC-AGING', '设备老化', 'Machine', True) -> “设备老化”是“设备问题”的一个子类，且是高频原因。
3. 三级原因: (502, 501, 'CA-MAC-AGING-SEAL', '密封圈老化', 'Machine', False) -> “密封圈老化”是“设备老化”的更具体原因。

- 业务场景: 集团原因库中包含了“参数设置错误”这一条目。合肥工厂的工程师在分析问题时，可以在此条目下，创建更具体的子原因，如“压铸机A-101保压压力过低”，并标记为高频，构建工厂级的知识库。



#### 1.3.2.不良原因与FMEA关联表 (QM_MD_CauseFmeaMapping)

﻿

|                   |        |      |                     |                                            |
| ----------------- | ------ | ---- | ------------------- | ------------------------------------------ |
| 字段名            | 类型   | 必填 | 说明                | 示例                                       |
| id                | Long   | Y    | 主键                | 1                                          |
| orgId             | Long   | Y    | 组织ID              | 1                                          |
| causeId           | Long   | Y    | 外键 -> DefectCause | 502 (关联到“密封圈老化”这个原因)           |
| fmeaFailureModeId | String | Y    | FMEA失效模式ID      | PFMEA-001-FM-03 (关联到外部FMEA系统或模块) |

- 说明: 这是一个多对多映射表，它建立了“QMS中的根本原因”和“PFMEA中的失效模式”之间的桥梁。
- 逻辑: 

1. 多组织: orgId 确保了FMEA的关联是组织内部的。
2. 从QMS到FMEA: 当一个不合格品的原因被确认为“密封圈老化”( causeId=502 )时，系统可以反向追溯到其关联的PFMEA失效模式（ PFMEA-001-FM-03 ），提示工程师检查FMEA中的RPN（风险顺序数）是否需要重新评估，实现了FMEA的“动态更新”。
3. 从FMEA到QMS: 在设计PFMEA时，工程师可以从QMS的原因库中选择已知的根本原因，关联到新的失效模式上，实现知识复用。

- 规则: orgId + causeId + fmeaFailureModeId 的组合必须唯一。 fmeaFailureModeId 是一个字符串，以适应不同FMEA软件或模块的ID格式。
- 示例: 

 (1, 502, 'PFMEA-001-FM-03') -> “密封圈老化”关联到失效模式“液压泄漏”。

 (2, 502, 'PFMEA-001-FM-04') -> “密封圈老化”同时还关联到失效模式“压力不足”

- 业务场景: 合肥工厂的质量工程师，将本地原因库中的“密封圈老化”与合肥工厂自己的“PFMEA-液压系统”中的失效模式“液压泄漏”进行关联，实现了本工厂内的QMS与FMEA联动。



#### 1.3.3. 现象-原因关联知识库 (QM_MD_PhenomenonCaseKnowledgeMapping) 

用途：智能辅助。当检验员选择了“气孔”时，系统可以推荐常见原因给工程师参考，积累企业知识库。

|              |         |                              |
| ------------ | ------- | ---------------------------- |
| 字段名       | 类型    | 说明                         |
| phenomenonId | Long    | 关联不良现象表               |
| orgId        | Long    | 组织ID                       |
| causeId      | Long    | 关联不良原因表               |
| weight       | Integer | 权重/发生频率 (用于排序推荐) |

#### ﻿1.4. 量检具类型库 (QM_MD_MeasureType)

|               |         |      |                                     |                  |
| ------------- | ------- | ---- | ----------------------------------- | ---------------- |
| 字段名        | 类型    | 必填 | 说明                                | 示例             |
| id            | Long    | Y    | 主键                                | 301              |
| orgId         | Long    | N    | 组织ID                              | NULL             |
| typeName      | String  | Y    | 类型名称，唯一                      | 0-150mm 数显卡尺 |
| precision     | Decimal | Y    | 精度/分辨率                         | 0.01             |
| isMsaRequired | Boolean | Y    | 是否需 MSA(此设置未来在台账中实现） | True             |

- 说明: 定义量具的类别要求，非具体设备台账。
- 逻辑: 多组织: orgId 为 NULL 表示集团通用的量具类型。
- 规则: isMsaRequired 的取值范围： True (是), False (否)。
- 示例: (301, NULL, '0-150mm 数显卡尺', 0.01, True) 
- 业务场景: 集团定义了公司所有工厂通用的量具类型。当某个工厂（如合肥工厂）为特殊产品引进了非标检具时，可以在本地 orgId 下创建私有的检具类型，如“X型号产品专用通止规”。



#### 1.5. 检验方法库 (QM_MD_InspMethod)

|               |        |      |                  |                                                   |
| ------------- | ------ | ---- | ---------------- | ------------------------------------------------- |
| 字段名        | 类型   | 必填 | 说明             | 示例                                              |
| id            | Long   | Y    | 主键             | 201                                               |
| orgId         | Long   | N    | 组织ID           | 1 (舜富合肥工厂)                                  |
| methodName    | String | Y    | 方法名称，唯一   | 三坐标自动测量法 卡尺测量 目视检查 万用表测试     |
| operationText | Text   | N    | 操作步骤描述     | 1. 清洁工件... 2. 调用程序PRG-001... (支持富文本) |
| attachmentId  | String | N    | 附件ID (SIP文件) | FILE_SOP_001.pdf                                  |

- 说明: 用于存储具体的作业指导书（WI）或标准操作程序（SIP）。
- 逻辑: 多组织: orgId 为 NULL 表示集团级标准作业方法。 orgId 有值时，表示特定工厂的本地作业方法。
- 规则: orgId + methodName 的组合必须唯一。
- 示例: (201, NULL, '通用卡尺测量法', '1. 校零...', NULL) -> 集团发布的标准卡尺使用SOP。
- 业务场景: 集团发布了标准的“卡尺测量SOP”。合肥工厂因为购买了新的、带蓝牙传输的卡尺，可以在本地创建私有的“蓝牙卡尺测量SOP”，并在其检验方案中引用，而不会影响到集团标准或其他工厂。

1.6. 抽样方案 (Sampling Plan) 

#### 1.6.1. 抽样方案信息表 (QM_MD_SamplingPlan)

﻿

|                |        |      |                |                                                              |
| -------------- | ------ | ---- | -------------- | ------------------------------------------------------------ |
| 字段名         | 类型   | 必填 | 说明           | 示例/备注                                                    |
| id             | Long   | Y    | 主键           | 1                                                            |
| orgId          | Long   | N    | 组织ID         | NULL                                                         |
| planCode       | String | Y    | 方案代码，唯一 | AQL-001                                                      |
| planName       | String | Y    | 方案名称       | AQL通用抽样 / 全检 / 固定数量 / 百分比 / 自定义 / 国标 / 公式计算 |
| samplingMethod | Enum   | Y    | 抽样方法       | FIXED_QUANTITY ,  PERCENTAGE ,  STANDARD_BASED ,  FULL_INSPECTION |
| standard       | String | N    | 引用标准       | GB/T 2828.1-2012                                             |
| description    | String | N    | 描述           | 公司所有AQL抽样的集合                                        |

- 说明: 抽样标准的顶层容器，用于组织和分类。
- 逻辑: 多组织: orgId 为 NULL 表示集团级抽样方案。
- 规则: orgId + planCode 的组合必须唯一。
- 示例: (1, NULL, 'AQL-GB2828', 'GB/T 2828.1-2012 AQL抽样', 'GB/T 2828.1-2012') 



#### 1.6.2. 抽样规则主表 (QM_MD_SamplingRule) 

﻿规定基础标准一旦被“已批准”的方案引用，则不允许修改，只能创建新版。

也可以考虑多版本控制。

|                 |         |      |                 |                            |
| --------------- | ------- | ---- | --------------- | -------------------------- |
| 字段名          | 类型    | 必填 | 说明            | 示例                       |
| id              | Long    | Y    | 主键            | 10                         |
| orgId           | Long    | N    | 组织ID          | NULL                       |
| planId          | Long    | Y    | 外键 -> Header  | 1                          |
| ruleCode        | String  | Y    | 规则代码，唯一  | AQL-GB2828-L2-N-0.65       |
| ruleName        | String  | Y    | 规则名称        | II级正常单次AQL=0.65       |
| inspectionLevel | String  | Y    | 检验水平        | II                         |
| inspectionType  | Enum    | Y    | 严格类型        | NORMAL                     |
| aqlValue        | Decimal | Y    | 接收质量限(AQL) | 0.65                       |
| sampleSizeRate  | Integer | Y    | 样本量比率      | [0,100] method= PERCENTAGE |
| sampleSize      | Integer | Y    | 样本量          | 20 method= PERCENTAGE      |

- 说明: 抽样方案的核心，它定义了一套具体的、可被直接引用的抽样规则。它将检验水平、类型和AQL值结构化，为后续的转移规则（如“连续5批合格，从正常转放宽”）提供了数据基础。
  -  inspectionLevel 的取值范围： I , II , III , S-1 , S-2 , S-3 , S-4 。
  -  inspectionType 的取值范围： NORMAL (正常), STRICT (加严), REDUCED (放宽)。
- 逻辑: 
  - 多组织: orgId 为 NULL 表示集团级标准规则。
  - planId + inspectionLevel + inspectionType + aqlValue 的组合在业务上应该是唯一的。
- 规则: orgId + ruleCode 的组合必须唯一。
  - 当 samplingMethod 是 FIXED_QUANTITY 时，系统读取 QM_MD_SamplingRule 中的 fixedSampleSize 。
  - 当 samplingMethod 是 PERCENTAGE 时，系统读取 QM_MD_SamplingRule 中的 percentageRate 。
  - 只有当 samplingMethod 是 STANDARD_BASED 时，系统才需要去查询 QM_MD_SamplingRuleDetail 这张明细表
- 示例: (10, NULL, 1, 'AQL-GB2828-L2-N-0.65', 'II级正常单次AQL=0.65', 'II', 'NORMAL', 0.65) 



#### 1.6.3. 抽样明细表 (QM_MD_SamplingRuleDetail)

|                  |         |      |                       |      |
| ---------------- | ------- | ---- | --------------------- | ---- |
| 字段名           | 类型    | 必填 | 说明                  | 示例 |
| id               | Long    | Y    | 主键                  | 101  |
| ruleId           | Long    | Y    | 外键 -> Sampling Rule | 10   |
| batchSizeMin     | Integer | Y    | 批量从                | 91   |
| batchSizeMax     | Integer | Y    | 批量至                | 150  |
| sampleSizeCode   | String  | N    | 样本量字码            | G    |
| acceptanceNumber | Integer | Y    | Ac (接收数)           | 0    |
| rejectionNumber  | Integer | Y    | Re (拒收数)           | 1    |

- 说明: 抽样规则的具体矩阵表，定义了在不同批量下应抽取的样本量及判定标准。
- 逻辑: 运行时，系统根据输入的 batchSize 和 ruleId 在此表中查找对应的 sampleSize , Ac , Re 。
- 规则: 对于一个 ruleId ， [batchSizeMin, batchSizeMax] 的区间不能重叠。
- 示例: (101, 10, 91, 150, 'G', 20, 0, 1) -> 批次在91-150之间时，抽20个，0个不良则接收，1个及以上则拒收。
- 业务场景 (抽样方案): IQC检验员收到一批1000件的来料，检验方案指定了抽样规则 ruleId=10 。系统自动根据批量1000，在此方案明细中查找到应抽样125件，Ac=2, Re=3。检验员只需按此执行，无需再手动查阅厚厚的标准手册。

#### 1.7. 检验项目(检验特性) (QM_MD_InspItem)

﻿规定基础标准一旦被“已批准”的方案引用，则不允许修改，只能创建新版。

|                   |        |      |                            |                                                     |
| ----------------- | ------ | ---- | -------------------------- | --------------------------------------------------- |
| 字段名            | 类型   | 必填 | 说明                       | 示例                                                |
| id                | Long   | Y    | 主键                       | 101                                                 |
| orgId             | Long   | N    | 组织ID                     | 1 (舜富工厂1)                                       |
| inspIitemCode     | String | Y    | 检查项编码                 | CHAR-DIM-001                                        |
| inspItemName      | String | Y    | 检查项名称                 | 壳体A面平面度                                       |
| category          | String | Y    | 分类                       | 尺寸 , 外观 , 理化 , 功能                           |
| dataType          | Enum   | Y    | 数据类型                   | QUANTITATIVE (计量), QUALITATIVE (计数)             |
| defaultMethodId   | Long   | N    | 关联检验方法ID             | FK ->  Inspection Method 表。定义该特性的标准测法。 |
| defaultInstTypeId | Long   | N    | 关联量具类型ID             | FK -> Instrument Type  表。定义建议使用的量具类型。 |
| isLabTest_default | BOOL   | Y    | **(默认) 是否送检实验室**  |                                                     |
| isSpc_default     | BOOL   | Y    | **(默认) 是否启用SPC监控** |                                                     |
| status            | String | Y    | 状态                       |                                                     |

- 说明: 建立企业级的、可复用的检验项目标准库。 dataType 的取值范围包括： QUANTITATIVE (计量型), QUALITATIVE (计数型)。
- 逻辑:
  1. 多组织: orgId 为 NULL 表示这是集团级标准检验项目，所有工厂可见且可引用。 orgId 有值时，表示这是特定工厂私有的检验项目。
  2. 数据继承: 工厂在创建检验方案时，可选用的检验项目列表 = (该工厂私有的项目) + (集团级的标准项目)。
- 规则: orgId + code 的组合必须唯一。
- 示例: (101, NULL, 'ITEM-G-HARDNESS', '洛氏硬度', '理化', 'QUANTITATIVE', 202, 305) -> 集团发布的标准硬度检验项目。
- 业务场景: 舜富集团总部定义了“洛氏硬度”这一标准检验项目。合肥工厂和芜湖工厂在各自配置检验方案时，都可以直接引用这个项目，保证了集团内硬度测量标准的一致性。同时，合肥工厂因特殊客户要求，可以创建自己私有的“盐雾测试”项目，该项目对芜湖工厂不可见。

### 1.7.1. 检验项目与不良现象关联表 (QM_CFG_InspItemPhenomenonMapping)

|              |      |                              |                                     |
| ------------ | ---- | ---------------------------- | ----------------------------------- |
| 字段名       | 类型 | 说明                         | 示例/备注                           |
| id           | Long | 主键                         | 1                                   |
| planDetailId | Long | 外键 -> InspectionPlanDetail | 701 (关联到“壳体A面外观检查”这一行) |
| phenomenonId | Long | 外键 -> DefectPhenomenon     | 401 (关联到“划伤”这个不良现象)      |

- 说明: 这是一个多对多映射表，它建立了“检验方案中的一个具体项目”和“一个或多个可能的缺陷代码”之间的关联关系。
- 规则: planDetailId + DefectPhenomenon 的组合必须是唯一的，以防止重复映射。
- 示例: 假设“壳体A面外观检查”的 planDetailId 是 701。
  -  (1, 701, 401) -> 允许出现“划伤”
  -  (2, 701, 405) -> 允许出现“碰伤”
  -  (3, 701, 408) -> 允许出现“脏污” 假设“内孔直径”的 planDetailId 是 702。
  -  (4, 702, 410) -> 允许出现“尺寸超上限”
  -  (5, 702, 411) -> 允许出现“尺寸超下限”

> 1. 配置阶段 (工程师):
>    - 工程师在设计检验方案时，为“壳体A面外观检查”这个项目，通过一个多选框或穿梭框，勾选了“划伤”、“碰伤”、“脏污”三个可能的缺陷。
>    - 系统在 QM_MD_InspPlanDetailPhenomenonMapping 表中自动写入三条记录。
> 2. 执行阶段 (检验员):
>    - 检验员在产线检查“壳体A面外观”，判定 NG。
>    - 点击“NG”后，系统不会弹出一个包含全部几百个缺陷的列表，而是根据 planDetailId =701，去 QM_MD_InspPlanDetailPhenomenonMapping 表中查询，只显示一个包含“划伤”、“碰伤”、“脏污”三个选项的、小而精准的列表。
>    - 检验员轻松点击“划伤”，完成不合格记录。

### 2.5. 物料检验规格表 (QM_MD_MaterialSpec)【此表是物料/检验项目扩展包】

﻿规定基础标准一旦被“已批准”的方案引用，则不允许修改，只能创建新版。

|               |         |      |                  |                                                   |
| ------------- | ------- | ---- | ---------------- | ------------------------------------------------- |
| 字段名        | 类型    | 必填 | 说明             | 示例                                              |
| id            | Long    | Y    | 主键             | 901                                               |
| orgId         | Long    | Y    | 组织ID           | 1                                                 |
| materialId    | String  | Y    | 具体物料ID       | M007                                              |
| inspIitemCode | Long    | Y    | 检查项code       | CHAR-DIM-001                                      |
| dataType      | Enum    | Y    | 数据类型         | QUANTITATIVE  (计量),  QUALITATIVE  (计数)        |
| targetValue   | Decimal | N    | 目标值 (计量)    | 50.00                                             |
| upperLimit    | Decimal | N    | 上限(USL) (计量) | 50.02                                             |
| lowerLimit    | Decimal | N    | 下限(LSL) (计量) | 49.98                                             |
| uom           | String  | N    | 单位             | mm                                                |
| standardText  | String  | N    | 标准描述 (计数)  | 用于简单描述。如： 表面无划痕 银色哑光 表面无油污 |
| standardCode  | String  | N    | 标准代码         | 用于结构化比对。如色号："PANTONE-877C"。          |
| expectedValue | String  | N    | 期望值/正确答案  | 针对“是非题”。如 "OK", "YES", "PASS"。            |
| attachmentId  | String  | N    | 样板图 (计数)    | IMG_STD_001.jpg                                   |

- 说明: 多态表，兼容计量与计数，解决“一套方案，多套规格”的核心问题。
- 逻辑: 多组织: orgId 必填，同一物料在不同工厂可以有不同的规格。
- 规则: orgId + materialId + inspIitemCode构成唯一键。
- 示例: (901, 1, 'M007', 701, 'QUANTITATIVE', 50.00, 50.02, 49.98, 'mm', NULL, NULL) 
- 业务场景: 物料 M007 同时在合肥工厂和芜湖工厂生产。合肥工厂供给A客户，要求公差为±0.02mm；芜湖工厂供给B客户，要求公差为±0.05mm。工程师可以在各自工厂的 orgId 下，为 M007 的同一检验项配置不同的规格，而无需修改检验方案。

## 2. 检验模板核心模型 

**检验模板 (Inspection Template)**: 定义“如何检验”的可复用蓝图，包含一系列检验项目和抽样规则，但不关心具体的物料或业务场景

### 2.1. 检验模板主表 (QM_CFG_InspTemplate )

﻿

|                    |        |      |          |                                   |
| ------------------ | ------ | ---- | -------- | --------------------------------- |
| 字段名             | 类型   | 必填 | 说明     | 示例                              |
| id                 | Long   | Y    | 主键     | 601                               |
| orgId              | Long   | Y    | 组织ID   | 1                                 |
| templateCode       | String | Y    | 方案编码 | **模板编码** (用于业务绑定)       |
| templatename       | String | Y    | 方案名称 | 模板名称，合肥工厂-压铸件通用方案 |
| version            | String | Y    | 版本号   | V1.0                              |
| status             | Enum   | Y    | 状态     | APPROVED                          |
| workflowInstanceId | Long   | Y    | 流程ID   |                                   |

- 说明: 
  -  status 的取值范围包括： DRAFT (草稿), IN_APPROVAL (审批中), APPROVED (已批准), OBSOLETE (已作废)。
- 逻辑: 
  - 多组织: orgId 必填，明确了该检验方案属于哪个工厂，不能跨厂使用。
- 规则: 
  -  orgId + planCode + version 构成业务唯一键。
- 示例: 
  -  (601, 1, 'IP-HFC-CASTING', '合肥工厂-压铸件通用方案', 'V1.0', 'APPROVED') 
- 业务场景: 合肥工厂和芜湖工厂，虽然都生产压铸件，但由于设备、工艺不同，需要创建各自的检验方案。 orgId 保证了两个工厂的方案互不干扰。

### 2.2. 检验模板明细子表(QM_CFG_InspTemplateDetail )

|                     |         |      |                                                              |                      |
| ------------------- | ------- | ---- | ------------------------------------------------------------ | -------------------- |
| 字段名              | 类型    | 必填 | 说明                                                         | 示例                 |
| id                  | Long    | Y    | 主键                                                         | 701                  |
| templateId          | Long    | Y    | 外键 -> QM_MD_InspTemplate.id                                | 601                  |
| itemId              | Long    | Y    | 外键 -> QM_MD_InspItem.id                                    | 101                  |
| itemName            | String  | Y    | 冗余字段，防特性库修改                                       |                      |
| sortOrder           | Integer | Y    | 顺序                                                         | 10                   |
| samplingRuleCode    | Long    | Y    | **(最终配置) 抽样规则** (模板行独有，必须配置)，外键 -> Sampling Rule | AQL-GB2828-L2-N-0.65 |
| characteristicClass | String  | Y    | 特性分类                                                     | CC                   |
| isDynamicSpec       | Boolean | N    | 动态规格(暂时不用)                                           | True                 |
| inspMethodCode      | Long    | N    | **(最终配置) 检验方法** (从主数据默认带出，可修改)           | 201                  |
| instrumentTypeId    | Long    | N    | **(最终配置) 量检具类型** (从主数据默认带出，可修改)         | 303                  |
| isLabTest           | Boolean | Y    | **(最终配置) 是否送检实验室** (从主数据默认带出，可修改)     | True                 |
| frequencyType       | Enum    | N    | IPQC检验频次类型                                             | PER_TIME             |
| frequencyValue      | Integer | N    | IPQC检验频次值                                               | 2                    |
| frequencyUnit       | String  | N    | IPQC检验频次单位                                             | HOURS                |
| isSpc               | Boolean | Y    | **(最终配置) 是否启用SPC监控** (从主数据默认带出，可修改)    | True                 |
| attachmentId        | String  | N    | SIP文件                                                      | 引用SIP文件或描述    |

- 说明: 
  -  characteristicClass 的取值范围包括： SC (特殊特性), CC (关键特性), Major (主要), Minor (次要)。
  -  frequencyType 的取值范围包括： PER_TIME (按时间), PER_QUANTITY (按数量)。
- 逻辑: isLabTestRequired 触发实验室任务。 frequency 字段组合定义 IPQC 频率。 isSpcRequired 是明确的业务开关。
- 规则: frequency 字段仅在 IPQC 场景下生效。
- 示例: (..., freqType:PER_TIME, freqVal:2, freqUnit:HOURS, isSpc:True) -> 每2小时，按指定规则抽检，结果录入SPC。
- 业务场景: 工程师在配置IPQC方案时，对于一个关键尺寸，他将 isSpcRequired 设为 True ，并设定频率为“每1小时5件”。产线执行时，系统会自动提醒检验员到点检验，并将计量数据无缝推送到SPC模块进行过程能力分析。

### 3 检验方案核心模型 

**检验方案 (Inspection Plan)**: 定义“在何种情况下应用哪个模板”的具体配置。它是一个独立的配置页面，用于将**检验模板**与**业务上下文**（如物料、供应商、工序）进行绑定。

### 3.1. 检验方案表 (QM_CFG_InspPlan )

|                  |         |      |                   |                                       |
| ---------------- | ------- | ---- | ----------------- | ------------------------------------- |
| 字段名           | 类型    | 必填 | 说明              | 示例                                  |
| id               | Long    | Y    | 主键              | 801                                   |
| planname         | String  | Y    | 方案名称          |                                       |
| orgId            | Long    | Y    | 组织ID            | 1                                     |
| templateCode     | String  | Y    | 外键 ->关联模板编 | `QM_MD_InspTemplate.templateCode`     |
| contextType      | Enum    | Y    | 业务上下文        | IQC , IPQC , FQC (返工检，库存抽检等) |
| materialId       | String  | N    | 物料ID            | M007                                  |
| materialGroupId  | String  | N    | 物料组ID          | G01                                   |
| supplierId       | String  | N    | 供应商ID          | S02 (仅 IQC)                          |
| customerId       | String  | N    | 客户ID            | CUST-01 (OQC)                         |
| operationNo      | String  | N    | 工序号            | OP30 (IPQC)                           |
| ipqcType         | Enum    | N    | IPQC类型          | FAI (IPQC)                            |
| triggerCondition | Enum    | Y    | 触发条件          | ALWAYS                                |
| triggerValue     | Integer | N    | 触发条件值        | 3                                     |
| priority         | Integer | Y    | 优先级            | 15                                    |

- 说明: 
  -  contextType 的取值范围： IQC , IPQC , FQC , OQC 。
  -  ipqcType 的取值范围： FAI (首件), PATROL (巡检), LAI (末件)。
  -  triggerCondition 的取值范围： ALWAYS (总是), ON_NEW_SUPPLIER_FIRST_N_BATCHES (新供应商前N批), ON_ECN_FIRST_N_BATCHES (工程变更后前N批)。
- 逻辑: 
  - 多组织: orgId 必填，绑定策略是工厂级的。
  - 系统查找适用方案的逻辑，完全由当前业务事件提供的上下文驱动。 priority 字段（数值越小，优先级越高）解决所有冲突。
    - 场景 1: IPQC - 首件检 (上下文: 物料=M007, 工序=OP30, IPQC类型=FAI)
      1.  物料 + 工序 + IPQC类型=FAI (如: 优先级 10) - M007在OP30的首件有特殊要求
      2.  物料 + 工序 (如: 优先级 15) - M007在OP30的通用过程要求
      3.  物料组 + 工序 (如: 优先级 25)
      4.  物料 (如: 优先级 30) - 不推荐，IPQC应与工序强相关
    - 场景 2: IPQC - 巡检 (上下文: 物料=M007, 工序=OP30, IPQC类型=PATROL)
      1.  物料 + 工序 + IPQC类型=PATROL (如: 优先级 12) - M007在OP30的巡检要求
      2.  物料 + 工序 (如: 优先级 15) - M007在OP30的通用过程要求
      3.  ...
- 规则: 
  -  contextType 决定了哪些关联字段有效。
  -  事件驱动的 triggerCondition 应设置更高的 priority 。
  -  contextType 是此表的核心，决定了哪些关联字段有效。
     - 当 contextType = IQC 时， supplierId 有效。
     - 当 contextType = IPQC 时， operationNo 和 ipqcType 有效。
     - 当 contextType = FQC 时， customerId 有效。
  -  priority 是实现业务例外的核心，必须为不同层级的绑定设置不同的、可区分的优先级数值。
- 示例: 
  - IQC: (801, 1, 608, 'IQC', 'M007', NULL, 'S03', NULL, NULL, NULL, 'ON_NEW_SUPPLIER_FIRST_N_BATCHES', 3, 5) 
  - IPQC首件检: (planId:606, ctx:IPQC, matId:M007, opNo:OP30, ipqcType:FAI, prio:10) -> M007在OP30的首件检，使用 606 方案（通常检验项目最多）。
  - IPQC巡检: (planId:607, ctx:IPQC, matId:M007, opNo:OP30, ipqcType:PATROL, prio:12) -> M007在OP30的巡检，使用 607 方案（抽检关键尺寸）。
  - IQC: (planId:602, ctx:IQC, matId:M007, supId:S02, prio:20) -> S02供应商的M007来料，使用 602 加严方案。
  - FQC: (planId:604, ctx:FQC, matId:M007, custId:CUST-01, prio:10) -> 发往CUST-01客户的M007，使用 604 特殊包装方案。
- 业务场景: 一家新供应商 S03 首次送来物料 M007 到合肥工厂( orgId=1 )。ERP将收货信息推送到QMS，QMS匹配到上述示例的绑定规则（优先级5），自动激活了“超加严”检验方案 608 。当第4批货到达时，该规则自动失效，系统会匹配到优先级较低的常规检验规则，实现了无人干预的风险转移。

