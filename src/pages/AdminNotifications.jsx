// src/pages/AdminNotifications.jsx
import React, { useState } from 'react';
import { 
  Typography, Paper, Box, TextField, 
  Button, CircularProgress, Alert 
} from '@mui/material';
import { supabase } from '../supabaseClient';

export default function AdminNotifications() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // { type, text }

  const handleSend = async () => {
    if (!message) {
      setStatus({ type: 'error', text: 'Please enter a message to send.' });
      return;
    }

    setSending(true);
    setStatus(null);

    try {
      // This calls the Edge Function you just deployed
      const { data, error } = await supabase.functions.invoke(
        'send-broadcast-notification',
        {
          body: { message: message },
        }
      );

      if (error) throw error;

      setStatus({ type: 'success', text: `Successfully sent: ${data.message}` });
      setMessage(''); // Clear message on success

    } catch (error) {
      setStatus({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Send Broadcast Notification
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Send a push notification to all employees (e.g., for a festival or event).
      </Typography>
      <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
        <Box component="form" noValidate>
          <TextField
            label="Notification Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            multiline
            rows={4}
            margin="normal"
            disabled={sending}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSend}
            disabled={sending}
            sx={{ mt: 2, py: 1.5, px: 5 }}
          >
            {sending ? <CircularProgress size={24} /> : 'Send to All Employees'}
          </Button>

          {status && (
            <Alert severity={status.type} sx={{ mt: 3 }}>
              {status.text}
            </Alert>
          )}
        </Box>
      </Paper>
    </Box>
  );
}