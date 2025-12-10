'use client'

import { Button } from '@/components/ui/button'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div className="flex h-screen flex-col items-center justify-center gap-4">
                    <h2 className="text-2xl font-bold">¡Algo salió mal!</h2>
                    <p className="text-muted-foreground">{error.message || "Ha ocurrido un error crítico."}</p>
                    <Button onClick={() => reset()}>Intentar de nuevo</Button>
                </div>
            </body>
        </html>
    )
}
