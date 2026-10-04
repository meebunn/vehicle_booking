import React, { createContext, useCallback, useContext, useState } from 'react';
import Api from '../api.js';

const AppDataContext = createContext(null);

export function AppDataProvider({ user, setUser, children }) {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const refreshVehicles = useCallback(async () => {
    const { vehicles, types } = await Api.get('/api/vehicles');
    setVehicles(vehicles);
    setVehicleTypes(types);
  }, []);

  const refreshDrivers = useCallback(async () => {
    const { drivers } = await Api.get('/api/drivers');
    setDrivers(drivers);
  }, []);

  const refreshDepartments = useCallback(async () => {
    const { departments } = await Api.get('/api/departments');
    setDepartments(departments);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshVehicles(), refreshDrivers(), refreshDepartments()]);
  }, [refreshVehicles, refreshDrivers, refreshDepartments]);

  const logout = useCallback(async () => {
    await Api.post('/api/auth/logout');
    setUser(null);
  }, [setUser]);

  const value = { user, vehicles, vehicleTypes, drivers, departments, refreshVehicles, refreshDrivers, refreshDepartments, refreshAll, logout };
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData ต้องถูกเรียกภายใน <AppDataProvider>');
  return ctx;
}
