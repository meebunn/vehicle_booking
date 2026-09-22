import React, { useState } from 'react';
import Modal from '../components/Modal.jsx';
import Api from '../api.js';
import { useAppData } from '../context/AppDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { VEHICLE_TYPE_LABELS, VEHICLE_STATUS_LABELS, fmtMoney } from '../utils.js';

function VehicleModal({ vehicle, vehicleTypes, drivers, onClose, onSaved }) {
  const showToast = useToast();
  const [plate, setPlate] = useState(vehicle ? vehicle.plate : '');
  const [type, setType] = useState(vehicle ? vehicle.type : (vehicleTypes[0] ? vehicleTypes[0].id : ''));
  const [status, setStatus] = useState(vehicle ? vehicle.status : 'available');
  const [driverId, setDriverId] = useState(vehicle && vehicle.driverId ? vehicle.driverId : '');
  const [mileage, setMileage] = useState(vehicle ? vehicle.mileage : 0);
  const [fuelCardNo, setFuelCardNo] = useState(vehicle ? vehicle.fuelCardNo || '' : '');
  const [fuelLimit, setFuelLimit] = useState(vehicle ? vehicle.fuelLimit : 5000);
  const [fuelUsed, setFuelUsed] = useState(vehicle ? vehicle.fuelUsed : 0);
  const [tollCardNo, setTollCardNo] = useState(vehicle ? vehicle.tollCardNo || '' : '');
  const [tollLimit, setTollLimit] = useState(vehicle ? vehicle.tollLimit : 1000);
  const [tollUsed, setTollUsed] = useState(vehicle ? vehicle.tollUsed : 0);

  async function save() {
    if (!plate.trim()) { showToast('กรุณากรอกทะเบียนรถ', 'error'); return; }
    const payload = {
      plate: plate.trim(), type, status, driverId: driverId || null,
      mileage: Number(mileage) || 0, fuelCardNo: fuelCardNo.trim(), fuelLimit: Number(fuelLimit) || 0,
      fuelUsed: Number(fuelUsed) || 0, tollCardNo: tollCardNo.trim(), tollLimit: Number(tollLimit) || 0, tollUsed: Number(tollUsed) || 0
    };
    try {
      if (vehicle) await Api.put(`/api/vehicles/${vehicle.id}`, payload);
      else await Api.post('/api/vehicles', payload);
      showToast('บันทึกข้อมูลรถเรียบร้อยแล้ว', 'success');
      onSaved();
    } catch (err) { showToast(err.message, 'error'); }
  }

  return (
    <Modal title={vehicle ? 'แก้ไขข้อมูลรถ' : 'เพิ่มรถใหม่'} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button><button className="btn btn-primary" onClick={save}>บันทึก</button></>}>
      <div className="form-grid">
        <div className="field full"><label>ทะเบียนรถ *</label><input value={plate} onChange={(e) => setPlate(e.target.value)} /></div>
        <div className="field">
          <label>ประเภทรถ</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {vehicleTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>สถานะ</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {['available', 'in_use', 'maintenance'].map((s) => <option key={s} value={s}>{VEHICLE_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="field full">
          <label>คนขับประจำ</label>
          <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">-- ไม่ระบุ --</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="field"><label>เลขไมล์ปัจจุบัน (กม.)</label><input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} /></div>
        <div className="field"><label>เลขบัตรน้ำมัน</label><input value={fuelCardNo} onChange={(e) => setFuelCardNo(e.target.value)} /></div>
        <div className="field"><label>วงเงินบัตรน้ำมัน (บาท)</label><input type="number" value={fuelLimit} onChange={(e) => setFuelLimit(e.target.value)} /></div>
        <div className="field"><label>ใช้ไปแล้ว (บาท)</label><input type="number" value={fuelUsed} onChange={(e) => setFuelUsed(e.target.value)} /></div>
        <div className="field"><label>เลขบัตรทางด่วน</label><input value={tollCardNo} onChange={(e) => setTollCardNo(e.target.value)} /></div>
        <div className="field"><label>วงเงินทางด่วน (บาท)</label><input type="number" value={tollLimit} onChange={(e) => setTollLimit(e.target.value)} /></div>
        <div className="field"><label>ใช้ไปแล้ว (บาท)</label><input type="number" value={tollUsed} onChange={(e) => setTollUsed(e.target.value)} /></div>
      </div>
    </Modal>
  );
}

function DriverModal({ driver, vehicles, onClose, onSaved }) {
  const showToast = useToast();
  const [name, setName] = useState(driver ? driver.name : '');
  const [phone, setPhone] = useState(driver ? driver.phone || '' : '');
  const [licenseNo, setLicenseNo] = useState(driver ? driver.licenseNo || '' : '');
  const [vehicleId, setVehicleId] = useState(driver && driver.vehicleId ? driver.vehicleId : '');
  const [username, setUsername] = useState(driver && driver.username ? driver.username : '');
  const [password, setPassword] = useState('');

  async function save() {
    if (!name.trim()) { showToast('กรุณากรอกชื่อคนขับ', 'error'); return; }
    const payload = { name: name.trim(), phone: phone.trim(), licenseNo: licenseNo.trim(), vehicleId: vehicleId || null };
    if (username.trim()) payload.username = username.trim();
    if (password) payload.password = password;
    try {
      if (driver) await Api.put(`/api/drivers/${driver.id}`, payload);
      else await Api.post('/api/drivers', payload);
      showToast('บันทึกข้อมูลคนขับเรียบร้อยแล้ว', 'success');
      onSaved();
    } catch (err) { showToast(err.message, 'error'); }
  }

  return (
    <Modal title={driver ? 'แก้ไขข้อมูลคนขับ' : 'เพิ่มคนขับใหม่'} onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button><button className="btn btn-primary" onClick={save}>บันทึก</button></>}>
      <div className="form-grid">
        <div className="field full"><label>ชื่อ-นามสกุล *</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label>เบอร์โทรศัพท์</label><input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="field"><label>เลขที่ใบขับขี่</label><input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} /></div>
        <div className="field full">
          <label>รถประจำ</label>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">-- ไม่ระบุ --</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
          </select>
        </div>
      </div>
      <div className="section-title" style={{ marginTop: 18, fontSize: 13 }}>บัญชีเข้าสู่ระบบสำหรับคนขับ</div>
      <div className="hint-text" style={{ marginTop: -6 }}>
        {driver && driver.hasLogin ? 'ใส่รหัสผ่านใหม่เฉพาะกรณีต้องการเปลี่ยน — เว้นว่างไว้ถ้าไม่เปลี่ยน' : 'กำหนด username/password เพื่อให้คนขับคนนี้ล็อกอินเข้าดูงานของตัวเองได้ (เว้นว่างได้ถ้ายังไม่ต้องการสร้างบัญชี)'}
      </div>
      <div className="form-grid">
        <div className="field"><label>Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="เช่น driver5" autoComplete="off" /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={driver && driver.hasLogin ? 'เว้นว่าง = ไม่เปลี่ยน' : 'เช่น driver123'} autoComplete="new-password" /></div>
      </div>
    </Modal>
  );
}

function ExpenseModal({ vehicles, onClose, onSaved }) {
  const showToast = useToast();
  const [vehicleId, setVehicleId] = useState(vehicles[0] ? vehicles[0].id : '');
  const [type, setType] = useState('fuel');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [detail, setDetail] = useState('');

  async function save() {
    if (!amount) { showToast('กรุณากรอกจำนวนเงิน', 'error'); return; }
    try {
      await Api.post('/api/expenses', { vehicleId, type, date, amount: Number(amount), detail: detail.trim() });
      showToast('บันทึกค่าใช้จ่ายเรียบร้อยแล้ว', 'success');
      onSaved();
    } catch (err) { showToast(err.message, 'error'); }
  }

  return (
    <Modal title="บันทึกค่าใช้จ่าย" onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button><button className="btn btn-primary" onClick={save}>บันทึก</button></>}>
      <div className="form-grid">
        <div className="field full">
          <label>รถ *</label>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
          </select>
        </div>
        <div className="field">
          <label>ประเภทค่าใช้จ่าย *</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="fuel">ค่าน้ำมัน</option>
            <option value="toll">ค่าทางด่วน</option>
            <option value="repair">ค่าซ่อมบำรุง</option>
          </select>
        </div>
        <div className="field"><label>วันที่ *</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="field"><label>จำนวนเงิน (บาท) *</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="field full"><label>รายละเอียด</label><input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="เช่น เติมน้ำมันดีเซล 40 ลิตร" /></div>
      </div>
    </Modal>
  );
}

export default function VehiclesAdmin() {
  const { vehicles, vehicleTypes, drivers, refreshAll } = useAppData();
  const showToast = useToast();
  const [tab, setTab] = useState('vehicles');
  const [vehicleModal, setVehicleModal] = useState(null); // null=closed, 'new', or vehicle object
  const [driverModal, setDriverModal] = useState(null);
  const [expenseModal, setExpenseModal] = useState(false);

  async function deleteVehicle(id) {
    if (!confirm('ยืนยันลบรถคันนี้หรือไม่?')) return;
    try { await Api.del(`/api/vehicles/${id}`); showToast('ลบรถเรียบร้อยแล้ว', 'success'); refreshAll(); }
    catch (err) { showToast(err.message, 'error'); }
  }
  async function deleteDriver(id) {
    if (!confirm('ยืนยันลบคนขับคนนี้หรือไม่?')) return;
    try { await Api.del(`/api/drivers/${id}`); showToast('ลบข้อมูลคนขับเรียบร้อยแล้ว', 'success'); refreshAll(); }
    catch (err) { showToast(err.message, 'error'); }
  }

  return (
    <section className="view active">
      <div className="page-head">
        <div>
          <h1>จัดการรถและคนขับ</h1>
          <div className="sub">ข้อมูลรถทุกคัน สถานะ วงเงินบัตรน้ำมัน และวงเงินทางด่วน</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setExpenseModal(true)}>＋ บันทึกค่าใช้จ่าย</button>
          <button className="btn btn-primary btn-sm" onClick={() => setVehicleModal('new')}>＋ เพิ่มรถ</button>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab-btn ${tab === 'vehicles' ? 'active' : ''}`} onClick={() => setTab('vehicles')}>รถทั้งหมด</div>
        <div className={`tab-btn ${tab === 'drivers' ? 'active' : ''}`} onClick={() => setTab('drivers')}>คนขับ</div>
      </div>

      {tab === 'vehicles' && (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>ทะเบียน</th><th>ประเภท</th><th>สถานะ</th><th>คนขับ</th><th>เลขไมล์</th>
                <th>บัตรน้ำมัน (ใช้/วงเงิน)</th><th>ทางด่วน (ใช้/วงเงิน)</th><th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const fuelPct = v.fuelLimit ? Math.min(100, Math.round((v.fuelUsed / v.fuelLimit) * 100)) : 0;
                const tollPct = v.tollLimit ? Math.min(100, Math.round((v.tollUsed / v.tollLimit) * 100)) : 0;
                return (
                  <tr key={v.id}>
                    <td><b>{v.plate}</b></td>
                    <td><span className={`legend-dot dot-${v.type}`} style={{ display: 'inline-block' }} /> {VEHICLE_TYPE_LABELS[v.type] || v.type}</td>
                    <td><span className={`badge badge-${v.status}`}>{VEHICLE_STATUS_LABELS[v.status] || v.status}</span></td>
                    <td>{v.driverName || '-'}</td>
                    <td>{fmtMoney(v.mileage)} กม.</td>
                    <td style={{ minWidth: 130 }}>
                      ฿{fmtMoney(v.fuelUsed)} / ฿{fmtMoney(v.fuelLimit)}
                      <div className={`progress-bar ${fuelPct > 85 ? 'danger' : fuelPct > 60 ? 'warn' : ''}`}><div style={{ width: `${fuelPct}%` }} /></div>
                    </td>
                    <td style={{ minWidth: 130 }}>
                      ฿{fmtMoney(v.tollUsed)} / ฿{fmtMoney(v.tollLimit)}
                      <div className={`progress-bar ${tollPct > 85 ? 'danger' : tollPct > 60 ? 'warn' : ''}`}><div style={{ width: `${tollPct}%` }} /></div>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setVehicleModal(v)}>แก้ไข</button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => deleteVehicle(v.id)}>ลบ</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'drivers' && (
        <>
          <div className="page-head" style={{ marginTop: 6 }}>
            <div></div>
            <button className="btn btn-primary btn-sm" onClick={() => setDriverModal('new')}>＋ เพิ่มคนขับ</button>
          </div>
          <div className="table-wrap card">
            <table>
              <thead>
                <tr><th>ชื่อ-นามสกุล</th><th>เบอร์โทร</th><th>เลขที่ใบขับขี่</th><th>รถประจำ</th><th>บัญชีเข้าสู่ระบบ</th><th>จัดการ</th></tr>
              </thead>
              <tbody>
                {drivers.map((d) => {
                  const vh = vehicles.find((v) => v.id === d.vehicleId);
                  return (
                    <tr key={d.id}>
                      <td>{d.name}</td><td>{d.phone || '-'}</td><td>{d.licenseNo || '-'}</td>
                      <td>{vh ? vh.plate : '-'}</td>
                      <td>{d.hasLogin ? <span className="badge badge-available">{d.username}</span> : <span className="badge badge-maintenance">ยังไม่มีบัญชี</span>}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => setDriverModal(d)}>แก้ไข</button>{' '}
                        <button className="btn btn-danger btn-sm" onClick={() => deleteDriver(d.id)}>ลบ</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {vehicleModal && (
        <VehicleModal
          vehicle={vehicleModal === 'new' ? null : vehicleModal}
          vehicleTypes={vehicleTypes} drivers={drivers}
          onClose={() => setVehicleModal(null)}
          onSaved={() => { setVehicleModal(null); refreshAll(); }}
        />
      )}
      {driverModal && (
        <DriverModal
          driver={driverModal === 'new' ? null : driverModal}
          vehicles={vehicles}
          onClose={() => setDriverModal(null)}
          onSaved={() => { setDriverModal(null); refreshAll(); }}
        />
      )}
      {expenseModal && (
        <ExpenseModal vehicles={vehicles} onClose={() => setExpenseModal(false)} onSaved={() => setExpenseModal(false)} />
      )}
    </section>
  );
}
