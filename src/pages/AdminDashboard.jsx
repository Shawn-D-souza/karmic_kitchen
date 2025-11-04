import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Paper, Box, Grid, CircularProgress } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { supabase } from '../supabaseClient';

// Helper component for displaying counts
function CountCard({ title, count, loading }) {
  return (
    <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Typography variant="h3" component="p" color="primary">
          {count}
        </Typography>
      )}
    </Paper>
  );
}

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [counts, setCounts] = useState({ breakfast: 0, lunch: 0, snack: 0, dinner: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async (date) => {
    setLoading(true);
    const dateString = date.format('YYYY-MM-DD');

    try {
      const { data, error } = await supabase
        .from('confirmations')
        .select('opt_in_breakfast, opt_in_lunch, opt_in_snack, opt_in_dinner')
        .eq('menu_date', dateString);

      if (error) throw error;

      const totals = data.reduce(
        (acc, row) => {
          acc.breakfast += row.opt_in_breakfast ? 1 : 0;
          acc.lunch += row.opt_in_lunch ? 1 : 0;
          acc.snack += row.opt_in_snack ? 1 : 0;
          acc.dinner += row.opt_in_dinner ? 1 : 0; // Added dinner
          return acc;
        },
        { breakfast: 0, lunch: 0, snack: 0, dinner: 0 } // Added dinner
      );

      setCounts(totals);
    } catch (error) {
      console.error('Error fetching confirmation counts:', error.message);
      setCounts({ breakfast: 0, lunch: 0, snack: 0, dinner: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts(selectedDate);
  }, [selectedDate, fetchCounts]);

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
          Admin Dashboard
        </Typography>
        <DatePicker
          label="Select Date"
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)}
          sx={{ minWidth: 240 }}
        />
      </Box>
      <Typography variant="h5" gutterBottom>
        Meal Confirmations for: {selectedDate.format('MMMM D, YYYY')}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <CountCard title="Breakfast" count={counts.breakfast} loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CountCard title="Lunch" count={counts.lunch} loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CountCard title="Snack" count={counts.snack} loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CountCard title="Dinner" count={counts.dinner} loading={loading} />
        </Grid>
      </Grid>
    </Box>
  );
}