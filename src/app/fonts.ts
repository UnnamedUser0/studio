import { PT_Sans, Playfair_Display } from 'next/font/google';

export const fontBody = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
});

export const fontHeadline = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-headline',
});
