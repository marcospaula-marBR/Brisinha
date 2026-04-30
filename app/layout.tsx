import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brisinha — Cultura Mar Brasil',
  description: 'Conheça a cultura da Mar Brasil com o Brisinha, seu assistente pessoal.',
  applicationName: 'Brisinha',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Brisinha',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: 'Brisinha — Cultura Mar Brasil',
    description: 'Conheça a cultura da Mar Brasil com o Brisinha.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0066cc',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
