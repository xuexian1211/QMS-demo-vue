const g=[{id:"log-add-update-log-management",version:"v1.0.0",title:"Change: 新增系统更新日志管理",content:`<div class="update-log-content">
<h2>📊 实现内容</h2>
<div class="section">
<h3>前端开发</h3>
<ul>
<li>4.1 创建 \`src/views/system/UpdateLog.vue\` 组件</li>
<li>5.1 创建 \`src/views/system/UpdateLogEditor.vue\` 组件</li>
<li>5.2 集成富文本编辑器组件(如 TinyMCE 或 Quill)</li>
<li>6.1 创建 \`src/views/system/UpdateLogDetail.vue\` 详情页面组件</li>
<li>6.7 实现按角色筛选 Tab(全部/前端/后端/测试)</li>
<li>7.5 实现任务角色分类逻辑(根据关键词匹配前端/后端/测试)</li>
<li>11.2 实现前端路由守卫权限校验</li>
<li>12.1 单元测试:更新日志组件测试</li>
</ul>
<h3>后端开发</h3>
<ul>
<li>1.3 定义更新日志 API 请求/响应类型</li>
<li>1.5 定义设计文档 API 请求/响应类型</li>
<li>2.1 设计数据库表结构 \`update_logs\` 和 \`design_documents\`</li>
<li>7.7 调用更新日志创建 API 保存生成的日志</li>
<li>7.8 调用设计文档创建 API 批量保存解析的任务</li>
<li>9.1 创建 \`src/api/updateLog.ts\` API 服务文件</li>
<li>9.2 封装所有更新日志相关的 API 调用</li>
<li>11.4 后端 API 接口权限校验</li>
<li>12.2 集成测试:API 接口测试</li>
</ul>
<h3>测试</h3>
<ul>
<li>7.10 测试自动生成流程(端到端测试)</li>
<li>12.3 端到端测试:完整流程测试</li>
<li>12.4 手动测试所有功能点</li>
<li>12.5 性能测试(列表加载、富文本编辑器性能)</li>
</ul>
<h3>其他</h3>
<ul>
<li>1.1 定义更新日志 TypeScript 接口类型 (\`src/types/index.ts\`)</li>
<li>1.2 制定更新日志数据结构(版本号、标题、内容、影响范围、状态、发布时间等)</li>
<li>1.4 定义功能设计文档 TypeScript 接口类型(DesignDocument, DesignTask)</li>
<li>2.2 实现更新日志列表查询接口 \`GET /api/update-logs\`</li>
<li>2.3 实现更新日志详情查询接口 \`GET /api/update-logs/:id\`</li>
<li>2.4 实现更新日志创建接口 \`POST /api/update-logs\`</li>
<li>2.5 实现更新日志更新接口 \`PUT /api/update-logs/:id\`</li>
<li>2.6 实现更新日志删除接口 \`DELETE /api/update-logs/:id\`</li>
<li>2.7 实现更新日志发布接口 \`POST /api/update-logs/:id/publish\`</li>
<li>2.8 实现设计文档列表查询接口 \`GET /api/design-documents?updateLogId=xxx\`</li>
<li>2.9 实现设计文档创建接口 \`POST /api/design-documents\`(支持批量)</li>
<li>2.10 实现设计文档更新接口 \`PUT /api/design-documents/:id\`</li>
<li>2.11 实现设计任务状态更新接口 \`PATCH /api/design-documents/:id/tasks/:taskId\`</li>
<li>3.1 在 \`router/index.ts\` 中新增更新日志相关路由</li>
<li>3.2 在 \`MainLayout.vue\` 顶部导航栏添加更新日志按钮(📝图标)</li>
<li>3.3 实现更新日志按钮的徽章数字提示(显示未读更新数量)</li>
<li>4.2 实现列表页面布局(工具栏 + 搜索表单 + 数据表格)</li>
<li>4.3 实现数据表格配置(列定义、分页、排序)</li>
<li>4.4 实现搜索和筛选功能(按版本号、日期范围、状态筛选)</li>
<li>4.5 实现操作按钮(新增、编辑、删除、查看详情、发布)</li>
<li>4.6 实现数据加载和状态管理</li>
<li>5.3 实现表单字段(版本号、标题、更新类型、影响范围等)</li>
<li>5.4 实现表单验证规则</li>
<li>5.5 实现保存为草稿和发布功能</li>
<li>5.6 实现预览功能</li>
<li>6.2 实现版本信息展示</li>
<li>6.3 实现更新内容渲染(支持 Markdown 或 HTML)</li>
<li>6.4 实现影响范围和相关链接展示</li>
<li>6.5 实现返回列表和编辑按钮</li>
<li>6.6 实现功能设计文档关联区域</li>
<li>6.8 实现设计任务列表展示(任务编号、标题、状态、工时、依赖)</li>
<li>6.9 实现任务状态切换功能(标记为完成/进行中)</li>
<li>6.10 实现任务依赖关系可视化(点击跳转到依赖任务)</li>
<li>7.1 研究 \`openspec archive\` 命令的钩子机制或扩展点</li>
<li>7.2 创建提案归档时的自动生成脚本 \`scripts/generate-update-log.js\`</li>
<li>7.3 解析 \`proposal.md\` 生成更新日志内容(标题、内容、影响范围)</li>
<li>7.4 解析 \`tasks.md\` 提取任务结构(识别##阶段、识别任务项)</li>
<li>7.6 实现任务依赖关系解析(解析Dependencies部分)</li>
<li>7.9 关联设计文档到更新日志记录(updateLogId)</li>
<li>8.1 扩展消息通知 Store(\`src/stores/notification.ts\`如不存在则创建)</li>
<li>8.2 实现新更新日志发布时的通知推送</li>
<li>8.3 在消息通知下拉框中显示更新日志通知</li>
<li>8.4 实现点击通知跳转到更新日志详情</li>
<li>8.5 实现未读更新日志计数徽章</li>
<li>9.3 实现错误处理和统一响应格式</li>
<li>9.4 添加请求拦截器和响应拦截器</li>
<li>10.1 应用 JNPF 风格的页面布局</li>
<li>10.2 实现响应式设计(支持移动端查看)</li>
<li>10.3 添加加载状态和骨架屏</li>
<li>10.4 优化动画和过渡效果</li>
<li>10.5 添加空状态提示</li>
<li>11.1 定义更新日志管理权限(查看、创建、编辑、删除、发布)</li>
<li>11.3 实现页面按钮级权限控制</li>
<li>13.1 编写用户使用文档</li>
<li>13.2 编写开发者技术文档</li>
<li>13.3 更新系统菜单配置文档</li>
<li>13.4 准备演示数据和截图</li>
<li>13.5 代码审查和优化</li>
</ul>
</div>

</div>`,contentType:"html",updateType:"feature",affectedModules:[],relatedChangeId:"add-update-log-management",status:"published",publishedAt:"2026-02-04T14:54:18.799Z",publishedBy:"system",createTime:"2026-02-04T14:54:18.801Z",updateTime:"2026-02-04T14:54:18.801Z",creator:"system",updater:"system",orgId:"org-001"}],p=()=>[...g],m=e=>["frontend","backend","test","general"].map((i,n)=>({id:`doc-${e}-${n}`,updateLogId:e,title:`${i==="frontend"?"前端":i==="backend"?"后端":i==="test"?"测试":"通用"}任务文档`,documentType:i,tasks:f(i,5),createdAt:new Date().toISOString(),createdBy:"admin",updatedAt:new Date().toISOString(),orgId:"org-001"})),f=(e,t)=>{const i=["pending","in-progress","completed"];return Array.from({length:t},(n,s)=>({id:`task-${e}-${s+1}`,taskNumber:`${s+1}.${s+1}`,title:`${e==="frontend"?"前端":e==="backend"?"后端":e==="test"?"测试":"通用"}任务 ${s+1}`,description:`这是${e}任务 ${s+1} 的详细描述`,assigneeRole:e,status:i[s%3],estimatedHours:(s+1)*2,dependencies:s>0?[`task-${e}-${s}`]:[],completedAt:i[s%3]==="completed"?new Date().toISOString():void 0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}))};let l=p(),c=[];const d=(e=300)=>new Promise(t=>setTimeout(t,e)),T=async e=>{await d();let t=[...l];e.version&&(t=t.filter(a=>a.version.includes(e.version))),e.updateType&&(t=t.filter(a=>a.updateType===e.updateType)),e.status&&(t=t.filter(a=>a.status===e.status)),e.keyword&&(t=t.filter(a=>a.title.includes(e.keyword)||a.content.includes(e.keyword)));const i=e.page||1,n=e.pageSize||20,s=(i-1)*n,o=s+n;return{code:200,message:"查询成功",success:!0,data:{list:t.slice(s,o),total:t.length,page:i,pageSize:n}}},y=async e=>{await d();const t=l.find(i=>i.id===e);return t?{code:200,message:"查询成功",success:!0,data:t}:{code:404,message:"更新日志不存在",success:!1,data:null}},I=async e=>{await d();const t={id:`log-${Date.now()}`,orgId:"org-001",...e,status:"draft",createTime:new Date().toISOString(),updateTime:new Date().toISOString(),creator:"admin",updater:"admin"};return l.unshift(t),{code:200,message:"创建成功",success:!0,data:t}},h=async(e,t)=>{await d();const i=l.findIndex(n=>n.id===e);return i===-1?{code:404,message:"更新日志不存在",success:!1,data:null}:(l[i]={...l[i],...t,updateTime:new Date().toISOString(),updater:"admin"},{code:200,message:"更新成功",success:!0,data:l[i]})},S=async e=>{await d();const t=l.findIndex(i=>i.id===e);return t===-1?{code:404,message:"更新日志不存在",success:!1,data:void 0}:(l.splice(t,1),{code:200,message:"删除成功",success:!0,data:void 0})},w=async e=>{await d();const t=l.findIndex(i=>i.id===e);return t===-1?{code:404,message:"更新日志不存在",success:!1,data:null}:(l[t]={...l[t],status:"published",publishedAt:new Date().toISOString(),publishedBy:"admin",updateTime:new Date().toISOString()},{code:200,message:"发布成功",success:!0,data:l[t]})},k=async e=>{await d();const t=l.findIndex(i=>i.id===e);return t===-1?{code:404,message:"更新日志不存在",success:!1,data:null}:(l[t]={...l[t],status:"archived",updateTime:new Date().toISOString()},{code:200,message:"归档成功",success:!0,data:l[t]})},D=async e=>{if(await d(),c.length===0||!c.some(i=>i.updateLogId===e.updateLogId)){const i=m(e.updateLogId);c.push(...i)}let t=c.filter(i=>i.updateLogId===e.updateLogId);return e.documentType&&(t=t.filter(i=>i.documentType===e.documentType)),{code:200,message:"查询成功",success:!0,data:t}},L=async(e,t,i)=>{await d();const n=c.find(o=>o.id===e);if(!n)return{code:404,message:"设计文档不存在",success:!1,data:null};const s=n.tasks.find(o=>o.id===t);return s?(s.status=i.status,s.updatedAt=new Date().toISOString(),i.status==="completed"&&(s.completedAt=new Date().toISOString()),{code:200,message:"更新成功",success:!0,data:s}):{code:404,message:"任务不存在",success:!1,data:null}},v=async e=>(await d(),{code:200,message:"查询成功",success:!0,data:c.filter(n=>n.updateLogId===e).map(n=>{const s=n.tasks.length,o=n.tasks.filter(u=>u.status==="completed").length,a=n.tasks.filter(u=>u.status==="in-progress").length,r=n.tasks.filter(u=>u.status==="pending").length;return{documentType:n.documentType,totalTasks:s,completedTasks:o,inProgressTasks:a,pendingTasks:r,completionRate:s>0?Math.round(o/s*100):0}})});export{k as a,y as b,I as c,S as d,L as e,D as f,T as g,v as h,w as p,h as u};
