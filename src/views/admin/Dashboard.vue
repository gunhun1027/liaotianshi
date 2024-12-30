<template>
  <div class="admin-dashboard">
    <el-container>
      <el-aside width="220px">
        <div class="admin-sidebar">
          <div class="sidebar-header">
            <img src="/chat-logo.svg" alt="Logo" class="logo" />
            <h3>管理后台</h3>
          </div>
          <el-menu
            :default-active="activeMenu"
            class="admin-menu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="statistics">
              <el-icon><Histogram /></el-icon>
              <span>系统统计</span>
            </el-menu-item>
            <el-menu-item index="users">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-aside>

      <el-container>
        <el-header>
          <div class="header-content">
            <div class="header-title">
              <el-icon class="menu-icon"><component :is="menuIcon" /></el-icon>
              <span>{{ menuTitle }}</span>
            </div>
            <div class="header-actions">
              <el-button type="primary" plain size="small" @click="goToChat">
                <el-icon><ChatDotRound /></el-icon>
                返回聊天室
              </el-button>
              <el-button type="danger" plain size="small" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-button>
            </div>
          </div>
        </el-header>

        <el-main>
          <!-- 统计信息 -->
          <div v-if="activeMenu === 'statistics'" class="statistics">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card shadow="hover" :body-style="{ padding: '20px' }">
                  <template #header>
                    <div class="card-header">
                      <span>用户总数</span>
                      <el-icon><User /></el-icon>
                    </div>
                  </template>
                  <div class="statistic-value">{{ statistics.userCount }}</div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="hover" :body-style="{ padding: '20px' }">
                  <template #header>
                    <div class="card-header">
                      <span>消息总数</span>
                      <el-icon><ChatDotRound /></el-icon>
                    </div>
                  </template>
                  <div class="statistic-value">{{ statistics.messageCount }}</div>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <!-- 用户管理 -->
          <div v-if="activeMenu === 'users'">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <span>用户列表</span>
                  <el-input
                    v-model="searchQuery"
                    placeholder="搜索用户名..."
                    prefix-icon="Search"
                    clearable
                    style="width: 200px"
                  />
                </div>
              </template>
              <el-table 
                :data="filteredUsers" 
                style="width: 100%"
                :header-cell-style="{ background: '#f5f7fa' }"
              >
                <el-table-column prop="username" label="用户名">
                  <template #default="{ row }">
                    <div class="user-info">
                      <el-avatar :size="32">{{ row.username.charAt(0).toUpperCase() }}</el-avatar>
                      <span>{{ row.username }}</span>
                      <el-tag v-if="row.is_admin" size="small" type="warning">管理员</el-tag>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="120">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                      {{ row.status === 'active' ? '正常' : '禁用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="创建时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row }">
                    <el-button
                      v-if="!row.is_admin"
                      :type="row.status === 'active' ? 'danger' : 'success'"
                      size="small"
                      plain
                      @click="handleUserStatusChange(row)"
                    >
                      {{ row.status === 'active' ? '禁用' : '启用' }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { 
  Histogram, 
  User, 
  ChatDotRound, 
  SwitchButton,
  Search
} from '@element-plus/icons-vue'

const router = useRouter()
const activeMenu = ref('statistics')
const statistics = ref({ userCount: 0, messageCount: 0 })
const users = ref([])
const searchQuery = ref('')

const menuIcon = computed(() => {
  return activeMenu.value === 'statistics' ? Histogram : User
})

const menuTitle = computed(() => {
  return activeMenu.value === 'statistics' ? '系统统计' : '用户管理'
})

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query)
  )
})

const fetchStatistics = async () => {
  try {
    const response = await axios.get('/admin/statistics')
    statistics.value = response.data
  } catch (error) {
    ElMessage.error('获取统计信息失败')
  }
}

const fetchUsers = async () => {
  try {
    const response = await axios.get('/admin/users')
    users.value = response.data
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  }
}

const handleMenuSelect = (index) => {
  activeMenu.value = index
  if (index === 'statistics') fetchStatistics()
  else if (index === 'users') fetchUsers()
}

const handleUserStatusChange = async (user) => {
  try {
    const newStatus = user.status === 'active' ? 'banned' : 'active'
    await axios.put(`/admin/users/${user.id}/status`, { status: newStatus })
    ElMessage.success('更新用户状态成功')
    await fetchUsers()
  } catch (error) {
    ElMessage.error('更新用户状态失败')
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

const goToChat = () => {
  router.push('/chat')
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (!user.is_admin) {
    router.push('/chat')
    return
  }
  fetchStatistics()
})
</script>

<style scoped>
.admin-dashboard {
  height: 100vh;
  min-height: 600px;
  background-color: #f0f2f5;
  display: flex;
  overflow: hidden;
}

.el-container {
  flex: 1;
}

.admin-sidebar {
  height: 100%;
  background-color: #001529;
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.logo {
  height: 32px;
  width: 32px;
  flex-shrink: 0;
}

.admin-menu {
  border-right: none;
  background-color: transparent;
  flex: 1;
  overflow-y: auto;
}

:deep(.el-menu) {
  border-right: none;
  background-color: #001529;
}

:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.65);
}

:deep(.el-menu-item.is-active) {
  color: #409EFF;
  background-color: #1890ff1a;
}

:deep(.el-menu-item:hover) {
  color: white;
  background-color: #1890ff1a;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.menu-icon {
  font-size: 18px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.el-header {
  background-color: white;
  border-bottom: 1px solid #eee;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
}

.el-main {
  height: calc(100vh - 60px);
  overflow-y: auto;
  padding: 24px !important;
}

.statistics {
  padding: 24px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statistic-value {
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  color: #1890ff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

:deep(.el-card__header) {
  border-bottom: none;
  padding-bottom: 0;
}

/* 响应式设计 */
@media screen and (max-width: 1200px) {
  .statistics .el-col {
    width: 100%;
    margin-bottom: 20px;
  }

  .el-table {
    width: 100%;
    overflow-x: auto;
  }
}

@media screen and (max-width: 768px) {
  .el-aside {
    width: 64px !important;
  }

  .sidebar-header h3,
  :deep(.el-menu-item span) {
    display: none;
  }

  .header-title span {
    display: none;
  }

  .header-actions {
    gap: 5px;
  }

  :deep(.el-button) {
    padding: 8px;
  }

  :deep(.el-button span) {
    display: none;
  }
}

/* 滚动条样式 */
.el-main::-webkit-scrollbar,
.admin-menu::-webkit-scrollbar {
  width: 6px;
}

.el-main::-webkit-scrollbar-thumb,
.admin-menu::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3px;
}

.el-main::-webkit-scrollbar-track,
.admin-menu::-webkit-scrollbar-track {
  background-color: transparent;
}
</style> 