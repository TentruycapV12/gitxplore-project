import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { openSourceProjects } from '../data/projectsData';

export default function SavedDashboard({ context, onBack }) {
  const { user, setUser, logout, setSelectedProject } = context;
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'saved' | 'history'
  const [activeSideMenu, setActiveSideMenu] = useState('profiles_details');

  // Profile data
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Personal Details (Chỉnh sửa thủ công)
  const [personalDetails, setPersonalDetails] = useState({
    phone: '',
    altEmail: '',
    birthday: '',
  });
  const [editingDetailType, setEditingDetailType] = useState(null); // 'contact' | 'birthday' | null
  const [tempPhone, setTempPhone] = useState('');
  const [tempAltEmail, setTempAltEmail] = useState('');
  const [tempBirthday, setTempBirthday] = useState('');

  // Security & Preferences Settings State
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [connectedGithub, setConnectedGithub] = useState(true);
  const [connectedGoogle, setConnectedGoogle] = useState(false);
  const [devApiToken, setDevApiToken] = useState('gxp_live_' + Math.random().toString(36).substring(2, 10));

  // Saved Repositories & History
  const [savedList, setSavedList] = useState([]);
  const [historyList, setHistoryList] = useState([]);

  useEffect(() => {
    if (!user?.identifier) return;

    // Load Personal Details từ storage
    const storedDetails = JSON.parse(localStorage.getItem(`details_${user.identifier}`) || '{}');
    setPersonalDetails({
      phone: storedDetails.phone || '',
      altEmail: storedDetails.altEmail || user.identifier,
      birthday: storedDetails.birthday || '',
    });

    // Load Repos đã lưu
    const localSaved = JSON.parse(localStorage.getItem(`saved_${user.identifier}`) || '[]');
    let matched = localSaved.map((id) => openSourceProjects.find((p) => p.id.toString() === id.toString())).filter(Boolean);
    if (matched.length === 0) {
      matched = openSourceProjects.slice(0, 4);
    }
    setSavedList(matched);

    // Load History
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

  // Cập nhật tên hiển thị
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

  // Mở modal sửa Personal Details
  const openEditDetails = (type) => {
    setEditingDetailType(type);
    if (type === 'contact') {
      setTempPhone(personalDetails.phone);
      setTempAltEmail(personalDetails.altEmail);
    } else if (type === 'birthday') {
      setTempBirthday(personalDetails.birthday);
    }
  };

  // Lưu Personal Details thủ công
  const handleSavePersonalDetails = (e) => {
    e.preventDefault();
    const updated = {
      ...personalDetails,
      phone: editingDetailType === 'contact' ? tempPhone.trim() : personalDetails.phone,
      altEmail: editingDetailType === 'contact' ? tempAltEmail.trim() : personalDetails.altEmail,
      birthday: editingDetailType === 'birthday' ? tempBirthday : personalDetails.birthday,
    };
    setPersonalDetails(updated);
    localStorage.setItem(`details_${user.identifier}`, JSON.stringify(updated));
    setEditingDetailType(null);
  };

  const handleRemoveSaved = (id) => {
    const next = savedList.filter((p) => p.id !== id);
    setSavedList(next);
    localStorage.setItem(`saved_${user.identifier}`, JSON.stringify(next.map((p) => p.id)));
  };

  const handleExportData = () => {
    const dataObj = { user, personalDetails, savedRepositories: savedList, history: historyList };
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gitxplore_data_${user?.name || 'account'}.json`;
    a.click();
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#090506', color: '#fef3c7', fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif' }}>
      
      {/* TOP HEADER */}
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

        {/* TABS CHÍNH */}
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
        {/* TAB 1: GIAO DIỆN META ACCOUNTS CENTER CHUẨN CẢ 2 CỘT    */}
        {/* ======================================================== */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', background: '#120909', border: '1px solid #2b1414', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            
            {/* CỘT TRÁI: SIDEBAR MENU TƯƠNG TÁC (ẢNH 2) */}
            <div style={{ padding: '30px 24px', borderRight: '1px solid #241111', background: '#0e0707', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 700 }}>
                  <span>♾️</span> GitXplore
                </div>
                <h2 style={{ margin: '6px 0 4px', fontSize: '22px', fontWeight: 700, color: '#fff' }}>Accounts Center</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#8c827a', lineHeight: 1.5 }}>
                  Manage your connected experiences and developer profile settings across GitXplore technologies.
                </p>
              </div>

              {/* Profiles Menu */}
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

              {/* Danh mục Account Settings - Có thể bấm trực tiếp để đổi giao diện */}
              <div>
                <span style={{ fontSize: '11px', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Account settings
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  {[
                    { id: 'security', icon: '🛡️', label: 'Password and security' },
                    { id: 'connected', icon: '🔗', label: 'Connected experiences' },
                    { id: 'permissions', icon: '📄', label: 'Your information and permissions' },
                    { id: 'preferences', icon: '⚙️', label: 'Developer preferences' },
                    { id: 'subscriptions', icon: '💳', label: 'Subscriptions & Sponsors' },
                    { id: 'manage', icon: '👥', label: 'Manage accounts' },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveSideMenu(item.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        color: activeSideMenu === item.id ? '#fef08a' : '#9ca3af',
                        background: activeSideMenu === item.id ? '#1e0e0e' : 'transparent',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.15s, color 0.15s'
                      }}
                      onMouseEnter={(e) => { if (activeSideMenu !== item.id) e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { if (activeSideMenu !== item.id) e.currentTarget.style.color = '#9ca3af'; }}
                    >
                      <span>{item.icon}</span> {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: NỘI DUNG THAY ĐỔI THEO TỪNG MỤC CỦA SIDEBAR */}
            <div style={{ padding: '34px 40px', background: '#120909', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* MỤC 1: PROFILES AND PERSONAL DETAILS */}
              {activeSideMenu === 'profiles_details' && (
                <>
                  <div style={{ background: '#180d0d', border: '1px solid #381a1a', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                  <div>
                    <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Profiles and personal details</h1>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af', lineHeight: 1.5 }}>
                      Review and manually edit your profiles, contact information, and developer credentials.
                    </p>
                  </div>

                  {/* PROFILES */}
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
                            {user?.avatarChar || 'H'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>{user?.name}</div>
                            <div style={{ color: '#38bdf8', fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>🌐</span> GitXplore Core / GitHub Connected
                            </div>
                          </div>
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: '18px' }}>{isEditingName ? '▾' : '›'}</span>
                      </div>

                      {isEditingName && (
                        <form onSubmit={handleUpdateName} style={{ padding: '16px 20px', background: '#130a0a', display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={nameInput} 
                            onChange={(e) => setNameInput(e.target.value)} 
                            className="lusion-search" 
                            style={{ flex: 1, borderRadius: '8px', fontSize: '13.5px', padding: '8px 14px' }}
                            placeholder="Change display name..."
                          />
                          <button type="submit" disabled={isSaving} className="link-btn btn-primary" style={{ padding: '8px 18px', fontSize: '12px' }}>
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </form>
                      )}

                      <div style={{ padding: '12px 20px', borderTop: '1px solid #221212', background: '#140b0b' }}>
                        <button 
                          onClick={() => alert('Connect secondary account is ready for setup.')}
                          style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                          + Add accounts
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PERSONAL DETAILS (THỦ CÔNG) */}
                  <div>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Personal details
                    </span>

                    <div style={{ marginTop: '10px', background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                      {/* Thẻ Contact Info */}
                      <div 
                        onClick={() => openEditDetails('contact')}
                        style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #241212', cursor: 'pointer' }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Contact info</div>
                          <div style={{ fontSize: '12.5px', color: '#9ca3af', marginTop: '2px' }}>
                            {personalDetails.altEmail || user?.identifier}
                            {personalDetails.phone ? ` • ${personalDetails.phone}` : ' (Click to add phone)'}
                          </div>
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: '18px' }}>✏️ ›</span>
                      </div>

                      {/* Thẻ Birthday */}
                      <div 
                        onClick={() => openEditDetails('birthday')}
                        style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Birthday</div>
                          <div style={{ fontSize: '12.5px', color: '#9ca3af', marginTop: '2px' }}>
                            {personalDetails.birthday ? personalDetails.birthday : 'Not specified (Click to set)'}
                          </div>
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: '18px' }}>✏️ ›</span>
                      </div>
                    </div>
                  </div>

                  {/* MORE FROM GITXPLORE */}
                  <div>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      More from GitXplore
                    </span>
                    <div style={{ marginTop: '10px', width: '220px', background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '36px' }}>🕶️</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>AI Kinetic Engine</div>
                      <div style={{ fontSize: '11px', color: '#8c827a', textAlign: 'center' }}>Realtime 3D Canvas integration</div>
                    </div>
                  </div>
                </>
              )}

              {/* MỤC 2: PASSWORD AND SECURITY */}
              {activeSideMenu === 'security' && (
                <div>
                  <h2 style={{ margin: '0 0 10px', fontSize: '20px', color: '#fff' }}>Password and Security</h2>
                  <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#9ca3af' }}>Manage credentials, two-factor authentication, and active sessions.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ background: '#160b0b', border: '1px solid #2b1414', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '14px' }}>Two-Factor Authentication (2FA)</strong>
                        <div style={{ color: '#9ca3af', fontSize: '12.5px', marginTop: '2px' }}>Add an extra layer of protection to your account</div>
                      </div>
                      <button 
                        onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                        style={{ background: twoFactorAuth ? '#16a34a' : '#2b1414', color: '#fff', border: '1px solid #4a1d1d', padding: '6px 14px', borderRadius: '14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        {twoFactorAuth ? '✓ Enabled' : 'Enable'}
                      </button>
                    </div>

                    <div style={{ background: '#160b0b', border: '1px solid #2b1414', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '14px' }}>Change Password</strong>
                        <div style={{ color: '#9ca3af', fontSize: '12.5px', marginTop: '2px' }}>Last modified via authentication gateway</div>
                      </div>
                      <button 
                        onClick={() => alert('Password reset link sent to your registered email.')}
                        className="link-btn btn-secondary" 
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MỤC 3: CONNECTED EXPERIENCES */}
              {activeSideMenu === 'connected' && (
                <div>
                  <h2 style={{ margin: '0 0 10px', fontSize: '20px', color: '#fff' }}>Connected Experiences</h2>
                  <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#9ca3af' }}>Manage integrations between GitXplore and third-party developer platforms.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#160b0b', border: '1px solid #2b1414', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '22px' }}>🐙</span>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '14px' }}>GitHub OAuth Service</strong>
                          <div style={{ color: '#9ca3af', fontSize: '12.5px' }}>Repository sync and star tracking</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setConnectedGithub(!connectedGithub)}
                        style={{ background: connectedGithub ? '#16a34a' : '#2b1414', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '14px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        {connectedGithub ? 'Linked' : 'Link'}
                      </button>
                    </div>

                    <div style={{ background: '#160b0b', border: '1px solid #2b1414', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '22px' }}>🌐</span>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '14px' }}>Google Identity Gateway</strong>
                          <div style={{ color: '#9ca3af', fontSize: '12.5px' }}>Single sign-on authentication</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setConnectedGoogle(!connectedGoogle)}
                        style={{ background: connectedGoogle ? '#16a34a' : '#2b1414', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '14px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        {connectedGoogle ? 'Linked' : 'Link'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MỤC 4: YOUR INFORMATION AND PERMISSIONS */}
              {activeSideMenu === 'permissions' && (
                <div>
                  <h2 style={{ margin: '0 0 10px', fontSize: '20px', color: '#fff' }}>Your Information & Permissions</h2>
                  <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#9ca3af' }}>Download an archive of your account data or inspect access permissions.</p>
                  
                  <div style={{ background: '#160b0b', border: '1px solid #2b1414', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '14.5px' }}>Download your profile data</strong>
                      <div style={{ color: '#9ca3af', fontSize: '12.5px', marginTop: '4px' }}>Export a JSON archive containing saved repos, history, and details.</div>
                    </div>
                    <button 
                      onClick={handleExportData}
                      className="link-btn btn-primary" 
                      style={{ padding: '8px 18px', fontSize: '12.5px' }}
                    >
                      Export JSON ↓
                    </button>
                  </div>
                </div>
              )}

              {/* MỤC 5: DEVELOPER PREFERENCES */}
              {activeSideMenu === 'preferences' && (
                <div>
                  <h2 style={{ margin: '0 0 10px', fontSize: '20px', color: '#fff' }}>Developer Preferences</h2>
                  <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#9ca3af' }}>Configure your API access tokens and dashboard developer layout.</p>
                  
                  <div style={{ background: '#160b0b', border: '1px solid #2b1414', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <strong style={{ color: '#fef08a', fontSize: '13.5px' }}>Personal Access Token (API)</strong>
                    <input 
                      type="text" 
                      readOnly 
                      value={devApiToken} 
                      className="lusion-search" 
                      style={{ width: '100%', borderRadius: '8px', fontSize: '13px', background: '#0f0707' }} 
                    />
                    <button 
                      onClick={() => setDevApiToken('gxp_live_' + Math.random().toString(36).substring(2, 10))}
                      style={{ background: 'transparent', border: '1px solid #4a1d1d', color: '#f59e0b', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', width: 'fit-content', fontSize: '12px' }}
                    >
                      Regenerate Token ⟳
                    </button>
                  </div>
                </div>
              )}

              {/* MỤC 6: SUBSCRIPTIONS & SPONSORS */}
              {activeSideMenu === 'subscriptions' && (
                <div>
                  <h2 style={{ margin: '0 0 10px', fontSize: '20px', color: '#fff' }}>Subscriptions & Sponsors</h2>
                  <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#9ca3af' }}>Manage community contributions and repository creator sponsorships.</p>
                  <div style={{ background: '#160b0b', border: '1px solid #2b1414', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>❤️</div>
                    <strong style={{ color: '#fff', fontSize: '15px' }}>Community Supporter</strong>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>You have full free access to all GitXplore open repositories.</div>
                  </div>
                </div>
              )}

              {/* MỤC 7: MANAGE ACCOUNTS */}
              {activeSideMenu === 'manage' && (
                <div>
                  <h2 style={{ margin: '0 0 10px', fontSize: '20px', color: '#fff' }}>Manage Accounts</h2>
                  <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#9ca3af' }}>Control active logins or disconnect the current session.</p>
                  <div style={{ background: '#160b0b', border: '1px solid #2b1414', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '14px' }}>Active Session</strong>
                      <div style={{ color: '#10b981', fontSize: '12.5px' }}>● Signed in on this device</div>
                    </div>
                    <button 
                      onClick={() => { logout(); onBack(); }}
                      style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '12.5px', cursor: 'pointer' }}
                    >
                      Log out now
                    </button>
                  </div>
                </div>
              )}

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

      {/* ======================================================== */}
      {/* MODAL SỬA THỦ CÔNG PERSONAL DETAILS (CONTACT / BIRTHDAY) */}
      {/* ======================================================== */}
      {editingDetailType && (
        <div className="modal-overlay" onClick={() => setEditingDetailType(null)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '480px', padding: '24px', background: '#140a0a', border: '1px solid #381a1a', borderRadius: '14px' }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fef08a', fontSize: '18px' }}>
              {editingDetailType === 'contact' ? 'Edit Contact Info' : 'Edit Birthday'}
            </h3>

            <form onSubmit={handleSavePersonalDetails} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {editingDetailType === 'contact' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a8a29e', marginBottom: '6px' }}>Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+84 763 518 159" 
                      value={tempPhone} 
                      onChange={(e) => setTempPhone(e.target.value)} 
                      className="lusion-search" 
                      style={{ width: '100%', borderRadius: '8px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a8a29e', marginBottom: '6px' }}>Contact Email</label>
                    <input 
                      type="email" 
                      placeholder="name@example.com" 
                      value={tempAltEmail} 
                      onChange={(e) => setTempAltEmail(e.target.value)} 
                      className="lusion-search" 
                      style={{ width: '100%', borderRadius: '8px' }} 
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a8a29e', marginBottom: '6px' }}>Select Date of Birth</label>
                  <input 
                    type="date" 
                    value={tempBirthday} 
                    onChange={(e) => setTempBirthday(e.target.value)} 
                    className="lusion-search" 
                    style={{ width: '100%', borderRadius: '8px', color: '#fff' }} 
                    required 
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingDetailType(null)} 
                  className="link-btn btn-secondary" 
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="link-btn btn-primary" 
                  style={{ padding: '8px 20px' }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}