import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link as RouterLink } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, Box, 
  Container, IconButton, Menu, MenuItem, Avatar,
  Select, FormControl, InputLabel
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu'; 

// Updated Admin Navigation
const adminNav = [
  { name: 'Dashboard', path: '/' },
  { name: 'Daily Menu', path: '/menu' }, 
  { name: 'Templates', path: '/templates' },
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