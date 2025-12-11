'use server'

import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { pizzeriasData } from "@/lib/pizzerias-data"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function registerUser(email: string, password: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
        throw new Error("User already exists")
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    return await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
        }
    })
}

export async function getReviews(pizzeriaId: string) {
    return await prisma.review.findMany({
        where: { pizzeriaId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, image: true } } }
    })
}

export async function getAllPizzerias() {
    const pizzerias = await prisma.pizzeria.findMany({
        orderBy: { name: 'asc' },
        include: {
            reviews: {
                select: { rating: true }
            },
            _count: {
                select: { reviews: true }
            }
        }
    })

    return pizzerias.map(p => {
        const avgRating = p.reviews.length > 0
            ? p.reviews.reduce((a, b) => a + b.rating, 0) / p.reviews.length
            : 0

        const { reviews, _count, ...rest } = p
        return {
            ...rest,
            rating: avgRating,
            reviewCount: _count.reviews
        }
    })
}

export async function addPizzeria(data: { name: string, address: string, lat: number, lng: number, imageUrl?: string, category?: string, source?: string }) {
    const id = crypto.randomUUID()
    return await prisma.pizzeria.create({
        data: {
            id,
            name: data.name,
            address: data.address,
            lat: data.lat,
            lng: data.lng,
            imageUrl: data.imageUrl,
        }
    })
}

export async function updatePizzeria(id: string, data: { name: string, address: string, lat: number, lng: number, imageUrl?: string, category?: string, source?: string }) {
    return await prisma.pizzeria.update({
        where: { id },
        data: {
            name: data.name,
            address: data.address,
            lat: data.lat,
            lng: data.lng,
            imageUrl: data.imageUrl,
        }
    })
}

export async function addReview(pizzeriaId: string, rating: number, comment: string, userId: string) {
    // Ensure pizzeria exists
    const pizzeria = await prisma.pizzeria.findUnique({ where: { id: pizzeriaId } })
    if (!pizzeria) {
        const data = pizzeriasData.find(p => p.id === pizzeriaId)
        if (data) {
            await prisma.pizzeria.create({
                data: {
                    id: data.id,
                    name: data.name,
                    address: data.address,
                    lat: data.lat,
                    lng: data.lng,
                    imageUrl: null, // or data.imageUrl if available
                }
            })
        } else {
            // Fallback if not in data (should not happen)
            // Or throw error
        }
    }

    return await prisma.review.create({
        data: {
            rating,
            comment,
            userId,
            pizzeriaId
        }
    })
}

export async function getTestimonials() {
    const testimonials = await prisma.testimonial.findMany({
        orderBy: { createdAt: 'desc' }
    })

    // Fetch users for these emails to get live avatar
    const emails = testimonials.map(t => t.email).filter((e): e is string => !!e)
    const users = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { email: true, image: true }
    })

    return testimonials.map(t => {
        const user = users.find(u => u.email === t.email)
        return {
            ...t,
            avatarUrl: user?.image || t.avatarUrl
        }
    })
}

export async function getRankingSettings() {
    const setting = await prisma.globalSettings.findUnique({
        where: { key: 'ranking' }
    })
    if (!setting) return null
    try {
        return JSON.parse(setting.value) as { pizzeriaIds: string[] }
    } catch (e) {
        return null
    }
}

export async function getUserProfile(userId: string) {
    return await prisma.user.findUnique({
        where: { id: userId }
    })
}

export async function deleteTestimonial(id: number) {
    return await prisma.testimonial.delete({
        where: { id }
    })
}

export async function replyTestimonial(id: number, text: string) {
    return await prisma.testimonial.update({
        where: { id },
        data: {
            replyText: text,
            repliedAt: new Date()
        }
    })
}

export async function updateRankingSettings(pizzeriaIds: string[]) {
    return await prisma.globalSettings.upsert({
        where: { key: 'ranking' },
        update: { value: JSON.stringify({ pizzeriaIds }) },
        create: { key: 'ranking', value: JSON.stringify({ pizzeriaIds }) }
    })
}

export async function deleteReview(id: number) {
    return await prisma.review.delete({
        where: { id }
    })
}

export async function replyReview(id: number, text: string) {
    return await prisma.review.update({
        where: { id },
        data: {
            replyText: text,
            repliedAt: new Date()
        }
    })
}

export async function deletePizzeria(id: string) {
    return await prisma.pizzeria.delete({
        where: { id }
    })
}

export async function updateUserAvatar(userId: string, imageUrl: string) {
    return await prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl }
    })
}

export async function updateUserProfile(userId: string, name: string, imageUrl?: string) {
    return await prisma.user.update({
        where: { id: userId },
        data: {
            name,
            ...(imageUrl ? { image: imageUrl } : {})
        }
    })
}

export async function deleteUserAccount(userId: string) {
    return await prisma.user.delete({
        where: { id: userId }
    })
}

export async function getLayoutSettings() {
    const setting = await prisma.globalSettings.findUnique({
        where: { key: 'layout_settings' }
    })
    if (!setting) return {
        sheetWidth: 75, // vw
        cardScale: 1,
        buttonScale: 1,
        buttonLayout: 'grid' // 'grid' | 'stack'
    }
    try {
        return JSON.parse(setting.value)
    } catch (e) {
        return {
            sheetWidth: 75,
            cardScale: 1,
            buttonScale: 1,
            buttonLayout: 'grid'
        }
    }
}

export async function updateLayoutSettings(settings: any) {
    return await prisma.globalSettings.upsert({
        where: { key: 'layout_settings' },
        update: { value: JSON.stringify(settings) },
        create: { key: 'layout_settings', value: JSON.stringify(settings) }
    })
}

export async function uploadAvatar(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) {
        throw new Error('No file uploaded')
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const fileName = `${Date.now()}-${file.name}`
    const filePath = join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    return `/uploads/${fileName}`
}

export async function addTestimonial(data: { name: string, email?: string, comment: string, role?: string, avatarUrl?: string }) {
    return await prisma.testimonial.create({
        data: {
            name: data.name,
            email: data.email,
            content: data.comment,
            role: data.role,
            avatarUrl: data.avatarUrl
        }
    })
}

export async function getRankingStyles() {
    const setting = await prisma.globalSettings.findUnique({
        where: { key: 'ranking_styles' }
    })
    if (!setting) return null
    try {
        return JSON.parse(setting.value)
    } catch (e) {
        return null
    }
}

export async function updateRankingStyles(styles: any) {
    return await prisma.globalSettings.upsert({
        where: { key: 'ranking_styles' },
        update: { value: JSON.stringify(styles) },
        create: { key: 'ranking_styles', value: JSON.stringify(styles) }
    })
}
