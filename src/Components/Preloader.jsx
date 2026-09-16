import React from 'react';

export default function Preloader({ progress, isReady }) {
  if (isReady) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#0a0a0c',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', letterSpacing: '2px' }}>
        LOADING 3D ASSETS... {progress}%
      </div>
      <div style={{
        width: '280px',
        height: '6px',
        backgroundColor: '#1f2937',
        borderRadius: '999px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#fbbf24',
          transition: 'width 0.15s ease-out'
        }} />
      </div>
    </div>
  );
}