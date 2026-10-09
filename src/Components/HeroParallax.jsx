import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useLanguage } from '../context/LanguageContext';
import { scrollToId } from '../lib/scroll';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 120;
const frame1Src = (i) => `/frames/frame_${String(i + 1).padStart(4, '0')}.jpg`;
const frame2Src = (i) => `/frames/frames2/frame_${String(i + 1).padStart(4, '0')}.jpg`;

function createSequence(canvas, srcOf) {
  const ctx = canvas.getContext('2d');
  canvas.width = 1920;
  canvas.height = 1080;

  const images = Array.from({ length: FRAME_COUNT }, (_, i) => {
    const img = new Image();
    img.src = srcOf(i);
    return img;
  });
  const state = { frame: 0 };

  const render = () => {
    const idx = Math.min(FRAME_COUNT - 1, Math.max(0, Math.floor(state.frame)));
    const img = images[idx];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  };

  images[0].onload = render;
  if (images[0].complete) render();

  return { state, render, images };
}

export default function HeroParallax() {
  const { user, logout } = useAuth();
  const { openModal } = useUI();
  const { lang, setLang, t, languages } = useLanguage();
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);
  const slide1Ref = useRef(null);
  const slide2Ref = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const activeLangObj = languages.find((l) => l.code === lang) || languages[0];

  useLayoutEffect(() => {
    const c1 = canvas1Ref.current;
    const c2 = canvas2Ref.current;
    if (!c1 || !c2) return;

    const seq1 = createSequence(c1, frame1Src);
    const seq2 = createSequence(c2, frame2Src);

    seq1.render();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=350%',
          pin: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
          onRefresh: () => {
            seq1.render();
          },
        },
      });

      tl.to(
        seq1.state,
        {
          frame: FRAME_COUNT - 1,
          ease: 'none',
          onUpdate: seq1.render,
          duration: 2,
        },
        0
      )
        .to(slide1Ref.current, { opacity: 0, y: -60, scale: 0.92, duration: 0.8 }, 0.8)
        .to(c1, { opacity: 0, duration: 1 }, 1.4)
        .fromTo(c2, { opacity: 0 }, { opacity: 1, duration: 1 }, 1.4)
        .fromTo(slide2Ref.current, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.8 }, 1.8)
        .to(
          seq2.state,
          {
            frame: FRAME_COUNT - 1,
            ease: 'none',
            onUpdate: seq2.render,
            duration: 2,
          },
          1.8
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="hero-pin-root">
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          background: '#0a0606',
        }}
      >
        <canvas
          ref={canvas1Ref}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            zIndex: 1,
          }}
        />

        <canvas
          ref={canvas2Ref}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            zIndex: 2,
            opacity: 0,
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 65% 45%, rgba(185, 28, 28, 0.16) 0%, rgba(217, 119, 6, 0.08) 40%, rgba(8, 5, 5, 0.85) 90%)',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />

        <nav
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            padding: '30px 6vw',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          <span
            onClick={() => scrollToId('explore')}
            style={{
              fontSize: '19px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: '#fef08a',
              fontFamily: 'Cormorant Garamond, serif',
              cursor: 'pointer',
            }}
          >
            NOTOSAN
          </span>

          <div style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/community')}
              className="nav-link-btn"
            >
              {t('community')}
            </button>

            <button
              type="button"
              onClick={() => scrollToId('about')}
              className="nav-link-btn"
            >
              {t('about')}
            </button>
            
            <button 
              type="button"
              onClick={() => openModal('support')} 
              className="nav-link-btn"
            >
              {t('support')}
            </button>

            {/* BỘ CHUYỂN ĐỔI NGÔN NGỮ (10 NGÔN NGỮ) */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="nav-link-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                  color: '#fef3c7',
                }}
              >
                <span>{activeLangObj.flag}</span>
                <span style={{ fontWeight: 600 }}>{activeLangObj.code.toUpperCase()}</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>▾</span>
              </button>

              {langMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '42px',
                    right: 0,
                    width: '210px',
                    background: '#140809',
                    border: '1px solid #3d1b1b',
                    borderRadius: '12px',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.85)',
                    padding: '6px 0',
                    zIndex: 100,
                    maxHeight: '320px',
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ padding: '6px 14px', fontSize: '11px', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #231112' }}>
                    Select Language
                  </div>
                  {languages.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLang(item.code);
                        setLangMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '9px 14px',
                        background: lang === item.code ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        border: 'none',
                        color: lang === item.code ? '#fef08a' : '#d1d5db',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#221112')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = lang === item.code ? 'rgba(245, 158, 11, 0.15)' : 'transparent')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{item.flag}</span>
                        <span>{item.label}</span>
                      </span>
                      {lang === item.code && <span style={{ color: '#f59e0b', fontSize: '12px' }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!user ? (
              <button
                type="button"
                onClick={() => openModal('signup')}
                className="register-btn-main"
              >
                {t('register')}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
                <button type="button" className="bell-btn" title="Notifications">
                  🔔
                </button>

                <div
                  className="user-avatar-badge"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{user.avatarChar}</span>
                  )}
                  <span style={{ fontSize: '10px', marginLeft: '2px' }}>▾</span>
                </div>

                {dropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-user-header">
                      <strong>{user.name}</strong>
                      <span className="dropdown-user-sub">{user.identifier}</span>
                    </div>
                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/accountscenter/profiles');
                      }}
                    >
                      👤 {t('profile_details')}
                    </button>

                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/accountscenter/saved');
                      }}
                    >
                      ⭐ {t('saved_repos')}
                    </button>

                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/accountscenter/history');
                      }}
                    >
                      🕒 {t('history')}
                    </button>

                    <div className="dropdown-divider" />
                    <button
                      type="button"
                      className="dropdown-item logout-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                    >
                      ⏻ {t('signout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* SCENE 1: WELCOME */}
        <div
          ref={slide1Ref}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 8vw',
            maxWidth: '820px',
            pointerEvents: 'none',
          }}
        >
          <p
            style={{
              color: '#fbbf24',
              fontSize: '12px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '14px',
              fontWeight: 600,
            }}
          >
            {t('welcome_sub')}
          </p>
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(70px, 12vw, 140px)',
              color: '#ffffff',
              lineHeight: '0.88',
              letterSpacing: '-2px',
              textTransform: 'uppercase',
              margin: '6px 0 22px',
              textShadow: '0 4px 30px rgba(185, 28, 28, 0.35)',
            }}
          >
            {t('welcome_title')}
          </h1>
          <p
            style={{
              color: '#fef3c7',
              fontSize: '15px',
              lineHeight: 1.75,
              maxWidth: '460px',
              marginBottom: '28px',
              opacity: 0.9,
            }}
          >
            {t('welcome_desc')}
          </p>
          <div style={{ pointerEvents: 'auto' }}>
            <button
              type="button"
              onClick={() => scrollToId('explore')}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '24px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(220, 38, 38, 0.4)',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
            >
              {t('start_journey')}
            </button>
          </div>
        </div>

        {/* SCENE 2: TRANQUILITY */}
        <div
          ref={slide2Ref}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-end',
            paddingRight: '7vw',
            pointerEvents: 'none',
            opacity: 0,
          }}
        >
          <div style={{ maxWidth: '520px', pointerEvents: 'auto', textAlign: 'left' }}>
            <p
              style={{
                color: '#fbbf24',
                fontSize: '12px',
                letterSpacing: '3.5px',
                textTransform: 'uppercase',
                marginBottom: '10px',
                fontWeight: 600,
              }}
            >
              {t('experience_3d')}
            </p>
            <h2
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(62px, 9.5vw, 110px)',
                color: '#ffffff',
                lineHeight: '0.95',
                marginBottom: '20px',
                letterSpacing: '-1px',
                textShadow: '0 4px 28px rgba(245, 158, 11, 0.3)',
              }}
            >
              {t('tranquility')}
            </h2>
            <p
              style={{
                color: '#fef3c7',
                fontSize: '15.5px',
                lineHeight: 1.8,
                marginBottom: '26px',
                opacity: 0.9,
              }}
            >
              {t('tranquility_desc')}
            </p>
            <button
              type="button"
              onClick={() => scrollToId('explore')}
              style={{
                background: 'transparent',
                color: '#fcd34d',
                border: 'none',
                borderBottom: '1px solid #fcd34d',
                paddingBottom: '4px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('learn_more')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}