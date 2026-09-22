# Smart Car Booking — ระบบจองรถส่วนกลาง (React + Express)

เวอร์ชันนี้เปลี่ยน tech stack จากเวอร์ชันแรก (Node core + vanilla JS) มาเป็น:

- **Frontend:** React 18 + Vite — โฟลเดอร์ `client/`
- **Backend:** Node.js + Express — โฟลเดอร์ `server/`
- **Database:** ยังเป็น mock data ในไฟล์ `server/db/data.json` เหมือนเดิม (ตามแผนเดิม —
  จะย้ายไป MySQL ทีหลัง โดยแก้แค่ `server/db/store.js` ไฟล์เดียว ไม่ต้องแตะ routes หรือ React เลย)

รูปแบบ ฟีเจอร์ และ business logic ทั้งหมด **เหมือนเดิมทุกอย่าง** กับเวอร์ชันก่อนหน้า (3 role:
แอดมิน/พนักงาน/คนขับ, ตรวจจับงานซ้ำซ้อน+รวมรถ, ใบรายงานการใช้รถ+แนบสลิป, สรุปโควต้ารถต่อวัน
ตอนอนุมัติ ฯลฯ) — เปลี่ยนแค่ตัว stack ที่ใช้เขียน

> **หมายเหตุ:** โค้ดชุดนี้เขียนและตรวจสอบไวยากรณ์แบบออฟไลน์ (ไม่มีอินเทอร์เน็ตตอนพัฒนา จึงไม่ได้
> รัน `npm install` จริงเพื่อทดสอบ end-to-end) กรุณา `npm install` แล้วทดสอบตามขั้นตอนด้านล่างก่อนใช้งานจริง
> ถ้าเจอปัญหาอะไรบอกมาได้เลย จะแก้ให้ทันที

## โครงสร้างโปรเจกต์

```
car-booking-system/
├── server/                  # Backend — Node.js + Express
│   ├── server.js             # entry point, ตั้งค่า Express, mount routes, เสิร์ฟ React build
│   ├── middleware/auth.js     # attachUser / requireAuth / requireAdmin
│   ├── lib/
│   │   ├── sessions.js         # session แบบ in-memory (sid -> userId)
│   │   └── receipts.js         # แปลงไฟล์แนบ base64 -> ไฟล์จริงบนดิสก์
│   ├── db/
│   │   ├── data.json           # mock database (แก้ตรงนี้เพื่อเปลี่ยนข้อมูลเริ่มต้น)
│   │   └── store.js            # data access layer — จุดเดียวที่ต้องแก้เมื่อย้ายไป MySQL
│   ├── routes/                 # Express Router แยกตาม resource (auth, vehicles, drivers, bookings, ...)
│   ├── uploads/receipts/        # ไฟล์สลิป/ใบเสร็จที่คนขับแนบมา (ถูกสร้างอัตโนมัติ)
│   └── package.json             # dependency: express, cookie-parser เท่านั้น
│
└── client/                  # Frontend — React + Vite
    ├── index.html
    ├── vite.config.js         # ตั้ง proxy /api และ /uploads ไปที่ backend ตอน dev
    ├── package.json            # dependency: react, react-dom (+ vite ตอน dev)
    └── src/
        ├── main.jsx, App.jsx    # entry point
        ├── api.js                # fetch helper เรียก backend
        ├── utils.js              # ฟอร์แมตวันที่/เงิน, label ต่าง ๆ
        ├── styles.css             # CSS (พอร์ตมาจากเวอร์ชันเดิมเกือบทั้งหมด)
        ├── context/               # AppDataContext (user/vehicles/drivers), ToastContext
        ├── components/            # Modal, NotificationBell, TripReportModal ฯลฯ (ใช้ร่วมกันหลายหน้า)
        └── pages/                 # LoginPage, AppShell, CalendarView, MyBookings, MyTrips,
                                    # ApprovalQueue, VehiclesAdmin, Reports, NewBookingForm
```

## วิธีรัน (Development)

ต้องมี [Node.js](https://nodejs.org) เวอร์ชัน 16 ขึ้นไป และมีอินเทอร์เน็ตตอน `npm install`
ครั้งแรก (ดาวน์โหลด React/Vite/Express)

**เปิด 2 terminal พร้อมกัน:**

Terminal 1 — รัน backend (พอร์ต 3000):
```bash
cd server
npm install
npm run dev
```

Terminal 2 — รัน frontend dev server (พอร์ต 5173, มี hot-reload):
```bash
cd client
npm install
npm run dev
```

แล้วเปิดเบราว์เซอร์ไปที่ **http://localhost:5173** (Vite dev server จะส่ง request
`/api/*` และ `/uploads/*` ไปที่ backend พอร์ต 3000 ให้อัตโนมัติผ่าน proxy ที่ตั้งไว้ใน
`client/vite.config.js`)

### บัญชีทดสอบ

| บทบาท | Username | Password |
|---|---|---|
| ผู้ดูแลระบบ (Admin) — อนุมัติคำขอ | `admin1` | `admin123` |
| พนักงาน (Employee) — จองคิวรถให้คนขับ | `emp1` / `emp2` / `emp3` | `emp123` |
| คนขับ (Driver) — ดูงานที่ได้รับมอบหมาย + ส่งรายงาน | `driver1` - `driver4` | `driver123` |

## วิธี build ใช้งานจริง (Production)

1. Build ฝั่ง React ก่อน:
   ```bash
   cd client
   npm install
   npm run build
   ```
   คำสั่งนี้จะสร้างโฟลเดอร์ `client/dist/` ที่มีไฟล์ static พร้อมใช้งาน

2. รัน backend ตัวเดียว (จะเสิร์ฟทั้ง API และหน้าเว็บ React ที่ build แล้วจากพอร์ตเดียวกัน):
   ```bash
   cd server
   npm install
   npm start
   ```
3. เปิด **http://localhost:3000** ได้เลย (ไม่ต้องรัน Vite dev server แล้วในโหมดนี้)

## การย้ายไปใช้ MySQL ในอนาคต

เหมือนเดิมกับเวอร์ชันก่อนหน้า — ทุก route ใน `server/routes/*.js` เรียกใช้ฟังก์ชันจาก
`server/db/store.js` เท่านั้น เมื่อพร้อมเชื่อม MySQL จริง ให้เขียน `store.js` ใหม่โดยใช้ library
เช่น `mysql2` แล้วคงชื่อฟังก์ชัน/รูปแบบข้อมูลที่ return ให้เหมือนเดิมทุกตัว ไม่ต้องแก้โค้ดใน
`routes/` หรือฝั่ง React เลยแม้แต่บรรทัดเดียว

## หมายเหตุด้านความปลอดภัย (สำหรับใช้งานจริง)

เหมือนเดิมกับเวอร์ชันก่อนหน้า — ยังไม่ได้ทำ: เข้ารหัสรหัสผ่าน (bcrypt), HTTPS, ย้าย session
ไปเก็บที่ Redis/DB แทน in-memory (ตอนนี้ restart server แล้วทุกคน login ใหม่หมด)
