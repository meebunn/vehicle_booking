USE vehicle_booking;

ALTER TABLE trip_reports
  ADD COLUMN notes TEXT NULL,
  ADD COLUMN receipts JSON NULL,
  ADD COLUMN reported_by VARCHAR(20) NULL,
  ADD COLUMN reported_at DATETIME NULL,
  ADD CONSTRAINT fk_trip_reports_reported_by
    FOREIGN KEY (reported_by) REFERENCES users(id);