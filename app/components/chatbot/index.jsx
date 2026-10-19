'use client';

import { useEffect, useRef, useState } from 'react';

const SUGGESTION_CHIPS = [
  { label: 'Skills', query: 'What are your core technical skills and tech stack?' },
  { label: 'Projects', query: 'What key projects have you built?' },
  { label: 'Experience', query: 'Tell me about your professional work experience.' },
  { label: 'Contact', query: 'How can I get in touch or collaborate with you?' },
];

const BotIcon = ({ width = "20", height = "20" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="7" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="9" cy="13" r="1.5" fill="currentColor" />
    <circle cx="15" cy="13" r="1.5" fill="currentColor" />
    <path d="M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SendIcon = ({ width = "18", height = "18" }) => (
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
          <BotIcon width="16" height="16" />
        </div>
      )}
      <div
        style={{
          maxWidth: isUser ? '78%' : '84%',
          padding: '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? '#8b5cf6'
            : '#1e1e38',
          border: isUser ? 'none' : '1px solid rgba(139,92,246,0.18)',
          color: '#f1f5f9',
          fontSize: '13.5px',
          lineHeight: '1.55',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          boxShadow: isUser
            ? '0 4px 15px rgba(139,92,246,0.3)'
            : '0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        {formatMessageText(message.content)}
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
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Lock body scroll on mobile when bottom sheet is open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth <= 640) {
      document.body.style.overflow = 'hidden';
    } else if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
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
          content: "Hi, I'm Prabhakar's AI assistant. Ask me about his experience, skills, or projects.",
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

  const showSuggestions = messages.length <= 2 && !isStreaming;

  return (
    <>
      {/* ── Keyframe and Responsive Styles ── */}
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
        @keyframes chatbotBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes chatbotSlideUpDesktop {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatbotSlideUpMobile {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
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

        /* Suggestion Chips */
        .chatbot-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 9999px;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }
        .chatbot-chip:hover {
          background: rgba(139, 92, 246, 0.25);
          border-color: #c084fc;
          color: #ffffff;
          transform: translateY(-1px);
        }
        .chatbot-chip:active {
          transform: scale(0.96);
        }

        .chatbot-send-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #9333ea, #db2777) !important;
          transform: scale(1.04);
        }
        .chatbot-send-btn:active:not(:disabled) {
          transform: scale(0.96);
        }
        .chatbot-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .chatbot-close-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #94a3b8;
          cursor: pointer;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .chatbot-close-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        /* Desktop Chatbot Window */
        .chatbot-container {
          position: fixed;
          bottom: 90px;
          right: 24px;
          width: 375px;
          max-width: calc(100vw - 32px);
          height: 540px;
          max-height: calc(100vh - 120px);
          background: #13142d;
          backdrop-filter: blur(20px);
          border-radius: 20px;
          border: 1px solid rgba(168, 85, 247, 0.25);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(168, 85, 247, 0.1);
          display: flex;
          flex-direction: column;
          z-index: 9999;
          animation: chatbotSlideUpDesktop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }

        .chatbot-backdrop {
          display: none;
        }

        .chatbot-header {
          padding: 16px 18px;
          background: #171838;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .chatbot-drag-handle-area {
          display: none;
        }

        .chatbot-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        /* Mobile Bottom Sheet (< 640px) */
        @media (max-width: 640px) {
          .chatbot-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            z-index: 9998;
            animation: chatbotBackdropFade 0.25s ease;
          }

          .chatbot-container {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 82vh !important;
            max-height: 85vh !important;
            border-radius: 22px 22px 0 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-bottom: none !important;
            border-top: 1px solid rgba(255, 255, 255, 0.12) !important;
            background: #14152e !important;
            box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.85) !important;
            animation: chatbotSlideUpMobile 0.32s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }

          .chatbot-header {
            padding: 8px 18px 14px 18px !important;
            background: #171838 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.07) !important;
            border-top-left-radius: 22px !important;
            border-top-right-radius: 22px !important;
          }

          .chatbot-drag-handle-area {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2px 0 10px 0;
            width: 100%;
            cursor: pointer;
          }

          .chatbot-drag-handle {
            width: 36px;
            height: 4px;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.25);
            transition: all 0.2s ease;
          }

          .chatbot-drag-handle-area:hover .chatbot-drag-handle {
            background: rgba(255, 255, 255, 0.45);
          }

          .chatbot-footer {
            padding-bottom: max(14px, env(safe-area-inset-bottom)) !important;
          }

          /* Hide floating bubble button on mobile when open */
          .chatbot-floating-bubble.is-open {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Mobile Backdrop ── */}
      {isOpen && (
        <div
          className="chatbot-backdrop"
          onClick={handleClose}
          aria-label="Close chat overlay"
        />
      )}

      {/* ── Chat Container (Bottom Sheet on Mobile, Window on Desktop) ── */}
      {isOpen && (
        <div className="chatbot-container">
          {/* Unified Header with seamlessly integrated Drag Handle */}
          <div className="chatbot-header">
            {/* Mobile Drag Handle */}
            <div className="chatbot-drag-handle-area" onClick={handleClose} title="Close chat">
              <div className="chatbot-drag-handle" />
            </div>

            {/* Header Content Row */}
            <div className="chatbot-header-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                    flexShrink: 0,
                  }}
                >
                  <BotIcon width="20" height="20" />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#f8fafc', letterSpacing: '-0.2px' }}>
                    Portfolio assistant
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: isStreaming ? '#f97316' : '#22c55e',
                        display: 'inline-block',
                        boxShadow: isStreaming ? '0 0 6px #f97316' : '0 0 8px #22c55e',
                        transition: 'all 0.3s',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                      {isStreaming ? 'Thinking...' : 'Online'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="chatbot-close-btn"
                aria-label="Close chat"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages Body */}
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
              .filter((msg) => !(msg.isStreaming && msg.content === ''))
              .map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}

            {/* Typing indicator */}
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
                  <BotIcon width="16" height="16" />
                </div>
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#1e1e38',
                    border: '1px solid rgba(139,92,246,0.18)',
                    borderRadius: '18px 18px 18px 4px',
                  }}
                >
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Quick Suggestion Chips */}
            {showSuggestions && (
              <div style={{ marginTop: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      className="chatbot-chip"
                      onClick={() => handleSuggest(chip.query)}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            className="chatbot-footer"
            style={{
              padding: '12px 14px',
              borderTop: '1px solid rgba(168,85,247,0.15)',
              background: 'rgba(0,0,0,0.25)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(168,85,247,0.25)',
                borderRadius: '14px',
                padding: '6px 8px 6px 14px',
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
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
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
                aria-label="Send message"
              >
                <SendIcon width="20" height="20" />
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
        className={`chatbot-floating-bubble ${isOpen ? 'is-open' : ''}`}
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
          {isOpen ? <CloseIcon /> : <BotIcon width="24" height="24" />}
        </div>
      </button>
    </>
  );
}
