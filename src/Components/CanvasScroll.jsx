import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function CanvasScroll() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const textRef = useRef(null);

  // Số lượng ảnh frame trong thư mục public/frames/
  const frameCount = 120;

  const currentFrame = (index) =>
    `/frames/frame_${(index + 1).toString().padStart(4, '0')}.jpg`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');

    canvas.width = 1920;
    canvas.height = 1080;

    const images = [];
    const sequence = { frame: 0 };

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      images.push(img);
    }

    const render = () => {
      const img = images[sequence.frame];
      if (img && img.complete) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };

    if (images[0]) {
      images[0].onload = render;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=250%',
        pin: true,
        scrub: 0.5,
      },
    });

    // Đồng bộ frame ảnh theo cuộn chuột
    tl.to(sequence, {
      frame: frameCount - 1,
      snap: 'frame',
      ease: 'none',
      onUpdate: render,
    })
    // Hiệu ứng chữ xuất hiện rồi tan biến theo chuyển động xoay
    .fromTo(textRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.3 }, 0)
    .to(textRef.current, { opacity: 0, y: -50, duration: 0.3 }, 0.7);

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
        background: '#06040a',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* Chữ thương hiệu nổi trên mô hình 3D */}
      <div
        ref={textRef}
        style={{
          position: 'absolute',
          bottom: '12%',
          left: '8vw',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            color: '#c084fc',
            fontSize: '12px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Mark LXXXV Protocol
        </span>
        <h2
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(44px, 7vw, 84px)',
            color: '#ffffff',
            lineHeight: 1,
            margin: '8px 0',
          }}
        >
          Kinetic Architecture
        </h2>
      </div>
    </div>
  );
}