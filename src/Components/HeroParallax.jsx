import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HeroParallax({ context }) {
  const { user, logout, setModal, navigate } = context || {};
  const containerRef = useRef(null);
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);
  const slide1Ref = useRef(null);
  const slide2Ref = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const frameCount1 = 120;
  const frameCount2 = 120;

  const currentFrame1 = (index) =>
    `/frames/frame_${(index + 1).toString().padStart(4, '0')}.jpg`;

  const currentFrame2 = (index) =>
    `/frames/frames2/frame_${(index + 1).toString().padStart(4, '0')}.jpg`;

  const scrollToExplore = () => {
    const target = document.getElementById('explore');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const c1 = canvas1Ref.current;
    const c2 = canvas2Ref.current;
    if (!c1 || !c2) return;

    const ctx1 = c1.getContext('2d');
    const ctx2 = c2.getContext('2d');

    c1.width = 1920;
    c1.height = 1080;
    c2.width = 1920;
    c2.height = 1080;

    const images1 = [];
    const images2 = [];
    const sequence1 = { frame: 0 };
    const sequence2 = { frame: 0 };

    for (let i = 0; i < frameCount1; i++) {
      const img = new Image();
      img.src = currentFrame1(i);
      images1.push(img);
    }

    for (let i = 0; i < frameCount2; i++) {
      const img = new Image();
      img.src = currentFrame2(i);
      images2.push(img);
    }

    const render1 = () => {
      const img = images1[sequence1.frame];
      if (img && img.complete) {
        ctx1.clearRect(0, 0, c1.width, c1.height);
        ctx1.drawImage(img, 0, 0, c1.width, c1.height);
      }
    };

    const render2 = () => {
      const img = images2[sequence2.frame];
      if (img && img.complete) {
        ctx2.clearRect(0, 0, c2.width, c2.height);
        ctx2.drawImage(img, 0, 0, c2.width, c2.height);
      }
    };

    if (images1[0]) images1[0].onload = render1;
    if (images2[0]) images2[0].onload = render2;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=350%',
        pin: true,
        scrub: 0.5,
      },
    });

    tl.to(sequence1, {
      frame: frameCount1 - 1,
      snap: 'frame',
      ease: 'none',
      onUpdate: render1,
      duration: 2,
    }, 0)
    .to(slide1Ref.current, {
      opacity: 0,
      y: -60,
      scale: 0.92,
      duration: 0.8,
    }, 0.8)
    .to(c1, { opacity: 0, duration: 1 }, 1.4)
    .fromTo(c2, { opacity: 0 }, { opacity: 1, duration: 1 }, 1.4)
    .fromTo(slide2Ref.current, {
      opacity: 0,
      x: 60,
    }, {
      opacity: 1,
      x: 0,
      duration: 0.8,
    }, 1.8)
    .to(sequence2, {
      frame: frameCount2 - 1,
      snap: 'frame',
      ease: 'none',
      onUpdate: render2,
      duration: 2,
    }, 1.8);

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
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
          onClick={scrollToExplore}
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
            onClick={() => navigate && navigate('community')}
            className="nav-link-btn"
          >
            Community
          </button>

          <button onClick={scrollToExplore} className="nav-link-btn">
            About
          </button>
          
          <button onClick={() => setModal && setModal('support')} className="nav-link-btn">
            Support
          </button>

          {!user ? (
            <button
              onClick={() => setModal && setModal('register')}
              className="register-btn-main"
            >
              Register
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
              <button className="bell-btn" title="Notifications">
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
                  <a href="#profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    👤 Profile details
                  </a>
                  <a href="#explore" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    ⭐ Saved Repositories
                  </a>
                  <a href="#history" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    🕒 History
                  </a>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item logout-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      if (logout) logout();
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
            onClick={scrollToExplore}
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
            onClick={scrollToExplore}
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
  );
}