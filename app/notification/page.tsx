'use client'

import { useMode } from '../context/ModeContext'

export default function NotificationsPage() {
  const { notifications, unreadNotifCount, markAllNotifRead, markNotifRead, dark } = useMode()

  const bg = dark ? '#08070F' : '#F4F2FF'
  const card = dark ? '#111019' : '#FFFFFF'
  const cardBorder = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const surface = dark ? '#1A1828' : '#F8F7FF'
  const text = dark ? '#F0EEFF' : '#0D0C18'
  const muted = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'

  function timeAgo(date: Date) {
    const diff = Date.now() - new Date(date).getTime()
    const min = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    if (min < 1) return 'À l\'instant'
    if (min < 60) return `Il y a ${min} min`
    if (h < 24) return `Il y a ${h}h`
    return `Il y a ${Math.floor(h / 24)}j`
  }

  return (
    <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' }}>

      <div style={{ padding: '44px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: `1px solid ${cardBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => window.history.back()}
            style={{ background: surface, border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: text }}>Notifications</div>
            {unreadNotifCount > 0 && <div style={{ fontSize: '12px', color: '#A78BFA' }}>{unreadNotifCount} non lue{unreadNotifCount > 1 ? 's' : ''}</div>}
          </div>
        </div>
        {unreadNotifCount > 0 && (
          <button onClick={markAllNotifRead}
            style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
            Tout marquer lu
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {notifications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', textAlign: 'center', gap: '12px' }}>
            <div style={{ fontSize: '48px' }}>🔔</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: text }}>Pas encore de notifications</div>
            <div style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>Tes matches et messages apparaîtront ici</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.map(notif => (
              <div key={notif.id}
                onClick={() => {
                  markNotifRead(notif.id)
                  if (notif.matchId) window.location.href = `/chat?match=${notif.matchId}`
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: notif.read ? card : dark ? 'rgba(109,40,217,0.08)' : 'rgba(109,40,217,0.04)', borderRadius: '16px', border: `1px solid ${notif.read ? cardBorder : 'rgba(109,40,217,0.2)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>

                {/* Icône */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: notif.type === 'match' ? 'linear-gradient(135deg,#6D28D9,#0891B2)' : surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, border: `1px solid ${cardBorder}` }}>
                  {notif.type === 'match' ? '🔥' : '💬'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: notif.read ? '600' : '800', color: text, marginBottom: '2px' }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: '12px', color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {notif.body}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', color: muted }}>{timeAgo(notif.createdAt)}</div>
                  {!notif.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6D28D9' }} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}