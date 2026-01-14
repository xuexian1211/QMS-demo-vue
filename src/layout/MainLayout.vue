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
            <a-menu-item key="/dashboard" @click="navigateTo('/dashboard')">
              <span>📊 工作台</span>
            </a-menu-item>
            <a-menu-item key="/leadership" @click="navigateTo('/leadership')">
              <span>📈 领导驾驶舱</span>
            </a-menu-item>
            <a-sub-menu key="production-quality">
              <template #title>🏭 生产过程质量</template>
              <!-- 问题管理 -->
              <a-sub-menu key="problem-management">
                <template #title>📋 问题管理</template>
                <a-menu-item key="/production-quality/problem-management/problem-types"
                  @click="navigateTo('/production-quality/problem-management/problem-types')">问题类型</a-menu-item>
                <a-menu-item key="/production-quality/problem-management/problem-list"
                  @click="navigateTo('/production-quality/problem-management/problem-list')">问题管理</a-menu-item>
              </a-sub-menu>
              <!-- 质量检验 -->
              <a-sub-menu key="quality-inspection">
                <template #title>🔍 质量检验</template>

                <a-menu-item key="/production-quality/quality-inspection/inspection-rules"
                  @click="navigateTo('/production-quality/quality-inspection/inspection-rules')">检验规则</a-menu-item>
                <a-menu-item key="/production-quality/quality-inspection/iqc-checklist"
                  @click="navigateTo('/production-quality/quality-inspection/iqc-checklist')">来料检验单(IQC)</a-menu-item>
                <a-menu-item key="/production-quality/quality-inspection/ipqc-checklist"
                  @click="navigateTo('/production-quality/quality-inspection/ipqc-checklist')">过程检验单(IPQC)</a-menu-item>
                <a-menu-item key="/production-quality/quality-inspection/fqc-checklist"
                  @click="navigateTo('/production-quality/quality-inspection/fqc-checklist')">成品检验单(FQC)</a-menu-item>
                <a-menu-item key="/production-quality/quality-inspection/oqc-checklist"
                  @click="navigateTo('/production-quality/quality-inspection/oqc-checklist')">出货检验单(OQC)</a-menu-item>
              </a-sub-menu>
              <!-- 异常处理 -->
              <a-sub-menu key="exception-handling">
                <template #title>⚠️ 异常处理</template>
                <a-menu-item key="/production-quality/exception-handling/material-disposal"
                  @click="navigateTo('/production-quality/exception-handling/material-disposal')">来料不合格处置单</a-menu-item>
                <a-menu-item key="/production-quality/exception-handling/process-disposal"
                  @click="navigateTo('/production-quality/exception-handling/process-disposal')">过程不合格品处置单</a-menu-item>
                <a-menu-item key="/production-quality/exception-handling/product-disposal"
                  @click="navigateTo('/production-quality/exception-handling/product-disposal')">成品不合格处置单</a-menu-item>
                <a-menu-item key="/production-quality/exception-handling/change-point-application"
                  @click="navigateTo('/production-quality/exception-handling/change-point-application')">变化点申请单</a-menu-item>
                <a-menu-item key="/production-quality/exception-handling/qrqc-response"
                  @click="navigateTo('/production-quality/exception-handling/qrqc-response')">QRQC快速反应单</a-menu-item>
              </a-sub-menu>
            </a-sub-menu>
            <a-sub-menu key="inspection-model">
              <template #title>🧪 质量主数据</template>

              <!-- 不良管理 -->
              <a-sub-menu key="defect-management">
                <template #title>🚫 不良管理</template>
                <a-menu-item key="/inspection-model/defect-phenomena"
                  @click="navigateTo('/inspection-model/defect-phenomena')">不良现象</a-menu-item>
                <a-menu-item key="/inspection-model/defect-causes"
                  @click="navigateTo('/inspection-model/defect-causes')">不良原因</a-menu-item>
              </a-sub-menu>

              <!-- 检验标准 -->
              <a-sub-menu key="insp-standards">
                <template #title>📏 检验标准</template>
                <a-menu-item key="/inspection-model/inspection-items"
                  @click="navigateTo('/inspection-model/inspection-items')">检验项目</a-menu-item>
                <a-menu-item key="/inspection-model/insp-methods"
                  @click="navigateTo('/inspection-model/insp-methods')">检验方法</a-menu-item>
                <a-menu-item key="/inspection-model/sampling-plans"
                  @click="navigateTo('/inspection-model/sampling-plans')">抽样方案</a-menu-item>
                <a-menu-item key="/inspection-model/gauge-ledgers"
                  @click="navigateTo('/inspection-model/gauge-ledgers')">量检具台账</a-menu-item>
              </a-sub-menu>

              <!-- 检验策划 -->
              <a-sub-menu key="insp-planning">
                <template #title>📝 检验策划</template>
                <a-menu-item key="/inspection-model/insp-plans"
                  @click="navigateTo('/inspection-model/insp-plans')">检验方案</a-menu-item>
                <a-menu-item key="/inspection-model/insp-templates"
                  @click="navigateTo('/inspection-model/insp-templates')">检验模板</a-menu-item>
              </a-sub-menu>
            </a-sub-menu>
            <a-menu-item key="/supplier" @click="navigateTo('/supplier')">
              <span>🏭 供方管理</span>
            </a-menu-item>
            <a-menu-item key="/customer" @click="navigateTo('/customer')">
              <span>👥 客诉管理</span>
            </a-menu-item>
            <a-sub-menu key="tools">
              <template #title>🔧 质量工具</template>
              <a-menu-item key="/tools/spc" @click="navigateTo('/tools/spc')">SPC统计过程控制</a-menu-item>
              <a-menu-item key="/tools/fmea" @click="navigateTo('/tools/fmea')">FMEA失效模式分析</a-menu-item>
              <a-menu-item key="/tools/msa" @click="navigateTo('/tools/msa')">MSA测量系统分析</a-menu-item>
            </a-sub-menu>
            <a-sub-menu key="more">
              <template #title>📋 更多</template>
              <a-menu-item key="/reports" @click="navigateTo('/reports')">
                <span>📄 质量报告</span>
              </a-menu-item>
              <a-menu-item key="/documents" @click="navigateTo('/documents')">
                <span>📁 文档管理</span>
              </a-menu-item>
              <a-sub-menu key="basic-data">
                <template #title>📋 基础数据</template>
                <a-menu-item key="/basic-data/material-category"
                  @click.stop="navigateTo('/basic-data/material-category')">物料分类</a-menu-item>
                <a-menu-item key="/basic-data/material"
                  @click.stop="navigateTo('/basic-data/material')">物料/产品</a-menu-item>
                <a-menu-item key="/basic-data/unit" @click.stop="navigateTo('/basic-data/unit')">计量单位</a-menu-item>
                <a-menu-item key="/basic-data/process-route"
                  @click.stop="navigateTo('/basic-data/process-route')">工艺路线</a-menu-item>
                <a-menu-item key="/basic-data/production-team"
                  @click.stop="navigateTo('/basic-data/production-team')">生产班组</a-menu-item>
                <a-menu-item key="/basic-data/customer-archive"
                  @click.stop="navigateTo('/basic-data/customer-archive')">客户档案</a-menu-item>
                <a-menu-item key="/basic-data/supplier-archive"
                  @click.stop="navigateTo('/basic-data/supplier-archive')">供应商档案</a-menu-item>
                <a-menu-item key="/basic-data/storage-location"
                  @click.stop="navigateTo('/basic-data/storage-location')">存储地点</a-menu-item>
              </a-sub-menu>

              <a-sub-menu key="system">
                <template #title>⚙️ 系统管理</template>
                <a-menu-item key="/system" @click.stop="navigateTo('/system')">系统概览</a-menu-item>
                <a-menu-item key="/system/announcement"
                  @click.stop="navigateTo('/system/announcement')">系统公告</a-menu-item>
                <a-menu-item key="/system/config" @click.stop="navigateTo('/system/config')">系统配置</a-menu-item>
                <a-menu-item key="/system/menu" @click.stop="navigateTo('/system/menu')">菜单管理</a-menu-item>
                <a-menu-item key="/system/log" @click.stop="navigateTo('/system/log')">系统日志</a-menu-item>
                <a-menu-item key="/system/api-log" @click.stop="navigateTo('/system/api-log')">接口日志</a-menu-item>
                <a-menu-item key="/system/schedule" @click.stop="navigateTo('/system/schedule')">系统调度</a-menu-item>
                <a-menu-item key="/system/monitor" @click.stop="navigateTo('/system/monitor')">系统监控</a-menu-item>
                <a-menu-item key="/system/data-dictionary"
                  @click.stop="navigateTo('/system/data-dictionary')">数据字典</a-menu-item>
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