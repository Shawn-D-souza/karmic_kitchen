import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppLayout from '../layouts/AppLayout';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import LoadingScreen from '../components/LoadingScreen';

// This component fetches the user's role and directs them to the correct dashboard.
function ProtectedRouter({ session }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      setLoading(true);
      const { user } = session;

      try {
        const { data, error, status } = await supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', user.id)
          .single(); // We only expect one row

        if (error && status !== 406) {
          throw error;
        }

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error.message);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [session]);

  if (loading) {
    return <LoadingScreen />;
  }

  // Once we have the profile, we render the layout and routes.
  // The layout will contain the AppBar and navigation.
  return (
    <AppLayout userProfile={profile}>
      <Routes>
        {profile?.role === 'admin' ? (
          <>
            {/* Admin-specific routes */}
            <Route path="/" element={<AdminDashboard />} />
            {/* We will add /menu here in the next step */}
          </>
        ) : (
          <>
            {/* Employee-specific routes */}
            <Route path="/" element={<EmployeeDashboard />} />
            {/* We will add /my-orders here later */}
          </>
        )}
        {/* A fallback route for any unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default ProtectedRouter;

