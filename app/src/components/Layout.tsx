import { Link, Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: 'Home' },
  { to: '/builds', label: 'Builds' },
  { to: '/parts', label: 'Parts' },
]

export function Layout() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center gap-6">
          <Link to="/" className="font-semibold text-lg text-foreground hover:text-primary">
            Bike Build Tool
          </Link>
          <nav className="flex gap-1">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
