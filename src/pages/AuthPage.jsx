import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Container, Box, TextField, Button, Typography, 
  Alert, Paper, Tabs, Tab
} from '@mui/material';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Only for sign up
  const [employeeId, setEmployeeId] = useState(''); // New field
  const [mobileNumber, setMobileNumber] = useState(''); // New field
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        // Handle Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // Handle Sign Up
        if (!email.endsWith('@karmic.co.in')) {
          throw new Error('Registration is only allowed with a @karmic.co.in email address.');
        }
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              employee_id: employeeId,
              mobile_number: mobileNumber,
              work_location: 'Main Office', // Default work location
              role: 'employee', // All signups default to 'employee'
            },
          },
        });
        if (error) throw error;
        setMessage('Check your email for a confirmation link to log in.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setIsLogin(newValue === 0);
    setError(null);
    setMessage(null);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={6}
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: { xs: 2, sm: 4 }, // Responsive padding
          borderRadius: 2
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Karmic Kitchen
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
          <Tabs value={isLogin ? 0 : 1} onChange={handleTabChange} centered>
            <Tab label="Login" />
            <Tab label="Sign Up" />
          </Tabs>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2, width: '100%' }}>
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{message}</Alert>}
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address (e.g., user@karmic.co.in)"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!isLogin && (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                id="fullName"
                label="Full Name"
                name="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="employeeId"
                label="Employee ID"
                name="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="mobileNumber"
                label="Mobile Number"
                name="mobileNumber"
                autoComplete="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem' }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}