import { useState, useRef, useEffect } from 'react';

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
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    // Add empty assistant message we'll stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
    } catch (err) {
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

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open chat"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: '#0891B2', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(8,145,178,.45)',
          transition: 'transform .2s ease, background .15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#0779A0')}
        onMouseLeave={e => (e.currentTarget.style.background = '#0891B2')}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 28, zIndex: 999,
          width: 360, maxWidth: 'calc(100vw - 40px)',
          height: 480, maxHeight: 'calc(100vh - 120px)',
          background: '#fff', borderRadius: 16,
          border: '1px solid #E2EAF0',
          boxShadow: '0 20px 60px rgba(11,30,48,.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideUp .22s ease',
        }}>

          {/* Header */}
          <div style={{
            background: '#0B1E30', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#0891B2', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Techtious Assistant</div>
              <div style={{ fontSize: 11, color: '#6A8EA0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}></div>
                Online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%',
                  background: m.role === 'user' ? '#0891B2' : '#F4F7FA',
                  color: m.role === 'user' ? '#fff' : '#0B1E30',
                  borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '10px 13px',
                  fontSize: 13.5,
                  fontWeight: 300,
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {m.content || (loading && i === messages.length - 1 ? (
                    <span style={{ opacity: .5 }}>▋</span>
                  ) : '')}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.content === '' && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: '#F4F7FA', borderRadius: '12px 12px 12px 2px',
                  padding: '10px 16px', display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#0891B2',
                      animation: `dotPulse 1.2s ease ${i * 0.2}s infinite`,
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            borderTop: '1px solid #E2EAF0', padding: '10px 12px',
            display: 'flex', gap: 8, flexShrink: 0, background: '#fff',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything about Techtious…"
              disabled={loading}
              style={{
                flex: 1, border: '1px solid #E2EAF0', borderRadius: 8,
                padding: '9px 13px', fontSize: 13.5, fontFamily: 'inherit',
                outline: 'none', color: '#0B1E30', background: '#FAFAF8',
                transition: 'border-color .15s ease',
              }}
              onFocus={e => (e.target.style.borderColor = '#0891B2')}
              onBlur={e => (e.target.style.borderColor = '#E2EAF0')}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                background: '#0891B2', border: 'none', borderRadius: 8,
                width: 38, height: 38, flexShrink: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: (!input.trim() || loading) ? 0.45 : 1,
                transition: 'opacity .15s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(1); opacity: .4; }
          40%            { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </>
  );
}
