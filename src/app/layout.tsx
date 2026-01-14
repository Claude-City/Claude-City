import type { Metadata, Viewport } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { getLocale } from "gt-next/server";
import { GTProvider } from "gt-next";

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900']
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  metadataBase: new URL('https://claude-city.com'),
  title: {
    default: 'Claude City — AI Governor Simulation',
    template: 'Claude City — %s',
  },
  description: 'Watch an AI build a city from scratch. Claude City is an autonomous city-building simulation where Claude (AI) acts as the governor, making all decisions about zoning, building, taxes, and resource allocation.',
  openGraph: {
    title: 'Claude City — AI Governor Simulation',
    description: 'Watch an AI build a city from scratch. Claude autonomously governs the city while you spectate.',
    type: 'website',
    siteName: 'Claude City',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1179,
        height: 1406,
        type: 'image/png',
        alt: 'Claude City - AI governed city simulation'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Claude City'
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f1219'
};

export default async function RootLayout({ children }: {children: React.ReactNode;}) {
  return (
  <html className={`dark ${playfair.variable} ${dmSans.variable}`} lang={await getLocale()}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon.png" />
        {/* Preload critical game assets - WebP for browsers that support it */}
        <link
        rel="preload"
        href="/assets/sprites_red_water_new.webp"
        as="image"
        type="image/webp" />

        <link
        rel="preload"
        href="/assets/water.webp"
        as="image"
        type="image/webp" />

      </head>
      <body className="bg-background text-foreground antialiased font-sans overflow-hidden"><GTProvider>{children}<Analytics /></GTProvider></body>
    </html>
  );
}