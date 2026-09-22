import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { openSourceProjects } from '../data/projectsData';

export default function SavedDashboard({ context, onBack }) {
  const { user, setUser, logout, setSelectedProject } = context;
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'saved' | 'history'
  const [activeSideMenu, setActiveSideMenu] = useState('profiles_details');

  // Profile fields
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Saved Repositories
  const [savedList, setSavedList] = useState([]);
  
  // History
  const [historyList, setHistoryList] = useState([]);

  useEffect(() => {
    if (!user?.identifier) return;

    // Lấy danh sách Repo đã lưu từ LocalStorage
    const localSaved = JSON.parse(localStorage.getItem(`saved_${user.identifier}`) || '[]');
    let matched = localSaved.map((id) => openSourceProjects.find((p) => p.id.toString() === id.toString())).filter(Boolean);
    if (matched.length === 0) {
      matched = openSourceProjects.slice(0, 4);
    }
    setSavedList(matched);

    // Lấy lịch sử
    const localHist = JSON.parse(localStorage.getItem(`hist_${user.identifier}`) || '[]');
    if (localHist.length > 0) {
      setHistoryList(localHist);
    } else {
      setHistoryList([
        { id: 1, action: 'Visited Community Forum', details: 'Checked latest open-source discussions', time: 'Just now' },
        { id: 2, action: 'Viewed Repository', details: 'Explored Mark LXXXV Protocol', time: '1 hour ago' },
        { id: 3, action: 'Account Login', details: `Signed in as ${user.identifier}`, time: 'Today at 08:30 PM' },
      ]);
    }
  }, [user]);

  const handleUpdateName = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setIsSaving(true);
    const updated = { ...user, name: nameInput.trim() };
    localStorage.setItem('hka_user', JSON.stringify(updated));
    setUser(updated);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setIsEditingName(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 300);
  };

  const handleRemoveSaved = (id) => {
    const next = savedList.filter((p) => p.id !== id);
    setSavedList(next);
    localStorage.setItem(`saved_${user.identifier}`, JSON.stringify(next.map((p) => p.id)));
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#090506', color: '#fef3c7', fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif' }}>
      
      {/* TOP NAVBAR */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 5vw', background: '#120909', borderBottom: '1px solid #2b1414', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            type="button"
            onClick={onBack}
            className="link-btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}
          >
            ← Back to Home
          </button>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fef08a', letterSpacing: '0.5px' }}>
            GIT<span style={{ color: '#ef4444' }}>XPLORE</span> ACCOUNTS
          </div>
        </div>

        {/* TOP TABS NAVIGATION */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              background: activeTab === 'profile' ? 'linear-gradient(135deg, #f59e0b, #dc2626)' : '#1a0e0e',
              color: activeTab === 'profile' ? '#fff' : '#d1d5db',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            👤 Profile details
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            style={{
              background: activeTab === 'saved' ? 'linear-gradient(135deg, #f59e0b, #dc2626)' : '#1a0e0e',
              color: activeTab === 'saved' ? '#fff' : '#d1d5db',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            ⭐ Saved Repositories ({savedList.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: activeTab === 'history' ? 'linear-gradient(135deg, #f59e0b, #dc2626)' : '#1a0e0e',
              color: activeTab === 'history' ? '#fff' : '#d1d5db',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            🕒 History
          </button>
        </div>

        <button
          type="button"
          onClick={() => { logout(); onBack(); }}
          style={{ background: '#261212', color: '#f87171', border: '1px solid #4a1d1d', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
        >
          Sign out
        </button>
      </header>

      {/* BODY CONTENT */}
      <div style={{ maxWidth: '1150px', margin: '30px auto', padding: '0 20px' }}>

        {/* ======================================================== */}
        {/* TAB 1: GIAO DIỆN META ACCOUNTS CENTER CHO PROFILE        */}
        {/* ======================================================== */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', background: '#120909', border: '1px solid #2b1414', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            
            {/* CỘT TRÁI: SIDEBAR SETTINGS (CHUẨN META) */}
            <div style={{ padding: '30px 24px', borderRight: '1px solid #241111', background: '#0e0707', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 700 }}>
                  <span>♾️</span> GitXplore
                </div>
                <h2 style={{ margin: '6px 0 4px', fontSize: '22px', fontWeight: 700, color: '#fff' }}>Accounts Center</h2>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#8c827a', lineHeight: 1.5 }}>
                  Manage your connected experiences and developer profile settings across GitXplore technologies.
                </p>
              </div>

              {/* Mục Active chính */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div 
                  onClick={() => setActiveSideMenu('profiles_details')}
                  style={{
                    background: activeSideMenu === 'profiles_details' ? '#261414' : 'transparent',
                    color: activeSideMenu === 'profiles_details' ? '#fef08a' : '#d1d5db',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: activeSideMenu === 'profiles_details' ? '1px solid #4a1d1d' : '1px solid transparent'
                  }}
                >
                  <span>👤</span> Profiles and personal details
                </div>
              </div>

              {/* Danh mục Account Settings */}
              <div>
                <span style={{ fontSize: '11px', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Account settings
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  {[
                    { icon: '🛡️', label: 'Password and security' },
                    { icon: '🔗', label: 'Connected experiences' },
                    { icon: '📄', label: 'Your information and permissions' },
                    { icon: '⚙️', label: 'Developer preferences' },
                    { icon: '💳', label: 'Subscriptions & Sponsors' },
                    { icon: '👥', label: 'Manage accounts' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        color: '#9ca3af',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.15s, color 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#1a0d0d'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                    >
                      <span>{item.icon}</span> {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: NỘI DUNG CHI TIẾT (PROFILES AND PERSONAL DETAILS) */}
            <div style={{ padding: '34px 40px', background: '#120909', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Card Banner Thông Báo Đầu Trang */}
              <div style={{ background: '#180d0d', border: '1px solid #381a1a', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    🚀
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Explore upcoming updates to GitXplore Developer Accounts</div>
                    <div style={{ color: '#8c827a', fontSize: '11.5px' }}>Learn about new GitHub sync and unified workspace features</div>
                  </div>
                </div>
                <span style={{ color: '#9ca3af', fontSize: '16px' }}>›</span>
              </div>

              {/* Title Section */}
              <div>
                <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Profiles and personal details</h1>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af', lineHeight: 1.5 }}>
                  Review the profiles and personal details you've added to this Accounts Center. Add more profiles by connecting your developer accounts.
                </p>
              </div>

              {/* KHỐI 1: PROFILES */}
              <div>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Profiles
                </span>
                
                <div style={{ marginTop: '10px', background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                  <div 
                    onClick={() => setIsEditingName(!isEditingName)}
                    style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: isEditingName ? '1px solid #2a1515' : 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #7f1d1d, #c2410c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', color: '#fff' }}>
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          user?.avatarChar || 'H'
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>{user?.name || 'Hoàng PH'}</div>
                        <div style={{ color: '#38bdf8', fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>🌐</span> GitXplore Core / GitHub Connected
                        </div>
                      </div>
                    </div>
                    <span style={{ color: '#9ca3af', fontSize: '18px' }}>{isEditingName ? '▾' : '›'}</span>
                  </div>

                  {/* Form sửa tên khi bấm vào profile */}
                  {isEditingName && (
                    <form onSubmit={handleUpdateName} style={{ padding: '16px 20px', background: '#130a0a', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={nameInput} 
                        onChange={(e) => setNameInput(e.target.value)} 
                        className="lusion-search" 
                        style={{ flex: 1, borderRadius: '8px', fontSize: '13.5px', padding: '8px 14px' }}
                        placeholder="Enter your display name..."
                      />
                      <button type="submit" disabled={isSaving} className="link-btn btn-primary" style={{ padding: '8px 18px', fontSize: '12px' }}>
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </form>
                  )}

                  <div style={{ padding: '12px 20px', borderTop: '1px solid #221212', background: '#140b0b' }}>
                    <button 
                      onClick={() => alert('Connect another GitHub or OAuth account feature is coming soon!')}
                      style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      + Add accounts
                    </button>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: PERSONAL DETAILS */}
              <div>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Personal details
                </span>

                <div style={{ marginTop: '10px', background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                  {/* Contact Info */}
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #241212', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Contact info</div>
                      <div style={{ fontSize: '12.5px', color: '#9ca3af', marginTop: '2px' }}>
                        {user?.identifier || 'pham_anh_hoang@gmail.com'}
                      </div>
                    </div>
                    <span style={{ color: '#9ca3af', fontSize: '18px' }}>›</span>
                  </div>

                  {/* Birthday */}
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Birthday</div>
                      <div style={{ fontSize: '12.5px', color: '#9ca3af', marginTop: '2px' }}>
                        July 22, 2007
                      </div>
                    </div>
                    <span style={{ color: '#9ca3af', fontSize: '18px' }}>›</span>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: MORE FROM GITXPLORE (HỆ SINH THÁI AI/3D) */}
              <div>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  More from GitXplore
                </span>
                
                <div style={{ marginTop: '10px', width: '220px', background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '36px' }}>🕶️</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>AI Kinetic Engine</div>
                  <div style={{ fontSize: '11px', color: '#8c827a', textAlign: 'center' }}>Realtime 3D Canvas integration</div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SAVED REPOSITORIES                                */}
        {/* ======================================================== */}
        {activeTab === 'saved' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {savedList.map((project) => (
              <div key={project.id} style={{ background: '#140a0a', border: '1px solid #291515', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>
                      {project.language || 'Open Source'}
                    </span>
                    <button
                      onClick={() => handleRemoveSaved(project.id)}
                      title="Remove from saved"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                    >
                      🗑️
                    </button>
                  </div>
                  <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '18px' }}>{project.name}</h3>
                  <p style={{ margin: 0, color: '#a8a29e', fontSize: '13px', lineHeight: 1.6 }}>{project.description}</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                  <button
                    onClick={() => setSelectedProject && setSelectedProject(project)}
                    className="link-btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '12px', flex: 1, justifyContent: 'center' }}
                  >
                    Quick View
                  </button>
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="link-btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '12px', flex: 1, justifyContent: 'center' }}
                  >
                    GitHub ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ACTIVITY HISTORY                                  */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historyList.map((item, index) => (
              <div key={index} style={{ background: '#140a0a', border: '1px solid #291515', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#fef08a', fontSize: '15px' }}>{item.action}</h4>
                  <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '13px' }}>{item.details}</p>
                </div>
                <span style={{ fontSize: '12px', color: '#78716c' }}>{item.time}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}