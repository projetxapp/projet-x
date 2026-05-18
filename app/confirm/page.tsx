'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    async function handle() {
      try {
        // Méthode 1 : token dans le hash (#access_token=...)
        const hash = window.location.hash
        if (hash) {
          const params = new URLSearchParams(hash.replace('#', ''))
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token })
            if (error) throw error
            setStatus('success')
            setTimeout(() => window.location.href = '/home', 1500)
            return
          }
        }
        // Méthode 2 : code dans l'URL (?code=...)
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          setStatus('success')
          setTimeout(() => window.location.href = '/home', 1500)
          return
        }
        // Méthode 3 : session déjà active
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setStatus('success')
          setTimeout(() => window.location.href = '/home', 1500)
          return
        }
        setStatus('error')
      } catch (e) {
        console.error(e)
        setStatus('error')
      }
    }
    handle()
  }, [])

  return (
    <div style={{ height: '100%', background: '#08070F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', padding: '32px', textAlign: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 76, height: 76, borderRadius: '24px', background: 'linear-gradient(135deg,#6D28D9,#0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', marginBottom: '28px' }}>✦</div>

      {status === 'loading' && (
        <>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #6D28D9', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', marginBottom: '20px' }} />
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#F0EEFF' }}>Confirmation en cours...</div>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>✅</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#F0EEFF', marginBottom: '8px' }}>Email confirmé !</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Redirection vers l'app...</div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #4ADE80', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', marginTop: '20px' }} />
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>❌</div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#F0EEFF', marginBottom: '8px' }}>Lien invalide ou expiré</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px' }}>Essaie de te reconnecter ou de recréer un compte.</div>
          <button onClick={() => window.location.href = '/'}
            style={{ padding: '14px 28px', background: 'linear-gradient(135deg,#6D28D9,#0891B2)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
            Retour à l'accueil
          </button>
        </>
      )}
    </div>
  )
}