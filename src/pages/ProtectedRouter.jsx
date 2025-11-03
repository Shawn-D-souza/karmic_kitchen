import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppLayout from '../layouts/AppLayout';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import LoadingScreen from '../components/LoadingScreen';

// Import the new Admin pages
import DailyMenuPlanner from './DailyMenuPlanner';
import WeeklyTemplates from './WeeklyTemplates';

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
          .single();

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

  return (
    <AppLayout userProfile={profile}>
      <Routes>
        {profile?.role === 'admin' ? (
          <>
            {/* Admin-specific routes */}
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/menu" element={<DailyMenuPlanner />} />
            <Route path="/templates" element={<WeeklyTemplates />} />
          </>
        ) : (
          <>
            {/* Employee-specific routes */}
            <Route path="/" element={<EmployeeDashboard />} />
          </>
        )}
        {/* A fallback route for any unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default ProtectedRouter;