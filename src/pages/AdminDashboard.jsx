import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

export default function AdminDashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Welcome, Admin!
        </Typography>
        <Typography variant="body1">
          This is the secure dashboard for Karmic Kitchen Administrators. 
          The main dashboard for viewing meal confirmations will be here.
        </Typography>
      </Paper>
    </Box>
  );
}

