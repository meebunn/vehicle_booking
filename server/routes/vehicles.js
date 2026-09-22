const express = require('express');
const store = require('../db/store');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try { res.json({ vehicles: await store.listVehicles(), types: await store.listVehicleTypes() }); } catch (error) { next(error); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  const b = req.body;
  if (!b.plate || !b.type) return res.status(400).json({ error: 'กรุณาระบุทะเบียนรถและประเภทรถ' });
  try { res.status(201).json({ vehicle: await store.createVehicle(b) }); } catch (error) { next(error); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  const v = await store.updateVehicle(req.params.id, req.body);
  if (!v) return res.status(404).json({ error: 'ไม่พบรถคันนี้' });
  res.json({ vehicle: v });
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  const ok = await store.deleteVehicle(req.params.id);
  if (!ok) return res.status(404).json({ error: 'ไม่พบรถคันนี้' });
  res.json({ ok: true });
});

module.exports = router;
