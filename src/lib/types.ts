
export type Review = {
  id: string;
  author: string;
  userId: string;
  pizzeriaId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Pizzeria = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  category: string;
  source: string;
  reviews?: Review[];
  imageUrl?: string;
  imageHint?: string;
};

export type Testimonial = {
  id: string;
  author: string;
  email?: string;
  role: string;
  comment: string;
  createdAt: string;
};
