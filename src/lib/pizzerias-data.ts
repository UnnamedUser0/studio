
import { Pizzeria } from './types';

export const pizzeriasData: Omit<Pizzeria, 'rating' | 'imageUrl' | 'imageHint' | 'reviews'>[] = [
  // --- OpenStreetMap Data ---
  {
    "id": "osm-25256253",
    "name": "Pizza Hut",
    "address": "Blvd. Luis Encinas J. 556, El Torreon, 83204 Hermosillo, Son., Mexico",
    "lat": 29.0837,
    "lng": -110.965,
    "category": "Pizza",
    "source": "OpenStreetMap"
  },
  {
    "id": "osm-25256262",
    "name": "Little Caesars Pizza",
    "address": "Blvd. Solidaridad 91, Pilares, 83118 Hermosillo, Son., Mexico",
    "lat": 29.1105,
    "lng": -111.002,
    "category": "Pizza",
    "source": "OpenStreetMap"
  },
  {
    "id": "osm-25256265",
    "name": "Dominos Pizza",
    "address": "Blvd. Solidaridad 100, Raquet Club, 83200 Hermosillo, Son., Mexico",
    "lat": 29.1026,
    "lng": -110.957,
    "category": "Pizza",
    "source": "OpenStreetMap"
  },
  {
    "id": "osm-4467008886",
    "name": "Pizzas en leña media luna",
    "address": "Retorno 10, Bugambilias, 83140 Hermosillo, Son., Mexico",
    "lat": 29.1333,
    "lng": -110.985,
    "category": "Pizza",
    "source": "OpenStreetMap"
  },
  {
    "id": "osm-6418306087",
    "name": "Pizzería La Cobacha",
    "address": "Blvd. Francisco Serna, Las Palmas, 83270 Hermosillo, Son., Mexico",
    "lat": 29.0911,
    "lng": -110.963,
    "category": "Pizza",
    "source": "OpenStreetMap"
  },
  {
    "id": "osm-6418306088",
    "name": "Pizzas y alitas",
    "address": "Blvd. Abelardo L. Rodríguez 2, Centro, 83000 Hermosillo, Son., Mexico",
    "lat": 29.0763,
    "lng": -110.96,
    "category": "Pizza",
    "source": "OpenStreetMap"
  },
  {
    "id": "osm-6418306093",
    "name": "Mozzarella Pizza",
    "address": "Guadalupe Victoria 11, 5 de Mayo, 83000 Hermosillo, Son., Mexico",
    "lat": 29.0805,
    "lng": -110.95,
    "category": "Pizza",
    "source": "OpenStreetMap"
  },
  {
    "id": "osm-6418306094",
    "name": "Pizza Delis",
    "address": "Av. de la Cultura, Proyecto Rio Sonora Hermosillo XXI, 83270 Hermosillo, Son., Mexico",
    "lat": 29.0898,
    "lng": -110.94,
    "category": "Pizza",
    "source": "OpenStreetMap"
  },
  {
    "id": "osm-6644026514",
    "name": "Express Pizza",
    "address": "Calle Gral. Piña 10, Periodista, 83150 Hermosillo, Son., Mexico",
    "lat": 29.1039,
    "lng": -110.969,
    "category": "Pizza",
    "source": "OpenStreetMap"
  },
  {
    "id": "osm-7711466031",
    "name": "Sargento Pimienta",
    "address": "Blvd. Navarrete 26, Valle Verde, 83200 Hermosillo, Son., Mexico",
    "lat": 29.0864,
    "lng": -110.998,
    "category": "Pizza",
    "source": "OpenStreetMap"
  },
  // --- HERE WeGo Data (Unique Entries) ---
  {
    "id": "here-830u0p2y-29b3506190a6493ca86e0c6a282f1437",
    "name": "Roy's Pizza",
    "address": "Av Nayarit 106, San Benito, 83190 Hermosillo, Son., Mexico",
    "lat": 29.0827,
    "lng": -110.969,
    "category": "Pizza",
    "source": "HERE WeGo"
  },
  {
    "id": "here-830u0p2y-3f7495944b0542389d41d13f56e01a5f",
    "name": "La Nona Pizza & Pasta",
    "address": "Blvd. Morelos 701, Santa Fe, 83150 Hermosillo, Son., Mexico",
    "lat": 29.1121,
    "lng": -110.957,
    "category": "Pizza",
    "source": "HERE WeGo"
  },
  {
    "id": "here-830u0p2y-7977a421295b45289945037d04f5539c",
    "name": "Gino's Pizza",
    "address": "Blvd. Solidaridad 56, Sahuaro, 83170 Hermosillo, Son., Mexico",
    "lat": 29.1009,
    "lng": -111.002,
    "category": "Pizza",
    "source": "HERE WeGo"
  },
  {
    "id": "here-830u0p2y-808b8b5435a242f2b347b5938d2f5a60",
    "name": "Papa John's Pizza",
    "address": "Blvd. Colosio 410, Santa Fe, 83249 Hermosillo, Son., Mexico",
    "lat": 29.0825,
    "lng": -111.007,
    "category": "Pizza",
    "source": "HERE WeGo"
  },
  {
    "id": "here-830u0p2x-ccfcd090b8f00f269a84a6c6a4dca671",
    "name": "Pizzería del Oeste",
    "address": "Blvd. de los Ganaderos, Parque Industrial, 83297 Hermosillo, Son., Mexico",
    "lat": 29.0267,
    "lng": -110.961,
    "category": "Pizza",
    "source": "HERE WeGo"
  },
  {
    "id": "here-830cp1px-21ca588a44b744a49c4ad3026e6d194c",
    "name": "Rin-Tin-Tin Pizza",
    "address": "Calle de la Reforma 201, Balderrama, 83180 Hermosillo, Son., Mexico",
    "lat": 29.1001,
    "lng": -110.962,
    "category": "Pizza",
    "source": "HERE WeGo"
  },
  {
    "id": "here-830u0p2y-29c36142c6c04f9888998d360f089601",
    "name": "Yarda's Pizza",
    "address": "Paseo de las Quintas 132, La Encantada, 83224 Hermosillo, Son., Mexico",
    "lat": 29.0664,
    "lng": -111.02,
    "category": "Pizza",
    "source": "HERE WeGo"
  },
  {
    "id": "here-830u0p2y-8f7a84594c7348e3a2468b1a8d052a23",
    "name": "Pizza Time",
    "address": "Blvd. Progreso 314, Lomas de Madrid, 83106 Hermosillo, Son., Mexico",
    "lat": 29.1311,
    "lng": -110.963,
    "category": "Pizza",
    "source": "HERE WeGo"
  },
  {
    "id": "here-830u0p2y-0d4e3215286241b38f828a2a53de5a89",
    "name": "Anthony's Pizza",
    "address": "Blvd. José María Morelos 31, Pitic, 83150 Hermosillo, Son., Mexico",
    "lat": 29.0963,
    "lng": -110.957,
    "category": "Pizza",
    "source": "HERE WeGo"
  },
  {
    "id": "here-830u0p2y-f481232810a9446d8412b186b5104d49",
    "name": "Boston's Pizza",
    "address": "Blvd. Colosio 82, Prados del Centenario, 83260 Hermosillo, Son., Mexico",
    "lat": 29.083,
    "lng": -110.978,
    "category": "Pizza",
    "source": "HERE WeGo"
  }
];
