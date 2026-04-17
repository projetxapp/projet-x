import type { Metadata } from 'next'
import './globals.css'
import { ModeProvider } from './context/ModeContext'

export const metadata: Metadata = {
  title: 'Projet X',
  description: 'Matching Talents & Startups',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: '#08070F', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <ModeProvider>
          <div style={{ width: '390px', height: '844px', background: '#0D0C18', borderRadius: '44px', overflow: 'hidden', position: 'relative', boxShadow: '0 0 0 10px #1a1a1a, 0 0 0 12px #2a2a2a, 0 40px 80px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 30, background: '#08070F', borderRadius: '0 0 20px 20px', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #333' }}/>
              <div style={{ width: 60, height: 8, borderRadius: 4, background: '#1a1a1a' }}/>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {children}
            </div>
          </div>
        </ModeProvider>
      </body>
    </html>
  )
}