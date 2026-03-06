# 1. 请求规范
## 1.1. 请求头规范
### 1.1.1. 通用请求头
所有接口请求必须包含以下通用请求头：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 示例值 | 备注 |
| --- | --- | --- | --- | --- | --- |
| X-API-Key | API密钥 | String | 是 | `plm_2024_ak_001` | PLM系统分配的API Key |
| X-API-Signature | 请求签名 | String | 是 | `sha256_hex_signature` | HMAC-SHA256签名，生成算法详见章节3 |
| X-Request-ID | 请求ID | String | 否 | `req_20240123_001` | 用于请求追踪，不传则由服务端生成 |
| Content-Type | 内容类型 | String | 是 | `application/json` | 固定值 |
| X-Timestamp | 时间戳 | Long | 是 | `1705996800000` | 毫秒级时间戳，用于签名验证 |


### 1.1.2. 接口特定请求头
部分接口可能需要额外的请求头，将在各接口文档中单独说明。

## 1.2. 响应头规范
### 1.2.1. 通用响应头
所有接口响应包含以下通用响应头：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 示例值 | 备注 |
| --- | --- | --- | --- | --- | --- |
| X-Response-ID | 响应ID | String | 是 | `resp_20240123_001` | 与请求ID对应 |
| X-Timestamp | 响应时间戳 | Long | 是 | `1705996801000` | 毫秒级时间戳 |
| Content-Type | 内容类型 | String | 是 | `application/json` | 固定值 |


## 1.3. 请求/响应格式示例
### 1.3.1. 请求格式伪代码示例
```javascript
// 1. 准备请求数据
const requestData = [
  {
    "operation": "CREATE",
    "materialCode": "MAT-2024-001",
    "materialName": "智能控制器主板",
    // ... 其他字段
  }
];

// 2. 生成签名
const timestamp = Date.now();
const signature = generateSignature(apiSecret, apiKey, timestamp, JSON.stringify(requestData));

// 3. 设置请求头
const headers = {
  'X-API-Key': apiKey,
  'X-API-Signature': signature,
  'X-Request-ID': 'req_' + timestamp,
  'X-Timestamp': timestamp,
  'Content-Type': 'application/json'
};

// 4. 发送请求
const response = await fetch('/api/qm/plm/materials/batch-sync', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(requestData)
});
```

### 1.3.2. 成功响应格式伪代码示例
```javascript
// HTTP 200 响应
{
  "code": 200,
  "message": "同步成功",
  "timestamp": "2024-01-23T10:30:00Z",
  "requestId": "req_20240123_001",
  "data": {
    "totalCount": 150,
    "successCount": 148,
    "failureCount": 2,
    "successItems": [
      {
        "materialCode": "MAT-2024-001",
        "qmsMaterialId": "100001",
        "status": "CREATED",
        "message": "物料创建成功"
      }
    ],
    "failureItems": [
      {
        "materialCode": "MAT-2024-150",
        "status": "FAILED",
        "errorCode": "VALIDATION_ERROR",
        "errorMessage": "物料编码已存在",
        "suggestion": "请检查物料编码唯一性"
      }
    ],
    "summary": {
      "createCount": 50,
      "updateCount": 95,
      "deleteCount": 3,
      "skipCount": 0
    },
    "nextSyncTime": "2024-01-24T02:00:00Z"
  }
}
```

### 1.3.3. 错误响应格式伪代码示例
```javascript
// HTTP 400 响应
{
  "code": 400,
  "message": "请求参数错误",
  "timestamp": "2024-01-23T10:30:15Z",
  "requestId": "req_20240123_003",
  "details": [
    {
      "field": "materialCode",
      "error": "不能为空",
      "position": "items[2].materialCode"
    }
  ]
}

// HTTP 207 部分失败响应
{
  "code": 207,
  "message": "部分数据处理失败",
  "timestamp": "2024-01-23T10:30:15Z",
  "requestId": "req_20240123_002",
  "data": {
    "totalCount": 5,
    "successCount": 3,
    "failureCount": 2,
    // ... 具体成功和失败条目
  }
}
```

### 1.3.4. 批量请求限制
1. **最大批量大小**：单次请求最多包含1000条数据（具体限制见各接口文档）
2. **分批处理建议**：大数据量时建议分批发送，每批100-500条
3. **并发限制**：同一API Key同时最多处理5个请求
4. **请求超时**：请求超时时间为30秒，响应超时时间为60秒

### 1.3.5. 数据格式要求
1. **字符编码**：UTF-8
2. **日期格式**：`yyyy-MM-dd`
3. **时间格式**：`yyyy-MM-dd HH:mm:ss`
4. **时间戳格式**：ISO 8601格式的字符串
5. **数字精度**：Decimal类型最多保留6位小数
6. **布尔值**：使用`true`/`false`，不接受`1`/`0`或`"true"`/`"false"`

### 1.3.6. 幂等性处理
1. **幂等键**：基于业务唯一键（如物料编码+版本）实现幂等性
2. **重复请求**：相同请求在10秒内重复提交将被忽略
3. **结果查询**：支持通过请求ID查询处理结果
4. **状态恢复**：支持失败任务的手动重试

### 1.3.7. 异步处理
1. **异步响应**：对于处理时间较长的请求，返回HTTP 202状态码
2. **结果回调**：支持通过Webhook回调通知处理结果
3. **进度查询**：支持通过任务ID查询处理进度
4. **超时处理**：异步任务最长处理时间为24小时

---

# 2. 通用状态码
## 2.1. HTTP状态码
| 状态码 | 含义 | 说明 |
| --- | --- | --- |
| 200 | OK | 请求成功完成 |
| 201 | Created | 资源创建成功 |
| 202 | Accepted | 请求已接受，正在异步处理 |
| 204 | No Content | 请求成功，但无返回内容 |
| 207 | Multi-Status | 批量处理中部分成功部分失败 |
| 400 | Bad Request | 请求参数错误或格式不正确 |
| 401 | Unauthorized | 认证失败，API Key或签名无效 |
| 403 | Forbidden | 权限不足，无法访问资源 |
| 404 | Not Found | 请求的资源不存在 |
| 405 | Method Not Allowed | 请求方法不被允许 |
| 409 | Conflict | 资源冲突（如重复创建） |
| 415 | Unsupported Media Type | 不支持的媒体类型 |
| 422 | Unprocessable Entity | 请求格式正确但业务校验失败 |
| 429 | Too Many Requests | 请求频率超限 |
| 500 | Internal Server Error | 服务器内部错误 |
| 502 | Bad Gateway | 网关错误 |
| 503 | Service Unavailable | 服务暂时不可用 |
| 504 | Gateway Timeout | 网关超时 |


## 2.2. 业务错误码
### 2.2.1. 通用业务错误码
| 错误码 | HTTP状态码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| VALIDATION_ERROR | 400 | 数据验证失败 | 检查请求数据格式和必填字段 |
| AUTHENTICATION_FAILED | 401 | 认证失败 | 检查API Key和签名 |
| PERMISSION_DENIED | 403 | 权限不足 | 联系管理员开通权限 |
| RESOURCE_NOT_FOUND | 404 | 资源不存在 | 确认资源标识是否正确 |
| DUPLICATE_RESOURCE | 409 | 重复资源 | 检查资源唯一性约束 |
| BUSINESS_VALIDATION_FAILED | 422 | 业务规则校验失败 | 检查业务规则约束 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 | 降低请求频率或联系管理员 |
| INTERNAL_SERVER_ERROR | 500 | 服务器内部错误 | 联系技术支持 |
| SERVICE_UNAVAILABLE | 503 | 服务暂时不可用 | 稍后重试 |


### 2.2.2. 同步相关错误码
| 错误码 | HTTP状态码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| BATCH_SIZE_EXCEEDED | 400 | 批量条数超过限制 | 分批发送 |
| SYNC_PARTIAL_SUCCESS | 207 | 部分同步成功 | 检查失败条目的错误信息 |
| DATA_CONSISTENCY_ERROR | 422 | 数据一致性错误 | 检查关联数据是否存在 |
| VERSION_MISMATCH | 422 | 版本不匹配 | 检查数据版本信息 |


### 2.2.3. 物料相关错误码
| 错误码 | HTTP状态码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| MATERIAL_NOT_FOUND | 404 | 物料不存在 | 先同步物料主数据 |
| MATERIAL_CODE_DUPLICATE | 409 | 物料编码重复 | 检查物料编码唯一性 |
| MATERIAL_STATUS_INVALID | 422 | 物料状态无效 | 检查状态流转规则 |


### 2.2.4. BOM相关错误码
| 错误码 | HTTP状态码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| BOM_ITEM_NOT_FOUND | 404 | BOM项不存在 | 确认BOM项信息 |
| CIRCULAR_REFERENCE | 400 | 检测到循环引用 | 检查并修复BOM结构 |
| HIERARCHY_ERROR | 422 | 层级错误 | 检查BOM层级关系 |


### 2.2.5. 文档相关错误码
| 错误码 | HTTP状态码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| DOCUMENT_NOT_FOUND | 404 | 文档不存在 | 确认文档标识 |
| DOCUMENT_VERSION_ERROR | 422 | 文档版本错误 | 检查版本号格式 |
| FILE_UPLOAD_FAILED | 500 | 文件上传失败 | 检查文件格式和大小 |


## 2.3. 错误响应格式
### 2.3.1. 标准错误响应
```json
{
  "code": 400,
  "message": "请求参数错误：物料编码不能为空",
  "timestamp": "2024-01-23T10:30:00Z",
  "requestId": "req_123456",
  "details": [
    {
      "field": "materialCode",
      "error": "不能为空",
      "position": "items[0].materialCode"
    }
  ]
}
```

### 2.3.2. 批量错误响应
```json
{
  "code": 207,
  "message": "部分数据处理失败",
  "timestamp": "2024-01-23T10:30:15Z",
  "requestId": "req_20240123_002",
  "data": {
    "totalCount": 5,
    "successCount": 3,
    "failureCount": 2,
    "failureItems": [
      {
        "index": 2,
        "errorCode": "VALIDATION_ERROR",
        "errorMessage": "物料编码已存在",
        "suggestion": "请检查物料编码唯一性"
      }
    ]
  }
}
```

### 2.3.3. 字段说明
| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 备注 |
| --- | --- | --- | --- | --- |
| code | 状态码 | Integer | 是 | HTTP状态码 |
| message | 消息描述 | String | 是 | 错误描述信息 |
| timestamp | 错误时间 | String | 是 | ISO 8601格式 |
| requestId | 请求ID | String | 是 | 与请求头中的X-Request-ID对应 |
| details | 错误详情 | Array | 否 | 具体错误信息列表 |
| details[].field | 字段名称 | String | 否 | 出错的字段名 |
| details[].error | 错误信息 | String | 否 | 字段级别的错误描述 |
| details[].position | 位置信息 | String | 否 | 错误在数据结构中的位置 |
| data | 批量错误数据 | Object | 否 | 批量处理时的错误详情 |


## 2.4. 状态码使用建议
### 2.4.1. 客户端处理建议
1. **2xx状态码**：请求成功，根据具体状态码处理响应数据
2. **4xx状态码**：客户端错误，检查请求参数和格式后重试
3. **5xx状态码**：服务器错误，稍后重试或联系技术支持
4. **207状态码**：部分成功，需要单独处理失败条目

### 2.4.2. 重试策略
1. **4xx错误**：不应重试，需要修复请求后重新发送
2. **5xx错误**：建议采用指数退避策略重试
3. **429错误**：按照响应头中的Retry-After建议等待后重试
4. **网络超时**：最多重试3次，每次间隔递增

### 2.4.3. 监控告警
1. **错误率监控**：监控4xx和5xx错误率，超过阈值时告警
2. **响应时间监控**：监控接口响应时间，超过阈值时告警
3. **成功率监控**：监控业务处理成功率，低于阈值时告警
4. **流量监控**：监控接口调用频率，异常时告警

---

# 3. 签名生成算法
## 3.1. 签名概述
### 3.1.1. 签名目的
1. **身份验证**：验证API调用者的身份
2. **请求完整性**：确保请求在传输过程中未被篡改
3. **防止重放攻击**：通过时间戳防止请求被重复使用
4. **数据安全**：保护敏感数据在传输过程中的安全

### 3.1.2. 签名参数
| 参数 | 说明 | 位置 | 是否必录 |
| --- | --- | --- | --- |
| API Key | 客户端标识 | 请求头 X-API-Key | 是 |
| API Secret | 客户端密钥 | 客户端保存，不传输 | 是 |
| Timestamp | 时间戳 | 请求头 X-Timestamp | 是 |
| Request Body | 请求体内容 | 请求体 | 是（POST/PUT请求） |
| Request Method | 请求方法 | HTTP Method | 是 |
| Request Path | 请求路径 | URL Path | 是 |


## 3.2. 签名生成步骤
### 3.2.1. 步骤说明
```plain
1. 获取当前时间戳（毫秒级）
2. 构造待签名字符串
3. 使用HMAC-SHA256算法生成签名
4. 将签名Base64编码
5. 将签名放入请求头
```

### 3.2.2. 待签名字符串构造规则
```plain
待签名字符串 = API Key + ":" + Timestamp + ":" + HTTP Method + ":" + Request Path + ":" + Request Body MD5
```

**说明**：

1. HTTP Method：全大写（GET, POST, PUT, DELETE）
2. Request Path：完整的请求路径，如`/api/qm/plm/materials/batch-sync`
3. Request Body MD5：请求体的MD5哈希值（小写十六进制），GET请求为空字符串

## 3.3. 代码示例
### 3.3.1. Java示例
```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.util.Base64;

public class SignatureGenerator {
    
    private static final String HMAC_SHA256 = "HmacSHA256";
    
    /**
     * 生成API签名
     * @param apiKey API密钥
     * @param apiSecret API密钥
     * @param timestamp 时间戳（毫秒）
     * @param method HTTP方法
     * @param path 请求路径
     * @param requestBody 请求体（可为空）
     * @return Base64编码的签名
     */
    public static String generateSignature(String apiKey, String apiSecret, 
                                          long timestamp, String method, 
                                          String path, String requestBody) {
        try {
            // 1. 计算请求体MD5
            String bodyMd5 = "";
            if (requestBody != null && !requestBody.isEmpty()) {
                MessageDigest md = MessageDigest.getInstance("MD5");
                byte[] digest = md.digest(requestBody.getBytes("UTF-8"));
                bodyMd5 = bytesToHex(digest).toLowerCase();
            }
            
            // 2. 构造待签名字符串
            String stringToSign = String.format("%s:%d:%s:%s:%s", 
                apiKey, timestamp, method.toUpperCase(), path, bodyMd5);
            
            // 3. 生成HMAC-SHA256签名
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(apiSecret.getBytes("UTF-8"), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] rawSignature = mac.doFinal(stringToSign.getBytes("UTF-8"));
            
            // 4. Base64编码
            return Base64.getEncoder().encodeToString(rawSignature);
            
        } catch (Exception e) {
            throw new RuntimeException("生成签名失败", e);
        }
    }
    
    /**
     * 字节数组转十六进制字符串
     */
    private static String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
```

### 3.3.2. Python示例
```python
import hashlib
import hmac
import base64
import time

def generate_signature(api_key, api_secret, timestamp, method, path, request_body=""):
    """
    生成API签名
    :param api_key: API密钥
    :param api_secret: API密钥
    :param timestamp: 时间戳（毫秒）
    :param method: HTTP方法
    :param path: 请求路径
    :param request_body: 请求体
    :return: Base64编码的签名
    """
    # 1. 计算请求体MD5
    body_md5 = ""
    if request_body:
        body_md5 = hashlib.md5(request_body.encode('utf-8')).hexdigest().lower()
    
    # 2. 构造待签名字符串
    string_to_sign = f"{api_key}:{timestamp}:{method.upper()}:{path}:{body_md5}"
    
    # 3. 生成HMAC-SHA256签名
    message = string_to_sign.encode('utf-8')
    secret = api_secret.encode('utf-8')
    signature = hmac.new(secret, message, digestmod=hashlib.sha256).digest()
    
    # 4. Base64编码
    return base64.b64encode(signature).decode('utf-8')


# 使用示例
api_key = "plm_2024_ak_001"
api_secret = "your_secret_key_here"
timestamp = int(time.time() * 1000)
method = "POST"
path = "/api/qm/plm/materials/batch-sync"
request_body = '{"operation":"CREATE","materialCode":"MAT-001"}'

signature = generate_signature(api_key, api_secret, timestamp, method, path, request_body)
print(f"生成的签名: {signature}")
```

## 3.4. 签名验证
### 3.4.1. 服务端验证步骤
```plain
1. 验证时间戳有效性（允许±5分钟误差）
2. 验证API Key是否存在
3. 重新计算签名
4. 比较签名是否一致
5. 验证请求是否重复（防重放）
```

### 3.4.2. 时间戳验证
```java
public class TimestampValidator {
    
    private static final long MAX_TIME_DIFF = 5 * 60 * 1000; // 5分钟
    
    public static boolean isValidTimestamp(long clientTimestamp) {
        long serverTimestamp = System.currentTimeMillis();
        long diff = Math.abs(serverTimestamp - clientTimestamp);
        return diff <= MAX_TIME_DIFF;
    }
}
```

### 3.4.3. 防重放攻击
```java
public class ReplayAttackPreventer {
    
    // 使用Redis等缓存记录已处理的请求
    private CacheService cacheService;
    
    public boolean isReplayRequest(String requestId, long timestamp) {
        String cacheKey = "request:" + requestId;
        
        // 检查是否已处理过该请求
        if (cacheService.exists(cacheKey)) {
            return true;
        }
        
        // 将请求ID缓存，设置过期时间为10分钟
        cacheService.set(cacheKey, "processed", 10 * 60);
        return false;
    }
}
```

## 3.5. 安全建议
### 3.5.1. 密钥管理
1. **密钥生成**：使用安全的随机数生成器生成密钥
2. **密钥存储**：密钥应加密存储，避免硬编码在代码中
3. **密钥轮换**：定期更换API密钥（建议每90天）
4. **权限分离**：为不同环境（开发、测试、生产）使用不同的密钥

### 3.5.2. 传输安全
1. **HTTPS加密**：所有API调用必须使用HTTPS
2. **敏感数据加密**：敏感数据在传输前应额外加密
3. **请求日志脱敏**：日志中不应记录完整的请求体和签名

### 3.5.3. 监控审计
1. **签名失败监控**：监控签名验证失败次数，异常时告警
2. **密钥使用审计**：记录API密钥的使用情况
3. **异常请求检测**：检测异常模式的请求

## 3.6. 故障排查
### 3.6.1. 常见问题
| 问题 | 可能原因 | 解决方案 |
| --- | --- | --- |
| 签名验证失败 | 时间戳误差过大 | 检查客户端和服务端时间同步 |
| 签名验证失败 | API密钥错误 | 检查API Key和Secret是否正确 |
| 签名验证失败 | 请求路径不一致 | 检查请求路径是否包含查询参数 |
| 签名验证失败 | 请求体MD5计算错误 | 检查请求体编码和MD5计算 |


### 3.6.2. 调试建议
1. **打印待签名字符串**：在客户端和服务端分别打印待签名字符串进行对比
2. **检查时间戳**：确认客户端和服务端时间同步
3. **验证密钥**：确认使用的API Key和Secret正确
4. **检查编码**：确认所有字符串使用UTF-8编码

### 3.6.3. 测试工具
```python
# 签名测试工具
import hashlib
import hmac
import base64
import json

def test_signature():
    api_key = "test_key"
    api_secret = "test_secret"
    timestamp = 1705996800000
    method = "POST"
    path = "/api/qm/plm/materials/batch-sync"
    request_body = json.dumps([{"operation": "CREATE", "materialCode": "TEST-001"}])
    
    # 计算期望的签名
    body_md5 = hashlib.md5(request_body.encode('utf-8')).hexdigest().lower()
    string_to_sign = f"{api_key}:{timestamp}:{method.upper()}:{path}:{body_md5}"
    print(f"待签名字符串: {string_to_sign}")
    
    signature = hmac.new(
        api_secret.encode('utf-8'),
        string_to_sign.encode('utf-8'),
        hashlib.sha256
    ).digest()
    
    signature_b64 = base64.b64encode(signature).decode('utf-8')
    print(f"生成的签名: {signature_b64}")
    return signature_b64

if __name__ == "__main__":
    test_signature()
```

# 4. 基础数据同步接口（PLM → QMS）
## 4.1. 物料主数据批量同步接口
### 4.1.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | PLM系统批量推送物料主数据到QMS系统，支持新增、更新、停用操作 |
| **接口地址** | `POST /api/qm/plm/materials/batch-sync` |
| **调用方向** | PLM → QMS |
| **数据流向** | PLM作为主数据源，向QMS同步物料信息 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（基于物料编码+版本组合的唯一性） |
| **批量大小** | 最大1000条/次，建议分批推送 |
| **同步频率** | 物料发布/变更时实时触发或定时（如每日凌晨）同步 |


### 4.1.2. 请求参数说明
#### 4.1.2.1. 请求体（Body）
**JSON数组格式**，每个元素代表一个物料对象：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 长度限制 | 备注 |
| --- | --- | --- | --- | --- | --- |
| operation | 操作类型 | String | 是 | - | `CREATE`：新增   `UPDATE`：更新   `DELETE`：停用 |
| materialCode | PLM物料编码 | String | 是 | 1-50 | 唯一标识符，不可重复 |
| materialName | 物料名称 | String | 是 | 1-200 |  |
| materialType | 物料类型 | String | 是 | 1-50 | `RAW`：原材料   `SEMI`：半成品   `FINISHED`：成品   `PACKAGE`：包装材料   `AUXILIARY`：辅料 |
| materialVersion | 物料版本 | String | 是 | 1-20 | 格式：`V1.0`，`V2.1`等 |
| specification | 规格型号 | String | 否 | 1-500 |  |
| unit | 计量单位 | String | 是 | 1-20 | `PCS`：个   `KG`：千克   `M`：米   `SET`：套 |
| status | 物料状态 | String | 是 | 1-20 | `ACTIVE`：激活   `INACTIVE`：停用   `OBSOLETE`：淘汰 |
| customerCode | 客户编码 | String | 否 | 1-50 | 对应QMS系统中的客户编码 |
| customerName | 客户名称 | String | 否 | 1-200 |  |
| supplierCode | 供应商编码 | String | 否 | 1-50 | 对应QMS系统中的供应商编码 |
| supplierName | 供应商名称 | String | 否 | 1-200 |  |
| productFamily | 产品系列 | String | 否 | 1-100 |  |
| brand | 品牌 | String | 否 | 1-100 |  |
| model | 型号 | String | 否 | 1-100 |  |
| weight | 重量 | Decimal | 否 | - | 单位：kg，精度：4位小数 |
| volume | 体积 | Decimal | 否 | - | 单位：m³，精度：4位小数 |
| color | 颜色 | String | 否 | 1-50 |  |
| materialGroup | 物料组 | String | 否 | 1-100 | 用于物料分类 |
| safetyStock | 安全库存 | Integer | 否 | - |  |
| minOrderQty | 最小订购量 | Integer | 否 | - |  |
| leadTime | 提前期（天） | Integer | 否 | - |  |
| isKeyComponent | 是否关键组件 | Boolean | 否 | - | `true`：关键组件   `false`：非关键 |
| isEnvironmentRelated | 是否环保相关 | Boolean | 否 | - | `true`：环保物料   `false`：普通物料 |
| isHazardous | 是否危险品 | Boolean | 否 | - | `true`：危险品   `false`：非危险品 |
| effectiveDate | 生效日期 | Date | 是 | - | 格式：`yyyy-MM-dd` |
| expiryDate | 失效日期 | Date | 否 | - | 格式：`yyyy-MM-dd`，为空表示长期有效 |
| technicalParameters | 技术参数 | Object | 否 | - | JSON对象，存储扩展技术参数 |
| remark | 备注 | String | 否 | 1-1000 |  |
| plmCreateTime | PLM创建时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmUpdateTime | PLM更新时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmOperator | PLM操作人 | String | 否 | 1-50 |  |


### 4.1.3. 响应参数说明
#### 4.1.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含本接口特有字段：

```json
{
  "code": 200,
  "message": "同步成功",
  "timestamp": "2024-01-23T10:30:00Z",
  "requestId": "req_20240123_001",
  "data": {
    "totalCount": 150,
    "successCount": 148,
    "failureCount": 2,
    "successItems": [
      {
        "materialCode": "MAT-2024-001",
        "qmsMaterialId": "100001",
        "status": "CREATED",
        "message": "物料创建成功"
      }
    ],
    "failureItems": [
      {
        "materialCode": "MAT-2024-150",
        "status": "FAILED",
        "errorCode": "VALIDATION_ERROR",
        "errorMessage": "物料编码已存在",
        "suggestion": "请检查物料编码唯一性"
      }
    ],
    "summary": {
      "createCount": 50,
      "updateCount": 95,
      "deleteCount": 3,
      "skipCount": 0
    },
    "nextSyncTime": "2024-01-24T02:00:00Z"
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.successItems | 成功条目列表 | Array |  |
| successItems.materialCode | 物料编码 | String |  |
| successItems.qmsMaterialId | QMS物料ID | String | QMS系统生成的物料ID |
| successItems.status | 处理状态 | String | `CREATED`/`UPDATED`/`DELETED`/`SKIPPED` |
| successItems.message | 成功消息 | String |  |
| data.failureItems | 失败条目列表 | Array |  |
| failureItems.materialCode | 物料编码 | String |  |
| failureItems.status | 处理状态 | String | `FAILED` |
| failureItems.errorCode | 错误码 | String | 业务错误码 |
| failureItems.errorMessage | 错误消息 | String |  |
| failureItems.suggestion | 处理建议 | String |  |
| data.summary | 操作统计 | Object |  |
| summary.createCount | 新增数量 | Integer |  |
| summary.updateCount | 更新数量 | Integer |  |
| summary.deleteCount | 删除数量 | Integer |  |
| summary.skipCount | 跳过数量 | Integer | 数据无变化时跳过 |
| data.nextSyncTime | 建议下次同步时间 | String | ISO 8601格式，可为空 |


### 4.1.4. 请求/响应示例
#### 4.1.4.1. 请求示例
```json
[
  {
    "operation": "CREATE",
    "materialCode": "MAT-2024-001",
    "materialName": "智能控制器主板",
    "materialType": "SEMI",
    "materialVersion": "V2.1",
    "specification": "尺寸：150*100mm，材质：FR-4",
    "unit": "PCS",
    "status": "ACTIVE",
    "customerCode": "CUST-001",
    "customerName": "华为技术有限公司",
    "supplierCode": "SUPP-1001",
    "supplierName": "富士康精密电子",
    "productFamily": "智能控制器系列",
    "brand": "华为",
    "model": "HC-8810",
    "weight": 0.25,
    "color": "黑色",
    "materialGroup": "电子组件",
    "isKeyComponent": true,
    "isEnvironmentRelated": false,
    "effectiveDate": "2024-01-01",
    "expiryDate": "2026-12-31",
    "technicalParameters": {
      "operatingTemperature": "-20℃ ~ 85℃",
      "storageTemperature": "-40℃ ~ 105℃",
      "humidity": "5% ~ 95% RH",
      "powerConsumption": "12W"
    },
    "remark": "用于智能家居控制器V2.1版本",
    "plmCreateTime": "2024-01-15 14:30:00",
    "plmUpdateTime": "2024-01-22 09:15:00",
    "plmOperator": "张工程师"
  }
]
```

#### 4.1.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "批量同步成功",
  "timestamp": "2024-01-23T10:30:15Z",
  "requestId": "req_20240123_001",
  "data": {
    "totalCount": 1,
    "successCount": 1,
    "failureCount": 0,
    "successItems": [
      {
        "materialCode": "MAT-2024-001",
        "qmsMaterialId": "100235",
        "status": "CREATED",
        "message": "物料创建成功，QMS编码：QM-MAT-235"
      }
    ],
    "failureItems": [],
    "summary": {
      "createCount": 1,
      "updateCount": 0,
      "deleteCount": 0,
      "skipCount": 0
    },
    "nextSyncTime": "2024-01-24T02:00:00Z"
  }
}
```

### 4.1.5. 业务规则与约束
#### 4.1.5.1. 数据校验规则
1. **唯一性校验**：`materialCode` + `materialVersion` 组合必须唯一
2. **客户/供应商关联**：客户编码和供应商编码必须在QMS中存在（如提供）
3. **版本管理**：版本号格式必须符合规范，且新版本生效日期必须晚于旧版本
4. **日期有效性**：生效日期不能晚于失效日期（如同时提供）
5. **状态流转**：状态变更需符合业务规则

#### 4.1.5.2. 操作类型规则
1. **CREATE操作**：
    - 物料编码+版本组合必须不存在于QMS中
    - 必须提供所有必填字段
    - 自动生成QMS物料编码（格式：`QM-MAT-{序列号}`）
2. **UPDATE操作**：
    - 物料编码+版本组合必须已存在于QMS中
    - 只更新提供的字段，未提供字段保持原值
3. **DELETE操作**：
    - 实际执行物料停用（状态置为INACTIVE）
    - 已关联BOM、订单等业务数据的物料不允许删除

#### 4.1.5.3. 批量处理规则
1. **事务性**：单个物料失败不影响其他物料处理
2. **顺序处理**：按数组顺序处理，建议相关物料按依赖顺序排列
3. **大小限制**：单次请求最大1000条，超过需分批
4. **性能建议**：建议每批100-200条物料以获得最佳性能

### 4.1.6. 错误码说明（本接口特有）
除通用状态码（见 **2. 通用状态码**）外，本接口可能返回以下业务错误码：

| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 404 | CUSTOMER_NOT_FOUND | 客户不存在 | 先同步客户主数据或检查客户编码 |
| 404 | SUPPLIER_NOT_FOUND | 供应商不存在 | 先同步供应商主数据或检查供应商编码 |
| 409 | MATERIAL_DUPLICATE | 物料重复 | 检查物料编码+版本的唯一性 |
| 422 | VERSION_CONFLICT | 版本冲突 | 检查版本号格式和递增规则 |


### 4.1.7. 调用频率限制
| 环境 | 最大请求频率 | 最大批量大小 | 每日限额 |
| --- | --- | --- | --- |
| 开发环境 | 10次/分钟 | 200条/次 | 10000条/天 |
| 测试环境 | 30次/分钟 | 500条/次 | 50000条/天 |
| 生产环境 | 60次/分钟 | 1000条/次 | 无限制 |


### 4.1.8. 注意事项
1. **数据一致性**：PLM作为主数据源，QMS以PLM数据为准
2. **版本控制**：物料版本变更时，需要同步更新相关BOM和工艺数据
3. **客户/供应商信息**：建议先同步客户/供应商基础数据，再同步物料数据
4. **异步处理**：对于大量数据同步，建议采用异步方式，先返回202状态码
5. **监控告警**：建议监控同步成功率，失败率超过5%时触发告警

---

## 4.2. BOM结构批量同步接口
### 4.2.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | PLM系统批量推送BOM结构数据到QMS系统，支持多层级BOM同步 |
| **接口地址** | `POST /api/qm/plm/boms/batch-sync` |
| **调用方向** | PLM → QMS |
| **数据流向** | PLM作为BOM主数据源，向QMS同步BOM结构 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（基于父件编码+版本+子件编码+序列号的唯一性） |
| **批量大小** | 最大500条/次（BOM层级关系复杂，建议分批） |
| **同步频率** | BOM发布/变更时实时触发，或定时（如每日凌晨）同步 |


### 4.2.2. 请求参数说明
#### 4.2.2.1. 请求体（Body）
**JSON数组格式**，每个元素代表一个BOM行项目：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 长度限制 | 备注 |
| --- | --- | --- | --- | --- | --- |
| operation | 操作类型 | String | 是 | - | `CREATE`：新增BOM项   `UPDATE`：更新BOM项   `DELETE`：删除BOM项 |
| parentMaterialCode | 父件物料编码 | String | 是 | 1-50 | PLM中的父件物料编码 |
| parentMaterialVersion | 父件物料版本 | String | 是 | 1-20 | 格式：`V1.0`，`V2.1`等 |
| componentMaterialCode | 子件物料编码 | String | 是 | 1-50 | PLM中的子件物料编码 |
| componentMaterialVersion | 子件物料版本 | String | 是 | 1-20 | 格式：`V1.0`，`V2.1`等 |
| bomVersion | BOM版本 | String | 是 | 1-20 | 格式：`V1.0`，`V2.1`等 |
| sequenceNumber | 序号 | Integer | 是 | - | 同一父件下子件的顺序，从1开始 |
| quantity | 用量 | Decimal | 是 | - | 精度：6位小数，默认4位 |
| unit | 单位 | String | 是 | 1-20 | `PCS`：个   `KG`：千克   `M`：米   `SET`：套 |
| bomLevel | BOM层级 | Integer | 是 | - | 从0开始，0为成品，1为一级组件 |
| isKeyComponent | 是否关键组件 | Boolean | 否 | - | `true`：关键组件   `false`：非关键 |
| isPhantom | 是否虚拟件 | Boolean | 否 | - | `true`：虚拟件（不实际存在）   `false`：实件 |
| scrapRate | 损耗率 | Decimal | 否 | - | 百分比，如5.00表示5% |
| effectiveDate | 生效日期 | Date | 是 | - | 格式：`yyyy-MM-dd` |
| expiryDate | 失效日期 | Date | 否 | - | 格式：`yyyy-MM-dd`，为空表示长期有效 |
| position | 位置 | String | 否 | 1-100 | 在父件中的安装位置 |
| referenceDesignator | 参考标识符 | String | 否 | 1-200 | 电路板上的参考标识符（如R1、C2） |
| assemblyMethod | 装配方法 | String | 否 | 1-100 | `SMT`：表面贴装   `THT`：通孔插装   `PRESS`：压接   `WELD`：焊接 |
| specialInstructions | 特殊说明 | String | 否 | 1-1000 | 装配、检验等特殊要求 |
| replacementGroup | 替代组 | String | 否 | 1-50 | 同一替代组内的组件可互相替代 |
| substitutionPriority | 替代优先级 | Integer | 否 | - | 同一替代组内的优先级，1为最高 |
| bomType | BOM类型 | String | 是 | 1-50 | `DESIGN`：设计BOM   `MANUFACTURING`：制造BOM   `SERVICE`：服务BOM |
| bomStatus | BOM状态 | String | 是 | 1-20 | `ACTIVE`：激活   `INACTIVE`：停用   `PLANNING`：计划中 |
| remark | 备注 | String | 否 | 1-1000 |  |
| plmCreateTime | PLM创建时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmUpdateTime | PLM更新时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmOperator | PLM操作人 | String | 否 | 1-50 |  |


### 4.2.3. 响应参数说明
#### 4.2.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含本接口特有字段：

```json
{
  "code": 200,
  "message": "BOM同步成功",
  "timestamp": "2024-01-23T10:35:00Z",
  "requestId": "req_20240123_002",
  "data": {
    "totalCount": 100,
    "successCount": 98,
    "failureCount": 2,
    "bomValidation": {
      "circularReferenceCheck": true,
      "materialExistenceCheck": true,
      "versionConsistencyCheck": true,
      "hierarchyValidation": true
    },
    "successItems": [
      {
        "parentMaterialCode": "PROD-2024-001",
        "componentMaterialCode": "MAT-2024-010",
        "bomVersion": "V2.0",
        "qmsBomId": "BOM-100235",
        "status": "CREATED",
        "message": "BOM项创建成功"
      }
    ],
    "failureItems": [
      {
        "parentMaterialCode": "PROD-2024-001",
        "componentMaterialCode": "MAT-2024-011",
        "bomVersion": "V2.0",
        "status": "FAILED",
        "errorCode": "MATERIAL_NOT_FOUND",
        "errorMessage": "子件物料MAT-2024-011在QMS中不存在",
        "suggestion": "请先同步物料主数据"
      }
    ],
    "summary": {
      "createCount": 60,
      "updateCount": 35,
      "deleteCount": 3,
      "skipCount": 2
    },
    "bomStatistics": {
      "totalProducts": 5,
      "totalComponents": 95,
      "maxBomLevel": 5,
      "averageComponentsPerProduct": 19,
      "keyComponentsCount": 12
    },
    "nextSyncTime": "2024-01-24T02:00:00Z"
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.bomValidation | BOM校验结果 | Object | BOM结构校验结果 |
| bomValidation.circularReferenceCheck | 循环引用检查 | Boolean | true表示无循环引用 |
| bomValidation.materialExistenceCheck | 物料存在性检查 | Boolean | true表示所有物料都存在 |
| bomValidation.versionConsistencyCheck | 版本一致性检查 | Boolean | true表示版本一致 |
| bomValidation.hierarchyValidation | 层级校验 | Boolean | true表示层级结构正确 |
| data.bomStatistics | BOM统计信息 | Object |  |
| bomStatistics.totalProducts | 产品总数 | Integer | 本次同步涉及的产品数量 |
| bomStatistics.totalComponents | 组件总数 | Integer | 本次同步涉及的组件数量 |
| bomStatistics.maxBomLevel | 最大BOM层级 | Integer |  |
| bomStatistics.averageComponentsPerProduct | 平均组件数/产品 | Decimal | 精度：2位小数 |
| bomStatistics.keyComponentsCount | 关键组件数量 | Integer |  |


### 4.2.4. 请求/响应示例
#### 4.2.4.1. 请求示例
```json
[
  {
    "operation": "CREATE",
    "parentMaterialCode": "PROD-2024-001",
    "parentMaterialVersion": "V2.0",
    "componentMaterialCode": "MAT-2024-010",
    "componentMaterialVersion": "V1.0",
    "bomVersion": "V2.0",
    "sequenceNumber": 1,
    "quantity": 1.0000,
    "unit": "PCS",
    "bomLevel": 1,
    "isKeyComponent": true,
    "isPhantom": false,
    "scrapRate": 2.50,
    "effectiveDate": "2024-01-01",
    "expiryDate": "2026-12-31",
    "position": "主板中央",
    "referenceDesignator": "U1",
    "assemblyMethod": "SMT",
    "specialInstructions": "使用无铅焊膏，回流焊温度曲线见工艺文件",
    "replacementGroup": "RG-001",
    "substitutionPriority": 1,
    "bomType": "MANUFACTURING",
    "bomStatus": "ACTIVE",
    "remark": "主控制器芯片，ESD敏感器件",
    "plmCreateTime": "2024-01-15 14:30:00",
    "plmUpdateTime": "2024-01-22 09:15:00",
    "plmOperator": "张工程师"
  }
]
```

#### 4.2.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "BOM批量同步成功",
  "timestamp": "2024-01-23T10:35:15Z",
  "requestId": "req_20240123_002",
  "data": {
    "totalCount": 1,
    "successCount": 1,
    "failureCount": 0,
    "bomValidation": {
      "circularReferenceCheck": true,
      "materialExistenceCheck": true,
      "versionConsistencyCheck": true,
      "hierarchyValidation": true
    },
    "successItems": [
      {
        "parentMaterialCode": "PROD-2024-001",
        "componentMaterialCode": "MAT-2024-010",
        "bomVersion": "V2.0",
        "qmsBomId": "BOM-100235",
        "status": "CREATED",
        "message": "BOM项创建成功，标识为关键组件"
      }
    ],
    "failureItems": [],
    "summary": {
      "createCount": 1,
      "updateCount": 0,
      "deleteCount": 0,
      "skipCount": 0
    },
    "bomStatistics": {
      "totalProducts": 1,
      "totalComponents": 1,
      "maxBomLevel": 1,
      "averageComponentsPerProduct": 1.0,
      "keyComponentsCount": 1
    },
    "nextSyncTime": "2024-01-24T02:00:00Z"
  }
}
```

### 4.2.5. 业务规则与约束
#### 4.2.5.1. 数据校验规则
1. **物料存在性**：所有父件和子件物料必须在QMS中存在
2. **唯一性校验**：父件+子件+BOM版本+序号组合必须唯一
3. **循环引用检查**：BOM结构中不允许出现循环引用
4. **版本一致性**：同一BOM版本中，父件和子件的物料版本必须匹配
5. **层级限制**：BOM层级最大不超过20层（可配置）

#### 4.2.5.2. 操作类型规则
1. **CREATE操作**：
    - BOM项必须不存在于QMS中
    - 必须提供所有必填字段
2. **UPDATE操作**：
    - BOM项必须已存在于QMS中
    - 不能更改父件或子件编码（需要删除后重新创建）
3. **DELETE操作**：
    - 实际执行BOM项停用（状态置为INACTIVE）
    - 已关联生产订单的BOM项不允许删除

#### 4.2.5.3. 批量处理规则
1. **事务性**：单个BOM项失败不影响其他BOM项处理
2. **顺序处理**：建议按产品编码和BOM层级顺序排列
3. **大小限制**：单次请求最大500条，超过需分批
4. **依赖关系**：建议先同步底层物料，再同步上层BOM

### 4.2.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 400 | CIRCULAR_REFERENCE | 检测到循环引用 | 检查并修复BOM结构 |
| 404 | PARENT_MATERIAL_NOT_FOUND | 父件物料不存在 | 先同步父件物料数据 |
| 404 | COMPONENT_MATERIAL_NOT_FOUND | 子件物料不存在 | 先同步子件物料数据 |
| 409 | BOM_ITEM_DUPLICATE | BOM项重复 | 检查父件+子件+BOM版本+序号的唯一性 |
| 422 | VERSION_MISMATCH | 版本不匹配 | 检查物料版本一致性 |
| 422 | HIERARCHY_ERROR | 层级错误 | 检查BOM层级关系 |


### 4.2.7. 调用频率限制
| 环境 | 最大请求频率 | 最大批量大小 | 每日限额 |
| --- | --- | --- | --- |
| 开发环境 | 10次/分钟 | 100条/次 | 5000条/天 |
| 测试环境 | 30次/分钟 | 300条/次 | 30000条/天 |
| 生产环境 | 60次/分钟 | 500条/次 | 无限制 |


### 4.2.8. 注意事项
1. **数据一致性**：BOM同步前，确保所有涉及的物料已同步到QMS
2. **版本管理**：BOM版本变更时，需确保所有相关物料版本一致
3. **性能优化**：对于大型BOM（超过1000行），建议分批同步
4. **实时性要求**：BOM变更对生产影响较大，建议实时同步
5. **校验机制**：同步后执行BOM完整性校验，生成校验报告

---

## 4.3. 技术规范与检验特性批量同步接口
### 4.3.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | PLM系统批量推送产品的技术规范、检验特性及关键质量特性（CTQ）到QMS系统 |
| **接口地址** | `POST /api/qm/plm/specs/batch-sync` |
| **调用方向** | PLM → QMS |
| **数据流向** | PLM作为技术规范主数据源，向QMS同步检验标准 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（基于产品编码+版本+特性编码的唯一性） |
| **批量大小** | 最大1000条/次 |
| **同步频率** | 技术规范发布/变更时实时触发，或定时（如每日凌晨）同步 |


### 4.3.2. 请求参数说明
#### 4.3.2.1. 请求体（Body）
**JSON数组格式**，每个元素代表一个技术规范或检验特性：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 长度限制 | 备注 |
| --- | --- | --- | --- | --- | --- |
| operation | 操作类型 | String | 是 | - | `CREATE`：新增   `UPDATE`：更新   `DELETE`：删除 |
| productCode | 产品编码 | String | 是 | 1-50 | PLM中的产品编码 |
| productVersion | 产品版本 | String | 是 | 1-20 | 格式：`V1.0`，`V2.1`等 |
| specCode | 特性编码 | String | 是 | 1-50 | 技术特性唯一编码 |
| specName | 特性名称 | String | 是 | 1-200 | 如：长度、直径、硬度等 |
| specType | 特性类型 | String | 是 | 1-50 | `DIMENSION`：尺寸   `MATERIAL`：材质   `SURFACE`：表面处理   `PERFORMANCE`：性能 |
| inspectionMethod | 检验方法 | String | 是 | 1-100 | `VISUAL`：目视   `MEASUREMENT`：测量   `TEST`：测试   `ANALYSIS`：分析 |
| measurementUnit | 计量单位 | String | 否 | 1-20 | `mm`：毫米   `g`：克   `Ω`：欧姆   `°C`：摄氏度 |
| nominalValue | 标称值 | Decimal | 否 | - | 精度根据特性要求 |
| upperLimit | 上限值 | Decimal | 否 | - | 最大值或上限 |
| lowerLimit | 下限值 | Decimal | 否 | - | 最小值或下限 |
| targetValue | 目标值 | Decimal | 否 | - | 理想值或中心值 |
| toleranceType | 公差类型 | String | 否 | 1-20 | `BILATERAL`：双边公差   `UNILATERAL_UPPER`：单边上公差   `UNILATERAL_LOWER`：单边下公差 |
| isCtq | 是否关键质量特性 | Boolean | 是 | - | `true`：CTQ特性   `false`：普通特性 |
| ctqLevel | CTQ等级 | String | 否 | 1-20 | `CRITICAL`：关键   `MAJOR`：重要   `MINOR`：次要 |
| isSpecialCharacteristic | 是否特殊特性 | Boolean | 是 | - | `true`：特殊特性   `false`：普通特性 |
| characteristicType | 特性类别 | String | 否 | 1-20 | `CRITICAL`：关键特性   `SIGNIFICANT`：重要特性   `SAFETY`：安全特性 |
| inspectionFrequency | 检验频次 | String | 否 | 1-100 | `EACH`：每件   `FIRST_LAST`：首末件   `HOURLY`：每小时 |
| sampleSize | 样本量 | String | 否 | 1-50 | 如：`5pcs`，`10%` |
| inspectionTool | 检验工具 | String | 否 | 1-200 | 如：卡尺、千分尺、硬度计 |
| gaugeId | 量具编号 | String | 否 | 1-50 | QMS系统中的量具编号 |
| specificationSource | 规范来源 | String | 否 | 1-200 | 如：国标、企标、客户要求 |
| effectiveDate | 生效日期 | Date | 是 | - | 格式：`yyyy-MM-dd` |
| expiryDate | 失效日期 | Date | 否 | - | 格式：`yyyy-MM-dd` |
| remark | 备注 | String | 否 | 1-1000 |  |
| plmCreateTime | PLM创建时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmUpdateTime | PLM更新时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmOperator | PLM操作人 | String | 否 | 1-50 |  |


### 4.3.3. 响应参数说明
#### 4.3.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含本接口特有字段：

```json
{
  "code": 200,
  "message": "技术规范同步成功",
  "timestamp": "2024-01-23T10:40:00Z",
  "requestId": "req_20240123_003",
  "data": {
    "totalCount": 150,
    "successCount": 148,
    "failureCount": 2,
    "specificationSummary": {
      "totalSpecs": 150,
      "ctqSpecs": 25,
      "specialCharacteristics": 18,
      "dimensionSpecs": 85,
      "materialSpecs": 30
    },
    "successItems": [
      {
        "productCode": "PROD-2024-001",
        "specCode": "SPEC-001",
        "qmsInspectionItemId": "INS-100235",
        "status": "CREATED",
        "message": "检验特性创建成功"
      }
    ],
    "failureItems": [
      {
        "productCode": "PROD-2024-001",
        "specCode": "SPEC-150",
        "status": "FAILED",
        "errorCode": "PRODUCT_NOT_FOUND",
        "errorMessage": "产品PROD-2024-001在QMS中不存在",
        "suggestion": "请先同步产品主数据"
      }
    ],
    "summary": {
      "createCount": 50,
      "updateCount": 95,
      "deleteCount": 3,
      "skipCount": 2
    },
    "nextSyncTime": "2024-01-24T02:00:00Z"
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.specificationSummary | 技术规范统计 | Object |  |
| specificationSummary.totalSpecs | 总特性数 | Integer |  |
| specificationSummary.ctqSpecs | CTQ特性数 | Integer | 关键质量特性数量 |
| specificationSummary.specialCharacteristics | 特殊特性数 | Integer |  |
| specificationSummary.dimensionSpecs | 尺寸特性数 | Integer |  |
| specificationSummary.materialSpecs | 材质特性数 | Integer |  |


### 4.3.4. 请求/响应示例
#### 4.3.4.1. 请求示例
```json
[
  {
    "operation": "CREATE",
    "productCode": "PROD-2024-001",
    "productVersion": "V2.0",
    "specCode": "SPEC-001",
    "specName": "主板长度",
    "specType": "DIMENSION",
    "inspectionMethod": "MEASUREMENT",
    "measurementUnit": "mm",
    "nominalValue": 150.00,
    "upperLimit": 150.20,
    "lowerLimit": 149.80,
    "targetValue": 150.00,
    "toleranceType": "BILATERAL",
    "isCtq": true,
    "ctqLevel": "CRITICAL",
    "isSpecialCharacteristic": true,
    "characteristicType": "CRITICAL",
    "inspectionFrequency": "EACH",
    "sampleSize": "5pcs",
    "inspectionTool": "数显卡尺",
    "gaugeId": "G-001",
    "specificationSource": "客户图纸TD-2024-001",
    "effectiveDate": "2024-01-01",
    "remark": "主板关键尺寸，影响装配",
    "plmCreateTime": "2024-01-15 14:30:00",
    "plmUpdateTime": "2024-01-22 09:15:00",
    "plmOperator": "张工程师"
  }
]
```

#### 4.3.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "技术规范批量同步成功",
  "timestamp": "2024-01-23T10:40:15Z",
  "requestId": "req_20240123_003",
  "data": {
    "totalCount": 1,
    "successCount": 1,
    "failureCount": 0,
    "specificationSummary": {
      "totalSpecs": 1,
      "ctqSpecs": 1,
      "specialCharacteristics": 1,
      "dimensionSpecs": 1,
      "materialSpecs": 0
    },
    "successItems": [
      {
        "productCode": "PROD-2024-001",
        "specCode": "SPEC-001",
        "qmsInspectionItemId": "INS-100235",
        "status": "CREATED",
        "message": "检验特性创建成功，已标记为CTQ特性"
      }
    ],
    "failureItems": [],
    "summary": {
      "createCount": 1,
      "updateCount": 0,
      "deleteCount": 0,
      "skipCount": 0
    },
    "nextSyncTime": "2024-01-24T02:00:00Z"
  }
}
```

### 4.3.5. 业务规则与约束
#### 4.3.5.1. 数据校验规则
1. **产品存在性**：产品编码必须在QMS中存在
2. **唯一性校验**：产品编码+版本+特性编码组合必须唯一
3. **数值合理性**：上限值≥目标值≥下限值（如均有值）
4. **CTQ标识**：isCtq=true时，ctqLevel必填
5. **特殊特性**：isSpecialCharacteristic=true时，characteristicType必填

#### 4.3.5.2. 操作类型规则
1. **CREATE操作**：
    - 特性编码在对应产品下必须唯一
    - 必须提供所有必填字段
2. **UPDATE操作**：
    - 特性必须已存在于QMS中
    - 只更新提供的字段，未提供字段保持原值
3. **DELETE操作**：
    - 实际执行特性停用
    - 已关联检验计划的特性不允许删除

#### 4.3.5.3. 批量处理规则
1. **事务性**：单个特性失败不影响其他特性处理
2. **顺序处理**：建议按产品编码和特性编码顺序排列
3. **大小限制**：单次请求最大1000条，超过需分批
4. **依赖关系**：先同步产品数据，再同步技术规范

### 4.3.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 404 | PRODUCT_NOT_FOUND | 产品不存在 | 先同步产品主数据 |
| 404 | GAUGE_NOT_FOUND | 量具不存在 | 先在QMS中维护量具信息 |
| 409 | SPEC_DUPLICATE | 特性编码重复 | 检查特性编码唯一性 |
| 422 | VALUE_RANGE_ERROR | 数值范围错误 | 检查上限、下限、目标值的关系 |
| 422 | CTQ_VALIDATION_ERROR | CTQ校验失败 | isCtq=true时，ctqLevel必填 |


### 4.3.7. 调用频率限制
| 环境 | 最大请求频率 | 最大批量大小 | 每日限额 |
| --- | --- | --- | --- |
| 开发环境 | 10次/分钟 | 200条/次 | 10000条/天 |
| 测试环境 | 30次/分钟 | 500条/次 | 50000条/天 |
| 生产环境 | 60次/分钟 | 1000条/次 | 无限制 |


### 4.3.8. 注意事项
1. **版本一致性**：技术规范版本需与产品版本保持一致
2. **量具管理**：检验工具和量具建议先在QMS中维护
3. **实时性**：关键特性的变更建议实时同步
4. **历史追溯**：保留技术规范变更历史，支持版本对比
5. **客户要求**：特别关注客户特殊要求的特性，确保完整同步

---

## 4.4. 工艺路线批量同步接口
### 4.4.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | PLM系统批量推送产品的工艺路线、工序定义及检验点到QMS系统，支持增删改操作。 |
| **接口地址** | `POST /api/qm/plm/routes/batch-sync` |
| **调用方向** | PLM → QMS |
| **数据流向** | PLM作为工艺主数据源，向QMS同步工艺路线。 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案。 |
| **幂等性** | ✅ 支持（基于产品编码+工艺路线版本+工序编码的唯一性）。 |
| **批量大小** | 最大500条/次（因工艺路线结构复杂，建议分批推送）。 |
| **同步频率** | 工艺路线发布或变更时实时触发，或按定时策略（如每日凌晨）同步。 |


### 4.4.2. 请求参数说明
#### 4.4.2.1. 请求体（Body）
**JSON数组格式**，每个元素代表一个工序定义：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 长度限制 | 备注 |
| --- | --- | --- | --- | --- | --- |
| operation | 操作类型 | String | 是 | - | `CREATE`：新增   `UPDATE`：更新   `DELETE`：删除（逻辑停用） |
| productCode | 产品编码 | String | 是 | 1-50 | PLM中的产品编码，必须在QMS中存在 |
| productVersion | 产品版本 | String | 是 | 1-20 | 格式：`V1.0`，`V2.1`等 |
| routeVersion | 工艺路线版本 | String | 是 | 1-20 | 格式：`V1.0`，`V2.1`等 |
| operationCode | 工序编码 | String | 是 | 1-50 | 工序唯一编码，同一产品+路线版本下必须唯一 |
| operationName | 工序名称 | String | 是 | 1-200 | 如：注塑、焊接、装配、检验 |
| sequenceNumber | 工序序号 | Integer | 是 | - | 从1开始，决定工序在路线中的执行顺序 |
| workCenterCode | 工作中心编码 | String | 否 | 1-50 | 对应QMS系统中的工作中心编码 |
| workCenterName | 工作中心名称 | String | 否 | 1-200 |  |
| equipmentCode | 设备编码 | String | 否 | 1-50 | 对应QMS设备主数据编码 |
| equipmentName | 设备名称 | String | 否 | 1-200 |  |
| equipmentType | 设备类型 | String | 否 | 1-100 | `INJECTION`：注塑机   `MILLING`：铣床   `ASSEMBLY_LINE`：装配线等 |
| standardTime | 标准工时 | Decimal | 否 | - | 单位：分钟，精度：2位小数 |
| setupTime | 准备时间 | Decimal | 否 | - | 单位：分钟，精度：2位小数 |
| isInspectionPoint | 是否检验点 | Boolean | 是 | - | `true`：检验工序   `false`：普通制造工序 |
| inspectionType | 检验类型 | String | 否 | 1-50 | `FIRST_PIECE`：首件检验   `PROCESS`：过程检验   `FINAL`：最终检验等，当`isInspectionPoint=true`时建议填写 |
| inspectionFrequency | 检验频次 | String | 否 | 1-100 | `EACH`：每件   `HOURLY`：每小时   `SHIFT`：每班   `LOT`：每批 |
| qualityControlPoint | 质量控制点 | String | 否 | 1-500 | 描述本工序需要控制的关键质量特性或要点 |
| specialInstructions | 特殊说明 | String | 否 | 1-1000 | 操作、安全、环境等特殊要求 |
| skillLevel | 技能等级 | String | 否 | 1-50 | `BASIC`：初级   `INTERMEDIATE`：中级   `ADVANCED`：高级 |
| operationParameters | 工序参数 | Object | 否 | - | JSON对象，存储扩展的工序参数，如温度、压力、速度等 |
| effectiveDate | 生效日期 | Date | 是 | - | 格式：`yyyy-MM-dd` |
| expiryDate | 失效日期 | Date | 否 | - | 格式：`yyyy-MM-dd`，为空表示长期有效 |
| remark | 备注 | String | 否 | 1-1000 |  |
| plmCreateTime | PLM创建时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmUpdateTime | PLM更新时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmOperator | PLM操作人 | String | 否 | 1-50 |  |


### 4.4.3. 响应参数说明
#### 4.4.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data` 对象中包含本接口特有的字段：

```json
{
  "code": 200,
  "message": "工艺路线同步成功",
  "timestamp": "2024-01-23T10:45:00Z",
  "requestId": "req_20240123_004",
  "data": {
    "totalCount": 50,
    "successCount": 48,
    "failureCount": 2,
    "routeSummary": {
      "totalOperations": 50,
      "inspectionPoints": 15,
      "manufacturingOperations": 35,
      "maxSequence": 25,
      "averageStandardTime": 8.5
    },
    "successItems": [
      {
        "productCode": "PROD-2024-001",
        "operationCode": "OP-010",
        "routeVersion": "V2.0",
        "qmsOperationId": "OP-100235",
        "status": "CREATED",
        "message": "工序创建成功"
      }
    ],
    "failureItems": [
      {
        "productCode": "PROD-2024-001",
        "operationCode": "OP-011",
        "routeVersion": "V2.0",
        "status": "FAILED",
        "errorCode": "WORK_CENTER_NOT_FOUND",
        "errorMessage": "工作中心WC-001在QMS中不存在",
        "suggestion": "请先在QMS中创建工作中心"
      }
    ],
    "summary": {
      "createCount": 30,
      "updateCount": 15,
      "deleteCount": 3,
      "skipCount": 2
    },
    "nextSyncTime": "2024-01-24T02:00:00Z"
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.routeSummary | 工艺路线统计摘要 | Object |  |
| routeSummary.totalOperations | 总工序数 | Integer | 本次同步处理的总工序条目数 |
| routeSummary.inspectionPoints | 检验点数量 | Integer | 标记为`isInspectionPoint=true`的工序数量 |
| routeSummary.manufacturingOperations | 制造工序数 | Integer | 普通制造工序数量 |
| routeSummary.maxSequence | 最大工序序号 | Integer | 反映本次同步的工艺路线长度 |
| routeSummary.averageStandardTime | 平均标准工时 | Decimal | 单位：分钟，精度：2位小数 |


### 4.4.4. 请求/响应示例
#### 4.4.4.1. 请求示例
```json
[
  {
    "operation": "CREATE",
    "productCode": "PROD-2024-001",
    "productVersion": "V2.0",
    "routeVersion": "V2.0",
    "operationCode": "OP-010",
    "operationName": "注塑成型",
    "sequenceNumber": 10,
    "workCenterCode": "WC-001",
    "workCenterName": "注塑车间",
    "equipmentCode": "EQ-001",
    "equipmentName": "200T注塑机",
    "equipmentType": "INJECTION",
    "standardTime": 2.50,
    "setupTime": 15.00,
    "isInspectionPoint": false,
    "specialInstructions": "模具温度控制在80-90℃，注射压力120MPa",
    "skillLevel": "INTERMEDIATE",
    "operationParameters": {
      "moldTemperature": "85℃",
      "injectionPressure": "120MPa",
      "coolingTime": "30s"
    },
    "effectiveDate": "2024-01-01",
    "remark": "关键成型工序，控制尺寸稳定性",
    "plmCreateTime": "2024-01-15 14:30:00",
    "plmUpdateTime": "2024-01-22 09:15:00",
    "plmOperator": "张工程师"
  },
  {
    "operation": "CREATE",
    "productCode": "PROD-2024-001",
    "productVersion": "V2.0",
    "routeVersion": "V2.0",
    "operationCode": "OP-020",
    "operationName": "首件检验",
    "sequenceNumber": 20,
    "workCenterCode": "WC-002",
    "workCenterName": "质检站",
    "isInspectionPoint": true,
    "inspectionType": "FIRST_PIECE",
    "inspectionFrequency": "EACH",
    "qualityControlPoint": "检查外观、尺寸、重量",
    "specialInstructions": "使用标准检具，记录实测数据",
    "skillLevel": "ADVANCED",
    "effectiveDate": "2024-01-01",
    "remark": "每班首件必须检验",
    "plmCreateTime": "2024-01-15 14:30:00",
    "plmUpdateTime": "2024-01-22 09:15:00",
    "plmOperator": "张工程师"
  }
]
```

#### 4.4.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "工艺路线批量同步成功",
  "timestamp": "2024-01-23T10:45:15Z",
  "requestId": "req_20240123_004",
  "data": {
    "totalCount": 2,
    "successCount": 2,
    "failureCount": 0,
    "routeSummary": {
      "totalOperations": 2,
      "inspectionPoints": 1,
      "manufacturingOperations": 1,
      "maxSequence": 20,
      "averageStandardTime": 2.5
    },
    "successItems": [
      {
        "productCode": "PROD-2024-001",
        "operationCode": "OP-010",
        "routeVersion": "V2.0",
        "qmsOperationId": "OP-100235",
        "status": "CREATED",
        "message": "工序创建成功，关联工作中心WC-001"
      },
      {
        "productCode": "PROD-2024-001",
        "operationCode": "OP-020",
        "routeVersion": "V2.0",
        "qmsOperationId": "OP-100236",
        "status": "CREATED",
        "message": "检验工序创建成功，标记为首件检验点"
      }
    ],
    "failureItems": [],
    "summary": {
      "createCount": 2,
      "updateCount": 0,
      "deleteCount": 0,
      "skipCount": 0
    },
    "nextSyncTime": "2024-01-24T02:00:00Z"
  }
}
```

### 4.4.5. 业务规则与约束
#### 4.4.5.1. 数据校验规则
1. **产品存在性**：`productCode` 必须在QMS中存在
2. **资源存在性**：如提供 `workCenterCode` 或 `equipmentCode`，则必须在QMS中存在
3. **唯一性校验**：`productCode` + `routeVersion` + `operationCode` 组合必须唯一
4. **序号有效性**：`sequenceNumber` 必须为大于0的整数，同一产品路线内序号不可重复
5. **检验点逻辑**：当 `isInspectionPoint=true` 时，建议填写 `inspectionType`

#### 4.4.5.2. 操作类型规则
1. **CREATE操作**：
    - 确保`operationCode`在对应产品路线下唯一
    - 必须提供所有必填字段
2. **UPDATE操作**：
    - 目标工序必须已存在于QMS中
    - 不支持通过UPDATE更改`productCode`, `routeVersion`, `operationCode`（需删除后重新创建）
3. **DELETE操作**：
    - 实际执行业务逻辑停用（标记失效）
    - 若工序已关联生产任务或检验记录，则不允许删除

#### 4.4.5.3. 批量处理规则
1. **事务性**：单条工序处理失败不影响批次内其他工序
2. **处理顺序**：建议请求体中的工序按`productCode`和`sequenceNumber`升序排列，便于处理
3. **批量限制**：单次请求最大500条，超过需分批发送
4. **依赖建议**：建议先同步产品、工作中心、设备等主数据，再同步工艺路线

### 4.4.6. 错误码说明（本接口特有）
除通用HTTP状态码及错误码外，本接口可能返回以下业务错误码：

| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 404 | PRODUCT_NOT_FOUND | 产品不存在 | 请先通过接口 **4.1** 同步产品数据 |
| 404 | WORK_CENTER_NOT_FOUND | 工作中心不存在 | 请在QMS中创建对应的工作中心主数据 |
| 404 | EQUIPMENT_NOT_FOUND | 设备不存在 | 请在QMS中创建对应的设备主数据 |
| 409 | OPERATION_DUPLICATE | 工序编码重复 | 检查同一产品、同一路线版本下的`operationCode`唯一性 |
| 422 | SEQUENCE_CONFLICT | 工序序号冲突 | 检查同一产品路线下的`sequenceNumber`是否重复 |


### 4.4.7. 调用频率限制
| 环境 | 最大请求频率 | 最大批量大小 | 每日限额 |
| --- | --- | --- | --- |
| 开发环境 | 10次/分钟 | 100条/次 | 5000条/天 |
| 测试环境 | 30次/分钟 | 300条/次 | 30000条/天 |
| 生产环境 | 60次/分钟 | 500条/次 | 无限制 |


### 4.4.8. 注意事项
1. **版本对齐**：`productVersion` 和 `routeVersion` 应保持明确的关联关系
2. **检验点集成**：标记为检验点的工序（`isInspectionPoint=true`）将自动与QMS检验系统关联，用于生成检验任务
3. **资源预维护**：为保障同步成功率，建议在同步工艺路线前，确保相关的工作中心、设备等资源已在QMS中维护
4. **变更影响评估**：工艺路线的变更（尤其是关键工序）可能触发QMS中的变化点管理流程

---

## 4.5. 文档元数据批量同步接口
### 4.5.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | PLM系统批量推送技术文档的元数据信息到QMS系统，建立文档关联关系 |
| **接口地址** | `POST /api/qm/plm/documents/metadata/batch-sync` |
| **调用方向** | PLM → QMS |
| **数据流向** | PLM作为文档主数据源，向QMS同步文档元数据 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（基于文档编号+版本的唯一性） |
| **批量大小** | 最大1000条/次 |
| **同步频率** | 文档发布/变更时实时触发或定时（如每日凌晨）同步 |


### 4.5.2. 请求参数说明
#### 4.5.2.1. 请求体（Body）
**JSON数组格式**，每个元素代表一个文档元数据：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 长度限制 | 备注 |
| --- | --- | --- | --- | --- | --- |
| operation | 操作类型 | String | 是 | - | `CREATE`：新增   `UPDATE`：更新   `DELETE`：删除（逻辑作废） |
| documentId | 文档编号 | String | 是 | 1-50 | PLM中的文档唯一编号 |
| documentName | 文档名称 | String | 是 | 1-500 | 文档完整名称 |
| documentType | 文档类型 | String | 是 | 1-50 | `DRAWING`：图纸   `SPECIFICATION`：规格书   `PROCEDURE`：作业指导书   `STANDARD`：标准   `CERTIFICATE`：证书   `REPORT`：报告 |
| documentVersion | 文档版本 | String | 是 | 1-20 | 格式：`V1.0`，`Rev.A`等 |
| documentStatus | 文档状态 | String | 是 | 1-20 | `DRAFT`：草案   `RELEASED`：已发布   `OBSOLETE`：已作废   `UNDER_REVISION`：修订中 |
| fileFormat | 文件格式 | String | 是 | 1-20 | `PDF`，`DWG`，`DOCX`，`XLSX`，`STEP`，`IGES` |
| fileSize | 文件大小 | Long | 否 | - | 单位：字节 |
| language | 语言 | String | 否 | 1-20 | `zh-CN`：简体中文   `en-US`：英文   `ja-JP`：日文 |
| securityLevel | 密级 | String | 否 | 1-50 | `PUBLIC`：公开   `INTERNAL`：内部   `CONFIDENTIAL`：机密   `SECRET`：秘密 |
| relatedProductCode | 关联产品编码 | String | 否 | 1-500 | 关联的产品编码，多个用逗号分隔 |
| relatedProductVersion | 关联产品版本 | String | 否 | 1-500 | 关联的产品版本，多个用逗号分隔 |
| relatedMaterialCode | 关联物料编码 | String | 否 | 1-1000 | 关联的物料编码，多个用逗号分隔 |
| documentCategory | 文档分类 | String | 否 | 1-100 | `DESIGN`：设计文档   `PROCESS`：工艺文档   `QUALITY`：质量文档   `PURCHASING`：采购文档 |
| keywords | 关键词 | String | 否 | 1-500 | 多个关键词用逗号分隔 |
| description | 描述 | String | 否 | 1-2000 | 文档内容摘要 |
| author | 作者 | String | 否 | 1-100 |  |
| department | 部门 | String | 否 | 1-100 |  |
| approver | 审批人 | String | 否 | 1-100 |  |
| approvalDate | 批准日期 | Date | 否 | - | 格式：`yyyy-MM-dd` |
| effectiveDate | 生效日期 | Date | 是 | - | 格式：`yyyy-MM-dd` |
| expiryDate | 失效日期 | Date | 否 | - | 格式：`yyyy-MM-dd` |
| plmStoragePath | PLM存储路径 | String | 否 | 1-500 | PLM系统中的存储路径 |
| downloadUrl | 下载地址 | String | 否 | 1-1000 | 文档下载URL（如有） |
| previewUrl | 预览地址 | String | 否 | 1-1000 | 文档在线预览URL（如有） |
| checksum | 校验和 | String | 否 | 1-100 | 文件MD5或SHA256校验值 |
| remark | 备注 | String | 否 | 1-1000 |  |
| plmCreateTime | PLM创建时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmUpdateTime | PLM更新时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmOperator | PLM操作人 | String | 否 | 1-50 |  |


### 4.5.3. 响应参数说明
#### 4.5.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含本接口特有字段：

```json
{
  "code": 200,
  "message": "文档元数据同步成功",
  "timestamp": "2024-01-23T10:50:00Z",
  "requestId": "req_20240123_005",
  "data": {
    "totalCount": 100,
    "successCount": 98,
    "failureCount": 2,
    "documentSummary": {
      "totalDocuments": 100,
      "drawings": 45,
      "specifications": 25,
      "procedures": 15,
      "standards": 10,
      "others": 5,
      "released": 80,
      "draft": 15,
      "obsolete": 5
    },
    "successItems": [
      {
        "documentId": "DRW-2024-001",
        "documentVersion": "V2.0",
        "qmsDocumentId": "DOC-100235",
        "status": "CREATED",
        "message": "文档元数据创建成功"
      }
    ],
    "failureItems": [
      {
        "documentId": "DRW-2024-100",
        "documentVersion": "V1.0",
        "status": "FAILED",
        "errorCode": "RELATED_PRODUCT_NOT_FOUND",
        "errorMessage": "关联产品PROD-2024-001在QMS中不存在",
        "suggestion": "请先同步产品主数据或检查产品编码"
      }
    ],
    "summary": {
      "createCount": 60,
      "updateCount": 35,
      "deleteCount": 3,
      "skipCount": 2
    },
    "nextSyncTime": "2024-01-24T02:00:00Z"
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.documentSummary | 文档统计 | Object |  |
| documentSummary.totalDocuments | 总文档数 | Integer |  |
| documentSummary.drawings | 图纸数量 | Integer |  |
| documentSummary.specifications | 规格书数量 | Integer |  |
| documentSummary.procedures | 作业指导书数量 | Integer |  |
| documentSummary.standards | 标准数量 | Integer |  |
| documentSummary.others | 其他文档数量 | Integer |  |
| documentSummary.released | 已发布文档数 | Integer |  |
| documentSummary.draft | 草案文档数 | Integer |  |
| documentSummary.obsolete | 已作废文档数 | Integer |  |


### 4.5.4. 请求/响应示例
#### 4.5.4.1. 请求示例
```json
[
  {
    "operation": "CREATE",
    "documentId": "DRW-2024-001",
    "documentName": "智能控制器主板装配图",
    "documentType": "DRAWING",
    "documentVersion": "V2.0",
    "documentStatus": "RELEASED",
    "fileFormat": "PDF",
    "fileSize": 2457600,
    "language": "zh-CN",
    "securityLevel": "INTERNAL",
    "relatedProductCode": "PROD-2024-001",
    "relatedProductVersion": "V2.0",
    "documentCategory": "DESIGN",
    "keywords": "主板,装配图,控制器",
    "description": "智能控制器主板各组件装配关系及尺寸标注",
    "author": "张工程师",
    "department": "研发部",
    "approver": "李经理",
    "approvalDate": "2024-01-15",
    "effectiveDate": "2024-01-20",
    "plmStoragePath": "/产品文档/PROD-2024-001/图纸/DRW-2024-001.pdf",
    "downloadUrl": "https://plm.example.com/documents/DRW-2024-001/download",
    "previewUrl": "https://plm.example.com/documents/DRW-2024-001/preview",
    "checksum": "a1b2c3d4e5f67890123456789abcdef",
    "remark": "用于生产装配和质量检验",
    "plmCreateTime": "2024-01-10 09:30:00",
    "plmUpdateTime": "2024-01-15 14:20:00",
    "plmOperator": "张工程师"
  },
  {
    "operation": "CREATE",
    "documentId": "SPEC-2024-001",
    "documentName": "外观检验标准",
    "documentType": "SPECIFICATION",
    "documentVersion": "V1.0",
    "documentStatus": "RELEASED",
    "fileFormat": "DOCX",
    "fileSize": 512000,
    "language": "zh-CN",
    "securityLevel": "INTERNAL",
    "relatedProductCode": "PROD-2024-001,PROD-2024-002",
    "documentCategory": "QUALITY",
    "keywords": "外观,检验,标准",
    "description": "产品外观缺陷判定标准及检验方法",
    "author": "王质检",
    "department": "质量部",
    "effectiveDate": "2024-01-01",
    "plmStoragePath": "/质量文档/检验标准/外观检验标准.docx",
    "checksum": "b2c3d4e5f6a7890123456789abcdef1",
    "remark": "所有产品通用外观检验标准",
    "plmCreateTime": "2023-12-20 10:15:00",
    "plmUpdateTime": "2024-01-05 11:30:00",
    "plmOperator": "王质检"
  }
]
```

#### 4.5.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "文档元数据批量同步成功",
  "timestamp": "2024-01-23T10:50:15Z",
  "requestId": "req_20240123_005",
  "data": {
    "totalCount": 2,
    "successCount": 2,
    "failureCount": 0,
    "documentSummary": {
      "totalDocuments": 2,
      "drawings": 1,
      "specifications": 1,
      "procedures": 0,
      "standards": 0,
      "others": 0,
      "released": 2,
      "draft": 0,
      "obsolete": 0
    },
    "successItems": [
      {
        "documentId": "DRW-2024-001",
        "documentVersion": "V2.0",
        "qmsDocumentId": "DOC-100235",
        "status": "CREATED",
        "message": "文档元数据创建成功，已关联产品PROD-2024-001"
      },
      {
        "documentId": "SPEC-2024-001",
        "documentVersion": "V1.0",
        "qmsDocumentId": "DOC-100236",
        "status": "CREATED",
        "message": "文档元数据创建成功"
      }
    ],
    "failureItems": [],
    "summary": {
      "createCount": 2,
      "updateCount": 0,
      "deleteCount": 0,
      "skipCount": 0
    },
    "nextSyncTime": "2024-01-24T02:00:00Z"
  }
}
```

### 4.5.5. 业务规则与约束
#### 4.5.5.1. 数据校验规则
1. **唯一性校验**：文档编号+版本组合必须唯一
2. **关联验证**：关联的产品编码必须在QMS中存在（如提供）
3. **状态流转**：文档状态变更需符合业务规则
4. **日期有效性**：生效日期不能晚于失效日期（如同时提供）
5. **版本管理**：文档版本应遵循版本控制规范

#### 4.5.5.2. 操作类型规则
1. **CREATE操作**：
    - 文档编号+版本组合必须唯一
    - 必须提供所有必填字段
2. **UPDATE操作**：
    - 文档必须已存在于QMS中
    - 不能更改文档编号和版本（需要创建新版本）
3. **DELETE操作**：
    - 实际执行文档作废（状态置为OBSOLETE）
    - 被引用的文档不允许删除

#### 4.5.5.3. 批量处理规则
1. **事务性**：单个文档失败不影响其他文档处理
2. **顺序处理**：建议按文档类型和编号顺序排列
3. **大小限制**：单次请求最大1000条，超过需分批
4. **依赖关系**：先同步产品数据，再同步关联文档

### 4.5.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 404 | RELATED_PRODUCT_NOT_FOUND | 关联产品不存在 | 先同步产品主数据或检查产品编码 |
| 404 | RELATED_MATERIAL_NOT_FOUND | 关联物料不存在 | 先同步物料主数据或检查物料编码 |
| 409 | DOCUMENT_DUPLICATE | 文档编号重复 | 检查文档编号+版本的唯一性 |
| 422 | VERSION_FORMAT_ERROR | 版本格式错误 | 检查版本号格式 |
| 422 | STATUS_TRANSITION_ERROR | 状态流转错误 | 检查文档状态变更是否合规 |


### 4.5.7. 调用频率限制
| 环境 | 最大请求频率 | 最大批量大小 | 每日限额 |
| --- | --- | --- | --- |
| 开发环境 | 10次/分钟 | 200条/次 | 10000条/天 |
| 测试环境 | 30次/分钟 | 500条/次 | 50000条/天 |
| 生产环境 | 60次/分钟 | 1000条/次 | 无限制 |


### 4.5.8. 注意事项
1. **文档关联**：确保文档与产品、物料的关联关系准确
2. **版本控制**：文档版本变更时，需同步更新关联关系
3. **权限管理**：注意文档密级，确保权限控制
4. **文件同步**：元数据同步后，实际文件可通过下载接口获取
5. **引用关系**：维护文档间的引用关系，支持文档追溯
6. **多语言支持**：多语言文档需分别同步元数据

---

## 4.6. 工程变更实时推送接口
### 4.6.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | PLM系统实时推送工程变更单（ECN/ECO）到QMS系统，触发变化点管理和质量风险评估 |
| **接口地址** | `POST /api/qm/plm/change-notifications` |
| **调用方向** | PLM → QMS |
| **数据流向** | PLM作为变更发起源，实时推送变更事件到QMS |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（基于变更单号+版本组合的唯一性） |
| **批量大小** | 单次推送，不支持批量 |
| **同步频率** | 事件驱动，ECN/ECO创建、审批、生效时实时触发 |


### 4.6.2. 请求参数说明
#### 4.6.2.1. 请求体（Body）
**JSON对象格式**，代表一个工程变更单：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 长度限制 | 备注 |
| --- | --- | --- | --- | --- | --- |
| ecnNumber | 变更单号 | String | 是 | 1-50 | ECN/ECO编号，唯一标识 |
| ecnTitle | 变更标题 | String | 是 | 1-200 | 变更单的标题描述 |
| ecnType | 变更类型 | String | 是 | 1-50 | `DESIGN_CHANGE`：设计变更   `PROCESS_CHANGE`：工艺变更   `MATERIAL_CHANGE`：材料变更   `SUPPLIER_CHANGE`：供应商变更   `EQUIPMENT_CHANGE`：设备变更   `ENVIRONMENT_CHANGE`：环境变更 |
| changeLevel | 变更等级 | String | 是 | 1-20 | `CRITICAL`：关键   `MAJOR`：重要   `MINOR`：一般   `MINOR`：微小 |
| changeReason | 变更原因 | String | 是 | 1-1000 | 变更的原因描述 |
| changeDescription | 变更描述 | String | 是 | 1-2000 | 变更的详细内容描述 |
| affectedProducts | 受影响产品 | Array | 是 | - | 受影响的产品列表，每个元素包含productCode和productVersion |
| affectedComponents | 受影响组件 | Array | 否 | - | 受影响的组件（BOM项）列表 |
| effectiveDate | 生效日期 | Date | 是 | - | 格式：`yyyy-MM-dd` |
| effectiveBatch | 生效批次 | String | 否 | 1-50 | 变更生效的生产批次号 |
| plmStatus | PLM状态 | String | 是 | 1-50 | `CREATED`：已创建   `APPROVED`：已批准   `RELEASED`：已发布   `IMPLEMENTED`：已实施 |
| priority | 优先级 | String | 是 | 1-20 | `URGENT`：紧急   `HIGH`：高   `MEDIUM`：中   `LOW`：低 |
| initiator | 发起人 | String | 是 | 1-100 | 变更发起人姓名 |
| initiatorDept | 发起部门 | String | 是 | 1-100 | 发起部门名称 |
| approver | 批准人 | String | 否 | 1-100 | 变更批准人姓名 |
| approvalDate | 批准日期 | Date | 否 | - | 格式：`yyyy-MM-dd` |
| attachmentUrls | 附件链接 | Array | 否 | - | 相关附件下载URL列表 |
| plmCreateTime | PLM创建时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmUpdateTime | PLM更新时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| remark | 备注 | String | 否 | 1-2000 | 其他补充信息 |


**affectedProducts数组元素结构：**

```json
{
  "productCode": "PROD-2024-001",
  "productVersion": "V2.0",
  "productName": "产品名称",
  "changeScope": "全部" // 或 "部分"
}
```

**affectedComponents数组元素结构：**

```json
{
  "componentCode": "MAT-2024-001",
  "componentVersion": "V1.0",
  "componentName": "组件名称",
  "changeType": "新增" // "新增"、"修改"、"删除"
}
```

### 4.6.3. 响应参数说明
#### 4.6.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含本接口特有字段：

```json
{
  "code": 202,
  "message": "变更单已接收，正在异步处理",
  "timestamp": "2024-01-23T11:00:00Z",
  "requestId": "req_20240123_006",
  "data": {
    "ecnNumber": "ECN-2024-001",
    "qmsChangePointId": "CP-100235",
    "processingStatus": "ACCEPTED",
    "estimatedCompletionTime": "2024-01-23T11:05:00Z",
    "trackingUrl": "/api/qm/change-points/CP-100235/status",
    "nextSteps": [
      "创建变化点管理单",
      "执行影响分析",
      "风险评估",
      "通知相关人员"
    ]
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.ecnNumber | 变更单号 | String | 与请求中的ecnNumber对应 |
| data.qmsChangePointId | QMS变化点ID | String | QMS系统生成的变化点管理单ID |
| data.processingStatus | 处理状态 | String | `ACCEPTED`：已接收   `PROCESSING`：处理中   `COMPLETED`：已完成（异步处理完成时） |
| data.estimatedCompletionTime | 预计完成时间 | String | ISO 8601格式，异步处理的预计完成时间 |
| data.trackingUrl | 跟踪URL | String | 查询处理状态的API地址 |
| data.nextSteps | 后续步骤 | Array | QMS将执行的后续处理步骤 |


### 4.6.4. 请求/响应示例
#### 4.6.4.1. 请求示例
```json
{
  "ecnNumber": "ECN-2024-001",
  "ecnTitle": "控制器主板材料变更",
  "ecnType": "MATERIAL_CHANGE",
  "changeLevel": "MAJOR",
  "changeReason": "原供应商停产，更换为替代材料",
  "changeDescription": "将原PCB板材FR-4更换为更高耐温的S1000-2材料，厚度从1.6mm调整为1.8mm",
  "affectedProducts": [
    {
      "productCode": "PROD-2024-001",
      "productVersion": "V2.0",
      "productName": "智能控制器",
      "changeScope": "全部"
    },
    {
      "productCode": "PROD-2024-002",
      "productVersion": "V1.5",
      "productName": "智能控制器Pro版",
      "changeScope": "部分"
    }
  ],
  "affectedComponents": [
    {
      "componentCode": "MAT-2024-100",
      "componentVersion": "V2.1",
      "componentName": "PCB主板",
      "changeType": "修改"
    },
    {
      "componentCode": "MAT-2024-101",
      "componentVersion": "V1.0",
      "componentName": "连接器",
      "changeType": "新增"
    }
  ],
  "effectiveDate": "2024-03-01",
  "effectiveBatch": "BATCH-20240301",
  "plmStatus": "APPROVED",
  "priority": "HIGH",
  "initiator": "张工程师",
  "initiatorDept": "研发部",
  "approver": "李经理",
  "approvalDate": "2024-01-22",
  "attachmentUrls": [
    "https://plm.example.com/attachments/ECN-2024-001-1.pdf",
    "https://plm.example.com/attachments/ECN-2024-001-2.dwg"
  ],
  "plmCreateTime": "2024-01-15 10:30:00",
  "plmUpdateTime": "2024-01-22 14:20:00",
  "remark": "需要重新进行可靠性测试"
}
```

#### 4.6.4.2. 成功响应示例（HTTP 202）
```json
{
  "code": 202,
  "message": "变更单已接收，正在异步处理",
  "timestamp": "2024-01-23T11:00:15Z",
  "requestId": "req_20240123_006",
  "data": {
    "ecnNumber": "ECN-2024-001",
    "qmsChangePointId": "CP-100235",
    "processingStatus": "ACCEPTED",
    "estimatedCompletionTime": "2024-01-23T11:05:00Z",
    "trackingUrl": "/api/qm/change-points/CP-100235/status",
    "nextSteps": [
      "创建变化点管理单",
      "执行影响分析",
      "风险评估",
      "通知相关人员"
    ]
  }
}
```

#### 4.6.4.3. 异步处理完成回调示例（Webhook）
当QMS完成变更处理后会向PLM配置的回调地址发送通知：

```json
{
  "eventType": "CHANGE_POINT_PROCESSED",
  "eventTime": "2024-01-23T11:04:30Z",
  "payload": {
    "ecnNumber": "ECN-2024-001",
    "qmsChangePointId": "CP-100235",
    "processingStatus": "COMPLETED",
    "completionTime": "2024-01-23T11:04:30Z",
    "result": {
      "changePointStatus": "APPROVED",
      "riskAssessment": {
        "riskLevel": "MEDIUM",
        "requiresPpap": true,
        "requiresCustomerApproval": false
      },
      "affectedItems": {
        "inspectionsUpdated": 5,
        "proceduresUpdated": 3,
        "documentsUpdated": 2
      },
      "notificationsSent": {
        "recipients": 8,
        "departments": ["质量部", "生产部", "采购部"]
      }
    },
    "errors": [],
    "warnings": ["部分检验标准需要人工确认"]
  }
}
```

### 4.6.5. 业务规则与约束
#### 4.6.5.1. 数据校验规则
1. **唯一性校验**：`ecnNumber` 在QMS中必须唯一，重复推送会被幂等处理
2. **产品存在性**：`affectedProducts`中的产品编码必须在QMS中存在
3. **组件存在性**：`affectedComponents`中的组件编码必须在QMS中存在（如提供）
4. **状态流转**：PLM状态必须符合业务流程
5. **日期有效性**：生效日期不能早于当前日期

#### 4.6.5.2. 变更类型映射规则
PLM变更类型自动映射为QMS的4M1E变化点类型：

+ `DESIGN_CHANGE` → 物料变化 (Material)
+ `PROCESS_CHANGE` → 方法变化 (Method)
+ `MATERIAL_CHANGE` → 物料变化 (Material)
+ `SUPPLIER_CHANGE` → 供应商变化 (Man)
+ `EQUIPMENT_CHANGE` → 设备变化 (Machine)
+ `ENVIRONMENT_CHANGE` → 环境变化 (Environment)

#### 4.6.5.3. 异步处理规则
1. **快速响应**：接口必须在2秒内返回响应，避免PLM调用超时
2. **异步处理**：变更的详细处理和风险评估在后台异步执行
3. **状态跟踪**：提供状态查询接口供PLM跟踪处理进度
4. **结果回调**：支持通过Webhook回调通知处理结果

### 4.6.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 202 | ACCEPTED | 已接收，正在处理 | 正常响应，使用trackingUrl查询进度 |
| 409 | ECN_DUPLICATE | 变更单重复 | 该ECN已在处理中或已完成，幂等返回成功 |
| 404 | PRODUCT_NOT_FOUND | 产品不存在 | 检查affectedProducts中的产品编码 |
| 404 | COMPONENT_NOT_FOUND | 组件不存在 | 检查affectedComponents中的组件编码 |
| 422 | INVALID_EFFECTIVE_DATE | 生效日期无效 | 生效日期不能早于当前日期 |
| 422 | INVALID_STATUS_TRANSITION | 状态流转无效 | 检查plmStatus的合法性 |


### 4.6.7. 调用频率限制
| 环境 | 最大请求频率 | 重试策略 | 超时设置 |
| --- | --- | --- | --- |
| 开发环境 | 5次/分钟 | 3次，间隔1分钟 | 请求超时：30秒 |
| 测试环境 | 10次/分钟 | 3次，间隔30秒 | 请求超时：30秒 |
| 生产环境 | 20次/分钟 | 3次，间隔10秒 | 请求超时：30秒 |


### 4.6.8. 注意事项
1. **实时性要求**：变更推送要求实时，建议PLM在变更状态变更为"APPROVED"时立即推送
2. **完整性验证**：QMS会对变更影响范围进行验证，缺失信息可能导致处理延迟
3. **关联数据**：变更可能触发BOM、工艺路线、检验标准等多个系统的更新
4. **风险评估**：QMS会根据变更等级和类型自动进行风险评估，生成风险报告
5. **通知机制**：变更处理过程中会自动通知相关人员（质量、生产、采购等）
6. **追溯要求**：所有变更必须有完整记录，支持质量追溯

---

## 4.7. APQP阶段状态推送接口
### 4.7.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | PLM系统实时推送APQP项目阶段状态变更到QMS系统，实现APQP流程协同 |
| **接口地址** | `POST /api/qm/plm/apqp-phase-updates` |
| **调用方向** | PLM → QMS |
| **数据流向** | PLM作为APQP流程管理源，实时推送阶段状态变更到QMS |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（基于项目编码+阶段编码+版本组合的唯一性） |
| **批量大小** | 单次推送，不支持批量 |
| **同步频率** | 事件驱动，APQP阶段状态变更时实时触发 |


### 4.7.2. 请求参数说明
#### 4.7.2.1. 请求体（Body）
**JSON对象格式**，代表一个APQP阶段状态更新：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 长度限制 | 备注 |
| --- | --- | --- | --- | --- | --- |
| projectCode | 项目编码 | String | 是 | 1-50 | APQP项目唯一编码 |
| projectName | 项目名称 | String | 是 | 1-200 | APQP项目名称 |
| customerCode | 客户编码 | String | 是 | 1-50 | 客户编码 |
| customerName | 客户名称 | String | 是 | 1-200 | 客户名称 |
| phaseCode | 阶段编码 | String | 是 | 1-50 | `PHASE_1`：计划和定义   `PHASE_2`：产品设计和开发   `PHASE_3`：过程设计和开发   `PHASE_4`：产品和过程确认   `PHASE_5`：反馈评定和纠正措施 |
| phaseName | 阶段名称 | String | 是 | 1-100 | 对应阶段的中文名称 |
| phaseStatus | 阶段状态 | String | 是 | 1-50 | `NOT_STARTED`：未开始   `IN_PROGRESS`：进行中   `COMPLETED`：已完成   `ON_HOLD`：暂停   `CANCELLED`：取消 |
| phaseVersion | 阶段版本 | String | 是 | 1-20 | 格式：`V1.0`，支持阶段内容更新 |
| startDate | 开始日期 | Date | 否 | - | 格式：`yyyy-MM-dd` |
| plannedCompletionDate | 计划完成日期 | Date | 否 | - | 格式：`yyyy-MM-dd` |
| actualCompletionDate | 实际完成日期 | Date | 否 | - | 格式：`yyyy-MM-dd` |
| phaseScore | 阶段评分 | Decimal | 否 | - | 阶段评审得分，0-100分 |
| phaseResult | 阶段结果 | String | 否 | 1-50 | `PASS`：通过   `FAIL`：未通过   `CONDITIONAL_PASS`：有条件通过 |
| gateReviewDate | 门评审日期 | Date | 否 | - | 格式：`yyyy-MM-dd` |
| gateReviewers | 门评审人员 | Array | 否 | - | 评审人员姓名列表 |
| deliverables | 交付物清单 | Array | 否 | - | 本阶段完成的交付物列表 |
| milestoneAchieved | 达成里程碑 | Boolean | 是 | - | `true`：已达成里程碑   `false`：未达成 |
| milestoneName | 里程碑名称 | String | 否 | 1-200 | 达成的里程碑名称 |
| relatedProducts | 关联产品 | Array | 是 | - | 本阶段关联的产品列表 |
| qualityRequirements | 质量要求 | String | 否 | 1-1000 | 本阶段的质量特殊要求 |
| risksAndIssues | 风险与问题 | Array | 否 | - | 本阶段识别的风险与问题列表 |
| nextPhasePlan | 下阶段计划 | Object | 否 | - | 下一阶段的计划信息 |
| plmUpdateTime | PLM更新时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| plmOperator | PLM操作人 | String | 否 | 1-50 |  |
| remark | 备注 | String | 否 | 1-1000 | 其他补充信息 |


**relatedProducts数组元素结构：**

```json
{
  "productCode": "PROD-2024-001",
  "productVersion": "V2.0",
  "productName": "产品名称",
  "developmentType": "全新开发" // "全新开发"、"改进型"、"变型"
}
```

**deliverables数组元素结构：**

```json
{
  "deliverableCode": "DEL-001",
  "deliverableName": "产品设计规范",
  "deliverableType": "DOCUMENT",
  "status": "COMPLETED",
  "completionDate": "2024-01-20",
  "owner": "张工程师"
}
```

**risksAndIssues数组元素结构：**

```json
{
  "riskCode": "RISK-001",
  "riskDescription": "设计复杂度高，可能导致开发延期",
  "riskLevel": "HIGH",
  "mitigationPlan": "增加设计评审频次",
  "owner": "李经理"
}
```

### 4.7.3. 响应参数说明
#### 4.7.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含本接口特有字段：

```json
{
  "code": 200,
  "message": "APQP阶段状态更新成功",
  "timestamp": "2024-01-23T11:10:00Z",
  "requestId": "req_20240123_007",
  "data": {
    "projectCode": "APQP-2024-001",
    "phaseCode": "PHASE_2",
    "phaseStatus": "COMPLETED",
    "qmsProjectId": "QMS-PROJ-100235",
    "qmsPhaseId": "QMS-PHASE-200345",
    "synchronizedActions": [
      "更新APQP项目阶段状态",
      "同步交付物到知识库",
      "更新PPAP时间计划",
      "通知质量团队"
    ],
    "nextQmsActions": [
      "准备PPAP提交资料",
      "安排过程能力研究",
      "制定控制计划"
    ],
    "qualityChecklist": {
      "completed": 8,
      "pending": 2,
      "overdue": 0
    }
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.projectCode | 项目编码 | String | 与请求中的projectCode对应 |
| data.phaseCode | 阶段编码 | String | 与请求中的phaseCode对应 |
| data.phaseStatus | 阶段状态 | String | QMS同步后的阶段状态 |
| data.qmsProjectId | QMS项目ID | String | QMS系统中的项目ID |
| data.qmsPhaseId | QMS阶段ID | String | QMS系统中的阶段ID |
| data.synchronizedActions | 同步执行的动作 | Array | QMS已执行的同步操作 |
| data.nextQmsActions | 建议的下步行动 | Array | QMS建议的质量管理下步行动 |
| data.qualityChecklist | 质量检查清单 | Object | 质量检查完成情况统计 |
| qualityChecklist.completed | 已完成项数 | Integer | 已完成的质量检查项 |
| qualityChecklist.pending | 待完成项数 | Integer | 待完成的质量检查项 |


+ qualityChecklist.overdue | 逾期项数 | Integer | 已逾期的质量检查项 |

### 4.7.4. 请求/响应示例
#### 4.7.4.1. 请求示例
```json
{
  "projectCode": "APQP-2024-001",
  "projectName": "新能源汽车控制器开发项目",
  "customerCode": "CUST-001",
  "customerName": "蔚来汽车",
  "phaseCode": "PHASE_2",
  "phaseName": "产品设计和开发",
  "phaseStatus": "COMPLETED",
  "phaseVersion": "V1.0",
  "startDate": "2024-01-01",
  "plannedCompletionDate": "2024-02-15",
  "actualCompletionDate": "2024-02-10",
  "phaseScore": 85.5,
  "phaseResult": "PASS",
  "gateReviewDate": "2024-02-10",
  "gateReviewers": ["张总工", "王质量", "李采购"],
  "deliverables": [
    {
      "deliverableCode": "DEL-001",
      "deliverableName": "产品设计规范",
      "deliverableType": "DOCUMENT",
      "status": "COMPLETED",
      "completionDate": "2024-01-20",
      "owner": "张工程师"
    },
    {
      "deliverableCode": "DEL-002",
      "deliverableName": "DFMEA分析报告",
      "deliverableType": "REPORT",
      "status": "COMPLETED",
      "completionDate": "2024-02-05",
      "owner": "李工程师"
    }
  ],
  "milestoneAchieved": true,
  "milestoneName": "设计冻结",
  "relatedProducts": [
    {
      "productCode": "PROD-2024-001",
      "productVersion": "V2.0",
      "productName": "新能源汽车控制器",
      "developmentType": "全新开发"
    }
  ],
  "qualityRequirements": "需满足ISO 26262功能安全要求，ASIL C等级",
  "risksAndIssues": [
    {
      "riskCode": "RISK-001",
      "riskDescription": "芯片供应不稳定，可能导致量产延期",
      "riskLevel": "HIGH",
      "mitigationPlan": "寻找替代供应商，建立安全库存",
      "owner": "王采购"
    }
  ],
  "nextPhasePlan": {
    "phaseCode": "PHASE_3",
    "phaseName": "过程设计和开发",
    "plannedStartDate": "2024-02-11",
    "plannedCompletionDate": "2024-03-31",
    "keyDeliverables": ["过程流程图", "PFMEA", "控制计划"]
  },
  "plmUpdateTime": "2024-02-10 16:30:00",
  "plmOperator": "王项目经理",
  "remark": "第二阶段提前5天完成，质量评审得分良好"
}
```

#### 4.7.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "APQP阶段状态更新成功",
  "timestamp": "2024-01-23T11:10:15Z",
  "requestId": "req_20240123_007",
  "data": {
    "projectCode": "APQP-2024-001",
    "phaseCode": "PHASE_2",
    "phaseStatus": "COMPLETED",
    "qmsProjectId": "QMS-PROJ-100235",
    "qmsPhaseId": "QMS-PHASE-200345",
    "synchronizedActions": [
      "更新APQP项目阶段状态",
      "同步交付物到知识库",
      "更新PPAP时间计划",
      "通知质量团队"
    ],
    "nextQmsActions": [
      "准备PPAP提交资料",
      "安排过程能力研究",
      "制定控制计划",
      "启动MSA分析"
    ],
    "qualityChecklist": {
      "completed": 12,
      "pending": 3,
      "overdue": 0
    }
  }
}
```

### 4.7.5. 业务规则与约束
#### 4.7.5.1. 数据校验规则
1. **项目存在性**：`projectCode` 对应的APQP项目必须在QMS中存在（可自动创建）
2. **阶段顺序**：阶段状态更新必须符合APQP阶段顺序（PHASE_1 → PHASE_5）
3. **状态流转**：阶段状态变更必须符合业务逻辑（如不能从COMPLETED变回IN_PROGRESS）
4. **客户关联**：`customerCode` 必须在QMS中存在
5. **产品关联**：`relatedProducts`中的产品编码必须在QMS中存在

#### 4.7.5.2. 阶段状态映射规则
PLM阶段状态与QMS质量阶段状态保持一致性：

+ `NOT_STARTED` → 未开始
+ `IN_PROGRESS` → 进行中
+ `COMPLETED` → 已完成
+ `ON_HOLD` → 暂停
+ `CANCELLED` → 取消

#### 4.7.5.3. 业务触发规则
根据阶段状态变更，QMS自动触发相应质量活动：

1. **阶段开始**：创建质量检查清单，分配质量任务
2. **阶段进行中**：监控质量指标，跟踪问题解决
3. **阶段完成**：
    - 阶段2完成：触发DFMEA到PFMEA的传递
    - 阶段3完成：启动PPAP资料准备
    - 阶段4完成：触发PPAP提交
    - 阶段5完成：启动量产质量监控

### 4.7.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 404 | PROJECT_NOT_FOUND | 项目不存在 | 检查projectCode或配置自动创建项目 |
| 404 | CUSTOMER_NOT_FOUND | 客户不存在 | 检查customerCode，先在QMS中创建客户 |
| 404 | PRODUCT_NOT_FOUND | 产品不存在 | 检查relatedProducts中的产品编码 |
| 422 | INVALID_PHASE_SEQUENCE | 阶段顺序错误 | 检查阶段编码顺序，必须按PHASE_1到PHASE_5顺序 |
| 422 | INVALID_STATUS_TRANSITION | 状态流转无效 | 检查phaseStatus变更的合法性 |
| 422 | MISSING_REQUIRED_DELIVERABLES | 缺失必要交付物 | 检查deliverables是否包含阶段必要交付物 |


### 4.7.7. 调用频率限制
| 环境 | 最大请求频率 | 重试策略 | 超时设置 |
| --- | --- | --- | --- |
| 开发环境 | 10次/分钟 | 3次，间隔1分钟 | 请求超时：30秒 |
| 测试环境 | 20次/分钟 | 3次，间隔30秒 | 请求超时：30秒 |
| 生产环境 | 30次/分钟 | 3次，间隔10秒 | 请求超时：30秒 |


### 4.7.8. 注意事项
1. **阶段完整性**：阶段完成时，应确保所有必要交付物已提交
2. **里程碑管理**：里程碑达成时，QMS会自动创建质量里程碑记录
3. **风险传递**：阶段识别的风险会自动传递到QMS风险管理模块
4. **PPAP触发**：阶段3完成时，QMS自动启动PPAP准备流程
5. **质量门禁**：阶段评审结果（PASS/FAIL）决定是否允许进入下一阶段
6. **时间协调**：QMS会根据阶段时间计划协调质量资源和工作安排
7. **知识管理**：阶段交付物自动同步到QMS知识库，支持质量人员查阅

---

# 5. 业务数据接口（QMS → PLM）
## 5.1. 物料/产品信息查询接口
### 5.1.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | QMS系统按条件查询PLM中的物料/产品信息，用于数据校验、信息补充等场景 |
| **接口地址** | `GET /api/qm/qms/materials` |
| **调用方向** | QMS → PLM |
| **数据流向** | QMS向PLM查询物料信息，获取最新或特定条件的物料数据 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（查询操作天然幂等） |
| **分页支持** | ✅ 支持分页，每页最大1000条 |
| **查询频率** | 按需查询，建议限制频率 |


### 5.1.2. 请求参数说明
#### 5.1.2.1. 查询参数（Query Parameters）
| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 示例值 | 备注 |
| --- | --- | --- | --- | --- | --- |
| materialCode | 物料编码 | String | 否 | `MAT-2024-001` | 精确匹配，支持多个，用逗号分隔 |
| materialName | 物料名称 | String | 否 | `控制器主板` | 模糊匹配，LIKE '%value%' |
| materialType | 物料类型 | String | 否 | `SEMI` | 精确匹配，可选值同 **4.1.2.1** |
| status | 物料状态 | String | 否 | `ACTIVE` | 精确匹配，可选值同 **4.1.2.1** |
| customerCode | 客户编码 | String | 否 | `CUST-001` | 精确匹配 |
| supplierCode | 供应商编码 | String | 否 | `SUPP-1001` | 精确匹配 |
| productFamily | 产品系列 | String | 否 | `智能控制器系列` | 模糊匹配 |
| lastUpdateTimeFrom | 最后更新时间开始 | DateTime | 否 | `2024-01-01 00:00:00` | 格式：`yyyy-MM-dd HH:mm:ss` |
| lastUpdateTimeTo | 最后更新时间结束 | DateTime | 否 | `2024-01-23 23:59:59` | 格式：`yyyy-MM-dd HH:mm:ss` |
| pageNum | 页码 | Integer | 否 | `1` | 从1开始，默认1 |
| pageSize | 每页条数 | Integer | 否 | `100` | 1-1000，默认100 |


### 5.1.3. 响应参数说明
#### 5.1.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含分页信息和物料列表：

```json
{
  "code": 200,
  "message": "查询成功",
  "timestamp": "2024-01-23T11:20:00Z",
  "requestId": "req_20240123_008",
  "data": {
    "total": 1500,
    "pageNum": 1,
    "pageSize": 100,
    "pages": 15,
    "list": [
      {
        "materialCode": "MAT-2024-001",
        "materialName": "智能控制器主板",
        "materialType": "SEMI",
        "materialVersion": "V2.1",
        "specification": "尺寸：150*100mm，材质：FR-4",
        "unit": "PCS",
        "status": "ACTIVE",
        "customerCode": "CUST-001",
        "customerName": "华为技术有限公司",
        "supplierCode": "SUPP-1001",
        "supplierName": "富士康精密电子",
        "productFamily": "智能控制器系列",
        "brand": "华为",
        "model": "HC-8810",
        "weight": 0.25,
        "color": "黑色",
        "materialGroup": "电子组件",
        "isKeyComponent": true,
        "isEnvironmentRelated": false,
        "isHazardous": false,
        "effectiveDate": "2024-01-01",
        "expiryDate": "2026-12-31",
        "plmCreateTime": "2024-01-15 14:30:00",
        "plmUpdateTime": "2024-01-22 09:15:00",
        "plmOperator": "张工程师"
      }
    ]
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.total | 总记录数 | Integer | 符合查询条件的总记录数 |
| data.pageNum | 当前页码 | Integer | 当前页码，从1开始 |
| data.pageSize | 每页条数 | Integer | 每页显示条数 |
| data.pages | 总页数 | Integer | 总页数 |
| data.list | 物料列表 | Array | 物料信息列表，字段与 **4.1.2.1** 中的字段对应，但可能只返回部分字段（根据PLM系统配置） |


### 5.1.4. 请求/响应示例
#### 5.1.4.1. 请求示例
```plain
GET /api/qm/qms/materials?materialType=SEMI&status=ACTIVE&pageNum=1&pageSize=10
```

#### 5.1.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "查询成功",
  "timestamp": "2024-01-23T11:20:15Z",
  "requestId": "req_20240123_008",
  "data": {
    "total": 150,
    "pageNum": 1,
    "pageSize": 10,
    "pages": 15,
    "list": [
      {
        "materialCode": "MAT-2024-001",
        "materialName": "智能控制器主板",
        "materialType": "SEMI",
        "materialVersion": "V2.1",
        "specification": "尺寸：150*100mm，材质：FR-4",
        "unit": "PCS",
        "status": "ACTIVE",
        "customerCode": "CUST-001",
        "customerName": "华为技术有限公司",
        "supplierCode": "SUPP-1001",
        "supplierName": "富士康精密电子",
        "effectiveDate": "2024-01-01",
        "expiryDate": "2026-12-31",
        "plmCreateTime": "2024-01-15 14:30:00",
        "plmUpdateTime": "2024-01-22 09:15:00"
      }
    ]
  }
}
```

### 5.1.5. 业务规则与约束
#### 5.1.5.1. 查询规则
1. **权限控制**：QMS只能查询其有权限访问的物料（如关联的客户、供应商等）
2. **数据范围**：默认只返回状态为`ACTIVE`的物料，除非指定其他状态
3. **性能考虑**：避免使用过于宽泛的模糊查询，建议结合其他条件缩小范围
4. **分页限制**：单页最大1000条，超过需分页查询

#### 5.1.5.2. 缓存建议
1. **客户端缓存**：QMS可将查询结果缓存，减少重复查询
2. **缓存时效**：物料信息变更不频繁，可设置较长缓存时间（如1小时）
3. **缓存更新**：当物料信息变更时，PLM可主动通知QMS清除缓存

### 5.1.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 400 | INVALID_PAGE_SIZE | 无效的每页条数 | pageSize必须在1-1000之间 |
| 400 | INVALID_DATE_FORMAT | 无效的日期格式 | 日期时间参数必须符合格式要求 |
| 429 | QUERY_FREQUENCY_EXCEEDED | 查询频率超限 | 降低查询频率，或联系PLM管理员调整限制 |


### 5.1.7. 调用频率限制
| 环境 | 最大请求频率 | 最大每页条数 | 每日限额 |
| --- | --- | --- | --- |
| 开发环境 | 30次/分钟 | 100条/页 | 10000条/天 |
| 测试环境 | 60次/分钟 | 500条/页 | 50000条/天 |
| 生产环境 | 120次/分钟 | 1000条/页 | 无限制 |


### 5.1.8. 注意事项
1. **数据一致性**：查询到的物料信息可能与QMS本地数据存在时间差，重要操作前建议重新查询
2. **网络超时**：查询接口可能返回大量数据，注意设置合理的超时时间
3. **字段可选性**：返回字段可能根据PLM系统配置而变化，QMS应做兼容处理
4. **安全考虑**：查询条件中避免传递敏感信息，响应中也不应包含敏感数据

---

## 5.2. BOM结构查询接口
### 5.2.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | QMS系统查询指定产品的BOM结构，用于检验计划制定、变化点影响分析等场景 |
| **接口地址** | `GET /api/qm/qms/boms/{productCode}` |
| **调用方向** | QMS → PLM |
| **数据流向** | QMS向PLM查询产品的BOM结构信息 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（查询操作天然幂等） |
| **层级限制** | 最大返回10层BOM结构 |
| **查询频率** | 按需查询，建议限制频率 |


### 5.2.2. 请求参数说明
#### 5.2.2.1. 路径参数（Path Parameters）
| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 示例值 | 备注 |
| --- | --- | --- | --- | --- | --- |
| productCode | 产品编码 | String | 是 | `PROD-2024-001` | 需要查询BOM的产品编码 |


#### 5.2.2.2. 查询参数（Query Parameters）
| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 示例值 | 备注 |
| --- | --- | --- | --- | --- | --- |
| bomVersion | BOM版本 | String | 否 | `V2.0` | 指定版本，不传则返回当前生效版本 |
| bomType | BOM类型 | String | 否 | `MANUFACTURING` | `DESIGN`：设计BOM   `MANUFACTURING`：制造BOM   `SERVICE`：服务BOM |
| includeInactive | 包含停用项 | Boolean | 否 | `false` | 默认false，只返回生效的BOM项 |
| maxLevel | 最大层级 | Integer | 否 | `5` | 1-10，默认返回所有层级 |
| expandPhantom | 展开虚拟件 | Boolean | 否 | `true` | 是否展开虚拟件的下级结构 |
| effectiveDate | 生效日期 | Date | 否 | `2024-01-23` | 格式：`yyyy-MM-dd`，查询指定日期的生效BOM |


### 5.2.3. 响应参数说明
#### 5.2.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含BOM结构信息：

```json
{
  "code": 200,
  "message": "BOM查询成功",
  "timestamp": "2024-01-23T11:25:00Z",
  "requestId": "req_20240123_009",
  "data": {
    "productCode": "PROD-2024-001",
    "productName": "智能控制器",
    "productVersion": "V2.0",
    "bomVersion": "V2.0",
    "bomType": "MANUFACTURING",
    "effectiveDate": "2024-01-01",
    "expiryDate": "2026-12-31",
    "totalComponents": 45,
    "totalLevels": 5,
    "keyComponents": 8,
    "bomStructure": [
      {
        "componentMaterialCode": "MAT-2024-010",
        "componentMaterialName": "主控制器芯片",
        "componentMaterialVersion": "V1.0",
        "sequenceNumber": 1,
        "quantity": 1.0000,
        "unit": "PCS",
        "bomLevel": 1,
        "isKeyComponent": true,
        "isPhantom": false,
        "scrapRate": 2.50,
        "effectiveDate": "2024-01-01",
        "expiryDate": "2026-12-31",
        "position": "主板中央",
        "referenceDesignator": "U1",
        "assemblyMethod": "SMT",
        "specialInstructions": "使用无铅焊膏",
        "children": [
          {
            "componentMaterialCode": "MAT-2024-011",
            "componentMaterialName": "芯片基座",
            "componentMaterialVersion": "V1.0",
            "sequenceNumber": 1,
            "quantity": 1.0000,
            "unit": "PCS",
            "bomLevel": 2,
            "isKeyComponent": false,
            "isPhantom": false,
            "position": "芯片底部",
            "referenceDesignator": "U1-1"
          }
        ]
      }
    ],
    "bomStatistics": {
      "level1Count": 8,
      "level2Count": 15,
      "level3Count": 12,
      "level4Count": 7,
      "level5Count": 3,
      "keyComponentsCount": 8,
      "phantomComponentsCount": 2,
      "totalQuantity": 156.5
    }
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.productCode | 产品编码 | String | 查询的产品编码 |
| data.productName | 产品名称 | String | 产品名称 |
| data.productVersion | 产品版本 | String | 产品版本 |
| data.bomVersion | BOM版本 | String | BOM版本 |
| data.bomType | BOM类型 | String | BOM类型 |
| data.effectiveDate | 生效日期 | String | 格式：`yyyy-MM-dd` |
| data.expiryDate | 失效日期 | String | 格式：`yyyy-MM-dd` |
| data.totalComponents | 总组件数 | Integer | BOM中所有组件的总数 |
| data.totalLevels | 总层级数 | Integer | BOM的最大层级 |
| data.keyComponents | 关键组件数 | Integer | 标记为关键组件的数量 |
| data.bomStructure | BOM结构 | Array | BOM树形结构，每个元素包含下级children |
| bomStructure.children | 下级组件 | Array | 下级组件的树形结构，可多层嵌套 |
| data.bomStatistics | BOM统计 | Object | BOM的统计信息 |
| bomStatistics.level1Count | 一级组件数 | Integer | 第一层级的组件数量 |
| bomStatistics.level2Count | 二级组件数 | Integer | 第二层级的组件数量 |
| bomStatistics.level3Count | 三级组件数 | Integer | 第三层级的组件数量 |
| bomStatistics.level4Count | 四级组件数 | Integer | 第四层级的组件数量 |
| bomStatistics.level5Count | 五级组件数 | Integer | 第五层级的组件数量 |
| bomStatistics.keyComponentsCount | 关键组件数 | Integer | 关键组件总数 |
| bomStatistics.phantomComponentsCount | 虚拟件数 | Integer | 虚拟件总数 |
| bomStatistics.totalQuantity | 总数量 | Decimal | BOM中所有组件的总数量（考虑用量） |


### 5.2.4. 请求/响应示例
#### 5.2.4.1. 请求示例
```plain
GET /api/qm/qms/boms/PROD-2024-001?bomVersion=V2.0&bomType=MANUFACTURING&maxLevel=3
```

#### 5.2.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "BOM查询成功",
  "timestamp": "2024-01-23T11:25:15Z",
  "requestId": "req_20240123_009",
  "data": {
    "productCode": "PROD-2024-001",
    "productName": "智能控制器",
    "productVersion": "V2.0",
    "bomVersion": "V2.0",
    "bomType": "MANUFACTURING",
    "effectiveDate": "2024-01-01",
    "expiryDate": "2026-12-31",
    "totalComponents": 25,
    "totalLevels": 3,
    "keyComponents": 5,
    "bomStructure": [
      {
        "componentMaterialCode": "MAT-2024-010",
        "componentMaterialName": "主控制器芯片",
        "componentMaterialVersion": "V1.0",
        "sequenceNumber": 1,
        "quantity": 1.0000,
        "unit": "PCS",
        "bomLevel": 1,
        "isKeyComponent": true,
        "isPhantom": false,
        "scrapRate": 2.50,
        "effectiveDate": "2024-01-01",
        "position": "主板中央",
        "referenceDesignator": "U1",
        "assemblyMethod": "SMT",
        "children": [
          {
            "componentMaterialCode": "MAT-2024-011",
            "componentMaterialName": "芯片基座",
            "componentMaterialVersion": "V1.0",
            "sequenceNumber": 1,
            "quantity": 1.0000,
            "unit": "PCS",
            "bomLevel": 2,
            "isKeyComponent": false,
            "isPhantom": false,
            "position": "芯片底部",
            "referenceDesignator": "U1-1"
          }
        ]
      }
    ],
    "bomStatistics": {
      "level1Count": 8,
      "level2Count": 12,
      "level3Count": 5,
      "keyComponentsCount": 5,
      "phantomComponentsCount": 1,
      "totalQuantity": 45.8
    }
  }
}
```

### 5.2.5. 业务规则与约束
#### 5.2.5.1. 查询规则
1. **产品存在性**：`productCode` 必须在PLM中存在
2. **版本指定**：如不指定`bomVersion`，默认返回当前生效的最新版本
3. **层级控制**：`maxLevel` 限制返回的层级深度，避免数据量过大
4. **虚拟件处理**：`expandPhantom` 控制是否展开虚拟件的下级结构

#### 5.2.5.2. 性能优化
1. **数据裁剪**：建议通过`maxLevel`参数控制返回的数据量
2. **缓存策略**：BOM结构变更不频繁，可设置客户端缓存
3. **增量查询**：可通过`lastUpdateTimeFrom`参数查询指定时间后的变更

### 5.2.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 404 | PRODUCT_NOT_FOUND | 产品不存在 | 检查productCode是否正确 |
| 404 | BOM_NOT_FOUND | BOM不存在 | 检查产品是否有对应类型的BOM |
| 400 | INVALID_MAX_LEVEL | 无效的最大层级 | maxLevel必须在1-10之间 |
| 400 | INVALID_BOM_TYPE | 无效的BOM类型 | bomType必须是有效值 |


### 5.2.7. 调用频率限制
| 环境 | 最大请求频率 | 最大层级 | 响应超时 |
| --- | --- | --- | --- |
| 开发环境 | 20次/分钟 | 5层 | 10秒 |
| 测试环境 | 40次/分钟 | 8层 | 10秒 |
| 生产环境 | 80次/分钟 | 10层 | 15秒 |


### 5.2.8. 注意事项
1. **数据量控制**：复杂产品的BOM可能包含数千个组件，注意通过参数控制返回数据量
2. **网络传输**：大型BOM结构可能产生较大的响应数据，注意网络传输时间
3. **版本管理**：不同版本的BOM可能结构差异很大，注意指定正确的版本
4. **时间有效性**：BOM有生效日期，查询时注意日期范围

---

## 5.3. 技术文档下载接口
### 5.3.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | QMS系统下载PLM中的技术文档文件，用于检验、生产等环节的文档查看 |
| **接口地址** | `GET /api/qm/qms/documents/{documentId}/download` |
| **调用方向** | QMS → PLM |
| **数据流向** | QMS从PLM下载技术文档文件 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（下载操作天然幂等） |
| **文件大小** | 最大500MB |
| **下载频率** | 按需下载，建议限制频率 |


### 5.3.2. 请求参数说明
#### 5.3.2.1. 路径参数（Path Parameters）
| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 示例值 | 备注 |
| --- | --- | --- | --- | --- | --- |
| documentId | 文档编号 | String | 是 | `DRW-2024-001` | 需要下载的文档编号 |


#### 5.3.2.2. 查询参数（Query Parameters）
| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 示例值 | 备注 |
| --- | --- | --- | --- | --- | --- |
| version | 文档版本 | String | 否 | `V2.0` | 指定版本，不传则返回最新版本 |
| format | 下载格式 | String | 否 | `PDF` | `ORIGINAL`：原始格式   `PDF`：PDF格式（如支持转换）   `IMAGE`：图片格式 |
| thumbnail | 缩略图 | Boolean | 否 | `false` | 是否下载缩略图（较小尺寸） |
| checkOnly | 仅检查 | Boolean | 否 | `false` | 仅检查文档是否存在，不返回文件内容 |


### 5.3.3. 响应参数说明
#### 5.3.3.1. 响应头（Headers）
| 字段名称 | 字段说明 | 示例值 | 备注 |
| --- | --- | --- | --- |
| Content-Type | 内容类型 | `application/pdf` | 根据文件类型变化 |
| Content-Disposition | 内容处置 | `attachment; filename="DRW-2024-001_V2.0.pdf"` | 下载文件名 |
| Content-Length | 内容长度 | `2457600` | 文件大小（字节） |
| X-Document-Id | 文档ID | `DRW-2024-001` | 文档编号 |
| X-Document-Version | 文档版本 | `V2.0` | 文档版本 |
| X-Document-Size | 文档大小 | `2.4MB` | 可读的文件大小 |
| X-Document-Checksum | 校验和 | `a1b2c3d4e5f67890123456789abcdef` | 文件MD5校验值 |
| X-Download-Expires | 下载有效期 | `2024-01-23T12:00:00Z` | 下载链接的有效期 |


#### 5.3.3.2. 响应体（Body）
成功时返回文件流，失败时返回JSON错误信息：

**成功响应（HTTP 200）：**

```plain
文件流（二进制数据）
```

**仅检查模式响应（checkOnly=true）：**

```json
{
  "code": 200,
  "message": "文档存在",
  "timestamp": "2024-01-23T11:30:00Z",
  "requestId": "req_20240123_010",
  "data": {
    "documentId": "DRW-2024-001",
    "documentName": "智能控制器主板装配图",
    "documentVersion": "V2.0",
    "fileFormat": "PDF",
    "fileSize": 2457600,
    "downloadUrl": "https://plm.example.com/documents/DRW-2024-001/download?version=V2.0",
    "checksum": "a1b2c3d4e5f67890123456789abcdef",
    "expiresAt": "2024-01-23T12:00:00Z"
  }
}
```

### 5.3.4. 请求/响应示例
#### 5.3.4.1. 请求示例
```plain
GET /api/qm/qms/documents/DRW-2024-001/download?version=V2.0&format=PDF
```

#### 5.3.4.2. 成功响应示例（HTTP 200）
响应头：

```plain
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="DRW-2024-001_V2.0.pdf"
Content-Length: 2457600
X-Document-Id: DRW-2024-001
X-Document-Version: V2.0
X-Document-Size: 2.4MB
X-Document-Checksum: a1b2c3d4e5f67890123456789abcdef
X-Download-Expires: 2024-01-23T12:00:00Z
```

响应体：PDF文件二进制数据

#### 5.3.4.3. 仅检查模式示例
```plain
GET /api/qm/qms/documents/DRW-2024-001/download?checkOnly=true
```

响应：

```json
{
  "code": 200,
  "message": "文档存在",
  "timestamp": "2024-01-23T11:30:15Z",
  "requestId": "req_20240123_010",
  "data": {
    "documentId": "DRW-2024-001",
    "documentName": "智能控制器主板装配图",
    "documentVersion": "V2.0",
    "fileFormat": "PDF",
    "fileSize": 2457600,
    "downloadUrl": "https://plm.example.com/documents/DRW-2024-001/download?version=V2.0",
    "checksum": "a1b2c3d4e5f67890123456789abcdef",
    "expiresAt": "2024-01-23T12:00:00Z"
  }
}
```

### 5.3.5. 业务规则与约束
#### 5.3.5.1. 权限控制
1. **文档权限**：QMS只能下载其有权限访问的文档
2. **安全级别**：密级为`SECRET`的文档需要额外权限验证
3. **下载限制**：同一文档短时间内多次下载可能被限制

#### 5.3.5.2. 性能优化
1. **分片下载**：支持Range头，实现断点续传
2. **压缩传输**：支持gzip压缩传输
3. **CDN加速**：大型文档可能通过CDN加速下载
4. **缓存策略**：文档内容变化不频繁，可设置客户端缓存

### 5.3.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 404 | DOCUMENT_NOT_FOUND | 文档不存在 | 检查documentId和version是否正确 |
| 403 | DOCUMENT_PERMISSION_DENIED | 文档权限不足 | 申请文档访问权限 |
| 403 | SECURITY_LEVEL_RESTRICTED | 安全级别限制 | 密级文档需要额外授权 |
| 400 | FILE_SIZE_EXCEEDED | 文件大小超限 | 文件超过500MB限制 |
| 410 | DOCUMENT_EXPIRED | 文档已过期 | 文档已失效，需获取新版本 |


+ 429 | DOWNLOAD_FREQUENCY_EXCEEDED | 下载频率超限 | 降低下载频率 |

### 5.3.7. 调用频率限制
| 环境 | 最大请求频率 | 最大文件大小 | 连接超时 |
| --- | --- | --- | --- |
| 开发环境 | 10次/分钟 | 50MB | 30秒 |
| 测试环境 | 20次/分钟 | 200MB | 60秒 |
| 生产环境 | 40次/分钟 | 500MB | 120秒 |


### 5.3.8. 注意事项
1. **网络稳定性**：大文件下载可能因网络问题中断，建议实现断点续传
2. **存储空间**：QMS端应确保有足够的存储空间保存下载的文档
3. **版本管理**：注意文档版本，确保下载的是正确的版本
4. **文件完整性**：下载后应使用校验和验证文件完整性
5. **安全存储**：下载的文档应安全存储，防止未授权访问

---

## 5.4. 工程变更单查询接口
### 5.4.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | QMS系统查询PLM中的工程变更单（ECN/ECO）信息，用于变更跟踪、状态同步等场景 |
| **接口地址** | `GET /api/qm/qms/change-orders` |
| **调用方向** | QMS → PLM |
| **数据流向** | QMS向PLM查询工程变更单信息 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（查询操作天然幂等） |
| **分页支持** | ✅ 支持分页，每页最大500条 |
| **查询频率** | 按需查询，建议限制频率 |


### 5.4.2. 请求参数说明
#### 5.4.2.1. 查询参数（Query Parameters）
| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 示例值 | 备注 |
| --- | --- | --- | --- | --- | --- |
| ecnNumber | 变更单号 | String | 否 | `ECN-2024-001` | 精确匹配，支持多个，用逗号分隔 |
| productCode | 产品编码 | String | 否 | `PROD-2024-001` | 精确匹配，查询影响指定产品的变更 |
| ecnType | 变更类型 | String | 否 | `DESIGN_CHANGE` | 精确匹配，可选值同 **4.6.2.1** |
| changeLevel | 变更等级 | String | 否 | `MAJOR` | 精确匹配，可选值同 **4.6.2.1** |
| plmStatus | PLM状态 | String | 否 | `APPROVED` | 精确匹配，可选值同 **4.6.2.1** |
| effectiveDateFrom | 生效日期开始 | Date | 否 | `2024-01-01` | 格式：`yyyy-MM-dd` |
| effectiveDateTo | 生效日期结束 | Date | 否 | `2024-12-31` | 格式：`yyyy-MM-dd` |
| createTimeFrom | 创建时间开始 | DateTime | 否 | `2024-01-01 00:00:00` | 格式：`yyyy-MM-dd HH:mm:ss` |
| createTimeTo | 创建时间结束 | DateTime | 否 | `2024-01-23 23:59:59` | 格式：`yyyy-MM-dd HH:mm:ss` |
| includeDetails | 包含详情 | Boolean | 否 | `false` | 是否包含变更详情（影响范围等） |
| pageNum | 页码 | Integer | 否 | `1` | 从1开始，默认1 |
| pageSize | 每页条数 | Integer | 否 | `100` | 1-500，默认100 |


### 5.4.3. 响应参数说明
#### 5.4.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含分页信息和变更单列表：

```json
{
  "code": 200,
  "message": "查询成功",
  "timestamp": "2024-01-23T11:35:00Z",
  "requestId": "req_20240123_011",
  "data": {
    "total": 120,
    "pageNum": 1,
    "pageSize": 10,
    "pages": 12,
    "summary": {
      "totalCount": 120,
      "designChangeCount": 45,
      "processChangeCount": 30,
      "materialChangeCount": 25,
      "supplierChangeCount": 15,
      "otherChangeCount": 5,
      "criticalCount": 10,
      "majorCount": 50,
      "minorCount": 60
    },
    "list": [
      {
        "ecnNumber": "ECN-2024-001",
        "ecnTitle": "控制器主板材料变更",
        "ecnType": "MATERIAL_CHANGE",
        "changeLevel": "MAJOR",
        "changeReason": "原供应商停产，更换为替代材料",
        "effectiveDate": "2024-03-01",
        "effectiveBatch": "BATCH-20240301",
        "plmStatus": "APPROVED",
        "priority": "HIGH",
        "initiator": "张工程师",
        "initiatorDept": "研发部",
        "approver": "李经理",
        "approvalDate": "2024-01-22",
        "plmCreateTime": "2024-01-15 10:30:00",
        "plmUpdateTime": "2024-01-22 14:20:00",
        "affectedProducts": [
          {
            "productCode": "PROD-2024-001",
            "productVersion": "V2.0",
            "productName": "智能控制器"
          }
        ],
        "details": {
          "affectedComponents": [
            {
              "componentCode": "MAT-2024-100",
              "componentVersion": "V2.1",
              "componentName": "PCB主板",
              "changeType": "修改"
            }
          ],
          "attachmentCount": 2,
          "riskAssessment": "需要重新进行可靠性测试"
        }
      }
    ]
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.total | 总记录数 | Integer | 符合查询条件的总记录数 |
| data.pageNum | 当前页码 | Integer | 当前页码，从1开始 |
| data.pageSize | 每页条数 | Integer | 每页显示条数 |
| data.pages | 总页数 | Integer | 总页数 |
| data.summary | 变更统计 | Object | 变更单的统计信息 |
| summary.totalCount | 总变更数 | Integer | 总变更单数量 |
| summary.designChangeCount | 设计变更数 | Integer | 设计变更数量 |
| summary.processChangeCount | 工艺变更数 | Integer | 工艺变更数量 |
| summary.materialChangeCount | 材料变更数 | Integer | 材料变更数量 |
| summary.supplierChangeCount | 供应商变更数 | Integer | 供应商变更数量 |
| summary.otherChangeCount | 其他变更数 | Integer | 其他变更数量 |
| summary.criticalCount | 关键变更数 | Integer | 关键等级变更数量 |
| summary.majorCount | 重要变更数 | Integer | 重要等级变更数量 |
| summary.minorCount | 一般变更数 | Integer | 一般等级变更数量 |
| data.list | 变更单列表 | Array | 变更单信息列表 |
| list[].details | 变更详情 | Object | 当includeDetails=true时返回，包含详细信息 |


### 5.4.4. 请求/响应示例
#### 5.4.4.1. 请求示例
```plain
GET /api/qm/qms/change-orders?productCode=PROD-2024-001&plmStatus=APPROVED&pageNum=1&pageSize=5&includeDetails=true
```

#### 5.4.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "查询成功",
  "timestamp": "2024-01-23T11:35:15Z",
  "requestId": "req_20240123_011",
  "data": {
    "total": 8,
    "pageNum": 1,
    "pageSize": 5,
    "pages": 2,
    "summary": {
      "totalCount": 8,
      "designChangeCount": 3,
      "processChangeCount": 2,
      "materialChangeCount": 2,
      "supplierChangeCount": 1,
      "otherChangeCount": 0,
      "criticalCount": 1,
      "majorCount": 4,
      "minorCount": 3
    },
    "list": [
      {
        "ecnNumber": "ECN-2024-001",
        "ecnTitle": "控制器主板材料变更",
        "ecnType": "MATERIAL_CHANGE",
        "changeLevel": "MAJOR",
        "changeReason": "原供应商停产，更换为替代材料",
        "effectiveDate": "2024-03-01",
        "plmStatus": "APPROVED",
        "priority": "HIGH",
        "initiator": "张工程师",
        "initiatorDept": "研发部",
        "approver": "李经理",
        "approvalDate": "2024-01-22",
        "plmCreateTime": "2024-01-15 10:30:00",
        "plmUpdateTime": "2024-01-22 14:20:00",
        "affectedProducts": [
          {
            "productCode": "PROD-2024-001",
            "productVersion": "V2.0",
            "productName": "智能控制器"
          }
        ],
        "details": {
          "affectedComponents": [
            {
              "componentCode": "MAT-2024-100",
              "componentVersion": "V2.1",
              "componentName": "PCB主板",
              "changeType": "修改"
            }
          ],
          "attachmentCount": 2,
          "riskAssessment": "需要重新进行可靠性测试"
        }
      }
    ]
  }
}
```

### 5.4.5. 业务规则与约束
#### 5.4.5.1. 查询规则
1. **权限控制**：QMS只能查询其有权限访问的变更单（如关联的产品、客户等）
2. **状态过滤**：默认只返回状态为`APPROVED`或`RELEASED`的变更单，除非指定其他状态
3. **时间范围**：建议通过时间范围限制查询，避免返回过多数据
4. **详情控制**：`includeDetails` 控制是否返回详细的变更影响信息

#### 5.4.5.2. 性能优化
1. **分页查询**：变更单数量可能较多，必须使用分页查询
2. **字段选择**：默认只返回基本信息，详情信息需明确请求
3. **缓存策略**：变更单信息变更不频繁，可设置客户端缓存
4. **增量同步**：可通过`createTimeFrom`参数实现增量查询

### 5.4.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 400 | INVALID_DATE_RANGE | 无效的日期范围 | 结束日期不能早于开始日期 |
| 400 | INVALID_PAGE_SIZE | 无效的每页条数 | pageSize必须在1-500之间 |
| 404 | PRODUCT_NOT_FOUND | 产品不存在 | 检查productCode是否正确 |
| 429 | QUERY_FREQUENCY_EXCEEDED | 查询频率超限 | 降低查询频率 |


### 5.4.7. 调用频率限制
| 环境 | 最大请求频率 | 最大每页条数 | 每日限额 |
| --- | --- | --- | --- |
| 开发环境 | 20次/分钟 | 100条/页 | 5000条/天 |
| 测试环境 | 40次/分钟 | 250条/页 | 25000条/天 |
| 生产环境 | 80次/分钟 | 500条/页 | 无限制 |


### 5.4.8. 注意事项
1. **数据时效性**：变更单状态可能随时变化，查询结果可能有时间差
2. **关联数据**：变更单可能关联大量数据（附件、影响范围等），注意性能影响
3. **权限差异**：不同用户可能看到不同的变更单列表，注意权限控制
4. **状态同步**：QMS查询到的变更单状态可能与本地状态不一致，需要定期同步

---

## 5.5. 质量问题反馈批量推送接口
### 5.5.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | QMS系统批量推送设计相关的质量问题汇总到PLM系统，支持设计改进建议反馈 |
| **接口地址** | `POST /api/qm/qms/quality-issues/batch-push` |
| **调用方向** | QMS → PLM |
| **数据流向** | QMS向PLM推送质量问题分析结果，用于设计改进 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（基于反馈批次ID+问题编码的唯一性） |
| **批量大小** | 最大500条/次 |
| **推送频率** | 定时（如每日/每周）批量推送，或重大问题时实时推送 |


### 5.5.2. 请求参数说明
#### 5.5.2.1. 请求体（Body）
**JSON数组格式**，每个元素代表一个质量问题反馈：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 长度限制 | 备注 |
| --- | --- | --- | --- | --- | --- |
| feedbackId | 反馈ID | String | 是 | 1-50 | QMS生成的唯一反馈标识 |
| productCode | 产品编码 | String | 是 | 1-50 | 出现质量问题的产品编码 |
| productVersion | 产品版本 | String | 是 | 1-20 | 产品版本 |
| issueCode | 问题编码 | String | 是 | 1-50 | 质量问题分类编码 |
| issueName | 问题名称 | String | 是 | 1-200 | 质量问题描述 |
| issueType | 问题类型 | String | 是 | 1-50 | `DESIGN_RELATED`：设计相关   `PROCESS_RELATED`：工艺相关   `MATERIAL_RELATED`：材料相关   `ASSEMBLY_RELATED`：装配相关 |
| severity | 严重程度 | String | 是 | 1-20 | `CRITICAL`：严重   `MAJOR`：重大   `MODERATE`：一般   `MINOR`：轻微 |
| frequency | 发生频率 | String | 是 | 1-50 | `CONTINUOUS`：持续发生   `FREQUENT`：频繁   `OCCASIONAL`：偶尔   `RARE`：罕见 |
| occurrenceCount | 发生次数 | Integer | 是 | - | 统计周期内的发生次数 |
| firstOccurrenceDate | 首次发生日期 | Date | 是 | - | 格式：`yyyy-MM-dd` |
| lastOccurrenceDate | 最近发生日期 | Date | 是 | - | 格式：`yyyy-MM-dd` |
| affectedQuantity | 影响数量 | Integer | 是 | - | 受影响的产品/组件数量 |
| scrapQuantity | 报废数量 | Integer | 否 | - | 因此问题导致的报废数量 |
| reworkQuantity | 返工数量 | Integer | 否 | - | 因此问题导致的返工数量 |
| rootCauseAnalysis | 根本原因分析 | String | 是 | 1-2000 | 问题根本原因分析 |
| isDesignRelated | 是否设计相关 | Boolean | 是 | - | `true`：设计原因导致   `false`：非设计原因 |
| designRootCause | 设计根本原因 | String | 否 | 1-1000 | 当isDesignRelated=true时必填 |
| improvementSuggestion | 改进建议 | String | 是 | 1-2000 | 针对问题的改进建议 |
| priority | 改进优先级 | String | 是 | 1-20 | `URGENT`：紧急   `HIGH`：高   `MEDIUM`：中   `LOW`：低 |
| estimatedImprovementEffect | 预计改进效果 | String | 否 | 1-500 | 预计改进后可达到的效果 |
| relatedDocuments | 相关文档 | Array | 否 | - | 相关质量报告、图片等文档链接 |
| detectionMethod | 检测方法 | String | 否 | 1-200 | 发现此问题的方法 |
| responsibleDept | 责任部门 | String | 否 | 1-100 | QMS分析认定的责任部门 |
| correctiveActions | 纠正措施 | Array | 否 | - | 已采取的临时纠正措施 |
| preventiveActions | 预防措施 | Array | 否 | - | 建议的预防措施 |
| feedbackTime | 反馈时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| feedbackBy | 反馈人 | String | 是 | 1-100 | 反馈人姓名 |
| feedbackDept | 反馈部门 | String | 是 | 1-100 | 反馈部门 |
| remark | 备注 | String | 否 | 1-1000 | 其他补充信息 |


**relatedDocuments数组元素结构：**

```json
{
  "documentType": "REPORT",
  "documentName": "质量分析报告",
  "documentUrl": "https://qms.example.com/reports/QA-2024-001.pdf",
  "thumbnailUrl": "https://qms.example.com/reports/QA-2024-001-thumb.jpg"
}
```

**correctiveActions数组元素结构：**

```json
{
  "actionCode": "CA-001",
  "actionDescription": "增加100%全检",
  "implementedDate": "2024-01-20",
  "effectiveness": "有效"
}
```

### 5.5.3. 响应参数说明
#### 5.5.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含本接口特有字段：

```json
{
  "code": 200,
  "message": "质量问题反馈推送成功",
  "timestamp": "2024-01-23T11:40:00Z",
  "requestId": "req_20240123_012",
  "data": {
    "totalCount": 50,
    "successCount": 48,
    "failureCount": 2,
    "feedbackSummary": {
      "totalIssues": 50,
      "designRelatedIssues": 25,
      "criticalIssues": 5,
      "majorIssues": 15,
      "moderateIssues": 20,
      "minorIssues": 10,
      "estimatedCostImpact": 125000.50
    },
    "successItems": [
      {
        "feedbackId": "FB-2024-001",
        "issueCode": "ISS-001",
        "plmImprovementId": "IMP-100235",
        "status": "ACCEPTED",
        "message": "问题反馈已接收，已创建改进建议单IMP-100235"
      }
    ],
    "failureItems": [
      {
        "feedbackId": "FB-2024-050",
        "issueCode": "ISS-050",
        "status": "FAILED",
        "errorCode": "PRODUCT_NOT_FOUND",
        "errorMessage": "产品PROD-2024-100在PLM中不存在",
        "suggestion": "检查产品编码是否正确"
      }
    ],
    "summary": {
      "designImprovementSuggestions": 25,
      "processImprovementSuggestions": 15,
      "materialImprovementSuggestions": 8,
      "otherSuggestions": 2
    },
    "plmProcessingInfo": {
      "estimatedReviewTime": "3个工作日",
      "reviewWorkflow": "设计评审→工程评估→改进实施",
      "contactPerson": "张设计经理",
      "contactEmail": "zhang.design@company.com"
    }
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.feedbackSummary | 反馈统计 | Object |  |
| feedbackSummary.totalIssues | 总问题数 | Integer |  |
| feedbackSummary.designRelatedIssues | 设计相关问题数 | Integer |  |
| feedbackSummary.criticalIssues | 严重问题数 | Integer |  |
| feedbackSummary.majorIssues | 重大问题数 | Integer |  |
| feedbackSummary.moderateIssues | 一般问题数 | Integer |  |
| feedbackSummary.minorIssues | 轻微问题数 | Integer |  |
| feedbackSummary.estimatedCostImpact | 预计成本影响 | Decimal | 单位：元 |
| data.plmProcessingInfo | PLM处理信息 | Object |  |
| plmProcessingInfo.estimatedReviewTime | 预计评审时间 | String |  |
| plmProcessingInfo.reviewWorkflow | 评审流程 | String | PLM内部处理流程 |
| plmProcessingInfo.contactPerson | 联系人 | String | PLM端对接人 |
| plmProcessingInfo.contactEmail | 联系邮箱 | String | 对接人邮箱 |


### 5.5.4. 请求/响应示例
#### 5.5.4.1. 请求示例
```json
[
  {
    "feedbackId": "FB-2024-001",
    "productCode": "PROD-2024-001",
    "productVersion": "V2.0",
    "issueCode": "ISS-001",
    "issueName": "主板焊接虚焊",
    "issueType": "DESIGN_RELATED",
    "severity": "MAJOR",
    "frequency": "FREQUENT",
    "occurrenceCount": 25,
    "firstOccurrenceDate": "2024-01-05",
    "lastOccurrenceDate": "2024-01-22",
    "affectedQuantity": 500,
    "scrapQuantity": 15,
    "reworkQuantity": 35,
    "rootCauseAnalysis": "焊盘设计尺寸偏小，导致焊接面积不足，在温度变化时容易产生虚焊",
    "isDesignRelated": true,
    "designRootCause": "焊盘直径设计为0.8mm，建议改为1.0mm以增加焊接面积",
    "improvementSuggestion": "修改PCB设计，将焊盘直径从0.8mm增加到1.0mm，优化焊盘形状",
    "priority": "HIGH",
    "estimatedImprovementEffect": "预计可将虚焊率从5%降低到0.5%以下",
    "relatedDocuments": [
      {
        "documentType": "REPORT",
        "documentName": "虚焊问题分析报告",
        "documentUrl": "https://qms.example.com/reports/solder-void-2024-001.pdf"
      },
      {
        "documentType": "IMAGE",
        "documentName": "虚焊位置显微镜照片",
        "documentUrl": "https://qms.example.com/images/solder-void-001.jpg",
        "thumbnailUrl": "https://qms.example.com/images/solder-void-001-thumb.jpg"
      }
    ],
    "detectionMethod": "X射线检测+电性能测试",
    "responsibleDept": "研发部",
    "correctiveActions": [
      {
        "actionCode": "CA-001",
        "actionDescription": "增加焊后X射线全检",
        "implementedDate": "2024-01-15",
        "effectiveness": "部分有效"
      }
    ],
    "preventiveActions": [
      {
        "actionCode": "PA-001",
        "actionDescription": "更新PCB设计规范，明确焊盘最小尺寸要求"
      }
    ],
    "feedbackTime": "2024-01-23 11:00:00",
    "feedbackBy": "王质量工程师",
    "feedbackDept": "质量部",
    "remark": "此问题在高温高湿环境下更易发生"
  }
]
```

#### 5.5.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "质量问题反馈批量推送成功",
  "timestamp": "2024-01-23T11:40:15Z",
  "requestId": "req_20240123_012",
  "data": {
    "totalCount": 1,
    "successCount": 1,
    "failureCount": 0,
    "feedbackSummary": {
      "totalIssues": 1,
      "designRelatedIssues": 1,
      "criticalIssues": 0,
      "majorIssues": 1,
      "moderateIssues": 0,
      "minorIssues": 0,
      "estimatedCostImpact": 15000.00
    },
    "successItems": [
      {
        "feedbackId": "FB-2024-001",
        "issueCode": "ISS-001",
        "plmImprovementId": "IMP-100235",
        "status": "ACCEPTED",
        "message": "问题反馈已接收，已创建设计改进单IMP-100235，分配至研发部张工程师处理"
      }
    ],
    "failureItems": [],
    "summary": {
      "designImprovementSuggestions": 1,
      "processImprovementSuggestions": 0,
      "materialImprovementSuggestions": 0,
      "otherSuggestions": 0
    },
    "plmProcessingInfo": {
      "estimatedReviewTime": "5个工作日",
      "reviewWorkflow": "设计评审→DFMEA更新→设计修改→验证测试",
      "contactPerson": "张设计经理",
      "contactEmail": "zhang.design@company.com"
    }
  }
}
```

### 5.5.5. 业务规则与约束
#### 5.5.5.1. 数据校验规则
1. **产品存在性**：`productCode` 必须在PLM中存在
2. **问题唯一性**：`feedbackId` + `issueCode` 组合必须唯一，避免重复推送
3. **严重程度关联**：`severity` 为 `CRITICAL` 或 `MAJOR` 时，必须提供详细的根因分析和改进建议
4. **设计相关性**：`isDesignRelated` = `true` 时，`designRootCause` 必填
5. **数据完整性**：必须提供完整的发生频率、影响数量等量化数据

#### 5.5.5.2. 推送策略
1. **批量推送**：建议每日/每周定时批量推送，减少接口调用频率
2. **实时推送**：对于严重程度为 `CRITICAL` 的问题，建议实时单独推送
3. **优先级处理**：PLM会根据 `priority` 字段决定处理顺序
4. **反馈闭环**：PLM处理完成后，应通过相应接口将处理结果反馈给QMS

#### 5.5.5.3. 处理流程
1. **问题接收**：PLM接收问题反馈，创建改进建议单
2. **问题分析**：设计团队分析问题根因，评估改进方案
3. **方案设计**：制定具体的设计改进方案
4. **评审批准**：组织跨部门评审，批准改进方案
5. **实施跟踪**：跟踪改进方案实施进度和效果

### 5.5.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 404 | PRODUCT_NOT_FOUND | 产品不存在 | 检查productCode是否正确 |
| 409 | FEEDBACK_DUPLICATE | 反馈重复 | 检查feedbackId+issueCode的唯一性 |
| 422 | INCOMPLETE_ANALYSIS | 分析不完整 | 严重问题必须提供完整的根因分析和改进建议 |
| 422 | INVALID_SEVERITY | 无效的严重程度 | severity必须是有效值 |
| 422 | MISSING_DESIGN_ROOT_CAUSE | 缺失设计根因 | isDesignRelated=true时，designRootCause必填 |


### 5.5.7. 调用频率限制
| 环境 | 最大请求频率 | 最大批量大小 | 每日限额 |
| --- | --- | --- | --- |
| 开发环境 | 10次/分钟 | 100条/次 | 1000条/天 |
| 测试环境 | 20次/分钟 | 300条/次 | 5000条/天 |
| 生产环境 | 30次/分钟 | 500条/次 | 无限制 |


### 5.5.8. 注意事项
1. **问题分类**：准确的问题分类有助于PLM快速分配处理部门
2. **数据量化**：提供详细的量化数据（发生次数、影响数量等）有助于问题优先级评估
3. **证据充分**：提供相关文档、图片等证据，便于设计团队分析
4. **建议具体**：改进建议应尽可能具体、可实施
5. **跟踪要求**：重要问题的改进需要跟踪实施效果，形成质量改进闭环
6. **跨部门协同**：涉及多个部门的问题，需要明确责任部门和协同部门

---

## 5.6. PPAP审批结果推送接口
### 5.6.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | QMS系统将PPAP（生产件批准程序）的审批结果和客户反馈推送到PLM系统 |
| **接口地址** | `POST /api/qm/qms/ppap-approvals` |
| **调用方向** | QMS → PLM |
| **数据流向** | QMS向PLM推送PPAP审批状态，更新APQP项目状态 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（基于PPAP编号+版本组合的唯一性） |
| **批量大小** | 单次推送，不支持批量 |
| **推送时机** | PPAP审批状态变更时实时推送 |


### 5.6.2. 请求参数说明
#### 5.6.2.1. 请求体（Body）
**JSON对象格式**，代表一个PPAP审批结果：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 长度限制 | 备注 |
| --- | --- | --- | --- | --- | --- |
| ppapNumber | PPAP编号 | String | 是 | 1-50 | PPAP唯一编号 |
| projectCode | 项目编码 | String | 是 | 1-50 | 关联的APQP项目编码 |
| productCode | 产品编码 | String | 是 | 1-50 | 产品编码 |
| productVersion | 产品版本 | String | 是 | 1-20 | 产品版本 |
| ppapLevel | PPAP等级 | String | 是 | 1-20 | `LEVEL_1`：等级1   `LEVEL_2`：等级2   `LEVEL_3`：等级3   `LEVEL_4`：等级4   `LEVEL_5`：等级5 |
| submissionDate | 提交日期 | Date | 是 | - | 格式：`yyyy-MM-dd` |
| approvalStatus | 审批状态 | String | 是 | 1-50 | `SUBMITTED`：已提交   `APPROVED`：已批准   `CONDITIONALLY_APPROVED`：有条件批准   `REJECTED`：已拒绝   `CUSTOMER_APPROVED`：客户已批准 |
| approvalDate | 批准日期 | Date | 否 | - | 格式：`yyyy-MM-dd`，审批通过时必填 |
| approvedBy | 批准人 | String | 否 | 1-100 | 批准人姓名 |
| approvalAuthority | 批准机构 | String | 是 | 1-100 | `INTERNAL`：内部批准   `CUSTOMER`：客户批准   `THIRD_PARTY`：第三方批准 |
| customerCode | 客户编码 | String | 否 | 1-50 | 客户编码，客户批准时必填 |
| customerName | 客户名称 | String | 否 | 1-200 | 客户名称，客户批准时必填 |
| validityPeriod | 有效期 | Integer | 否 | - | 批准有效期（月），默认12个月 |
| nextReviewDate | 下次评审日期 | Date | 否 | - | 格式：`yyyy-MM-dd` |
| approvalComments | 批准意见 | String | 否 | 1-2000 | 批准机构的具体意见 |
| conditions | 批准条件 | Array | 否 | - | 有条件批准时的附加条件 |
| documents | 提交文档 | Array | 是 | - | PPAP提交的18项文档清单及状态 |
| testResults | 测试结果 | Array | 否 | - | 关键测试项目的结果 |
| issues | 存在问题 | Array | 否 | - | 审批中发现的问题 |
| correctiveActions | 纠正措施 | Array | 否 | - | 需要采取的纠正措施 |
| qmsApprovalTime | QMS审批时间 | DateTime | 是 | - | 格式：`yyyy-MM-dd HH:mm:ss` |
| remark | 备注 | String | 否 | 1-1000 | 其他补充信息 |


**conditions数组元素结构：**

```json
{
  "conditionCode": "COND-001",
  "conditionDescription": "首批生产需增加100%全检",
  "dueDate": "2024-02-28",
  "responsibility": "质量部"
}
```

**documents数组元素结构：**

```json
{
  "documentCode": "DOC-1",
  "documentName": "设计记录",
  "documentStatus": "APPROVED",
  "documentVersion": "V2.0",
  "approvalDate": "2024-01-20"
}
```

**testResults数组元素结构：**

```json
{
  "testItem": "尺寸检验",
  "specification": "150±0.2mm",
  "actualValue": "150.1mm",
  "result": "PASS",
  "sampleSize": 30,
  "testDate": "2024-01-15"
}
```

### 5.6.3. 响应参数说明
#### 5.6.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含本接口特有字段：

```json
{
  "code": 200,
  "message": "PPAP审批结果推送成功",
  "timestamp": "2024-01-23T11:45:00Z",
  "requestId": "req_20240123_013",
  "data": {
    "ppapNumber": "PPAP-2024-001",
    "projectCode": "APQP-2024-001",
    "approvalStatus": "APPROVED",
    "plmSyncStatus": "SYNCED",
    "apqpPhaseUpdate": {
      "currentPhase": "PHASE_4",
      "nextPhase": "PHASE_5",
      "phaseStatus": "COMPLETED",
      "milestoneAchieved": "PPAP批准"
    },
    "documentSyncResult": {
      "totalDocuments": 18,
      "syncedDocuments": 18,
      "failedDocuments": 0
    },
    "nextSteps": [
      "更新APQP阶段状态为PHASE_5",
      "启动量产准备",
      "更新产品状态为量产"
    ],
    "relatedChangeOrders": [
      {
        "ecnNumber": "ECN-2024-001",
        "ecnTitle": "材料变更",
        "status": "CLOSED"
      }
    ]
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.ppapNumber | PPAP编号 | String | 与请求中的ppapNumber对应 |
| data.projectCode | 项目编码 | String | 与请求中的projectCode对应 |
| data.approvalStatus | 审批状态 | String | PLM同步后的状态 |
| data.plmSyncStatus | PLM同步状态 | String | `SYNCED`：已同步   `PARTIAL_SYNC`：部分同步   `FAILED`：同步失败 |
| data.apqpPhaseUpdate | APQP阶段更新 | Object | PLM对APQP阶段的更新计划 |
| apqpPhaseUpdate.currentPhase | 当前阶段 | String | 当前APQP阶段编码 |
| apqpPhaseUpdate.nextPhase | 下一阶段 | String | 下一阶段编码 |
| apqpPhaseUpdate.phaseStatus | 阶段状态 | String | 阶段状态 |
| apqpPhaseUpdate.milestoneAchieved | 达成里程碑 | String | 达成的里程碑名称 |
| data.documentSyncResult | 文档同步结果 | Object | PPAP文档同步情况 |
| documentSyncResult.totalDocuments | 总文档数 | Integer |  |
| documentSyncResult.syncedDocuments | 已同步文档数 | Integer |  |
| documentSyncResult.failedDocuments | 同步失败文档数 | Integer |  |
| data.relatedChangeOrders | 相关变更单 | Array | 与本次PPAP相关的工程变更单 |


### 5.6.4. 请求/响应示例
#### 5.6.4.1. 请求示例
```json
{
  "ppapNumber": "PPAP-2024-001",
  "projectCode": "APQP-2024-001",
  "productCode": "PROD-2024-001",
  "productVersion": "V2.0",
  "ppapLevel": "LEVEL_3",
  "submissionDate": "2024-01-10",
  "approvalStatus": "APPROVED",
  "approvalDate": "2024-01-22",
  "approvedBy": "张客户经理",
  "approvalAuthority": "CUSTOMER",
  "customerCode": "CUST-001",
  "customerName": "华为技术有限公司",
  "validityPeriod": 12,
  "nextReviewDate": "2025-01-22",
  "approvalComments": "所有提交资料完整，测试结果满足要求，准予批准量产",
  "conditions": [
    {
      "conditionCode": "COND-001",
      "conditionDescription": "首批500件需增加尺寸全检",
      "dueDate": "2024-02-28",
      "responsibility": "质量部"
    }
  ],
  "documents": [
    {
      "documentCode": "DOC-1",
      "documentName": "设计记录",
      "documentStatus": "APPROVED",
      "documentVersion": "V2.0",
      "approvalDate": "2024-01-20"
    },
    {
      "documentCode": "DOC-2",
      "documentName": "工程变更文件",
      "documentStatus": "APPROVED",
      "documentVersion": "V1.0",
      "approvalDate": "2024-01-18"
    }
  ],
  "testResults": [
    {
      "testItem": "尺寸检验",
      "specification": "150±0.2mm",
      "actualValue": "150.1mm",
      "result": "PASS",
      "sampleSize": 30,
      "testDate": "2024-01-15"
    },
    {
      "testItem": "功能测试",
      "specification": "响应时间<100ms",
      "actualValue": "85ms",
      "result": "PASS",
      "sampleSize": 30,
      "testDate": "2024-01-16"
    }
  ],
  "issues": [],
  "correctiveActions": [],
  "qmsApprovalTime": "2024-01-23 11:00:00",
  "remark": "客户对产品性能表示满意"
}
```

#### 5.6.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "PPAP审批结果推送成功",
  "timestamp": "2024-01-23T11:45:15Z",
  "requestId": "req_20240123_013",
  "data": {
    "ppapNumber": "PPAP-2024-001",
    "projectCode": "APQP-2024-001",
    "approvalStatus": "APPROVED",
    "plmSyncStatus": "SYNCED",
    "apqpPhaseUpdate": {
      "currentPhase": "PHASE_4",
      "nextPhase": "PHASE_5",
      "phaseStatus": "COMPLETED",
      "milestoneAchieved": "PPAP批准，客户确认"
    },
    "documentSyncResult": {
      "totalDocuments": 2,
      "syncedDocuments": 2,
      "failedDocuments": 0
    },
    "nextSteps": [
      "更新APQP阶段状态为PHASE_5：反馈评定和纠正措施",
      "将产品状态从试产变更为量产",
      "通知相关部门启动量产准备"
    ],
    "relatedChangeOrders": [
      {
        "ecnNumber": "ECN-2024-001",
        "ecnTitle": "控制器主板材料变更",
        "status": "CLOSED",
        "closureComment": "PPAP批准，变更验证完成"
      }
    ]
  }
}
```

### 5.6.5. 业务规则与约束
#### 5.6.5.1. 数据校验规则
1. **项目存在性**：`projectCode` 必须在PLM中存在
2. **产品存在性**：`productCode` 必须在PLM中存在
3. **状态流转**：`approvalStatus` 变更必须符合业务流程
4. **客户验证**：`approvalAuthority` = `CUSTOMER` 时，`customerCode` 必填
5. **文档完整性**：`documents` 必须包含PPAP等级要求的所有必要文档

#### 5.6.5.2. 状态映射规则
PPAP审批状态与PLM项目状态的映射：

+ `APPROVED` → APQP阶段4完成，进入阶段5
+ `CONDITIONALLY_APPROVED` → APQP阶段4有条件完成，需要满足附加条件
+ `REJECTED` → APQP阶段4未完成，需要重新提交
+ `CUSTOMER_APPROVED` → 客户最终批准，项目进入量产阶段

#### 5.6.5.3. 业务影响
1. **项目状态更新**：PPAP批准会导致APQP项目阶段更新
2. **产品状态变更**：PPAP批准后，产品状态从试产变更为量产
3. **变更单关闭**：相关的工程变更单可能因此关闭
4. **文档归档**：PPAP文档归档到PLM知识库

### 5.6.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 404 | PROJECT_NOT_FOUND | 项目不存在 | 检查projectCode是否正确 |
| 404 | PRODUCT_NOT_FOUND | 产品不存在 | 检查productCode是否正确 |
| 404 | CUSTOMER_NOT_FOUND | 客户不存在 | 检查customerCode是否正确 |
| 422 | INVALID_APPROVAL_STATUS | 无效的审批状态 | approvalStatus必须是有效值 |
| 422 | MISSING_REQUIRED_DOCUMENTS | 缺失必要文档 | 检查documents是否包含PPAP等级要求的必要文档 |
| 422 | INCONSISTENT_APPROVAL | 审批不一致 | 审批信息与PLM记录不一致 |


### 5.6.7. 调用频率限制
| 环境 | 最大请求频率 | 重试策略 | 超时设置 |
| --- | --- | --- | --- |
| 开发环境 | 5次/分钟 | 3次，间隔1分钟 | 30秒 |
| 测试环境 | 10次/分钟 | 3次，间隔30秒 | 30秒 |
| 生产环境 | 20次/分钟 | 3次，间隔10秒 | 30秒 |


### 5.6.8. 注意事项
1. **审批权限**：确保推送的审批结果来自有权限的审批机构
2. **文档版本**：PPAP文档版本必须与PLM中的设计文档版本一致
3. **条件跟踪**：有条件批准时，需要跟踪条件的完成情况
4. **时间协调**：PPAP批准时间应与项目时间计划协调
5. **变更关联**：明确PPAP与相关工程变更单的关联关系
6. **客户沟通**：客户批准结果需要正式确认，避免误解
7. **状态同步**：PPAP状态变更应及时同步，确保PLM和QMS状态一致

---

## 5.7. 设计改进建议提交接口
### 5.7.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | QMS系统向PLM提交具体的设计改进建议单，用于驱动设计优化和变更 |
| **接口地址** | `POST /api/qm/qms/improvement-suggestions` |
| **调用方向** | QMS → PLM |
| **数据流向** | QMS向PLM提交设计改进建议，触发PLM的设计变更流程 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（基于建议单号+版本组合的唯一性） |
| **批量大小** | 单次推送，不支持批量 |
| **推送时机** | 设计改进建议完成评审后实时推送 |


### 5.7.2. 请求参数说明
#### 5.7.2.1. 请求体（Body）
**JSON对象格式**，代表一个设计改进建议单：

| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 长度限制 | 备注 |
| --- | --- | --- | --- | --- | --- |
| suggestionId | 建议单号 | String | 是 | 1-50 | QMS生成的改进建议唯一标识 |
| suggestionTitle | 建议标题 | String | 是 | 1-200 | 改进建议的标题 |
| suggestionType | 建议类型 | String | 是 | 1-50 | `DESIGN_OPTIMIZATION`：设计优化   `COST_REDUCTION`：降本建议   `QUALITY_IMPROVEMENT`：质量改进   `RELIABILITY_ENHANCEMENT`：可靠性提升   `MANUFACTURABILITY`：可制造性改进 |
| priority | 优先级 | String | 是 | 1-20 | `URGENT`：紧急   `HIGH`：高   `MEDIUM`：中   `LOW`：低 |
| productCode | 产品编码 | String | 是 | 1-50 | 涉及的产品编码 |
| productVersion | 产品版本 | String | 是 | 1-20 | 产品版本 |
| componentCode | 组件编码 | String | 否 | 1-50 | 涉及的具体组件编码 |
| componentVersion | 组件版本 | String | 否 | 1-20 | 组件版本 |
| currentSituation | 现状描述 | String | 是 | 1-2000 | 当前设计/工艺/质量的现状描述 |
| problemAnalysis | 问题分析 | String | 是 | 1-2000 | 存在问题的详细分析 |
| proposedSolution | 建议方案 | String | 是 | 1-3000 | 具体的改进方案描述 |
| expectedBenefits | 预期收益 | String | 是 | 1-1000 | 改进后预期获得的收益 |
| costBenefitAnalysis | 成本效益分析 | Object | 否 | - | 成本效益分析数据 |
| implementationComplexity | 实施复杂度 | String | 是 | 1-50 | `LOW`：低   `MEDIUM`：中   `HIGH`：高   `VERY_HIGH`：很高 |
| estimatedImplementationTime | 预计实施时间 | Integer | 是 | - | 预计需要的实施时间（天） |
| resourceRequirements | 资源需求 | Array | 否 | - | 实施所需的资源清单 |
| riskAssessment | 风险评估 | Object | 否 | - | 实施风险评估 |
| supportingData | 支持数据 | Array | 是 | - | 支持改进建议的数据和证据 |
| relatedIssues | 关联问题 | Array | 否 | - | 关联的质量问题编号 |
| suggestedBy | 建议人 | String | 是 | 1-100 | 建议人姓名 |
| suggestedDept | 建议部门 | String | 是 | 1-100 | 建议部门 |
| suggestedDate | 建议日期 | Date | 是 | - | 格式：`yyyy-MM-dd` |
| reviewStatus | 评审状态 | String | 是 | 1-50 | `DRAFT`：草案   `SUBMITTED`：已提交   `UNDER_REVIEW`：评审中   `APPROVED`：已批准   `REJECTED`：已拒绝 |
| reviewComments | 评审意见 | String | 否 | 1-2000 | QMS内部评审意见 |
| nextSteps | 下一步计划 | Array | 否 | - | 建议的下一步行动计划 |
| remark | 备注 | String | 否 | 1-1000 | 其他补充信息 |


**costBenefitAnalysis对象结构：**

```json
{
  "implementationCost": 50000.00,
  "annualSaving": 200000.00,
  "paybackPeriod": 3,
  "roi": 300,
  "breakdown": {
    "materialSaving": 150000.00,
    "laborSaving": 30000.00,
    "qualityCostSaving": 20000.00
  }
}
```

**resourceRequirements数组元素结构：**

```json
{
  "resourceType": "DESIGN_ENGINEER",
  "resourceName": "设计工程师",
  "quantity": 2,
  "duration": 15
}
```

**supportingData数组元素结构：**

```json
{
  "dataType": "TEST_REPORT",
  "dataName": "可靠性测试报告",
  "dataUrl": "https://qms.example.com/reports/reliability-test-001.pdf",
  "summary": "测试显示当前设计在高温环境下故障率较高"
}
```

### 5.7.3. 响应参数说明
#### 5.7.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含本接口特有字段：

```json
{
  "code": 200,
  "message": "设计改进建议提交成功",
  "timestamp": "2024-01-23T11:50:00Z",
  "requestId": "req_20240123_014",
  "data": {
    "suggestionId": "SUG-2024-001",
    "suggestionTitle": "主板焊盘设计优化建议",
    "plmImprovementId": "PLM-IMP-100235",
    "plmEcnNumber": "ECN-2024-002",
    "processingStatus": "ACCEPTED",
    "estimatedReviewTime": "10个工作日",
    "reviewWorkflow": "设计评审→可行性分析→方案设计→ECN创建",
    "assignedTo": {
      "department": "研发部",
      "person": "张设计工程师",
      "email": "zhang.design@company.com"
    },
    "nextSteps": [
      "PLM创建工程变更需求",
      "进行设计可行性分析",
      "组织跨部门评审",
      "制定详细实施方案"
    ],
    "suggestionValue": {
      "estimatedCostReduction": 150000.00,
      "estimatedQualityImprovement": "虚焊率降低80%",
      "estimatedImplementationTimeline": "30天"
    }
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.suggestionId | 建议单号 | String | 与请求中的suggestionId对应 |
| data.suggestionTitle | 建议标题 | String | 与请求中的suggestionTitle对应 |
| data.plmImprovementId | PLM改进单号 | String | PLM系统生成的改进单号 |
| data.plmEcnNumber | PLM变更单号 | String | PLM为此建议创建的ECN编号（如有） |
| data.processingStatus | 处理状态 | String | `ACCEPTED`：已接收   `PROCESSING`：处理中   `APPROVED`：已批准   `REJECTED`：已拒绝 |
| data.estimatedReviewTime | 预计评审时间 | String | PLM预计完成评审的时间 |
| data.reviewWorkflow | 评审流程 | String | PLM内部处理流程 |
| data.assignedTo | 分配信息 | Object | PLM分配的处理人员信息 |
| assignedTo.department | 责任部门 | String | 处理部门 |
| assignedTo.person | 责任人 | String | 处理人姓名 |
| assignedTo.email | 联系人邮箱 | String | 处理人邮箱 |
| data.suggestionValue | 建议价值评估 | Object | PLM对建议价值的评估 |
| suggestionValue.estimatedCostReduction | 预计成本节约 | Decimal | 单位：元 |
| suggestionValue.estimatedQualityImprovement | 预计质量改进 | String | 质量改进的量化描述 |
| suggestionValue.estimatedImplementationTimeline | 预计实施时间线 | String | 实施所需时间 |


### 5.7.4. 请求/响应示例
#### 5.7.4.1. 请求示例
```json
{
  "suggestionId": "SUG-2024-001",
  "suggestionTitle": "控制器主板焊盘设计优化建议",
  "suggestionType": "QUALITY_IMPROVEMENT",
  "priority": "HIGH",
  "productCode": "PROD-2024-001",
  "productVersion": "V2.0",
  "componentCode": "MAT-2024-100",
  "componentVersion": "V2.1",
  "currentSituation": "当前主板焊盘直径为0.8mm，在生产过程中出现虚焊问题，特别是在高温高湿环境下，虚焊率高达5%",
  "problemAnalysis": "焊盘尺寸偏小导致焊接面积不足，焊锡无法充分润湿焊盘，在温度变化时容易产生应力裂纹。现有设计未考虑热膨胀系数差异",
  "proposedSolution": "1. 将焊盘直径从0.8mm增加到1.0mm\n2. 优化焊盘形状，增加焊盘与引线的接触面积\n3. 调整焊盘布局，增加焊盘间距减少热应力\n4. 更新PCB设计规范，明确焊盘最小尺寸要求",
  "expectedBenefits": "1. 虚焊率从5%降低到0.5%以下\n2. 产品可靠性提升，平均无故障时间增加30%\n3. 减少返工和报废，每年预计节约成本20万元\n4. 提升客户满意度，减少客户投诉",
  "costBenefitAnalysis": {
    "implementationCost": 50000.00,
    "annualSaving": 200000.00,
    "paybackPeriod": 3,
    "roi": 300,
    "breakdown": {
      "materialSaving": 50000.00,
      "laborSaving": 80000.00,
      "qualityCostSaving": 70000.00
    }
  },
  "implementationComplexity": "MEDIUM",
  "estimatedImplementationTime": 30,
  "resourceRequirements": [
    {
      "resourceType": "PCB_DESIGNER",
      "resourceName": "PCB设计工程师",
      "quantity": 1,
      "duration": 10
    },
    {
      "resourceType": "TEST_ENGINEER",
      "resourceName": "测试工程师",
      "quantity": 1,
      "duration": 5
    }
  ],
  "riskAssessment": {
    "technicalRisk": "LOW",
    "scheduleRisk": "LOW",
    "costRisk": "LOW",
    "mitigationPlan": "分阶段实施，先做小批量验证"
  },
  "supportingData": [
    {
      "dataType": "QUALITY_REPORT",
      "dataName": "虚焊问题分析报告",
      "dataUrl": "https://qms.example.com/reports/solder-void-analysis.pdf",
      "summary": "2023年12月至2024年1月，共发现虚焊问题25例，主要集中在小焊盘位置"
    },
    {
      "dataType": "TEST_DATA",
      "dataName": "热循环测试数据",
      "dataUrl": "https://qms.example.com/data/thermal-cycle-test.xlsx",
      "summary": "热循环测试显示，小焊盘在温度变化时更容易产生裂纹"
    },
    {
      "dataType": "IMAGE",
      "dataName": "显微镜照片",
      "dataUrl": "https://qms.example.com/images/solder-joint-microscope.jpg",
      "thumbnailUrl": "https://qms.example.com/images/solder-joint-microscope-thumb.jpg"
    }
  ],
  "relatedIssues": ["FB-2024-001", "QMS-ISSUE-100235"],
  "suggestedBy": "王质量工程师",
  "suggestedDept": "质量部",
  "suggestedDate": "2024-01-23",
  "reviewStatus": "APPROVED",
  "reviewComments": "建议合理，数据充分，具有较高的实施价值",
  "nextSteps": ["提交PLM评审", "制定详细实施方案", "安排小批量试产验证"],
  "remark": "此建议已获得质量部、生产部、工艺部的联合评审通过"
}
```

#### 5.7.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "设计改进建议提交成功",
  "timestamp": "2024-01-23T11:50:15Z",
  "requestId": "req_20240123_014",
  "data": {
    "suggestionId": "SUG-2024-001",
    "suggestionTitle": "控制器主板焊盘设计优化建议",
    "plmImprovementId": "PLM-IMP-100235",
    "plmEcnNumber": "ECN-2024-002",
    "processingStatus": "ACCEPTED",
    "estimatedReviewTime": "10个工作日",
    "reviewWorkflow": "设计评审→DFMEA更新→详细设计→ECN创建→试产验证",
    "assignedTo": {
      "department": "研发部PCB设计组",
      "person": "张设计工程师",
      "email": "zhang.design@company.com",
      "phone": "13800138000"
    },
    "nextSteps": [
      "PLM创建工程变更需求ECN-2024-002",
      "进行设计可行性分析和DFMEA更新",
      "组织跨部门设计评审会议",
      "制定详细的PCB修改方案",
      "安排小批量试产验证"
    ],
    "suggestionValue": {
      "estimatedCostReduction": 180000.00,
      "estimatedQualityImprovement": "虚焊率降低90%，产品可靠性提升35%",
      "estimatedImplementationTimeline": "45天（含试产验证）",
      "priorityLevel": "A级（高价值）"
    }
  }
}
```

### 5.7.5. 业务规则与约束
#### 5.7.5.1. 数据校验规则
1. **产品存在性**：`productCode` 必须在PLM中存在
2. **组件存在性**：如提供 `componentCode`，则必须在PLM中存在
3. **建议唯一性**：`suggestionId` 必须唯一，避免重复提交
4. **评审状态**：`reviewStatus` 为 `APPROVED` 的建议才会被PLM正式处理
5. **数据完整性**：必须提供充分的支撑数据和成本效益分析

#### 5.7.5.2. 处理流程规则
1. **建议评审**：QMS内部完成评审后，将 `reviewStatus` 为 `APPROVED` 的建议推送到PLM
2. **PLM接收**：PLM接收建议，创建改进单，分配处理人员
3. **可行性分析**：PLM进行技术可行性和成本效益分析
4. **方案设计**：如可行，设计具体改进方案
5. **变更创建**：创建工程变更单（ECN）实施改进
6. **结果反馈**：PLM将处理结果反馈给QMS

#### 5.7.5.3. 优先级处理规则
1. **紧急建议**：`priority` = `URGENT` 的建议进入快速通道，3个工作日内响应
2. **高优先级**：`priority` = `HIGH` 的建议，5个工作日内响应
3. **中优先级**：`priority` = `MEDIUM` 的建议，10个工作日内响应
4. **低优先级**：`priority` = `LOW` 的建议，按计划排队处理

### 5.7.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 404 | PRODUCT_NOT_FOUND | 产品不存在 | 检查productCode是否正确 |
| 404 | COMPONENT_NOT_FOUND | 组件不存在 | 检查componentCode是否正确 |
| 409 | SUGGESTION_DUPLICATE | 建议重复 | 检查suggestionId的唯一性 |
| 422 | INSUFFICIENT_SUPPORTING_DATA | 支撑数据不足 | 提供更充分的测试数据、分析报告等证据 |
| 422 | INVALID_REVIEW_STATUS | 无效的评审状态 | reviewStatus必须为APPROVED才能提交PLM |
| 422 | INCOMPLETE_COST_BENEFIT_ANALYSIS | 成本效益分析不完整 | 提供完整的成本效益分析数据 |


### 5.7.7. 调用频率限制
| 环境 | 最大请求频率 | 重试策略 | 超时设置 |
| --- | --- | --- | --- |
| 开发环境 | 10次/分钟 | 3次，间隔1分钟 | 30秒 |
| 测试环境 | 20次/分钟 | 3次，间隔30秒 | 30秒 |
| 生产环境 | 30次/分钟 | 3次，间隔10秒 | 30秒 |


### 5.7.8. 注意事项
1. **建议质量**：确保改进建议有充分的的数据支持和可行性分析
2. **跨部门协同**：复杂建议需要多部门协同，明确责任分工
3. **实施跟踪**：建立建议实施跟踪机制，确保改进落地
4. **价值评估**：定期评估建议实施后的实际效果，优化建议评估模型
5. **知识积累**：成功的改进建议应纳入组织知识库，供后续参考
6. **激励机制**：建立有效的建议奖励机制，鼓励员工提出优质建议
7. **流程优化**：根据建议处理情况，持续优化建议提交流程

---

## 5.8. 数据对账报告查询接口
### 5.8.1. 接口基本信息
| 项目 | 说明 |
| --- | --- |
| **接口功能** | QMS系统查询PLM-QMS数据同步的对账报告，用于数据一致性验证和问题排查 |
| **接口地址** | `GET /api/qm/qms/sync-reconciliations` |
| **调用方向** | QMS → PLM |
| **数据流向** | QMS向PLM查询数据同步对账报告 |
| **认证方式** | 遵循 **1.1. 请求头规范** 的 API Key + Secret 方案 |
| **幂等性** | ✅ 支持（查询操作天然幂等） |
| **分页支持** | ✅ 支持分页，每页最大100条 |
| **查询频率** | 按需查询，建议定时（如每日）执行对账 |


### 5.8.2. 请求参数说明
#### 5.8.2.1. 查询参数（Query Parameters）
| 字段名称 | 字段说明 | 数据类型 | 是否必录 | 示例值 | 备注 |
| --- | --- | --- | --- | --- | --- |
| reconciliationId | 对账批次ID | String | 否 | `RECON-20240123` | 精确匹配 |
| dataType | 数据类型 | String | 否 | `MATERIAL` | `MATERIAL`：物料   `BOM`：BOM结构   `SPECIFICATION`：技术规范   `ROUTE`：工艺路线   `DOCUMENT`：文档   `CHANGE_ORDER`：变更单   `APQP`：APQP项目 |
| syncDateFrom | 同步日期开始 | Date | 否 | `2024-01-01` | 格式：`yyyy-MM-dd` |
| syncDateTo | 同步日期结束 | Date | 否 | `2024-01-23` | 格式：`yyyy-MM-dd` |
| syncStatus | 同步状态 | String | 否 | `SUCCESS` | `SUCCESS`：成功   `PARTIAL_SUCCESS`：部分成功   `FAILED`：失败   `INCONSISTENT`：数据不一致 |
| inconsistencyType | 不一致类型 | String | 否 | `MISSING` | `MISSING`：数据缺失   `VERSION_MISMATCH`：版本不一致   `DATA_MISMATCH`：数据内容不一致   `TIMING_MISMATCH`：时间不同步 |
| productCode | 产品编码 | String | 否 | `PROD-2024-001` | 精确匹配 |
| pageNum | 页码 | Integer | 否 | `1` | 从1开始，默认1 |
| pageSize | 每页条数 | Integer | 否 | `50` | 1-100，默认50 |


### 5.8.3. 响应参数说明
#### 5.8.3.1. 响应体（Body）
通用响应格式遵循 **1.3.2.**，`data`对象中包含分页信息和对账报告：

```json
{
  "code": 200,
  "message": "对账报告查询成功",
  "timestamp": "2024-01-23T11:55:00Z",
  "requestId": "req_20240123_015",
  "data": {
    "total": 85,
    "pageNum": 1,
    "pageSize": 10,
    "pages": 9,
    "overallSummary": {
      "totalReconciliations": 85,
      "successCount": 70,
      "partialSuccessCount": 10,
      "failedCount": 3,
      "inconsistentCount": 2,
      "overallSuccessRate": 94.12,
      "lastReconciliationTime": "2024-01-23T02:00:00Z"
    },
    "dataTypeSummary": {
      "material": {
        "total": 35,
        "success": 32,
        "inconsistent": 2,
        "failed": 1,
        "successRate": 91.43
      },
      "bom": {
        "total": 20,
        "success": 18,
        "inconsistent": 1,
        "failed": 1,
        "successRate": 90.00
      }
    },
    "list": [
      {
        "reconciliationId": "RECON-20240123-001",
        "dataType": "MATERIAL",
        "syncDate": "2024-01-23",
        "syncTime": "2024-01-23T02:00:00Z",
        "syncStatus": "INCONSISTENT",
        "totalRecords": 150,
        "plmRecords": 150,
        "qmsRecords": 148,
        "matchedRecords": 145,
        "inconsistentRecords": 3,
        "missingRecords": 2,
        "inconsistencyDetails": [
          {
            "recordId": "MAT-2024-001",
            "recordType": "MATERIAL",
            "inconsistencyType": "DATA_MISMATCH",
            "plmValue": "V2.1",
            "qmsValue": "V2.0",
            "field": "materialVersion",
            "description": "物料版本不一致"
          }
        ],
        "resolutionStatus": "PENDING",
        "resolutionAction": "需手动同步更新",
        "nextReconciliationTime": "2024-01-24T02:00:00Z",
        "remark": "版本不一致需要人工确认"
      }
    ]
  }
}
```

**响应字段说明（特有字段）：**

| 字段路径 | 字段说明 | 数据类型 | 备注 |
| --- | --- | --- | --- |
| data.total | 总记录数 | Integer | 符合查询条件的总记录数 |
| data.pageNum | 当前页码 | Integer | 当前页码，从1开始 |
| data.pageSize | 每页条数 | Integer | 每页显示条数 |
| data.pages | 总页数 | Integer | 总页数 |
| data.overallSummary | 总体统计 | Object | 对账的总体统计信息 |
| overallSummary.totalReconciliations | 总对账次数 | Integer | 总对账次数 |
| overallSummary.successCount | 成功次数 | Integer | 完全成功的次数 |
| overallSummary.partialSuccessCount | 部分成功次数 | Integer | 部分成功的次数 |
| overallSummary.failedCount | 失败次数 | Integer | 失败的次数 |
| overallSummary.inconsistentCount | 不一致次数 | Integer | 数据不一致的次数 |
| overallSummary.overallSuccessRate | 总体成功率 | Decimal | 百分比，精度：2位小数 |
| overallSummary.lastReconciliationTime | 最后对账时间 | String | ISO 8601格式 |
| data.dataTypeSummary | 数据类型统计 | Object | 按数据类型的统计信息 |
| dataTypeSummary.material | 物料统计 | Object | 物料数据的对账统计 |
| material.total | 总次数 | Integer | 物料对账总次数 |
| material.success | 成功次数 | Integer | 物料对账成功次数 |
| material.inconsistent | 不一致次数 | Integer | 物料数据不一致次数 |
| material.failed | 失败次数 | Integer | 物料对账失败次数 |
| material.successRate | 成功率 | Decimal | 百分比，精度：2位小数 |
| data.list | 对账记录列表 | Array | 详细的对账记录 |
| list[].reconciliationId | 对账批次ID | String | 对账批次唯一标识 |
| list[].dataType | 数据类型 | String | 对账的数据类型 |
| list[].syncDate | 同步日期 | String | 格式：`yyyy-MM-dd` |
| list[].syncTime | 同步时间 | String | ISO 8601格式 |
| list[].syncStatus | 同步状态 | String | 同步结果状态 |
| list[].totalRecords | 总记录数 | Integer | 本次对账涉及的总记录数 |
| list[].plmRecords | PLM记录数 | Integer | PLM中的记录数 |
| list[].qmsRecords | QMS记录数 | Integer | QMS中的记录数 |
| list[].matchedRecords | 匹配记录数 | Integer | 双方匹配的记录数 |
| list[].inconsistentRecords | 不一致记录数 | Integer | 数据不一致的记录数 |
| list[].missingRecords | 缺失记录数 | Integer | 一方缺失的记录数 |
| list[].inconsistencyDetails | 不一致详情 | Array | 不一致的详细情况 |
| inconsistencyDetails[].recordId | 记录ID | String | 不一致的记录标识 |
| inconsistencyDetails[].recordType | 记录类型 | String | 记录类型 |
| inconsistencyDetails[].inconsistencyType | 不一致类型 | String | 不一致的具体类型 |
| inconsistencyDetails[].plmValue | PLM值 | String | PLM中的值 |
| inconsistencyDetails[].qmsValue | QMS值 | String | QMS中的值 |
| inconsistencyDetails[].field | 字段名 | String | 不一致的字段名称 |
| inconsistencyDetails[].description | 描述 | String | 不一致的描述 |
| list[].resolutionStatus | 解决状态 | String | `PENDING`：待解决   `IN_PROGRESS`：解决中   `RESOLVED`：已解决   `IGNORED`：已忽略 |
| list[].resolutionAction | 解决措施 | String | 解决不一致的措施 |
| list[].nextReconciliationTime | 下次对账时间 | String | ISO 8601格式 |


### 5.8.4. 请求/响应示例
#### 5.8.4.1. 请求示例
```plain
GET /api/qm/qms/sync-reconciliations?dataType=MATERIAL&syncDateFrom=2024-01-20&syncDateTo=2024-01-23&pageNum=1&pageSize=5
```

#### 5.8.4.2. 成功响应示例（HTTP 200）
```json
{
  "code": 200,
  "message": "对账报告查询成功",
  "timestamp": "2024-01-23T11:55:15Z",
  "requestId": "req_20240123_015",
  "data": {
    "total": 12,
    "pageNum": 1,
    "pageSize": 5,
    "pages": 3,
    "overallSummary": {
      "totalReconciliations": 85,
      "successCount": 70,
      "partialSuccessCount": 10,
      "failedCount": 3,
      "inconsistentCount": 2,
      "overallSuccessRate": 94.12,
      "lastReconciliationTime": "2024-01-23T02:00:00Z"
    },
    "dataTypeSummary": {
      "material": {
        "total": 12,
        "success": 10,
        "inconsistent": 1,
        "failed": 1,
        "successRate": 83.33
      }
    },
    "list": [
      {
        "reconciliationId": "RECON-20240123-001",
        "dataType": "MATERIAL",
        "syncDate": "2024-01-23",
        "syncTime": "2024-01-23T02:00:00Z",
        "syncStatus": "INCONSISTENT",
        "totalRecords": 150,
        "plmRecords": 150,
        "qmsRecords": 148,
        "matchedRecords": 145,
        "inconsistentRecords": 3,
        "missingRecords": 2,
        "inconsistencyDetails": [
          {
            "recordId": "MAT-2024-001",
            "recordType": "MATERIAL",
            "inconsistencyType": "VERSION_MISMATCH",
            "plmValue": "V2.1",
            "qmsValue": "V2.0",
            "field": "materialVersion",
            "description": "物料版本不一致，PLM已更新到V2.1，QMS仍为V2.0"
          },
          {
            "recordId": "MAT-2024-050",
            "recordType": "MATERIAL",
            "inconsistencyType": "DATA_MISMATCH",
            "plmValue": "华为技术有限公司",
            "qmsValue": "华为公司",
            "field": "customerName",
            "description": "客户名称不一致"
          }
        ],
        "resolutionStatus": "PENDING",
        "resolutionAction": "需要QMS手动同步更新物料数据",
        "nextReconciliationTime": "2024-01-24T02:00:00Z",
        "remark": "版本变更未及时同步"
      }
    ]
  }
}
```

### 5.8.5. 业务规则与约束
#### 5.8.5.1. 对账规则
1. **对账频率**：建议每日定时执行全量对账，重要数据可提高频率
2. **对账范围**：支持按数据类型、时间范围、产品等条件筛选对账记录
3. **数据源**：以PLM作为数据源基准，QMS数据与PLM数据进行比对
4. **一致性规则**：定义明确的一致性规则（如版本必须完全一致）

#### 5.8.5.2. 不一致处理
1. **自动修复**：对于简单的不一致（如时间戳差异），可自动修复
2. **人工干预**：对于复杂的不一致（如数据内容差异），需要人工确认
3. **优先级处理**：根据不一致的影响程度，确定处理优先级
4. **跟踪闭环**：不一致问题需要跟踪到解决为止，形成闭环

#### 5.8.5.3. 报告使用
1. **监控告警**：对账报告用于监控数据同步健康状况，异常时告警
2. **问题排查**：帮助定位数据同步问题的根本原因
3. **性能优化**：分析对账结果，优化同步策略和性能
4. **质量评估**：评估数据同步质量，持续改进

### 5.8.6. 错误码说明（本接口特有）
| HTTP状态码 | 错误码 | 说明 | 处理建议 |
| --- | --- | --- | --- |
| 400 | INVALID_DATE_RANGE | 无效的日期范围 | 结束日期不能早于开始日期 |
| 400 | INVALID_PAGE_SIZE | 无效的每页条数 | pageSize必须在1-100之间 |
| 422 | INVALID_DATA_TYPE | 无效的数据类型 | dataType必须是有效值 |
| 429 | QUERY_FREQUENCY_EXCEEDED | 查询频率超限 | 降低查询频率 |


### 5.8.7. 调用频率限制
| 环境 | 最大请求频率 | 最大每页条数 | 响应超时 |
| --- | --- | --- | --- |
| 开发环境 | 20次/分钟 | 50条/页 | 10秒 |
| 测试环境 | 40次/分钟 | 80条/页 | 10秒 |
| 生产环境 | 60次/分钟 | 100条/页 | 15秒 |


### 5.8.8. 注意事项
1. **数据量控制**：对账报告可能包含大量数据，注意使用分页和筛选条件
2. **性能影响**：生成对账报告可能对系统性能有影响，建议在业务低峰期执行
3. **存储策略**：历史对账报告需要合理存储，支持趋势分析和问题追溯
4. **权限控制**：对账报告可能包含敏感数据，需要严格的权限控制
5. **自动化处理**：对于常见的不一致问题，建议实现自动化修复
6. **告警机制**：当不一致率超过阈值时，应自动触发告警
7. **持续改进**：定期分析对账报告，优化数据同步策略和流程

---



