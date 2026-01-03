import { apiSlice } from './apiSlice'

export interface Account {
  id: string
  accountname: string
  accountType: 'bank' | 'cash' | 'credit_card' | 'investment'
  description: string | null
  openingBalance: number
  currentBalance: number
  createdAt: string
  updatedAt: string
}

export interface CreateAccountPayload {
  accountname: string
  accountType: Account['accountType']
  openingBalance: number
  description?: string
}

export interface UpdateAccountPayload {
  id: string
  accountname: string
  accountType: Account['accountType']
  description?: string
}

export const accountsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /accounts/get
    getAccounts: builder.query<Account[], void>({
      query: () => '/accounts/get',
      providesTags: ['Account'],
    }),

    // GET /accounts/get/:id
    getAccountById: builder.query<Account, string>({
      query: (id) => `/accounts/get/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Account', id }],
    }),

    // POST /accounts/create
    createAccount: builder.mutation<Account, CreateAccountPayload>({
      query: (body) => ({
        url: '/accounts/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Account'],
    }),

    // PUT /accounts/:id/update
    updateAccount: builder.mutation<Account, UpdateAccountPayload>({
      query: ({ id, ...body }) => ({
        url: `/accounts/${id}/update`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Account', id: arg.id },
      ],
    }),

    // DELETE /accounts/:id/delete
    deleteAccount: builder.mutation<void, string>({
      query: (id) => ({
        url: `/accounts/${id}/delete`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Account'],
    }),
  }),
})

export const {
  useGetAccountsQuery,
  useGetAccountByIdQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} = accountsApiSlice
