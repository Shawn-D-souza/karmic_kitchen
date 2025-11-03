import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import AuthPage from './pages/AuthPage';
import ProtectedRouter from './pages/ProtectedRouter';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* If the user is NOT logged in, they can only access /auth.
        If they try to go anywhere else, they are redirected to /auth.
      */}
      <Route
        path="/auth"
        element={!session ? <AuthPage /> : <Navigate to="/" replace />}
      />

      {/* If the user IS logged in, they are sent to the ProtectedRouter.
        If they try to go to /auth, they are redirected to their dashboard.
      */}
      <Route
        path="/*"
        element={session ? <ProtectedRouter session={session} /> : <Navigate to="/auth" replace />}
      />
    </Routes>
  );
}

export default App;

