'use client'

import { Provider } from 'react-redux'
import { store } from './store'
import type { ReactNode } from 'react'

type ReduxProvidersProps = {
  children: ReactNode
}

export function ReduxProviders({ children }: ReduxProvidersProps) {
  return <Provider store={store}>{children}</Provider>
}
