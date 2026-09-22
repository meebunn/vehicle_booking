const express = require('express');
const store = require('../db/store');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', requireAdmin, async (req, res, next) => {
  try { res.json({ summary: await store.reportSummaryByVehicle() }); } catch (error) { next(error); }
});

router.get('/trip-log', requireAdmin, async (req, res, next) => {
  try { res.json({ trips: await store.reportTripLog() }); } catch (error) { next(error); }
});

module.exports = router;
