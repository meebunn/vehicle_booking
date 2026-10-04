const express = require('express');
const store = require('../db/store');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.json({ departments: await store.listDepartments() });
  } catch (error) {
    next(error);
  }
});

module.exports = router;