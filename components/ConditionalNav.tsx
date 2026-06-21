'use client'

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'

const AUTH_PATHS = ['/login', '/register']

export default function ConditionalNav() {
  const pathname = usePathname()
  if (AUTH_PATHS.includes(pathname)) return null
  return <BottomNav />
}
