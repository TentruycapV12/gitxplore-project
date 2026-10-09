import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: '#0a0606',
        color: '#fef3c7',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '64px', margin: 0 }}>404</h1>
      <p style={{ opacity: 0.8 }}>Trang bạn tìm không tồn tại.</p>
      <Link to="/" className="link-btn btn-primary">
        ⬅️ Về trang chủ
      </Link>
    </div>
  );
}
