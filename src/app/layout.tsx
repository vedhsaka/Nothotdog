import './globals.css'
import { Inter } from 'next/font/google'
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { ThemeProvider } from './providers'
import ApiKeyConfig from '@/components/config/ApiKeyConfig';
import SignupHandler from '@/components/authentication/SignupHandler';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
   <ClerkProvider>
    <SignupHandler />
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`}>
           <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
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
  </ClerkProvider>
  )
}