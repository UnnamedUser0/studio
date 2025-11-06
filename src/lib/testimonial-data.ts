export type Testimonial = {
  id: string;
  author: string;
  role: string;
  avatarSeed: string;
  comment: string;
};

export const testimonials: Testimonial[] = [
  {
    id: 'test-1',
    author: 'Ana García',
    role: 'Amante de la Pizza',
    avatarSeed: 'anagarcia',
    comment: '¡PizzApp transformó mis viernes por la noche! Encontrar pizzerías nuevas cerca de mí es súper fácil con el mapa interactivo. ¡Totalmente recomendada!',
  },
  {
    id: 'test-2',
    author: 'Carlos Mendoza',
    role: 'Explorador Culinario',
    avatarSeed: 'carlosmendoza',
    comment: 'La función de búsqueda inteligente es asombrosa. Escribí "pepperoni orilla de queso" y me mostró exactamente las pizzerías que lo ofrecían. ¡Me ahorró mucho tiempo!',
  },
  {
    id: 'test-3',
    author: 'Sofía Romero',
    role: 'Estudiante',
    avatarSeed: 'sofiaromero',
    comment: 'Como estudiante, siempre busco las mejores ofertas. El ranking me ayuda a encontrar lugares buenos y con precios justos. ¡La app es muy intuitiva y rápida!',
  },
  {
    id: 'test-4',
    author: 'Javier Torres',
    role: 'Desarrollador Web',
    avatarSeed: 'javiertorres',
    comment: 'El diseño de la página es limpio y moderno, funciona de maravilla tanto en mi laptop como en el móvil. Se nota que pusieron atención al detalle. ¡Felicidades al equipo!',
  },
  {
    id: 'test-5',
    author: 'Laura Paredes',
    role: 'Diseñadora Gráfica',
    avatarSeed: 'lauraparedes',
    comment: 'Me encanta la interfaz. El modo oscuro es un alivio para la vista y la paleta de colores es muy agradable. Navegar por la app es una experiencia muy placentera.',
  },
  {
    id: 'test-6',
    author: 'Ricardo Rojas',
    role: 'Food Blogger',
    avatarSeed: 'ricardorojas',
    comment: 'Uso PizzApp para descubrir joyas ocultas en Hermosillo. Las reseñas de otros usuarios son honestas y me han guiado a lugares increíbles que no conocía.',
  },
];
