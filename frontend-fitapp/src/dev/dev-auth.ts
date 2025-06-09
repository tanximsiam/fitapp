import { useAuthStore } from '@/stores/auth'

declare global {
  interface Window {
    authStore?: any;
  }
}

export function devLogin() {
  const token = '1|LPrG4ptQHOB3UxtZo9uJX7uXUSncNRlJ8hqGh38X188b9fe5'

  localStorage.setItem('authToken', token)

  const auth = useAuthStore()
  auth.user = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    created_at: '2025-06-07T14:10:22.000000Z',
    updated_at: '2025-06-07T14:10:22.000000Z',
  }

  window.location.href = '/home'
}

export function devLogout() {
  localStorage.removeItem('authToken')

  const auth = useAuthStore()
  auth.user = null

  window.location.href = '/login'
}

if (import.meta.env.DEV) {
  // Store the instance on window
  window.authStore = useAuthStore()
}