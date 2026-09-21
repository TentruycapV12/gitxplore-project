import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { openSourceProjects } from '../data/projectsData';

export default function UserProfileModal({ context, activeTab = 'profile', onClose }) {
  const { user, setUser, logout, setSelectedProject } = context;
  const [tab, setTab] = useState(activeTab);
  
  // Profile state
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Saved Repositories state
  const [savedRepos, setSavedRepos] = useState([]);
  
  // History state
  const [historyList, setHistoryList] = useState([]);

  useEffect(() => {
    setTab(activeTab);
  }, [activeTab]);

  // Lấy dữ liệu Saved & History từ Supabase / LocalStorage
  useEffect(() => {
    if (!user?.identifier) return;

    // 1. Tải Saved Repos
    const fetchSaved = async () => {
      try {
        const { data } = await supabase
          .from('saved_repositories')
          .select('*')
          .eq('user_email', user.identifier);
        
        if (data && data.length > 0) {
          const matched = data.map(item => {
            const found = openSourceProjects.find(p => p.id.toString() === item.project_id.toString());
            return found || { id: item.project_id, name: item.project_name, description: 'Saved project' };
          });
          setSavedRepos(matched);
        } else {
          const localSaved = JSON.parse(localStorage.getItem(`saved_${user.identifier}`) || '[]');
          const matched = localSaved.map(id => openSourceProjects.find(p => p.id.toString() === id.toString())).filter(Boolean);
          setSavedRepos(matched.length > 0 ? matched : openSourceProjects.slice(0, 3));
        }
      } catch {
        setSavedRepos(openSourceProjects.slice(0, 3));
      }
    };

    // 2. Tải History
    const fetchHistory = async () => {
      try {
        const { data } = await supabase
          .from('user_history')
          .select('*')
          .eq('user_email', user.identifier)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (data && data.length > 0) {
          setHistoryList(data);
        } else {
          const localHistory = JSON.parse(localStorage.getItem(`hist_${user.identifier}`) || '[]');
          setHistoryList(localHistory.length > 0 ? localHistory : [
            { id: 1, action: 'Viewed Discussion', details: 'Joined GitXplore Forum', created_at: new Date().toISOString() },
            { id: 2, action: 'Starred Repository', details: 'Mark LXXXV Protocol', created_at: new Date(Date.now() - 3600000).toISOString() }
          ]);
        }
      } catch {
        setHistoryList([]);
      }
    };

    fetchSaved();
    fetchHistory();
  }, [user]);

  // Cập nhật Profile
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setIsSaving(true);

    const updatedUser = {
      ...user,
      name: nameInput.trim()
    };

    localStorage.setItem('hka_user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 400);
  };

  // Xóa khỏi danh sách Saved
  const handleRemoveSaved = (projectId) => {
    const next = savedRepos.filter(p => p.id !== projectId);
    setSavedRepos(next);
    localStorage.setItem(`saved_${user.identifier}`, JSON.stringify(next.map(p => p.id)));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '820px', width: '92%', height: '80vh', display: 'flex', flexDirection: 'column', padding: '24px', background: '#0e0707', border: '1px solid #3d1b1b', borderRadius: '16px' }}
      >
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2b1414', paddingBottom: '14px' }}>
          <div>
            <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Member Console</span>
            <h2 style={{ margin: '4px 0 0', color: '#fef08a', fontSize: '22px' }}>
              {tab === 'profile' ? '👤 Profile Details' : tab === 'saved' ? '⭐ Saved Repositories' : '🕒 Activity History'}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose} style={{ position: 'static' }}>✕</button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderBottom: '1px solid #221010', paddingBottom: '10px' }}>
          <button
            onClick={() => setTab('profile')}
            style={{
              background: tab === 'profile' ? '#2b1212' : 'transparent',
              color: tab === 'profile' ? '#f59e0b' : '#9ca3af',
              border: 'none',
              borderBottom: tab === 'profile' ? '2px solid #f59e0b' : '2px solid transparent',
              padding: '8px 16px',
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            👤 Profile details
          </button>
          <button
            onClick={() => setTab('saved')}
            style={{
              background: tab === 'saved' ? '#2b1212' : 'transparent',
              color: tab === 'saved' ? '#f59e0b' : '#9ca3af',
              border: 'none',
              borderBottom: tab === 'saved' ? '2px solid #f59e0b' : '2px solid transparent',
              padding: '8px 16px',
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            ⭐ Saved Repositories ({savedRepos.length})
          </button>
          <button
            onClick={() => setTab('history')}
            style={{
              background: tab === 'history' ? '#2b1212' : 'transparent',
              color: tab === 'history' ? '#f59e0b' : '#9ca3af',
              border: 'none',
              borderBottom: tab === 'history' ? '2px solid #f59e0b' : '2px solid transparent',
              padding: '8px 16px',
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            🕒 History
          </button>
        </div>

        {/* TAB 1: PROFILE DETAILS */}
        {tab === 'profile' && (
          <div style={{ flex: 1, overflowY: 'auto', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#160b0b', padding: '16px', borderRadius: '12px', border: '1px solid #291212' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #7f1d1d, #c2410c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#fff' }}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  user?.avatarChar || 'U'
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>{user?.name}</h3>
                <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '2px' }}>{user?.identifier}</div>
                <div style={{ color: '#f59e0b', fontSize: '11px', marginTop: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Provider: {user?.provider || 'Supabase Auth'}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#a8a29e', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="lusion-search"
                  style={{ width: '100%', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#a8a29e', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="text"
                  value={user?.identifier || ''}
                  disabled
                  className="lusion-search"
                  style={{ width: '100%', borderRadius: '8px', fontSize: '14px', opacity: 0.5, cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                {saveSuccess && <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: 600 }}>✓ Profile updated!</span>}
                <button
                  type="submit"
                  className="link-btn btn-primary"
                  disabled={isSaving}
                  style={{ marginLeft: 'auto', padding: '8px 24px' }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: SAVED REPOSITORIES */}
        {tab === 'saved' && (
          <div style={{ flex: 1, overflowY: 'auto', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {savedRepos.length > 0 ? (
              savedRepos.map(project => (
                <div 
                  key={project.id} 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#160b0b', border: '1px solid #291212', borderRadius: '10px', padding: '14px 18px' }}
                >
                  <div>
                    <h4 style={{ margin: 0, color: '#fef08a', fontSize: '16px', cursor: 'pointer' }} onClick={() => { setSelectedProject(project); onClose(); }}>
                      {project.name}
                    </h4>
                    <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '13px', maxWidth: '500px' }}>
                      {project.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => { setSelectedProject(project); onClose(); }}
                      className="link-btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleRemoveSaved(project.id)}
                      style={{ background: 'transparent', border: '1px solid #4a1c1c', color: '#f87171', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#78716c', padding: '40px 0' }}>
                No saved repositories yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACTIVITY HISTORY */}
        {tab === 'history' && (
          <div style={{ flex: 1, overflowY: 'auto', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {historyList.length > 0 ? (
              historyList.map((h, i) => (
                <div key={h.id || i} style={{ background: '#140a0a', border: '1px solid #241111', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#f3f4f6', fontSize: '13.5px' }}>{h.action}</strong>
                    <div style={{ color: '#9ca3af', fontSize: '12.5px', marginTop: '2px' }}>{h.details}</div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#78716c' }}>
                    {new Date(h.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#78716c', padding: '40px 0' }}>
                No activity history recorded.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}