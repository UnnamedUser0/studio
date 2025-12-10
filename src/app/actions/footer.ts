'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// Footer Sections
export async function getFooterSections() {
    return await prisma.footerSection.findMany({
        include: {
            links: {
                orderBy: {
                    order: 'asc'
                }
            }
        },
        orderBy: {
            order: 'asc'
        }
    })
}

export async function createFooterSection(data: { title: string; order: number }) {
    const section = await prisma.footerSection.create({
        data
    })
    revalidatePath('/')
    return section
}

export async function updateFooterSection(id: string, data: { title?: string; order?: number }) {
    const section = await prisma.footerSection.update({
        where: { id },
        data
    })
    revalidatePath('/')
    return section
}

export async function deleteFooterSection(id: string) {
    const section = await prisma.footerSection.delete({
        where: { id }
    })
    revalidatePath('/')
    return section
}

// Footer Links
export async function createFooterLink(data: { label: string; href: string; sectionId: string; order: number }) {
    const link = await prisma.footerLink.create({
        data
    })
    revalidatePath('/')
    return link
}

export async function updateFooterLink(id: string, data: { label?: string; href?: string; order?: number }) {
    const link = await prisma.footerLink.update({
        where: { id },
        data
    })
    revalidatePath('/')
    return link
}

export async function deleteFooterLink(id: string) {
    const link = await prisma.footerLink.delete({
        where: { id }
    })
    revalidatePath('/')
    return link
}

// Social Links
export async function getSocialLinks() {
    return await prisma.socialLink.findMany({
        orderBy: {
            order: 'asc'
        }
    })
}

export async function createSocialLink(data: { platform: string; iconName: string; href: string; order: number }) {
    const link = await prisma.socialLink.create({
        data
    })
    revalidatePath('/')
    return link
}

export async function updateSocialLink(id: string, data: { platform?: string; iconName?: string; href?: string; order?: number }) {
    const link = await prisma.socialLink.update({
        where: { id },
        data
    })
    revalidatePath('/')
    return link
}

export async function deleteSocialLink(id: string) {
    const link = await prisma.socialLink.delete({
        where: { id }
    })
    revalidatePath('/')
    return link
}

export async function seedFooterDefaults() {
    // Check if data exists
    const count = await prisma.footerSection.count()
    if (count > 0) return

    // Create sections
    const quickLinks = await prisma.footerSection.create({
        data: {
            title: 'Enlaces Rápidos',
            order: 1,
            links: {
                create: [
                    { label: 'Inicio', href: '/', order: 1 },
                    { label: 'Buscar Pizzerías', href: '/search', order: 2 },
                    { label: 'Preguntas Frecuentes', href: '/faq', order: 3 },
                    { label: 'Centro de Ayuda', href: '/help', order: 4 },
                ]
            }
        }
    })

    const legal = await prisma.footerSection.create({
        data: {
            title: 'Legal',
            order: 2,
            links: {
                create: [
                    { label: 'Términos de Uso', href: '/terms', order: 1 },
                    { label: 'Política de Privacidad', href: '/privacy', order: 2 },
                ]
            }
        }
    })

    const contact = await prisma.footerSection.create({
        data: {
            title: 'Contacto',
            order: 3,
            links: {
                create: [
                    { label: 'Formulario de Contacto', href: '/contact', order: 1 },
                    { label: 'info@pizzapp.com', href: 'mailto:info@pizzapp.com', order: 2 },
                ]
            }
        }
    })

    // Social links
    await prisma.socialLink.createMany({
        data: [
            { platform: 'Facebook', iconName: 'Facebook', href: 'https://facebook.com', order: 1 },
            { platform: 'Instagram', iconName: 'Instagram', href: 'https://instagram.com', order: 2 },
            { platform: 'Twitter', iconName: 'Twitter', href: 'https://twitter.com', order: 3 },
        ]
    })

    revalidatePath('/')
}

export async function getFooterConfig() {
    return await prisma.footerConfig.findFirst()
}

export async function updateFooterConfig(copyrightText: string) {
    const config = await prisma.footerConfig.findFirst()
    if (config) {
        await prisma.footerConfig.update({
            where: { id: config.id },
            data: { copyrightText }
        })
    } else {
        await prisma.footerConfig.create({
            data: { copyrightText }
        })
    }
    revalidatePath('/')
}
