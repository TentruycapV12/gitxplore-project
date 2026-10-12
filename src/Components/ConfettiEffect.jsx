import { useEffect, useState } from 'react';
import './ConfettiEffect.css';

const COLORS = ['#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#facc15'];

export default function ConfettiEffect({ active, onComplete }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const newPieces = Array.from({ length: 65 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage vw
      delay: Math.random() * 0.8,
      duration: 2.2 + Math.random() * 1.5,
      size: 7 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    }));

    setPieces(newPieces);

    const timer = setTimeout(() => {
      setPieces([]);
      if (onComplete) onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (!active && pieces.length === 0) return null;

  return (
    <div className="gx-confetti-container" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className={`gx-confetti-piece ${p.shape === 'circle' ? 'is-circle' : ''}`}
          style={{
            left: `${p.x}vw`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: `${p.size}px`,
            height: `${p.shape === 'circle' ? p.size : p.size * 1.6}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
