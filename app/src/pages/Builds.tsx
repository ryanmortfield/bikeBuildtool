import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Build } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Builds() {
  const { data: builds, isLoading, error } = useQuery<Build[]>({
    queryKey: ['builds'],
    queryFn: () => api.get<Build[]>('/api/builds'),
  })

  if (isLoading) return <p className="text-muted-foreground">Loading builds…</p>
  if (error) return <p className="text-destructive">Failed to load builds: {String(error)}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Builds</h1>
        <Button asChild>
          <Link to="/builds/new">New build</Link>
        </Button>
      </div>
      {!builds?.length ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No builds yet. Create one to get started.</p>
            <Button asChild className="mt-4">
              <Link to="/builds/new">New build</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {builds.map((b) => (
            <li key={b.id}>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    <Link to={`/builds/${b.id}`} className="hover:underline">
                      {b.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>{b.bikeType}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/builds/${b.id}`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
