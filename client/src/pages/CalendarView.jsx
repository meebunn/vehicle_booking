import React, { useEffect, useMemo, useState } from 'react';
import Api from '../api.js';
import { useAppData } from '../context/AppDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import BookingDetailModal from '../components/BookingDetailModal.jsx';
import { VEHICLE_TYPE_LABELS, STATUS_LABELS } from '../utils.js';

const DOW = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const REASON_OPTIONS = ['ประชุมลูกค้า', 'ส่งเอกสาร/พัสดุ', 'รับ-ส่งพนักงาน', 'ตรวจงานหน้าไซต์/โรงงาน', 'อบรม/สัมมนา', 'อื่นๆ'];

function emptyQuickForm(today) {
  return { date: today, startTime: '09:00', endTime: '17:00', destination: '', reason: '', requestedVehicleType: '', passengers: 1 };
}

export default function CalendarView({ onNewBooking, calendarFocus }) {
  const { user, vehicles, vehicleTypes, drivers } = useAppData();
  const showToast = useToast();
  const [cursor, setCursor] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [detailBooking, setDetailBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [quickForm, setQuickForm] = useState(emptyQuickForm(todayStr));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Api.get('/api/bookings?all=1').then(({ bookings }) => {
      setBookings(bookings.filter((b) => b.status !== 'rejected'));
    });
  }, [cursor, refreshKey]);

  useEffect(() => {
    if (!calendarFocus?.bookingId) return;
    const booking = bookings.find((item) => item.id === calendarFocus.bookingId);
    if (!booking) return;
    const bookingDate = new Date(`${booking.date}T00:00:00`);
    setCursor((current) => (
      current.getFullYear() === bookingDate.getFullYear() && current.getMonth() === bookingDate.getMonth()
        ? current
        : new Date(bookingDate.getFullYear(), bookingDate.getMonth(), 1)
    ));
    setDetailBooking(booking);
  }, [calendarFocus, bookings]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const out = [];
    for (let i = 0; i < startOffset; i++) out.push({ day: prevMonthDays - startOffset + i + 1, other: true, dateStr: null });
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ day: d, other: false, dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    }
    while (out.length % 7 !== 0) out.push({ day: out.length, other: true, dateStr: null });
    return out;
  }, [cursor]);

  const todayBookings = bookings.filter((b) => b.date === todayStr).sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
  const availableVehicleCount = vehicles.filter((v) => v.status === 'available').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const busyDriverIds = new Set(todayBookings.filter((b) => b.status === 'approved' && b.driverId).map((b) => b.driverId));
  const availableDriverCount = Math.max(0, drivers.length - busyDriverIds.size);

  function setQF(field, value) { setQuickForm((f) => ({ ...f, [field]: value })); }

  async function submitQuickBook(e) {
    e.preventDefault();
    if (!quickForm.destination.trim() || !quickForm.reason || !quickForm.requestedVehicleType) {
      showToast('กรุณากรอกปลายทาง เลือกเหตุผล และเลือกประเภทรถ', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await Api.post('/api/bookings', quickForm);
      showToast('ส่งคำขอจองรถเรียบร้อยแล้ว รอผู้ดูแลระบบอนุมัติ', 'success');
      setQuickForm(emptyQuickForm(todayStr));
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="view active">
      {/*
      <div className="hero-banner">
        <div>
          <div className="hero-title">พร้อมจองรถคันใหม่?</div>
          <div className="hero-sub">เลือกวัน เวลา และประเภทรถได้ในไม่กี่คลิก</div>
        </div>
        <button className="btn-hero" onClick={onNewBooking}>＋ จองรถใหม่</button>
      </div>
      */}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">วันนี้</div>
          <div className="kpi-value">{todayBookings.length} รายการ</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">รถว่าง</div>
          <div className="kpi-value accent">{availableVehicleCount} คัน</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">รออนุมัติ</div>
          <div className="kpi-value warn">{pendingCount} รายการ</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">คนขับพร้อม</div>
          <div className="kpi-value">{availableDriverCount} คน</div>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="card">
          <div className="type-legend-row">
            {vehicleTypes.map((t) => (
              <div key={t.id} className="legend-item"><span className={`legend-dot dot-${t.id}`} />{t.label}</div>
            ))}
          </div>
          <div className="cal-toolbar">
            <button className="cal-nav-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</button>
            <button className="cal-nav-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button>
            <button className="cal-today-btn" onClick={() => setCursor(new Date())}>วันนี้</button>
            <h2 className="cal-title">{MONTHS_TH[cursor.getMonth()]} {cursor.getFullYear() + 543}</h2>
            <div className="flex-spacer" />
            <select className="cal-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">ทุกประเภทรถ</option>
              {vehicleTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="cal-grid">
            {DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}
            {cells.map((c, i) => {
              if (c.other) return <div key={i} className="cal-cell other-month"><div className="date-num">{c.day}</div></div>;
              let dayBookings = bookings.filter((b) => b.date === c.dateStr);
              if (typeFilter) dayBookings = dayBookings.filter((b) => b.vehicleType === typeFilter);
              const maxShow = 3;
              const isToday = c.dateStr === todayStr;
              return (
                <div key={i} className={`cal-cell ${isToday ? 'is-today' : ''}`}>
                  <div className="date-num">{c.day}</div>
                  {dayBookings.slice(0, maxShow).map((b) => {
                    const type = b.vehicleType || 'van';
                    const label = b.status === 'pending' ? `(รอพิจารณา) ${b.destination}` : b.destination;
                    return (
                      <div key={b.id} className={`cal-event type-${type} status-${b.status}`} onClick={() => setDetailBooking(b)}>
                        <div className="ce-title">{VEHICLE_TYPE_LABELS[type] || 'รถ'}</div>
                        <div className="ce-time">{b.startTime}-{b.endTime}</div>
                        <div className="ce-status">{STATUS_LABELS[b.status] || b.status}</div>
                        <div>{label.length > 22 ? label.slice(0, 22) + '…' : label}</div>
                      </div>
                    );
                  })}
                  {dayBookings.length > maxShow && <div className="cal-event-more">+{dayBookings.length - maxShow} เพิ่มเติม</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="quick-book-panel">
            <div className="qb-title">จองรถด่วน</div>
            <div className="qb-sub">ใช้เวลาเพียงไม่กี่ขั้นตอน</div>
            <form onSubmit={submitQuickBook}>
              <div className="field">
                <label>วันที่</label>
                <input type="date" value={quickForm.date} onChange={(e) => setQF('date', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>เวลาเริ่มต้น</label>
                  <input type="time" lang="th-TH" step="60" value={quickForm.startTime} onChange={(e) => setQF('startTime', e.target.value)} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>เวลาสิ้นสุด</label>
                  <input type="time" lang="th-TH" step="60" value={quickForm.endTime} onChange={(e) => setQF('endTime', e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>จำนวนผู้โดยสาร</label>
                <input type="number" min={1} value={quickForm.passengers} onChange={(e) => setQF('passengers', e.target.value)} />
              </div>
              <div className="field">
                <label>ประเภทรถที่ต้องการ</label>
                <select required value={quickForm.requestedVehicleType} onChange={(e) => setQF('requestedVehicleType', e.target.value)}>
                  <option value="">-- เลือกประเภทรถ --</option>
                  {vehicleTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>จุดหมายปลายทาง</label>
                <input placeholder="เช่น บริษัท xxx จังหวัดนนทบุรี" value={quickForm.destination} onChange={(e) => setQF('destination', e.target.value)} />
              </div>
              <div className="field">
                <label>เหตุผลการจอง</label>
                <select value={quickForm.reason} onChange={(e) => setQF('reason', e.target.value)}>
                  <option value="">-- เลือกเหตุผล --</option>
                  {REASON_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'กำลังส่ง...' : 'ยืนยันการจอง'}
              </button>
            </form>
          </div>

          <div className="today-list-card">
            <div className="tl-title">รายการจองวันนี้</div>
            {todayBookings.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>ยังไม่มีรายการจองวันนี้</div>}
            {todayBookings.map((b) => (
              <div key={b.id} className="today-list-item" onClick={() => setDetailBooking(b)} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="tl-time">{b.startTime}-{b.endTime} {VEHICLE_TYPE_LABELS[b.vehicleType] || ''}</div>
                  <div className="tl-dest">{b.destination}</div>
                </div>
                <span className={`badge badge-${b.status}`}>{STATUS_LABELS[b.status]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {detailBooking && <BookingDetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />}
    </section>
  );
}
