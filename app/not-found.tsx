'use client'

export default function NotFound() {
  return (
    <div style={{ height: '100%', background: '#08070F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '32px', textAlign: 'center' }}>
      <div style={{ width: 76, height: 76, borderRadius: '24px', background: 'linear-gradient(135deg,#6D28D9,#0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', marginBottom: '28px', boxShadow: '0 20px 60px rgba(109,40,217,0.4)' }}>✦</div>
      <div style={{ fontSize: '72px', fontWeight: '900', color: '#6D28D9', marginBottom: '8px', letterSpacing: '-4px' }}>404</div>
      <div style={{ fontSize: '22px', fontWeight: '900', color: '#F0EEFF', marginBottom: '10px', letterSpacing: '-0.5px' }}>Page introuvable</div>
      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '36px', lineHeight: 1.6 }}>
        Cette page n'existe pas ou a été déplacée.
      </div>
      <button onClick={() => window.location.href = '/home'}
        style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#6D28D9,#0891B2)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px', width: '100%', maxWidth: '300px' }}>
        Retour à l'accueil
      </button>
      <button onClick={() => window.location.href = '/'}
        style={{ padding: '14px 32px', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', width: '100%', maxWidth: '300px' }}>
        Se connecter
      </button>
    </div>
  )
}