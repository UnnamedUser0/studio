
export type Review = {
  id: string;
  author: string;
  userId: string;
  pizzeriaId: string;
  rating: number;
  comment: string;
  createdAt: string;
  avatarUrl?: string;
  reply?: {
    text: string;
    repliedAt: string;
  };
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
  reviewCount?: number;
};

export type Testimonial = {
  id: string;
  author: string;
  email?: string;
  role: string;
  comment: string;
  createdAt: string;
  avatarUrl?: string;
  reply?: {
    text: string;
    repliedAt: string;
  };
};

export type User = {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
}
