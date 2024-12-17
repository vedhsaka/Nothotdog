import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { 
  Home,
  BookOpen,
  LineChart,
  PlayCircle,
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  
  const navItems = [
    {
      label: 'Configuration',
      icon: Home,
      href: '/tools'
    },
    {
      label: 'Scenarios',
      icon: BookOpen,
      href: '/tools/test-cases'
    },
    {
      label: 'Runs',
      icon: PlayCircle,
      href: '/tools/runs'
    },
    {
      label: 'Analytics',
      icon: LineChart,
      href: '/tools/analytics'
    }
  ]

  return (
    <div className="w-64 bg-black/40 border-r border-zinc-800 p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          NotHotDog
        </h1>
        <p className="text-zinc-500 text-sm">(BETA)</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${
                pathname === item.href ? 'bg-zinc-800/50' : ''
              }`}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  )
}