'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const bg = '#08070F'
  const cardBorder = 'rgba(255,255,255,0.07)'
  const surface = '#1A1828'
  const text = '#F0EEFF'
  const muted = 'rgba(255,255,255,0.4)'

  useEffect(() => {
    // Supabase gère automatiquement la session depuis le lien email
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Session établie, prêt à changer le mot de passe
      }
    })
  }, [])

  async function handleUpdate() {
    if (password.length < 8) { setError('Minimum 8 caractères'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => window.location.href = '/home', 2000)
    } catch (e: any) {
      setError(e.message || 'Erreur')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', background: surface,
    border: `1.5px solid ${cardBorder}`, borderRadius: '14px',
    color: text, fontSize: '15px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s',
  }

  return (
    <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '32px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ width: 76, height: 76, borderRadius: '24px', background: 'linear-gradient(135deg,#6D28D9,#0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', marginBottom: '28px', boxShadow: '0 20px 60px rgba(109,40,217,0.4)', margin: '0 auto 28px' }}>✦</div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: text, marginBottom: '8px' }}>Mot de passe mis à jour !</div>
            <div style={{ fontSize: '13px', color: muted }}>Redirection en cours...</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '24px', fontWeight: '900', color: text, marginBottom: '8px', letterSpacing: '-0.5px' }}>Nouveau mot de passe</div>
            <div style={{ fontSize: '14px', color: muted, marginBottom: '28px' }}>Choisis un nouveau mot de passe sécurisé.</div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', fontSize: '13px', color: '#F87171', marginBottom: '16px' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Nouveau mot de passe" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#6D28D9')}
                onBlur={e => (e.currentTarget.style.borderColor = cardBorder)} />
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Confirmer le mot de passe" style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                onFocus={e => (e.currentTarget.style.borderColor = '#6D28D9')}
                onBlur={e => (e.currentTarget.style.borderColor = cardBorder)} />
            </div>

            <button onClick={handleUpdate} disabled={loading || !password || !confirm}
              style={{ width: '100%', padding: '16px', background: password && confirm && !loading ? 'linear-gradient(135deg,#6D28D9,#0891B2)' : surface, border: 'none', borderRadius: '14px', color: password && confirm && !loading ? 'white' : muted, fontSize: '15px', fontWeight: '800', cursor: password && confirm && !loading ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              {loading ? '⏳ Mise à jour...' : 'Mettre à jour →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}