'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

const SUPER_ADMIN_EMAIL = "va21070541@bachilleresdesonora.edu.mx"

export async function getManageableUsers() {
    const session = await auth()
    if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
        throw new Error("Unauthorized")
    }

    // Fetch all users to allow granting/revoking
    // In a real app, you might want pagination
    const users = await prisma.user.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isAdmin: true,
            permissions: true,
            lastActiveAt: true
        }
    })
    return users
}

export async function toggleAdminRole(userId: string, isAdmin: boolean) {
    const session = await auth()
    if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
        throw new Error("Unauthorized")
    }

    await prisma.user.update({
        where: { id: userId },
        data: { isAdmin }
    })
    revalidatePath("/admin/granting")
}

export async function updatePermissions(userId: string, permissions: string) {
    const session = await auth()
    if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
        throw new Error("Unauthorized")
    }

    await prisma.user.update({
        where: { id: userId },
        data: { permissions }
    })
    revalidatePath("/admin/granting")
}

export async function updateHeartbeat() {
    const session = await auth()
    if (!session?.user?.id) return

    await prisma.user.update({
        where: { id: session.user.id },
        data: { lastActiveAt: new Date() }
    })
}

export async function deleteUser(userId: string) {
    const session = await auth()
    if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
        throw new Error("Unauthorized")
    }

    if (userId === session.user.id) {
        throw new Error("Cannot delete your own account")
    }

    await prisma.user.delete({
        where: { id: userId }
    })
    revalidatePath("/admin/granting")
}
