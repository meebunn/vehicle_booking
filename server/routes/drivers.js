const express = require('express');
const store = require('../db/store');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try { res.json({ drivers: await store.listDrivers() }); } catch (error) { next(error); }
});

router.post('/', requireAdmin, async (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'กรุณาระบุชื่อคนขับ' });
  try {
    res.status(201).json({ driver: await store.createDriver(req.body) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const d = await store.updateDriver(req.params.id, req.body);
    if (!d) return res.status(404).json({ error: 'ไม่พบคนขับ' });
    res.json({ driver: d });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const ok = await store.deleteDriver(req.params.id);
  if (!ok) return res.status(404).json({ error: 'ไม่พบคนขับ' });
  res.json({ ok: true });
});

module.exports = router;
