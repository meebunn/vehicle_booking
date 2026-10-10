import React, { useEffect, useMemo, useState } from 'react';
import Api from '../api.js';
import { useAppData } from '../context/AppDataContext.jsx';
import BookingDetailModal from '../components/BookingDetailModal.jsx';
import { VEHICLE_TYPE_LABELS } from '../utils.js';

const DOW = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function localTimeString(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
}

export default function CalendarView({ onNewBooking, calendarFocus }) {
  const { user, vehicles, vehicleTypes, drivers, refreshVehicles } = useAppData();
  const [cursor, setCursor] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [detailBooking, setDetailBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [availabilityExpanded, setAvailabilityExpanded] = useState(false);

  const todayStr = localDateString();
  const currentTime = localTimeString();

  useEffect(() => {
    let active = true;
    setLoadingBookings(true);
    setBookingError('');
    Api.get(user.role === 'admin' ? '/api/bookings?all=1' : '/api/bookings')
      .then(({ bookings }) => {
        if (!active) return;
        setBookings(bookings.filter((b) => b.status !== 'rejected'));
      })
      .catch((error) => {
        if (!active) return;
        setBookingError(error.status === 401
          ? 'เซสชันหมดอายุ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่'
          : `ไม่สามารถโหลดข้อมูลปฏิทินได้${error.status ? ` (HTTP ${error.status})` : ''}`);
      })
      .finally(() => {
        if (active) setLoadingBookings(false);
      });
    return () => { active = false; };
  }, [cursor, refreshKey, refreshVehicles, user.role]);

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      setRefreshKey((key) => key + 1);
      refreshVehicles().catch(() => {});
    }, 15000);
    return () => clearInterval(refreshTimer);
  }, [refreshVehicles]);

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
  const busyVehicleIds = new Set(todayBookings
    .filter((b) => ['approved', 'completed'].includes(b.status) && b.vehicleId
      && b.startTime <= currentTime && b.endTime > currentTime)
    .map((b) => b.vehicleId));
  const availableVehicles = vehicles.filter((v) => v.status === 'available' && !busyVehicleIds.has(v.id));
  const availableVehicleCount = availableVehicles.length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const busyDriverIds = new Set(todayBookings
    .filter((b) => ['approved', 'completed'].includes(b.status) && b.driverId
      && b.startTime <= currentTime && b.endTime > currentTime)
    .map((b) => b.driverId));
  const availableDrivers = drivers.filter((driver) => !busyDriverIds.has(driver.id));
  const availableDriverCount = availableDrivers.length;

  return (
    <section className="view active">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">วันนี้</div>
          <div className="kpi-value">{todayBookings.length} รายการ</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">รถว่างตอนนี้</div>
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

      <div className="calendar-full-layout">
        <div className="card">
          <div className="type-legend-row">
            {vehicleTypes.map((t) => (
              <div key={t.id} className="legend-item"><span className={`legend-dot dot-${t.id}`} />{t.label}</div>
            ))}
          </div>
          {loadingBookings && <div style={{ padding: '12px 16px', color: 'var(--gray-600)', fontSize: 13 }}>กำลังโหลดข้อมูลปฏิทิน...</div>}
          {bookingError && (
            <div role="alert" style={{ margin: '12px 16px', padding: 12, border: '1px solid #e5a3a3', color: '#9b2c2c', background: '#fff5f5', fontSize: 13 }}>
              <div>{bookingError}</div>
              <button type="button" className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setRefreshKey((key) => key + 1)}>ลองโหลดอีกครั้ง</button>
            </div>
          )}
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

      </div>

      <section className="card dashboard-panel dashboard-availability-panel">
        <button
          type="button"
          className="dashboard-panel-head dashboard-panel-toggle"
          onClick={() => setAvailabilityExpanded((expanded) => !expanded)}
          aria-expanded={availabilityExpanded}
        >
          <div>
            <h2>รถและคนขับว่างตอนนี้</h2>
            <div className="dashboard-panel-sub">ไม่นับรายการที่กำลังมีงานในช่วงเวลาปัจจุบัน</div>
          </div>
          <span className="dashboard-panel-summary">รถ {availableVehicleCount} คัน · คนขับ {availableDriverCount} คน <span aria-hidden="true">{availabilityExpanded ? '⌃' : '⌄'}</span></span>
        </button>
        {availabilityExpanded && (
          <div className="availability-columns">
            <div>
              <div className="availability-heading">รถว่าง ({availableVehicleCount})</div>
              {availableVehicles.length === 0
                ? <div className="dashboard-empty compact">ไม่มีรถว่าง</div>
                : availableVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="availability-row">
                    <strong>{vehicle.plate}</strong>
                    <span>{VEHICLE_TYPE_LABELS[vehicle.type] || vehicle.type}</span>
                  </div>
                ))}
            </div>
            <div>
              <div className="availability-heading">คนขับว่าง ({availableDriverCount})</div>
              {availableDrivers.length === 0
                ? <div className="dashboard-empty compact">ไม่มีคนขับว่าง</div>
                : availableDrivers.map((driver) => (
                  <div key={driver.id} className="availability-row">
                    <strong>{driver.name}</strong>
                    <span>{driver.phone || 'พร้อมรับงาน'}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </section>

      {detailBooking && <BookingDetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />}
    </section>
  );
}
