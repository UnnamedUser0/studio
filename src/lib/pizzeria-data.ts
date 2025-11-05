import { PlaceHolderImages } from './placeholder-images';

export type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
};

export type Pizzeria = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: Review[];
  imageUrl: string;
  imageHint: string;
};

const findImage = (id: string) => {
    const img = PlaceHolderImages.find(p => p.id === id);
    if (!img) return { url: 'https://picsum.photos/seed/default/400/400', hint: 'pizza' };
    return { url: img.imageUrl, hint: img.imageHint };
}

export const pizzerias: Pizzeria[] = [
  {
    id: 'pizzeria-01',
    name: 'Pizza del ORO',
    address: 'Blvd. Solidaridad 101, Hermosillo',
    lat: 29.1035,
    lng: -110.976,
    rating: 4.8,
    imageUrl: findImage('pizzeria-1').url,
    imageHint: findImage('pizzeria-1').hint,
    reviews: [
      { id: 'r1-1', author: 'Carlos V.', rating: 5, comment: 'La mejor pizza de la ciudad, sin duda. La masa es perfecta.' },
      { id: 'r1-2', author: 'Ana G.', rating: 4, comment: 'Muy ricas, aunque a veces tardan un poco en entregar.' },
    ],
  },
  {
    id: 'pizzeria-02',
    name: 'Rin Rin Pizza',
    address: 'Blvd. Luis Encinas J 58, Hermosillo',
    lat: 29.0742,
    lng: -110.957,
    rating: 4.5,
    imageUrl: findImage('pizzeria-2').url,
    imageHint: findImage('pizzeria-2').hint,
    reviews: [
      { id: 'r2-1', author: 'Javier M.', rating: 5, comment: 'Un clásico de Hermosillo. La pizza de pepperoni es icónica.' },
      { id: 'r2-2', author: 'Sofia L.', rating: 4, comment: 'Buena pizza, el lugar es un poco antiguo pero tiene su encanto.' },
    ],
  },
  {
    id: 'pizzeria-03',
    name: 'Pizzas en Leña La Nona',
    address: 'Blvd. Morelos 702, Hermosillo',
    lat: 29.1028,
    lng: -110.952,
    rating: 4.7,
    imageUrl: findImage('pizzeria-4').url,
    imageHint: findImage('pizzeria-4').hint,
    reviews: [
      { id: 'r3-1', author: 'Laura P.', rating: 5, comment: 'El sabor de la leña es inigualable. Ingredientes frescos y de calidad.' },
      { id: 'r3-2', author: 'Ricardo E.', rating: 4, comment: 'Excelentes pizzas gourmet, el precio es un poco elevado pero vale la pena.' },
    ],
  },
  {
    id: 'pizzeria-04',
    name: 'Pizzeria La Marseillaise',
    address: 'Blvd. Navarrete 123, Hermosillo',
    lat: 29.088,
    lng: -110.98,
    rating: 4.6,
    imageUrl: findImage('pizzeria-3').url,
    imageHint: findImage('pizzeria-3').hint,
    reviews: [
        { id: 'r4-1', author: 'Elena R.', rating: 5, comment: 'Un ambiente muy agradable y las pizzas son una delicia. La de 4 quesos es mi favorita.' },
        { id: 'r4-2', author: 'Pedro S.', rating: 4, comment: 'Muy buena opción para una cena tranquila. El servicio es atento.' },
    ],
  },
  {
    id: 'pizzeria-05',
    name: 'Pizzaly',
    address: 'Blvd. Colosio 99, Hermosillo',
    lat: 29.082,
    lng: -111.005,
    rating: 4.4,
    imageUrl: findImage('pizzeria-5').url,
    imageHint: findImage('pizzeria-5').hint,
    reviews: [
        { id: 'r5-1', author: 'Fernanda C.', rating: 5, comment: 'Las pizzas por rebanada son enormes y deliciosas. Ideal para algo rápido.' },
        { id: 'r5-2', author: 'Miguel A.', rating: 4, comment: 'Buena relación calidad-precio. Las especialidades son interesantes.' },
    ],
  },
  {
    id: 'pizzeria-06',
    name: 'Little Caesars Pizza',
    address: 'Perif. Pte. 21, Hermosillo',
    lat: 29.06,
    lng: -111.011,
    rating: 3.9,
    imageUrl: findImage('pizzeria-6').url,
    imageHint: findImage('pizzeria-6').hint,
    reviews: [
        { id: 'r6-1', author: 'David B.', rating: 4, comment: 'Hot-N-Ready nunca falla para sacar de un apuro. Rápido y económico.' },
        { id: 'r6-2', author: 'Valeria J.', rating: 3, comment: 'Es lo que esperas, una pizza decente y rápida. Nada espectacular.' },
    ],
  },
];
