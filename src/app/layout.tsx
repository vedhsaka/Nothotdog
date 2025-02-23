import './globals.css'
import { Inter } from 'next/font/google'
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
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
      <html lang="en" className="dark">
        <body className={`${inter.className} min-h-screen bg-[#0A0A0A] text-white antialiased`}>
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <main className="flex min-h-screen flex-col">
            {children}
            <ApiKeyConfig />
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}