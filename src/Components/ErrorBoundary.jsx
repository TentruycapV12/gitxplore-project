import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GitXplore ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080505',
          color: '#f8fafc',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', marginBottom: '10px' }}>
            Hệ thống đang làm mới dữ liệu
          </h2>
          <p style={{ maxWidth: '480px', color: '#94a3b8', marginBottom: '24px', fontSize: '13.5px', lineHeight: 1.6 }}>
            Một số tài nguyên trình duyệt đang được đồng bộ lại. Hãy nhấn nút bên dưới để tải lại trang mượt mà!
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            style={{
              padding: '12px 28px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000000',
              fontWeight: 800,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)'
            }}
          >
            🔄 Tải Lại Trang Ngay
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
