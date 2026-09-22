// server.js — ระบบจองรถส่วนกลาง (Smart Car Booking) — Backend (Node.js + Express)
// วิธีรัน (dev):    npm install && npm run dev     แล้วเปิด http://localhost:3000
// (ฝั่ง React ต้อง `npm run build` ที่โฟลเดอร์ client/ ก่อน หรือรัน `npm run dev` ที่ client/
//  แยกต่างหากระหว่างพัฒนา — ดู README.md สำหรับรายละเอียด)
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const bookingRoutes = require('./routes/bookings');
const notificationRoutes = require('./routes/notifications');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/reports');
const { attachUser } = require('./middleware/auth');
const store = require('./db/store');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '30mb' })); // จำกัดใหญ่หน่อยเพื่อรองรับไฟล์แนบ (สลิป/ใบเสร็จ) แบบ base64
app.use(cookieParser());
app.use(attachUser); // แนบ req.user จาก session cookie ให้ทุก request

// ไฟล์ที่คนขับแนบมา (สลิป/ใบเสร็จ) เข้าดูได้ตรง ๆ ผ่าน URL /uploads/receipts/...
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- API routes ----
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);

// endpoint /api/* ที่ไม่ตรงกับ route ไหนเลย ให้ตอบ JSON 404 (กันไม่ให้หลุดไปเจอ React index.html)
app.use('/api', (req, res) => res.status(404).json({ error: 'ไม่พบ endpoint นี้' }));

// ---- React build (production) ----
// หลังรัน `npm run build` ที่โฟลเดอร์ client/ แล้ว ไฟล์ที่ build เสร็จจะอยู่ที่ client/dist
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) res.status(404).send('ยังไม่ได้ build ฝั่ง React — รัน "npm run build" ที่โฟลเดอร์ client/ ก่อน หรือใช้ "npm run dev" ที่ client/ ระหว่างพัฒนา (ดู README.md)');
  });
});

// ---- error handler กันเซิร์ฟเวอร์ล่มถ้ามี error หลุดมา ----
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

async function start() {
  app.listen(PORT, () => {
  console.log('==============================================');
  console.log('  ระบบจองรถส่วนกลาง (Smart Car Booking) — Express API');
  console.log(`  เปิดใช้งานที่ http://localhost:${PORT}`);
  console.log('  บัญชีทดสอบ:');
  console.log('    ผู้ดูแลระบบ  -> username: admin1   / password: admin123');
  console.log('    พนักงาน      -> username: emp1     / password: emp123');
  console.log('    คนขับ        -> username: driver1  / password: driver123');
  console.log('==============================================');
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
