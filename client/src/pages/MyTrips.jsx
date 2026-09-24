import React, { useCallback, useEffect, useState } from 'react';
import Api from '../api.js';
import BookingDetailModal from '../components/BookingDetailModal.jsx';
import TripReportModal from '../components/TripReportModal.jsx';
import { VEHICLE_TYPE_LABELS, fmtDateThai } from '../utils.js';

export default function MyTrips({ onBadgeChange, tripFocus }) {
  const [trips, setTrips] = useState([]);
  const [detailBooking, setDetailBooking] = useState(null);
  const [reportBooking, setReportBooking] = useState(null);

  const load = useCallback(async () => {
    const { bookings } = await Api.get('/api/bookings');
    setTrips(bookings);
    if (onBadgeChange) onBadgeChange(bookings.filter((t) => !(t.trip && t.trip.completedAt)).length);
  }, [onBadgeChange]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!tripFocus?.bookingId) return;
    const booking = trips.find((item) => item.id === tripFocus.bookingId);
    if (booking) setDetailBooking(booking);
  }, [tripFocus, trips]);

  return (
    <section className="view active">
      <div className="page-head">
        <div>
          <h1>งานของฉัน</h1>
          <div className="sub">ตารางงานขับรถที่ได้รับมอบหมาย — ส่งใบรายงานการใช้รถหลังจบภารกิจได้ที่นี่</div>
        </div>
      </div>

      {trips.map((b) => {
        const done = b.trip && b.trip.completedAt;
        return (
          <div className="approval-item" key={b.id}>
            <div className="approval-item-head">
              <div>
                <h3>{b.destination}</h3>
                <div style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>ผู้จอง: {b.userName} ({b.department || '-'})</div>
              </div>
              {done
                ? <span className="badge" style={{ background: '#e8effd', color: '#2451b0' }}>ส่งรายงานแล้ว</span>
                : <span className="badge badge-pending">รอส่งรายงาน</span>}
            </div>
            <div className="approval-meta">
              <div><div className="lbl">วันที่</div>{fmtDateThai(b.date)}</div>
              <div><div className="lbl">เวลา</div>{b.startTime} - {b.endTime}</div>
              <div><div className="lbl">รถ</div>{b.vehiclePlate || '-'} ({VEHICLE_TYPE_LABELS[b.vehicleType] || ''})</div>
              <div>
                <div className="lbl">ผู้โดยสาร</div>{b.passengers || 1} คน{' '}
                {b.poolWith && b.poolWith.length > 0 && (
                  <span className="badge badge-dup">รวมงาน {b.poolWith.length + 1} รายการในเที่ยวนี้</span>
                )}
              </div>
              <div className="full"><div className="lbl">เหตุผล / รายละเอียดงาน</div>{b.reason}{b.jobDetail ? ` — ${b.jobDetail}` : ''}</div>
            </div>
            <div className="assign-row">
              <button className="btn btn-outline btn-sm" onClick={() => setDetailBooking(b)}>ดูรายละเอียด</button>
              <button className={`btn ${done ? 'btn-outline' : 'btn-primary'} btn-sm`} onClick={() => setReportBooking(b)}>
                {done ? 'แก้ไขรายงาน' : '📋 ส่งใบรายงานการใช้รถ'}
              </button>
            </div>
          </div>
        );
      })}
      {trips.length === 0 && <div className="empty-state"><div className="ic">🚙</div>ยังไม่มีงานที่ได้รับมอบหมาย</div>}

      {detailBooking && <BookingDetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />}
      {reportBooking && (
        <TripReportModal
          booking={reportBooking}
          onClose={() => setReportBooking(null)}
          onSaved={() => { setReportBooking(null); load(); }}
        />
      )}
    </section>
  );
}
