import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter, Lobster } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/src/app/components/theme/theme-provider'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-lobster',
})

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Vibeely',
  description: 'Vibeely',
  icons: {
    icon: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lobster.variable}`} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
