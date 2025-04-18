"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { RemoveQuickLinkDuplicatesButton } from '@/components/Common/RemoveQuickLinkDuplicatesButton';
import { findQuickLinkDuplicates } from '@/utils/quickLinkUtils';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// Define QuickLink interface
interface QuickLink {
  id: string;
  title: string;
  url: string;
  category?: string;
  order?: number;
  createdAt?: any;
}

export default function QuickLinksPage() {
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    category: ''
  });
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info'
  });

  // Fetch quick links
  const fetchQuickLinks = async () => {
    try {
      setLoading(true);
      const quickLinksRef = collection(db, 'quickLinks');
      const q = query(quickLinksRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      
      const links = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuickLink[];
      
      setQuickLinks(links);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching quick links:', err);
      const errorMessage = err.code 
        ? `Failed to fetch quick links (${err.code}). Please try again later.` 
        : 'Failed to fetch quick links. Please try again later.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchQuickLinks();
  }, []);

  // Handle adding a new quick link
  const handleAddLink = async () => {
    try {
      if (!newLink.title || !newLink.url) {
        setSnackbar({
          open: true,
          message: 'Title and URL are required',
          severity: 'error'
        });
        return;
      }

      // Ensure URL has http:// or https:// prefix
      let url = newLink.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Check for potential duplicates before adding
      const duplicatesResult = await findQuickLinkDuplicates();
      const potentialDuplicates = duplicatesResult.duplicates.filter(dup => 
        dup.links.some(link => {
          // Compare normalized URLs (without protocol, www, trailing slashes)
          const normalizedNewUrl = url.toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');
            
          const normalizedExistingUrl = link.url.toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');
            
          return normalizedNewUrl === normalizedExistingUrl;
        })
      );
      
      if (potentialDuplicates.length > 0) {
        if (!window.confirm(`A similar URL already exists. Are you sure you want to add this as a new link?`)) {
          return;
        }
      }

      const quickLinksRef = collection(db, 'quickLinks');
      await addDoc(quickLinksRef, {
        ...newLink,
        url,
        order: quickLinks.length + 1,
        createdAt: Timestamp.now()
      });

      setNewLink({
        title: '',
        url: '',
        category: ''
      });

      setSnackbar({
        open: true,
        message: 'Quick link added successfully',
        severity: 'success'
      });

      fetchQuickLinks();
    } catch (err: any) {
      console.error('Error adding quick link:', err);
      setSnackbar({
        open: true,
        message: 'Failed to add quick link',
        severity: 'error'
      });
    }
  };

  // Handle updating a quick link
  const handleUpdateLink = async () => {
    if (!editingLink) return;

    try {
      const linkRef = doc(db, 'quickLinks', editingLink.id);
      await updateDoc(linkRef, {
        title: editingLink.title,
        url: editingLink.url,
        category: editingLink.category || ''
      });

      setSnackbar({
        open: true,
        message: 'Quick link updated successfully',
        severity: 'success'
      });

      setEditingLink(null);
      fetchQuickLinks();
    } catch (err) {
      console.error('Error updating quick link:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update quick link',
        severity: 'error'
      });
    }
  };

  // Handle deleting a quick link
  const handleDeleteLink = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quick link?')) {
      return;
    }

    try {
      const linkRef = doc(db, 'quickLinks', id);
      await deleteDoc(linkRef);

      setSnackbar({
        open: true,
        message: 'Quick link deleted successfully',
        severity: 'success'
      });

      fetchQuickLinks();
    } catch (err) {
      console.error('Error deleting quick link:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete quick link',
        severity: 'error'
      });
    }
  };

  // Handle closing snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Quick Links
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Add New Quick Link
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Title"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="URL"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="https://example.com"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Category (optional)"
                value={newLink.category}
                onChange={(e) => setNewLink({ ...newLink, category: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddLink}
                sx={{ height: '100%' }}
              >
                Add Link
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Manage Quick Links
          </Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={fetchQuickLinks}
              disabled={loading}
            >
              Refresh
            </Button>
            <RemoveQuickLinkDuplicatesButton onComplete={fetchQuickLinks} />
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : quickLinks.length === 0 ? (
          <Alert severity="info">No quick links found. Add your first link above.</Alert>
        ) : (
          <Grid container spacing={2}>
            {quickLinks.map((link) => (
              <Grid item xs={12} sm={6} md={4} key={link.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" noWrap>
                      {link.title}
                    </Typography>
                    {link.category && (
                      <Typography variant="body2" color="text.secondary">
                        Category: {link.category}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {link.url}
                    </Typography>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <IconButton 
                      color="primary"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <LinkIcon />
                    </IconButton>
                    <IconButton 
                      color="primary"
                      onClick={() => setEditingLink(link)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error"
                      onClick={() => handleDeleteLink(link.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Edit Dialog */}
        {editingLink && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1300
            }}
            onClick={() => setEditingLink(null)}
          >
            <Paper
              sx={{ p: 3, maxWidth: 500, width: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="h6" gutterBottom>
                Edit Quick Link
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={editingLink.title}
                    onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="URL"
                    value={editingLink.url}
                    onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Category"
                    value={editingLink.category || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, category: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setEditingLink(null)}
                  >
                    Cancel
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleUpdateLink}
                  >
                    Save Changes
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </DashboardLayout>
  );
}