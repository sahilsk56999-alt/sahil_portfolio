import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Folder, FolderOpen, FileText, Terminal as TerminalIcon, Edit3, Music2, Globe, Store as StoreIcon,
  Settings as SettingsIcon, Wifi, Volume2, Sun, Moon, X, Minus, Maximize2, Minimize2,
  Calculator as CalculatorIcon, StickyNote, CalendarDays, CloudSun, Image as ImageIcon,
  ChevronLeft, ChevronRight, RefreshCw, Search, Check, Battery, Play, Pause, SkipBack, SkipForward,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------
const WALLPAPERS = {
  aurora: 'radial-gradient(circle at 20% 20%, #4B3F9E 0%, transparent 55%), radial-gradient(circle at 80% 30%, #7B5CFF 0%, transparent 50%), radial-gradient(circle at 60% 85%, #2ED9C3 0%, transparent 55%), #0A0A12',
  copper: 'radial-gradient(circle at 15% 25%, #B8622E 0%, transparent 55%), radial-gradient(circle at 85% 20%, #FF8A50 0%, transparent 50%), radial-gradient(circle at 50% 90%, #3A2A22 0%, transparent 60%), #100B08',
  ocean: 'radial-gradient(circle at 25% 15%, #164E63 0%, transparent 55%), radial-gradient(circle at 80% 40%, #0EA5C4 0%, transparent 50%), radial-gradient(circle at 50% 90%, #0B2540 0%, transparent 55%), #060B12',
};

const TRACKS = [
  { title: 'Nebula Drift', artist: 'Aether Sound', duration: 222 },
  { title: 'Coppertone', artist: 'Lo-Fi Kit', duration: 198 },
  { title: 'Glass Horizon', artist: 'Aether Sound', duration: 245 },
];

const APP_REGISTRY = {
  explorer: { title: 'File Explorer', icon: FolderOpen, w: 640, h: 440 },
  terminal: { title: 'Terminal', icon: TerminalIcon, w: 560, h: 380 },
  editor: { title: 'Text Editor', icon: Edit3, w: 600, h: 420 },
  media: { title: 'Media Player', icon: Music2, w: 380, h: 460 },
  browser: { title: 'Browser', icon: Globe, w: 700, h: 480 },
  store: { title: 'App Store', icon: StoreIcon, w: 640, h: 460 },
  settings: { title: 'Settings', icon: SettingsIcon, w: 400, h: 420 },
  calculator: { title: 'Calculator', icon: CalculatorIcon, w: 280, h: 400 },
  notes: { title: 'Notes', icon: StickyNote, w: 340, h: 380 },
  calendar: { title: 'Calendar', icon: CalendarDays, w: 360, h: 400 },
  weather: { title: 'Weather', icon: CloudSun, w: 320, h: 400 },
  photos: { title: 'Photos', icon: ImageIcon, w: 560, h: 400 },
};

const PINNED = ['explorer', 'terminal', 'editor', 'media', 'browser', 'store', 'settings'];
const STORE_APPS = ['calculator', 'notes', 'calendar', 'weather', 'photos'];

const FILE_TREE = {
  name: 'Home', type: 'folder', children: [
    { name: 'Documents', type: 'folder', children: [
      { name: 'Proposal.docx', type: 'file', preview: 'Client proposal draft — AetherOS licensing terms and rollout timeline.' },
      { name: 'Budget.xlsx', type: 'file', preview: 'Q3 budget spreadsheet — engineering, design, and infra line items.' },
    ]},
    { name: 'Projects', type: 'folder', children: [
      { name: 'aetheros', type: 'folder', children: [
        { name: 'index.js', type: 'file', preview: 'console.log("hello aetheros")' },
        { name: 'readme.md', type: 'file', preview: '# AetherOS\n\nA web-based spatial operating system.' },
      ]},
    ]},
    { name: 'Media', type: 'folder', children: [
      { name: 'demo.mp4', type: 'file', preview: 'Video file — 00:42 — product walkthrough recording.' },
      { name: 'cover.png', type: 'file', preview: 'Image file — 1600×900 — desktop wallpaper source.' },
    ]},
    { name: 'notes.txt', type: 'file', preview: 'Remember to demo the terminal app during the pitch.' },
  ],
};

function defaultAppState(appId) {
  switch (appId) {
    case 'explorer': return { expanded: { Home: true }, selected: null };
    case 'terminal': return { history: [{ type: 'output', text: 'AetherOS Terminal v1.0 — type "help" to get started.' }], input: '' };
    case 'editor': return { tabs: { 'readme.md': '# AetherOS\n\nA web-based spatial operating system, running entirely in the browser.', 'index.js': 'console.log("hello aetheros");' }, active: 'readme.md', savedAt: null };
    case 'media': return { playing: false, trackIndex: 0, elapsed: 0 };
    case 'browser': return { address: 'aether://home', history: ['aether://home'], historyIndex: 0 };
    case 'calculator': return { display: '0', expr: '' };
    case 'notes': return { text: 'Sticky note — jot anything here.' };
    default: return {};
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function AetherOS() {
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState([]);
  const [nextZ, setNextZ] = useState(1);
  const [activeId, setActiveId] = useState(null);
  const [installedApps, setInstalledApps] = useState(new Set(STORE_APPS.filter((a) => a === 'calculator' || a === 'notes')));
  const [theme, setTheme] = useState('dark');
  const [wallpaper, setWallpaper] = useState('aurora');
  const [volume, setVolume] = useState(70);
  const [wifiOn, setWifiOn] = useState(true);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [iconTilt, setIconTilt] = useState({});

  const dragInfo = useRef(null);
  const resizeInfo = useRef(null);
  const desktopRef = useRef(null);

  useEffect(() => {
    const onParallax = (e) => {
      const rect = desktopRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      setParallax({ x: px, y: py });
    };
    window.addEventListener('pointermove', onParallax);
    return () => window.removeEventListener('pointermove', onParallax);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      setWindows((prev) => prev.map((w) => (w.appId === 'media' && w.state.playing
        ? { ...w, state: { ...w.state, elapsed: w.state.elapsed + 1 } }
        : w)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (dragInfo.current) {
        const { id, offsetX, offsetY } = dragInfo.current;
        setWindows((prev) => prev.map((w) => (w.id === id
          ? { ...w, x: Math.max(0, e.clientX - offsetX), y: Math.max(0, e.clientY - offsetY) }
          : w)));
      }
      if (resizeInfo.current) {
        const { id, startW, startH, startX, startY } = resizeInfo.current;
        setWindows((prev) => prev.map((w) => (w.id === id
          ? { ...w, w: Math.max(260, startW + (e.clientX - startX)), h: Math.max(200, startH + (e.clientY - startY)) }
          : w)));
      }
    };
    const onUp = () => { dragInfo.current = null; resizeInfo.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, []);

  const focusWindow = useCallback((id) => {
    setActiveId(id);
    setNextZ((z) => {
      const nz = z + 1;
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, z: nz, minimized: false } : w)));
      return nz;
    });
  }, []);

  const openApp = useCallback((appId) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.appId === appId);
      if (existing) {
        return prev.map((w) => (w.appId === appId ? { ...w, minimized: false, z: nextZ + 1 } : w));
      }
      const meta = APP_REGISTRY[appId];
      const count = prev.length;
      const id = `${appId}-${Date.now()}`;
      const win = {
        id, appId, title: meta.title,
        x: 90 + (count % 6) * 28, y: 70 + (count % 6) * 24,
        w: meta.w, h: meta.h, minimized: false, maximized: false, prevBounds: null,
        z: nextZ + 1, state: defaultAppState(appId),
      };
      return [...prev, win];
    });
    setNextZ((z) => z + 1);
    setActiveId(appId);
  }, [nextZ]);

  const closeWindow = (id) => setWindows((prev) => prev.filter((w) => w.id !== id));
  const minimizeWindow = (id) => setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  const toggleMaximize = (id) => setWindows((prev) => prev.map((w) => {
    if (w.id !== id) return w;
    if (w.maximized) return { ...w, maximized: false, ...w.prevBounds };
    return { ...w, maximized: true, prevBounds: { x: w.x, y: w.y, w: w.w, h: w.h } };
  }));

  const patchState = (id, patch) => setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, state: { ...w.state, ...patch } } : w)));

  const startDrag = (e, win) => {
    if (win.maximized) return;
    focusWindow(win.id);
    dragInfo.current = { id: win.id, offsetX: e.clientX - win.x, offsetY: e.clientY - win.y };
  };
  const startResize = (e, win) => {
    e.stopPropagation();
    focusWindow(win.id);
    resizeInfo.current = { id: win.id, startW: win.w, startH: win.h, startX: e.clientX, startY: e.clientY };
  };

  const installApp = (appId) => setInstalledApps((prev) => new Set(prev).add(appId));

  const isDark = theme === 'dark';
  const ink = isDark ? '#0A0A0F' : '#F3F1EC';
  const cream = isDark ? '#EDEBF5' : '#161421';
  const chrome = isDark ? 'rgba(20,18,32,0.72)' : 'rgba(255,255,255,0.72)';
  const accent = '#7B5CFF';
  const accent2 = '#2ED9C3';

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', fontFamily: "'Inter', sans-serif", color: cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .disp { font-family: 'Space Grotesk', sans-serif; }
        .glass { background: ${chrome}; backdrop-filter: blur(20px); border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}; position: relative; }
        .glass::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
          background: linear-gradient(115deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 28%, rgba(255,255,255,0) 55%);
        }
        .glass::after {
          content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.15);
        }
        .glass-shard { position: absolute; border-radius: 28px; background: linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.14); backdrop-filter: blur(6px); pointer-events: none;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3); }
        @keyframes shardDrift { 0%,100% { transform: translate(0,0) rotate(var(--rot,0deg)); } 50% { transform: translate(14px,-20px) rotate(calc(var(--rot,0deg) + 3deg)); } }
        .icon-btn { transition: transform 0.15s ease, background 0.15s ease; }
        .icon-btn:hover { background: rgba(123,92,255,0.18); }
        .win-enter { animation: winIn 0.22s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes winIn { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes bootPulse { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
        @keyframes bootBar { from { width: 0%; } to { width: 100%; } }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(123,92,255,0.4); border-radius: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .term-input:focus { outline: none; }
      `}</style>

      {/* BOOT SCREEN */}
      {!booted && (
        <div style={{ position: 'absolute', inset: 0, background: '#08070C', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <div className="disp" style={{ fontSize: 30, letterSpacing: 4, background: `linear-gradient(100deg, ${accent}, ${accent2})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', animation: 'bootPulse 1.4s ease-in-out infinite' }}>
            AETHER<span style={{ opacity: 0.5 }}>OS</span>
          </div>
          <div style={{ width: 220, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: `linear-gradient(90deg, ${accent}, ${accent2})`, animation: 'bootBar 1.8s ease forwards' }} />
          </div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>STARTING SYSTEM SERVICES…</div>
        </div>
      )}

      {/* DESKTOP */}
      <div ref={desktopRef} style={{ position: 'absolute', inset: 0, background: WALLPAPERS[wallpaper], transition: 'background 0.4s ease', perspective: 1400, overflow: 'hidden' }}
        onClick={() => { setSelectedIcon(null); setControlCenterOpen(false); }}>

        {/* Parallax 3D glass shards — depth layers */}
        <div style={{ position: 'absolute', inset: 0, transform: `translate3d(${parallax.x * -26}px, ${parallax.y * -18}px, 0)`, transition: 'transform 0.15s ease-out' }}>
          <div className="glass-shard" style={{ width: 260, height: 260, top: '8%', left: '62%', '--rot': '-14deg', animation: 'shardDrift 11s ease-in-out infinite' }} />
          <div className="glass-shard" style={{ width: 140, height: 140, top: '62%', left: '8%', '--rot': '10deg', animation: 'shardDrift 9s ease-in-out infinite 1s' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, transform: `translate3d(${parallax.x * -48}px, ${parallax.y * -32}px, 0)`, transition: 'transform 0.15s ease-out' }}>
          <div className="glass-shard" style={{ width: 180, height: 180, top: '30%', left: '78%', '--rot': '20deg', animation: 'shardDrift 13s ease-in-out infinite 0.5s' }} />
          <div className="glass-shard" style={{ width: 100, height: 100, top: '75%', left: '48%', '--rot': '-8deg', animation: 'shardDrift 8s ease-in-out infinite 2s' }} />
        </div>

        {/* Desktop icons */}
        <div style={{ position: 'absolute', top: 44, left: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[...PINNED, ...Array.from(installedApps)].map((appId) => {
            const meta = APP_REGISTRY[appId];
            const Icon = meta.icon;
            const sel = selectedIcon === appId;
            const t = iconTilt[appId] || { x: 0, y: 0 };
            return (
              <div key={appId}
                onClick={(e) => { e.stopPropagation(); setSelectedIcon(appId); }}
                onDoubleClick={(e) => { e.stopPropagation(); openApp(appId); }}
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const px = (e.clientX - r.left) / r.width - 0.5;
                  const py = (e.clientY - r.top) / r.height - 0.5;
                  setIconTilt((prev) => ({ ...prev, [appId]: { x: py * -14, y: px * 14 } }));
                }}
                onMouseLeave={() => setIconTilt((prev) => ({ ...prev, [appId]: { x: 0, y: 0 } }))}
                style={{ width: 76, padding: '8px 4px', borderRadius: 10, cursor: 'default', textAlign: 'center',
                  background: sel ? 'rgba(123,92,255,0.35)' : 'transparent' }}>
                <div style={{ width: 40, height: 40, margin: '0 auto 6px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
                  transform: `perspective(300px) rotateX(${t.x}deg) rotateY(${t.y}deg)`, transition: 'transform 0.12s ease-out',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)' }}>
                  <Icon size={20} color={cream} />
                </div>
                <div style={{ fontSize: 10.5, color: cream, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{meta.title}</div>
              </div>
            );
          })}
        </div>

        {/* Top menu bar */}
        <div className="glass" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', zIndex: 200 }}
          onClick={(e) => e.stopPropagation()}>
          <div className="disp" style={{ fontSize: 13, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accent2})` }} />
            AetherOS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12 }}>
            <span>{now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span className="disp">{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
            <button onClick={() => setControlCenterOpen((o) => !o)} className="icon-btn" style={{ background: 'none', border: 'none', color: cream, cursor: 'pointer', display: 'flex', gap: 8, padding: 4, borderRadius: 8 }}>
              {wifiOn && <Wifi size={14} />}
              <Volume2 size={14} />
              <Battery size={14} />
            </button>
          </div>
        </div>

        {/* Control center popover */}
        {controlCenterOpen && (
          <div className="glass win-enter" onClick={(e) => e.stopPropagation()}
            style={{ position: 'absolute', top: 40, right: 12, width: 260, borderRadius: 16, padding: 16, zIndex: 300 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button onClick={() => setWifiOn((w) => !w)} style={{ flex: 1, padding: 10, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: wifiOn ? `linear-gradient(135deg, ${accent}, ${accent2})` : 'rgba(255,255,255,0.08)', color: wifiOn ? '#0A0A0F' : cream, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Wifi size={16} /><span style={{ fontSize: 10 }}>Wi‑Fi</span>
              </button>
              <button onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} style={{ flex: 1, padding: 10, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.08)', color: cream, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {isDark ? <Moon size={16} /> : <Sun size={16} />}<span style={{ fontSize: 10 }}>{isDark ? 'Dark' : 'Light'}</span>
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(237,235,245,0.6)', marginBottom: 6 }}>VOLUME</div>
            <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(+e.target.value)} style={{ width: '100%', marginBottom: 14, accentColor: accent }} />
            <div style={{ fontSize: 11, color: 'rgba(237,235,245,0.6)', marginBottom: 6 }}>WALLPAPER</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.keys(WALLPAPERS).map((k) => (
                <button key={k} onClick={() => setWallpaper(k)} title={k}
                  style={{ width: 34, height: 34, borderRadius: 10, cursor: 'pointer', background: WALLPAPERS[k],
                    border: wallpaper === k ? `2px solid ${accent2}` : '2px solid rgba(255,255,255,0.15)' }} />
              ))}
            </div>
          </div>
        )}

        {/* WINDOWS */}
        {windows.filter((w) => !w.minimized).map((win) => (
          <WindowFrame key={win.id} win={win} active={activeId === win.id} accent={accent} accent2={accent2} chrome={chrome} cream={cream} isDark={isDark} parallax={parallax}
            onFocus={() => focusWindow(win.id)} onClose={() => closeWindow(win.id)} onMinimize={() => minimizeWindow(win.id)}
            onMaximize={() => toggleMaximize(win.id)} onDragStart={(e) => startDrag(e, win)} onResizeStart={(e) => startResize(e, win)}>
            <AppBody win={win} patchState={patchState} installedApps={installedApps} installApp={installApp}
              onOpenCheckout={() => setShowCheckout(true)} accent={accent} accent2={accent2} isDark={isDark} now={now} />
          </WindowFrame>
        ))}

        {/* CHECKOUT MODAL */}
        {showCheckout && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowCheckout(false)}>
            <div className="glass win-enter" onClick={(e) => e.stopPropagation()} style={{ width: 320, borderRadius: 20, padding: 22 }}>
              <div style={{ borderRadius: 14, padding: 16, background: `linear-gradient(135deg, ${accent}, ${accent2})`, color: '#0A0A0F', marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 1.5, opacity: 0.8 }}>AETHEROS PRO</div>
                <div className="disp" style={{ fontSize: 17, margin: '16px 0 4px', letterSpacing: 2 }}>•••• •••• •••• 4242</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.8 }}><span>GUEST USER</span><span>12/29</span></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="disp" style={{ fontSize: 16, marginBottom: 6 }}>Upgrade to Pro — $9/mo</div>
                <p style={{ fontSize: 12, color: 'rgba(237,235,245,0.6)', marginBottom: 14 }}>Design preview only — no payment is processed.</p>
                <button onClick={() => setShowCheckout(false)} style={{ background: cream, color: ink, border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TASKBAR / DOCK */}
        <div className="glass" style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', borderRadius: 18, padding: '8px 10px', display: 'flex', gap: 6, zIndex: 250 }}
          onClick={(e) => e.stopPropagation()}>
          {PINNED.map((appId) => {
            const meta = APP_REGISTRY[appId];
            const Icon = meta.icon;
            const openWin = windows.find((w) => w.appId === appId);
            return (
              <button key={appId} onClick={() => openApp(appId)} className="icon-btn"
                style={{ width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                  background: openWin ? 'rgba(123,92,255,0.25)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={cream} />
                {openWin && <span style={{ position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: '50%', background: accent2 }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Window chrome
// ---------------------------------------------------------------------------
function WindowFrame({ win, active, accent, accent2, chrome, cream, isDark, parallax, onFocus, onClose, onMinimize, onMaximize, onDragStart, onResizeStart, children }) {
  const tiltX = active && !win.maximized ? parallax.y * -3.5 : 0;
  const tiltY = active && !win.maximized ? parallax.x * 3.5 : 0;
  const style = win.maximized
    ? { position: 'absolute', top: 34, left: 0, right: 0, bottom: 70, width: 'auto', height: 'auto' }
    : { position: 'absolute', top: win.y, left: win.x, width: win.w, height: win.h };
  return (
    <div className="win-enter" onMouseDown={onFocus} style={{
      ...style, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: chrome, backdropFilter: 'blur(20px)', border: `1px solid ${active ? accent : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')}`,
      boxShadow: active ? `0 30px 70px rgba(0,0,0,0.5), 0 0 0 1px ${accent}33` : '0 12px 40px rgba(0,0,0,0.3)',
      transform: `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
      transition: 'transform 0.2s ease-out, box-shadow 0.2s ease',
      zIndex: win.z,
    }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        background: 'linear-gradient(115deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.02) 25%, transparent 50%)' }} />
      <div onPointerDown={onDragStart} style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', cursor: win.maximized ? 'default' : 'grab', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={onClose} style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57', border: 'none', cursor: 'pointer' }} />
          <button onClick={onMinimize} style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E', border: 'none', cursor: 'pointer' }} />
          <button onClick={onMaximize} style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840', border: 'none', cursor: 'pointer' }} />
        </div>
        <div className="disp" style={{ fontSize: 12, color: cream, opacity: 0.85 }}>{win.title}</div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>{children}</div>
      {!win.maximized && (
        <div onPointerDown={onResizeStart} style={{ position: 'absolute', right: 2, bottom: 2, width: 14, height: 14, cursor: 'nwse-resize' }}>
          <svg width="14" height="14" style={{ opacity: 0.4 }}><path d="M14 0 L0 14 M14 6 L6 14 M14 12 L12 14" stroke={cream} strokeWidth="1.2" /></svg>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// App bodies
// ---------------------------------------------------------------------------
function AppBody({ win, patchState, installedApps, installApp, onOpenCheckout, accent, accent2, isDark, now }) {
  const s = win.state;
  const set = (patch) => patchState(win.id, patch);
  const textMuted = isDark ? 'rgba(237,235,245,0.55)' : 'rgba(22,20,33,0.55)';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const panelBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  if (win.appId === 'explorer') {
    const toggle = (name) => set({ expanded: { ...s.expanded, [name]: !s.expanded[name] } });
    const renderNode = (node, depth) => (
      <div key={node.name}>
        <div onClick={() => (node.type === 'folder' ? toggle(node.name) : set({ selected: node }))}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', paddingLeft: 10 + depth * 16, borderRadius: 8, cursor: 'pointer',
            background: s.selected?.name === node.name ? 'rgba(123,92,255,0.18)' : 'transparent', fontSize: 13 }}>
          {node.type === 'folder' ? (s.expanded[node.name] ? <FolderOpen size={14} color={accent2} /> : <Folder size={14} color={accent2} />) : <FileText size={14} color={textMuted} />}
          {node.name}
        </div>
        {node.type === 'folder' && s.expanded[node.name] && node.children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
    return (
      <div style={{ display: 'flex', height: '100%', fontSize: 13 }}>
        <div style={{ width: '48%', borderRight: `1px solid ${border}`, overflowY: 'auto', padding: 8 }}>{renderNode(FILE_TREE, 0)}</div>
        <div style={{ flex: 1, padding: 16 }}>
          {s.selected ? (
            <>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{s.selected.name}</div>
              <div style={{ color: textMuted, whiteSpace: 'pre-wrap', fontSize: 12.5, lineHeight: 1.6 }}>{s.selected.preview}</div>
            </>
          ) : <div style={{ color: textMuted }}>Select a file to preview it.</div>}
        </div>
      </div>
    );
  }

  if (win.appId === 'terminal') {
    const run = (cmd) => {
      const trimmed = cmd.trim();
      let out = '';
      const [head, ...rest] = trimmed.split(' ');
      switch (head) {
        case 'help': out = 'Commands: help, whoami, date, ls, echo [text], neofetch, clear'; break;
        case 'whoami': out = 'guest@aetheros'; break;
        case 'date': out = new Date().toString(); break;
        case 'ls': out = FILE_TREE.children.map((c) => c.name).join('  '); break;
        case 'echo': out = rest.join(' '); break;
        case 'neofetch': out = 'AetherOS v1.0\nKernel: web-runtime\nShell: aether-sh\nUptime: session'; break;
        case 'clear': set({ history: [] }); return;
        case '': return;
        default: out = `command not found: ${head}`;
      }
      set({ history: [...s.history, { type: 'input', text: trimmed }, { type: 'output', text: out }] });
    };
    return (
      <div style={{ height: '100%', padding: 12, fontFamily: 'monospace', fontSize: 12.5, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {s.history.map((line, i) => (
            <div key={i} style={{ color: line.type === 'input' ? accent2 : (isDark ? '#D8D6E8' : '#161421'), marginBottom: 2 }}>
              {line.type === 'input' ? `guest@aetheros ~ % ${line.text}` : line.text}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span style={{ color: accent2 }}>%</span>
          <input className="term-input" value={s.input} onChange={(e) => set({ input: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') { run(s.input); set({ input: '' }); } }}
            style={{ flex: 1, background: 'transparent', border: 'none', color: isDark ? '#D8D6E8' : '#161421', fontFamily: 'monospace', fontSize: 12.5 }} autoFocus />
        </div>
      </div>
    );
  }

  if (win.appId === 'editor') {
    const tabNames = Object.keys(s.tabs);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>
          {tabNames.map((t) => (
            <button key={t} onClick={() => set({ active: t })} style={{ padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 12,
              background: s.active === t ? panelBg : 'transparent', color: isDark ? cream_ : undefined, borderBottom: s.active === t ? `2px solid ${accent}` : '2px solid transparent' }}>
              {t}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 10 }}>
            <button onClick={() => set({ savedAt: Date.now() })} style={{ fontSize: 11, background: accent, color: '#0A0A0F', border: 'none', padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              {s.savedAt ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        <textarea value={s.tabs[s.active]} onChange={(e) => set({ tabs: { ...s.tabs, [s.active]: e.target.value }, savedAt: null })}
          style={{ flex: 1, border: 'none', resize: 'none', padding: 14, fontFamily: 'monospace', fontSize: 13, background: 'transparent', color: isDark ? '#EDEBF5' : '#161421' }} />
      </div>
    );
  }

  if (win.appId === 'media') {
    const track = TRACKS[s.trackIndex];
    const pct = Math.min(100, (s.elapsed / track.duration) * 100);
    return (
      <div style={{ height: '100%', padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 16, background: `linear-gradient(135deg, ${accent}, ${accent2})`, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Music2 size={40} color="#0A0A0F" />
        </div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{track.title}</div>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 14 }}>{track.artist}</div>
        <div style={{ width: '100%', height: 4, background: border, borderRadius: 4, marginBottom: 6 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: accent, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 10.5, color: textMuted, marginBottom: 16 }}>
          <span>{formatTime(s.elapsed)}</span><span>{formatTime(track.duration)}</span>
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <button onClick={() => set({ trackIndex: (s.trackIndex - 1 + TRACKS.length) % TRACKS.length, elapsed: 0 })} style={{ background: 'none', border: 'none', color: isDark ? cream_ : undefined, cursor: 'pointer' }}><SkipBack size={18} /></button>
          <button onClick={() => set({ playing: !s.playing })} style={{ background: accent, border: 'none', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {s.playing ? <Pause size={18} color="#0A0A0F" /> : <Play size={18} color="#0A0A0F" />}
          </button>
          <button onClick={() => set({ trackIndex: (s.trackIndex + 1) % TRACKS.length, elapsed: 0 })} style={{ background: 'none', border: 'none', color: isDark ? cream_ : undefined, cursor: 'pointer' }}><SkipForward size={18} /></button>
        </div>
      </div>
    );
  }

  if (win.appId === 'browser') {
    const go = (addr) => set({ address: addr, history: [...s.history.slice(0, s.historyIndex + 1), addr], historyIndex: s.historyIndex + 1 });
    const shortcuts = ['aether://mail', 'aether://docs', 'aether://news', 'aether://weather'];
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: `1px solid ${border}` }}>
          <ChevronLeft size={15} style={{ opacity: s.historyIndex > 0 ? 1 : 0.3, cursor: 'pointer' }} onClick={() => s.historyIndex > 0 && set({ historyIndex: s.historyIndex - 1, address: s.history[s.historyIndex - 1] })} />
          <ChevronRight size={15} style={{ opacity: s.historyIndex < s.history.length - 1 ? 1 : 0.3, cursor: 'pointer' }} onClick={() => s.historyIndex < s.history.length - 1 && set({ historyIndex: s.historyIndex + 1, address: s.history[s.historyIndex + 1] })} />
          <RefreshCw size={13} style={{ opacity: 0.6 }} />
          <div style={{ flex: 1, background: panelBg, borderRadius: 8, padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={12} style={{ opacity: 0.5 }} />
            <input value={s.address} onChange={(e) => set({ address: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && go(s.address)}
              style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 12, color: isDark ? cream_ : undefined }} />
          </div>
        </div>
        <div style={{ flex: 1, padding: 24, textAlign: 'center' }}>
          {s.address === 'aether://home' ? (
            <>
              <div className="disp" style={{ fontSize: 18, marginBottom: 18 }}>Start Page</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {shortcuts.map((sc) => (
                  <button key={sc} onClick={() => go(sc)} style={{ padding: '10px 16px', borderRadius: 10, background: panelBg, border: `1px solid ${border}`, cursor: 'pointer', fontSize: 12, color: isDark ? cream_ : undefined }}>{sc}</button>
                ))}
              </div>
            </>
          ) : (
            <div>
              <div className="disp" style={{ fontSize: 16, marginBottom: 8 }}>{s.address}</div>
              <div style={{ color: textMuted, fontSize: 12 }}>Demo page — this is a mock destination inside the AetherOS browser sandbox.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (win.appId === 'store') {
    return (
      <div style={{ height: '100%', padding: 18, overflowY: 'auto' }}>
        <div style={{ borderRadius: 14, padding: 16, background: `linear-gradient(120deg, ${accent}, ${accent2})`, color: '#0A0A0F', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="disp" style={{ fontSize: 15 }}>AetherOS Pro</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Unlock cloud sync &amp; extra storage</div>
          </div>
          <button onClick={onOpenCheckout} style={{ background: '#0A0A0F', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Upgrade</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {STORE_APPS.map((id) => {
            const meta = APP_REGISTRY[id];
            const Icon = meta.icon;
            const installed = installedApps.has(id);
            return (
              <div key={id} style={{ border: `1px solid ${border}`, borderRadius: 12, padding: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: panelBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icon size={16} color={accent2} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{meta.title}</div>
                <button onClick={() => installApp(id)} disabled={installed}
                  style={{ fontSize: 11, width: '100%', padding: '6px 0', borderRadius: 8, border: `1px solid ${border}`, cursor: installed ? 'default' : 'pointer',
                    background: installed ? 'rgba(46,217,195,0.15)' : 'transparent', color: installed ? accent2 : (isDark ? cream_ : undefined), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {installed ? <><Check size={12} /> Installed</> : 'Install'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (win.appId === 'settings') {
    return (
      <div style={{ padding: 18, fontSize: 13 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>SYSTEM</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${border}` }}><span>Version</span><span style={{ color: textMuted }}>AetherOS 1.0</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${border}` }}><span>Runtime</span><span style={{ color: textMuted }}>Browser-native</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>Installed apps</span><span style={{ color: textMuted }}>{PINNED.length + installedApps.size}</span></div>
        </div>
        <div style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>Use the control center (top-right icons) to change theme, wallpaper, and volume.</div>
      </div>
    );
  }

  if (win.appId === 'calculator') {
    const press = (v) => {
      if (v === 'C') return set({ display: '0', expr: '' });
      if (v === '=') {
        try {
          const clean = s.expr.replace(/[^0-9+\-*/.() ]/g, '');
          // eslint-disable-next-line no-new-func
          const result = Function(`"use strict"; return (${clean || 0})`)();
          return set({ display: String(result), expr: String(result) });
        } catch { return set({ display: 'Error', expr: '' }); }
      }
      const newExpr = s.expr === '0' ? v : s.expr + v;
      set({ expr: newExpr, display: newExpr });
    };
    const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'];
    return (
      <div style={{ padding: 14, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'right', fontSize: 26, padding: '14px 8px', marginBottom: 10, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.display}</div>
        <button onClick={() => press('C')} style={{ marginBottom: 8, fontSize: 12, padding: 6, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: isDark ? cream_ : undefined, cursor: 'pointer' }}>Clear</button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, flex: 1 }}>
          {keys.map((k) => (
            <button key={k} onClick={() => press(k)} style={{
              borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15,
              background: k === '=' ? accent : (['+', '-', '*', '/'].includes(k) ? 'rgba(123,92,255,0.2)' : panelBg),
              color: k === '=' ? '#0A0A0F' : (isDark ? cream_ : '#161421'),
            }}>{k}</button>
          ))}
        </div>
      </div>
    );
  }

  if (win.appId === 'notes') {
    return <textarea value={s.text} onChange={(e) => set({ text: e.target.value })}
      style={{ width: '100%', height: '100%', border: 'none', resize: 'none', padding: 16, background: 'repeating-linear-gradient(#FFF4B8 0px, #FFF4B8 27px, #F0E39C 28px)', color: '#3A3316', fontSize: 14, lineHeight: '28px', fontFamily: "'Space Grotesk', sans-serif" }} />;
  }

  if (win.appId === 'calendar') {
    const year = now.getFullYear(), month = now.getMonth();
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
    return (
      <div style={{ padding: 16 }}>
        <div className="disp" style={{ fontSize: 15, marginBottom: 12, textAlign: 'center' }}>{now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, fontSize: 10, color: textMuted, marginBottom: 4, textAlign: 'center' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((d, i) => (
            <div key={i} style={{ aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontSize: 12,
              background: d === now.getDate() ? accent : 'transparent', color: d === now.getDate() ? '#0A0A0F' : (isDark ? cream_ : '#161421') }}>
              {d || ''}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (win.appId === 'weather') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <CloudSun size={48} color={accent2} style={{ marginBottom: 12 }} />
        <div className="disp" style={{ fontSize: 34 }}>68°</div>
        <div style={{ fontSize: 13, color: textMuted, marginBottom: 18 }}>Partly Cloudy · Aether City</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: textMuted }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
            <div key={d}><div>{d}</div><div style={{ color: isDark ? cream_ : '#161421', marginTop: 4 }}>{64 + i}°</div></div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: textMuted, marginTop: 16 }}>Demo data — not a live forecast.</div>
      </div>
    );
  }

  if (win.appId === 'photos') {
    const grads = [
      'linear-gradient(135deg,#7B5CFF,#2ED9C3)', 'linear-gradient(135deg,#FF8A50,#B8622E)',
      'linear-gradient(135deg,#0EA5C4,#164E63)', 'linear-gradient(135deg,#FEBC2E,#FF5F57)',
      'linear-gradient(135deg,#2ED9C3,#164E63)', 'linear-gradient(135deg,#7B5CFF,#FF8A50)',
    ];
    return (
      <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {grads.map((g, i) => <div key={i} style={{ aspectRatio: '1/1', borderRadius: 10, background: g }} />)}
      </div>
    );
  }

  return null;
}

const cream_ = '#EDEBF5';
