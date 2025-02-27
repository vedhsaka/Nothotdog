import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { 
  Home,
  BookOpen,
  Users,
  PlayCircle,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from "next-themes"

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  
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
      label: 'Personas',
      icon: Users,
      href: '/tools/personas'
    },
    {
      label: 'Runs',
      icon: PlayCircle,
      href: '/tools/runs'
    }
  ]
  
  return (
    <div className="w-64 border-r border-border bg-card shadow-sm h-screen flex flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
          <h1 className="text-xl font-bold text-orange-500">
            NotHotDog
          </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Agent Testing Framework</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-8 w-8 rounded-full"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 py-2 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button 
                variant="ghost" 
                className={`w-full justify-start rounded-[var(--radius)] ${
                  pathname === item.href ? 'bg-accent text-accent-foreground font-medium' : ''
                }`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}