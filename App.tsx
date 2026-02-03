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
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#18191a] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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
      <>
        <SupabaseConfigModal />
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/history" element={<History />} />
            <Route path="/account" element={<Account />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AppLayout>
      </>
    );
  }

  // Public -> Use Landing Page Layout (Navbar)
  return (
    <>
      <SupabaseConfigModal />
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
      <AppContent />
    </Router>
  );
}

export default App;