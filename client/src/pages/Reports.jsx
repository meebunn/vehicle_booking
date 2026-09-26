import React, { useEffect, useState } from 'react';
import Api from '../api.js';
import Modal from '../components/Modal.jsx';
import TripReportSummary from '../components/TripReportSummary.jsx';
import { VEHICLE_TYPE_LABELS, fmtDateThai, fmtMoney } from '../utils.js';

export default function Reports({ reportFocus }) {
  const [summary, setSummary] = useState([]);
  const [trips, setTrips] = useState([]);
  const [receiptsTrip, setReceiptsTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([Api.get('/api/reports/summary'), Api.get('/api/reports/trip-log')])
      .then(([summaryResponse, tripsResponse]) => {
        if (!active) return;
        setSummary(summaryResponse.summary || []);
        setTrips(tripsResponse.trips || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!reportFocus?.bookingId) return;
    const trip = trips.find((item) => item.id === reportFocus.bookingId);
    if (trip) setReceiptsTrip(trip);
  }, [reportFocus, trips]);

  const totalFuel = summary.reduce((s, r) => s + r.fuelExpense, 0);
  const totalToll = summary.reduce((s, r) => s + r.tollExpense, 0);
  const totalRepair = summary.reduce((s, r) => s + r.repairExpense, 0);
  const totalTrips = summary.reduce((s, r) => s + r.tripCount, 0);

  return (
    <section className="view active">
      <div className="page-head">
        <div>
          <h1>รายงานสรุปค่าใช้จ่ายและประวัติการใช้รถ</h1>
          <div className="sub">สรุปค่าน้ำมัน ค่าทางด่วน ค่าซ่อมบำรุง และระยะทางการเดินทาง</div>
        </div>
      </div>

      {error && <div className="error-msg">โหลดรายงานไม่สำเร็จ: {error}</div>}

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">ค่าน้ำมันรวม</div><div className="stat-value">฿{fmtMoney(totalFuel)}</div></div>
        <div className="stat-card"><div className="stat-label">ค่าทางด่วนรวม</div><div className="stat-value">฿{fmtMoney(totalToll)}</div></div>
        <div className="stat-card"><div className="stat-label">ค่าซ่อมบำรุงรวม</div><div className="stat-value warn">฿{fmtMoney(totalRepair)}</div></div>
        <div className="stat-card"><div className="stat-label">จำนวนทริปที่อนุมัติ</div><div className="stat-value">{totalTrips}</div></div>
      </div>

      <div className="section-title">สรุปค่าใช้จ่ายรายคัน</div>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr><th>ทะเบียน</th><th>ประเภท</th><th>ค่าน้ำมัน</th><th>ค่าทางด่วน</th><th>ค่าซ่อมบำรุง</th><th>รวมค่าใช้จ่าย</th><th>จำนวนทริป</th><th>ระยะทางรวม (กม.)</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-400)' }}>กำลังโหลดข้อมูล...</td></tr>}
            {!loading && !error && summary.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-400)' }}>ยังไม่มีข้อมูล</td></tr>
            )}
            {!loading && summary.map((r) => (
              <tr key={r.vehicleId}>
                <td><b>{r.plate}</b></td>
                <td>{VEHICLE_TYPE_LABELS[r.type] || r.type}</td>
                <td>฿{fmtMoney(r.fuelExpense)}</td>
                <td>฿{fmtMoney(r.tollExpense)}</td>
                <td>฿{fmtMoney(r.repairExpense)}</td>
                <td><b>฿{fmtMoney(r.totalExpense)}</b></td>
                <td>{r.tripCount}</td>
                <td>{fmtMoney(r.totalKm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-title">ประวัติการเดินทาง (Trip Log)</div>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>วันที่</th><th>ผู้จอง</th><th>ปลายทาง</th><th>รถ</th><th>คนขับ</th>
              <th>ไมล์เริ่ม</th><th>ไมล์สิ้นสุด</th><th>ระยะทาง (กม.)</th><th>ค่าน้ำมัน</th><th>ค่าทางด่วน</th><th>หลักฐาน</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 && (
              <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--gray-400)' }}>ยังไม่มีข้อมูล</td></tr>
            )}
            {trips.map((t) => {
              const receipts = (t.trip && t.trip.receipts) || [];
              return (
                <tr key={t.id}>
                  <td>{fmtDateThai(t.date)}</td>
                  <td>{t.userName}</td>
                  <td style={{ whiteSpace: 'normal', maxWidth: 200 }}>{t.destination}</td>
                  <td>{t.vehiclePlate || '-'}</td>
                  <td>{t.driverName || '-'}</td>
                  <td>{t.trip && t.trip.odometerStart != null ? fmtMoney(t.trip.odometerStart) : '-'}</td>
                  <td>{t.trip && t.trip.odometerEnd != null ? fmtMoney(t.trip.odometerEnd) : '-'}</td>
                  <td>{t.trip && t.trip.distanceKm != null ? fmtMoney(t.trip.distanceKm) : '-'}</td>
                  <td>{t.trip && t.trip.fuelCost != null ? `฿${fmtMoney(t.trip.fuelCost)}` : '-'}</td>
                  <td>{t.trip && t.trip.tollCost != null ? `฿${fmtMoney(t.trip.tollCost)}` : '-'}</td>
                  <td>
                    {t.trip && t.trip.completedAt
                      ? <button className="btn btn-outline btn-sm" onClick={() => setReceiptsTrip(t)}>
                        ดูรายงาน{receipts.length > 0 ? ` (${receipts.length} ไฟล์)` : ''}
                      </button>
                      : <span className="badge badge-pending">ยังไม่ส่งรายงาน</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {receiptsTrip && (
        <Modal title={`หลักฐานค่าใช้จ่าย — ${receiptsTrip.userName}`} onClose={() => setReceiptsTrip(null)}
          footer={<button className="btn btn-secondary" onClick={() => setReceiptsTrip(null)}>ปิด</button>}>
          <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 12 }}>
            {receiptsTrip.destination} — {fmtDateThai(receiptsTrip.date)}
          </div>
          <TripReportSummary booking={receiptsTrip} />
        </Modal>
      )}
    </section>
  );
}
