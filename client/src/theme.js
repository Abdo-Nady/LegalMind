import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0A2540', // Deep Navy - Authority
      light: '#234061', // Lighter Navy for hovers
      dark: '#051626', // Darker Navy
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#C5A065', // Metallic Gold - Premium
      light: '#D4B582', // Lighter Gold
      dark: '#A07D45', // Darker Gold for hovers/active
      contrastText: '#0A2540',
    },
    background: {
      default: '#FAF9F6', // Premium White
      paper: '#FFFFFF',
    },
    info: {
      main: '#14B8A6', // Teal - Accent
      light: '#45C7B8',
      dark: '#0E8174', // Darker Teal for hovers
      contrastText: '#FFFFFF',
    },
    text: {
      primary: '#0A2540', // Deep Navy for reading text
      secondary: '#475569', // Slate grey for subtitles
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

export default theme;
