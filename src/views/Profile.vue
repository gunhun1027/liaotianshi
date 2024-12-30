<template>
  <div class="profile-container">
    <el-container>
      <el-header style="height: 60px; line-height: 60px;">
        <div class="header-content">
          <div class="header-left">
            <img src="/chat-logo.svg" alt="Logo" class="logo" />
            <h2>个人资料</h2>
          </div>
          <div class="header-actions">
            <el-button type="primary" plain @click="router.push('/chat')">
              <el-icon><ChatDotRound /></el-icon>
              返回聊天室
            </el-button>
          </div>
        </div>
      </el-header>
      
      <el-main>
        <el-card class="profile-card">
          <el-form 
            :model="profileForm" 
            :rules="rules"
            ref="formRef"
            label-position="top"
          >
            <div class="avatar-upload">
              <el-avatar 
                :size="100" 
                :src="avatarPreview || profileForm.avatarUrl"
              >
                {{ profileForm.displayName?.charAt(0).toUpperCase() }}
              </el-avatar>
              <el-upload
                class="avatar-uploader"
                action="http://localhost:3000/api/user/upload/avatar"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                :headers="uploadHeaders"
              >
                <el-button type="primary" plain>
                  <el-icon><Upload /></el-icon>
                  更换头像
                </el-button>
              </el-upload>
            </div>

            <el-form-item label="用户ID">
              <el-input v-model="profileForm.id" disabled />
            </el-form-item>

            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>

            <el-form-item label="显示名称" prop="displayName">
              <el-input 
                v-model="profileForm.displayName" 
                placeholder="请输入显示名称" 
              />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input 
                v-model="profileForm.email" 
                placeholder="请输入邮箱" 
              />
            </el-form-item>

            <el-form-item label="生日" prop="birthday">
              <el-date-picker
                v-model="profileForm.birthday"
                type="date"
                placeholder="选择生日"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                @click="handleSubmit"
                :loading="loading"
                style="width: 100%"
              >
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-main>
    </el-container>

    <!-- 图片裁剪对话框 -->
    <el-dialog
      v-model="cropperVisible"
      title="裁剪头像"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @closed="handleDialogClose"
    >
      <div class="cropper-container">
        <Cropper
          v-if="cropperVisible && cropperImg"
          ref="cropperRef"
          class="cropper"
          :src="cropperImg"
          :stencil-props="{
            aspectRatio: 1,
            class: 'custom-stencil'
          }"
          :resize-image="{
            touch: true,
            wheel: true
          }"
          :default-size="{
            width: '80%',
            height: '80%'
          }"
          :min-width="100"
          :min-height="100"
          :transitions="true"
          image-restriction="stencil"
          :stencil-size="{
            width: 200,
            height: 200
          }"
        />
        <div v-else class="cropper-placeholder">
          <el-icon class="loading-icon"><Loading /></el-icon>
          正在加载图片...
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cropperVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCrop">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Upload, Loading } from '@element-plus/icons-vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/theme.compact.css'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const avatarPreview = ref('')
const showCropper = ref(false)
const cropperVisible = ref(false)
const cropperImg = ref('')
const cropperRef = ref(null)

const profileForm = ref({
  id: '',
  username: '',
  displayName: '',
  email: '',
  birthday: '',
  avatarUrl: ''
})

const rules = {
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('token')}`
}

const fetchProfile = async () => {
  try {
    const response = await axios.get('/api/user/profile')
    profileForm.value = response.data
  } catch (error) {
    ElMessage.error('获取个人资料失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    await axios.put('/api/user/profile', profileForm.value)
    ElMessage.success('保存成功')
    
    // 更新本地存储的用户信息
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    user.displayName = profileForm.value.displayName
    user.avatarUrl = profileForm.value.avatarUrl
    localStorage.setItem('user', JSON.stringify(user))

    // 延迟一下再跳转，让用户看到成功提示
    setTimeout(() => {
      router.push('/chat')
    }, 1000)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    loading.value = false
  }
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  // 读取图片并显示裁剪对话框
  const reader = new FileReader()
  reader.onload = (e) => {
    console.log('图片加载完成:', e.target.result.slice(0, 50) + '...')  // 调试信息
    cropperVisible.value = true  // 先显示对话框
    // 延迟设置图片数据，确保对话框已经打开
    setTimeout(() => {
      cropperImg.value = e.target.result
    }, 100)
  }
  reader.onerror = (e) => {
    console.error('图片加载失败:', e)
    ElMessage.error('图片加载失败')
  }
  reader.readAsDataURL(file)
  return false // 阻止自动上传
}

// 监听对话框关闭
const handleDialogClose = () => {
  cropperImg.value = ''  // 清空图片
  cropperVisible.value = false
}

// 监听裁剪组件挂载
const handleCropperMounted = () => {
  console.log('裁剪组件已挂载')  // 调试信息
}

// 监听图片加载
const handleImageLoad = () => {
  console.log('裁剪组件图片已加载')  // 调试信息
}

const handleCrop = async () => {
  if (!cropperRef.value) return
  
  try {
    const { coordinates, canvas } = cropperRef.value.getResult()
    console.log('裁剪坐标:', coordinates)  // 调试信息
    
    // 将 canvas 转换为 blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png', 0.9)  // 使用 0.9 的质量压缩比
    })
    
    const formData = new FormData()
    formData.append('avatar', blob, 'avatar.png')

    const uploadResponse = await axios.post('/api/user/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    // 更新头像URL
    profileForm.value.avatarUrl = uploadResponse.data.url
    
    // 更新本地存储的用户信息
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    user.avatarUrl = uploadResponse.data.url
    localStorage.setItem('user', JSON.stringify(user))
    
    ElMessage.success('头像上传成功')
    cropperVisible.value = false
  } catch (error) {
    console.error('裁剪或上传失败:', error)
    ElMessage.error('头像上传失败')
  }
}

const handleAvatarSuccess = (response) => {
  profileForm.value.avatarUrl = response.url
  // 更新本地存储的用户信息
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  user.avatarUrl = response.url
  localStorage.setItem('user', JSON.stringify(user))
  ElMessage.success('头像上传成功')
}

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (!user.id) {
    router.push('/login')
    return
  }
  fetchProfile()
})
</script>

<style scoped>
.profile-container {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.el-header {
  background-color: white;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.profile-card {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

:deep(.el-form-item__label) {
  padding-bottom: 8px;
  font-weight: 500;
}

:deep(.el-input__wrapper),
:deep(.el-date-picker) {
  border-radius: 8px;
}

:deep(.el-button) {
  border-radius: 8px;
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

  .profile-card {
    margin: 10px;
  }

  .header-left h2 {
    font-size: 18px;
  }
}

.cropper-container {
  height: 400px;
  width: 100%;
  background-color: #f8f8f8;
  position: relative;
  overflow: hidden;
}

.cropper {
  height: 100%;
  width: 100%;
}

:deep(.vue-advanced-cropper__foreground) {
  background: rgba(0, 0, 0, 0.3);
}

:deep(.vue-advanced-cropper__image) {
  max-width: none !important;
  max-height: none !important;
}

:deep(.vue-advanced-cropper__stencil-wrapper) {
  border: 2px solid var(--el-color-primary);
}

:deep(.vue-advanced-cropper__boundary) {
  border: 2px solid #fff;
}

.cropper-placeholder {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}

.loading-icon {
  font-size: 24px;
  margin-bottom: 8px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 