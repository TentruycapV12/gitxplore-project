import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { openSourceProjects } from '../data/projectsData';
import FeatureModal, { useAcStore, LinkedAccountsList } from './AccountsCenterFeatures';
import './SavedDashboard.css';

const SECTIONS = [
  'profiles', 'security', 'connected', 'permissions', 'activity',
  'billing', 'subscriptions', 'manage', 'saved', 'history', 'language',
];

export default function SavedDashboard() {
  const { user, updateUser, logout } = useAuth();
  const { t: tr, lang, setLang, languages } = useLanguage();
  const navigate = useNavigate();
  const onBack = () => navigate('/');

  const { section } = useParams();
  const activeMenu = SECTIONS.includes(section) ? section : 'profiles';

  // Accounts Center store & Activity logger
  const [acStore, patchAc] = useAcStore(user?.identifier);
  const [copiedUid, setCopiedUid] = useState(false);

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

  // Personal & Developer details
  const [personalDetails, setPersonalDetails] = useState({
    phone: '',
    altEmail: '',
    birthday: '',
  });
  const [editingDetailType, setEditingDetailType] = useState(null);
  const [tempPhone, setTempPhone] = useState('');
  const [tempAltEmail, setTempAltEmail] = useState('');
  const [tempBirthday, setTempBirthday] = useState('');

  // Sub-tabs
  const [paySubTab, setPaySubTab] = useState('transactions');
  const [activitySubTab, setActivitySubTab] = useState('projects');

  // Sub-modal
  const [subModal, setSubModal] = useState(null);

  // Saved Repos & History
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
        { id: 1, action: 'Visited Community Hub', details: 'Connected with fellow Vibe Coders', time: 'Just now' },
        { id: 2, action: 'Explored Repository', details: 'Inspected Mark LXXXV Kinetic Protocol', time: '1 hour ago' },
        { id: 3, action: 'Developer Session Active', details: `Signed in as ${user.identifier}`, time: 'Today at 08:30 PM' },
      ]);
    }
  }, [user?.identifier]);

  const handleSelectMenu = (menuKey) => {
    navigate(`/accountscenter/${menuKey}`);
  };

  const handleUpdateName = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setIsSaving(true);
    updateUser({ name: nameInput.trim() });
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
    a.download = `gitxplore_developer_${user?.name || 'account'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyUid = async (uid) => {
    if (!uid) return;
    try {
      await navigator.clipboard.writeText(uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 1600);
    } catch {}
  };

  const renderGroupItem = ({ icon, title, subtitle, onClick, hasArrow = true }) => (
    <div className="sd-row-item" onClick={onClick}>
      <div className="sd-row-left">
        {icon && <span className="sd-row-icon">{icon}</span>}
        <div className="sd-row-main">
          <div className="sd-row-title">{title}</div>
          {subtitle && <div className="sd-row-sub">{subtitle}</div>}
        </div>
      </div>
      {hasArrow && <span className="sd-row-chevron">›</span>}
    </div>
  );

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : (user?.identifier ? user.identifier.charAt(0).toUpperCase() : 'D');
  const userHandle = user?.identifier ? user.identifier.split('@')[0] : 'developer';
  const publicId = user?.publicId || '6329207b';

  return (
    <div className="sd">
      {/* ===== TOP BAR ===== */}
      <header className="sd-header">
        <div className="sd-header-left">
          <button type="button" onClick={onBack} className="sd-back-btn">
            {tr('acc_return')}
          </button>
          <div className="sd-brand">
            <span className="sd-brand-logo">⚡</span>
            <span className="sd-brand-text">GITXPLORE</span>
            <span className="sd-brand-badge">{tr('acc_title')}</span>
          </div>
        </div>

        <div className="sd-header-right">
          <div className="sd-user-chip">
            <span className="sd-user-avatar">{userInitial}</span>
            <span className="sd-user-name">{user?.name || userHandle}</span>
          </div>
          <button
            type="button"
            onClick={() => { logout(); onBack(); }}
            className="sd-signout-btn"
          >
            {tr('signout')}
          </button>
        </div>
      </header>

      {/* ===== MASTER 2-COLUMN DASHBOARD SHELL ===== */}
      <main className="sd-shell">
        {/* ======================================================== */}
        {/* SIDEBAR: DEVELOPER NAVIGATION                           */}
        {/* ======================================================== */}
        <aside className="sd-sidebar">
          {/* Mini Developer Profile Card */}
          <div className="sd-profile-card">
            <div className="sd-profile-card-top">
              <div className="sd-profile-avatar-wrap">
                <div className="sd-profile-avatar">{userInitial}</div>
                <span className="sd-profile-beacon" title="Online on GitXplore Network" />
              </div>
              <div className="sd-profile-info">
                <h3 className="sd-profile-title" title={user?.name || userHandle}>{user?.name || userHandle}</h3>
                <span className="sd-profile-handle">@{userHandle}</span>
              </div>
            </div>
            <div className="sd-profile-badges">
              <span
                className="sd-uid-chip"
                onClick={() => handleCopyUid(publicId)}
                title="Click to copy Developer UID"
              >
                #{publicId} {copiedUid ? '✓' : '⧉'}
              </span>
              <span className="sd-role-chip">⚡ Core Builder</span>
            </div>
          </div>

          {/* Group 1: Profile & Security */}
          <div className="sd-nav-group">
            <span className="sd-nav-label">HỒ SƠ & BẢO MẬT</span>
            <nav className="sd-nav-list">
              <button
                type="button"
                className={`sd-nav-item ${activeMenu === 'profiles' ? 'is-active' : ''}`}
                onClick={() => handleSelectMenu('profiles')}
              >
                <span className="sd-nav-icon">👤</span>
                <span>{tr('acc_profiles_title')}</span>
              </button>
              <button
                type="button"
                className={`sd-nav-item ${activeMenu === 'security' ? 'is-active' : ''}`}
                onClick={() => handleSelectMenu('security')}
              >
                <span className="sd-nav-icon">🛡️</span>
                <span>{tr('acc_sec')}</span>
              </button>
              <button
                type="button"
                className={`sd-nav-item ${activeMenu === 'connected' ? 'is-active' : ''}`}
                onClick={() => handleSelectMenu('connected')}
              >
                <span className="sd-nav-icon">🐙</span>
                <span>{tr('acc_conn')}</span>
              </button>
              <button
                type="button"
                className={`sd-nav-item ${activeMenu === 'permissions' ? 'is-active' : ''}`}
                onClick={() => handleSelectMenu('permissions')}
              >
                <span className="sd-nav-icon">📄</span>
                <span>{tr('acc_perm')}</span>
              </button>
            </nav>
          </div>

          {/* Group 2: Workspace & Vault */}
          <div className="sd-nav-group">
            <span className="sd-nav-label">WORKSPACE & KHO DỰ ÁN</span>
            <nav className="sd-nav-list">
              <button
                type="button"
                className={`sd-nav-item ${activeMenu === 'saved' ? 'is-active' : ''}`}
                onClick={() => handleSelectMenu('saved')}
              >
                <span className="sd-nav-icon">⭐</span>
                <span>{tr('saved_repos')}</span>
                <span className="sd-nav-badge">{savedList.length}</span>
              </button>
              <button
                type="button"
                className={`sd-nav-item ${activeMenu === 'activity' ? 'is-active' : ''}`}
                onClick={() => handleSelectMenu('activity')}
              >
                <span className="sd-nav-icon">🚀</span>
                <span>{tr('acc_act')}</span>
              </button>
              <button
                type="button"
                className={`sd-nav-item ${activeMenu === 'history' ? 'is-active' : ''}`}
                onClick={() => handleSelectMenu('history')}
              >
                <span className="sd-nav-icon">🕒</span>
                <span>{tr('history')}</span>
              </button>
            </nav>
          </div>

          {/* Group 3: Preferences & Billing */}
          <div className="sd-nav-group">
            <span className="sd-nav-label">TÙY BIẾN & TÀI KHOẢN</span>
            <nav className="sd-nav-list">
              <button
                type="button"
                className={`sd-nav-item ${activeMenu === 'billing' ? 'is-active' : ''}`}
                onClick={() => handleSelectMenu('billing')}
              >
                <span className="sd-nav-icon">💳</span>
                <span>{tr('acc_bill')}</span>
              </button>
              <button
                type="button"
                className={`sd-nav-item ${activeMenu === 'subscriptions' ? 'is-active' : ''}`}
                onClick={() => handleSelectMenu('subscriptions')}
              >
                <span className="sd-nav-icon">⭐</span>
                <span>{tr('acc_sub_menu')}</span>
              </button>
              <button
                type="button"
                className={`sd-nav-item ${activeMenu === 'manage' ? 'is-active' : ''}`}
                onClick={() => handleSelectMenu('manage')}
              >
                <span className="sd-nav-icon">👥</span>
                <span>{tr('acc_manage')}</span>
              </button>
              <button
                type="button"
                className={`sd-nav-item ${activeMenu === 'language' ? 'is-active' : ''}`}
                onClick={() => handleSelectMenu('language')}
              >
                <span className="sd-nav-icon">🌐</span>
                <span>{tr('ui_acc_language')}</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MAIN CONTENT AREA                                        */}
        {/* ======================================================== */}
        <section className="sd-content">
          {/* 0. LANGUAGE */}
          {activeMenu === 'language' && (
            <div>
              <div className="sd-section-header">
                <h1 className="sd-section-title">🌐 {tr('ui_acc_language')}</h1>
                <p className="sd-section-sub">{tr('ui_acc_language_sub')}</p>
              </div>
              <div className="sd-panel">
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
                      className="sd-row-item"
                      style={{ background: on ? 'rgba(245, 158, 11, 0.1)' : undefined }}
                    >
                      <div className="sd-row-left">
                        <span style={{ fontSize: '24px' }}>{l.flag}</span>
                        <span style={{ fontWeight: 650, color: on ? '#fef08a' : '#f3f4f6' }}>{l.label}</span>
                      </div>
                      {on && (
                        <span style={{ fontSize: '11px', fontWeight: 750, padding: '3px 10px', borderRadius: '999px', background: '#f59e0b', color: '#1a1006' }}>
                          {tr('ui_current')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1. PROFILES & DEVELOPER IDENTITY */}
          {activeMenu === 'profiles' && (
            <>
              <div className="sd-section-header">
                <h1 className="sd-section-title">👤 {tr('acc_profiles_title')}</h1>
                <p className="sd-section-sub">{tr('acc_profiles_sub')}</p>
              </div>

              {/* Developer Hero Profile Card */}
              <div className="sd-dev-hero">
                <div className="sd-dev-hero-banner" />
                <div className="sd-dev-hero-body">
                  <div className="sd-dev-hero-profile">
                    <div className="sd-dev-hero-avatar">
                      {userInitial}
                    </div>
                    <div className="sd-dev-hero-details">
                      <h2 className="sd-dev-hero-name">
                        {user?.name || userHandle}
                        <span
                          className="sd-uid-chip"
                          onClick={() => handleCopyUid(publicId)}
                          title="Click to copy Developer UID"
                        >
                          #{publicId} {copiedUid ? '✓ Copied' : '⧉ Copy'}
                        </span>
                      </h2>
                      <div className="sd-dev-hero-github">
                        <span>🐙</span> GitXplore Core / GitHub Account Connected
                      </div>
                    </div>
                  </div>

                  <div className="sd-dev-hero-actions">
                    <button
                      type="button"
                      className="sd-btn sd-btn--secondary"
                      onClick={() => setIsEditingName(!isEditingName)}
                    >
                      {isEditingName ? 'Hủy' : '✏️ Đổi tên hiển thị'}
                    </button>
                    <button
                      type="button"
                      className="sd-btn sd-btn--primary"
                      onClick={() => setSubModal({ title: tr('acc_add_acc_btn'), type: 'add_account' })}
                    >
                      + Liên kết tài khoản
                    </button>
                  </div>
                </div>

                {isEditingName && (
                  <form onSubmit={handleUpdateName} className="sd-inline-edit">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="sd-input"
                      placeholder="Nhập tên hiển thị mới của bạn..."
                    />
                    <button type="submit" disabled={isSaving} className="sd-btn sd-btn--primary">
                      {isSaving ? 'Đang lưu...' : 'Lưu tên'}
                    </button>
                  </form>
                )}
              </div>

              {/* Personal & Contact Details */}
              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3 className="sd-panel-title">THÔNG TIN LIÊN HỆ & BẢO MẬT</h3>
                </div>
                {renderGroupItem({
                  icon: '📧',
                  title: 'Email liên hệ chính',
                  subtitle: personalDetails.altEmail || user?.identifier,
                  onClick: () => openEditDetails('contact')
                })}
                {renderGroupItem({
                  icon: '📱',
                  title: 'Số điện thoại / Hotline hỗ trợ',
                  subtitle: personalDetails.phone ? personalDetails.phone : 'Chưa cập nhật',
                  onClick: () => openEditDetails('contact')
                })}
                {renderGroupItem({
                  icon: '🎂',
                  title: 'Ngày sinh / Cột mốc gia nhập',
                  subtitle: personalDetails.birthday ? personalDetails.birthday : 'Chưa thiết lập',
                  onClick: () => openEditDetails('birthday')
                })}
              </div>

              {/* Developer Ecosystem (Clean replacement for AI Glasses spoof!) */}
              <div>
                <div className="sd-panel-header" style={{ padding: '0 0 12px', border: 'none' }}>
                  <h3 className="sd-panel-title">HỆ SINH THÁI GITXPLORE BUILDER</h3>
                </div>
                <div className="sd-feature-grid">
                  <div
                    className="sd-feature-card"
                    onClick={() => navigate('/vibe')}
                  >
                    <div className="sd-feature-icon">⚡</div>
                    <h4 className="sd-feature-title">Vibe Coding Hub</h4>
                    <p className="sd-feature-desc">Kho MCP Servers, prompt templates & .cursorrules cho Cursor AI, Windsurf & Claude.</p>
                    <span className="sd-feature-link">Khám phá Vibe Hub →</span>
                  </div>

                  <div
                    className="sd-feature-card"
                    onClick={() => setSubModal({ title: tr('ac_roadmap_title'), type: 'roadmap' })}
                  >
                    <div className="sd-feature-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>🚀</div>
                    <h4 className="sd-feature-title">Lộ trình Developer 2026</h4>
                    <p className="sd-feature-desc">Workspace hợp nhất, đồng bộ repository tự động và cộng tác mã nguồn mở thời gian thực.</p>
                    <span className="sd-feature-link">Xem Roadmap chi tiết →</span>
                  </div>

                  <div
                    className="sd-feature-card"
                    onClick={() => navigate('/community')}
                  >
                    <div className="sd-feature-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10b981' }}>🌐</div>
                    <h4 className="sd-feature-title">Mạng Lưới Kỹ Sư</h4>
                    <p className="sd-feature-desc">Kết nối trực tiếp cùng hàng ngàn Vibe Coders và AI Builders toàn cầu.</p>
                    <span className="sd-feature-link">Mở Mạng Lưới Hub →</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 2. PASSWORD AND SECURITY */}
          {activeMenu === 'security' && (
            <>
              <div className="sd-section-header">
                <h1 className="sd-section-title">🛡️ {tr('acc_sec_title')}</h1>
                <p className="sd-section-sub">Bảo vệ tài khoản và thiết lập các phương thức đăng nhập an toàn.</p>
              </div>

              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3 className="sd-panel-title">{tr('acc_sec_login_rec')}</h3>
                </div>
                {renderGroupItem({ title: tr('acc_change_pw'), subtitle: 'Đổi mật khẩu truy cập tài khoản', onClick: () => setSubModal({ title: tr('acc_change_pw'), type: 'password' }) })}
                {renderGroupItem({ title: tr('acc_2fa'), subtitle: tr('acc_2fa_sub'), onClick: () => setSubModal({ title: tr('acc_2fa'), type: '2fa' }) })}
                {renderGroupItem({ title: tr('acc_saved_login'), subtitle: tr('acc_saved_login_sub'), onClick: () => setSubModal({ title: tr('acc_saved_login'), type: 'saved_login' }) })}
                {renderGroupItem({ title: tr('acc_passkey'), subtitle: tr('acc_passkey_sub'), onClick: () => setSubModal({ title: tr('acc_passkey'), type: 'passkey' }) })}
              </div>

              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3 className="sd-panel-title">{tr('acc_sec_checks')}</h3>
                </div>
                {renderGroupItem({ title: tr('acc_sessions'), subtitle: tr('acc_sessions_sub'), onClick: () => setSubModal({ title: tr('acc_sessions'), type: 'sessions' }) })}
                {renderGroupItem({ title: tr('acc_emails'), subtitle: tr('acc_emails_sub'), onClick: () => setSubModal({ title: tr('acc_emails'), type: 'emails' }) })}
                {renderGroupItem({ title: tr('acc_checkup'), subtitle: tr('acc_checkup_sub'), onClick: () => setSubModal({ title: tr('acc_checkup'), type: 'checkup' }) })}
              </div>
            </>
          )}

          {/* 3. CONNECTED SERVICES & GITHUB */}
          {activeMenu === 'connected' && (
            <>
              <div className="sd-section-header">
                <h1 className="sd-section-title">🐙 {tr('acc_conn_title')}</h1>
                <p className="sd-section-sub">{tr('acc_conn_sub')}</p>
              </div>

              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3 className="sd-panel-title">{tr('acc_sync_header')}</h3>
                </div>
                {renderGroupItem({ icon: '🔄', title: tr('acc_sharing'), subtitle: tr('acc_sharing_sub'), onClick: () => setSubModal({ title: tr('acc_sharing'), type: 'sharing' }) })}
                {renderGroupItem({ icon: '🐙', title: tr('acc_ghsync'), subtitle: tr('acc_ghsync_sub'), onClick: () => setSubModal({ title: tr('acc_ghsync'), type: 'ghsync' }) })}
                {renderGroupItem({ icon: '📁', title: tr('acc_showcases'), subtitle: tr('acc_showcases_sub'), onClick: () => setSubModal({ title: tr('acc_showcases'), type: 'showcases' }) })}
                {renderGroupItem({ icon: '💻', title: tr('acc_workstations'), subtitle: tr('acc_workstations_sub'), onClick: () => setSubModal({ title: tr('acc_workstations'), type: 'workstations' }) })}
              </div>

              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3 className="sd-panel-title">{tr('acc_profile_access_hdr')}</h3>
                </div>
                {renderGroupItem({ icon: '🖼️', title: tr('acc_sync_avatar'), subtitle: acStore.syncAvatar !== false ? 'Đang bật' : 'Đã tắt', onClick: () => setSubModal({ title: tr('acc_sync_avatar'), type: 'sync_avatar' }) })}
                {renderGroupItem({ icon: '🔗', title: tr('acc_repolinks'), subtitle: 'Cài đặt liên kết kho lưu trữ công khai', onClick: () => setSubModal({ title: tr('acc_repolinks'), type: 'repolinks' }) })}
                {renderGroupItem({ icon: '👥', title: tr('acc_following'), subtitle: 'Danh sách kỹ sư & nhà đóng góp đang theo dõi', onClick: () => setSubModal({ title: tr('acc_following'), type: 'following' }) })}
              </div>
            </>
          )}

          {/* 4. PERMISSIONS & DATA EXPORT */}
          {activeMenu === 'permissions' && (
            <>
              <div className="sd-section-header">
                <h1 className="sd-section-title">📄 {tr('acc_perm_title')}</h1>
                <p className="sd-section-sub">{tr('acc_perm_banner')}</p>
              </div>

              <div className="sd-panel">
                {renderGroupItem({ icon: '💾', title: tr('acc_export_info'), subtitle: tr('acc_export_info_sub'), onClick: handleExportData })}
                {renderGroupItem({ icon: '🔍', title: tr('acc_access_info'), subtitle: tr('acc_access_info_sub'), onClick: () => setSubModal({ title: tr('acc_access_info'), type: 'access_info' }) })}
                {renderGroupItem({ icon: '🕒', title: tr('acc_search_hist'), subtitle: tr('acc_search_hist_sub'), onClick: () => setSubModal({ title: tr('acc_search_hist'), type: 'search_history' }) })}
                {renderGroupItem({ icon: '🏢', title: tr('acc_orgs'), subtitle: 'Tổ chức GitHub được liên kết', onClick: () => setSubModal({ title: tr('acc_orgs'), type: 'orgs' }) })}
                {renderGroupItem({ icon: '🔑', title: tr('acc_tokens'), subtitle: 'Quản lý mã truy cập OAuth cá nhân', onClick: () => setSubModal({ title: tr('acc_tokens'), type: 'tokens' }) })}
                {renderGroupItem({ icon: '🛡️', title: tr('acc_identity'), subtitle: 'Trạng thái xác thực danh tính Developer', onClick: () => setSubModal({ title: tr('acc_identity'), type: 'identity' }) })}
              </div>
            </>
          )}

          {/* 5. PROJECT ACTIVITY */}
          {activeMenu === 'activity' && (
            <>
              <div className="sd-section-header">
                <h1 className="sd-section-title">🚀 {tr('acc_act_title')}</h1>
                <p className="sd-section-sub">{tr('acc_act_sub')}</p>
              </div>

              <div className="sd-feature-grid">
                <div className="sd-feature-card">
                  <div className="sd-feature-icon">⚡</div>
                  <h4 className="sd-feature-title">Supabase Realtime v2.4</h4>
                  <p className="sd-feature-desc">supabase / realtime-js • 1.2k commits • Hoạt động ổn định</p>
                  <a href="https://github.com/supabase/realtime" target="_blank" rel="noreferrer" className="sd-feature-link">Chi tiết dự án ↗</a>
                </div>

                <div className="sd-feature-card">
                  <div className="sd-feature-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>🎨</div>
                  <h4 className="sd-feature-title">Three.js WebGL Engine</h4>
                  <p className="sd-feature-desc">mrdoob / three.js • 98k stars • Bản cập nhật mới</p>
                  <a href="https://github.com/mrdoob/three.js" target="_blank" rel="noreferrer" className="sd-feature-link">Chi tiết dự án ↗</a>
                </div>
              </div>

              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3 className="sd-panel-title">{tr('acc_act_following_orgs')}</h3>
                </div>
                {renderGroupItem({ icon: '⚛️', title: 'React Open Source', subtitle: 'Commit cốt lõi và cập nhật trình biên dịch React 19', onClick: () => setSubModal({ title: tr('acc_act_live_updates'), type: 'trackers' }) })}
                {renderGroupItem({ icon: '🌐', title: 'Next.js Framework', subtitle: 'Theo dõi App router & Server Actions', onClick: () => setSubModal({ title: tr('acc_act_live_updates'), type: 'trackers' }) })}
                {renderGroupItem({ icon: '⚡', title: 'GSAP Animations', subtitle: 'Engine ScrollTrigger & Animation timeline', onClick: () => setSubModal({ title: tr('acc_act_live_updates'), type: 'trackers' }) })}
              </div>
            </>
          )}

          {/* 6. BILLING & PAYMENTS */}
          {activeMenu === 'billing' && (
            <>
              <div className="sd-section-header">
                <h1 className="sd-section-title">💳 {tr('acc_bill_title')}</h1>
                <p className="sd-section-sub">Quản lý phương thức thanh toán, tài trợ và giao dịch của bạn.</p>
              </div>

              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3 className="sd-panel-title">PHƯƠNG THỨC THANH TOÁN ĐÃ LƯU</h3>
                  <button
                    type="button"
                    className="sd-btn sd-btn--primary"
                    onClick={() => setSubModal({ title: tr('acc_bill_add_method'), type: 'add_payment' })}
                  >
                    + Thêm thẻ mới
                  </button>
                </div>
                {acStore.cards && acStore.cards.length > 0 ? (
                  acStore.cards.map((c, i) => (
                    <div key={i} className="sd-row-item">
                      <div className="sd-row-left">
                        <span className="sd-row-icon">💳</span>
                        <div className="sd-row-main">
                          <div className="sd-row-title">{c.brand} •••• {c.last4}</div>
                          <div className="sd-row-sub">Hết hạn: {c.exp}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="sd-btn sd-btn--danger"
                        onClick={() => patchAc({ cards: acStore.cards.filter((_, idx) => idx !== i) })}
                      >
                        Gỡ thẻ
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                    Chưa có thẻ nào được lưu. Bạn có thể thêm thẻ an toàn để tài trợ các dự án mã nguồn mở.
                  </div>
                )}
              </div>
            </>
          )}

          {/* 7. SPONSORSHIPS & SUBSCRIPTIONS */}
          {activeMenu === 'subscriptions' && (
            <>
              <div className="sd-section-header">
                <h1 className="sd-section-title">⭐ {tr('acc_sub_title')}</h1>
                <p className="sd-section-sub">{tr('acc_sub_desc')}</p>
              </div>

              <div className="sd-panel">
                {renderGroupItem({
                  icon: '⭐',
                  title: tr('acc_sub_creators'),
                  subtitle: tr('acc_sub_creators_sub'),
                  onClick: () => setSubModal({ title: tr('acc_sub_creators'), type: 'sponsor_creator' })
                })}
              </div>
            </>
          )}

          {/* 8. MANAGE ACCOUNTS */}
          {activeMenu === 'manage' && (
            <>
              <div className="sd-section-header">
                <h1 className="sd-section-title">👥 {tr('acc_manage_title')}</h1>
                <p className="sd-section-sub">{tr('acc_manage_desc')}</p>
              </div>

              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3 className="sd-panel-title">TÀI KHOẢN CHÍNH</h3>
                  <button
                    type="button"
                    className="sd-btn sd-btn--secondary"
                    onClick={() => setSubModal({ title: tr('acc_manage_title'), type: 'account_manage' })}
                  >
                    Quản lý
                  </button>
                </div>
                <div className="sd-row-item">
                  <div className="sd-row-left">
                    <span className="sd-row-icon">🐙</span>
                    <div className="sd-row-main">
                      <div className="sd-row-title">{user?.name} (GitXplore / GitHub)</div>
                      <div className="sd-row-sub">{user?.identifier}</div>
                    </div>
                  </div>
                  <span className="sd-role-chip">Primary</span>
                </div>
              </div>

              <LinkedAccountsList store={acStore} open={setSubModal} />
            </>
          )}

          {/* 9. SAVED REPOSITORIES */}
          {activeMenu === 'saved' && (
            <div>
              <div className="sd-section-header">
                <h1 className="sd-section-title">⭐ Kho Lưu Trữ Đã Lưu ({savedList.length})</h1>
                <p className="sd-section-sub">Các dự án mã nguồn mở bạn đã đánh dấu để tham khảo và làm việc.</p>
              </div>

              <div className="sd-feature-grid">
                {savedList.map((project) => (
                  <div key={project.id} className="sd-feature-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="sd-role-chip">{project.language || 'Open Source'}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSaved(project.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '15px' }}
                        title="Xóa khỏi danh sách lưu"
                      >
                        🗑️
                      </button>
                    </div>
                    <h4 className="sd-feature-title">{project.name}</h4>
                    <p className="sd-feature-desc">{project.description}</p>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="sd-feature-link"
                    >
                      Mở trên GitHub ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. HISTORY */}
          {activeMenu === 'history' && (
            <div>
              <div className="sd-section-header">
                <h1 className="sd-section-title">🕒 Nhật Ký Hoạt Động & Tìm Kiếm</h1>
                <p className="sd-section-sub">Lịch sử tương tác, truy cập kho lưu trữ và bảo mật trên GitXplore.</p>
              </div>

              <div className="sd-panel">
                {historyList.map((item, index) => (
                  <div key={index} className="sd-row-item">
                    <div className="sd-row-left">
                      <span className="sd-row-icon">🕒</span>
                      <div className="sd-row-main">
                        <div className="sd-row-title">{item.action}</div>
                        <div className="sd-row-sub">{item.details}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: SỬA PERSONAL DETAILS                           */}
      {/* ======================================================== */}
      {editingDetailType && (
        <div className="modal-overlay" onClick={() => setEditingDetailType(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '24px', background: '#140a0a', border: '1px solid #381a1a', borderRadius: '14px' }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fef08a', fontSize: '18px' }}>
              {editingDetailType === 'contact' ? 'Cập nhật thông tin liên hệ' : 'Cập nhật ngày kỷ niệm'}
            </h3>

            <form onSubmit={handleSavePersonalDetails} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {editingDetailType === 'contact' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a8a29e', marginBottom: '6px' }}>Số điện thoại</label>
                    <input
                      type="text"
                      placeholder="+84 ..."
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                      className="sd-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a8a29e', marginBottom: '6px' }}>Email liên hệ phụ</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={tempAltEmail}
                      onChange={(e) => setTempAltEmail(e.target.value)}
                      className="sd-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a8a29e', marginBottom: '6px' }}>Ngày kỷ niệm / Ngày sinh</label>
                  <input
                    type="date"
                    value={tempBirthday}
                    onChange={(e) => setTempBirthday(e.target.value)}
                    className="sd-input"
                    style={{ width: '100%', colorScheme: 'dark' }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingDetailType(null)}
                  className="sd-btn sd-btn--secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="sd-btn sd-btn--primary"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: TÍNH NĂNG CON                                  */}
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
