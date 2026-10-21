export interface User {
  id: number
  name: string
  email: string
}

/** Backend payload shapes (snake_case), see docs/openapi.yaml. */
export interface UserPayload {
  id: number
  name: string
  email: string
  created_at: string | null
}
