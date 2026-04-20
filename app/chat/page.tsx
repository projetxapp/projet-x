'use client'

import { useState, useRef, useEffect } from 'react'
import { useMode, Mode } from '../context/ModeContext'
import { supabase } from '../lib/supabase'

const MODE_CONFIG = {
  talent: { accent: '#6D28D9', accentLight: '#A78BFA', accentBg: 'rgba(109,40,217,0.1)', gradient: 'linear-gradient(135deg,#6D28D9,#0891B2)' },
  project: { accent: '#0891B2', accentLight: '#22D3EE', accentBg: 'rgba(8,145,178,0.1)', gradient: 'linear-gradient(135deg,#0891B2,#06B6D4)' },
  investor: { accent: '#B45309', accentLight: '#FCD34D', accentBg: 'rgba(180,83,9,0.1)', gradient: 'linear-gradient(135deg,#B45309,#F59E0B)' },
}

function ModeSelector({ muted, cardBorder }: { muted: string; cardBorder: string }) {
  const { activeMode, setActiveMode, userModes, activateMode } = useMode()
  const modes = [
    { id: 'talent' as Mode, emoji: '⚡', label: 'Talent' },
    { id: 'project' as Mode, emoji: '🚀', label: 'Projet' },
    { id: 'investor' as Mode, emoji: '💎', label: 'Invest' },
  ]
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {modes.map(m => {
        const isActive = activeMode === m.id
        const has = userModes.includes(m.id)
        const cfg = MODE_CONFIG[m.id]
        return (
          <button key={m.id} onClick={() => has ? setActiveMode(m.id) : activateMode(m.id)}
            style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${isActive ? cfg.accent : cardBorder}`, background: isActive ? cfg.accentBg : 'transparent', color: isActive ? cfg.accentLight : muted, fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
            {m.emoji} {m.label}{!has && <span style={{ color: '#F97316', fontSize: '9px' }}>+</span>}
          </button>
        )
      })}
    </div>
  )
}

export default function ChatPage() {
  const { activeMode, setActiveMode, userModes, activateMode, dark, setDark } = useMode()
  const [currentUserId, setCurrentUserId] = useState('')
  const [showAll, setShowAll] = useState(true)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [showAttach, setShowAttach] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const realtimeRef = useRef<any>(null)
  const currentUserIdRef = useRef('')
  // Empêche le useEffect URL de s'exécuter en boucle
  const urlHandledRef = useRef(false)

  const bg = dark ? '#0D0C18' : '#F4F2FF'
  const card = dark ? '#16152A' : '#FFFFFF'
  const cardBorder = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
  const surface = dark ? '#1E1D32' : '#F8F7FF'
  const text = dark ? '#F0EEFF' : '#0D0C18'
  const muted = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'
  const hint = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
  const navBg = dark ? '#16152A' : '#FFFFFF'
  const cfg = MODE_CONFIG[activeMode]

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      setCurrentUserId(user.id)
      currentUserIdRef.current = user.id
      await loadConversations(user.id)
    }
    init()
  }, [])

  // Auto-ouvrir conv depuis ?match= — une seule fois
  useEffect(() => {
    if (!conversations.length || !currentUserId || urlHandledRef.current) return
    const params = new URLSearchParams(window.location.search)
    const matchId = params.get('match')
    if (matchId) {
      const conv = conversations.find(c => c.matchId === matchId)
      if (conv) {
        urlHandledRef.current = true
        openConversation(conv)
      }
    }
  }, [conversations, currentUserId])

  async function loadConversations(uid: string) {
    setLoadingConvs(true)
    try {
      const { data: matchData } = await supabase
        .from('matches').select('*')
        .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
        .order('created_at', { ascending: false })

      if (!matchData || matchData.length === 0) {
        setConversations([])
        setLoadingConvs(false)
        return
      }

      const enriched = await Promise.all(matchData.map(async (match: any) => {
        const isUser1 = match.user1_id === uid
        const otherId = isUser1 ? match.user2_id : match.user1_id
        const myMode = isUser1 ? match.mode1 : match.mode2

        const { data: profile } = await supabase
          .from('profiles').select('id, first_name, last_name, avatar_url')
          .eq('id', otherId).single()

        const { data: lastMsgData } = await supabase
          .from('messages').select('content, created_at, sender_id')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const { count: unreadCount } = await supabase
          .from('messages').select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)
          .neq('sender_id', uid)
          .eq('seen', false)

        const lastMsg = lastMsgData?.[0]
        const timeStr = lastMsg?.created_at
          ? new Date(lastMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : ''

        return {
          id: match.id,
          matchId: match.id,
          userId: otherId,
          firstName: profile?.first_name || 'Utilisateur',
          lastName: profile?.last_name || '',
          photo: profile?.avatar_url || `https://i.pravatar.cc/150?u=${otherId}`,
          lastMsg: lastMsg?.content || '',
          lastMsgIsMe: lastMsg?.sender_id === uid,
          time: timeStr,
          unread: unreadCount || 0,
          online: false,
          score: Math.floor(Math.random() * 20) + 78,
          myMode,
        }
      }))

      setConversations(enriched)
    } catch (e) {
      console.error(e)
      setConversations([])
    }
    setLoadingConvs(false)
  }

  async function openConversation(conv: any) {
    const uid = currentUserIdRef.current

    // 1. Marquer comme lus EN BASE en premier
    if (uid) {
      await supabase.from('messages')
        .update({ seen: true })
        .eq('match_id', conv.matchId)
        .neq('sender_id', uid)
        .eq('seen', false)
    }

    // 2. Mettre à jour le state local
    setConversations(prev => prev.map(c =>
      c.id === conv.id ? { ...c, unread: 0 } : c
    ))

    // 3. Afficher la conv
    setActiveConv(conv)
    setShowAttach(false)
    setLoadingMsgs(true)

    const { data: msgs } = await supabase
      .from('messages').select('*')
      .eq('match_id', conv.matchId)
      .order('created_at', { ascending: true })
    setMessages(msgs || [])
    setLoadingMsgs(false)

    // 4. Realtime
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current)
    const channel = supabase.channel(`messages-${conv.matchId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `match_id=eq.${conv.matchId}`,
      }, (payload: any) => {
        setMessages(prev => [...prev, payload.new])
        if (payload.new.sender_id !== currentUserIdRef.current) {
          supabase.from('messages').update({ seen: true }).eq('id', payload.new.id)
        }
      })
      .subscribe()
    realtimeRef.current = channel
  }

  function closeConversation() {
    setActiveConv(null)
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current)
      realtimeRef.current = null
    }
  }

  async function sendMessage(text?: string) {
    const content = text || input.trim()
    if (!content || !activeConv || !currentUserIdRef.current) return

    const tempId = `temp-${Date.now()}`
    const tempMsg = {
      id: tempId,
      content,
      sender_id: currentUserIdRef.current,
      created_at: new Date().toISOString(),
      seen: false,
      temp: true,
    }
    setMessages(prev => [...prev, tempMsg])
    setInput('')

    setSending(true)
    const { data, error } = await supabase.from('messages').insert({
      match_id: activeConv.matchId,
      sender_id: currentUserIdRef.current,
      content,
      seen: false,
    }).select().single()

    if (!error && data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m))
    }
    setSending(false)

    setConversations(prev => prev.map(c =>
      c.id === activeConv.id
        ? { ...c, lastMsg: content, lastMsgIsMe: true, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
        : c
    ))
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => { if (realtimeRef.current) supabase.removeChannel(realtimeRef.current) }
  }, [])

  const filtered = conversations.filter(c => {
    const matchSearch = search === '' || `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
    const matchMode = showAll || c.myMode === activeMode
    return matchSearch && matchMode
  })

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread, 0)

  const navItems = [
    { id: 'home', href: '/home' },
    { id: 'chat', href: '/chat', active: true },
    { id: 'swipe', href: '/swipe' },
    { id: 'explorer', href: '/explorer' },
    { id: 'profil', href: '/profil' },
  ]

  // ── VUE CONVERSATION ──
  if (activeConv) {
    return (
      <div style={{ height: '100%', overflow: 'hidden', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        <div style={{ padding: '36px 16px 12px', background: card, borderBottom: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button onClick={closeConversation} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={cfg.accentLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <img src={activeConv.photo} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${cfg.accent}`, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: text }}>{activeConv.firstName} {activeConv.lastName}</div>
            <div style={{ fontSize: '10px', color: muted }}>{activeConv.score}% compatibilité</div>
          </div>
          <button onClick={() => window.location.href = `/profil/${activeConv.userId}`}
            style={{ padding: '6px 12px', background: cfg.accentBg, border: `1px solid ${cfg.accent}40`, borderRadius: '20px', color: cfg.accentLight, fontSize: '11px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>
            Voir profil
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loadingMsgs && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${cfg.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}

          {!loadingMsgs && messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', paddingTop: '12px' }}>
              <img src={activeConv.photo} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${cfg.accent}` }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: text, marginBottom: '4px' }}>🔥 Match avec {activeConv.firstName} !</div>
                <div style={{ fontSize: '11px', color: muted }}>Soyez les premiers à vous écrire</div>
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: '600', color: hint, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Lance la conversation</div>
                {[
                  'Salut ! Ton profil m\'intéresse vraiment 🔥',
                  'Tu serais dispo pour un call cette semaine ?',
                  'J\'aimerais en savoir plus sur ton projet !',
                ].map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    style={{ padding: '11px 14px', background: cfg.accentBg, border: `1px solid ${cfg.accent}30`, borderRadius: '20px', color: cfg.accentLight, fontSize: '12px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg: any) => {
            const mine = msg.sender_id === currentUserIdRef.current
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                {!mine && (
                  <img src={activeConv.photo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ maxWidth: '70%' }}>
                  <div style={{
                    padding: '11px 15px',
                    borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: mine ? cfg.gradient : surface,
                    color: mine ? 'white' : text,
                    fontSize: '12px',
                    lineHeight: 1.55,
                    opacity: msg.temp ? 0.7 : 1,
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: '9px', color: hint, marginTop: '4px', textAlign: mine ? 'right' : 'left' }}>
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {mine && <span style={{ marginLeft: '4px' }}>{msg.seen ? ' ✓✓' : ' ✓'}</span>}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {showAttach && (
          <div style={{ background: card, borderTop: `1px solid ${cardBorder}`, padding: '14px 16px', display: 'flex', gap: '16px', justifyContent: 'center', flexShrink: 0 }}>
            {[{ icon: '📷', label: 'Photo' }, { icon: '📄', label: 'Fichier' }, { icon: '📊', label: 'Deck' }].map((item, i) => (
              <div key={i} onClick={() => { sendMessage(`${item.icon} ${item.label} partagé`); setShowAttach(false) }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <div style={{ width: 50, height: 50, borderRadius: '15px', background: surface, border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{item.icon}</div>
                <span style={{ fontSize: '9px', color: muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '10px 12px 16px', background: card, borderTop: `1px solid ${cardBorder}`, display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => setShowAttach(!showAttach)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: showAttach ? cfg.accentBg : surface, border: `1px solid ${showAttach ? cfg.accent : cardBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke={showAttach ? cfg.accentLight : muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Ton message..."
            style={{ flex: 1, padding: '10px 16px', background: surface, border: `1.5px solid ${cardBorder}`, borderRadius: '22px', color: text, fontSize: '12px', outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => (e.currentTarget.style.borderColor = cfg.accent)}
            onBlur={e => (e.currentTarget.style.borderColor = cardBorder)}
          />
          <button onClick={() => sendMessage()} disabled={sending || !input.trim()}
            style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() ? cfg.gradient : surface, border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={input.trim() ? 'white' : muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // ── VUE LISTE ──
  return (
    <div style={{ height: '100%', overflow: 'hidden', background: bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', transition: 'background 0.3s' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ padding: '36px 20px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: text }}>Messages</div>
            <div style={{ fontSize: '10px', color: muted, marginTop: '2px' }}>
              {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={() => setDark(!dark)}
            style={{ background: 'none', border: `1px solid ${cardBorder}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', overflowX: 'auto' }}>
          <button onClick={() => setShowAll(true)}
            style={{ padding: '4px 10px', borderRadius: '20px', border: `1px solid ${showAll ? cfg.accent : cardBorder}`, background: showAll ? cfg.accentBg : 'transparent', color: showAll ? cfg.accentLight : muted, fontSize: '10px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>
            💬 Tous {totalUnread > 0 && `(${totalUnread})`}
          </button>
          <div style={{ width: 1, background: cardBorder, flexShrink: 0, margin: '4px 2px' }} />
          {(['talent', 'project', 'investor'] as Mode[]).map(modeId => {
            const info = {
              talent: { emoji: '⚡', label: 'Talent' },
              project: { emoji: '🚀', label: 'Projet' },
              investor: { emoji: '💎', label: 'Invest' },
            }[modeId]
            const isActive = !showAll && activeMode === modeId
            const modeCfg = MODE_CONFIG[modeId]
            const modeConvs = conversations.filter(c => c.myMode === modeId)
            const modeUnread = modeConvs.reduce((acc, c) => acc + c.unread, 0)
            return (
              <button key={modeId} onClick={() => { setShowAll(false); setActiveMode(modeId) }}
                style={{ padding: '4px 10px', borderRadius: '20px', border: `1px solid ${isActive ? modeCfg.accent : cardBorder}`, background: isActive ? modeCfg.accentBg : 'transparent', color: isActive ? modeCfg.accentLight : showAll ? hint : muted, fontSize: '10px', fontWeight: '600', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {info.emoji} {info.label}
                {modeConvs.length > 0 && (
                  <span style={{ fontSize: '9px', background: isActive ? modeCfg.accent : 'rgba(255,255,255,0.1)', color: isActive ? 'white' : muted, borderRadius: '20px', padding: '1px 5px' }}>
                    {modeUnread > 0 ? modeUnread : modeConvs.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" stroke={muted} strokeWidth="2" />
            <path d="M21 21L16.65 16.65" stroke={muted} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            style={{ width: '100%', padding: '10px 14px 10px 35px', background: surface, border: `1px solid ${cardBorder}`, borderRadius: '12px', color: text, fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 8px' }}>
        {loadingConvs ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${cfg.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>💬</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: text, marginBottom: '8px' }}>
              {conversations.length === 0 ? 'Pas encore de conversations' : 'Aucun match dans cette catégorie'}
            </div>
            <div style={{ fontSize: '12px', color: muted, lineHeight: 1.6, marginBottom: '20px' }}>
              {conversations.length === 0 ? 'Swipe des profils pour obtenir des matches !' : `Swipe en mode ${activeMode} pour avoir des matches ici`}
            </div>
            {conversations.length === 0 && (
              <button onClick={() => window.location.href = '/swipe'}
                style={{ padding: '12px 24px', background: cfg.gradient, border: 'none', borderRadius: '14px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                Aller swiper →
              </button>
            )}
          </div>
        ) : (
          <>
            {filtered.some(c => c.unread > 0) && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: hint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Nouveaux messages 🔥</div>
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {filtered.filter(c => c.unread > 0).map(c => (
                    <div key={c.id} onClick={() => openConversation(c)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', flexShrink: 0 }}>
                      <div style={{ position: 'relative' }}>
                        <img src={c.photo} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${cfg.accent}` }} />
                        <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, background: '#F97316', borderRadius: '50%', fontSize: '8px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${bg}` }}>
                          {c.unread}
                        </div>
                      </div>
                      <div style={{ fontSize: '9px', fontWeight: '600', color: text, maxWidth: '52px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {c.firstName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filtered.map(c => {
              const isNew = c.unread > 0
              return (
                <div key={c.id} onClick={() => openConversation(c)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 10px', borderRadius: '16px', cursor: 'pointer', marginBottom: '4px', background: isNew ? (dark ? 'rgba(109,40,217,0.06)' : 'rgba(109,40,217,0.04)') : 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = isNew ? (dark ? 'rgba(109,40,217,0.06)' : 'rgba(109,40,217,0.04)') : 'transparent')}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={c.photo} alt="" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: isNew ? `2px solid ${cfg.accent}` : `1px solid ${cardBorder}` }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: isNew ? '800' : '600', color: text }}>
                        {c.firstName} {c.lastName}
                      </span>
                      <span style={{ fontSize: '10px', color: isNew ? cfg.accentLight : hint, fontWeight: isNew ? '600' : '400', flexShrink: 0, marginLeft: '6px' }}>
                        {c.time}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: isNew ? text : muted, fontWeight: isNew ? '500' : '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {c.lastMsg
                        ? <>{c.lastMsgIsMe && <span style={{ color: muted }}>Toi : </span>}{c.lastMsg}</>
                        : <span style={{ color: cfg.accentLight, fontStyle: 'italic', fontWeight: '500' }}>🔥 Nouveau match — dis bonjour !</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: c.score >= 90 ? '#F97316' : cfg.accentLight }}>
                      {c.score}%
                    </div>
                    {isNew && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '800', color: 'white' }}>
                        {c.unread}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      <div style={{ background: navBg, borderTop: `1px solid ${cardBorder}`, paddingBottom: 16, paddingTop: 8, display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexShrink: 0 }}>
        {navItems.map(item => (
          <div key={item.id} onClick={() => window.location.href = item.href}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', flex: 1, position: 'relative' }}>
            {item.id === 'swipe' ? (
              <>
                <div style={{ width: 38, height: 38, borderRadius: '50%', border: `2px solid ${cfg.accent}`, background: cfg.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill={cfg.accentLight} />
                  </svg>
                </div>
                <span style={{ fontSize: '8px', fontWeight: '600', textTransform: 'uppercase' as const, color: cfg.accentLight }}>Swipe</span>
              </>
            ) : (
              <>
                {item.id === 'chat' && totalUnread > 0 && (
                  <div style={{ position: 'absolute', top: 0, right: '18%', width: 15, height: 15, background: '#F97316', borderRadius: '50%', fontSize: '8px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${navBg}` }}>
                    {totalUnread}
                  </div>
                )}
                <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.id === 'home' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9Z" stroke={muted} strokeWidth="1.5" /></svg>}
                  {item.id === 'chat' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={(item as any).active ? cfg.accentLight : muted} strokeWidth="1.5" fill={(item as any).active ? cfg.accentBg : 'none'} /></svg>}
                  {item.id === 'explorer' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={muted} strokeWidth="1.5" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" stroke={muted} strokeWidth="1.5" strokeLinejoin="round" /></svg>}
                  {item.id === 'profil' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={muted} strokeWidth="1.5" /><path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke={muted} strokeWidth="1.5" strokeLinecap="round" /></svg>}
                </div>
                <span style={{ fontSize: '8px', fontWeight: '600', textTransform: 'uppercase' as const, color: (item as any).active ? cfg.accentLight : muted, letterSpacing: '0.04em' }}>
                  {item.id === 'home' ? 'Accueil' : item.id === 'chat' ? 'Chat' : item.id === 'explorer' ? 'Explorer' : 'Profil'}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}