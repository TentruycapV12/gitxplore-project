import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function BuyerSellerChatModal({ product, lang, onClose }) {
  const { user } = useAuth();
  const isVi = lang === 'vi';
  const chatKey = `gx_chat_${product.id}_${product.seller?.id || 'shop'}`;

  const defaultMessages = [
    {
      id: 1,
      sender: 'seller',
      senderName: product.seller?.name || (isVi ? 'Người Bán' : 'Seller'),
      avatar: product.seller?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=seller',
      text: isVi
        ? `Chào bạn! Cảm ơn bạn đã quan tâm đến "${product.title}". Bạn cần tư vấn thêm về thông số, tình trạng máy hay chính sách giao hàng không ạ?`
        : `Hello! Thank you for your interest in "${product.title_en || product.title}". How can I help you today?`,
      time: '10:00',
    },
  ];

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(chatKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultMessages;
  });

  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(chatKey, JSON.stringify(messages));
    } catch {}
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatKey]);

  const quickChips = isVi
    ? [
        'Sản phẩm này còn hàng không shop?',
        'Có bảo hành và hóa đơn VAT không?',
        'Máy có trầy xước hay lỗi gì không?',
        'Giao hỏa tốc trong ngày được không shop?',
      ]
    : [
        'Is this item still available?',
        'Does it include warranty & receipt?',
        'Any scratches or defects?',
        'Can you ship express today?',
      ];

  const handleSend = (textToSend) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const buyerMsg = {
      id: Date.now(),
      sender: 'buyer',
      senderName: user?.name || user?.username || (isVi ? 'Bạn' : 'You'),
      avatar: user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=buyer',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, buyerMsg]);
    setInputVal('');

    // Simulated auto-reply from seller after 1s
    setTimeout(() => {
      let replyText = isVi
        ? 'Dạ vâng! Sản phẩm bên em hiện đang có sẵn trong kho, test kỹ lưỡng 100% trước khi gửi đi qua Két Escrow GitXplore ạ!'
        : 'Yes! The product is in stock and fully tested before dispatch via GitXplore Escrow!';

      if (text.toLowerCase().includes('bảo hành') || text.toLowerCase().includes('warranty')) {
        replyText = isVi
          ? 'Dạ sản phẩm được bảo hành chính hãng + cam kết 48 giờ dùng thử từ Sàn GitXplore, nếu lỗi hoàn tiền 100% ạ!'
          : 'It comes with official warranty plus GitXplore 48-hour inspection trial with 100% money back guarantee!';
      } else if (text.toLowerCase().includes('hỏa tốc') || text.toLowerCase().includes('express')) {
        replyText = isVi
          ? 'Dạ bên em hỗ trợ giao hỏa tốc qua Shopee Express / GHTK nhận ngay trong ngày tại nội thành ạ!'
          : 'Express delivery is supported via Shopee Express or GHTK same-day in major cities!';
      }

      const sellerReply = {
        id: Date.now() + 1,
        sender: 'seller',
        senderName: product.seller?.name || 'Seller',
        avatar: product.seller?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=seller',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, sellerReply]);
    }, 1100);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '620px',
          maxHeight: '90vh',
          background: '#0d111d',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 30px rgba(245, 158, 11, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(20, 27, 45, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={product.seller?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=seller'}
              alt=""
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #f59e0b' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ color: '#ffffff', fontSize: '14.5px' }}>
                  {product.seller?.name || 'Shop Công Nghệ'}
                </strong>
                <span
                  style={{
                    fontSize: '10px',
                    background: 'rgba(16,185,129,0.2)',
                    color: '#34d399',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  ✓ KYC Shop
                </span>
              </div>
              <small style={{ color: '#94a3b8', fontSize: '11.5px' }}>
                ● {isVi ? 'Đang hoạt động • Phản hồi trong 5 phút' : 'Online • Replies in 5 mins'}
              </small>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Product Snippet Bar */}
        <div
          style={{
            padding: '10px 16px',
            background: 'rgba(7, 9, 14, 0.7)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200'}
            alt=""
            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isVi ? product.title : (product.title_en || product.title)}
            </span>
            <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 800 }}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '6px' }}>
            🛡️ Escrow 48H
          </span>
        </div>

        {/* Chat Messages Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {messages.map((m) => {
            const isMe = m.sender === 'buyer';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: '8px',
                  maxWidth: '85%',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                {!isMe && (
                  <img
                    src={m.avatar}
                    alt=""
                    style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }}
                  />
                )}
                <div>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: isMe
                        ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: isMe ? '#0a0a0c' : '#f8fafc',
                      fontSize: '13.5px',
                      lineHeight: '1.5',
                      fontWeight: isMe ? 600 : 400,
                      wordBreak: 'break-word',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {m.text}
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#64748b',
                      display: 'block',
                      marginTop: '3px',
                      textAlign: isMe ? 'right' : 'left',
                    }}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(7, 9, 14, 0.85)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                padding: '4px 10px',
                color: '#cbd5e1',
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.color = '#fef08a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              💬 {chip}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: '12px 16px',
            background: 'rgba(20, 27, 45, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={isVi ? 'Nhập tin nhắn cho người bán...' : 'Type a message to the seller...'}
            style={{
              flex: 1,
              background: 'rgba(7, 9, 14, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '999px',
              padding: '10px 16px',
              color: '#ffffff',
              fontSize: '13.5px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '999px',
              padding: '10px 18px',
              color: '#0a0a0c',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
            }}
          >
            {isVi ? 'Gửi ➔' : 'Send ➔'}
          </button>
        </form>
      </div>
    </div>
  );
}
