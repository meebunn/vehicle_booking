// lib/sessions.js — เก็บ session แบบ in-memory (sid -> userId)
// หมายเหตุ: ถ้า restart server ทุกคนต้อง login ใหม่ (เหมาะกับ dev/demo — ของจริงควรย้ายไป Redis/DB)
const crypto = require('crypto');

const sessions = new Map();

function createSession(userId) {
  const sid = crypto.randomBytes(24).toString('hex');
  sessions.set(sid, { userId, createdAt: Date.now() });
  return sid;
}
function getSession(sid) {
  return sessions.get(sid) || null;
}
function destroySession(sid) {
  sessions.delete(sid);
}

module.exports = { createSession, getSession, destroySession };
