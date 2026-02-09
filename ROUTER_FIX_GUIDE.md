# 检验方案路由配置说明

## 问题说明
在自动添加路由时，`src/router/index.ts` 文件出现了格式错误。需要手动修复。

## 需要添加的路由配置

请在 `src/router/index.ts` 文件中，找到检验模板路由（`/inspection-model/insp-templates`）之后，添加以下路由配置：

```typescript
// 检验方案管理（新架构）
{
  path: '/inspection-model/insp-schemes',
  name: 'InspectionModelInspSchemes',
  component: () => import('@/layout/MainLayout.vue'),
  meta: { title: '检验方案管理（新）' },
  children: [
    { path: '', component: () => import('@/views/inspection-model/InspSchemeList.vue') }
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
  path: '/inspection-model/insp-schemes/copy/:id',
  name: 'InspectionModelInspSchemeCopy',
  component: () => import('@/layout/MainLayout.vue'),
  meta: { title: '检验方案-复制', hideInMenu: true },
  children: [
    { path: '', component: () => import('@/views/inspection-model/InspSchemeEdit.vue') }
  ]
},
{
  path: '/inspection-model/insp-schemes/:id/strategies',
  name: 'InspectionModelInspSchemeStrategies',
  component: () => import('@/layout/MainLayout.vue'),
  meta: { title: '检验方案-策略绑定', hideInMenu: true },
  children: [
    { path: '', component: () => import('@/views/inspection-model/InspSchemeEdit.vue') }
  ]
},
```

## 访问路径

添加路由后，您可以通过以下路径访问新页面：

- **检验方案列表**: `http://localhost:5173/inspection-model/insp-schemes`
- **新建方案**: `http://localhost:5173/inspection-model/insp-schemes/create`
- **编辑方案**: `http://localhost:5173/inspection-model/insp-schemes/edit/{id}`

## 当前路由文件状态

路由文件 `src/router/index.ts` 在第 1013-1037 行附近有格式错误，需要手动修复。

错误的原因是自动编辑时，替换的目标内容与实际文件内容不完全匹配，导致部分代码被错误地修改。

## 修复步骤

1. 打开 `src/router/index.ts`
2. 找到第 1013 行附近（检验模板路由的最后一个）
3. 确保该路由配置完整且格式正确
4. 在其后添加上面的检验方案路由配置
5. 保存文件并重启开发服务器

## 已创建的文件列表

所有功能文件都已创建完成：

✅ `src/types/index.ts` - 类型定义
✅ `src/api/inspScheme.ts` - API 接口
✅ `src/utils/strategyMatcher.ts` - 策略匹配引擎
✅ `src/views/inspection-model/InspSchemeList.vue` - 列表页
✅ `src/views/inspection-model/InspSchemeEdit.vue` - 编辑页
✅ `src/components/MaterialSpecEditor.vue` - 规格编辑器
✅ `src/__tests__/strategyMatcher.spec.ts` - 单元测试

只需要手动修复路由配置即可。
