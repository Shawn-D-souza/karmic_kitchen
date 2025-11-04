// src/layouts/AppLayout.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link as RouterLink } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, Box, 
  Container, IconButton, Menu, MenuItem, Avatar,
  // --- REMOVED: Select, FormControl, InputLabel ---
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu'; 

// --- SECTION 1: VAPID KEY AND HELPER FUNCTIONS ---
// (This section is unchanged)
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_GOES_HERE';

function urlBase64ToUint8Array(base64String) {
  // ... (function code)
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeUserToPush() {
  try {
    const swRegistration = await navigator.serviceWorker.ready;
    let subscription = await swRegistration.pushManager.getSubscription();

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user && subscription) {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscription,
        });
      if (error) throw error;
      console.log('User subscription saved to database.');
    }
  } catch (error) {
    console.error('Failed to subscribe user to push notifications:', error);
  }
}
// --- END OF SECTION 1 ---


// Updated Admin Navigation
const adminNav = [
  { name: 'Dashboard', path: '/' },
  { name: 'Daily Menu', path: '/menu' }, 
  { name: 'Templates', path: '/templates' },
  { name: 'Notifications', path: '/notifications' },
];

const employeeNav = [
  { name: 'Today\'s Menu', path: '/' }, // You might want to rename this to "Select Meals"
];


export default function AppLayout({ userProfile, setUserProfile, children }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await supabase.auth.signOut();
  };

  // --- REMOVED: handleWorkLocationChange function ---

  const navItems = userProfile?.role === 'admin' ? adminNav : employeeNav;
  const isEmployee = userProfile?.role === 'employee';

  // --- SECTION 2: SIMPLIFIED useEffect HOOK ---
  useEffect(() => {
    // Only run this logic for employees
    // and only if the browser supports notifications
    if (isEmployee && 'Notification' in window && 'serviceWorker' in navigator) {
      
      // --- REMOVED: WFH/Other check ---
      // Now it will ask all employees for permission.

      // Check current permission status
      if (Notification.permission === 'granted') {
        console.log('Notification permission already granted.');
        subscribeUserToPush();
      } else if (Notification.permission !== 'denied') {
        // If not granted or denied, ask for permission
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notification permission granted.');
            subscribeUserToPush();
          }
        });
      }
    }
  }, [isEmployee]); // --- REMOVED: userProfile?.work_location from dependencies
  // --- END OF SECTION 2 ---

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Karmic Kitchen
          </Typography>

          {/* Desktop Nav Links */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {navItems.map((item) => (
              <Button
                key={item.name}
                color="inherit"
                component={RouterLink}
                to={item.path}
              >
                {item.name}
              </Button>
            ))}
          </Box>

          {/* --- REMOVED: Work Location Dropdown for Employees --- */}
          
          {/* Profile Avatar & Menu */}
          <IconButton
            size="large"
            onClick={handleMenu}
            color="inherit"
            sx={{ ml: 2 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {userProfile?.full_name ? userProfile.full_name.charAt(0) : 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={open}
            onClose={handleClose}
            sx={{ mt: '45px' }}
          >
            <MenuItem disabled>{userProfile?.email}</MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: '1.25rem' }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Main content area */}
      <Container
        component="main"
        maxWidth="xl" 
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: '64px', 
        }}
      >
        {children}
      </Container>
    </Box>
  );
}