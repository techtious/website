import { useState, useRef, useEffect, type ReactNode } from 'react';

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*{1,2}[^*]+\*{1,2}|\[[^\]]+\]\(https?:\/\/[^)]+\)|https?:\/\/[^\s,)]+)/g).map((part, i) => {
    if (/^\*{1,2}[^*]+\*{1,2}$/.test(part)) {
      const inner = part.replace(/^\*{1,2}/, '').replace(/\*{1,2}$/, '');
      return <strong key={i} style={{ fontWeight: 600, color: '#fff' }}>{inner}</strong>;
    }
    const mdLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (mdLink) return <a key={i} href={mdLink[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'underline' }}>{mdLink[1]}</a>;
    if (/^https?:\/\//.test(part)) return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#38BDF8', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a>;
    return part as unknown as ReactNode;
  });
}

function renderContent(text: string): ReactNode {
  const blocks = text.split(/\n\n+/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim());
        const isBulletList = lines.length > 0 && lines.every(l => /^[-*✅]\s?/.test(l));
        const isNumberedList = lines.length > 0 && lines.every(l => /^\d+\.\s/.test(l));
        if (isBulletList) return (
          <ul key={bi} style={{ margin: bi === 0 ? 0 : '8px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
            {lines.map((item, ii) => <li key={ii}>{renderInline(item.replace(/^[-*✅]\s?/, ''))}</li>)}
          </ul>
        );
        if (isNumberedList) return (
          <ol key={bi} style={{ margin: bi === 0 ? 0 : '8px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
            {lines.map((item, ii) => <li key={ii}>{renderInline(item.replace(/^\d+\.\s/, ''))}</li>)}
          </ol>
        );
        const heading = block.match(/^#{1,6}\s+(.+)/);
        if (heading) return <p key={bi} style={{ margin: bi === 0 ? 0 : '8px 0 0', fontWeight: 600 }}>{renderInline(heading[1])}</p>;
        return <p key={bi} style={{ margin: bi === 0 ? 0 : '8px 0 0' }}>{renderInline(block.replace(/\n/g, ' '))}</p>;
      })}
    </>
  );
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = import.meta.env.PUBLIC_CHAT_API_URL || 'http://localhost:3001';

const WELCOME: Message = {
  role: 'assistant',
  content: "Hi! I'm the Techtious assistant. Ask me anything about our services, products, or how we work — I'm happy to help.",
};

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [leadName, setLeadName]         = useState('');
  const [leadEmail, setLeadEmail]       = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadDone, setLeadDone]         = useState(false);

  const showLeadForm = messages.length >= 3 && !loading && !leadDone;

  async function submitLead() {
    if (!leadName.trim() || !leadEmail.trim() || leadSubmitting) return;
    setLeadSubmitting(true);
    try {
      await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: leadName.trim(), email: leadEmail.trim() }),
      });
    } finally {
      setLeadSubmitting(false);
      setLeadDone(true);
    }
  }
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('techtious:open-chat', handler);
    return () => window.removeEventListener('techtious:open-chat', handler);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 180);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: updated[updated.length - 1].content + parsed.text,
                };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again or email us at sales@techtious.com.',
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* ── Floating open button — hidden when chat is open ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 1100,
            width: 54, height: 54, borderRadius: '50%',
            background: '#0891B2',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(8,145,178,.4)',
            animation: 'chatBtnIn .4s ease .3s both',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      )}

      {/* ── Full-page overlay ── */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1050,
          display: 'flex', flexDirection: 'column',
          background: '#0B1E30',
          animation: 'chatFadeIn .5s cubic-bezier(.16,1,.3,1)',
        }}>

          {/* Top-right controls */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            padding: '20px 28px',
            display: 'flex', alignItems: 'center', gap: 16,
            zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* AI chip icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.5" strokeLinecap="round">
                <rect x="7" y="7" width="10" height="10" rx="1.5"/>
                <line x1="9" y1="7" x2="9" y2="4"/><line x1="12" y1="7" x2="12" y2="4"/><line x1="15" y1="7" x2="15" y2="4"/>
                <line x1="9" y1="17" x2="9" y2="20"/><line x1="12" y1="17" x2="12" y2="20"/><line x1="15" y1="17" x2="15" y2="20"/>
                <line x1="7" y1="9" x2="4" y2="9"/><line x1="7" y1="12" x2="4" y2="12"/><line x1="7" y1="15" x2="4" y2="15"/>
                <line x1="17" y1="9" x2="20" y2="9"/><line x1="17" y1="12" x2="20" y2="12"/><line x1="17" y1="15" x2="20" y2="15"/>
              </svg>
              <span style={{ fontSize: 12, color: '#0891B2', fontWeight: 500, letterSpacing: 0.5 }}>Techtious AI</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)', padding: 4,
                display: 'flex', alignItems: 'center',
                transition: 'color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '64px 0 24px' }}>
            <div style={{
              maxWidth: 860, margin: '0 auto', padding: '0 48px',
              display: 'flex', flexDirection: 'column', gap: 32,
            }}>
              {messages.map((m, i) => (
                m.role === 'user' ? (
                  <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{
                      background: 'rgba(8,145,178,0.12)',
                      border: '1px solid rgba(8,145,178,0.28)',
                      borderRadius: 20, padding: '9px 20px',
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: 14, lineHeight: 1.6, maxWidth: '60%',
                    }}>
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} style={{
                    color: 'rgba(255,255,255,0.88)',
                    fontSize: 15.5, lineHeight: 1.85, fontWeight: 300,
                    wordBreak: 'break-word',
                  }}>
                    {m.content
                      ? renderContent(m.content)
                      : (loading && i === messages.length - 1
                        ? <span style={{ opacity: .35, fontStyle: 'italic' }}>Thinking…</span>
                        : '')
                    }
                  </div>
                )
              ))}

              {/* Lead capture card */}
              {showLeadForm && (
                <div style={{
                  background: 'rgba(8,145,178,0.07)',
                  border: '1px solid rgba(8,145,178,0.2)',
                  borderRadius: 16, padding: '20px 24px',
                }}>
                  {leadDone ? null : (
                    <>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.5 }}>
                        <strong>Connect with our team.</strong> Leave your details and we'll reach out.
                      </p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                          placeholder="Your name"
                          value={leadName}
                          onChange={e => setLeadName(e.target.value)}
                          style={{
                            flex: 1, minWidth: 120,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 24, padding: '9px 16px',
                            fontSize: 13.5, color: '#fff', outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                        <input
                          placeholder="Work email"
                          type="email"
                          value={leadEmail}
                          onChange={e => setLeadEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && submitLead()}
                          style={{
                            flex: 1, minWidth: 160,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 24, padding: '9px 16px',
                            fontSize: 13.5, color: '#fff', outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                        <button
                          onClick={submitLead}
                          disabled={!leadName.trim() || !leadEmail.trim() || leadSubmitting}
                          style={{
                            background: '#0891B2', border: 'none',
                            borderRadius: 24, padding: '9px 22px',
                            fontSize: 13.5, fontWeight: 500, color: '#fff',
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            opacity: (!leadName.trim() || !leadEmail.trim()) ? 0.45 : 1,
                            transition: 'opacity .15s, background .15s',
                          }}
                        >
                          {leadSubmitting ? 'Sending…' : 'Get in touch'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {leadDone && (
                <p style={{ fontSize: 13, color: 'rgba(8,145,178,0.8)', margin: 0 }}>
                  Thanks, {leadName.split(' ')[0]}! We'll reach out to {leadEmail} shortly.
                </p>
              )}

              {/* Typing dots */}
              {loading && messages[messages.length - 1]?.content === '' && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingTop: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#0891B2',
                      animation: `dotPulse 1.2s ease ${i * 0.18}s infinite`,
                    }}/>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input bar */}
          <div style={{
            background: 'rgba(0,0,0,0.28)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: '16px 48px 20px',
            flexShrink: 0,
          }}>
            <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                }}
                onKeyDown={onKeyDown}
                placeholder="Ask anything about Techtious…"
                disabled={loading}
                rows={1}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '12px 18px',
                  fontSize: 14.5,
                  fontFamily: 'inherit',
                  fontWeight: 300,
                  outline: 'none',
                  color: '#fff',
                  resize: 'none',
                  lineHeight: 1.5,
                  transition: 'border-color .15s ease',
                  overflowY: 'auto',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(8,145,178,0.55)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                style={{
                  background: '#0891B2',
                  border: 'none', borderRadius: 12,
                  width: 46, height: 46, flexShrink: 0,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: (!input.trim() || loading) ? 0.35 : 1,
                  transition: 'opacity .15s, background .15s',
                }}
                onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.background = '#0779A0'; }}
                onMouseLeave={e => (e.currentTarget.style.background = '#0891B2')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <div style={{ maxWidth: 860, margin: '8px auto 0' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                Enter to send · Shift+Enter for new line · <a href="mailto:sales@techtious.com" style={{ color: 'rgba(8,145,178,0.6)', textDecoration: 'none' }}>sales@techtious.com</a>
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatBtnIn {
          from { opacity: 0; transform: scale(.7) translateY(12px); }
          to   { opacity: 1; transform: scale(1)  translateY(0); }
        }
        @keyframes chatFadeIn {
          from { opacity: 0; transform: scale(.97) translateY(12px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(1);   opacity: .35; }
          40%            { transform: scale(1.35); opacity: 1;   }
        }
      `}</style>
    </>
  );
}
