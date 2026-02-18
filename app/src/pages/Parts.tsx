import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Part } from '@/types/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function Parts() {
  const { data: parts = [], isLoading, error } = useQuery<Part[]>({
    queryKey: ['parts'],
    queryFn: () => api.get<Part[]>('/api/parts'),
  })

  if (isLoading) return <p className="text-muted-foreground">Loading parts…</p>
  if (error) return <p className="text-destructive">Failed to load parts: {String(error)}</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Parts catalog</h1>
      <Card>
        <CardHeader>
          <CardTitle>Parts</CardTitle>
          <CardDescription>Browse parts. Add parts to builds from the build page.</CardDescription>
        </CardHeader>
        <CardContent>
          {!parts.length ? (
            <p className="text-muted-foreground">No parts in the catalog yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead className="text-right">Weight (g)</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.component}</TableCell>
                    <TableCell className="text-right">{p.weightG ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      {p.price != null ? `${p.currency ?? ''} ${p.price}` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
