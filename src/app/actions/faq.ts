'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getFaqCategories() {
    return await prisma.faqCategory.findMany({
        include: {
            questions: {
                orderBy: { order: 'asc' },
            },
        },
        orderBy: { order: 'asc' },
    });
}

export async function createFaqCategory(data: { title: string; iconName: string }) {
    await prisma.faqCategory.create({
        data,
    });
    revalidatePath('/faq');
}

export async function updateFaqCategory(id: string, data: { title: string; iconName: string }) {
    await prisma.faqCategory.update({
        where: { id },
        data,
    });
    revalidatePath('/faq');
}

export async function deleteFaqCategory(id: string) {
    await prisma.faqCategory.delete({
        where: { id },
    });
    revalidatePath('/faq');
}

export async function createFaqQuestion(data: { question: string; answer: string; categoryId: string }) {
    await prisma.faqQuestion.create({
        data,
    });
    revalidatePath('/faq');
}

export async function updateFaqQuestion(id: string, data: { question: string; answer: string }) {
    await prisma.faqQuestion.update({
        where: { id },
        data,
    });
    revalidatePath('/faq');
}

export async function deleteFaqQuestion(id: string) {
    await prisma.faqQuestion.delete({
        where: { id },
    });
    revalidatePath('/faq');
}
