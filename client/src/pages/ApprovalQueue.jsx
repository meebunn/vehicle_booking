import React, { useCallback, useEffect, useRef, useState } from 'react';
import Api from '../api.js';
import { useAppData } from '../context/AppDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { VEHICLE_TYPE_LABELS, fmtDateThai, fmtDateTimeThai } from '../utils.js';

function ApprovalCard({ booking, extra, drivers, vehicleTypes, onChanged }) {
  const showToast = useToast();
  const { duplicates, dayOverview } = extra;
  const selectableVehicles = dayOverview.vehicles.filter((v) => !v.maintenance && !v.busy);
  const busyVehicles = dayOverview.vehicles.filter((v) => !v.maintenance && v.busy);
  const vehicleTypeLabel = (type) => vehicleTypes.find((item) => item.id === type)?.label || VEHICLE_TYPE_LABELS[type] || type || '-';

  const [vehicleId, setVehicleId] = useState(selectableVehicles[0] ? selectableVehicles[0].id : '');
  const [driverId, setDriverId] = useState(drivers[0] ? drivers[0].id : '');
  const [poolChecked, setPoolChecked] = useState(new Set());

  function togglePool(id) {
    setPoolChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function approve() {
    if (!vehicleId) { showToast('ไม่มีรถว่างให้จัดสรรในขณะนี้', 'error'); return; }
    try {
      await Api.post(`/api/bookings/${booking.id}/approve`, { vehicleId, driverId, poolWith: Array.from(poolChecked) });
      showToast(poolChecked.size ? `อนุมัติสำเร็จ และรวมรถกับอีก ${poolChecked.size} งาน` : 'อนุมัติคำขอเรียบร้อยแล้ว', 'success');
      onChanged();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function reject() {
    const reason = prompt('กรุณาระบุเหตุผลที่ไม่อนุมัติคำขอนี้:');
    if (!reason || !reason.trim()) return;
    try {
      await Api.post(`/api/bookings/${booking.id}/reject`, { reason: reason.trim() });
      showToast('บันทึกผลไม่อนุมัติเรียบร้อยแล้ว', 'success');
      onChanged();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="approval-item">
      <div className="approval-item-head">
        <div>
          <h3>{booking.userName} <span style={{ fontWeight: 400, color: 'var(--gray-600)', fontSize: 12.5 }}>({booking.department || '-'})</span></h3>
          <div style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>ส่งคำขอเมื่อ {fmtDateTimeThai(booking.createdAt)}</div>
        </div>
        <span className="badge badge-pending">รอพิจารณา</span>
      </div>
      <div className="approval-meta">
        <div><div className="lbl">วันที่เดินทาง</div>{fmtDateThai(booking.date)}</div>
        <div><div className="lbl">เวลา</div>{booking.startTime} - {booking.endTime}</div>
        <div><div className="lbl">ผู้โดยสาร</div>{booking.passengers || 1} คน</div>
        <div><div className="lbl">ประเภทรถที่ขอ</div>{VEHICLE_TYPE_LABELS[booking.requestedVehicleType] || booking.requestedVehicleType || '-'}</div>
        <div className="full"><div className="lbl">ปลายทาง</div>{booking.destination}</div>
        <div className="full"><div className="lbl">เหตุผล</div>{booking.reason}{booking.jobDetail ? ` — ${booking.jobDetail}` : ''}</div>
      </div>

      <div className={`day-overview ${dayOverview.quotaFull ? 'full' : ''}`}>
        วันที่ {fmtDateThai(dayOverview.date)}: มีงานที่อนุมัติแล้ว <b>{dayOverview.approvedCount}</b> งาน
        {dayOverview.pendingCount > 0 && ` (รอพิจารณาอีก ${dayOverview.pendingCount} งาน) `}
        — ช่วงเวลา {dayOverview.requestedStart}-{dayOverview.requestedEnd} รถว่าง <b>{dayOverview.availableCount}/{dayOverview.totalVehicles}</b> คัน
        {dayOverview.quotaFull && <span className="badge badge-rejected" style={{ marginLeft: 6 }}>รถเต็มโควต้าช่วงเวลานี้</span>}
      </div>

      {duplicates.length > 0 && (
        <div className="dup-warning">
          พบคำขออื่นที่อาจไปเส้นทางเดียวกัน/วันเดียวกัน {duplicates.length} รายการ:
          {duplicates.map((d) => (
            <label key={d.id}>
              <input type="checkbox" checked={poolChecked.has(d.id)} onChange={() => togglePool(d.id)} />
              {d.userName} — {d.destination} ({d.startTime}-{d.endTime})
            </label>
          ))}
        </div>
      )}

      <div className="assign-row">
        <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          {selectableVehicles.length === 0 && <option value="">-- ไม่มีรถว่างช่วงเวลานี้ --</option>}
          {selectableVehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {vehicleTypeLabel(v.type)}</option>)}
        </select>
        <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="approval-actions">
          <button className="btn btn-success btn-sm" onClick={approve} disabled={selectableVehicles.length === 0}>อนุมัติ</button>
          <button className="btn btn-danger btn-sm" onClick={reject}>ไม่อนุมัติ</button>
        </div>
      </div>
      {busyVehicles.length > 0 && (
        <div className="hint-text" style={{ margin: '4px 0 0' }}>
          ไม่ว่างช่วงนี้: {busyVehicles.map((v) => `${v.plate} (ติดงาน ${v.conflict.userName} ${v.conflict.startTime}-${v.conflict.endTime})`).join(', ')}
        </div>
      )}
    </div>
  );
}

export default function ApprovalQueue({ onBadgeChange, focusBookingId }) {
  const { drivers, vehicleTypes } = useAppData();
  const [pending, setPending] = useState([]);
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const cardRefs = useRef({});

  const load = useCallback(async () => {
    setLoading(true);
    const { bookings } = await Api.get('/api/bookings');
    const pendingOnly = bookings.filter((b) => b.status === 'pending').sort((a, b) => {
      if (a.id === focusBookingId) return -1;
      if (b.id === focusBookingId) return 1;
      return a.date < b.date ? -1 : 1;
    });
    setPending(pendingOnly);
    if (onBadgeChange) onBadgeChange(pendingOnly.length);
    const entries = await Promise.all(pendingOnly.map(async (b) => {
      const { duplicates, dayOverview } = await Api.get(`/api/bookings/${b.id}/duplicates`);
      return [b.id, { duplicates, dayOverview }];
    }));
    setDetails(Object.fromEntries(entries));
    setLoading(false);
  }, [onBadgeChange]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!loading && focusBookingId && cardRefs.current[focusBookingId]) {
      cardRefs.current[focusBookingId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading, focusBookingId, pending]);

  return (
    <section className="view active">
      <div className="page-head">
        <div>
          <h1>อนุมัติคำขอใช้รถ</h1>
          <div className="sub">ตรวจสอบคำขอที่รอพิจารณา พร้อมระบบแจ้งเตือนงานที่อาจซ้ำซ้อน/เส้นทางใกล้เคียงกัน</div>
        </div>
      </div>
      {!loading && pending.map((b) => (
        details[b.id] ? <div key={b.id} ref={(element) => { cardRefs.current[b.id] = element; }} className={b.id === focusBookingId ? 'approval-focus' : ''}><ApprovalCard booking={b} extra={details[b.id]} drivers={drivers} vehicleTypes={vehicleTypes} onChanged={load} /></div> : null
      ))}
      {!loading && pending.length === 0 && <div className="empty-state"><div className="ic">ไม่มีรายการ</div>ไม่มีคำขอที่รอพิจารณาในขณะนี้</div>}
    </section>
  );
}
