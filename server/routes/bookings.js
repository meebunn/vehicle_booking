const express = require('express');
const path = require('path');
const store = require('../db/store');
const { saveReceiptFile } = require('../lib/receipts');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const RECEIPTS_DIR = path.join(__dirname, '..', 'uploads', 'receipts');

async function notifyAdmins(message, bookingId) {
  const adminIds = await store.listAdminUserIds();
  await Promise.all(adminIds.map(adminId => store.createNotification({ userId: adminId, type: 'new_request', message, relatedBookingId: bookingId })));
}

// รายการคำขอจองทั้งหมด
// - แอดมิน เห็นทุกคน เสมอ
// - พนักงาน (employee) เห็นคำขอของฝ่ายตัวเอง และเห็นรายการที่อนุมัติแล้วของทุกฝ่าย
// - คนขับ (driver) เห็นเฉพาะงานที่ตัวเองถูกมอบหมาย (ไม่ใช่คนจอง)
router.get('/', requireAuth, async (req, res, next) => {
  try {
  if (req.user.role === 'admin') {
    return res.json({ bookings: await store.listBookings() });
  }
  if (req.user.role === 'driver') {
    const profile = await store.findDriverByUserId(req.user.id);
    if (!profile) return res.json({ bookings: [] });
    return res.json({ bookings: await store.listBookingsByDriver(profile.id) });
  }
  if (req.query.all === '1') {
    return res.json({ bookings: await store.listApprovedBookings() });
  }
  res.json({ bookings: await store.listBookingsForEmployee(req.user.department) });
  } catch (error) { next(error); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  const b = await store.findBookingById(req.params.id);
  if (!b) return res.status(404).json({ error: 'ไม่พบรายการจอง' });
  res.json({ booking: b });
});

// สร้างคำขอจองใหม่ (พนักงาน)
router.post('/', requireAuth, async (req, res, next) => {
  const b = req.body;
  const required = ['date', 'startTime', 'endTime', 'destination', 'reason', 'requestedVehicleType'];
  for (const f of required) {
    if (!b[f]) return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน (วันที่ เวลา ปลายทาง และเหตุผล)' });
  }
  if (b.startTime >= b.endTime) return res.status(400).json({ error: 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น' });
  try {
    const booking = await store.createBooking({ ...b, userId: req.user.id });
    await notifyAdmins(`${req.user.name} ส่งคำขอใช้รถวันที่ ${b.date} (${b.startTime}-${b.endTime})`, booking.id);
    res.status(201).json({ booking });
  } catch (error) { next(error); }
});

// แก้ไขคำขอจอง — ทำได้เฉพาะเจ้าของที่สถานะยังเป็น "pending" เท่านั้น (แอดมินแก้ไขได้ทุกสถานะ)
router.put('/:id', requireAuth, async (req, res, next) => {
  const existing = await store.findBookingById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ไม่พบรายการจอง' });
  const isOwner = existing.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin) {
    if (!isOwner) return res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไขรายการนี้' });
    if (existing.status !== 'pending') {
      return res.status(403).json({ error: 'รายการนี้ได้รับการอนุมัติ/พิจารณาแล้ว ไม่สามารถแก้ไขได้ กรุณาติดต่อผู้ดูแลระบบ' });
    }
  }
  const allowedFields = ['date', 'startTime', 'endTime', 'destination', 'reason', 'jobDetail', 'passengers', 'requestedVehicleType'];
  const patch = {};
  allowedFields.forEach(f => { if (req.body[f] !== undefined) patch[f] = req.body[f]; });
  const updated = await store.updateBooking(req.params.id, patch);
  res.json({ booking: updated });
});

// ลบคำขอจอง — เฉพาะเจ้าของขณะสถานะ pending หรือแอดมิน
router.delete('/:id', requireAuth, async (req, res, next) => {
  const existing = await store.findBookingById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ไม่พบรายการจอง' });
  const isOwner = existing.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin) {
    if (!isOwner) return res.status(403).json({ error: 'ไม่มีสิทธิ์ลบรายการนี้' });
    if (existing.status !== 'pending') {
      return res.status(403).json({ error: 'รายการนี้ได้รับการอนุมัติแล้ว ไม่สามารถลบได้ กรุณาติดต่อผู้ดูแลระบบ' });
    }
  }
  await store.deleteBooking(req.params.id);
  res.json({ ok: true });
});

// ตรวจสอบรายการที่อาจซ้ำซ้อน + สรุปภาพรวมวันนั้น (รถว่างเหลือกี่คัน โควต้าเต็มหรือยัง) — แอดมิน
router.get('/:id/duplicates', requireAdmin, async (req, res, next) => {
  const b = await store.findBookingById(req.params.id);
  if (!b) return res.status(404).json({ error: 'ไม่พบรายการจอง' });
  const duplicates = await store.findPossibleDuplicates(b);
  const dayOverview = await store.getDayOverview(b.date, b.startTime, b.endTime, b.id);
  res.json({ duplicates, dayOverview });
});

// อนุมัติคำขอ + จัดรถ/คนขับ (รองรับการ Pool รวมกับคำขออื่นที่เดินทางเส้นทางเดียวกัน)
router.post('/:id/approve', requireAdmin, async (req, res, next) => {
  const b = await store.findBookingById(req.params.id);
  if (!b) return res.status(404).json({ error: 'ไม่พบรายการจอง' });
  const { vehicleId, driverId, poolWith, odometerStart } = req.body;
  if (!vehicleId) return res.status(400).json({ error: 'กรุณาเลือกรถที่จะใช้' });
  const vehicle = await store.findVehicleById(vehicleId);
  if (!vehicle) return res.status(404).json({ error: 'ไม่พบรถคันนี้' });
  if (vehicle.status !== 'available') return res.status(400).json({ error: 'รถคันนี้ไม่ว่าง หรืออยู่ระหว่างซ่อมบำรุง' });

  const poolIds = Array.isArray(poolWith) ? poolWith : [];
  const conflict = await store.findVehicleConflict(vehicleId, b.date, b.startTime, b.endTime, [b.id, ...poolIds]);
  if (conflict) {
    return res.status(400).json({
      error: `รถคันนี้ถูกจัดให้งานอื่นในช่วงเวลาเดียวกันแล้ว (${conflict.userName} ${conflict.startTime}-${conflict.endTime} — ${conflict.destination}) กรุณาเลือกรถคันอื่น หรือติ๊ก "รวมรถ (Pool)" ถ้าต้องการไปด้วยกัน`
    });
  }
  const updated = await store.updateBooking(b.id, {
    status: 'approved', vehicleId, driverId: driverId || vehicle.driverId || null,
    poolWith: poolIds, approvedBy: req.user.id, approvedAt: new Date().toISOString(),
    trip: { ...b.trip, odometerStart: odometerStart ? Number(odometerStart) : vehicle.mileage }
  });
  // อนุมัติงานที่ถูกเลือกให้ Pool รวมไปพร้อมกัน โดยใช้รถ/คนขับคันเดียวกัน
  for (const pid of poolIds) {
    const pb = await store.findBookingById(pid);
    if (pb && pb.status === 'pending') {
      await store.updateBooking(pid, {
        status: 'approved', vehicleId, driverId: driverId || vehicle.driverId || null,
        poolWith: [b.id, ...poolIds.filter(x => x !== pid)],
        approvedBy: req.user.id, approvedAt: new Date().toISOString()
      });
      await store.createNotification({ userId: pb.userId, type: 'approved', message: `คำขอใช้รถวันที่ ${pb.date} ได้รับการอนุมัติแล้ว (จัดรวมกับงานอื่นที่ไปเส้นทางเดียวกัน)`, relatedBookingId: pid });
    }
  }

  await store.createNotification({ userId: b.userId, type: 'approved', message: `คำขอใช้รถวันที่ ${b.date} ได้รับการอนุมัติแล้ว (${vehicle.plate})`, relatedBookingId: b.id });

  // แจ้งเตือนคนขับที่ได้รับมอบหมาย (ถ้ามีบัญชีล็อกอิน)
  const finalDriverId = driverId || vehicle.driverId || null;
  if (finalDriverId) {
    const driverProfile = await store.findDriverById(finalDriverId);
    const driverUser = driverProfile && driverProfile.userId ? await store.findUserById(driverProfile.userId) : null;
    if (driverUser) {
      const jobCount = 1 + poolIds.length;
      const msg = jobCount > 1
        ? `คุณได้รับมอบหมายงานขับรถวันที่ ${b.date} เวลา ${b.startTime}-${b.endTime} (รวม ${jobCount} งานในเที่ยวเดียวกัน) ไปที่ ${b.destination}`
        : `คุณได้รับมอบหมายงานขับรถวันที่ ${b.date} เวลา ${b.startTime}-${b.endTime} ไปที่ ${b.destination}`;
      await store.createNotification({ userId: driverUser.id, type: 'assigned', message: msg, relatedBookingId: b.id });
    }
  }
  res.json({ booking: updated });
});

// ไม่อนุมัติคำขอ พร้อมเหตุผล
router.post('/:id/reject', requireAdmin, async (req, res, next) => {
  const b = await store.findBookingById(req.params.id);
  if (!b) return res.status(404).json({ error: 'ไม่พบรายการจอง' });
  const reason = (req.body.reason || '').trim();
  if (!reason) return res.status(400).json({ error: 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' });
  const updated = await store.updateBooking(b.id, { status: 'rejected', rejectReason: reason, approvedBy: req.user.id, approvedAt: new Date().toISOString() });
  await store.createNotification({ userId: b.userId, type: 'rejected', message: `คำขอใช้รถวันที่ ${b.date} ไม่ได้รับการอนุมัติ: ${reason}`, relatedBookingId: b.id });
  res.json({ booking: updated });
});

// ============================================================
// ใบรายงานการใช้รถ (Vehicle Trip Report) — คนขับที่ได้รับมอบหมาย
// กรอกส่งเองหลังจบภารกิจ พร้อมแนบสลิป/ใบเสร็จ (ผู้ดูแลระบบกรอกแทนได้เช่นกัน)
// ============================================================
router.post('/:id/trip-report', requireAuth, async (req, res, next) => {
  const b = await store.findBookingById(req.params.id);
  if (!b) return res.status(404).json({ error: 'ไม่พบรายการจอง' });
  const isAdmin = req.user.role === 'admin';
  let isAssignedDriver = false;
  if (req.user.role === 'driver') {
    const profile = await store.findDriverByUserId(req.user.id);
    isAssignedDriver = !!profile && profile.id === b.driverId;
  }
  if (!isAdmin && !isAssignedDriver) return res.status(403).json({ error: 'ไม่มีสิทธิ์ส่งรายงานสำหรับรายการนี้ (เฉพาะคนขับที่ได้รับมอบหมายหรือผู้ดูแลระบบ)' });
  if (!['approved', 'completed'].includes(b.status)) return res.status(400).json({ error: 'ส่งรายงานได้เฉพาะรายการที่ได้รับการอนุมัติแล้วเท่านั้น' });

  const { odometerStart, odometerEnd, notes, fuelCost, fuelReceipts, tollCount, tollCost, tollReceipts } = req.body;
  const odoStart = Number(odometerStart);
  const odoEnd = Number(odometerEnd);
  if (!Number.isFinite(odoStart) || odoStart < 0) {
    return res.status(400).json({ error: 'เลขไมล์เริ่มต้นไม่ถูกต้อง' });
  }
  if (!Number.isFinite(odoEnd) || odoEnd < odoStart) {
    return res.status(400).json({ error: `เลขไมล์ปลายทางไม่ถูกต้อง (ต้องไม่น้อยกว่าเลขไมล์เริ่มต้น ${odoStart} กม.)` });
  }

  // บันทึกไฟล์แนบ (สลิป/ใบเสร็จ) ลงดิสก์จริง
  let savedReceipts = [];
  try {
    const fuelFiles = (Array.isArray(fuelReceipts) ? fuelReceipts : []).map(dataUrl => {
      const saved = saveReceiptFile(dataUrl, RECEIPTS_DIR, `fuel_${b.id}`);
      return { type: 'fuel', filename: saved.filename, url: `/uploads/receipts/${saved.filename}` };
    });
    const tollFiles = (Array.isArray(tollReceipts) ? tollReceipts : []).map(dataUrl => {
      const saved = saveReceiptFile(dataUrl, RECEIPTS_DIR, `toll_${b.id}`);
      return { type: 'toll', filename: saved.filename, url: `/uploads/receipts/${saved.filename}` };
    });
    savedReceipts = [...fuelFiles, ...tollFiles];
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const distanceKm = odoEnd - odoStart;
  const isResubmit = !!b.trip.completedAt;
  const oldReceipts = b.trip.receipts || [];
  const finalFuelReceipts = savedReceipts.some(r => r.type === 'fuel')
    ? savedReceipts.filter(r => r.type === 'fuel') : oldReceipts.filter(r => r.type === 'fuel');
  const finalTollReceipts = savedReceipts.some(r => r.type === 'toll')
    ? savedReceipts.filter(r => r.type === 'toll') : oldReceipts.filter(r => r.type === 'toll');
  const finalReceipts = [...finalFuelReceipts, ...finalTollReceipts];

  const updated = await store.updateBooking(b.id, {
    status: 'completed',
    trip: {
      ...b.trip,
      odometerStart: odoStart, odometerEnd: odoEnd, distanceKm,
      fuelCost: Number(fuelCost) || 0, tollCount: Number(tollCount) || 0, tollCost: Number(tollCost) || 0,
      notes: (notes || '').trim(),
      receipts: finalReceipts,
      reportedBy: req.user.id,
      completedAt: b.trip.completedAt || new Date().toISOString(),
      reportedAt: new Date().toISOString()
    }
  });

  if (b.vehicleId) {
    await store.updateVehicle(b.vehicleId, { mileage: odoEnd });
    await store.removeExpensesByBooking(b.id);
    const fuelReceiptFiles = finalFuelReceipts.map(r => r.url);
    const tollReceiptFiles = finalTollReceipts.map(r => r.url);
    if (Number(fuelCost) > 0) {
      await store.createExpense({ vehicleId: b.vehicleId, type: 'fuel', date: b.date, amount: Number(fuelCost), detail: `ทริป ${b.destination}`, receiptFiles: fuelReceiptFiles, relatedBookingId: b.id });
    }
    if (Number(tollCost) > 0) {
      await store.createExpense({ vehicleId: b.vehicleId, type: 'toll', date: b.date, amount: Number(tollCost), detail: `ทางด่วน ${tollCount || ''} ด่าน - ${b.destination}`, receiptFiles: tollReceiptFiles, relatedBookingId: b.id });
    }
  }

  if (!isAdmin) {
    const adminIds = await store.listAdminUserIds();
    await Promise.all(adminIds.map(adminId => store.createNotification({ userId: adminId, type: 'trip_report', message: `${req.user.name} ส่งใบรายงานการใช้รถวันที่ ${b.date} แล้ว (${distanceKm} กม.)`, relatedBookingId: b.id })));
  }
  res.json({ booking: updated, resubmitted: isResubmit });
});

module.exports = router;
