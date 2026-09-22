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

  // Personal Details
  const [personalDetails, setPersonalDetails] = useState({
    phone: '',
    altEmail: '',
    birthday: '',
  });
  const [editingDetailType, setEditingDetailType] = useState(null); // 'contact' | 'birthday' | null
  const [tempPhone, setTempPhone] = useState('');
  const [tempAltEmail, setTempAltEmail] = useState('');
  const [tempBirthday, setTempBirthday] = useState('');

  // Sub-tabs
  const [paySubTab, setPaySubTab] = useState('transactions'); // 'transactions' | 'manage'
  const [activitySubTab, setActivitySubTab] = useState('projects'); // 'projects' | 'organizations'

  // Interactive Sub-Modal State cho tất cả các mục nhỏ
  const [subModalConfig, setSubModalConfig] = useState(null); 
  // { title: string, type: 'password' | '2fa' | 'saved_login' | 'passkey' | 'sessions' | 'emails' | 'checkup' | 'sync_avatars' | 'search_history' | 'add_payment' | 'sponsor_creator' | 'add_account' }

  // Form states cho Sub-Modals
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [newAccountInput, setNewAccountInput] = useState('');
  const [syncAvatars, setSyncAvatars] = useState(true);

  // Saved Repositories & History
  const [savedList, setSavedList] = useState([]);
  const [historyList, setHistoryList] = useState([]);

  useEffect(() => {
    if (!user?.identifier) return;

    const storedDetails = JSON.parse(localStorage.getItem(`details_${user.identifier}`) || '{}');
    setPersonalDetails({
      phone: storedDetails.phone || '',
      altEmail: storedDetails.altEmail || user.identifier,
      birthday: storedDetails.birthday || '',
    });

    const localSaved = JSON.parse(localStorage.getItem(`saved_${user.identifier}`) || '[]');
    let matched = localSaved.map((id) => openSourceProjects.find((p) => p.id.toString() === id.toString())).filter(Boolean);
    if (matched.length === 0) {
      matched = openSourceProjects.slice(0, 4);
    }
    setSavedList(matched);

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
      setIsEditingName(false);
    }, 300);
  };

  const openEditDetails = (type) => {
    setEditingDetailType(type);
    if (type === 'contact') {
      setTempPhone(personalDetails.phone);
      setTempAltEmail(personalDetails.altEmail);
    } else if (type === 'birthday') {
      setTempBirthday(personalDetails.birthday);
    }
  };

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

  const renderMetaGroupItem = ({ icon, title, subtitle, onClick, hasArrow = true, isLast = false }) => (
    <div
      onClick={onClick}
      style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: isLast ? 'none' : '1px solid #201010',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#190d0d')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {icon && <span style={{ fontSize: '18px' }}>{icon}</span>}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f3f4f6' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{subtitle}</div>}
        </div>
      </div>
      {hasArrow && <span style={{ color: '#9ca3af', fontSize: '16px' }}>›</span>}
    </div>
  );

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

        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', background: '#120909', border: '1px solid #2b1414', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            
            {/* SIDEBAR */}
            <div style={{ padding: '30px 24px', borderRight: '1px solid #241111', background: '#0e0707', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 700 }}>
                  <span>♾️</span> GitXplore
                </div>
                <h2 style={{ margin: '6px 0 4px', fontSize: '22px', fontWeight: 700, color: '#fff' }}>Accounts Center</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#8c827a', lineHeight: 1.5 }}>
                  Manage your developer profile, open-source repositories and account preferences across GitXplore.
                </p>
              </div>

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

              <div>
                <span style={{ fontSize: '11px', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Account settings
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  {[
                    { id: 'security', icon: '🛡️', label: 'Password and security' },
                    { id: 'connected', icon: '🔗', label: 'Connected experiences' },
                    { id: 'permissions', icon: '📄', label: 'Your information and permissions' },
                    { id: 'project_activity', icon: '🚀', label: 'Project activity & tracking' },
                    { id: 'git_pay', icon: '💳', label: 'Billing & Payments' },
                    { id: 'subscriptions', icon: '⭐', label: 'Sponsorships & Subscriptions' },
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

            {/* CỘT NỘI DUNG */}
            <div style={{ padding: '34px 40px', background: '#120909', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* 1. PROFILES AND PERSONAL DETAILS */}
              {activeSideMenu === 'profiles_details' && (
                <>
                  <div style={{ background: '#180d0d', border: '1px solid #381a1a', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        🚀
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Explore upcoming updates to GitXplore Developer Accounts</div>
                        <div style={{ color: '#8c827a', fontSize: '11.5px' }}>Unified workspace, repository synchronization, and real-time collaboration</div>
                      </div>
                    </div>
                    <span style={{ color: '#9ca3af', fontSize: '16px' }}>›</span>
                  </div>

                  <div>
                    <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Profiles and personal details</h1>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af', lineHeight: 1.5 }}>
                      Review the profiles and personal details you've added to this Accounts Center. Add more profiles by linking your GitHub or OAuth accounts.
                    </p>
                  </div>

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
                              <span>🐙</span> GitXplore Core / GitHub Account Connected
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
                          onClick={() => setSubModalConfig({ title: 'Add Linked Account', type: 'add_account' })}
                          style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                          + Add accounts
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Personal details
                    </span>

                    <div style={{ marginTop: '10px', background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                      <div 
                        onClick={() => openEditDetails('contact')}
                        style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #241212', cursor: 'pointer' }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Contact info</div>
                          <div style={{ fontSize: '12.5px', color: '#9ca3af', marginTop: '2px' }}>
                            {personalDetails.altEmail || user?.identifier}
                            {personalDetails.phone ? `, ${personalDetails.phone}` : ''}
                          </div>
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: '18px' }}>›</span>
                      </div>

                      <div 
                        onClick={() => openEditDetails('birthday')}
                        style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Birthday</div>
                          <div style={{ fontSize: '12.5px', color: '#9ca3af', marginTop: '2px' }}>
                            {personalDetails.birthday ? personalDetails.birthday : 'Not specified'}
                          </div>
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: '18px' }}>›</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      More from GitXplore
                    </span>
                    <div style={{ marginTop: '10px', width: '220px', background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '36px' }}>🕶️</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>AI Glasses</div>
                      <div style={{ fontSize: '11px', color: '#8c827a', textAlign: 'center' }}>Smart assistant integration</div>
                    </div>
                  </div>
                </>
              )}

              {/* 2. PASSWORD AND SECURITY */}
              {activeSideMenu === 'security' && (
                <>
                  <div>
                    <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Password and security</h1>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#fff' }}>Login & recovery</h3>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#9ca3af' }}>Manage your passwords, login preferences and recovery methods.</p>

                    <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                      {renderMetaGroupItem({ title: 'Change password', onClick: () => setSubModalConfig({ title: 'Change password', type: 'password' }) })}
                      {renderMetaGroupItem({ title: 'Two-factor authentication', subtitle: 'Enhance your security checkpoint', onClick: () => setSubModalConfig({ title: 'Two-factor authentication', type: '2fa' }) })}
                      {renderMetaGroupItem({ title: 'Saved login', subtitle: 'Remember active browsers', onClick: () => setSubModalConfig({ title: 'Saved login', type: 'saved_login' }) })}
                      {renderMetaGroupItem({ title: 'Passkey', subtitle: 'Biometric and security key access', isLast: true, onClick: () => setSubModalConfig({ title: 'Passkey Management', type: 'passkey' }) })}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#fff' }}>Security checks</h3>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#9ca3af' }}>Review security issues by running checks across apps, devices and emails sent.</p>

                    <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                      {renderMetaGroupItem({ title: "Where you're logged in", subtitle: '1 active session on Windows PC', onClick: () => setSubModalConfig({ title: "Where you're logged in", type: 'sessions' }) })}
                      {renderMetaGroupItem({ title: 'Recent emails', subtitle: 'Security and login notifications', onClick: () => setSubModalConfig({ title: 'Recent emails', type: 'emails' }) })}
                      {renderMetaGroupItem({ title: 'Security Checkup', subtitle: 'Keep your account shielded', isLast: true, onClick: () => setSubModalConfig({ title: 'Security Checkup', type: 'checkup' }) })}
                    </div>
                  </div>
                </>
              )}

              {/* 3. CONNECTED EXPERIENCES */}
              {activeSideMenu === 'connected' && (
                <>
                  <div>
                    <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Connected experiences</h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                      Activities and features that work across two or more accounts you've added to the same Accounts Center.
                    </p>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#fff' }}>Content & Code Sync</h3>
                    <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                      {renderMetaGroupItem({ icon: '🔄', title: 'Sharing across profiles', subtitle: 'Cross-post repository activities', onClick: () => alert('Sharing across profiles is enabled.') })}
                      {renderMetaGroupItem({ icon: '🐙', title: 'GitHub Stars and Repository Sync', subtitle: 'Keep bookmarked repositories up to date', onClick: () => alert('GitHub sync active.') })}
                      {renderMetaGroupItem({ icon: '📁', title: 'Developer commits & showcases', subtitle: 'Show latest project milestones in community', onClick: () => alert('Showcases are synced.') })}
                      {renderMetaGroupItem({ icon: '💻', title: 'Media on developer workstations', subtitle: 'Stream code snippets to connected devices', isLast: true, onClick: () => alert('Workstation streaming ready.') })}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#fff' }}>Profile info and access</h3>
                    <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                      {renderMetaGroupItem({ icon: '🖼️', title: 'Syncing profile avatars', subtitle: syncAvatars ? 'Enabled' : 'Disabled', onClick: () => setSubModalConfig({ title: 'Syncing profile avatars', type: 'sync_avatars' }) })}
                      {renderMetaGroupItem({ icon: '🔗', title: 'Showing links for your repositories', isLast: true, onClick: () => alert('Public repo links are shown.') })}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#fff' }}>Collaborators and network</h3>
                    <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                      {renderMetaGroupItem({ icon: '👥', title: 'Following developers in GitXplore Network', isLast: true, onClick: () => alert('Following 14 community developers.') })}
                    </div>
                  </div>
                </>
              )}

              {/* 4. YOUR INFORMATION AND PERMISSIONS */}
              {activeSideMenu === 'permissions' && (
                <>
                  <div>
                    <h1 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Your information and permissions</h1>
                    <div style={{ background: '#180d0d', border: '1px solid #381a1a', borderRadius: '24px', padding: '14px 20px', fontSize: '13px', color: '#d1d5db', marginBottom: '20px' }}>
                      To download or transfer a copy of your developer data, go to Export your Information below.
                    </div>
                  </div>

                  <div>
                    <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                      {renderMetaGroupItem({ title: 'Export your information', subtitle: 'Download JSON archive file', onClick: handleExportData })}
                      {renderMetaGroupItem({ title: 'Access your information', subtitle: 'Inspect data recorded across sessions', onClick: () => alert(`Identifier: ${user?.identifier}\nName: ${user?.name}`) })}
                      {renderMetaGroupItem({ title: 'Search history', subtitle: 'Manage search queries and cache', isLast: true, onClick: () => setSubModalConfig({ title: 'Search History', type: 'search_history' }) })}
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                      {renderMetaGroupItem({ title: 'Activity from open-source organizations', onClick: () => alert('Connected with 3 GitHub Orgs.') })}
                      {renderMetaGroupItem({ title: 'OAuth token connections', onClick: () => alert('Tokens are encrypted and healthy.') })}
                      {renderMetaGroupItem({ title: 'External accounts (GitHub, Discord)', onClick: () => alert('GitHub: Linked\nDiscord: Not linked') })}
                      {renderMetaGroupItem({ title: 'Identity confirmation', isLast: true, onClick: () => alert('Developer identity verified ✓') })}
                    </div>
                  </div>
                </>
              )}

              {/* 5. PROJECT ACTIVITY & TRACKING */}
              {activeSideMenu === 'project_activity' && (
                <>
                  <div>
                    <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Project activity & tracking</h1>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>Track active development, pull requests, and releases across monitored GitHub projects.</p>

                    <div style={{ display: 'flex', borderBottom: '1px solid #2b1414', gap: '30px' }}>
                      <button
                        onClick={() => setActivitySubTab('projects')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: activitySubTab === 'projects' ? '2px solid #fff' : '2px solid transparent',
                          color: activitySubTab === 'projects' ? '#fff' : '#9ca3af',
                          fontWeight: 700,
                          fontSize: '14px',
                          padding: '10px 0',
                          cursor: 'pointer'
                        }}
                      >
                        Recent Project Activity
                      </button>
                      <button
                        onClick={() => setActivitySubTab('organizations')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: activitySubTab === 'organizations' ? '2px solid #fff' : '2px solid transparent',
                          color: activitySubTab === 'organizations' ? '#fff' : '#9ca3af',
                          fontWeight: 700,
                          fontSize: '14px',
                          padding: '10px 0',
                          cursor: 'pointer'
                        }}
                      >
                        Monitored Topics & Tech
                      </button>
                    </div>
                  </div>

                  {activitySubTab === 'projects' ? (
                    <>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>Live Repository Updates</h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                          <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                            <div style={{ height: '120px', background: 'linear-gradient(135deg, #7f1d1d, #c2410c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                              ⚡
                            </div>
                            <div style={{ padding: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ color: '#fff', fontSize: '14px' }}>Supabase Realtime v2.4</strong>
                                <span style={{ fontSize: '11px', color: '#10b981', background: '#064e3b', padding: '2px 8px', borderRadius: '10px' }}>Release</span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 12px' }}>supabase / realtime-js • 1.2k commits</div>
                              <a href="https://github.com/supabase/realtime" target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '8px', borderRadius: '20px', fontWeight: 600, fontSize: '13px' }}>
                                Project details ↗
                              </a>
                            </div>
                          </div>

                          <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                            <div style={{ height: '120px', background: 'linear-gradient(135deg, #1e1b4b, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                              🎨
                            </div>
                            <div style={{ padding: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ color: '#fff', fontSize: '14px' }}>Three.js WebGL Engine</strong>
                                <span style={{ fontSize: '11px', color: '#38bdf8', background: '#1e3a8a', padding: '2px 8px', borderRadius: '10px' }}>Pull Request</span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 12px' }}>mrdoob / three.js • 98k stars</div>
                              <a href="https://github.com/mrdoob/three.js" target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '8px', borderRadius: '20px', fontWeight: 600, fontSize: '13px' }}>
                                Project details ↗
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>Organizations & Repositories you follow</h3>
                        </div>
                        <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                          {renderMetaGroupItem({ icon: '⚛️', title: 'React Open Source', subtitle: 'Latest core commits and compiler updates', onClick: () => alert('React repository tracker opened.') })}
                          {renderMetaGroupItem({ icon: '🌐', title: 'Next.js Framework', subtitle: 'App router & server actions tracking', onClick: () => alert('Next.js tracker opened.') })}
                          {renderMetaGroupItem({ icon: '⚡', title: 'GSAP Animations', subtitle: 'ScrollTrigger & animation timeline engine', isLast: true, onClick: () => alert('GSAP tracker opened.') })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#fff' }}>Technology Domains</h3>
                      <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                        {renderMetaGroupItem({ icon: '🤖', title: 'Artificial Intelligence & Neural Networks', onClick: () => alert('AI tracking adjusted.') })}
                        {renderMetaGroupItem({ icon: '🎮', title: 'WebGL, WebGPU & 3D Shaders', onClick: () => alert('3D graphics tracking adjusted.') })}
                        {renderMetaGroupItem({ icon: '☁️', title: 'Cloud Native & Edge Computing', isLast: true, onClick: () => alert('Cloud tracking adjusted.') })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 6. BILLING & PAYMENTS */}
              {activeSideMenu === 'git_pay' && (
                <>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                      <span>💳</span> Billing & Payments
                    </div>

                    <div style={{ display: 'flex', borderBottom: '1px solid #2b1414', gap: '40px' }}>
                      <button
                        onClick={() => setPaySubTab('transactions')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: paySubTab === 'transactions' ? '2px solid #fff' : '2px solid transparent',
                          color: paySubTab === 'transactions' ? '#fff' : '#9ca3af',
                          fontWeight: 700,
                          fontSize: '14px',
                          padding: '10px 0',
                          cursor: 'pointer'
                        }}
                      >
                        Transactions
                      </button>
                      <button
                        onClick={() => setPaySubTab('manage')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: paySubTab === 'manage' ? '2px solid #fff' : '2px solid transparent',
                          color: paySubTab === 'manage' ? '#fff' : '#9ca3af',
                          fontWeight: 700,
                          fontSize: '14px',
                          padding: '10px 0',
                          cursor: 'pointer'
                        }}
                      >
                        Manage
                      </button>
                    </div>
                  </div>

                  {paySubTab === 'transactions' ? (
                    <div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '30px' }}>
                        {['All', 'Donations', 'Sponsorships', 'API Credits', 'Subscriptions', 'Others'].map((pill, i) => (
                          <button
                            key={i}
                            style={{
                              background: i === 0 ? '#1f2937' : '#140a0a',
                              color: i === 0 ? '#fff' : '#9ca3af',
                              border: '1px solid #2b1414',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {pill}
                          </button>
                        ))}
                      </div>

                      <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                        <div style={{ fontSize: '48px', color: '#6b7280' }}>👝</div>
                        <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>Your transactions</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', maxWidth: '420px', lineHeight: 1.5 }}>
                          Looks like you don't have any transactions from the last two years. Any sponsorship contributions or receipts will appear here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#7f1d1d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                          {user?.avatarChar || 'H'}
                        </div>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '14px' }}>{user?.name}</strong>
                          <div style={{ color: '#38bdf8', fontSize: '12px' }}>GitXplore Developer Account</div>
                        </div>
                      </div>

                      <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ height: '140px', background: 'linear-gradient(135deg, #0284c7, #0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px' }}>
                          💳
                        </div>
                        <div style={{ padding: '20px' }}>
                          <strong style={{ color: '#fff', fontSize: '15px' }}>Add a payment method</strong>
                          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '6px 0 16px' }}>Save a card or link your PayPal to sponsor open-source maintainers easily.</p>
                          <button onClick={() => setSubModalConfig({ title: 'Add a payment method', type: 'add_payment' })} style={{ width: '100%', background: '#261414', color: '#fef08a', border: '1px solid #3d1b1b', padding: '10px', borderRadius: '24px', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}>
                            Add payment method
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#fff' }}>Billing address & info</h4>
                        <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                          {renderMetaGroupItem({ title: 'Billing address', subtitle: 'Da Nang, Vietnam', onClick: () => alert('Billing address updated.') })}
                          {renderMetaGroupItem({ title: 'Email address', subtitle: personalDetails.altEmail || user?.identifier, onClick: () => openEditDetails('contact') })}
                          {renderMetaGroupItem({ title: 'Phone number', subtitle: personalDetails.phone || 'None', isLast: true, onClick: () => openEditDetails('contact') })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 7. SPONSORSHIPS & SUBSCRIPTIONS */}
              {activeSideMenu === 'subscriptions' && (
                <>
                  <div>
                    <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Sponsorships & Subscriptions</h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Find and manage your repository sponsorships and maintainer subscriptions in one place.</p>
                  </div>

                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden', marginTop: '10px' }}>
                    {renderMetaGroupItem({
                      icon: '⭐',
                      title: 'Open Source Creators & Maintainers',
                      subtitle: 'Sponsor developers maintaining tools you use every day.',
                      isLast: true,
                      onClick: () => setSubModalConfig({ title: 'Sponsor a Creator', type: 'sponsor_creator' })
                    })}
                  </div>
                </>
              )}

              {/* 8. MANAGE ACCOUNTS */}
              {activeSideMenu === 'manage' && (
                <>
                  <div>
                    <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Manage accounts</h1>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                      Control which accounts are linked to this GitXplore Accounts Center.
                    </p>
                  </div>

                  <div 
                    onClick={() => setSubModalConfig({ title: 'Add Accounts', type: 'add_account' })}
                    style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', padding: '14px 20px', color: '#38bdf8', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}
                  >
                    + Add accounts
                  </div>

                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #241212' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>GitXplore Core / GitHub</span>
                      <button 
                        onClick={() => alert('Account session is healthy and active.')} 
                        style={{ background: '#261212', color: '#fef08a', border: '1px solid #3d1b1b', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Manage
                      </button>
                    </div>

                    <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#7f1d1d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                        {user?.avatarChar || 'H'}
                      </div>
                      <strong style={{ color: '#fff', fontSize: '14px' }}>{user?.name}</strong>
                    </div>
                  </div>
                </>
              )}

            </div>

          </div>
        )}

        {/* TAB 2: SAVED REPOSITORIES */}
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

        {/* TAB 3: ACTIVITY HISTORY */}
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
      {/* MODAL 1: SỬA THỦ CÔNG PERSONAL DETAILS                    */}
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
                      placeholder="+84 ..." 
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

      {/* ======================================================== */}
      {/* MODAL 2: TƯƠNG TÁC ĐẦY ĐỦ CÁC MỤC CON TRONG ACCOUNTS      */}
      {/* ======================================================== */}
      {subModalConfig && (
        <div className="modal-overlay" onClick={() => setSubModalConfig(null)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '520px', padding: '26px', background: '#120808', border: '1px solid #3d1b1b', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #261212', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#fef08a', fontSize: '18px' }}>{subModalConfig.title}</h3>
              <button onClick={() => setSubModalConfig(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Change Password Form */}
            {subModalConfig.type === 'password' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (newPassword !== confirmNewPassword) {
                  alert('New passwords do not match!');
                  return;
                }
                alert('Password updated successfully.');
                setSubModalConfig(null);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#a8a29e' }}>Current Password</label>
                  <input type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="lusion-search" style={{ width: '100%', borderRadius: '8px', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#a8a29e' }}>New Password</label>
                  <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="lusion-search" style={{ width: '100%', borderRadius: '8px', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#a8a29e' }}>Confirm New Password</label>
                  <input type="password" required value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="lusion-search" style={{ width: '100%', borderRadius: '8px', marginTop: '4px' }} />
                </div>
                <button type="submit" className="link-btn btn-primary" style={{ marginTop: '10px' }}>Update Password</button>
              </form>
            )}

            {/* Two-Factor Authentication */}
            {subModalConfig.type === '2fa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: '#d1d5db', margin: 0 }}>
                  We will require a security code whenever you log in from an unverified workstation.
                </p>
                <div style={{ background: '#1c0f0f', padding: '14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '14px' }}>Authentication Code (SMS/App)</strong>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>{twoFactorEnabled ? 'Currently Active' : 'Disabled'}</div>
                  </div>
                  <button 
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className="link-btn btn-secondary" 
                    style={{ padding: '6px 14px' }}
                  >
                    {twoFactorEnabled ? 'Turn off' : 'Turn on'}
                  </button>
                </div>
              </div>
            )}

            {/* Saved Login */}
            {subModalConfig.type === 'saved_login' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Active browser sessions configured to skip multi-step verification:</p>
                <div style={{ background: '#180d0d', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '13.5px' }}>Chrome on Windows</strong>
                    <div style={{ fontSize: '11.5px', color: '#10b981' }}>Active right now</div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#f59e0b' }}>Protected</span>
                </div>
                <button onClick={() => { alert('All saved browser tokens purged.'); setSubModalConfig(null); }} className="link-btn btn-secondary" style={{ marginTop: '8px' }}>
                  Remove all saved browsers
                </button>
              </div>
            )}

            {/* Passkey */}
            {subModalConfig.type === 'passkey' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: '#d1d5db', margin: 0 }}>
                  Passkeys allow you to securely sign in using your biometric face, fingerprint, or Windows Hello PIN.
                </p>
                <button onClick={() => { alert('Windows Hello / Biometric Passkey registered successfully.'); setSubModalConfig(null); }} className="link-btn btn-primary">
                  🔑 Register Windows Passkey
                </button>
              </div>
            )}

            {/* Active Sessions */}
            {subModalConfig.type === 'sessions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#1a0d0d', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                  <strong style={{ color: '#fff', fontSize: '13.5px' }}>Windows PC (Da Nang, Vietnam)</strong>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Chrome Browser • Active session</div>
                </div>
                <button onClick={() => { alert('All other remote devices signed out.'); setSubModalConfig(null); }} className="link-btn btn-secondary" style={{ marginTop: '6px' }}>
                  Log out of all other sessions
                </button>
              </div>
            )}

            {/* Recent Emails */}
            {subModalConfig.type === 'emails' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: '#160b0b', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ color: '#fef08a', fontSize: '13px', fontWeight: 600 }}>Security alert: New login detected</div>
                  <div style={{ color: '#78716c', fontSize: '11px', marginTop: '2px' }}>Sent to {user?.identifier} • 2 hours ago</div>
                </div>
                <div style={{ background: '#160b0b', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ color: '#fef08a', fontSize: '13px', fontWeight: 600 }}>GitXplore Welcome Confirmation</div>
                  <div style={{ color: '#78716c', fontSize: '11px', marginTop: '2px' }}>Sent to {user?.identifier} • Yesterday</div>
                </div>
              </div>
            )}

            {/* Security Checkup */}
            {subModalConfig.type === 'checkup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: '42px' }}>🛡️</div>
                <h4 style={{ margin: 0, color: '#22c55e', fontSize: '16px' }}>Your account is in good standing!</h4>
                <p style={{ margin: '4px 0 14px', fontSize: '13px', color: '#9ca3af' }}>No compromised passwords or suspicious device sign-ins detected.</p>
                <button onClick={() => setSubModalConfig(null)} className="link-btn btn-primary">Done</button>
              </div>
            )}

            {/* Syncing Avatars */}
            {subModalConfig.type === 'sync_avatars' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Automatically use your primary GitHub avatar image across Forum and Explorer.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#160b0b', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ color: '#fff', fontSize: '13.5px' }}>Avatar Synchronization</span>
                  <input type="checkbox" checked={syncAvatars} onChange={(e) => setSyncAvatars(e.target.checked)} style={{ transform: 'scale(1.3)', cursor: 'pointer' }} />
                </div>
                <button onClick={() => setSubModalConfig(null)} className="link-btn btn-primary">Save Preference</button>
              </div>
            )}

            {/* Search History */}
            {subModalConfig.type === 'search_history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Recent queries stored in client cache:</p>
                <div style={{ background: '#160b0b', padding: '10px', borderRadius: '8px', fontSize: '13px', color: '#fef08a' }}>
                  • "three.js shaders"
                  <br />• "supabase realtime"
                  <br />• "react lenis smooth scroll"
                </div>
                <button onClick={() => { alert('Search history cache cleared.'); setSubModalConfig(null); }} className="link-btn btn-secondary">
                  Clear Search History
                </button>
              </div>
            )}

            {/* Add Payment Method */}
            {subModalConfig.type === 'add_payment' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                alert('Card linked to GitXplore Developer Wallet.');
                setSubModalConfig(null);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#a8a29e' }}>Card Number</label>
                  <input type="text" required placeholder="4242 •••• •••• 4242" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="lusion-search" style={{ width: '100%', borderRadius: '8px', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#a8a29e' }}>Expiry Date (MM/YY)</label>
                  <input type="text" required placeholder="12/28" value={cardExp} onChange={(e) => setCardExp(e.target.value)} className="lusion-search" style={{ width: '100%', borderRadius: '8px', marginTop: '4px' }} />
                </div>
                <button type="submit" className="link-btn btn-primary" style={{ marginTop: '6px' }}>Save Payment Card</button>
              </form>
            )}

            {/* Sponsor Creator */}
            {subModalConfig.type === 'sponsor_creator' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Select an open-source tier to support repository development:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div onClick={() => { alert('Tier 1 ($5/mo) selected.'); setSubModalConfig(null); }} style={{ background: '#180d0d', border: '1px solid #3d1b1b', padding: '14px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer' }}>
                    <strong style={{ color: '#fbbf24', fontSize: '16px' }}>$5 / mo</strong>
                    <div style={{ fontSize: '11px', color: '#a8a29e', marginTop: '4px' }}>Supporter Badge</div>
                  </div>
                  <div onClick={() => { alert('Tier 2 ($25/mo) selected.'); setSubModalConfig(null); }} style={{ background: '#180d0d', border: '1px solid #3d1b1b', padding: '14px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer' }}>
                    <strong style={{ color: '#ef4444', fontSize: '16px' }}>$25 / mo</strong>
                    <div style={{ fontSize: '11px', color: '#a8a29e', marginTop: '4px' }}>Gold Sponsor Tier</div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Secondary Account */}
            {subModalConfig.type === 'add_account' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                alert(`Linking request dispatched to ${newAccountInput}.`);
                setNewAccountInput('');
                setSubModalConfig(null);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Enter username or email of the developer account you wish to link:</p>
                <input type="text" required placeholder="github_handle or email" value={newAccountInput} onChange={(e) => setNewAccountInput(e.target.value)} className="lusion-search" style={{ width: '100%', borderRadius: '8px' }} />
                <button type="submit" className="link-btn btn-primary">Authorize & Connect</button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}