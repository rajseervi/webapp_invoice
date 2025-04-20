"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Book as BookIcon,
  VideoLibrary as VideoLibraryIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export default function HelpDesk() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validate form
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setSuccessMessage('Your message has been sent! Our support team will get back to you soon.');
      setShowSuccessMessage(true);
      
      // Clear form
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (err: any) {
      setError('An error occurred. Please try again later.');
      console.error('Contact form error:', err);
    } finally {
      setLoading(false);
    }
  };

  // FAQ data
  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking on the "Forgot Password" link on the login page. You will receive an email with instructions to reset your password. Alternatively, you can go to your profile and select "Change Password" to update it if you are already logged in.'
    },
    {
      question: 'How do I create a new invoice?',
      answer: 'To create a new invoice, navigate to the Invoices section from the main dashboard, then click on the "New Invoice" button. Fill in the required details such as customer information, items, quantities, and prices. You can save the invoice as a draft or finalize it immediately.'
    },
    {
      question: 'Can I export my data to Excel?',
      answer: 'Yes, most data tables in the system have an export option. Look for the "Export" or "Download" button near the top of the data table. You can typically export to Excel, CSV, or PDF formats depending on the data type.'
    },
    {
      question: 'How do I add a new product to inventory?',
      answer: 'To add a new product, go to the Inventory section and click on "Add Product". Fill in the product details including name, description, SKU, price, and quantity. You can also add product categories and images if needed.'
    },
    {
      question: 'How do I generate reports?',
      answer: 'Reports can be generated from the Reports section. Select the type of report you need (sales, inventory, etc.), specify the date range and any other filters, then click "Generate Report". You can view the report online or download it in various formats.'
    },
    {
      question: 'How do I add a new user to the system?',
      answer: 'Only administrators can add new users. If you have admin privileges, go to the Users section and click "Add User". Enter the user\'s email address and select their role and permissions. The user will receive an invitation email to complete their registration.'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography component="h1" variant="h4" align="center" gutterBottom>
        Help Desk & Support Center
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
        Find answers to common questions or contact our support team for assistance
      </Typography>

      {/* Quick Links Section */}
      <Box sx={{ my: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Help
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={2}>
              <CardActionArea component={Link} href="/help-desk#faqs">
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <QuestionAnswerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">FAQs</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Browse frequently asked questions
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={2}>
              <CardActionArea component={Link} href="/help-desk#contact">
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <EmailIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Contact Support</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get in touch with our support team
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={2}>
              <CardActionArea component={Link} href="/help-desk#resources">
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <BookIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Resources</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tutorials, guides and documentation
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* FAQs Section */}
      <Box id="faqs" sx={{ my: 6, scrollMarginTop: '80px' }}>
        <Typography variant="h5" gutterBottom>
          Frequently Asked Questions
        </Typography>
        <Paper elevation={2} sx={{ p: 2 }}>
          {faqs.map((faq, index) => (
            <Accordion key={index} disableGutters>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`faq-content-${index}`}
                id={`faq-header-${index}`}
              >
                <Typography variant="subtitle1">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
              {index < faqs.length - 1 && <Divider />}
            </Accordion>
          ))}
        </Paper>
      </Box>

      {/* Resources Section */}
      <Box id="resources" sx={{ my: 6, scrollMarginTop: '80px' }}>
        <Typography variant="h5" gutterBottom>
          Resources & Guides
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <BookIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                Documentation
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><DashboardIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Dashboard Guide" 
                    secondary="Learn how to use the dashboard effectively" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InventoryIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Inventory Management" 
                    secondary="Complete guide to managing your inventory" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ReceiptIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Invoice Creation" 
                    secondary="Step-by-step guide to creating invoices" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PeopleIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Customer Management" 
                    secondary="How to manage your customer database" 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <VideoLibraryIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                Video Tutorials
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><SettingsIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Getting Started" 
                    secondary="Quick introduction to the system" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Account Security" 
                    secondary="How to secure your account" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ReceiptIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Advanced Invoicing" 
                    secondary="Learn advanced invoicing features" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><DashboardIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Reporting Features" 
                    secondary="How to generate and analyze reports" 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Contact Form Section */}
      <Box id="contact" sx={{ my: 6, scrollMarginTop: '80px' }}>
        <Typography variant="h5" gutterBottom>
          Contact Support
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Send us a message
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {successMessage}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Your Name"
                  name="name"
                  value={contactForm.name}
                  onChange={handleChange}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={contactForm.email}
                  onChange={handleChange}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleChange}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Message"
                  name="message"
                  multiline
                  rows={4}
                  value={contactForm.message}
                  onChange={handleChange}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Other ways to reach us
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Email Support" 
                    secondary="support@mastermind.com" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PhoneIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Phone Support" 
                    secondary="+1 (800) 123-4567 (Mon-Fri, 9AM-5PM EST)" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ChatIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Live Chat" 
                    secondary="Available on business days from 8AM to 8PM EST" 
                  />
                </ListItem>
              </List>
              
              <Box sx={{ mt: 4, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Support Hours
                </Typography>
                <Typography variant="body2">
                  Monday - Friday: 9:00 AM - 6:00 PM EST
                </Typography>
                <Typography variant="body2">
                  Saturday: 10:00 AM - 2:00 PM EST
                </Typography>
                <Typography variant="body2">
                  Sunday: Closed
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Success message snackbar */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={5000}
        onClose={() => setShowSuccessMessage(false)}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}