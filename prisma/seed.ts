
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'va21070541@bachilleresdesonora.edu.mx'
    const password = await bcrypt.hash('admin123', 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password,
            isAdmin: true,
            permissions: 'manage_pizzerias,manage_reviews,manage_content'
        },
        create: {
            email,
            name: 'Super Admin',
            password,
            isAdmin: true,
            permissions: 'manage_pizzerias,manage_reviews,manage_content'
        }
    })

    console.log({ user })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
