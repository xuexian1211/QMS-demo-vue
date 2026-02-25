<template>
  <a-layout class="main-layout">
    <!-- 顶部导航栏 -->
    <a-layout-header class="navbar">
      <div class="navbar-content">
        <!-- 左侧：Logo和横向菜单 -->
        <div class="navbar-left">
          <div class="logo">
            <img src="/logo.png" alt="QMS" class="logo-img" />
            <h2 class="logo-text">舜富质量管理系统<br />sQMS</h2>
          </div>
          <a-menu v-model:selectedKeys="selectedKeys" mode="horizontal" class="horizontal-menu" theme="dark">
            <!-- 1. 首页/工作台 -->
            <a-sub-menu key="dashboard">
              <template #title>🏠 工作台</template>
              <a-menu-item key="/dashboard" @click="navigateTo('/dashboard')">个人工作台</a-menu-item>
              <a-menu-item key="/leadership" @click="navigateTo('/leadership')">质量驾驶舱</a-menu-item>
            </a-sub-menu>

            <!-- 2. 基础数据 -->
            <a-sub-menu key="basic-data">
              <template #title>📋 基础数据</template>
              <a-menu-item key="/basic-data/customer-archive"
                @click="navigateTo('/basic-data/customer-archive')">客户档案管理</a-menu-item>
              <a-menu-item key="/basic-data/supplier-archive"
                @click="navigateTo('/basic-data/supplier-archive')">供应商档案管理</a-menu-item>
              <a-menu-item key="guest-supplier" @click="showDeveloping('客供关系映射')">客供关系映射</a-menu-item>
              <a-menu-item key="/basic-data/material-category"
                @click="navigateTo('/basic-data/material-category')">物料分类管理</a-menu-item>
              <a-menu-item key="/basic-data/material" @click="navigateTo('/basic-data/material')">物料/产品主数据</a-menu-item>
              <a-menu-item key="/basic-data/process-route"
                @click="navigateTo('/basic-data/process-route')">工艺路线管理</a-menu-item>
              <a-menu-item key="/basic-data/production-team"
                @click="navigateTo('/basic-data/production-team')">生产班组信息</a-menu-item>
              <a-menu-item key="/basic-data/storage-location"
                @click="navigateTo('/basic-data/storage-location')">库位划分</a-menu-item>
              <a-menu-item key="/basic-data/unit" @click="navigateTo('/basic-data/unit')">单位体系管理</a-menu-item>
            </a-sub-menu>

            <!-- 3. 质量主数据 -->
            <a-sub-menu key="quality-master-data">
              <template #title>🧪 质量主数据</template>
              <a-menu-item key="/inspection-model/defect-phenomena"
                @click="navigateTo('/inspection-model/defect-phenomena')">缺陷现象库</a-menu-item>
              <a-menu-item key="/inspection-model/defect-causes"
                @click="navigateTo('/inspection-model/defect-causes')">缺陷原因库</a-menu-item>
              <a-menu-item key="/inspection-model/inspection-items"
                @click="navigateTo('/inspection-model/inspection-items')">检验项目管理</a-menu-item>
              <a-menu-item key="/inspection-model/insp-methods"
                @click="navigateTo('/inspection-model/insp-methods')">检验方法管理</a-menu-item>
              <a-menu-item key="/inspection-model/sampling-plans"
                @click="navigateTo('/inspection-model/sampling-plans')">抽样方案配置</a-menu-item>
              <a-menu-item key="/inspection-model/insp-templates"
                @click="navigateTo('/inspection-model/insp-templates')">检验模板设计</a-menu-item>
              <a-menu-item key="/inspection-model/insp-plans"
                @click="navigateTo('/inspection-model/insp-plans')">检验方案设计</a-menu-item>
              <a-menu-item key="insp-plans-model" @click="showDeveloping('检验计划模型')">检验计划模型</a-menu-item>
              <a-menu-item key="/inspection-model/gauge-ledgers"
                @click="navigateTo('/inspection-model/gauge-ledgers')">计量器具台账</a-menu-item>
            </a-sub-menu>

            <!-- 4. 质量先期策划 (APQP / PPAP) -->
            <a-sub-menu key="apqp-ppap">
              <template #title>📝 质量策划</template>
              <a-menu-item key="apqp" @click="showDeveloping('APQP项目管理')">APQP 项目管理看板</a-menu-item>
              <a-menu-item key="/tools/fmea" @click="navigateTo('/tools/fmea')">FMEA 管理</a-menu-item>
              <a-menu-item key="control-plan" @click="showDeveloping('控制计划管理')">控制计划 (Control Plan)</a-menu-item>
              <a-menu-item key="ppap" @click="showDeveloping('PPAP审批管理')">PPAP 提交与审批过程管理</a-menu-item>
            </a-sub-menu>

            <!-- 5. 供应商质量管理 (SQM) -->
            <a-sub-menu key="sqm">
              <template #title>🏭 供方质量</template>
              <a-menu-item key="/supplier" @click="navigateTo('/supplier')">供应商准入与评估</a-menu-item>
              <a-menu-item key="supplier-ppap" @click="showDeveloping('供应商PPAP管理')">供应商 PPAP 管理</a-menu-item>
              <a-menu-item key="/production-quality/quality-inspection/iqc-checklist"
                @click="navigateTo('/production-quality/quality-inspection/iqc-checklist')">IQC 来料检验任务</a-menu-item>
              <a-menu-item key="/production-quality/exception-handling/material-disposal"
                @click="navigateTo('/production-quality/exception-handling/material-disposal')">进料不良异常处理</a-menu-item>
              <a-menu-item key="supplier-kpi" @click="showDeveloping('供应商绩效考核')">供应商考核与审核</a-menu-item>
            </a-sub-menu>

            <!-- 6. 生产过程质量管控 -->
            <a-sub-menu key="process-quality">
              <template #title>⚙️ 过程质量</template>
              <a-menu-item key="/production-quality/quality-inspection/ipqc-checklist"
                @click="navigateTo('/production-quality/quality-inspection/ipqc-checklist')">首件/巡检任务管理(IPQC)</a-menu-item>
              <a-menu-item key="/tools/spc" @click="navigateTo('/tools/spc')">SPC 控制图分析</a-menu-item>
              <a-menu-item key="die-casting" @click="showDeveloping('压铸工艺参数监控')">压铸工艺参数实时监控</a-menu-item>
              <a-menu-item key="casting-inspection" @click="showDeveloping('铸件检验与质量档案')">铸件检验与质量档案</a-menu-item>
              <a-menu-item key="containment" @click="showDeveloping('围堵单管理')">围堵单管理(产线围堵)</a-menu-item>
              <a-menu-item key="/production-quality/exception-handling/qrqc-response"
                @click="navigateTo('/production-quality/exception-handling/qrqc-response')">QRQC 快速反应看板</a-menu-item>
              <a-menu-item key="/production-quality/exception-handling/process-disposal"
                @click="navigateTo('/production-quality/exception-handling/process-disposal')">过程不合格品处置单</a-menu-item>
              <a-menu-item key="/production-quality/quality-inspection/inspection-rules"
                @click="navigateTo('/production-quality/quality-inspection/inspection-rules')">检验规则配置</a-menu-item>
              <a-menu-item key="/production-quality/problem-management/problem-types"
                @click="navigateTo('/production-quality/problem-management/problem-types')">生产问题类型</a-menu-item>
              <a-menu-item key="/production-quality/problem-management/problem-list"
                @click="navigateTo('/production-quality/problem-management/problem-list')">生产问题管理</a-menu-item>
            </a-sub-menu>

            <!-- 7. 终检与出货质量 -->
            <a-sub-menu key="fqc-oqc">
              <template #title>📦 终检出货</template>
              <a-menu-item key="/production-quality/quality-inspection/fqc-checklist"
                @click="navigateTo('/production-quality/quality-inspection/fqc-checklist')">FQC 终检任务台账</a-menu-item>
              <a-menu-item key="/production-quality/quality-inspection/oqc-checklist"
                @click="navigateTo('/production-quality/quality-inspection/oqc-checklist')">OQC 出货检验记录</a-menu-item>
              <a-menu-item key="/production-quality/exception-handling/product-disposal"
                @click="navigateTo('/production-quality/exception-handling/product-disposal')">不合格品报废申请与审理</a-menu-item>
            </a-sub-menu>

            <!-- 8. 客户质量与服务 -->
            <a-sub-menu key="customer-improve">
              <template #title>👥 客诉处理</template>
              <a-menu-item key="/customer" @click="navigateTo('/customer')">客诉/客退登记与处理</a-menu-item>
              <a-menu-item key="8d" @click="showDeveloping('AIAG 8D报告管理')">AIAG 8D 报告管理与追踪</a-menu-item>
              <a-menu-item key="customer-satisfaction" @click="showDeveloping('客户满意度调查')">客户满意度调查与评价</a-menu-item>
            </a-sub-menu>

            <!-- 9. 持续改进与体系审核 -->
            <a-sub-menu key="improvement-audit">
              <template #title>🔄 体系改进</template>
              <a-menu-item key="/production-quality/exception-handling/change-point-application"
                @click="navigateTo('/production-quality/exception-handling/change-point-application')">变化点(4M1E)申请与评估</a-menu-item>
              <a-menu-item key="capa" @click="showDeveloping('CAPA纠正预防措施')">纠正与预防措施 (CAPA)</a-menu-item>
              <a-menu-item key="lpa" @click="showDeveloping('LPA分层审核')">LPA 分层过程审核计划执行</a-menu-item>
              <a-menu-item key="audit" @click="showDeveloping('内外部体系审核')">内部/外部体系审核跟踪</a-menu-item>
              <a-menu-item key="review" @click="showDeveloping('管理评审')">管理评审执行记录</a-menu-item>
            </a-sub-menu>

            <!-- 10. 知识、培训及系统设置 -->
            <a-sub-menu key="more">
              <template #title>✨ 知识与设置</template>

              <!-- 知识、文档与培训 -->
              <a-sub-menu key="knowledge">
                <template #title>📁 知识、文档与培训</template>
                <a-menu-item key="/documents" @click="navigateTo('/documents')">受控文档管理与发行</a-menu-item>
                <a-menu-item key="experience" @click="showDeveloping('质量经验库/案例实践')">质量经验库 / 案例实践</a-menu-item>
                <a-menu-item key="training" @click="showDeveloping('培训计划与考核')">培训计划、考核与记录</a-menu-item>
                <a-menu-item key="/reports" @click="navigateTo('/reports')">质量报告</a-menu-item>
                <a-menu-item key="/tools/msa" @click="navigateTo('/tools/msa')">MSA 测量系统分析</a-menu-item>
              </a-sub-menu>

              <!-- 系统设置与集成 -->
              <a-sub-menu key="system">
                <template #title>⚙️ 系统设置与集成</template>
                <a-menu-item key="/system" @click="navigateTo('/system')">系统概览</a-menu-item>
                <a-menu-item key="/system/permission"
                  @click="navigateTo('/system/permission')">组织架构与角色权限(RBAC)</a-menu-item>
                <a-menu-item key="/system/schedule" @click="navigateTo('/system/schedule')">业务流转审批流配置</a-menu-item>
                <a-menu-item key="/system/api-log" @click="navigateTo('/system/api-log')">模块集成监控日志</a-menu-item>
                <a-menu-item key="/system/log" @click="navigateTo('/system/log')">系统操作日志及审计追溯</a-menu-item>
                <a-menu-item key="/system/update-log" @click="navigateTo('/system/update-log')">系统更新日志</a-menu-item>
                <a-menu-item key="/system/template" @click="navigateTo('/system/template')">系统模板</a-menu-item>
                <a-menu-item key="/system/data-app" @click="navigateTo('/system/data-app')">数据应用</a-menu-item>
                <a-menu-item key="/system/announcement" @click="navigateTo('/system/announcement')">系统公告</a-menu-item>
                <a-menu-item key="/system/config" @click="navigateTo('/system/config')">系统配置</a-menu-item>
                <a-menu-item key="/system/menu" @click="navigateTo('/system/menu')">菜单管理</a-menu-item>
                <a-menu-item key="/system/monitor" @click="navigateTo('/system/monitor')">系统监控</a-menu-item>
                <a-menu-item key="/system/data-dictionary"
                  @click="navigateTo('/system/data-dictionary')">数据字典</a-menu-item>
              </a-sub-menu>
            </a-sub-menu>
          </a-menu>
        </div>

        <!-- 右侧：搜索框、消息提示、用户下拉 -->
        <div class="navbar-right">
          <div class="search-container" @click="toggleSearch">
            <SearchOutlined v-if="!searchVisible" class="search-icon" />
            <a-input-search v-else v-model:value="searchKeyword" placeholder="搜索菜单..." @search="handleSearch"
              @blur="handleSearchBlur" @click.stop ref="searchInput" style="width: 200px" />
          </div>
          <a-space>
            <a-tooltip title="系统更新日志">
              <span class="update-log-icon" @click="navigateTo('/system/update-log')">📝</span>
            </a-tooltip>
            <a-badge count="5">
              <span class="notification-icon">🔔</span>
            </a-badge>
            <a-dropdown>
              <div class="user-info">
                <span class="user-avatar">👤</span>
                <span class="username">{{ username }}</span>
                <span class="dropdown-arrow">▼</span>
              </div>
              <template #overlay>
                <a-menu @click="handleUserMenuClick">
                  <a-menu-item key="profile">个人资料</a-menu-item>
                  <a-menu-item key="settings">设置</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout">退出登录</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </div>
    </a-layout-header>

    <!-- 标签页容器 -->
    <div class="tags-view-container">
      <div class="tags-view-wrapper">
        <div v-for="tag in visitedViews" :key="tag.path" :class="['tags-view-item', { active: isActive(tag) }]"
          @click="handleTagClick(tag)" @contextmenu.prevent="openContextMenu($event, tag)">
          {{ tag.title }}
          <span v-if="!tag.affix" class="close-icon" @click.stop="closeSelectedTag(tag)">
            ×
          </span>
        </div>
      </div>
      <div class="tags-view-actions">
        <a-dropdown>
          <span class="action-btn">⚙️</span>
          <template #overlay>
            <a-menu @click="handleActionClick">
              <a-menu-item key="refresh">刷新当前</a-menu-item>
              <a-menu-item key="close-others">关闭其他</a-menu-item>
              <a-menu-item key="close-all">关闭所有</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div v-if="contextMenuVisible" :style="contextMenuStyle" class="context-menu" @click="closeContextMenu">
      <div class="context-menu-item" @click="refreshSelectedTag">刷新</div>
      <div class="context-menu-item" @click="closeSelectedTag">关闭</div>
      <div class="context-menu-item" @click="closeOtherTags">关闭其他</div>
      <div class="context-menu-item" @click="closeAllTags">关闭所有</div>
    </div>

    <!-- 内容区域 -->
    <a-layout-content class="content-layout">
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { SearchOutlined } from '@ant-design/icons-vue'
  import { message } from 'ant-design-vue'

  interface TagView {
    path: string
    title: string
    affix?: boolean
  }

  const router = useRouter()
  const route = useRoute()

  // 响应式数据
  const selectedKeys = ref < string[] > ([route.path])
  const searchKeyword = ref('')
  const searchVisible = ref(false)
  const searchInput = ref()
  const visitedViews = ref < TagView[] > ([])
  const contextMenuVisible = ref(false)
  const contextMenuStyle = ref({})
  const selectedTag = ref < TagView | null > (null)

  // 计算属性
  const currentPageTitle = computed(() => {
    return route.meta?.title as string || '工作台'
  })

  const username = computed(() => {
    return localStorage.getItem('username') || '管理员'
  })

  // 显示开发中提示
  const showDeveloping = (featureName: string) => {
    message.info(`[${featureName}] 功能正在开发中...`)
  }

  // 导航方法
  const navigateTo = (path: string) => {
    router.push(path)
  }

  // 搜索功能
  const handleSearch = (value: string) => {
    if (!value.trim()) return

    // 直接提示搜索功能正在开发中，避免引用未定义的menuItems变量
    message.info('搜索功能正在开发中，请直接点击菜单导航')
  }

  // 切换搜索框显示
  const toggleSearch = () => {
    searchVisible.value = !searchVisible.value
    if (searchVisible.value) {
      nextTick(() => {
        searchInput.value?.focus()
      })
    }
  }

  // 搜索框失去焦点时隐藏
  const handleSearchBlur = () => {
    setTimeout(() => {
      searchVisible.value = false
    }, 200)
  }

  // 用户菜单点击
  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('username')
      router.push('/login')
    } else if (key === 'profile') {
      message.info('个人资料功能开发中')
    } else if (key === 'settings') {
      message.info('设置功能开发中')
    }
  }

  // 标签页相关方法
  const addView = (view: TagView) => {
    // 检查路由是否应该在标签页中隐藏
    if (route.meta?.hideInMenu) {
      return
    }

    if (visitedViews.value.some(v => v.path === view.path)) {
      return
    }
    visitedViews.value.push({
      ...view,
      title: view.title || '未命名页面'
    })
  }

  const isActive = (tag: TagView) => {
    return tag.path === route.path
  }

  const handleTagClick = (tag: TagView) => {
    router.push(tag.path)
  }

  const closeSelectedTag = (tag: TagView) => {
    const index = visitedViews.value.findIndex(v => v.path === tag.path)
    if (index > -1) {
      visitedViews.value.splice(index, 1)
      if (isActive(tag)) {
        toLastView()
      }
    }
  }

  const closeOtherTags = () => {
    const currentTag = visitedViews.value.find(v => v.path === route.path)
    visitedViews.value = currentTag ? [currentTag] : []
    closeContextMenu()
  }

  const closeAllTags = () => {
    visitedViews.value = visitedViews.value.filter(v => v.affix)
    closeContextMenu()
    if (visitedViews.value.length === 0) {
      router.push('/dashboard')
    } else {
      toLastView()
    }
  }

  const refreshSelectedTag = () => {
    if (selectedTag.value) {
      router.replace({
        ...route,
        query: {
          ...route.query,
          t: Date.now()
        }
      })
    }
    closeContextMenu()
  }

  const toLastView = () => {
    const latestView = visitedViews.value.slice(-1)[0]
    if (latestView) {
      router.push(latestView.path)
    } else {
      router.push('/dashboard')
    }
  }

  // 右键菜单
  const openContextMenu = (event: MouseEvent, tag: TagView) => {
    selectedTag.value = tag
    contextMenuVisible.value = true
    contextMenuStyle.value = {
      left: `${event.clientX}px`,
      top: `${event.clientY}px`
    }
  }

  const closeContextMenu = () => {
    contextMenuVisible.value = false
  }

  // 操作菜单
  const handleActionClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'refresh':
        router.replace({
          ...route,
          query: {
            ...route.query,
            t: Date.now()
          }
        })
        break
      case 'close-others':
        closeOtherTags()
        break
      case 'close-all':
        closeAllTags()
        break
    }
  }

  // 监听路由变化
  watch(
    () => route.path,
    (newPath) => {
      selectedKeys.value = [newPath]

      // 检查路由是否应该在标签页中隐藏
      if (!route.meta?.hideInMenu) {
        addView({
          path: route.path,
          title: currentPageTitle.value
        })
      }
    }
  )

  // 初始化
  onMounted(() => {
    // 添加固定标签
    addView({
      path: '/dashboard',
      title: '工作台',
      affix: true
    })

    // 添加当前路由标签（检查是否应该隐藏）
    if (route.path !== '/dashboard' && !route.meta?.hideInMenu) {
      addView({
        path: route.path,
        title: currentPageTitle.value
      })
    }

    // 点击其他地方关闭右键菜单
    document.addEventListener('click', closeContextMenu)
  })
</script>

<style scoped>
  .main-layout {
    min-height: 100vh;
  }

  /* 导航栏样式 */
  .navbar {
    background: #001529;
    padding: 0;
    box-shadow: 0 1px 4px rgba(0, 21, 41, .08);
    z-index: 1000;
  }

  .navbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 24px;
  }

  .navbar-left {
    display: flex;
    align-items: center;
    flex: 1;
    overflow: hidden;
  }

  .logo {
    display: flex;
    align-items: center;
    margin-right: 24px;
  }

  .logo-img {
    width: 32px;
    height: 32px;
    margin-right: 8px;
  }

  .logo-text {
    color: #fff;
    font-size: 14px;
    font-weight: bold;
    margin: 0;
    line-height: 1.2;
    text-align: left;
  }

  .horizontal-menu {
    flex: 1;
    border-bottom: none;
    background: transparent;
    line-height: 60px;
  }

  .horizontal-menu .ant-menu-item {
    color: rgba(255, 255, 255, 0.85);
    border-bottom: 2px solid transparent;
  }

  .horizontal-menu .ant-menu-item:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }

  .horizontal-menu .ant-menu-item-selected {
    color: #fff;
    border-bottom-color: #1890ff;
    background: rgba(24, 144, 255, 0.1);
  }

  .horizontal-menu .ant-menu-submenu-title {
    color: rgba(255, 255, 255, 0.85);
  }

  .horizontal-menu .ant-menu-submenu-title:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }

  .navbar-right {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .search-container {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-right: 16px;
  }

  .search-icon {
    color: #fff;
    font-size: 16px;
    padding: 8px;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .search-icon:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .search-box {
    width: 200px;
    margin-right: 16px;
  }

  .search-box .ant-input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .search-box .ant-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .search-box .ant-input:focus {
    background: rgba(255, 255, 255, 0.15);
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  .update-log-icon {
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .update-log-icon:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .notification-icon {
    font-size: 18px;
    cursor: pointer;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .user-info:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .user-avatar {
    font-size: 16px;
  }

  .username {
    font-size: 14px;
    color: #fff;
  }

  .dropdown-arrow {
    font-size: 12px;
    color: #999;
  }

  /* 标签页容器样式 */
  .tags-view-container {
    height: 40px;
    background: #fff;
    border-bottom: 1px solid #d8dce5;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 0 3px 0 rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    padding: 0 16px;
  }

  .tags-view-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tags-view-wrapper::-webkit-scrollbar {
    display: none;
  }

  .tags-view-item {
    display: inline-flex;
    align-items: center;
    padding: 0 12px;
    height: 28px;
    line-height: 28px;
    border: 1px solid #d8dce5;
    color: #495060;
    background: #fff;
    font-size: 12px;
    margin-right: 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;
  }

  .tags-view-item:hover {
    background-color: #f5f7fa;
  }

  .tags-view-item.active {
    color: #1890ff;
    background-color: #e6f7ff;
    border-color: #1890ff;
  }

  .close-icon {
    margin-left: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .close-icon:hover {
    color: #ff4d4f;
  }

  .tags-view-actions {
    margin-left: 8px;
  }

  .action-btn {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .action-btn:hover {
    background-color: #f5f5f5;
  }

  /* 右键菜单样式 */
  .context-menu {
    position: fixed;
    background: #fff;
    border: 1px solid #d8dce5;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    z-index: 2000;
    min-width: 120px;
  }

  .context-menu-item {
    padding: 8px 16px;
    cursor: pointer;
    font-size: 12px;
    color: #495060;
    transition: all 0.3s;
  }

  .context-menu-item:hover {
    background-color: #f5f7fa;
    color: #1890ff;
  }

  /* 内容区域样式 */
  .content-layout {
    background: #f0f2f5;
    min-height: calc(100vh - 104px);
  }

  .content-wrapper {
    padding: 0px;
    min-height: 100%;
  }

  /* 路由切换动画 */
  .fade-transform-enter-active,
  .fade-transform-leave-active {
    transition: all 0.3s;
  }

  .fade-transform-enter-from {
    opacity: 0;
    transform: translateX(-30px);
  }

  .fade-transform-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }

  /* 响应式设计 */
  @media (max-width: 1200px) {
    .horizontal-menu {
      overflow-x: auto;
      scrollbar-width: none;
    }

    .horizontal-menu::-webkit-scrollbar {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .navbar-content {
      padding: 0 16px;
    }

    .logo {
      min-width: auto;
      margin-right: 16px;
    }

    .logo-text {
      display: none;
    }

    .search-box {
      display: none;
    }

    .username {
      display: none;
    }
  }
</style>