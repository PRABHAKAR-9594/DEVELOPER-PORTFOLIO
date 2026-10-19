'use client';

import { useEffect, useRef, useState } from 'react';

const SUGGESTED_QUESTIONS = [
  'Who are you?',
  'What are your skills?',
  'How many years of experience do you have?',
  'What projects have you built?',
  'How can I contact you?',
];

const BotIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="7" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="9" cy="13" r="1.5" fill="currentColor" />
    <circle cx="15" cy="13" r="1.5" fill="currentColor" />
    <path d="M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SendIcon = ({ width = "36", height = "23" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const TypingDots = () => (
  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          animation: 'chatbotDotBounce 1.2s infinite',
          animationDelay: `${i * 0.2}s`,
          display: 'inline-block',
        }}
      />
    ))}
  </div>
);

function formatMessageText(text) {
  if (!text) return null;

  // Convert markdown links [title](url) to plain url or title: url
  let cleaned = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, title, url) => {
    return title.trim() === url.trim() ? url : `${title}: ${url}`;
  });

  // Remove square brackets around URLs e.g. [https://...] -> https://...
  cleaned = cleaned.replace(/\[(https?:\/\/[^\]]+)\]/g, '$1');

  // Strip bold/italic asterisks e.g. **text** or ***text***
  cleaned = cleaned.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');

  // Split by URL to render clickable links
  const urlRegex = /(https?:\/\/[^\s<>'"]+)/g;
  const parts = cleaned.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#c084fc',
            textDecoration: 'underline',
            wordBreak: 'break-all',
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        animation: 'chatbotFadeIn 0.3s ease',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginRight: '8px',
            marginTop: '2px',
            color: 'white',
          }}
        >
          <BotIcon />
        </div>
      )}
      <div
        style={{
          maxWidth: '78%',
          padding: '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? 'linear-gradient(135deg, #7c3aed, #ec4899)'
            : 'rgba(255,255,255,0.06)',
          border: isUser ? 'none' : '1px solid rgba(168,85,247,0.2)',
          color: '#f1f5f9',
          fontSize: '13.5px',
          lineHeight: '1.6',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          backdropFilter: isUser ? 'none' : 'blur(8px)',
          boxShadow: isUser
            ? '0 4px 15px rgba(124,58,237,0.3)'
            : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {formatMessageText(message.content)}
        {/* Cursor only shown when actively streaming AND content exists — never alongside typing dots */}
        {message.isStreaming && message.content && (
          <span
            style={{
              display: 'inline-block',
              width: '2px',
              height: '14px',
              background: '#a855f7',
              marginLeft: '2px',
              verticalAlign: 'middle',
              animation: 'chatbotBlink 0.8s infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Stop pulse after first open
  useEffect(() => {
    if (isOpen) {
      setShowPulse(false);
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasOpened(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! 👋 I'm Prabhakar's AI assistant. Ask me anything about his experience, skills, projects, or background!",
        },
      ]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (abortRef.current) abortRef.current.abort();
  };

  const handleSuggest = (question) => {
    setInput(question);
    setTimeout(() => sendMessage(question), 50);
  };

  const sendMessage = async (overrideInput) => {
    const text = (overrideInput ?? input).trim();
    if (!text || isStreaming) return;

    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);

    const botPlaceholder = { role: 'assistant', content: '', isStreaming: true };
    setMessages((prev) => [...prev, botPlaceholder]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error('API error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: accumulated,
            isStreaming: true,
          };
          return updated;
        });
      }

      // Mark streaming done
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: accumulated,
          isStreaming: false,
        };
        return updated;
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: "Sorry, I couldn't get a response right now. Please try again!",
            isStreaming: false,
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = messages.length <= 1 && !isStreaming;

  return (
    <>
      {/* ── Keyframe Styles ── */}
      <style>{`
        @keyframes chatbotDotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes chatbotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes chatbotFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatbotSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatbotPulse {
          0% { box-shadow: 0 0 0 0 rgba(168,85,247,0.6); }
          70% { box-shadow: 0 0 0 14px rgba(168,85,247,0); }
          100% { box-shadow: 0 0 0 0 rgba(168,85,247,0); }
        }
        .chatbot-panel::-webkit-scrollbar { width: 4px; }
        .chatbot-panel::-webkit-scrollbar-track { background: transparent; }
        .chatbot-panel::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 4px; }
        .chatbot-input::-webkit-scrollbar { display: none; width: 0; height: 0; }
        .chatbot-input {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .chatbot-input:focus { outline: none; }
        .chatbot-suggest-btn:hover {
          background: rgba(168,85,247,0.15) !important;
          border-color: rgba(168,85,247,0.5) !important;
          transform: translateY(-1px);
        }
        .chatbot-send-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #9333ea, #db2777) !important;
          transform: scale(1.05);
        }
        .chatbot-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            height: '520px',
            maxHeight: 'calc(100vh - 120px)',
            background: 'linear-gradient(145deg, rgba(13,18,36,0.97), rgba(10,13,55,0.97))',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(168,85,247,0.25)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            animation: 'chatbotSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 18px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))',
              borderBottom: '1px solid rgba(168,85,247,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
                }}
              >
                <BotIcon />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#f1f5f9' }}>
                  Portfolio Assistant
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: isStreaming ? '#f97316' : '#22c55e',
                      display: 'inline-block',
                      boxShadow: isStreaming ? '0 0 6px #f97316' : '0 0 6px #22c55e',
                      transition: 'all 0.3s',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {isStreaming ? 'Thinking...' : 'Online'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(236,72,153,0.2)';
                e.currentTarget.style.color = '#ec4899';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div
            className="chatbot-panel"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {messages
              // Filter out the empty bot placeholder — typing dots handle that phase
              .filter((msg) => !(msg.isStreaming && msg.content === ''))
              .map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}

            {/* Typing indicator — shown while waiting for first token */}
            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <BotIcon />
                </div>
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    borderRadius: '18px 18px 18px 4px',
                  }}
                >
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {showSuggestions && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', marginTop: 0 }}>
                  Suggested questions:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      className="chatbot-suggest-btn"
                      onClick={() => handleSuggest(q)}
                      style={{
                        background: 'rgba(168,85,247,0.08)',
                        border: '1px solid rgba(168,85,247,0.2)',
                        borderRadius: '10px',
                        color: '#c4b5fd',
                        fontSize: '12px',
                        padding: '7px 12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: '1px solid rgba(168,85,247,0.15)',
              background: 'rgba(0,0,0,0.2)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(168,85,247,0.25)',
                borderRadius: '14px',
                padding: '10px 12px',
                transition: 'border-color 0.2s',
              }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.6)')}
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.25)')}
            >
              <textarea
                ref={inputRef}
                className="chatbot-input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about Prabhakar..."
                disabled={isStreaming}
                rows={1}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: '#f1f5f9',
                  fontSize: '13.5px',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  opacity: isStreaming ? 0.6 : 1,
                }}
              />
              <button
                className="chatbot-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming}
                style={{
                  width: '36px',
                  height: '23px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
                }}
              >
                <SendIcon />
              </button>
            </div>
            <p style={{ margin: '6px 0 0', textAlign: 'center', fontSize: '11px', color: '#64748b', letterSpacing: '0.2px' }}>
              Designed &amp; Developed by{' '}
              <span style={{ color: '#c084fc', fontWeight: 600 }}>Prabhakar Maurya</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Floating Bubble ── */}
      <button
        id="chatbot-toggle-btn"
        onClick={isOpen ? handleClose : handleOpen}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          background: isOpen
            ? 'linear-gradient(135deg, #ec4899, #7c3aed)'
            : 'linear-gradient(135deg, #7c3aed, #ec4899)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          boxShadow: '0 8px 25px rgba(124,58,237,0.5), 0 4px 10px rgba(0,0,0,0.3)',
          transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          animation: showPulse ? 'chatbotPulse 2s infinite' : 'none',
          transform: isOpen ? 'rotate(0deg) scale(1)' : 'rotate(0deg) scale(1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        aria-label={isOpen ? 'Close chat' : 'Open portfolio assistant'}
        title={isOpen ? 'Close chat' : 'Ask me about Prabhakar'}
      >
        <div
          style={{
            transition: 'transform 0.3s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          {isOpen ? <CloseIcon /> : <BotIcon />}
        </div>
      </button>
    </>
  );
}
