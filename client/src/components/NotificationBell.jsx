import React, { useEffect, useRef, useState } from 'react';
import Api from '../api.js';
import { fmtDateTimeThai } from '../utils.js';

export default function NotificationBell({ onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  async function load() {
    const { notifications } = await Api.get('/api/notifications');
    setNotifications(notifications);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  async function markRead(id) {
    await Api.post(`/api/notifications/${id}/read`);
    load();
  }

  async function markAllRead(e) {
    e.stopPropagation();
    await Api.post('/api/notifications/read-all');
    load();
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        className="bell-btn"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        aria-label="การแจ้งเตือน"
        title="การแจ้งเตือน"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unread > 0 && <span className="dot" />}
      </button>
      <div className={`notif-panel ${open ? 'open' : ''}`}>
        <div className="notif-panel-header">
          <span>การแจ้งเตือน</span>
          <button onClick={markAllRead}>อ่านทั้งหมด</button>
        </div>
        {notifications.length === 0 ? (
          <div className="notif-empty">ยังไม่มีการแจ้งเตือน</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => { markRead(n.id); onNotificationClick?.(n); }}>
              <div className="n-msg">{n.message}</div>
              <div className="n-time">{fmtDateTimeThai(n.createdAt)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
