import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GrantingClient } from "./client"
import { getManageableUsers } from "@/app/actions/admin"

const SUPER_ADMIN_EMAIL = "va21070541@bachilleresdesonora.edu.mx"

export default async function GrantingPage() {
    const session = await auth()
    if (session?.user?.email !== SUPER_ADMIN_EMAIL) {
        redirect("/")
    }

    const initialUsers = await getManageableUsers()

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Otorgamiento y Eliminación</h1>
            <GrantingClient initialUsers={initialUsers} />
        </div>
    )
}
