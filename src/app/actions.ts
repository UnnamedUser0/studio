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

export async function addPizzeria(data: { name: string, address: string, lat: number, lng: number, imageUrl?: string, category?: string, source?: string, phoneNumber?: string, website?: string, socialMedia?: string, schedule?: string, description?: string }) {
    const id = crypto.randomUUID()
    return await prisma.pizzeria.create({
        data: {
            id,
            name: data.name,
            address: data.address,
            lat: data.lat,
            lng: data.lng,
            imageUrl: data.imageUrl,
            phoneNumber: data.phoneNumber,
            website: data.website,
            socialMedia: data.socialMedia,
            schedule: data.schedule,
            description: data.description,
        } as any
    })
}

export async function updatePizzeria(id: string, data: { name: string, address: string, lat: number, lng: number, imageUrl?: string, category?: string, source?: string, phoneNumber?: string, website?: string, socialMedia?: string, schedule?: string, description?: string }) {
    return await prisma.pizzeria.upsert({
        where: { id },
        update: {
            name: data.name,
            address: data.address,
            lat: data.lat,
            lng: data.lng,
            imageUrl: data.imageUrl,
            phoneNumber: data.phoneNumber,
            website: data.website,
            socialMedia: data.socialMedia,
            schedule: data.schedule,
            description: data.description,
            // Preserve existing relationship/fields if any, but currently schema has none critical here other than items/reviews handled separately
        } as any,
        create: {
            id,
            name: data.name,
            address: data.address,
            lat: data.lat,
            lng: data.lng,
            imageUrl: data.imageUrl,
            phoneNumber: data.phoneNumber,
            website: data.website,
            socialMedia: data.socialMedia,
            schedule: data.schedule,
            description: data.description,
        } as any
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

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.password) {
        throw new Error('User not found or password not set')
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
        throw new Error('Contraseña actual incorrecta')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    return await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    })
}

export async function getLayoutSettings() {
    const setting = await prisma.globalSettings.findUnique({
        where: { key: 'layout_settings' }
    })
    const defaultSettings = {
        sheetWidth: 75,
        sheetWidthMobile: 100,
        cardScale: 1,
        cardScaleMobile: 1,
        buttonScale: 1,
        buttonLayout: 'grid',
        searchWidth: 50,
        searchWidthMobile: 90,
        searchHeight: 12,
        searchHeightMobile: 10,
        buttonsTop: 160,
        buttonsTopMobile: 160,
        buttonsRight: 16,
        buttonsRightMobile: 16,
        viewAllTop: 260,
        viewAllTopMobile: 260,
        viewAllRight: 16,
        viewAllRightMobile: 16,
        mapSettingsTop: 400,
        mapSettingsTopMobile: 400,
        mapSettingsRight: 16,
        mapSettingsRightMobile: 16,
        locateBtnTop: 160,
        locateBtnTopMobile: 160,
        locateBtnRight: 16,
        locateBtnRightMobile: 16,
        locateBtnScale: 1.0,
        locateBtnScaleMobile: 1.0,
        logoLeft: 16,
        logoLeftMobile: 16,
        logoTop: 0,
        logoTopMobile: 0,
        logoScale: 1.0,
        logoScaleMobile: 1.0,
        logoWidth: 120,
        logoWidthMobile: 120,
        chatbotWidth: 380,
        chatbotWidthMobile: 320,
        chatbotHeight: 500,
        chatbotHeightMobile: 450,
        chatbotScale: 1.0,
        chatbotScaleMobile: 1.0,
        headerActionsLeft: 0,
        headerActionsLeftMobile: 0,
        headerActionsTop: 0,
        headerActionsTopMobile: 0,
        headerActionsScale: 1.0,
        headerActionsScaleMobile: 1.0,
        headerActionsGap: 16,
        headerActionsGapMobile: 16,
        layerControlTop: 10,
        layerControlTopMobile: 10,
        popupWidth: 280,
        popupWidthMobile: 260,
        popupScale: 1,
        popupScaleMobile: 1,
        popupFontSize: 14,
        popupFontSizeMobile: 12,
        popupOffsetY: -35,
        popupOffsetYMobile: -35,
        mapHeight: 70,
        mapHeightMobile: 55,
        mapCenterOffset: 150,
        popupCenterOffset2D: 180,
        popupCenterOffset2DMobile: 150,
        popupCenterOffset3D: 250,
        popupCenterOffset3DMobile: 200,
        iconAnchorX: 25,
        iconAnchorY: 25,
        navInstructionTop: 16,
        navInstructionTopMobile: 16,
        navInstructionScale: 1.0,
        navInstructionScaleMobile: 1.0,
        navDashboardBottom: 0,
        navDashboardBottomMobile: 0,
        navDashboardScale: 1.0,
        navDashboardScaleMobile: 1.0,
        navStreetBottom: 112,
        navStreetBottomMobile: 112,
        navStreetScale: 1.0,
        navStreetScaleMobile: 1.0,
        navInstructionLeft: 0,
        navInstructionLeftMobile: 0,
        navDashboardLeft: 0,
        navDashboardLeftMobile: 0,
        navStreetLeft: 0,
        navStreetLeftMobile: 0,
        navInstructionWidth: 100,
        navInstructionWidthMobile: 100,
        navDashboardWidth: 100,
        navDashboardWidthMobile: 100,
        userMarkerScale: 1.0,
        userMarkerScaleMobile: 1.0,
        navSpeedBottom: 112,
        navSpeedBottomMobile: 112,
        navSpeedLeft: 0,
        navSpeedLeftMobile: 0,
        navSpeedScale: 1.0,
        navSpeedScaleMobile: 1.0,
        navInstructionFontSize: 24,
        navInstructionFontSizeMobile: 18,
        navDashboardFontSize: 30,
        navDashboardFontSizeMobile: 22,
        navNextLeft: 0,
        navNextLeftMobile: 0,
        navNextTop: 0,
        navNextTopMobile: 0,
        navNextScale: 1.0,
        navNextScaleMobile: 1.0,
        navNextWidth: 100,
        navNextWidthMobile: 100,
        navNextFontSize: 14,
        navNextFontSizeMobile: 14
    }
    if (!setting) return defaultSettings;
    try {
        const parsed = JSON.parse(setting.value);
        return { ...defaultSettings, ...parsed };
    } catch (e) {
        return defaultSettings;
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
    console.log("[Server Action] uploadAvatar called (Base64 Mode)");
    try {
        const file = formData.get('file');
        if (!file) {
            throw new Error('No file uploaded or file is empty');
        }

        // Check if file is a string (e.g. if form submitted empty)
        if (typeof file === 'string') {
            throw new Error('Uploaded content is a string, not a file');
        }

        const fileObj = file as File;

        // Check if it's a file/blob and get its buffer
        let buffer: Buffer;
        if (typeof fileObj.arrayBuffer === 'function') {
            const bytes = await fileObj.arrayBuffer();
            buffer = Buffer.from(bytes);
        } else if (typeof (fileObj as any).stream === 'function') {
            // Fallback for older environments/streams
            const chunks = [];
            for await (const chunk of (fileObj as any).stream()) {
                chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
        } else {
            throw new Error('Unsupported file object type: cannot read bytes');
        }

        const base64 = buffer.toString('base64');
        const mimeType = fileObj.type || 'image/jpeg';
        
        console.log(`[Server Action] File successfully converted to Base64 (mime: ${mimeType}, length: ${base64.length})`);
        return `data:${mimeType};base64,${base64}`;
    } catch (err: any) {
        console.error("[Server Action] Error in uploadAvatar:", err);
        throw new Error(err.message || 'Error al procesar la imagen en el servidor');
    }
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
