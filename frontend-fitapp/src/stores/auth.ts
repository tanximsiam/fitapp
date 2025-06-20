import { defineStore } from 'pinia'
import api from '@/lib/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | Record<string, any>,
    isLoading: false,
    error: '' as string | null,
    token: null as string | null, // <-- add this line
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    async init() {
      const token = localStorage.getItem('authToken')
      if (token) {
        this.token = token
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        try {
          const res = await api.get('/user')
          this.user = res.data
        } catch (err) {
          this.user = null
          localStorage.removeItem('authToken')
        }
      }
    },

    async login(credentials: { email: string; password: string }) {
      try {
        this.isLoading = true
        this.error = null

        const res = await api.post('/login', credentials) // ✅ no csrf-cookie or withCredentials
        console.log('Login response:', res.data)
        console.log('FULL login response:', res.data)

        const token = res.data.data.token
        console.log('Received token:', token) // ✅ Check if it's really present

        
        if (token) {
          localStorage.setItem('authToken', token)
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
          console.warn('❌ Token missing in response')
        }

        this.user = res.data.data
      } catch (err: any) {
        if (err.response?.status === 401) {
          console.error('Sorry, wrong credentials. Please try again.')
          this.error = 'Sorry, wrong credentials. Please try again.'
        }
        this.error = err.response?.data?.message || 'Login failed'
        this.user = null
      } finally {
        this.isLoading = false
      }
    },

    async fetchUser() {
      const token = localStorage.getItem('authToken')

      // ✅ Skip fetch if no token exists
      if (!token) {
        this.user = null
        return
      }

      try {
        const res = await api.get('/user') // token is added by axios interceptor
        console.log('Logged-in user:', res.data)
        this.user = res.data
      } catch {
        this.user = null
        localStorage.removeItem('authToken') // clean up invalid token
      }
    },

    async logout() {
      try {
        await api.post('/logout')
      } catch (err) {
        // ignore
      } finally {
        localStorage.removeItem('authToken')
        this.user = null
      }
    }
  },
})
