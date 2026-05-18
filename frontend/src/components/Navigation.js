import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

const Navigation = () => {
  return (
    <AppBar position="static" sx={{ bgcolor: '#1e293b' }}>
      <Toolbar>
        <SecurityIcon sx={{ mr: 2, color: '#00bcd4' }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#00bcd4' }}>
          Cyber Threat Intelligence
        </Typography>
        <Typography variant="body2" sx={{ color: '#ff4081' }}>
          GCN + ViT Models
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;