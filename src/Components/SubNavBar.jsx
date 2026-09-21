import React, { useState } from 'react';

export default function SubNavBar({ context }) {
  const { user, logout, setModal, setCategory, navigate } = context;
  const [activeTab, setActiveTab] = useState('explore');
  const [showDropdown, setShowDropdown] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToExplore = () => {
    setActiveTab('explore');
    if (setCategory) setCategory('all');
    const el = document.getElementById('explore');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAboutSection = () => {
    setActiveTab('about');
    const el = document.getElementById('about');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      scrollToExplore();
    }
  };

  return (
    <nav className="av-subnav">
      <div className="av-left">
        <a
          href="/"
          className="av-logo"
          onClick={(e) => {
            e.preventDefault();
            if (navigate) navigate('/');
          }}
        >
          GIT<span>XPLORE</span>
        </a>

        <div className="av-menu">
          <button
            className={`av-item ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={scrollToExplore}
          >
            Repositories
          </button>

          <button
            className={`av-item ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('community');
              if (navigate) navigate('/community');
            }}
          >
            Discussions
          </button>

          <button
            className={`av-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('support');
              setModal('support');
            }}
          >
            Support & FAQ
          </button>

          <button
            className={`av-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={scrollToAboutSection}
          >
            About Us
          </button>

          <button
            className="av-item"
            style={{ color: '#f43f5e' }}
            onClick={() => setModal('support')}
          >
            Sponsor ❤️
          </button>
        </div>
      </div>

      <div className="av-right">
        <a href="https://github.com/TentruycapV12/gitxplore-project" target="_blank" rel="noreferrer" className="av-social-btn" title="GitHub">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>

        <a href="https://discord.com" target="_blank" rel="noreferrer" className="av-social-btn" title="Discord">
          💬
        </a>

        <a href="https://x.com" target="_blank" rel="noreferrer" className="av-social-btn" title="X">
          𝕏
        </a>

        <button
          className="av-social-btn"
          onClick={() => navigate && navigate('/community')}
          title="Notifications"
        >
          🔔
        </button>

        {user ? (
          <div style={{ position: 'relative', marginLeft: '4px' }}>
            <div
              className="user-avatar-badge"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ width: '34px', height: '34px', fontSize: '13px' }}
            >
              {user.avatarChar || 'H'}
            </div>

            {showDropdown && (
              <div className="user-dropdown-menu">
                <div className="dropdown-user-header">
                  <strong>{user.name}</strong>
                  <span className="dropdown-user-sub">{user.identifier}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item logout-item"
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                >
                  🚪 Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="register-btn-main"
            style={{ marginLeft: '6px' }}
            onClick={() => setModal('signin')}
          >
            Sign in
          </button>
        )}

        <button className="av-top-btn" onClick={scrollToTop} title="Scroll to top">
          ↑
        </button>
      </div>
    </nav>
  );
}