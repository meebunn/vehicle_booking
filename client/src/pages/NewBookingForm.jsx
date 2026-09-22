import React, { useEffect, useState } from 'react';
import Api from '../api.js';
import { useAppData } from '../context/AppDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const REASON_OPTIONS = ['ประชุมลูกค้า', 'ส่งเอกสาร/พัสดุ', 'รับ-ส่งพนักงาน', 'ตรวจงานหน้าไซต์/โรงงาน', 'อบรม/สัมมนา', 'อื่นๆ'];

const emptyForm = () => ({
  date: new Date().toISOString().slice(0, 10), requestedVehicleType: '',
  startTime: '', endTime: '', destination: '', reason: '', jobDetail: '', passengers: 1
});

export default function NewBookingForm({ editingBooking, onDone, onCancel }) {
  const { vehicleTypes } = useAppData();
  const showToast = useToast();
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!editingBooking;

  useEffect(() => {
    if (editingBooking) {
      setForm({
        date: editingBooking.date, startTime: editingBooking.startTime, endTime: editingBooking.endTime,
        destination: editingBooking.destination, reason: editingBooking.reason,
        requestedVehicleType: editingBooking.requestedVehicleType || '',
        jobDetail: editingBooking.jobDetail || '', passengers: editingBooking.passengers || 1
      });
    } else {
      setForm(emptyForm());
    }
  }, [editingBooking]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await Api.put(`/api/bookings/${editingBooking.id}`, form);
        showToast('บันทึกการแก้ไขเรียบร้อยแล้ว', 'success');
      } else {
        await Api.post('/api/bookings', form);
        showToast('ส่งคำขอจองรถเรียบร้อยแล้ว รอผู้ดูแลระบบอนุมัติ', 'success');
      }
      onDone();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="view active">
      <div className="page-head">
        <div>
          <h1>{isEdit ? 'แก้ไขคำขอใช้รถ' : 'คำขอใช้รถ'}</h1>
          <div className="sub">กรอกรายละเอียดการเดินทางเพื่อส่งคำขอให้ผู้ดูแลระบบพิจารณา</div>
        </div>
      </div>
      <div className="card card-pad" style={{ maxWidth: 760 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>วันที่เดินทาง *</label>
              <input type="date" required min={isEdit ? undefined : new Date().toISOString().slice(0, 10)}
                value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div className="field">
              <label>จำนวนผู้โดยสาร</label>
              <input type="number" min={1} value={form.passengers} onChange={(e) => set('passengers', e.target.value)} />
            </div>
            <div className="field">
              <label>ประเภทรถที่ต้องการ *</label>
              <select required value={form.requestedVehicleType} onChange={(e) => set('requestedVehicleType', e.target.value)}>
                <option value="">-- เลือกประเภทรถ --</option>
                {vehicleTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>เวลาเริ่มต้น *</label>
              <input type="time" lang="th-TH" step="60" required value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
            </div>
            <div className="field">
              <label>เวลาสิ้นสุด *</label>
              <input type="time" lang="th-TH" step="60" required value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
            </div>
            <div className="field full">
              <label>สถานที่ปลายทาง *</label>
              <input type="text" required placeholder="เช่น สำนักงานลูกค้า A จังหวัดปทุมธานี"
                value={form.destination} onChange={(e) => set('destination', e.target.value)} />
            </div>
            <div className="field full">
              <label>เหตุผลการจอง *</label>
              <select required value={form.reason} onChange={(e) => set('reason', e.target.value)}>
                <option value="">-- เลือกเหตุผล --</option>
                {REASON_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="field full">
              <label>รายละเอียดงาน</label>
              <textarea rows={3} placeholder="อธิบายรายละเอียดงานเพิ่มเติม เช่น ชื่องาน ผู้ติดต่อ เอกสารที่เกี่ยวข้อง"
                value={form.jobDetail} onChange={(e) => set('jobDetail', e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'ส่งคำขอจองรถ'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>ยกเลิก</button>
          </div>
        </form>
      </div>
    </section>
  );
}
