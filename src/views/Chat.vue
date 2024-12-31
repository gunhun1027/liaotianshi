<template>
  <div class="chat-container">
    <el-container>
      <el-header style="height: 60px; line-height: 60px;">
        <div class="header-content">
          <div class="header-left">
            <img src="/chat-logo.svg" alt="Logo" class="logo" />
            <h2>实时聊天室</h2>
          </div>
          <div class="user-info">
            <el-dropdown>
              <span class="user-dropdown">
                <el-avatar :size="32" :src="avatarUrl">{{ currentUser.username.charAt(0).toUpperCase() }}</el-avatar>
                <span class="username">{{ currentUser.username }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/profile')">
                    <el-icon><User /></el-icon>
                    个人资料
                  </el-dropdown-item>
                  <el-dropdown-item v-if="currentUser.is_admin" @click="goToAdmin">
                    <el-icon><Setting /></el-icon>
                    管理后台
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <el-main>
        <div class="message-container" ref="messageContainer">
          <div v-for="msg in messages" :key="msg.id" 
               class="message"
               :class="{ 
                 'message-self': msg.userId === currentUser.id,
                 'message-system': msg.user === 'system'
               }">
            <template v-if="msg.user !== 'system'">
              <el-avatar 
                :size="40" 
                class="message-avatar"
                :src="msg.avatarUrl"
              >
                {{ msg.user.charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="message-content">
                <div class="message-user">{{ msg.user }}</div>
                <div class="message-text">{{ msg.text }}</div>
                <div class="message-time">{{ formatTime(msg.time) }}</div>
              </div>
            </template>
            <template v-else>
              <div class="system-message">
                {{ msg.text }}
              </div>
            </template>
          </div>
        </div>
      </el-main>
      
      <el-footer height="120px">
        <div class="input-container">
          <el-input
            v-model="messageInput"
            type="textarea"
            :rows="3"
            placeholder="输入消息..."
            @keyup.enter.native.exact="sendMessage"
            @keyup.enter.native.shift.prevent="messageInput += '\n'"
          />
          <div class="input-actions">
            <span class="input-tip">Shift + Enter 换行，Enter 发送</span>
            <el-button type="primary" @click="sendMessage" :disabled="!messageInput.trim()">
              发送
              <el-icon class="el-icon--right"><Position /></el-icon>
            </el-button>
          </div>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { io } from 'socket.io-client'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Setting, SwitchButton, Position, User } from '@element-plus/icons-vue'

const router = useRouter()
const isProd = import.meta.env.PROD
const socket = io(isProd ? 'https://liaotianshi-phi.vercel.app' : 'http://localhost:3000')
const messageContainer = ref(null)
const messages = ref([])
const messageInput = ref('')
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

// 获取用户头像URL
const avatarUrl = computed(() => {
  return currentUser.value.avatarUrl || ''
})

// 监听用户信息变化
const updateUserInfo = async () => {
  try {
    const response = await axios.get('/api/user/profile')
    currentUser.value = {
      ...currentUser.value,
      ...response.data
    }
    localStorage.setItem('user', JSON.stringify(currentUser.value))
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

onMounted(async () => {
  if (!currentUser.value.id) {
    router.push('/login')
    return
  }

  // 获取最新的用户信息
  await updateUserInfo()

  socket.emit('joinRoom', 'main')

  socket.on('message', (message) => {
    // 如果是当前用户的消息，使用最新的头像
    if (message.userId === currentUser.value.id) {
      message.avatarUrl = currentUser.value.avatarUrl
    }
    messages.value.push(message)
    scrollToBottom()
  })

  // 自动滚动到底部
  scrollToBottom()
})

// 每次发送消息前更新用户信息
const sendMessage = async () => {
  if (!messageInput.value.trim()) return

  // 发送消息前更新用户信息
  await updateUserInfo()

  const message = {
    room: 'main',
    user: currentUser.value.displayName || currentUser.value.username,
    userId: currentUser.value.id,
    avatarUrl: currentUser.value.avatarUrl,
    text: messageInput.value,
    time: new Date()
  }

  socket.emit('sendMessage', message)
  messageInput.value = ''
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

const goToAdmin = () => {
  router.push('/admin')
}

const formatTime = (time) => {
  const date = new Date(time)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleString('zh-CN', { 
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.chat-container {
  height: 100vh;
  min-height: 600px;
  background-color: #f5f7f9;
  display: flex;
}

.el-container {
  flex: 1;
  min-width: 800px;
  margin: 0 auto;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  height: 32px;
  width: 32px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #333;
}

.message-container {
  height: calc(100vh - 180px);
  min-height: 420px;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 85%;
}

.message-self {
  flex-direction: row-reverse;
  margin-left: auto;
}

.message-avatar {
  background-color: var(--el-color-primary);
  color: white;
  flex-shrink: 0;
}

.message-self .message-avatar {
  background-color: #95ec69;
}

.message-content {
  max-width: calc(100% - 52px);
  min-width: 100px;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin: 4px 0;
  word-break: break-word;
  white-space: pre-wrap;
}

.message-self .message-text {
  background-color: var(--el-color-primary);
  color: white;
}

.message-user {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.system-message {
  width: 100%;
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin: 10px 0;
}

.input-container {
  padding: 15px 20px;
  background-color: white;
  border-top: 1px solid #eee;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.input-tip {
  font-size: 12px;
  color: #909399;
}

.el-header {
  background-color: white;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.el-footer {
  padding: 0;
  background-color: white;
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
  resize: none;
}

:deep(.el-button) {
  border-radius: 8px;
}

/* 滚动条样式 */
.message-container::-webkit-scrollbar {
  width: 6px;
}

.message-container::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3px;
}

.message-container::-webkit-scrollbar-track {
  background-color: transparent;
}

/* 响应式设计 */
@media screen and (max-width: 1200px) {
  .el-container {
    min-width: 600px;
  }
}

@media screen and (max-width: 768px) {
  .el-container {
    min-width: 100%;
  }

  .message {
    max-width: 95%;
  }

  .header-left h2 {
    font-size: 18px;
  }

  .username {
    display: none;
  }
}
</style> 