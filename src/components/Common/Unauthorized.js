import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button } from '@mui/material';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, textAlign: 'center' }}>
        <Typography variant="h1" component="h1" gutterBottom>
          403
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          You don't have permission to access this page.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(-1)}
          sx={{ mt: 2, mr: 2 }}
        >
          Go Back
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Dashboard
        </Button>
      </Paper>
    </Container>
  );
};

export default Unauthorized;