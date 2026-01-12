<template>
  <div class="login-container">
    <div class="login-background">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>
    
    <div class="login-content">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <div class="logo-icon">🏭</div>
            <h1>S_QMS</h1>
          </div>
          <h2>质量管理系统</h2>
          <p>汽车零配件行业质量管理解决方案</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input 
                v-model="username" 
                type="text" 
                placeholder="请输入用户名"
                :class="{ 'error': errors.username }"
                @input="clearError('username')"
              />
            </div>
            <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
          </div>
          
          <div class="form-group">
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input 
                v-model="password" 
                type="password" 
                placeholder="请输入密码"
                :class="{ 'error': errors.password }"
                @input="clearError('password')"
              />
            </div>
            <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
          </div>
          
          <div class="form-options">
            <label class="checkbox-wrapper">
              <input v-model="rememberMe" type="checkbox" />
              <span class="checkmark"></span>
              记住密码
            </label>
            <a href="#" class="forgot-password">忘记密码？</a>
          </div>
          
          <button type="submit" :disabled="loading" class="login-button">
            <span v-if="loading" class="loading-spinner"></span>
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
        
        <div class="login-footer">
          <div class="demo-account">
            <p>演示账号</p>
            <div class="account-info">
              <span>用户名：admin</span>
              <span>密码：123456</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="features">
        <div class="feature-item">
          <span class="feature-icon">🛡️</span>
          <span>质量检验</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📊</span>
          <span>数据分析</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📋</span>
          <span>报告管理</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const rememberMe = ref(false)

const username = ref('')
const password = ref('')

const errors = reactive({
  username: '',
  password: ''
})

const validateForm = () => {
  let isValid = true
  
  if (!username.value.trim()) {
    errors.username = '请输入用户名'
    isValid = false
  } else {
    errors.username = ''
  }
  
  if (!password.value.trim()) {
    errors.password = '请输入密码'
    isValid = false
  } else if (password.value.length < 6) {
    errors.password = '密码长度不能少于6位'
    isValid = false
  } else {
    errors.password = ''
  }
  
  return isValid
}

const clearError = (field: 'username' | 'password') => {
  errors[field] = ''
}

const handleLogin = async () => {
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  try {
    // 模拟登录延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (username.value === 'admin' && password.value === '123456') {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('username', username.value)
      
      if (rememberMe.value) {
        localStorage.setItem('rememberedUser', username.value)
      }
      
      router.push('/dashboard')
    } else {
      errors.password = '用户名或密码错误'
    }
  } catch (error) {
    errors.password = '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

// 组件挂载时检查是否有记住的用户名
const rememberedUser = localStorage.getItem('rememberedUser')
if (rememberedUser) {
  username.value = rememberedUser
  rememberMe.value = true
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: -2;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -1;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 30%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.login-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  gap: 60px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.logo-icon {
  font-size: 40px;
  margin-right: 10px;
}

.logo h1 {
  color: #667eea;
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -1px;
}

.login-header h2 {
  color: #2c3e50;
  margin: 10px 0 5px 0;
  font-size: 24px;
  font-weight: 600;
}

.login-header p {
  color: #7f8c8d;
  margin: 0;
  font-size: 14px;
  font-weight: 400;
}

.login-form {
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 15px;
  font-size: 16px;
  color: #95a5a6;
  z-index: 1;
}

.input-wrapper input {
  width: 100%;
  padding: 15px 15px 15px 45px;
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-wrapper input.error {
  border-color: #e74c3c;
  background: #fdf2f2;
}

.error-message {
  display: block;
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
  margin-left: 5px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #5a6c7d;
}

.checkbox-wrapper input {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox-wrapper input:checked + .checkmark {
  background: #667eea;
  border-color: #667eea;
}

.checkbox-wrapper input:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 12px;
}

.forgot-password {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #5a6fd8;
  text-decoration: underline;
}

.login-button {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-footer {
  border-top: 1px solid #e1e8ed;
  padding-top: 20px;
}

.demo-account {
  text-align: center;
}

.demo-account p {
  color: #7f8c8d;
  font-size: 12px;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.account-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 12px;
  color: #5a6c7d;
}

.account-info span {
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  font-size: 18px;
  font-weight: 500;
  opacity: 0.9;
  transition: all 0.3s ease;
}

.feature-item:hover {
  opacity: 1;
  transform: translateX(5px);
}

.feature-icon {
  font-size: 24px;
  background: rgba(255, 255, 255, 0.2);
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

@media (max-width: 768px) {
  .login-content {
    flex-direction: column;
    gap: 40px;
  }
  
  .features {
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .login-card {
    padding: 30px 20px;
  }
}
</style>