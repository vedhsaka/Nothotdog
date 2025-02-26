import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from './providers'
import ApiKeyConfig from '@/components/config/ApiKeyConfig';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex min-h-screen flex-col">
            {children}
            <ApiKeyConfig />
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}