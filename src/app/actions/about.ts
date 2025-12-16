'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getAboutContent() {
    let content = await prisma.aboutContent.findFirst()

    // Create default content if it doesn't exist
    if (!content) {
        content = await prisma.aboutContent.create({
            data: {}
        })
    }

    return content
}

export async function updateAboutContent(data: {
    termsTitle?: string
    termsDescription?: string
    termsPoints?: string
    privacyTitle?: string
    privacyDescription?: string
    privacyPoints?: string
    appVersion?: string
    copyrightText?: string
}) {
    const existing = await prisma.aboutContent.findFirst()

    if (existing) {
        const updated = await prisma.aboutContent.update({
            where: { id: existing.id },
            data
        })
        revalidatePath('/')
        return updated
    } else {
        const created = await prisma.aboutContent.create({
            data
        })
        revalidatePath('/')
        return created
    }
}
