import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { openSourceProjects } from '../data/projectsData';
import FeatureModal, { useAcStore, LinkedAccountsList } from './AccountsCenterFeatures';

const SECTIONS = [
  'profiles', 'security', 'connected', 'permissions', 'activity',
  'billing', 'subscriptions', 'manage', 'saved', 'history', 'language',
];

export default function SavedDashboard() {
  const { user, updateUser, logout } = useAuth();
  const { t: tr, lang, setLang, languages } = useLanguage();
  const navigate = useNavigate();
  const onBack = () => navigate('/');

  // Mục menu lấy từ URL (/accountscenter/:section) bằng useParams — không cần state riêng
  // nên Back/Forward của trình duyệt tự đúng.
  const { section } = useParams();
  const activeMenu = SECTIONS.includes(section) ? section : 'profiles';

  // Accounts Center store & Activity logger
  const [acStore, patchAc] = useAcStore(user?.identifier);

  const logAc = (action, details) => {
    const item = { id: Date.now(), action, details, time: 'Just now' };
    setHistoryList((prev) => [item, ...prev].slice(0, 50));
    try {
      const localHist = JSON.parse(localStorage.getItem(`hist_${user?.identifier}`) || '[]');
      localStorage.setItem(`hist_${user?.identifier}`, JSON.stringify([item, ...localHist].slice(0, 50)));
    } catch {}
  };

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
    setSavedList(next);
    localStorage.setItem(`saved_${user.identifier}`, JSON.stringify(next.map((p) => p.id)));
  };

  const handleExportData = () => {
    const dataObj = { user, personalDetails, savedRepositories: savedList, history: historyList };
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
            {tr('acc_return')}
          </button>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#fef08a', letterSpacing: '0.5px' }}>
            GIT<span style={{ color: '#ef4444' }}>XPLORE</span> {tr('acc_title').toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12.5px', color: '#a8a29e' }}>
            {tr('ui_active')} <strong style={{ color: '#fef08a' }}>{user?.name || user?.identifier}</strong>
          </span>
          <button
            type="button"
            onClick={() => { logout(); onBack(); }}
            style={{ background: '#241010', color: '#f87171', border: '1px solid #4a1d1d', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
          >
            {tr('signout')}
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
              <h2 style={{ margin: '6px 0 4px', fontSize: '22px', fontWeight: 700, color: '#fff' }}>{tr('acc_title')}</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#8c827a', lineHeight: 1.5 }}>
                {tr('acc_sub')}
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
              <span>👤</span> {tr('acc_profiles_title')}
            </div>

            {/* Danh mục Account Settings */}
            <div>
              <span style={{ fontSize: '11px', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {tr('acc_settings')}
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                {[
                  { id: 'security', icon: '🛡️', label: tr('acc_sec') },
                  { id: 'connected', icon: '🔗', label: tr('acc_conn') },
                  { id: 'permissions', icon: '📄', label: tr('acc_perm') },
                  { id: 'activity', icon: '🚀', label: tr('acc_act') },
                  { id: 'billing', icon: '💳', label: tr('acc_bill') },
                  { id: 'subscriptions', icon: '⭐', label: tr('acc_sub_menu') },
                  { id: 'manage', icon: '👥', label: tr('acc_manage') },
                  { id: 'language', icon: '🌐', label: tr('ui_acc_language') },
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
                {tr('ui_quick_vault')}
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
                  ⭐ {tr('saved_repos')} ({savedList.length})
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
                  🕒 {tr('history')}
                </div>
              </div>
            </div>
          </aside>

          {/* ======================================================== */}
          {/* CỘT PHẢI: NỘI DUNG TƯƠNG ỨNG VỚI TỪNG MENU (ĐỦ 100%)       */}
          {/* ======================================================== */}
          <section style={{ padding: '36px 44px', background: '#120909', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', maxHeight: '82vh' }}>
            
            {/* 0. LANGUAGE */}
            {activeMenu === 'language' && (
              <div>
                <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>🌐 {tr('ui_acc_language')}</h1>
                <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#9ca3af' }}>{tr('ui_acc_language_sub')}</p>
                <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                  {languages.map((l, i) => {
                    const on = l.code === lang;
                    return (
                      <div
                        key={l.code}
                        role="button"
                        tabIndex={0}
                        aria-pressed={on}
                        onClick={() => setLang(l.code)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLang(l.code); } }}
                        style={{
                          padding: '14px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          cursor: 'pointer',
                          background: on ? '#261414' : 'transparent',
                          borderBottom: i === languages.length - 1 ? 'none' : '1px solid #1f1212',
                        }}
                      >
                        <span style={{ fontSize: '22px' }}>{l.flag}</span>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: on ? '#fef08a' : '#f3f4f6' }}>{l.label}</span>
                        {on && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: '#f59e0b', color: '#1a1006' }}>
                            {tr('ui_current')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 1. PROFILES AND PERSONAL DETAILS */}
            {activeMenu === 'profiles' && (
              <>
                <div 
                  onClick={() => setSubModal({ title: tr('ac_roadmap_title'), type: 'roadmap' })}
                  style={{ background: '#180d0d', border: '1px solid #381a1a', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      🚀
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{tr('ac_roadmap_sub')}</div>
                      <div style={{ color: '#8c827a', fontSize: '11.5px' }}>{tr('ac_roadmap_desc')}</div>
                    </div>
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: '16px' }}>›</span>
                </div>

                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>{tr('acc_profiles_title')}</h1>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af', lineHeight: 1.5 }}>
                    {tr('acc_profiles_sub')}
                  </p>
                </div>

                {/* Profiles section */}
                <div>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {tr('acc_profiles_group')}
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
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>{user?.name}{user?.publicId && <span title="Account ID" style={{ marginLeft: '8px', padding: '1px 7px', fontSize: '11.5px', fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.35)', borderRadius: '6px' }}>#{user.publicId}</span>}</div>
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
                          {isSaving ? '...' : tr('acc_btn_save')}
                        </button>
                      </form>
                    )}

                    <div style={{ padding: '12px 20px', borderTop: '1px solid #221212', background: '#140b0b' }}>
                      <button 
                        onClick={() => setSubModal({ title: tr('acc_add_acc_btn'), type: 'add_account' })}
                        style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        {tr('acc_add_acc_btn')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Personal Details (Sửa thủ công) */}
                <div>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {tr('acc_personal_details')}
                  </span>

                  <div style={{ marginTop: '10px', background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    <div 
                      onClick={() => openEditDetails('contact')}
                      style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #241212', cursor: 'pointer' }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{tr('acc_contact_info')}</div>
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
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{tr('acc_birthday')}</div>
                        <div style={{ fontSize: '12.5px', color: '#9ca3af', marginTop: '2px' }}>
                          {personalDetails.birthday ? personalDetails.birthday : tr('acc_not_specified')}
                        </div>
                      </div>
                      <span style={{ color: '#9ca3af', fontSize: '18px' }}>›</span>
                    </div>
                  </div>
                </div>

                {/* More from GitXplore */}
                <div>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {tr('acc_more_from_gx')}
                  </span>
                  <div 
                    onClick={() => setSubModal({ title: tr('ac_glasses_title'), type: 'ai_glasses' })}
                    style={{ marginTop: '10px', width: '220px', background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '36px' }}>🕶️</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{tr('ac_glasses_title')}</div>
                    <div style={{ fontSize: '11px', color: '#8c827a', textAlign: 'center' }}>{tr('ac_glasses_sub')}</div>
                  </div>
                </div>
              </>
            )}

            {/* 2. PASSWORD AND SECURITY */}
            {activeMenu === 'security' && (
              <>
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>{tr('acc_sec_title')}</h1>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#fff' }}>{tr('acc_sec_login_rec')}</h3>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#9ca3af' }}>{tr('acc_sec_login_rec_sub')}</p>

                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ title: tr('acc_change_pw'), onClick: () => setSubModal({ title: tr('acc_change_pw'), type: 'password' }) })}
                    {renderGroupItem({ title: tr('acc_2fa'), subtitle: tr('acc_2fa_sub'), onClick: () => setSubModal({ title: tr('acc_2fa'), type: '2fa' }) })}
                    {renderGroupItem({ title: tr('acc_saved_login'), subtitle: tr('acc_saved_login_sub'), onClick: () => setSubModal({ title: tr('acc_saved_login'), type: 'saved_login' }) })}
                    {renderGroupItem({ title: tr('acc_passkey'), subtitle: tr('acc_passkey_sub'), isLast: true, onClick: () => setSubModal({ title: tr('acc_passkey'), type: 'passkey' }) })}
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#fff' }}>{tr('acc_sec_checks')}</h3>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#9ca3af' }}>{tr('acc_sec_checks_sub')}</p>

                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ title: tr('acc_sessions'), subtitle: tr('acc_sessions_sub'), onClick: () => setSubModal({ title: tr('acc_sessions'), type: 'sessions' }) })}
                    {renderGroupItem({ title: tr('acc_emails'), subtitle: tr('acc_emails_sub'), onClick: () => setSubModal({ title: tr('acc_emails'), type: 'emails' }) })}
                    {renderGroupItem({ title: tr('acc_checkup'), subtitle: tr('acc_checkup_sub'), isLast: true, onClick: () => setSubModal({ title: tr('acc_checkup'), type: 'checkup' }) })}
                  </div>
                </div>
              </>
            )}

            {/* 3. CONNECTED EXPERIENCES */}
            {activeMenu === 'connected' && (
              <>
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>{tr('acc_conn_title')}</h1>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                    {tr('acc_conn_sub')}
                  </p>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#fff' }}>{tr('acc_sync_header')}</h3>
                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ icon: '🔄', title: tr('acc_sharing'), subtitle: tr('acc_sharing_sub'), onClick: () => setSubModal({ title: tr('acc_sharing'), type: 'sharing' }) })}
                    {renderGroupItem({ icon: '🐙', title: tr('acc_ghsync'), subtitle: tr('acc_ghsync_sub'), onClick: () => setSubModal({ title: tr('acc_ghsync'), type: 'ghsync' }) })}
                    {renderGroupItem({ icon: '📁', title: tr('acc_showcases'), subtitle: tr('acc_showcases_sub'), onClick: () => setSubModal({ title: tr('acc_showcases'), type: 'showcases' }) })}
                    {renderGroupItem({ icon: '💻', title: tr('acc_workstations'), subtitle: tr('acc_workstations_sub'), isLast: true, onClick: () => setSubModal({ title: tr('acc_workstations'), type: 'workstations' }) })}
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#fff' }}>{tr('acc_profile_access_hdr')}</h3>
                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ icon: '🖼️', title: tr('acc_sync_avatar'), subtitle: acStore.syncAvatar !== false ? 'Enabled' : 'Disabled', onClick: () => setSubModal({ title: tr('acc_sync_avatar'), type: 'sync_avatar' }) })}
                    {renderGroupItem({ icon: '🔗', title: tr('acc_repolinks'), subtitle: 'Public repository link toggles', isLast: true, onClick: () => setSubModal({ title: tr('acc_repolinks'), type: 'repolinks' }) })}
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#fff' }}>{tr('acc_collab_network')}</h3>
                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ icon: '👥', title: tr('acc_following'), subtitle: 'Followed developers & contributors', isLast: true, onClick: () => setSubModal({ title: tr('acc_following'), type: 'following' }) })}
                  </div>
                </div>
              </>
            )}

            {/* 4. YOUR INFORMATION AND PERMISSIONS */}
            {activeMenu === 'permissions' && (
              <>
                <div>
                  <h1 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>{tr('acc_perm_title')}</h1>
                  <div style={{ background: '#180d0d', border: '1px solid #381a1a', borderRadius: '24px', padding: '14px 20px', fontSize: '13px', color: '#d1d5db', marginBottom: '20px' }}>
                    {tr('acc_perm_banner')}
                  </div>
                </div>

                <div>
                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ title: tr('acc_export_info'), subtitle: tr('acc_export_info_sub'), onClick: handleExportData })}
                    {renderGroupItem({ title: tr('acc_access_info'), subtitle: tr('acc_access_info_sub'), onClick: () => setSubModal({ title: tr('acc_access_info'), type: 'access_info' }) })}
                    {renderGroupItem({ title: tr('acc_search_hist'), subtitle: tr('acc_search_hist_sub'), isLast: true, onClick: () => setSubModal({ title: tr('acc_search_hist'), type: 'search_history' }) })}
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                    {renderGroupItem({ title: tr('acc_orgs'), subtitle: 'Connected GitHub organizations', onClick: () => setSubModal({ title: tr('acc_orgs'), type: 'orgs' }) })}
                    {renderGroupItem({ title: tr('acc_tokens'), subtitle: 'Manage OAuth access tokens', onClick: () => setSubModal({ title: tr('acc_tokens'), type: 'tokens' }) })}
                    {renderGroupItem({ title: tr('acc_external'), subtitle: 'GitHub, Discord, Google linked accounts', onClick: () => setSubModal({ title: tr('acc_external'), type: 'external' }) })}
                    {renderGroupItem({ title: tr('acc_identity'), subtitle: 'Developer identity verification status', isLast: true, onClick: () => setSubModal({ title: tr('acc_identity'), type: 'identity' }) })}
                  </div>
                </div>
              </>
            )}

            {/* 5. PROJECT ACTIVITY & TRACKING */}
            {activeMenu === 'activity' && (
              <>
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>{tr('acc_act_title')}</h1>
                  <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>{tr('acc_act_sub')}</p>

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
                      {tr('acc_act_tab_recent')}
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
                      {tr('acc_act_tab_topics')}
                    </button>
                  </div>
                </div>

                {activitySubTab === 'projects' ? (
                  <>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>{tr('acc_act_live_updates')}</h3>
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
                        <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>{tr('acc_act_following_orgs')}</h3>
                      </div>
                      <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                        {renderGroupItem({ icon: '⚛️', title: 'React Open Source', subtitle: 'Latest core commits and compiler updates', onClick: () => setSubModal({ title: tr('acc_act_live_updates'), type: 'trackers' }) })}
                        {renderGroupItem({ icon: '🌐', title: 'Next.js Framework', subtitle: 'App router & server actions tracking', onClick: () => setSubModal({ title: tr('acc_act_live_updates'), type: 'trackers' }) })}
                        {renderGroupItem({ icon: '⚡', title: 'GSAP Animations', subtitle: 'ScrollTrigger & animation timeline engine', isLast: true, onClick: () => setSubModal({ title: tr('acc_act_live_updates'), type: 'trackers' }) })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#fff' }}>{tr('acc_act_tech_domains')}</h3>
                    <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                      {renderGroupItem({ icon: '🤖', title: 'Artificial Intelligence & Neural Networks', onClick: () => setSubModal({ title: tr('acc_act_tech_domains'), type: 'topics' }) })}
                      {renderGroupItem({ icon: '🎮', title: 'WebGL, WebGPU & 3D Shaders', onClick: () => setSubModal({ title: tr('acc_act_tech_domains'), type: 'topics' }) })}
                      {renderGroupItem({ icon: '☁️', title: 'Cloud Native & Edge Computing', isLast: true, onClick: () => setSubModal({ title: tr('acc_act_tech_domains'), type: 'topics' }) })}
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
                    <span>💳</span> {tr('acc_bill_title')}
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
                      {tr('acc_bill_tab_trans')}
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
                      {tr('acc_bill_tab_manage')}
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
                      <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>{tr('acc_bill_tab_trans')}</h2>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', maxWidth: '420px', lineHeight: 1.5 }}>
                        {tr('acc_bill_empty')}
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

                    {/* Saved Payment Cards if any */}
                    {acStore.cards && acStore.cards.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#a8a29e', fontWeight: 600 }}>Saved Cards</span>
                        {acStore.cards.map((c, i) => (
                          <div key={i} style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '12px', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ color: '#fff', fontSize: '13.5px' }}>{c.brand} •••• {c.last4}</strong>
                              <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>Expires {c.exp}</div>
                            </div>
                            <button 
                              onClick={() => patchAc({ cards: acStore.cards.filter((_, idx) => idx !== i) })}
                              style={{ background: '#261212', color: '#f87171', border: '1px solid #3d1b1b', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ height: '140px', background: 'linear-gradient(135deg, #0284c7, #0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px' }}>
                        💳
                      </div>
                      <div style={{ padding: '20px' }}>
                        <strong style={{ color: '#fff', fontSize: '15px' }}>{tr('acc_bill_add_method')}</strong>
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '6px 0 16px' }}>Save a card or link your wallet to sponsor open-source maintainers easily.</p>
                        <button onClick={() => setSubModal({ title: tr('acc_bill_add_method'), type: 'add_payment' })} style={{ width: '100%', background: '#261414', color: '#fef08a', border: '1px solid #3d1b1b', padding: '10px', borderRadius: '24px', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}>
                          {tr('acc_bill_add_method')}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#fff' }}>{tr('acc_bill_address_hdr')}</h4>
                      <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                        {renderGroupItem({ title: tr('acc_bill_address'), subtitle: acStore.address ? `${acStore.address.city}, ${acStore.address.country}` : 'Da Nang, Vietnam', onClick: () => setSubModal({ title: tr('acc_bill_address'), type: 'address' }) })}
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
                  <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>{tr('acc_sub_title')}</h1>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>{tr('acc_sub_desc')}</p>
                </div>

                <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden', marginTop: '10px' }}>
                  {renderGroupItem({
                    icon: '⭐',
                    title: tr('acc_sub_creators'),
                    subtitle: tr('acc_sub_creators_sub'),
                    isLast: true,
                    onClick: () => setSubModal({ title: tr('acc_sub_creators'), type: 'sponsor_creator' })
                  })}
                </div>

                {acStore.tier && (
                  <div style={{ background: '#180d0d', border: '1px solid #10b981', borderRadius: '14px', padding: '16px 20px', marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Active Tier</span>
                      <h4 style={{ margin: '4px 0 0', color: '#fff', fontSize: '15px' }}>{acStore.tier.name} (${acStore.tier.amount}/mo)</h4>
                    </div>
                    <button onClick={() => setSubModal({ title: tr('acc_sub_creators'), type: 'sponsor_creator' })} style={{ background: '#261414', color: '#fef08a', border: '1px solid #3d1b1b', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer' }}>Change</button>
                  </div>
                )}
              </>
            )}

            {/* 8. MANAGE ACCOUNTS */}
            {activeMenu === 'manage' && (
              <>
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>{tr('acc_manage_title')}</h1>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                    {tr('acc_manage_desc')}
                  </p>
                </div>

                <div 
                  onClick={() => setSubModal({ title: tr('acc_add_acc_btn'), type: 'add_account' })}
                  style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', padding: '14px 20px', color: '#38bdf8', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  {tr('acc_add_acc_btn')}
                </div>

                <div style={{ background: '#180d0d', border: '1px solid #2b1414', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #241212' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>GitXplore Core / GitHub</span>
                    <button 
                      onClick={() => setSubModal({ title: tr('acc_manage_title'), type: 'account_manage' })} 
                      style={{ background: '#261212', color: '#fef08a', border: '1px solid #3d1b1b', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {tr('acc_manage_btn')}
                    </button>
                  </div>

                  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#7f1d1d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                      {user?.avatarChar || 'H'}
                    </div>
                    <strong style={{ color: '#fff', fontSize: '14px' }}>{user?.name}</strong>
                  </div>
                </div>

                {/* Render any linked accounts */}
                <LinkedAccountsList store={acStore} open={setSubModal} />
              </>
            )}

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
                <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>🕒 Activity History</h1>
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
            style={{ maxWidth: '520px', width: '92%', maxHeight: '88vh', overflowY: 'auto', padding: '26px', background: '#120808', border: '1px solid #3d1b1b', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #261212', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#fef08a', fontSize: '18px' }}>{subModal.title}</h3>
              <button onClick={() => setSubModal(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            <FeatureModal
              type={subModal.type}
              title={subModal.title}
              user={user}
              store={acStore}
              patch={patchAc}
              log={logAc}
              close={() => setSubModal(null)}
              arg={subModal.arg}
              onExport={handleExportData}
            />
          </div>
        </div>
      )}

    </div>
  );
}
