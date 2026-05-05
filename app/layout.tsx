import type { Metadata } from 'next'
import './globals.css'
import { ModeProvider } from './context/ModeContext'

export const metadata: Metadata = {
  title: 'Projet X — Le Tinder de l\'entrepreneuriat',
  description: 'Mets en relation talents, porteurs de projets et investisseurs. Swipe, matche et collabore.',
  manifest: '/manifest.json',
  themeColor: '#6D28D9',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Projet X',
  },
  openGraph: {
    title: 'Projet X',
    description: 'Le Tinder de l\'entrepreneuriat',
    url: 'https://projet-x-liart.vercel.app',
    siteName: 'Projet X',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#08070F' }}>
        <ModeProvider>
          <div style={{
            width: '100%',
            maxWidth: '430px',
            height: '100svh',
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden',
            background: '#08070F',
          }}>
            {children}
          </div>
        </ModeProvider>
      </body>
    </html>
  )
}