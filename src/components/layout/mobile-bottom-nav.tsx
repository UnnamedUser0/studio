'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HelpCircle, LifeBuoy, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Inicio', href: '/', icon: Home },
        { name: 'FAQ', href: '/faq', icon: HelpCircle },
        { name: 'Ayuda', href: '/help', icon: LifeBuoy },
        { name: 'Contacto', href: '/contact', icon: Mail },
    ];

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full bg-background/80 backdrop-blur-md border-t border-border md:hidden shadow-lg">
            <nav className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-all duration-300",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "p-1 rounded-xl transition-all duration-300",
                                isActive ? "bg-primary/10" : "bg-transparent"
                            )}>
                                <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                            </div>
                            <span className="mt-1">{item.name}</span>
                            {isActive && (
                                <span className="absolute top-0 w-12 h-1 bg-primary rounded-b-full shadow-[0_0_8px_hsl(var(--primary))]" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
