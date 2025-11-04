import React, { useState, useEffect } from 'react'; // Make sure to import useEffect
import { supabase } from '../supabaseClient';
import { Link as RouterLink } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, Box, 
  Container, IconButton, Menu, MenuItem, Avatar,
  Select, FormControl, InputLabel
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu'; 

// --- SECTION 1: VAPID KEY AND HELPER FUNCTIONS ---

// IMPORTANT: Replace this string with the VAPID_PUBLIC_KEY you generated
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_GOES_HERE';

// Helper function to convert base64 string
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper function to subscribe the user
async function subscribeUserToPush() {
  try {
    const swRegistration = await navigator.serviceWorker.ready;
    
    // Check if user is already subscribed
    let subscription = await swRegistration.pushManager.getSubscription();

    if (!subscription) {
      // Not subscribed, create a new one
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
    }

    // Send the subscription to our Supabase table
    const { data: { user } } = await supabase.auth.getUser();
    if (user && subscription) {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscription, // The unique subscription object
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
  { name: 'Notifications', path: '/notifications' }, // <-- ADDED THIS LINK
];

const employeeNav = [
  { name: 'Today\'s Menu', path: '/' },
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

  const handleWorkLocationChange = async (event) => {
    const newLocation = event.target.value;
    
    // Optimistically update UI
    setUserProfile(prev => ({ ...prev, work_location: newLocation }));

    // Update database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('profiles')
        .update({ work_location: newLocation })
        .eq('id', user.id);
      
      if (error) throw error;

    } catch (error) {
      console.error('Error updating work location:', error.message);
      // You could add a snackbar here to notify the user of a failed update
    }
  };

  const navItems = userProfile?.role === 'admin' ? adminNav : employeeNav;
  const isEmployee = userProfile?.role === 'employee';

  // --- SECTION 2: ADD THIS useEffect HOOK ---
  useEffect(() => {
    // Only run this logic for employees
    // and only if the browser supports notifications
    if (isEmployee && 'Notification' in window && 'serviceWorker' in navigator) {
      
      // Don't ask WFH/Other users for notifications
      if (userProfile?.work_location === 'WFH' || userProfile?.work_location === 'Other') {
        console.log('User is WFH/Other, not subscribing to notifications.');
        return;
      }

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
  }, [isEmployee, userProfile?.work_location]); // Runs when profile loads or location changes
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

          {/* Work Location Dropdown for Employees */}
          {isEmployee && (
            <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
              <InputLabel id="work-location-label" sx={{ color: 'white' }}>Work Location</InputLabel>
              <Select
                labelId="work-location-label"
                id="work-location-select"
                value={userProfile?.work_location || 'Main Office'}
                label="Work Location"
                onChange={handleWorkLocationChange}
                sx={{ 
                  color: 'white', 
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="Main Office">Main Office</MenuItem>
                <MenuItem value="WFH">Work From Home (WFH)</MenuItem>
                <MenuItem value="Other">Any other</MenuItem>
              </Select>
            </FormControl>
          )}

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