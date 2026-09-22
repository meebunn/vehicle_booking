// lib/receipts.js — บันทึกไฟล์แนบ (สลิป/ใบเสร็จ) ที่ส่งมาเป็น base64 data URL ลงดิสก์จริง
const fs = require('fs');
const path = require('path');

const ALLOWED_RECEIPT_MIME = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/avif': '.avif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'application/pdf': '.pdf'
};
const MAX_RECEIPT_BYTES = 6 * 1024 * 1024; // 6MB ต่อไฟล์ (ขนาดไฟล์จริงหลังถอดรหัส base64)

// รูปแบบ input: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
function saveReceiptFile(dataUrl, destDir, filenamePrefix) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    throw new Error('รูปแบบไฟล์แนบไม่ถูกต้อง');
  }
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('รูปแบบไฟล์แนบไม่ถูกต้อง');
  const mime = match[1].toLowerCase();
  const ext = ALLOWED_RECEIPT_MIME[mime];
  if (!ext) throw new Error('รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ PDF เท่านั้น');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0) throw new Error('ไฟล์แนบว่างเปล่า');
  if (buffer.length > MAX_RECEIPT_BYTES) throw new Error('ไฟล์แนบมีขนาดใหญ่เกิน 6MB กรุณาย่อไฟล์ก่อนแนบ');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const filename = `${filenamePrefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${ext}`;
  fs.writeFileSync(path.join(destDir, filename), buffer);
  return { filename, mime, size: buffer.length };
}

module.exports = { saveReceiptFile, ALLOWED_RECEIPT_MIME, MAX_RECEIPT_BYTES };
