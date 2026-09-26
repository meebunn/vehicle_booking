const express = require('express');
const store = require('../db/store');
const { createSession, destroySession } = require('../lib/sessions');

const router = express.Router();

function publicUser(u) {
  if (!u) return null;
  return { id: u.id, username: u.username, name: u.name, role: u.role, department: u.department, driverId: u.driverId || null };
}

const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 }; // 8 ชั่วโมง
function cookieOptions(req) {
  const secure = req.headers['x-forwarded-proto'] === 'https' || req.secure;
  return { httpOnly: true, sameSite: secure ? 'none' : 'lax', secure, maxAge: 8 * 60 * 60 * 1000 };
}

router.post('/login', async (req, res, next) => {
  try {
  const { username, password } = req.body || {};
  const user = await store.findUserByUsername((username || '').trim());
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
  }
  const sid = createSession(user.id);
    res.cookie('sid', sid, cookieOptions(req));
  res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/logout', (req, res) => {
  if (req.sid) destroySession(req.sid);
  res.clearCookie('sid');
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'ยังไม่ได้เข้าสู่ระบบ' });
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
