'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

export async function getFeatures() {
    try {
        const features = await prisma.featureCard.findMany({
            orderBy: { order: 'asc' }
        });
        return features;
    } catch (error) {
        console.error("Error fetching features:", error);
        return [];
    }
}

export async function createFeature(data: { title: string; description: string; iconName: string }) {
    const session = await auth();
    // @ts-ignore
    if (!session?.user?.isAdmin) {
        throw new Error('Unauthorized');
    }

    await prisma.featureCard.create({
        data
    });
    revalidatePath('/');
}

export async function updateFeature(id: string, data: { title: string; description: string; iconName: string }) {
    const session = await auth();
    // @ts-ignore
    if (!session?.user?.isAdmin) {
        throw new Error('Unauthorized');
    }

    await prisma.featureCard.update({
        where: { id },
        data
    });
    revalidatePath('/');
}

export async function deleteFeature(id: string) {
    const session = await auth();
    // @ts-ignore
    if (!session?.user?.isAdmin) {
        throw new Error('Unauthorized');
    }

    await prisma.featureCard.delete({
        where: { id }
    });
    revalidatePath('/');
}
