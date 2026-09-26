import React from 'react';
import { getApiUrl } from '../api.js';
import { fmtDateTimeThai, fmtMoney } from '../utils.js';

function ReceiptLinks({ items }) {
  if (!items.length) return <span style={{ color: 'var(--gray-400)' }}>ไม่มีไฟล์แนบ</span>;
  return (
    <>
      {items.map((r) => (
        <a key={r.filename} href={getApiUrl(r.url)} target="_blank" rel="noreferrer" className="receipt-chip">
          📎 {r.filename.endsWith('.pdf') ? 'ไฟล์ PDF' : 'ดูรูป'}
        </a>
      ))}
    </>
  );
}

export default function TripReportSummary({ booking }) {
  const trip = booking.trip;
  if (!trip || !trip.completedAt) return null;
  const fuelReceipts = (trip.receipts || []).filter((r) => r.type === 'fuel');
  const tollReceipts = (trip.receipts || []).filter((r) => r.type === 'toll');

  return (
    <>
      <div className="section-title" style={{ marginTop: 18 }}>ใบรายงานการใช้รถ</div>
      <div className="approval-meta">
        <div><div className="lbl">ระยะทางที่เดินทางจริง</div>{fmtMoney(trip.distanceKm)} กม. ({fmtMoney(trip.odometerStart)} → {fmtMoney(trip.odometerEnd)})</div>
        <div><div className="lbl">ค่าน้ำมัน</div>฿{fmtMoney(trip.fuelCost)}</div>
        <div><div className="lbl">ค่าทางด่วน</div>฿{fmtMoney(trip.tollCost)} ({trip.tollCount || 0} ด่าน)</div>
        <div className="full"><div className="lbl">หลักฐานค่าน้ำมัน</div><ReceiptLinks items={fuelReceipts} /></div>
        <div className="full"><div className="lbl">หลักฐานค่าทางด่วน</div><ReceiptLinks items={tollReceipts} /></div>
        {trip.notes && <div className="full"><div className="lbl">หมายเหตุ</div>{trip.notes}</div>}
        <div className="full" style={{ color: 'var(--gray-400)', fontSize: 11.5 }}>ส่งรายงานเมื่อ {fmtDateTimeThai(trip.reportedAt || trip.completedAt)}</div>
      </div>
    </>
  );
}
