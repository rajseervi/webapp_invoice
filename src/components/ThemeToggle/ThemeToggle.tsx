import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

export default function ThemeToggle() {
  const theme = useTheme();
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  
  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') as 'light' | 'dark' || 'light';
    setMode(savedTheme);
  }, []);
  
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    
    // Save to localStorage
    localStorage.setItem('themeMode', newMode);
    
    // Dispatch custom event to update theme
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newMode }));
  };
  
  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton onClick={toggleTheme} color="inherit">
        {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  );
}