'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/utils/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { getDisplayedElo } from '@/utils/eloAccumulation'
import { getEloClass, getEloColor } from '@/utils/eloDisplay'
import AuthButtons from '@/components/layout_b'

type HistoryEntry = {
  name: string
  elo: number
  date?: string
  contestId?: number
  rank?: number
}

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1.5L1 7h2v7h4v-4h2v4h4V7h2L8 1.5z"/>
      </svg>
    ),
  },
  {
    href: '/problemset',
    label: 'Problems',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3 2h10a1 1 0 011 1v1H2V3a1 1 0 011-1zM2 5h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V5zm3 2v1h6V7H5zm0 3v1h4v-1H5z"/>
      </svg>
    ),
  },
  {
    href: '/contests/past/1',
    label: 'Contests',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 4h2v4.5l3 1.8-1 1.7-3.5-2.1A1 1 0 017 9V4z"/>
      </svg>
    ),
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1l1.8 4.9H15l-4.1 3 1.6 4.9L8 11l-4.5 2.8 1.6-4.9L1 6h5.2L8 1z"/>
      </svg>
    ),
  },
  {
    href: '/submissions',
    label: 'Submissions',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2h12v2H2V2zm0 3h12v9H2V5zm2 2v5h8V7H4zm1 1h2v1H5V8zm0 2h4v1H5v-1z"/>
      </svg>
    ),
  },
  {
    href: '/ide',
    label: 'Live IDE',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2h12a1 1 0 011 1v10a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1zm1 3v7h10V5H3zm2 1l2 2-2 2-.7-.7L6.6 8 4.3 5.7 5 5zm3 4h3v1H8v-1z"/>
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'Chat',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-3 3V3a1 1 0 011-1z"/>
      </svg>
    ),
  },
  {
    href: '/blogs',
    label: 'Blogs',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 3h12v1H2V3zm0 3h8v1H2V6zm0 3h10v1H2V9zm0 3h6v1H2v-1z"/>
      </svg>
    ),
  },
  {
    href: '/about',
    label: 'About',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5h2v2H7V5zm0 3h2v5H7V8z"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { username } = useAuth()
  const [elo, setElo] = useState<number>(0)
  const [delta, setDelta] = useState<number | null>(null)
  const [lastContest, setLastContest] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!username) return
    const fetchElo = async () => {
        const { data } = await supabase
            .from('leaderboard')
            .select('elo, history')
            .eq('username', username)
            .maybeSingle()

        if (!data) return
        const history = (data.history ?? []) as HistoryEntry[]
        const count = history.length

        const displayed = getDisplayedElo(data.elo, count)
        setElo(displayed)

        if (count >= 2) {
            const last = history[count - 1]
            const prev = history[count - 2]

            const lastDisp = getDisplayedElo(last.elo, count)
            const prevDisp = getDisplayedElo(prev.elo, count - 1)

            setDelta(Math.round(lastDisp - prevDisp))
            setLastContest(last.name ?? '')   // ← was last.contest
            } else if (count === 1) {
            setLastContest(history[0].name ?? '')  // ← was history[0].contest
            setDelta(null)
        }
    }
    fetchElo()
  }, [username])

  const eloClass = getEloClass(elo)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '12px 8px',
    }}>
      {/* Logo */}
      <Link href="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 8px 14px',
        textDecoration: 'none',
        borderBottom: '1px solid #1e2030',
        marginBottom: '10px',
      }}>
       <Image
        src="/assets/web-icon.png"
        alt="BQTOJ"
        width={28}
        height={28}
        style={{ borderRadius: '7px', flexShrink: 0 }}
        />
        <span style={{ fontSize: '20px', color: '#c300ff' }}><strong>BQTOJ</strong></span>
      </Link>

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              color: isActive(item.href) ? '#a89cee' : '#6a6e88',
              background: isActive(item.href) ? '#1a1c2e' : 'transparent',
              fontWeight: isActive(item.href) ? '500' : '400',
              textDecoration: 'none',
              marginBottom: '2px',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <span style={{ opacity: isActive(item.href) ? 1 : 0.6, flexShrink: 0 }}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: '1px', background: '#1e2030', margin: '10px 0' }} />

      {/* Rating card */}
      {username ? (
        <div style={{
          background: '#161827',
          borderRadius: '8px',
          padding: '12px 10px',
          marginBottom: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {/* Avatar silhouette */}
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#1e2030',
              border: '1px solid #2a2d3a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#555">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#c8ccde', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <strong style={{color: getEloColor(elo)}}>{username}</strong>
              </div>
              <div style={{ fontSize: '10px', color: '#4a4e62' }}>
                
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#9098bc', marginBottom: '2px' }}>Rating</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Image
                src={`/assets/ranks/${eloClass}.png`}
                alt={eloClass}
                width={24}
                height={24}
            />
            <div style={{ fontSize: '22px', fontWeight: '500', color: getEloColor(elo), lineHeight: 1.5 }}>{elo}</div>
            {delta !== null && lastContest && (
                <>
                    <div style={{
                    fontSize: '12px',
                    color: delta >= 0 ? '#00ff40' : '#e63131',
                    marginTop: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    }}>
                    {delta >= 0 ? '+' : ''}{delta}
                    </div>
                </>
            )}
          </div>

            {delta !== null && lastContest && (
                <div style={{
                    fontSize: '12px',
                    color: '#d4dcd6',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
               <strong>{lastContest}</strong>
                </div>
            )}
          
        </div>
      ) : null}

      {/* Auth */}
      <div style={{ fontSize: '12px' }}>
        <AuthButtons />
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="bqt-sidebar-desktop"
        style={{
          width: '250px',
          flexShrink: 0,
          background: '#10121a',
          borderRight: '1px solid #1e2030',
          height: '100vh',
          position: 'fixed',
          top: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateX(-172px)',   // hide all but ~78px showing
          transition: 'transform 0.25s ease',
          zIndex: 30,
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(0)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(-172px)')}
      >
        <SidebarContent />
      </aside>

      {/* Spacer so main content doesn't go under the peeking sidebar */}

      {/* Mobile top bar — unchanged */}
      <div style={{
        display: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#10121a',
        borderBottom: '1px solid #1e2030',
        padding: '0 16px',
        height: '48px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }} className="bqt-mobile-bar">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: '#534AB7', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '10px', color: '#CECBF6', fontWeight: '500',
          }}>BQ</div>
          <span style={{ fontSize: '16px', fontWeight: '500', color: '#c8ccde' }}>BQTOJ</span>
        </Link>
        <button
          onClick={() => setMobileOpen(v => !v)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#8a8ea8',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {mobileOpen
              ? <path d="M4 4l12 12M4 16L16 4" stroke="currentColor" strokeWidth="2" fill="none"/>
              : <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" fill="none"/>
            }
          </svg>
        </button>
      </div>

      {/* Mobile drawer — unchanged */}
      {mobileOpen && (
        <div style={{
          display: 'none',
          position: 'fixed',
          top: '48px',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#10121a',
          zIndex: 40,
          overflowY: 'auto',
        }} className="bqt-mobile-drawer">
          <SidebarContent />
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .bqt-sidebar-desktop { display: none !important; }
          .bqt-sidebar-spacer  { display: none !important; }
          .bqt-mobile-bar { display: flex !important; }
          .bqt-mobile-drawer { display: block !important; }
        }
      `}</style>
    </>
  )
}