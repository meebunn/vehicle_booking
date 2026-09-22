import React, { useEffect, useState } from 'react';
import Api from './api.js';
import { ToastProvider } from './context/ToastContext.jsx';
import { AppDataProvider } from './context/AppDataContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AppShell from './pages/AppShell.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    Api.get('/api/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null; // ไม่ต้องแสดงอะไรระหว่างเช็ค session (ไวมาก ไม่ต้องมี spinner)

  return (
    <ToastProvider>
      {user ? (
        <AppDataProvider user={user} setUser={setUser}>
          <AppShell />
        </AppDataProvider>
      ) : (
        <LoginPage onLoggedIn={setUser} />
      )}
    </ToastProvider>
  );
}
