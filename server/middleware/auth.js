// middleware/auth.js
const { getSession } = require('../lib/sessions');
const store = require('../db/store');

// แนบ req.user ให้ทุก request ถ้ามี session ที่ถูกต้อง (ไม่ block request — แต่ละ route
// เป็นคนตัดสินใจเองว่าจำเป็นต้อง login/ต้องเป็น role ไหนถึงจะเข้าถึงได้)
async function attachUser(req, res, next) {
  const sid = req.cookies && req.cookies.sid;
  const session = sid ? getSession(sid) : null;
  try {
    req.user = session ? await store.findUserById(session.userId) : null;
    req.sid = sid;
    next();
  } catch (error) { next(error); }
}

// ใช้คู่กับ route ที่ต้อง login เท่านั้น
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'ยังไม่ได้เข้าสู่ระบบ' });
  next();
}

// ใช้คู่กับ route ที่ต้องเป็นแอดมินเท่านั้น
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'ยังไม่ได้เข้าสู่ระบบ' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' });
  next();
}

module.exports = { attachUser, requireAuth, requireAdmin };
