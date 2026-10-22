import axios from 'axios'
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
    /** The server's message per form field (e.g. "email" already taken). */
    fieldErrors: {} as Record<string, string>,
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

    login(email: string, password: string): Promise<boolean> {
      return this.signInWith(() => authApi.login(email, password), 'Sign-in failed.')
    },

    register(input: Parameters<typeof authApi.register>[0]): Promise<boolean> {
      return this.signInWith(() => authApi.register(input), 'Could not create the account.')
    },

    loginWithGoogleCode(code: string): Promise<boolean> {
      return this.signInWith(() => authApi.exchangeGoogleCode(code), 'Google sign-in failed.')
    },

    /** Every way of signing in ends with a user and a token to keep (as in the mobile app). */
    async signInWith(request: () => Promise<{ user: User; token: string }>, fallback: string): Promise<boolean> {
      this.isLoading = true
      this.error = null
      this.fieldErrors = {}
      try {
        const { user, token } = await request()
        tokenStorage.set(token)
        this.user = user
        return true
      } catch (err) {
        this.user = null
        this.error = errorMessage(err, fallback)
        const errors = axios.isAxiosError(err) ? (err.response?.data as { errors?: Record<string, string[]> } | undefined)?.errors : undefined
        if (errors) this.fieldErrors = Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]]))
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
