import { useState } from 'react';

const SOLUTIONS = [
  {
    name: 'Optix AI',
    sub: 'FinOps & K8s cost intelligence',
    href: '/optix-ai',
    gradient: 'linear-gradient(135deg,#0891B2,#06B6D4)',
    badge: 'Live', badgeColor: '#10B981', badgeBg: '#ECFDF5',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z" fill="#fff"/></svg>,
  },
  {
    name: 'SRE Intelligence',
    sub: 'Log analytics & stability',
    href: '/sre-intelligence',
    gradient: 'linear-gradient(135deg,#D97706,#F59E0B)',
    badge: 'Beta', badgeColor: '#D97706', badgeBg: '#FFFBEB',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="12" r="3" fill="#fff"/></svg>,
  },
  {
    name: 'DriftGuard',
    sub: 'Environment sync & drift detection',
    href: '/driftguard',
    gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)',
    badge: 'Soon', badgeColor: '#64748B', badgeBg: '#F1F5F9',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="17 1 21 5 17 9" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M3 11V9a4 4 0 0 1 4-4h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><polyline points="7 23 3 19 7 15" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M21 13v2a4 4 0 0 1-4 4H3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
  },
];

const SERVICES = [
  { name: 'Cloud Engineering', sub: 'AWS · GCP · Azure architecture' },
  { name: 'Platform Engineering', sub: 'Kubernetes · IDP · developer portals' },
  { name: 'Gen AI Solutions', sub: 'Agentic systems · LLM pipelines' },
  { name: 'Observability & SRE', sub: 'Monitoring · reliability · SLOs' },
  { name: 'Migration & Modernization', sub: 'Lift-shift · re-architecture' },
];

const ServiceIcon = ({ name }: { name: string }) => {
  if (name === 'Cloud Engineering') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.8" strokeLinecap="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>;
  if (name === 'Platform Engineering') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
  if (name === 'Gen AI Solutions') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></svg>;
  if (name === 'Observability & SRE') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.8" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
};

export default function Nav() {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSolutions, setMobileSolutions] = useState(false);
  const [mobileServices, setMobileServices] = useState(false);

  return (
    <nav className="site-nav">
      <div className="nav-inner">
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="https://techtious.com/images/Logo.svg" alt="Techtious" style={{ height: 36, width: 'auto' }} />
        </a>

        {/* Desktop links */}
        <div className="nav-links">
          {/* Solutions dropdown */}
          <div style={{ position: 'relative' }}
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}>
            <span style={{ cursor: 'pointer', fontWeight: 500, color: '#0B1E30', display: 'flex', alignItems: 'center', gap: 4 }}>
              Solutions
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0B1E30" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            {solutionsOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '1px solid #E2EAF0', borderRadius: 12, padding: 8, boxShadow: '0 8px 28px rgba(11,30,48,.14)', minWidth: 268, zIndex: 300 }}>
                {SOLUTIONS.map(s => (
                  <a key={s.name} href={s.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, textDecoration: 'none' }}>
                    <div style={{ width: 32, height: 32, background: s.gradient, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1E30' }}>{s.name}</div>
                      <div style={{ fontSize: 11.5, color: '#8AA0B0', fontWeight: 300 }}>{s.sub}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: s.badgeColor, background: s.badgeBg, padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{s.badge}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Services dropdown */}
          <div style={{ position: 'relative' }}
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}>
            <span style={{ cursor: 'pointer', color: '#4A5F72', display: 'flex', alignItems: 'center', gap: 4 }}>
              Services
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4A5F72" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            {servicesOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '1px solid #E2EAF0', borderRadius: 12, padding: 8, boxShadow: '0 8px 28px rgba(11,30,48,.14)', minWidth: 280, zIndex: 300 }}>
                {SERVICES.map(s => (
                  <a key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, textDecoration: 'none', cursor: 'pointer' }}>
                    <div style={{ width: 32, height: 32, background: '#EEF6FB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ServiceIcon name={s.name}/></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1E30' }}>{s.name}</div>
                      <div style={{ fontSize: 11.5, color: '#8AA0B0', fontWeight: 300 }}>{s.sub}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <a href="/about" style={{ cursor: 'pointer', color: '#4A5F72', textDecoration: 'none' }}>About Us</a>
          <span style={{ cursor: 'pointer', color: '#4A5F72' }}>Blog</span>
        </div>

        <a href="https://cal.com/techtious/30min" target="_blank" rel="noopener" className="nav-cta-btn">Book a Call</a>

        {/* Mobile hamburger */}
        <button className="nav-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
          {mobileOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B1E30" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B1E30" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </div>

      {/* Mobile panel */}
      <div className={`nav-mobile-panel${mobileOpen ? ' open' : ''}`}>
        <div className="nav-mobile-inner">
          {/* Solutions */}
          <button className="nav-mobile-link" onClick={() => setMobileSolutions(o => !o)}>
            Solutions
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8AA0B0" strokeWidth="2" strokeLinecap="round" style={{ transform: mobileSolutions ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {mobileSolutions && (
            <div className="nav-mobile-sub">
              {SOLUTIONS.map(s => (
                <a key={s.name} href={s.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid #F0F4F8', textDecoration: 'none' }}>
                  <div style={{ width: 26, height: 26, background: s.gradient, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0B1E30' }}>{s.name}</div>
                    <div style={{ fontSize: 11.5, color: '#8AA0B0', fontWeight: 300 }}>{s.sub}</div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Services */}
          <button className="nav-mobile-link" onClick={() => setMobileServices(o => !o)}>
            Services
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8AA0B0" strokeWidth="2" strokeLinecap="round" style={{ transform: mobileServices ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {mobileServices && (
            <div className="nav-mobile-sub">
              {SERVICES.map(s => (
                <a key={s.name} style={{ display: 'block', padding: '11px 16px', borderBottom: '1px solid #F0F4F8', fontSize: 13.5, fontWeight: 400, color: '#4A5F72', textDecoration: 'none' }}>{s.name}</a>
              ))}
            </div>
          )}

          <a href="/about" className="nav-mobile-link" style={{ textDecoration: 'none' }}>About Us</a>
          <a href="https://cal.com/techtious/30min" target="_blank" rel="noopener" className="nav-mobile-cta">Book a Call</a>
        </div>
      </div>
    </nav>
  );
}
