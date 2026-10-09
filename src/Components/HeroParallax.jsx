import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { scrollToId } from '../lib/scroll';

gsap.registerPlugin(ScrollTrigger);

// Hằng số + hàm thuần đặt NGOÀI component: không bị tạo lại ở mỗi lần render.
const FRAME_COUNT = 120;
const frame1Src = (i) => `/frames/frame_${String(i + 1).padStart(4, '0')}.jpg`;
const frame2Src = (i) => `/frames/frames2/frame_${String(i + 1).padStart(4, '0')}.jpg`;

/** Tạo canvas sequence: nạp trước các frame và trả về hàm vẽ frame hiện tại. */
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
    const img = images[state.frame];
    if (img?.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  };

  // Frame đầu có thể đã tải xong (cache) → vẽ ngay, nếu chưa thì chờ onload.
  if (images[0].complete) render();
  else images[0].onload = render;

  return { state, render };
}

export default function HeroParallax() {
  const { user, logout } = useAuth();
  const { openModal: setModal } = useUI();
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);
  const slide1Ref = useRef(null);
  const slide2Ref = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // useLayoutEffect: cleanup chạy TRƯỚC khi React gỡ DOM, nên ctx.revert() trả DOM về nguyên trạng kịp lúc.
  useLayoutEffect(() => {
    const c1 = canvas1Ref.current;
    const c2 = canvas2Ref.current;
    if (!c1 || !c2) return;

    const seq1 = createSequence(c1, frame1Src);
    const seq2 = createSequence(c2, frame2Src);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=350%',
          pin: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      tl.to(seq1.state, {
        frame: FRAME_COUNT - 1,
        snap: 'frame',
        ease: 'none',
        onUpdate: seq1.render,
        duration: 2,
      }, 0)
      .to(slide1Ref.current, { opacity: 0, y: -60, scale: 0.92, duration: 0.8 }, 0.8)
      .to(c1, { opacity: 0, duration: 1 }, 1.4)
      .fromTo(c2, { opacity: 0 }, { opacity: 1, duration: 1 }, 1.4)
      .fromTo(slide2Ref.current, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.8 }, 1.8)
      .to(seq2.state, {
        frame: FRAME_COUNT - 1,
        snap: 'frame',
        ease: 'none',
        onUpdate: seq2.render,
        duration: 2,
      }, 1.8);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // GSAP pin bọc `containerRef` trong một "pin-spacer" mà React không biết.
  // Bọc thêm 1 div ngoài cùng để khi đổi route React gỡ cả khối này một lần,
  // thay vì gỡ `containerRef` khỏi cha cũ (đã bị đổi) → lỗi removeChild làm treo trang.
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

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/community')}
            className="nav-link-btn"
          >
            Community
          </button>

          <button
            type="button"
            onClick={() => scrollToId('about')}
            className="nav-link-btn"
          >
            About
          </button>
          
          <button 
            type="button"
            onClick={() => setModal('support')} 
            className="nav-link-btn"
          >
            Support
          </button>

          {!user ? (
            <button
              type="button"
              onClick={() => setModal('register')}
              className="register-btn-main"
            >
              Register
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
                  
                  {/* Điều hướng trực tiếp sang các tab Accounts Center chuẩn URL */}
                  <button 
                    type="button" 
                    className="dropdown-item" 
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/accountscenter/profiles');
                    }}
                  >
                    👤 Profile details
                  </button>

                  <button 
                    type="button" 
                    className="dropdown-item" 
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/accountscenter/saved');
                    }}
                  >
                    ⭐ Saved Repositories
                  </button>

                  <button 
                    type="button" 
                    className="dropdown-item" 
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/accountscenter/history');
                    }}
                  >
                    🕒 History
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
                    ⏻ Sign out
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
          ▲ Journey to new frontiers, Journey to Noto Nature Park
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
          WELCOME
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
          Away from the manic energy of Japan's famous metropolises lies the ancient hamlet of Noto. 
          Surprising and captivating in equal measure.
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
            Start the journey ▸
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
            3D Experience
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
            Tranquility
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
            Away from the manic energy of Japan's famous metropolises, soak into the ethereal waterfalls and mystic lakes 
            harboring a vast realm of legendary open-source artifacts.
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
            — Learn more
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
