import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { openSourceProjects } from '../data/projectsData';
import FeatureModal, { useAcStore, TransactionsView, SubscriptionsList, LinkedAccountsList } from './AccountsCenterFeatures.jsx';

const SECTIONS = [
  'profiles', 'security', 'connected', 'permissions', 'activity',
  'billing', 'subscriptions', 'manage', 'saved', 'history',
];

export default function SavedDashboard() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const onBack = () => navigate('/');

  // Mục menu lấy từ URL (/accountscenter/:section) bằng useParams — không cần state riêng
  // nên Back/Forward của trình duyệt tự đúng.
  const { section } = useParams();
  const activeMenu = SECTIONS.includes(section) ? section : 'profiles';

  // Profile fields
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Personal details
  const [personalDetails, setPersonalDetails] = useState({
    phone: '',
    altEmail: '',
    birthday: '',
  });
  const [editingDetailType, setEditingDetailType] = useState(null); // 'contact' | 'birthday' | null
  const [tempPhone, setTempPhone] = useState('');
  const [tempAltEmail, setTempAltEmail] = useState('');
  const [tempBirthday, setTempBirthday] = useState('');

  // Sub-tabs cho Billing & Activity
  const [paySubTab, setPaySubTab] = useState('transactions'); // 'transactions' | 'manage'
  const [activitySubTab, setActivitySubTab] = useState('projects'); // 'projects' | 'topics'

  // Sub-modal chức năng chi tiết
  const [subModal, setSubModal] = useState(null);


  // Saved Repos & History
  const [savedList, setSavedList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [store, patch] = useAcStore(user?.identifier);

  const logHistory = (action, details) => setHistoryList((prev) => {
    const next = [{ id: Date.now(), action, details, time: new Date().toLocaleString() }, ...prev].slice(0, 100);
    try { localStorage.setItem(`hist_${user.identifier}`, JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  });
  const handleClearHistory = () => {
    setHistoryList([]);
    try { localStorage.setItem(`hist_${user.identifier}`, '[]'); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!user?.identifier) return;

    // Load Personal Details
    const storedDetails = JSON.parse(localStorage.getItem(`details_${user.identifier}`) || '{}');
    setPersonalDetails({
      phone: storedDetails.phone || '',
      altEmail: storedDetails.altEmail || user.identifier,
      birthday: storedDetails.birthday || '',
    });

    // Load Saved Repos
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
        { id: 1, action: 'Visited Community Forum', details: 'Participated in open-source discussions', time: 'Just now' },
        { id: 2, action: 'Viewed Repository', details: 'Explored Mark LXXXV Kinetic Protocol', time: '1 hour ago' },
        { id: 3, action: 'Account Authentication', details: `Signed in as ${user.identifier}`, time: 'Today at 08:30 PM' },
      ]);
    }
  }, [user?.identifier]);

  // Đổi mục menu và cập nhật URL trình duyệt chuẩn accountscenter style
  const handleSelectMenu = (menuKey) => {
    navigate(`/accountscenter/${menuKey}`);
  };

  const handleUpdateName = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setIsSaving(true);
    updateUser({ name: nameInput.trim() }); // AuthContext tự lưu localStorage
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
    logHistory('Repository removed', savedList.find((p) => p.id === id)?.name || String(id));
    setSavedList(next);
    localStorage.setItem(`saved_${user.identifier}`, JSON.stringify(next.map((p) => p.id)));
  };

  const handleExportData = () => {
    // eslint-disable-next-line no-unused-vars
    const { pwHash, backupCodes, ...settings } = store;
    const dataObj = { user, personalDetails, settings, savedRepositories: savedList, history: historyList };
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gitxplore_account_${user?.name || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url); // giải phóng bộ nhớ
  };

  const renderGroupItem = ({ icon, title, subtitle, onClick, hasArrow = true, isLast = false }) => (
    <div
      onClick={onClick}
      style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: isLast ? 'none' : '1px solid #1f1212',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#1a0d0d')}
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
    <div style={{ width: '100%', minHeight: '100vh', background: '#070404', color: '#fef3c7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG CỦA ACCOUNTS CENTER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4vw', background: '#0e0707', borderBottom: '1px solid #241111', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={onBack}
            className="link-btn btn-secondary"
            style={{ padding: '7px 14px', fontSize: '12.5px', cursor: 'pointer' }}
          >
            ← Return to GitXplore
          </button>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#fef08a', letterSpacing: '0.5px' }}>
            GIT<span style={{ color: '#ef4444' }}>XPLORE</span> ACCOUNTS CENTER
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12.5px', color: '#a8a29e' }}>
            Active: <strong style={{ color: '#fef08a' }}>{user?.name || user?.identifier}</strong>
          </span>
          <button
            type="button"
            onClick={() => { logout(); onBack(); }}
            style={{ background: '#241010', color: '#f87171', border: '1px solid #4a1d1d', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* KHUNG NỘI DUNG CHÍNH (2 CỘT META STYLE TOÀN DIỆN) */}
      <main style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 16px' }}>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '320px 1fr', background: '#120909', border: '1px solid #2b1414', borderRadius: '24px', overflow: 'hidden', minHeight: '82vh', boxShadow: '0 25px 60px rgba(0,0,0,0.85)' }}>
          
          {/* NÚT TẮT X GÓC TRÊN BÊN PHẢI CHUẨN META */}
          <button
            type="button"
            onClick={onBack}
            title="Close and return to Home"
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#1f1010',
              border: '1px solid #3d1b1b',
              color: '#d1d5db',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#1f1010')}
          >
            ✕
          </button>

          {/* ======================================================== */}
          {/* CỘT TRÁI: SIDEBAR SETTINGS (CHUẨN META ACCOUNTS CENTER)   */}
          {/* ======================================================== */}
          <aside style={{ padding: '30px 24px', borderRight: '1px solid #241111', background: '#0e0707', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 700 }}>
                <span>♾️</span> GitXplore
              </div>
              <h2 style={{ margin: '6px 0 4px', fontSize: '22px', fontWeight: 700, color: '#fff' }}>Accounts Center</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#8c827a', lineHeight: 1.5 }}>
                Manage your connected experiences and developer profile settings across GitXplore technologies.
              </p>
            </div>

            {/* Profiles and personal details Tab */}
            <div 
              onClick={() => handleSelectMenu('profiles')}
              style={{
                background: activeMenu === 'profiles' ? '#261414' : 'transparent',
                color: activeMenu === 'profiles' ? '#fef08a' : '#d1d5db',
                padding: '12px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: activeMenu === 'profiles' ? '1px solid #4a1d1d' : '1px solid transparent'
              }}
            >
              <span>👤</span> Profiles and personal details
            </div>

            {/* Danh mục Account Settings */}
            <div>
              <span style={{ fontSize: '11px', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Account settings
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                {[
                  { id: 'security', icon: '🛡️', label: 'Password and security' },
                  { id: 'connected', icon: '🔗', label: 'Connected experiences' },
                  { id: 'permissions', icon: '📄', label: 'Your information and permissions' },
                  { id: 'activity', icon: '🚀', label: 'Project activity & tracking' },
                  { id: 'billing', icon: '💳', label: 'Billing & Payments' },
                  { id: 'subscriptions', icon: '⭐', label: 'Sponsorships & Subscriptions' },
                  { id: 'manage', icon: '👥', label: 'Manage accounts' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectMenu(item.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      color: activeMenu === item.id ? '#fef08a' : '#9ca3af',
                      background: activeMenu === item.id ? '#1e0e0e' : 'transparent',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s'
                    }}
                    onMouseEnter={(e) => { if (activeMenu !== item.id) e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { if (activeMenu !== item.id) e.currentTarget.style.color = '#9ca3af'; }}
                  >
                    <span>{item.icon}</span> {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Mục bổ sung: Repositories & History */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid #201010', paddingTop: '16px' }}>
              <span style={{ fontSize: '11px', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Quick Vault
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                <div
                  onClick={() => handleSelectMenu('saved')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    color: activeMenu === 'saved' ? '#fef08a' : '#9ca3af',
                    background: activeMenu === 'saved' ? '#1e0e0e' : 'transparent',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ⭐ Saved Repositories ({savedList.length})
                </div>
                <div
                  onClick={() => handleSelectMenu('history')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    color: activeMenu === 'history' ? '#fef08a' : '#9ca3af',
                    background: activeMenu === 'history' ? '#1e0e0e' : 'transparent',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  🕒 Activity History
                </div>
              </div>
            </div>
          </aside>

          {/* ======================================================== */}
          {/* CỘT PHẢI: NỘI DUNG TƯƠNG ỨNG VỚI TỪNG MENU (ĐỦ 100%)       */}
          {/* ======================================================== */}
          <section style={{ padding: '36px 44px', background: '#120909', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', maxHeight: '82vh' }}>
            
            {/* 1. PROFILES AND PERSONAL DETAILS */}
            {activeMenu === 'profiles' && (
              <>
                <div onClick={() => setSubModal({ title: 'Upcoming updates', type: 'roadmap' })} style={{ cursor: 'pointer', background: '#180d0d', border: '1px solid #381a1a', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                {/* Profiles section */}
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
                        onClick={() => setSubModal({ title: 'Add Accounts', type: 'add_account' })}
                        style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        + Add accounts
                      </button>
                    </div>
                  </div>
                </div>

                {/* Personal Details (Sửa thủ công) */}
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

                {/* More from GitXplore */}
                <div>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    More from GitXplore
                  </span>
                  <div onClick={() => setSubModal({ title: 'AI Glasses', type: 'ai_glasses' })} style={{ cursor: 'pointer', marginTop: '10px', width: '220px', background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '36px' }}>🕶️</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>AI Glasses</div>
                    <div style={{ fontSize: '11px', color: '#8c827a', textAlign: 'center' }}>Smart assistant integration</div>
                  </div>
                </div>
              </>
            )}

            {/* 2. PASSWORD AND SECURITY */}
            {activeMenu === 'security' && (
              <>
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Password and security</h1>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#fff' }}>Login & recovery</h3>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#9ca3af' }}>Manage your passwords, login preferences and recovery methods.</p>

                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ title: 'Change password', onClick: () => setSubModal({ title: 'Change password', type: 'password' }) })}
                    {renderGroupItem({ title: 'Two-factor authentication', subtitle: 'Enhance your security checkpoint', onClick: () => setSubModal({ title: 'Two-factor authentication', type: '2fa' }) })}
                    {renderGroupItem({ title: 'Saved login', subtitle: 'Remember active browsers', onClick: () => setSubModal({ title: 'Saved login', type: 'saved_login' }) })}
                    {renderGroupItem({ title: 'Passkey', subtitle: 'Biometric and security key access', isLast: true, onClick: () => setSubModal({ title: 'Passkey Management', type: 'passkey' }) })}
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#fff' }}>Security checks</h3>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#9ca3af' }}>Review security issues by running checks across apps, devices and emails sent.</p>

                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ title: "Where you're logged in", subtitle: '1 active session on Windows PC', onClick: () => setSubModal({ title: "Where you're logged in", type: 'sessions' }) })}
                    {renderGroupItem({ title: 'Recent emails', subtitle: 'Security and login notifications', onClick: () => setSubModal({ title: 'Recent emails', type: 'emails' }) })}
                    {renderGroupItem({ title: 'Security Checkup', subtitle: 'Keep your account shielded', isLast: true, onClick: () => setSubModal({ title: 'Security Checkup', type: 'checkup' }) })}
                  </div>
                </div>
              </>
            )}

            {/* 3. CONNECTED EXPERIENCES */}
            {activeMenu === 'connected' && (
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
                    {renderGroupItem({ icon: '🔄', title: 'Sharing across profiles', subtitle: 'Cross-post repository activities', onClick: () => setSubModal({ title: 'Sharing across profiles', type: 'sharing' }) })}
                    {renderGroupItem({ icon: '🐙', title: 'GitHub Stars and Repository Sync', subtitle: 'Keep bookmarked repositories up to date', onClick: () => setSubModal({ title: 'GitHub Stars and Repository Sync', type: 'ghsync' }) })}
                    {renderGroupItem({ icon: '📁', title: 'Developer commits & showcases', subtitle: 'Show latest project milestones in community', onClick: () => setSubModal({ title: 'Developer commits & showcases', type: 'showcases' }) })}
                    {renderGroupItem({ icon: '💻', title: 'Media on developer workstations', subtitle: 'Stream code snippets to connected devices', isLast: true, onClick: () => setSubModal({ title: 'Media on developer workstations', type: 'workstations' }) })}
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#fff' }}>Profile info and access</h3>
                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ icon: '🖼️', title: 'Syncing profile avatars', subtitle: store.syncAvatar !== false ? 'Enabled' : 'Disabled', onClick: () => setSubModal({ title: 'Syncing profile avatars', type: 'sync_avatar' }) })}
                    {renderGroupItem({ icon: '🔗', title: 'Showing links for your repositories', isLast: true, onClick: () => setSubModal({ title: 'Showing links for your repositories', type: 'repolinks' }) })}
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#fff' }}>Collaborators and network</h3>
                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ icon: '👥', title: 'Following developers in GitXplore Network', isLast: true, onClick: () => setSubModal({ title: 'Following developers', type: 'following' }) })}
                  </div>
                </div>
              </>
            )}

            {/* 4. YOUR INFORMATION AND PERMISSIONS */}
            {activeMenu === 'permissions' && (
              <>
                <div>
                  <h1 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Your information and permissions</h1>
                  <div style={{ background: '#180d0d', border: '1px solid #381a1a', borderRadius: '24px', padding: '14px 20px', fontSize: '13px', color: '#d1d5db', marginBottom: '20px' }}>
                    To download or transfer a copy of your developer data, go to Export your Information below.
                  </div>
                </div>

                <div>
                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ title: 'Export your information', subtitle: 'Download JSON archive file', onClick: handleExportData })}
                    {renderGroupItem({ title: 'Access your information', subtitle: 'Inspect data recorded across sessions', onClick: () => setSubModal({ title: 'Access your information', type: 'access_info' }) })}
                    {renderGroupItem({ title: 'Search history', subtitle: 'Manage search queries and cache', isLast: true, onClick: () => setSubModal({ title: 'Search History', type: 'search_history' }) })}
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ title: 'Activity from open-source organizations', onClick: () => setSubModal({ title: 'Open-source organizations', type: 'orgs' }) })}
                    {renderGroupItem({ title: 'OAuth token connections', onClick: () => setSubModal({ title: 'OAuth token connections', type: 'tokens' }) })}
                    {renderGroupItem({ title: 'External accounts (GitHub, Discord)', onClick: () => setSubModal({ title: 'External accounts', type: 'external' }) })}
                    {renderGroupItem({ title: 'Identity confirmation', isLast: true, onClick: () => setSubModal({ title: 'Identity confirmation', type: 'identity' }) })}
                  </div>
                </div>
              </>
            )}

            {/* 5. PROJECT ACTIVITY & TRACKING */}
            {activeMenu === 'activity' && (
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
                      onClick={() => setActivitySubTab('topics')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activitySubTab === 'topics' ? '2px solid #fff' : '2px solid transparent',
                        color: activitySubTab === 'topics' ? '#fff' : '#9ca3af',
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
                        {renderGroupItem({ icon: '⚛️', title: 'React Open Source', subtitle: 'Latest core commits and compiler updates', onClick: () => setSubModal({ title: 'Tracked repositories', type: 'trackers' }) })}
                        {renderGroupItem({ icon: '🌐', title: 'Next.js Framework', subtitle: 'App router & server actions tracking', onClick: () => setSubModal({ title: 'Tracked repositories', type: 'trackers' }) })}
                        {renderGroupItem({ icon: '⚡', title: 'GSAP Animations', subtitle: 'ScrollTrigger & animation timeline engine', isLast: true, onClick: () => setSubModal({ title: 'Tracked repositories', type: 'trackers' }) })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#fff' }}>Technology Domains</h3>
                    <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                      {renderGroupItem({ icon: '🤖', title: 'Artificial Intelligence & Neural Networks', onClick: () => setSubModal({ title: 'Monitored topics', type: 'topics' }) })}
                      {renderGroupItem({ icon: '🎮', title: 'WebGL, WebGPU & 3D Shaders', onClick: () => setSubModal({ title: 'Monitored topics', type: 'topics' }) })}
                      {renderGroupItem({ icon: '☁️', title: 'Cloud Native & Edge Computing', isLast: true, onClick: () => setSubModal({ title: 'Monitored topics', type: 'topics' }) })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 6. BILLING & PAYMENTS */}
            {activeMenu === 'billing' && (
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
                    <TransactionsView store={store} />
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
                        <button onClick={() => setSubModal({ title: 'Add a payment method', type: 'add_payment' })} style={{ width: '100%', background: '#261414', color: '#fef08a', border: '1px solid #3d1b1b', padding: '10px', borderRadius: '24px', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}>
                          {store.cards?.length ? `Payment methods (${store.cards.length})` : 'Add payment method'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#fff' }}>Billing address & info</h4>
                      <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                        {renderGroupItem({ title: 'Billing address', subtitle: store.address || 'Not specified', onClick: () => setSubModal({ title: 'Billing address', type: 'address' }) })}
                        {renderGroupItem({ title: 'Email address', subtitle: personalDetails.altEmail || user?.identifier, onClick: () => openEditDetails('contact') })}
                        {renderGroupItem({ title: 'Phone number', subtitle: personalDetails.phone || 'None', isLast: true, onClick: () => openEditDetails('contact') })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 7. SPONSORSHIPS & SUBSCRIPTIONS */}
            {activeMenu === 'subscriptions' && (
              <>
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Sponsorships & Subscriptions</h1>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Find and manage your repository sponsorships and maintainer subscriptions in one place.</p>
                </div>

                <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden', marginTop: '10px' }}>
                  {renderGroupItem({
                    icon: '⭐',
                    title: 'Open Source Creators & Maintainers',
                    subtitle: 'Sponsor developers maintaining tools you use every day.',
                    isLast: true,
                    onClick: () => setSubModal({ title: 'Sponsor a Creator', type: 'sponsor_creator' })
                  })}
                </div>
              </>
            )}

            {activeMenu === 'subscriptions' && <SubscriptionsList store={store} patch={patch} log={logHistory} />}

            {/* 8. MANAGE ACCOUNTS */}
            {activeMenu === 'manage' && (
              <>
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>Manage accounts</h1>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                    Control which accounts are linked to this GitXplore Accounts Center.
                  </p>
                </div>

                <div 
                  onClick={() => setSubModal({ title: 'Add Accounts', type: 'add_account' })}
                  style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', padding: '14px 20px', color: '#38bdf8', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  + Add accounts
                </div>

                <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #241212' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>GitXplore Core / GitHub</span>
                    <button 
                      onClick={() => setSubModal({ title: 'Manage account', type: 'account_manage', arg: 'primary' })} 
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

            {activeMenu === 'manage' && <LinkedAccountsList store={store} open={setSubModal} />}

            {/* 9. SAVED REPOSITORIES */}
            {activeMenu === 'saved' && (
              <div>
                <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>⭐ Saved Repositories ({savedList.length})</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {savedList.map((project) => (
                    <div key={project.id} style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                        <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '17px' }}>{project.name}</h3>
                        <p style={{ margin: 0, color: '#a8a29e', fontSize: '12.5px', lineHeight: 1.5 }}>{project.description}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
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
              </div>
            )}

            {/* 10. HISTORY */}
            {activeMenu === 'history' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px' }}>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>🕒 Activity History</h1>
                  {historyList.length > 0 && <button type="button" onClick={handleClearHistory} className="link-btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>Clear history</button>}
                </div>
                {historyList.length === 0 && <p style={{ color: '#9ca3af', fontSize: '13px' }}>No activity yet.</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historyList.map((item, index) => (
                    <div key={index} style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#fef08a', fontSize: '14.5px' }}>{item.action}</h4>
                        <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '12.5px' }}>{item.details}</p>
                      </div>
                      <span style={{ fontSize: '12px', color: '#78716c' }}>{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>

        </div>
      </main>

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
      {/* MODAL 2: TƯƠNG TÁC CÁC TÍNH NĂNG CON CỦA ACCOUNTS CENTER   */}
      {/* ======================================================== */}
      {subModal && (
        <div className="modal-overlay" onClick={() => setSubModal(null)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '500px', padding: '26px', background: '#120808', border: '1px solid #3d1b1b', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #261212', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#fef08a', fontSize: '18px' }}>{subModal.title}</h3>
              <button onClick={() => setSubModal(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            <FeatureModal
              type={subModal.type}
              title={subModal.title}
              arg={subModal.arg}
              user={user}
              store={store}
              patch={patch}
              saved={savedList}
              log={logHistory}
              open={setSubModal}
              close={() => setSubModal(null)}
              onExport={handleExportData}
            />

          </div>
        </div>
      )}

    </div>
  );
}
