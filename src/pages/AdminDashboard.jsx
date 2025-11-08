import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Tooltip,
  LinearProgress,
  Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import IcecreamIcon from '@mui/icons-material/Icecream';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import TodayIcon from '@mui/icons-material/Today';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { supabase } from '../supabaseClient';

// Larger meal cards
function MealCountCard({ title, icon, count, loading }) {
  return (
    <Card sx={{ borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 200, width: '100%' }}>
      {loading ? <LinearProgress /> : null}
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={3}>
          <Avatar sx={{ width: 60, height: 60 }}>{icon}</Avatar>
          <Box>
            <Typography variant="h6" noWrap color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {loading ? '—' : count}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [counts, setCounts] = useState({
    breakfast: 0,
    lunch: 0,
    snack: 0,
    dinner: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dateString = dayjs(selectedDate).format('YYYY-MM-DD');

      const { data, error: qError } = await supabase
        .from('confirmations')
        .select('opt_in_breakfast, opt_in_lunch, opt_in_snack, opt_in_dinner')
        .eq('menu_date', dateString);

      if (qError) throw qError;

      const totals = (data || []).reduce(
        (acc, row) => {
          if (row.opt_in_breakfast) acc.breakfast += 1;
          if (row.opt_in_lunch) acc.lunch += 1;
          if (row.opt_in_snack) acc.snack += 1;
          if (row.opt_in_dinner) acc.dinner += 1;
          return acc;
        },
        { breakfast: 0, lunch: 0, snack: 0, dinner: 0 }
      );

      setCounts(totals);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching confirmation counts:', err?.message || err);
      setError('Could not load counts. Please try again.');
      setCounts({ breakfast: 0, lunch: 0, snack: 0, dinner: 0 });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const total =
    counts.breakfast + counts.lunch + counts.snack + counts.dinner;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Card
        elevation={0}
        sx={{ mb: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}
      >
        <CardHeader
          avatar={
            <Avatar>
              <TodayIcon />
            </Avatar>
          }
          title={<Typography variant="h5" sx={{ fontWeight: 700 }}>Admin Dashboard</Typography>}
          subheader="Meal confirmations overview"
          action={
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={fetchCounts} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          }
        />
        <Divider />
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
          >
            <DatePicker
              label="Select date"
              value={selectedDate}
              onChange={(val) => setSelectedDate(val || dayjs())}
              slotProps={{
                textField: {
                  size: 'small',
                },
              }}
            />
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip label={`Total: ${total}`} />
              {lastUpdated ? (
                <Chip
                  variant="outlined"
                  label={`Updated: ${dayjs(lastUpdated).format('HH:mm:ss')}`}
                />
              ) : null}
            </Stack>
          </Stack>
          {error ? (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : null}
        </CardContent>
      </Card>

      <Grid container spacing={3} alignItems="stretch" justifyContent="stretch">
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <MealCountCard
            title="Breakfast"
            icon={<FreeBreakfastIcon />}
            count={counts.breakfast}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <MealCountCard
            title="Lunch"
            icon={<RestaurantIcon />}
            count={counts.lunch}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <MealCountCard
            title="Snack"
            icon={<IcecreamIcon />}
            count={counts.snack}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <MealCountCard
            title="Dinner"
            icon={<DinnerDiningIcon />}
            count={counts.dinner}
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
