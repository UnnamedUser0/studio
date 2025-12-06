'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getManageableUsers } from '@/app/actions/admin'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Users, Circle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

const SUPER_ADMIN_EMAIL = "va21070541@bachilleresdesonora.edu.mx"

type OnlineUser = {
    id: string
    name: string | null
    email: string | null
    image: string | null
    lastActiveAt: Date | null
}

export function OnlineUsersIndicator() {
    const { data: session } = useSession()
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (session?.user?.email !== SUPER_ADMIN_EMAIL) return

        const fetchOnlineUsers = async () => {
            try {
                const users = await getManageableUsers()
                const now = new Date().getTime()
                const active = users.filter(u => {
                    if (!u.lastActiveAt) return false
                    const diff = now - new Date(u.lastActiveAt).getTime()
                    return diff < 1 * 60 * 1000 // 1 minute threshold
                })
                setOnlineUsers(active)
            } catch (error) {
                console.error("Failed to fetch online users", error)
            }
        }

        fetchOnlineUsers()
        const interval = setInterval(fetchOnlineUsers, 10000) // Check every 10 seconds

        return () => clearInterval(interval)
    }, [session])

    if (session?.user?.email !== SUPER_ADMIN_EMAIL) return null

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-primary hover:text-primary-foreground"
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <Users className="h-[1.2rem] w-[1.2rem]" />
                    {onlineUsers.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] text-white font-bold">
                            {onlineUsers.length}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-0"
                align="end"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                <div className="p-4 border-b">
                    <h4 className="font-headline font-semibold leading-none">Usuarios en línea</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        {onlineUsers.length} usuario{onlineUsers.length !== 1 && 's'} activo{onlineUsers.length !== 1 && 's'} ahora
                    </p>
                </div>
                <ScrollArea className="h-[300px]">
                    <div className="p-4 space-y-4">
                        {onlineUsers.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-4">
                                No hay usuarios activos en este momento.
                            </p>
                        ) : (
                            onlineUsers.map(user => (
                                <div key={user.id} className="flex items-center space-x-4">
                                    <div className="relative">
                                        <Avatar>
                                            <AvatarImage src={user.image || undefined} />
                                            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                                    </div>
                                    <div className="space-y-1 overflow-hidden">
                                        <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
