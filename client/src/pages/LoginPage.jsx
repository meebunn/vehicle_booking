import React, { useState } from 'react';
import Api from '../api.js';

export default function LoginPage({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { user } = await Api.post('/api/auth/login', { username: username.trim(), password });
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          {/* <div className="icon-box">🚐</div> */}
          <div>
            <div className="title">ระบบจองรถส่วนกลาง</div>
            {/* <div className="subtitle">ระบบจองรถส่วนกลาง</div> */}
          </div>
        </div>
        <h2>เข้าสู่ระบบ</h2>
        <p className="hint">กรอกชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าใช้งานระบบ</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>ชื่อผู้ใช้งาน</label>
            <input type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="field">
            <label>รหัสผ่าน</label>
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
          <div className="error-msg">{error}</div>
        </form>
        {/* แสดงข้อมูลบัญชีทดสอบ 
        <div className="demo-accounts">
          <div><b>บัญชีทดสอบสำหรับผู้ดูแลระบบ:</b> admin1 / admin123</div>
          <div><b>บัญชีทดสอบสำหรับพนักงาน (ผู้จอง):</b> emp1 / emp123 (หรือ emp2, emp3 / emp123)</div>
          <div><b>บัญชีทดสอบสำหรับคนขับ:</b> driver1 / driver123 (หรือ driver2-4 / driver123)</div>
        </div>
        */}
      </div>
    </div>
  );
}
