// src/pages/EmployeeDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from '@mui/material';
// --- ADD THIS IMPORT ---
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { supabase } from '../supabaseClient';
import dayjs from 'dayjs';

// --- NEW HELPER ---
// Checks if a given date is today
const isToday = (date) => {
  return dayjs(date).isSame(dayjs(), 'day');
};

// --- Business Rule ---
// New cut-off time: 12:30 PM
const now = new Date();
const isPastCutoffTime = now.getHours() > 12 || (now.getHours() === 12 && now.getMinutes() >= 30);


// --- Helper Component ---
// (This component is unchanged)
function MealCard({
  title,
  item,
  mealType,
  checked,
  onToggle,
  disabled,
  loading,
}) {
  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ minHeight: '3rem' }}
        >
          {item || 'No item specified'}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 2,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={checked}
                onChange={(e) => onToggle(mealType, e.target.checked)}
                disabled={disabled || loading}
              />
            }
            label={checked ? 'Opted-In' : 'Opt-In'}
          />
          {loading && <CircularProgress size={24} />}
        </Box>
      </CardContent>
    </Card>
  );
}

// --- Main Dashboard Component ---
export default function EmployeeDashboard() {
  // --- STATE UPDATES ---
  // 1. Default date is now tomorrow
  const [selectedDate, setSelectedDate] = useState(dayjs().add(1, 'day'));
  // 2. Add state for "isLocked" logic
  const [isLocked, setIsLocked] = useState(false);

  const [menu, setMenu] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({
    breakfast: false,
    lunch: false,
    snack: false,
    dinner: false,
  });

  const fetchDashboardData = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    setMenu(null);
    setConfirmation(null);
    
    // --- DYNAMIC LOCK LOGIC ---
    // Selections are locked ONLY IF:
    // 1. The selected date is TODAY
    // 2. AND it is past the 12:30 PM cut-off time
    const today = isToday(date);
    setIsLocked(today && isPastCutoffTime);
    
    const dateString = date.format('YYYY-MM-DD');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not found.');

      // 1. Fetch menu for the SELECTED date
      const { data: menuData, error: menuError } = await supabase
        .from('daily_menu')
        .select('*')
        .eq('menu_date', dateString)
        .single();

      if (menuError && menuError.code !== 'PGRST116') {
        throw menuError;
      }

      // 2. Fetch user's confirmation for the SELECTED date
      const { data: confirmationData, error: confirmationError } =
        await supabase
          .from('confirmations')
          .select('*')
          .eq('menu_date', dateString)
          .eq('user_id', user.id)
          .single();

      if (confirmationError && confirmationError.code !== 'PGRST116') {
        throw confirmationError;
      }

      setMenu(menuData);
      setConfirmation(confirmationData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Re-fetch data whenever selectedDate changes
    fetchDashboardData(selectedDate);
  }, [selectedDate, fetchDashboardData]);

  const handleToggle = async (mealType, newValue) => {
    const savingKey = mealType.split('_')[2]; // 'opt_in_breakfast' -> 'breakfast'
    setSaving((prev) => ({ ...prev, [savingKey]: true }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // Use the selectedDate from state
      const dateString = selectedDate.format('YYYY-MM-DD');

      const upsertData = {
        user_id: user.id,
        menu_date: dateString,
        ...confirmation, // Spread existing values
        [mealType]: newValue,
      };

      const { data: updatedConfirmation, error } = await supabase
        .from('confirmations')
        .upsert(upsertData, { onConflict: 'user_id, menu_date' })
        .select()
        .single();

      if (error) throw error;

      setConfirmation(updatedConfirmation);
    } catch (error) { // <-- THIS IS THE FIX (Added { )
      console.error('Error saving confirmation:', error.message);
    } finally { // <-- THIS IS THE FIX (Added } )
      setSaving((prev) => ({ ...prev, [savingKey]: false }));
    }
  };

  return (
    <Box>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Select Your Meals
        </Typography>
        {/* --- ADD THE DATE PICKER --- */}
        <DatePicker
          label="Select Date"
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)}
          // Disable selection for past dates
          minDate={dayjs()} 
          sx={{ minWidth: 240 }}
        />
      </Box>

      {isLocked && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          The 12:30 PM cut-off time has passed. Selections for today are now
          locked.
        </Alert>
      )}

      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">
          Could not load dashboard data: {error}
        </Alert>
      )}

      {!loading && !error && !menu && (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">
            The menu for {selectedDate.format('MMMM D, YYYY')} has not been posted yet.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please check back later or select a different date.
          </Typography>
        </Paper>
      )}

      {!loading && !error && menu && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MealCard
              title="Breakfast"
              item={menu.item_breakfast}
              mealType="opt_in_breakfast"
              checked={!!confirmation?.opt_in_breakfast}
              onToggle={handleToggle}
              disabled={isLocked} // Use dynamic lock
              loading={saving.breakfast}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <MealCard
              title="Lunch"
              item={menu.item_lunch}
              mealType="opt_in_lunch"
              checked={!!confirmation?.opt_in_lunch}
              onToggle={handleToggle}
              disabled={isLocked} // Use dynamic lock
              loading={saving.lunch}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <MealCard
              title="Snack"
              item={menu.item_snack}
              mealType="opt_in_snack"
              checked={!!confirmation?.opt_in_snack}
              onToggle={handleToggle}
              disabled={isLocked} // Use dynamic lock
              loading={saving.snack}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <MealCard
              title="Dinner"
              item={menu.item_dinner}
              mealType="opt_in_dinner"
              checked={!!confirmation?.opt_in_dinner}
              onToggle={handleToggle}
              disabled={isLocked} // Use dynamic lock
              loading={saving.dinner}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}