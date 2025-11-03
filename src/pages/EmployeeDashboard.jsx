import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

export default function EmployeeDashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Today's Menu
      </Typography>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Welcome to Karmic Kitchen!
        </Typography>
        <Typography variant="body1">
          The daily menu for breakfast, lunch, and snacks will appear here.
        </Typography>
      </Paper>
    </Box>
  );
}

