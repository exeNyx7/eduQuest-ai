"use client";

import '../globals.css'
import { ReactNode } from 'react'
import { Fredoka } from 'next/font/google'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GameProvider } from '@/contexts/GameContext'

const fredoka = Fredoka({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fredoka.className} min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800`}>
        <ErrorBoundary>
          <GameProvider>
            {children}
          </GameProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
