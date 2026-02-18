import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import { setAuthTokenGetter } from './lib/api'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
if (!publishableKey) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY: sign-in and saved builds will not work.')
}

function AuthApiSync() {
  const { getToken } = useAuth()
  useEffect(() => {
    setAuthTokenGetter(() => getToken())
  }, [getToken])
  return null
}

const root = (
  <StrictMode>
    {publishableKey ? (
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
        <AuthApiSync />
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(root)
