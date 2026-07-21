import { useState, useRef, useEffect, type ReactNode } from 'react';

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s,)]+)/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part)) return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#0891B2', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a>;
    return part as unknown as ReactNode;
  });
}

function renderContent(text: string): ReactNode {
  const blocks = text.split(/\n\n+/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim());
        const isList = lines.length > 0 && lines.every(l => /^[-*]\s/.test(l));
        if (isList) return (
          <ul key={bi} style={{ margin: bi === 0 ? 0 : '8px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
            {lines.map((item, ii) => <li key={ii}>{renderInline(item.replace(/^[-*]\s/, ''))}</li>)}
          </ul>
        );
        const heading = block.match(/^#{1,3}\s+(.+)/);
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
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1100,
          width: 54, height: 54, borderRadius: '50%',
          background: open ? '#0B1E30' : '#0891B2',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(8,145,178,.4)',
          transition: 'background .2s ease, transform .2s ease',
          animation: 'chatBtnIn .4s ease .3s both',
        }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* ── Full-page overlay ── */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1050,
          display: 'flex', flexDirection: 'column',
          background: '#F4F7FA',
          animation: 'chatFadeIn .18s ease',
        }}>

          {/* Header */}
          <div style={{
            background: '#0B1E30',
            padding: '0 32px',
            height: 68,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#0891B2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Techtious Assistant</div>
                <div style={{ fontSize: 11.5, color: '#6A8EA0', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', flexShrink: 0 }}/>
                  Online · Ask me anything
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 8, color: '#8AADBE', cursor: 'pointer',
                padding: '7px 16px', fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background .15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.13)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.07)')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Close
            </button>
          </div>

          {/* Messages area */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '40px 0',
          }}>
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {messages.map((m, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 12,
                  alignItems: 'flex-end',
                }}>
                  {/* Assistant avatar */}
                  {m.role === 'assistant' && (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#0891B2', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                  )}

                  <div style={{
                    maxWidth: '75%',
                    background: m.role === 'user' ? '#0891B2' : '#fff',
                    color: m.role === 'user' ? '#fff' : '#0B1E30',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '13px 18px',
                    fontSize: 14.5,
                    fontWeight: 300,
                    lineHeight: 1.7,
                    wordBreak: 'break-word',
                    boxShadow: m.role === 'assistant' ? '0 2px 12px rgba(11,30,48,.07)' : 'none',
                    border: m.role === 'assistant' ? '1px solid #E2EAF0' : 'none',
                  }}>
                    {m.content
                      ? (m.role === 'assistant' ? renderContent(m.content) : m.content)
                      : (loading && i === messages.length - 1
                        ? <span style={{ opacity: .4, fontStyle: 'italic' }}>Thinking…</span>
                        : '')
                    }
                  </div>

                  {/* User avatar */}
                  {m.role === 'user' && (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#0B1E30', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 600, color: '#6A8EA0',
                    }}>
                      U
                    </div>
                  )}
                </div>
              ))}

              {/* Typing dots */}
              {loading && messages[messages.length - 1]?.content === '' && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#0891B2', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div style={{
                    background: '#fff', border: '1px solid #E2EAF0',
                    borderRadius: '18px 18px 18px 4px',
                    padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center',
                    boxShadow: '0 2px 12px rgba(11,30,48,.07)',
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#0891B2',
                        animation: `dotPulse 1.2s ease ${i * 0.18}s infinite`,
                      }}/>
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input bar */}
          <div style={{
            borderTop: '1px solid #E2EAF0',
            background: '#fff',
            padding: '16px 24px',
            flexShrink: 0,
          }}>
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
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
                  border: '1.5px solid #E2EAF0',
                  borderRadius: 12,
                  padding: '11px 16px',
                  fontSize: 14.5,
                  fontFamily: 'inherit',
                  fontWeight: 300,
                  outline: 'none',
                  color: '#0B1E30',
                  background: '#FAFAF8',
                  resize: 'none',
                  lineHeight: 1.5,
                  transition: 'border-color .15s ease',
                  overflowY: 'auto',
                }}
                onFocus={e => (e.target.style.borderColor = '#0891B2')}
                onBlur={e => (e.target.style.borderColor = '#E2EAF0')}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                style={{
                  background: '#0891B2',
                  border: 'none',
                  borderRadius: 12,
                  width: 44, height: 44,
                  flexShrink: 0,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: (!input.trim() || loading) ? 0.4 : 1,
                  transition: 'opacity .15s ease, background .15s ease',
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
            <div style={{ maxWidth: 720, margin: '8px auto 0', textAlign: 'center' }}>
              <span style={{ fontSize: 11.5, color: '#A0B4C0' }}>
                Press Enter to send · Shift+Enter for new line · <a href="mailto:sales@techtious.com" style={{ color: '#0891B2', textDecoration: 'none' }}>sales@techtious.com</a>
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
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(1);   opacity: .35; }
          40%            { transform: scale(1.35); opacity: 1;   }
        }
      `}</style>
    </>
  );
}
