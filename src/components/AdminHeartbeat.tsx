'use client'

import { useEffect } from 'react'
import { updateHeartbeat } from '@/app/actions/admin'
import { useSession } from 'next-auth/react'

export function AdminHeartbeat() {
    const { data: session } = useSession()

    useEffect(() => {
        if (!session?.user) return

        // Update immediately
        updateHeartbeat()

        // Update every 30 seconds
        const interval = setInterval(() => {
            updateHeartbeat()
        }, 30000)

        return () => clearInterval(interval)
    }, [session])

    return null
}
