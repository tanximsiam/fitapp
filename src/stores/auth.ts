import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { errorMessage, isUnauthorized, tokenStorage } from '@/api/client'
import type { User } from '@/types/auth'

let initPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isLoading: false,
    error: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
  },
  actions: {
    /** Restore the session from a stored token once per page load. */
    init(): Promise<void> {
      initPromise ??= this.restore()
      return initPromise
    },

    async restore() {
      if (!tokenStorage.get()) return
      try {
        this.user = await authApi.fetchCurrentUser()
      } catch (err) {
        this.user = null
        // Keep the token when the backend is merely unreachable; drop it only when it is rejected.
        if (isUnauthorized(err)) tokenStorage.clear()
        else this.error = errorMessage(err)
      }
    },

    async login(email: string, password: string): Promise<boolean> {
      this.isLoading = true
      this.error = null
      try {
        const { user, token } = await authApi.login(email, password)
        tokenStorage.set(token)
        this.user = user
        return true
      } catch (err) {
        this.user = null
        this.error = errorMessage(err, 'Sign-in failed.')
        return false
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        if (tokenStorage.get()) await authApi.logout()
      } catch {
        // The token is discarded locally either way.
      } finally {
        tokenStorage.clear()
        this.user = null
      }
    },
  },
})
