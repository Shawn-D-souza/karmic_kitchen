import { createTheme } from '@mui/material/styles';

// A professional, clean theme for Karmic Kitchen
export const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50', // A "karmic" green
    },
    secondary: {
      main: '#ff9100', // An accent orange
    },
    background: {
      default: '#f4f6f8', // A very light grey background
    }
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // More professional buttons
          fontWeight: 600,
        },
      },
    },
  },
});

