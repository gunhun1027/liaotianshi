import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// 配置axios默认值
const isProd = import.meta.env.PROD
axios.defaults.baseURL = isProd ? 'https://liaotianshi.vercel.app' : 'http://localhost:3000'

axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
}, error => {
    return Promise.reject(error)
})

axios.interceptors.response.use(response => {
    return response
}, error => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
    }
    return Promise.reject(error)
})

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
