// src/pages/DailyMenuPlanner.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Paper, Box, Grid, TextField, 
  Button, CircularProgress, Alert 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { supabase } from '../supabaseClient';

const initialMenu = {
  item_breakfast: '',
  item_lunch: '',
  item_snack: '',
};

export default function DailyMenuPlanner() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [menu, setMenu] = useState(initialMenu);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchMenuData = useCallback(async (date) => {
    setLoading(true);
    setMessage(null);
    const dateString = date.format('YYYY-MM-DD');
    const dayOfWeek = date.day();

    try {
      // 1. Try to fetch from daily_menu
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_menu')
        .select('*')
        .eq('menu_date', dateString)
        .single();

      if (dailyError && dailyError.code !== 'PGRST116') { // PGRST116 = 'No rows found'
        throw dailyError;
      }

      if (dailyData) {
        // 2. Found in daily_menu
        setMenu(dailyData);
        setMessage({ type: 'info', text: 'Loaded existing menu for this date.' });
      } else {
        // 3. Not found, fetch from menu_templates
        const { data: templateData, error: templateError } = await supabase
          .from('menu_templates')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .single();

        if (templateError) throw templateError;

        if (templateData) {
          setMenu(templateData);
          setMessage({ type: 'info', text: `No daily menu found. Pre-filled from ${date.format('dddd')}'s template.` });
        } else {
          setMenu(initialMenu);
          setMessage({ type: 'warning', text: 'No daily menu or template found for this day.' });
        }
      }
    } catch (error) {
      console.error('Error fetching menu data:', error.message);
      setMessage({ type: 'error', text: `Error: ${error.message}` });
      setMenu(initialMenu);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData(selectedDate);
  }, [selectedDate, fetchMenuData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMenu(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const dateString = selectedDate.format('YYYY-MM-DD');

    try {
      const { error } = await supabase
        .from('daily_menu')
        .upsert(
          { 
            menu_date: dateString,
            item_breakfast: menu.item_breakfast,
            item_lunch: menu.item_lunch,
            item_snack: menu.item_snack,
          },
          { onConflict: 'menu_date' }
        );

      if (error) throw error;
      setMessage({ type: 'success', text: 'Menu saved successfully!' });
    } catch (error) {
      console.error('Error saving menu:', error.message);
      setMessage({ type: 'error', text: `Error saving: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Daily Menu Planner
      </Typography>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <DatePicker
              label="Select Menu Date"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              sx={{ width: '100%' }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box component="form" noValidate>
                <TextField
                  label="Breakfast Item"
                  name="item_breakfast"
                  value={menu.item_breakfast}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Lunch Item"
                  name="item_lunch"
                  value={menu.item_lunch}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Snack Item"
                  name="item_snack"
                  value={menu.item_snack}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ mt: 2, py: 1.5, px: 5 }}
                >
                  {saving ? <CircularProgress size={24} /> : 'Save Menu'}
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}