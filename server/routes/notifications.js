const express = require('express');
const store = require('../db/store');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try { res.json({ notifications: await store.listNotificationsByUser(req.user.id) }); } catch (error) { next(error); }
});

router.post('/:id/read', requireAuth, async (req, res, next) => {
  const n = await store.markNotificationRead(req.params.id, req.user.id);
  if (!n) return res.status(404).json({ error: 'ไม่พบการแจ้งเตือน' });
  res.json({ notification: n });
});

router.post('/read-all', requireAuth, async (req, res, next) => {
  await store.markAllNotificationsRead(req.user.id);
  res.json({ ok: true });
});

module.exports = router;
