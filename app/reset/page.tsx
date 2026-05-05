'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ResetPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const bg = '#08070F'
  const cardBorder = 'rgba(255,255,255,0.07)'
  const surface = '#1A1828'
  const text = '#F0EEFF'
  const muted = 'rgba(255,255,255,0.4)'

  async function handleReset() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://projet-x-liart.vercel.app/update-password',
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    }
    setLoading(false)
  }

  return (
    <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '32px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <button onClick={() => window.location.href = '/'}
          style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        {!sent ? (
          <>
            <div style={{ fontSize: '28px', fontWeight: '900', color: text, marginBottom: '8px', letterSpacing: '-0.5px' }}>Mot de passe oublié ?</div>
            <div style={{ fontSize: '14px', color: muted, marginBottom: '32px', lineHeight: 1.6 }}>On t'envoie un lien de réinitialisation par email.</div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', fontSize: '13px', color: '#F87171', marginBottom: '16px' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</div>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com"
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                style={{ width: '100%', padding: '14px 16px', background: surface, border: `1.5px solid ${cardBorder}`, borderRadius: '14px', color: text, fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#6D28D9')}
                onBlur={e => (e.currentTarget.style.borderColor = cardBorder)}
              />
            </div>

            <button onClick={handleReset} disabled={loading || !email.trim()}
              style={{ width: '100%', padding: '16px', background: email.trim() && !loading ? 'linear-gradient(135deg,#6D28D9,#0891B2)' : surface, border: 'none', borderRadius: '14px', color: email.trim() && !loading ? 'white' : muted, fontSize: '15px', fontWeight: '800', cursor: email.trim() && !loading ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              {loading ? '⏳ Envoi...' : 'Envoyer le lien →'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>📧</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: text, marginBottom: '8px' }}>Email envoyé !</div>
            <div style={{ fontSize: '14px', color: muted, marginBottom: '8px', lineHeight: 1.6 }}>Vérifie ta boîte mail à</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#A78BFA', marginBottom: '32px' }}>{email}</div>
            <button onClick={() => window.location.href = '/'}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#6D28D9,#0891B2)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  )
}