import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wortschatz — A1 German Vocabulary',
  description: 'Learn German A1 vocabulary with mnemonics and spaced practice',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
