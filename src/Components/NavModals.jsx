import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function NavModals({ context }) {
  const { modalType, closeModal, setUser } = context;

  const [authMode, setAuthMode] = useState('signup');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!modalType) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (authMode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const cleanName = identifier.includes('@') ? identifier.split('@')[0] : identifier;
    const firstChar = cleanName.trim().charAt(0).toUpperCase() || 'U';

    const userData = {
      name: cleanName,
      identifier: identifier,
      avatarChar: firstChar,
      avatarUrl: null,
      provider: 'Local',
    };

    localStorage.setItem('hka_user', JSON.stringify(userData));
    setUser(userData);
    closeModal();
  };

  const handleOAuthLogin = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err) {
      setErrorMessage(err.message || 'OAuth authentication failed.');
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-card nav-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>✕</button>

        <div className="modal-body">
          <span className="modal-category">Authentication</span>
          <h2 className="modal-title">
            {authMode === 'signup' ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="modal-desc">
            {authMode === 'signup'
              ? 'Sign up to bookmark repositories and access dev features.'
              : 'Sign in to access your personal dashboard.'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {errorMessage && (
              <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <input
              type="text"
              placeholder="Email or phone number"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="lusion-search"
              style={{ marginBottom: '12px', borderRadius: '12px' }}
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="lusion-search"
              style={{ marginBottom: '12px', borderRadius: '12px' }}
            />

            {authMode === 'signup' && (
              <input
                type="password"
                placeholder="Confirm password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="lusion-search"
                style={{ marginBottom: '18px', borderRadius: '12px' }}
              />
            )}

            <button
              type="submit"
              className="link-btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}
            >
              {authMode === 'signup' ? 'Sign up' : 'Sign in'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '13px', color: '#a8a29e', marginBottom: '18px' }}>
              {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
                  setErrorMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fbbf24',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                {authMode === 'signup' ? 'Sign in' : 'Sign up'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(251, 191, 36, 0.15)' }} />
              <span style={{ fontSize: '11px', color: '#78716c', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Or continue with
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(251, 191, 36, 0.15)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="oauth-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-1.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/>
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                className="oauth-btn"
              >
                <svg width="18" height="18" fill="#ffffff" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                GitHub
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}