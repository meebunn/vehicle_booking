import React from 'react';
import Modal from './Modal.jsx';
import TripReportSummary from './TripReportSummary.jsx';
import { fmtDateThai, STATUS_LABELS } from '../utils.js';

export default function BookingDetailModal({ booking, onClose }) {
  const b = booking;
  return (
    <Modal title="รายละเอียดการจอง" onClose={onClose} footer={<button className="btn btn-secondary" onClick={onClose}>ปิด</button>}>
      <div className="approval-meta">
        <div><div className="lbl">ผู้จอง</div>{b.userName} ({b.department || '-'})</div>
        <div><div className="lbl">วันที่</div>{fmtDateThai(b.date)}</div>
        <div><div className="lbl">เวลา</div>{b.startTime} - {b.endTime}</div>
        <div><div className="lbl">สถานะ</div><span className={`badge badge-${b.status}`}>{STATUS_LABELS[b.status]}</span></div>
        <div className="full"><div className="lbl">ปลายทาง</div>{b.destination}</div>
        <div className="full"><div className="lbl">เหตุผล</div>{b.reason}</div>
        {b.jobDetail && <div className="full"><div className="lbl">รายละเอียดงาน</div>{b.jobDetail}</div>}
        <div><div className="lbl">รถ</div>{b.vehiclePlate || 'ยังไม่จัดรถ'}</div>
        <div><div className="lbl">คนขับ</div>{b.driverName || '-'}</div>
        {b.status === 'rejected' && <div className="full"><div className="lbl">เหตุผลที่ไม่อนุมัติ</div>{b.rejectReason || '-'}</div>}
      </div>
      <TripReportSummary booking={b} />
    </Modal>
  );
}
