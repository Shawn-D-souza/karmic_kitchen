// src/pages/WeeklyTemplates.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Paper, Box, Tabs, Tab, TextField,
  Button, CircularProgress, Alert, Snackbar
} from '@mui/material';
import { supabase } from '../supabaseClient';

const daysOfWeek = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

// TabPanel helper component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function WeeklyTemplates() {
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Sunday
  const [templates, setTemplates] = useState({}); // Stores all 7 templates
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_templates')
        .select('*');
      
      if (error) throw error;

      // Convert array to object keyed by day_of_week for easier access
      const templatesObj = data.reduce((acc, t) => {
        acc[t.day_of_week] = t;
        return acc;
      }, {});
      
      setTemplates(templatesObj);
    } catch (error) {
      console.error('Error fetching templates:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleTabChange = (event, newValue) => {
    setSelectedDay(newValue);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTemplates(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        day_of_week: selectedDay,
        [name]: value,
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const currentTemplate = templates[selectedDay] || { day_of_week: selectedDay };

    // Ensure all fields are at least empty strings if not set
    const templateData = {
      day_of_week: selectedDay,
      item_breakfast: currentTemplate.item_breakfast || '',
      item_lunch: currentTemplate.item_lunch || '',
      item_snack: currentTemplate.item_snack || '',
      item_dinner: currentTemplate.item_dinner || '', // Added dinner
    };

    try {
      const { error } = await supabase
        .from('menu_templates')
        .upsert(templateData, { onConflict: 'day_of_week' });

      if (error) throw error;
      setSnackbarMessage('Template saved successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving template:', error.message);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const currentData = templates[selectedDay] || {};

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Weekly Menu Templates
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Set the default menu items for each day of the week. This will be used to
        auto-fill the Daily Menu Planner.
      </Typography>
      
      <Paper elevation={3} sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedDay} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            aria-label="weekly menu templates"
          >
            {daysOfWeek.map((day, index) => (
              <Tab label={day} key={index} id={`template-tab-${index}`} />
            ))}
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          daysOfWeek.map((day, index) => (
            <TabPanel value={selectedDay} index={index} key={index}>
              <Box component="form" noValidate>
                <TextField
                  label={`${day}'s Breakfast`}
                  name="item_breakfast"
                  value={currentData.item_breakfast || ''}
                  onChange={handleFormChange}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label={`${day}'s Lunch`}
                  name="item_lunch"
                  value={currentData.item_lunch || ''}
                  onChange={handleFormChange}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label={`${day}'s Snack`}
                  name="item_snack"
                  value={currentData.item_snack || ''}
                  onChange={handleFormChange}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label={`${day}'s Dinner`}
                  name="item_dinner"
                  value={currentData.item_dinner || ''}
                  onChange={handleFormChange}
                  fullWidth
                  margin="normal"
                />
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ mt: 2, py: 1.5, px: 5 }}
                >
                  {saving ? <CircularProgress size={24} /> : `Save ${day}'s Template`}
                </Button>
              </Box>
            </TabPanel>
          ))
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Box>
  );
}