const express = require('express');
const store = require('../db/store');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, async (req, res, next) => {
  try { res.json({ expenses: await store.listExpenses() }); } catch (error) { next(error); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  const b = req.body;
  if (!b.vehicleId || !b.type || !b.date || b.amount === undefined) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน (รถ ประเภทค่าใช้จ่าย วันที่ จำนวนเงิน)' });
  }
  if (!['fuel', 'toll', 'repair'].includes(b.type)) return res.status(400).json({ error: 'ประเภทค่าใช้จ่ายไม่ถูกต้อง' });
  try { res.status(201).json({ expense: await store.createExpense(b) }); } catch (error) { next(error); }
});

module.exports = router;
