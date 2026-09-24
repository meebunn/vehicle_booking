import React, { useState } from 'react';
import Modal from './Modal.jsx';
import Api from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { readFileAsDataURL, fmtDateThai } from '../utils.js';

const MAX_SIZE = 6 * 1024 * 1024;

function ReceiptChips({ items }) {
  if (!items.length) return <span style={{ color: 'var(--gray-400)' }}>ยังไม่มีไฟล์แนบ</span>;
  return items.map((r) => (
    <a key={r.filename} href={r.url} target="_blank" rel="noreferrer" className="receipt-chip">
      📎 {r.filename.endsWith('.pdf') ? 'ไฟล์ PDF' : 'ดูรูป'}
    </a>
  ));
}

export default function TripReportModal({ booking, onClose, onSaved }) {
  const showToast = useToast();
  const trip = booking.trip || {};
  const isEdit = !!trip.completedAt;

  const [odometerStart, setOdometerStart] = useState(trip.odometerStart ?? '');
  const [odometerEnd, setOdometerEnd] = useState(trip.odometerEnd ?? '');
  const [fuelCost, setFuelCost] = useState(trip.fuelCost || '');
  const [tollCost, setTollCost] = useState(trip.tollCost || '');
  const [tollCount, setTollCount] = useState(trip.tollCount || '');
  const [notes, setNotes] = useState(trip.notes || '');
  const [fuelFiles, setFuelFiles] = useState([]);
  const [tollFiles, setTollFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const existingFuelReceipts = (trip.receipts || []).filter((r) => r.type === 'fuel');
  const existingTollReceipts = (trip.receipts || []).filter((r) => r.type === 'toll');

  async function handleSubmit() {
    if (!odometerEnd) { showToast('กรุณากรอกเลขไมล์สิ้นสุด', 'error'); return; }
    for (const f of [...fuelFiles, ...tollFiles]) {
      if (f.size > MAX_SIZE) { showToast(`ไฟล์ "${f.name}" มีขนาดเกิน 6MB กรุณาย่อไฟล์ก่อนแนบ`, 'error'); return; }
    }
    setSubmitting(true);
    try {
      const [fuelReceipts, tollReceipts] = await Promise.all([
        Promise.all(fuelFiles.map(readFileAsDataURL)),
        Promise.all(tollFiles.map(readFileAsDataURL))
      ]);
      await Api.post(`/api/bookings/${booking.id}/trip-report`, {
        odometerStart: Number(odometerStart),
        odometerEnd: Number(odometerEnd),
        fuelCost: Number(fuelCost) || 0,
        fuelReceipts,
        tollCost: Number(tollCost) || 0,
        tollCount: Number(tollCount) || 0,
        tollReceipts,
        notes: notes.trim()
      });
      showToast(isEdit ? 'บันทึกการแก้ไขรายงานเรียบร้อยแล้ว' : 'ส่งใบรายงานการใช้รถเรียบร้อยแล้ว', 'success');
      onSaved();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={isEdit ? 'แก้ไขใบรายงานการใช้รถ' : 'ใบรายงานการใช้รถ (Vehicle Trip Report)'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'กำลังอัปโหลด...' : isEdit ? 'บันทึกการแก้ไข' : 'ส่งรายงาน'}
          </button>
        </>
      }
    >
      <div className="hint-text" style={{ marginTop: 0 }}>
        {booking.destination} — {fmtDateThai(booking.date)} ({booking.vehiclePlate || 'ยังไม่จัดรถ'})
      </div>
      <div className="form-grid">
        <div className="field">
          <label>เลขไมล์เริ่มต้น</label>
          <input type="number" min="0" value={odometerStart} onChange={(e) => setOdometerStart(e.target.value)} />
        </div>
        <div className="field">
          <label>เลขไมล์สิ้นสุด *</label>
          <input type="number" min={odometerStart || 0} value={odometerEnd} onChange={(e) => setOdometerEnd(e.target.value)} />
        </div>

        <div className="field">
          <label>ค่าน้ำมัน (บาท)</label>
          <input type="number" value={fuelCost} onChange={(e) => setFuelCost(e.target.value)} />
        </div>
        <div className="field">
          <label>แนบสลิป/ใบเสร็จค่าน้ำมัน</label>
          <input type="file" accept="image/*,application/pdf" multiple
            onChange={(e) => setFuelFiles(Array.from(e.target.files || []))} />
        </div>
        <div className="field full" style={{ marginTop: -10 }}>
          <span style={{ fontSize: 12 }}>ไฟล์ปัจจุบัน: <ReceiptChips items={existingFuelReceipts} /></span>
        </div>

        <div className="field">
          <label>ค่าทางด่วน (บาท)</label>
          <input type="number" value={tollCost} onChange={(e) => setTollCost(e.target.value)} />
        </div>
        <div className="field">
          <label>จำนวนด่าน</label>
          <input type="number" value={tollCount} onChange={(e) => setTollCount(e.target.value)} />
        </div>
        <div className="field full">
          <label>แนบสลิป/ใบเสร็จค่าทางด่วน</label>
          <input type="file" accept="image/*,application/pdf" multiple
            onChange={(e) => setTollFiles(Array.from(e.target.files || []))} />
        </div>
        <div className="field full" style={{ marginTop: -10 }}>
          <span style={{ fontSize: 12 }}>ไฟล์ปัจจุบัน: <ReceiptChips items={existingTollReceipts} /></span>
        </div>

        <div className="field full">
          <label>หมายเหตุ</label>
          <textarea rows={2} placeholder="เช่น สภาพรถ ปัญหาที่พบระหว่างเดินทาง" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="hint-text" style={{ marginBottom: 0 }}>
        รองรับไฟล์ภาพและ PDF ขนาดไม่เกิน 6MB ต่อไฟล์ — ถ้าไม่แนบไฟล์ใหม่ ระบบจะเก็บไฟล์เดิมไว้
      </div>
    </Modal>
  );
}
