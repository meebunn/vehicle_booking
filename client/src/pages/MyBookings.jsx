import React, { useEffect, useState } from 'react';
import Api from '../api.js';
import { useAppData } from '../context/AppDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import BookingDetailModal from '../components/BookingDetailModal.jsx';
import { fmtDateThai, STATUS_LABELS } from '../utils.js';

const TABS = [
  { status: '', label: 'ทั้งหมด' },
  { status: 'pending', label: 'รอพิจารณา' },
  { status: 'approved', label: 'อนุมัติแล้ว' },
  { status: 'completed', label: 'ส่งรายงานแล้ว' },
  { status: 'rejected', label: 'ไม่อนุมัติ' }
];

export default function MyBookings({ onEdit, refreshKey }) {
  const { user } = useAppData();
  const showToast = useToast();
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [detailBooking, setDetailBooking] = useState(null);

  async function load() {
    const { bookings } = await Api.get('/api/bookings');
    setBookings(bookings.sort((a, b) => (a.date < b.date ? 1 : -1)));
  }
  useEffect(() => { load(); }, [refreshKey]);

  async function cancelBooking(id) {
    if (!confirm('ยืนยันยกเลิกคำขอใช้รถนี้หรือไม่?')) return;
    try {
      await Api.del(`/api/bookings/${id}`);
      showToast('ยกเลิกคำขอเรียบร้อยแล้ว', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const departments = [...new Set(bookings.map((b) => b.department).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'th'));
  const rows = bookings.filter((b) => (
    (!tab || b.status === tab) && (!departmentFilter || b.department === departmentFilter)
  ));

  return (
    <section className="view active">
      <div className="page-head">
        <div>
          <h1>การจองรถทั้งหมด</h1>
        </div>
      </div>
      <div className="tabs">
        {TABS.map((t) => (
          <div key={t.status} className={`tab-btn ${tab === t.status ? 'active' : ''}`} onClick={() => setTab(t.status)}>{t.label}</div>
        ))}
      </div>
      <div className="field" style={{ maxWidth: 320, marginBottom: 16 }}>
        <label htmlFor="department-filter">กรองตามฝ่าย</label>
        <select id="department-filter" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
          <option value="">ทุกฝ่าย</option>
          {departments.map((department) => <option key={department} value={department}>{department}</option>)}
        </select>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>วันที่</th><th>เวลา</th><th>ผู้จอง</th><th>ปลายทาง</th><th>เหตุผล</th><th>รถ/คนขับ</th><th>สถานะ</th><th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const isMine = b.userId === user.id;
                return (
                  <tr key={b.id}>
                    <td>{fmtDateThai(b.date)}</td>
                    <td>{b.startTime}-{b.endTime}</td>
                    <td>{b.userName}{isMine && <span style={{ color: 'var(--gray-400)', fontSize: 11 }}> (คุณ)</span>}</td>
                    <td style={{ whiteSpace: 'normal', maxWidth: 200 }}>{b.destination}</td>
                    <td>{b.reason}</td>
                    <td>
                      {b.vehiclePlate
                        ? <>{b.vehiclePlate}<br /><span style={{ color: 'var(--gray-400)', fontSize: 12 }}>{b.driverName || '-'}</span></>
                        : <span style={{ color: 'var(--gray-400)' }}>ยังไม่จัดรถ</span>}
                    </td>
                    <td>
                      <span className={`badge badge-${b.status}`}>{STATUS_LABELS[b.status]}</span>
                      {b.status === 'rejected' && b.rejectReason && (
                        <div style={{ color: 'var(--gray-600)', fontSize: 11.5, marginTop: 4, maxWidth: 160, whiteSpace: 'normal' }}>{b.rejectReason}</div>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setDetailBooking(b)}>ดู</button>{' '}
                      {b.status === 'pending' && isMine && (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => onEdit(b)}>แก้ไข</button>{' '}
                          <button className="btn btn-danger btn-sm" onClick={() => cancelBooking(b.id)}>ยกเลิก</button>
                        </>
                      )}
                      {['approved', 'completed'].includes(b.status) && (
                        b.trip && b.trip.completedAt
                          ? <span className="badge" style={{ background: '#e8effd', color: '#2451b0' }}>ส่งรายงานแล้ว</span>
                          : <span className="badge badge-pending">รอคนขับส่งรายงาน</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="empty-state"><div className="ic">🗂️</div>ยังไม่มีรายการจอง</div>}
      </div>
      {detailBooking && <BookingDetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />}
    </section>
  );
}
