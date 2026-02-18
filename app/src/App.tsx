import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Builds } from '@/pages/Builds'
import { BuildNew } from '@/pages/BuildNew'
import { BuildDetail } from '@/pages/BuildDetail'
import { Parts } from '@/pages/Parts'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30 * 1000 },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'builds', element: <Builds /> },
      { path: 'builds/new', element: <BuildNew /> },
      { path: 'builds/:id', element: <BuildDetail /> },
      { path: 'parts', element: <Parts /> },
    ],
  },
])

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
