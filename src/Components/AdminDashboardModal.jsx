import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminDashboardModal({ context, onClose }) {
  const { user } = context;
  const [activeTab, setActiveTab] = useState('users'); // 'users' hoặc 'logs'
  const [userList, setUserList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('member');

  const fetchUsers = async () => {
    const { data } = await supabase.from('user_roles').select('*').order('created_at', { ascending: false });
    if (data) setUserList(data);
  };

  const fetchLogs = async () => {
    const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const { data, error } = await supabase.from('user_roles').insert([
      { email: newEmail.trim().toLowerCase(), role: newRole, status: 'active' }
    ]).select();

    if (!error && data) {
      setUserList([data[0], ...userList]);
      await supabase.from('activity_logs').insert([
        { actor_email: user.identifier, action: 'Thêm tài khoản', target: `${newEmail} (${newRole})` }
      ]);
      setNewEmail('');
      fetchLogs();
    } else {
      alert('Tài khoản đã tồn tại hoặc lỗi: ' + error?.message);
    }
  };

  const handleUpdateRole = async (email, role) => {
    await supabase.from('user_roles').update({ role }).eq('email', email);
    await supabase.from('activity_logs').insert([
      { actor_email: user.identifier, action: 'Đổi cấp bậc', target: `${email} -> ${role}` }
    ]);
    fetchUsers();
    fetchLogs();
  };

  const handleToggleBan = async (email, currentStatus) => {
    const nextStatus = currentStatus === 'banned' ? 'active' : 'banned';
    await supabase.from('user_roles').update({ status: nextStatus }).eq('email', email);
    await supabase.from('activity_logs').insert([
      { actor_email: user.identifier, action: nextStatus === 'banned' ? 'Khóa tài khoản' : 'Mở khóa', target: email }
    ]);
    fetchUsers();
    fetchLogs();
  };

  const handleDeleteUser = async (email) => {
    if (email === user.identifier) {
      alert('Không thể tự xóa tài khoản của chính mình!');
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn xóa quyền tài khoản ${email}?`)) return;

    await supabase.from('user_roles').delete().eq('email', email);
    await supabase.from('activity_logs').insert([
      { actor_email: user.identifier, action: 'Xóa tài khoản', target: email }
    ]);
    fetchUsers();
    fetchLogs();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px', width: '92%', height: '80vh', display: 'flex', flexDirection: 'column', padding: '24px', background: '#0e0707', border: '1px solid #3d1b1b', borderRadius: '16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2b1414', paddingBottom: '12px' }}>
          <div>
            <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Hệ thống quản trị</span>
            <h2 style={{ margin: '4px 0 0', color: '#fef08a', fontSize: '20px' }}>Bảng Phân Quyền & Quản Lý Thành Viên</h2>
          </div>
          <button className="modal-close" onClick={onClose} style={{ position: 'static' }}>✕</button>
        </div>

        {/* TAB CHUYỂN ĐỔI */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              background: activeTab === 'users' ? '#f59e0b' : '#1e0e0e',
              color: activeTab === 'users' ? '#000' : '#d1d5db',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            👥 Quản lý thành viên ({userList.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              background: activeTab === 'logs' ? '#f59e0b' : '#1e0e0e',
              color: activeTab === 'logs' ? '#000' : '#d1d5db',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🕒 Nhật ký hoạt động
          </button>
        </div>

        {/* TAB 1: DANH SÁCH THÀNH VIÊN */}
        {activeTab === 'users' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px', overflow: 'hidden' }}>
            <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                placeholder="Nhập email người dùng muốn cấp quyền..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="lusion-search"
                style={{ flex: 1, borderRadius: '6px', fontSize: '13px' }}
                required
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                style={{ background: '#1c0f0f', color: '#fef08a', border: '1px solid #381a1a', borderRadius: '6px', padding: '0 10px', fontSize: '12.5px' }}
              >
                <option value="member">Thành viên</option>
                <option value="support">CSKH / Hỗ trợ</option>
                <option value="editor">Biên tập viên</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
              <button type="submit" className="link-btn btn-primary" style={{ padding: '0 16px' }}>+ Cấp quyền</button>
            </form>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {userList.map((u) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#180d0d', padding: '10px 14px', borderRadius: '8px', border: '1px solid #291515' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#f3f4f6', fontSize: '13.5px' }}>{u.email}</div>
                    <span style={{ fontSize: '11px', color: u.status === 'banned' ? '#ef4444' : '#10b981' }}>
                      ● {u.status === 'banned' ? 'Bị khóa (Banned)' : 'Đang hoạt động'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.email, e.target.value)}
                      disabled={u.email === user.identifier}
                      style={{ background: '#261212', color: '#fcd34d', border: '1px solid #451a1a', borderRadius: '6px', padding: '4px 8px', fontSize: '12px' }}
                    >
                      <option value="member">Thành viên</option>
                      <option value="support">Hỗ trợ</option>
                      <option value="editor">Biên tập</option>
                      <option value="admin">Admin</option>
                    </select>

                    <button
                      onClick={() => handleToggleBan(u.email, u.status)}
                      disabled={u.email === user.identifier}
                      style={{ background: u.status === 'banned' ? '#065f46' : '#7f1d1d', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      {u.status === 'banned' ? 'Mở khóa' : 'Khóa'}
                    </button>

                    <button
                      onClick={() => handleDeleteUser(u.email)}
                      disabled={u.email === user.identifier}
                      style={{ background: 'transparent', color: '#f87171', border: '1px solid #451a1a', padding: '5px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LỊCH SỬ HOẠT ĐỘNG */}
        {activeTab === 'logs' && (
          <div style={{ flex: 1, overflowY: 'auto', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.map((log) => (
              <div key={log.id} style={{ background: '#160b0b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #2b1313', fontSize: '12.5px' }}>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>{log.actor_email}</span> đã thao tác: <span style={{ color: '#f87171' }}>{log.action}</span>
                {log.target && <span style={{ color: '#9ca3af' }}> → ({log.target})</span>}
                <div style={{ fontSize: '10.5px', color: '#78716c', marginTop: '4px' }}>
                  {new Date(log.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}