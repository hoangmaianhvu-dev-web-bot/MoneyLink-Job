import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Withdraw from './pages/Withdraw';
import History from './pages/History';
import Account from './pages/Account';
import RedirectPage from './pages/RedirectPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Referral from './pages/Referral';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import LoadingScreen from './components/LoadingScreen';

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Artificial delay to show the beautiful loading screen (optional, improves UX feel)
    const minLoadTime = 1500; 
    const start = Date.now();

    const finishLoading = () => {
        const now = Date.now();
        const diff = now - start;
        if (diff < minLoadTime) {
            setTimeout(() => setLoading(false), minLoadTime - diff);
        } else {
            setLoading(false);
        }
    };

    if (!supabase) {
      finishLoading();
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      finishLoading();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect Page (Standalone)
  if (location.pathname.startsWith('/v/')) {
      return (
        <Routes>
           <Route path="/v/:slug" element={<RedirectPage />} />
        </Routes>
      );
  }

  // Logged in -> Use AppLayout (Social Media Style)
  if (session) {
    return (
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Dashboard />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/history" element={<History />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AppLayout>
    );
  }

  // Public -> Use Landing Page Layout (Navbar)
  return (
    <>
      <Navbar session={session} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <SupabaseConfigModal />
      <AppContent />
    </Router>
  );
}

export default App;