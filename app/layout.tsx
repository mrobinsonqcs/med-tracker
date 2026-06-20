import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Med Tracker',
  description: 'Medication reminders and peptide dosing calculator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <div className="max-w-lg mx-auto pb-24 px-4">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
