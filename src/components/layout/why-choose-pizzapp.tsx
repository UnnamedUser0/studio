import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Star, Route, UtensilsCrossed } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const features = [
    {
        icon: <MapPin className="h-8 w-8 text-primary" />,
        title: 'Localización Precisa',
        description: 'Encuentra pizzerías cercanas a tu ubicación exacta con nuestro mapa interactivo.',
    },
    {
        icon: <Star className="h-8 w-8 text-primary" />,
        title: 'Reseñas Verificadas',
        description: 'Opiniones reales de usuarios para que siempre elijas la mejor opción.',
    },
    {
        icon: <Route className="h-8 w-8 text-primary" />,
        title: 'Rutas Inteligentes',
        description: 'Obtén indicaciones directas a tu pizzería favorita con un solo clic.',
    },
    {
        icon: <UtensilsCrossed className="h-8 w-8 text-primary" />,
        title: 'Menús Actualizados',
        description: 'Consulta menús antes de ir para saber qué delicias te esperan.',
    }
]

export default function WhyChoosePizzapp() {
    return (
        <section id="why-choose-us" className="py-16 bg-background">
            <div className="container">
                <ScrollReveal>
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-headline font-bold">¿Por qué elegir PizzApp?</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Hacemos que encontrar tu próxima pizza sea fácil y emocionante.
                        </p>
                    </div>
                </ScrollReveal>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <ScrollReveal key={index} delay={index * 100} className="h-full">
                            <Card className="text-center shadow-lg rounded-xl flex flex-col bg-muted/30 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl h-full">
                                <CardHeader className="items-center">
                                    <div className="bg-primary/10 rounded-full p-4">
                                        {feature.icon}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col">
                                    <CardTitle className="font-headline text-2xl mb-2">{feature.title}</CardTitle>
                                    <p className="text-muted-foreground flex-grow">{feature.description}</p>
                                </CardContent>
                            </Card>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
