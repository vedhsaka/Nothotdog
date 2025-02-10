import './globals.css'
import { Inter } from 'next/font/google'
import ApiKeyConfig from '@/components/config/ApiKeyConfig';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#0A0A0A] text-white antialiased`}>
        <main className="flex min-h-screen flex-col">
          {children}
          <ApiKeyConfig />
        </main>
      </body>
    </html>
  )
}
