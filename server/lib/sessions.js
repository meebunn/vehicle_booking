// lib/sessions.js — signed session cookie (ไม่ผูกกับ instance ใด instance หนึ่ง)
const crypto = require('crypto');

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-session-secret';

function createSession(userId) {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
function getSession(sid) {
  if (!sid) return null;
  const parts = sid.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.exp > Date.now() ? { userId: session.userId } : null;
  } catch (error) {
    return null;
  }
}
function destroySession() {}

module.exports = { createSession, getSession, destroySession };
