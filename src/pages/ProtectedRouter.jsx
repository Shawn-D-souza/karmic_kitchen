import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppLayout from '../layouts/AppLayout';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import LoadingScreen from '../components/LoadingScreen';

// Import the Admin pages
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
          // Removed work_location since we are not using it
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
    <AppLayout userProfile={profile} setUserProfile={setProfile}>
      <Routes>
        {profile?.role === 'admin' ? (
          <>
            {/* Admin-specific routes */}
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/menu" element={<DailyMenuPlanner />} />
            <Route path="/templates" element={<WeeklyTemplates />} />
            {/* <Route path="/notifications" element={<AdminNotifications />} /> */} {/* <-- REMOVED THIS ROUTE */}
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