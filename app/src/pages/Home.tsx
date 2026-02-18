import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bike Build Tool</h1>
        <p className="mt-2 text-muted-foreground">
          Plan custom bike builds: track parts, components, weight, and price.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Builds</CardTitle>
            <CardDescription>Create and manage your bike build projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/builds">View builds</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Parts catalog</CardTitle>
            <CardDescription>Browse and add parts by component type.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link to="/parts">View parts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
