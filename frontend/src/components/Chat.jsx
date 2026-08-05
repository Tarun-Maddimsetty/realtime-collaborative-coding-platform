import { useState, useEffect, useRef } from 'react';

export default function Chat({ socketRef, roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const bottomRef               = useRef(null);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    socket.on('chat-history', setMessages);
    socket.on('new-message', msg => setMessages(prev => [...prev, msg]));
    return () => { socket.off('chat-history'); socket.off('new-message'); };
  }, [socketRef]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = e => {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current?.emit('send-message', { roomId, content: input.trim() });
    setInput('');
  };

  const formatTime = ts => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '11px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '8px',
        flexShrink: 0,
        background: 'var(--bg-elevated)',
      }}>
        <span style={{ fontSize: '13px' }}>💬</span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Team Chat</span>
        {messages.length > 0 && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.6875rem', color: 'var(--text-muted)',
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border)',
            padding: '1px 7px', borderRadius: '99px',
          }}>{messages.length}</span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>👋</div>
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.username === currentUser;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                {!isMe && (
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '8px', fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>{msg.username?.[0]?.toUpperCase()}</div>
                )}
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {isMe ? 'You' : msg.username}
                </span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', opacity: 0.6 }}>
                  {formatTime(msg.createdAt)}
                </span>
              </div>
              <div style={{
                padding: '8px 12px',
                borderRadius: isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                background: isMe ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--bg-elevated)',
                border: isMe ? 'none' : '1px solid var(--border)',
                color: isMe ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                maxWidth: '88%',
                wordBreak: 'break-word',
                lineHeight: 1.55,
                boxShadow: isMe ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: '8px',
        flexShrink: 0,
        background: 'var(--bg-elevated)',
      }}>
        <input
          className="input-base"
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem', background: 'var(--bg-base)' }}
          placeholder="Message…"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          style={{
            padding: '8px 13px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            border: 'none', borderRadius: 'var(--r-md)',
            color: '#fff', fontSize: '14px', cursor: 'pointer',
            transition: 'opacity 0.15s',
            flexShrink: 0,
            opacity: input.trim() ? 1 : 0.4,
          }}
          title="Send message"
        >↑</button>
      </form>
    </div>
  );
}
