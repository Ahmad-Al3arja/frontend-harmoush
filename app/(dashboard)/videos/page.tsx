'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VideosPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/videos/advertisement')
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
} 