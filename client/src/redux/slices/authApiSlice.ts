import { apiSlice } from "./apiSlice"
/**
 * Request payload for login
 */
export interface LoginPayload {
  password: string
}

/**
 * Response returned by backend
 */
export interface LoginResponse {
  accessToken: string
}

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // POST /auth/login
    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useLoginMutation,
} = authApiSlice
