import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Chip
} from '@mui/material';

/**
 * Slide 11: Material UI (MUI) Integration Component
 * Triển khai các thành phần chuẩn MUI: AppBar, Toolbar, Typography, Button, Box, Chip
 */
export default function MuiAppBarDemo({ onAction }) {
  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: '12px',
        mb: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: '64px' }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              mr: 2,
              fontWeight: 800,
              letterSpacing: '.05rem',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            ⚛️ Slide 11: MUI AppBar Demo
          </Typography>

          <Chip
            label="Material Design v5"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mr: 2, color: '#93c5fd', borderColor: '#3b82f6' }}
          />

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => onAction && onAction('explore')}
              sx={{ borderColor: 'rgba(255,255,255,0.3)' }}
            >
              Khám Phá
            </Button>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              onClick={() => onAction && onAction('submit')}
              sx={{ fontWeight: 700 }}
            >
              + Đăng Dự Án
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
