import React, { useEffect, useState } from 'react';
import Api from '../api.js';
import { useAppData } from '../context/AppDataContext.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import CalendarView from './CalendarView.jsx';
import NewBookingForm from './NewBookingForm.jsx';
import MyBookings from './MyBookings.jsx';
import MyTrips from './MyTrips.jsx';
import ApprovalQueue from './ApprovalQueue.jsx';
import VehiclesAdmin from './VehiclesAdmin.jsx';
import Reports from './Reports.jsx';

const COMPANY_NAME = 'บริษัท เนแรค อาร์มส์ อินดัสตรี จำกัด';

export default function AppShell() {
  const { user, vehicleTypes, refreshAll, logout } = useAppData();
  const [view, setView] = useState(user.role === 'driver' ? 'my-trips' : 'calendar');
  const [editingBooking, setEditingBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingBadge, setPendingBadge] = useState(0);
  const [tripsBadge, setTripsBadge] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [approvalBookingId, setApprovalBookingId] = useState(null);
  const [calendarFocus, setCalendarFocus] = useState(null);
  const [reportFocus, setReportFocus] = useState(null);
  const [tripFocus, setTripFocus] = useState(null);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // badge นับจำนวนงานรออนุมัติ (แอดมิน) — poll ตลอดไม่ว่าจะอยู่หน้าไหน
  useEffect(() => {
    if (user.role !== 'admin') return;
    async function refresh() {
      const { bookings } = await Api.get('/api/bookings');
      setPendingBadge(bookings.filter((b) => b.status === 'pending').length);
    }
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [user.role]);

  // badge นับงานที่ยังไม่ส่งรายงาน (คนขับ)
  useEffect(() => {
    if (user.role !== 'driver') return;
    async function refresh() {
      const { bookings } = await Api.get('/api/bookings');
      setTripsBadge(bookings.filter((b) => !(b.trip && b.trip.completedAt)).length);
    }
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [user.role]);

  function goTo(v) {
    setView(v);
    if (v === 'new-booking') setEditingBooking(null);
  }
  function openNotification(notification) {
    if (notification.type === 'new_request' && notification.relatedBookingId) {
      setApprovalBookingId(notification.relatedBookingId);
      setView('approval');
      return;
    }
    if (notification.type === 'approved' && notification.relatedBookingId) {
      setCalendarFocus({ bookingId: notification.relatedBookingId, openedAt: Date.now() });
      setView('calendar');
      return;
    }
    if (notification.type === 'assigned' && notification.relatedBookingId) {
      setTripFocus({ bookingId: notification.relatedBookingId, openedAt: Date.now() });
      setView('my-trips');
      return;
    }
    if (notification.type === 'trip_report' && notification.relatedBookingId) {
      setReportFocus({ bookingId: notification.relatedBookingId, openedAt: Date.now() });
      setView('reports');
    }
  }
  function startEdit(booking) {
    setEditingBooking(booking);
    setView('new-booking');
  }
  function afterBookingSaved() {
    setEditingBooking(null);
    setView('my-bookings');
    setRefreshKey((k) => k + 1);
  }

  const isEmployee = user.role === 'employee';
  const isDriver = user.role === 'driver';
  const isAdmin = user.role === 'admin';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <div className="title">Smart Car Booking</div>
            <div className="subtitle">ระบบจองรถส่วนกลาง</div>
          </div>
        </div>

        {!isDriver && (
          <button className="new-booking-btn" onClick={() => goTo('new-booking')}>+ คำขอจองรถ</button>
        )}

        {!isDriver && (
          <div className="nav-group">
            <div className="nav-group-title">เมนูของฉัน</div>
            <button className={`nav-item ${view === 'calendar' ? 'active' : ''}`} onClick={() => goTo('calendar')}>ปฏิทินการจอง</button>
            <button className={`nav-item ${view === 'my-bookings' ? 'active' : ''}`} onClick={() => goTo('my-bookings')}>การจองรถทั้งหมด</button>
          </div>
        )}

        {isDriver && (
          <div className="nav-group">
            <div className="nav-group-title">สำหรับคนขับ</div>
            <button className={`nav-item ${view === 'my-trips' ? 'active' : ''}`} onClick={() => goTo('my-trips')}>
              งานของฉัน {tripsBadge > 0 && <span className="badge-count">{tripsBadge}</span>}
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="nav-group">
            <div className="nav-group-title">สำหรับผู้ดูแลระบบ</div>
            <button className={`nav-item ${view === 'approval' ? 'active' : ''}`} onClick={() => goTo('approval')}>
              อนุมัติคำขอ {pendingBadge > 0 && <span className="badge-count">{pendingBadge}</span>}
            </button>
            <button className={`nav-item ${view === 'vehicles' ? 'active' : ''}`} onClick={() => goTo('vehicles')}>รถ / คนขับ</button>
            <button className={`nav-item ${view === 'reports' ? 'active' : ''}`} onClick={() => goTo('reports')}>รายงาน</button>
          </div>
        )}

        {!isDriver && (
          <div className="legend-box">
            <div className="legend-title">ประเภทรถ</div>
            {vehicleTypes.map((t) => (
              <div key={t.id} className="legend-item"><span className={`legend-dot dot-${t.id}`} />{t.label}</div>
            ))}
          </div>
        )}

      </aside>

      <div className="main-col">
        <div className="topbar">
          <div>
            {/* <div className="company-name">บริษัท เนแรค อาร์มส์ อินดัสตรี จำกัด</div> */}
            <div className="view-title">{COMPANY_NAME}</div>
          </div>
          <div className="topbar-right">
            <NotificationBell onNotificationClick={openNotification} />
            <div className="profile-wrap">
              <button
                className="profile-btn"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <div className="user-avatar">{user.name.charAt(0)}</div>
                <div className="profile-info">
                  <span className="profile-name">{user.name}</span>
                  <span className="profile-role">{isAdmin ? 'ผู้ดูแลระบบ' : isDriver ? 'พนักงานขับรถ' : (user.department || 'พนักงาน')}</span>
                </div>
                <span className="profile-chevron" aria-hidden="true">⌄</span>
              </button>
              {profileOpen && (
                <div className="profile-menu" role="menu">
                  <div className="profile-menu-name">{user.name}</div>
                  <button className="logout-link" onClick={logout} role="menuitem">ออกจากระบบ</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content">
          {view === 'calendar' && <CalendarView onNewBooking={() => goTo('new-booking')} calendarFocus={calendarFocus} />}
          {view === 'new-booking' && (
            <NewBookingForm editingBooking={editingBooking} onDone={afterBookingSaved} onCancel={() => goTo(isDriver ? 'my-trips' : 'calendar')} />
          )}
          {view === 'my-bookings' && <MyBookings onEdit={startEdit} refreshKey={refreshKey} />}
          {view === 'my-trips' && <MyTrips onBadgeChange={setTripsBadge} tripFocus={tripFocus} />}
          {view === 'approval' && <ApprovalQueue onBadgeChange={setPendingBadge} focusBookingId={approvalBookingId} />}
          {view === 'vehicles' && <VehiclesAdmin />}
          {view === 'reports' && <Reports reportFocus={reportFocus} />}
        </div>
      </div>
    </div>
  );
}
