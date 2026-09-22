// src/utils.js — ตัวช่วยฟอร์แมต/label ที่ใช้ร่วมกันหลายหน้า (เหมือนต้นฉบับ)
export const VEHICLE_TYPE_LABELS = { van: 'รถตู้', sedan: 'รถเก๋ง', pickup: 'รถกระบะ', vip_van: 'รถตู้ทีบ' };
export const STATUS_LABELS = { pending: 'รอพิจารณา', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ' };
export const VEHICLE_STATUS_LABELS = { available: 'ว่าง', in_use: 'ไม่ว่าง', maintenance: 'ซ่อมบำรุง' };

export function fmtDateThai(dateStr) {
  if (!dateStr) return '-';
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export function fmtDateTimeThai(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return fmtDateThai(d.toISOString().slice(0, 10)) + ' ' + d.toTimeString().slice(0, 5);
}

export function fmtMoney(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`อ่านไฟล์ "${file.name}" ไม่สำเร็จ`));
    reader.readAsDataURL(file);
  });
}
