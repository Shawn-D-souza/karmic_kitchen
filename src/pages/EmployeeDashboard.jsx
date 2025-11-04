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
import { supabase } from '../supabaseClient';
import dayjs from 'dayjs';

// --- Business Rule ---
// New cut-off time: 12:30 PM
const now = new Date();
const isPastCutoff = now.getHours() > 12 || (now.getHours() === 12 && now.getMinutes() >= 30);


// --- Helper Component ---
// This component renders one of the four meal cards.
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
  const [menu, setMenu] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({
    breakfast: false,
    lunch: false,
    snack: false,
    dinner: false, // Added dinner
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = dayjs().format('YYYY-MM-DD');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not found.');

      // 1. Fetch today's menu
      const { data: menuData, error: menuError } = await supabase
        .from('daily_menu')
        .select('*')
        .eq('menu_date', today)
        .single();

      if (menuError && menuError.code !== 'PGRST116') {
        // PGRST116: No rows found. This is OK for menu.
        throw menuError;
      }

      // 2. Fetch user's confirmation for today
      const { data: confirmationData, error: confirmationError } =
        await supabase
          .from('confirmations')
          .select('*')
          .eq('menu_date', today)
          .eq('user_id', user.id)
          .single();

      if (confirmationError && confirmationError.code !== 'PGRST116') {
        // This is also OK, it just means the user hasn't made a choice yet.
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
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleToggle = async (mealType, newValue) => {
    const savingKey = mealType.split('_')[2]; // 'opt_in_breakfast' -> 'breakfast'
    setSaving((prev) => ({ ...prev, [savingKey]: true }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const today = dayjs().format('YYYY-MM-DD');

      const upsertData = {
        user_id: user.id,
        menu_date: today,
        ...confirmation, // Spread existing values
        [mealType]: newValue,
      };

      const { data: updatedConfirmation, error } = await supabase
        .from('confirmations')
        .upsert(upsertData, { onConflict: 'user_id, menu_date' })
        .select()
        .single();

      if (error) throw error;

      // Update local state to match the database
      setConfirmation(updatedConfirmation);
    } catch (error) {
      console.error('Error saving confirmation:', error.message);
      // You might want to show a snackbar error here
    } finally {
      setSaving((prev) => ({ ...prev, [savingKey]: false }));
    }
  };

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Could not load dashboard data: {error}
      </Alert>
    );
  }

  if (!menu) {
    return (
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">
          The menu for today has not been posted yet.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please check back later.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Today's Menu ({dayjs().format('MMMM D, YYYY')})
      </Typography>

      {isPastCutoff && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          The 12:30 PM cut-off time has passed. Selections for today are now
          locked.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <MealCard
            title="Breakfast"
            item={menu.item_breakfast}
            mealType="opt_in_breakfast"
            checked={!!confirmation?.opt_in_breakfast}
            onToggle={handleToggle}
            disabled={isPastCutoff}
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
            disabled={isPastCutoff}
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
            disabled={isPastCutoff}
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
            disabled={isPastCutoff}
            loading={saving.dinner}
          />
        </Grid>
      </Grid>
    </Box>
  );
}