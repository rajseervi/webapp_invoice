'use client';
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Fade,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {
  ArrowBack,
  Save,
  Preview,
  Category as CategoryIcon,
  Palette as PaletteIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import { categoryService } from '@/services/categoryService';
import type { Category } from '@/types/inventory';
import NewCategoryForm from '@/components/categories/NewCategoryForm';
import CategoryPreview from '@/components/categories/CategoryPreview';
import CategoryFormSteps from '@/components/categories/CategoryFormSteps';
import CategoryCreationWelcome from '@/components/categories/CategoryCreationWelcome';

const steps = [
  {
    label: 'Basic Information',
    icon: <CategoryIcon />,
    description: 'Name, description, and organization'
  },
  {
    label: 'Visual Design',
    icon: <PaletteIcon />,
    description: 'Colors, icons, and appearance'
  },
  {
    label: 'Settings & Preview',
    icon: <SettingsIcon />,
    description: 'Defaults, GST, and final review'
  }
];

export default function NewCategoryPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [categoryData, setCategoryData] = useState<Partial<Category>>({
    name: '',
    description: '',
    parentId: null,
    isActive: true,
    sortOrder: 0,
    defaultDiscount: 0,
    defaultGstRate: null,
    color: '#1976d2',
    icon: 'category',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDataChange = (newData: Partial<Category>) => {
    setCategoryData(prev => ({ ...prev, ...newData }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!categoryData.name?.trim()) {
        setError('Category name is required');
        return;
      }

      await categoryService.createCategory(categoryData as Omit<Category, 'id'>);
      setSuccess(true);

      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push('/categories/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error creating category:', error);
      setError(error instanceof Error ? error.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return categoryData.name?.trim().length > 0;
      case 1:
        return true; // Visual design is optional
      case 2:
        return true; // Settings are optional
      default:
        return false;
    }
  };

  const getStepContent = (step: number) => {
    return (
      <NewCategoryForm
        data={categoryData}
        onChange={handleDataChange}
        currentStep={step}
      />
    );
  };

  const completionPercentage = React.useMemo(() => {
    const fields = [
      categoryData.name,
      categoryData.description,
      categoryData.color,
      categoryData.icon,
      categoryData.tags?.length,
      categoryData.defaultDiscount !== undefined,
      categoryData.isActive !== undefined
    ];

    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  }, [categoryData]);

  return (
    <VisuallyEnhancedDashboardLayout>
      <Container maxWidth="xl" sx={{ pt: 0, pb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Create New Category
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Organize your products by creating a new category with custom settings
          </Typography>
        </Box>

        {/* Enhanced Stepper */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={step.label} completed={index < activeStep || (index === activeStep && isStepValid(index))}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Form Section */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Fade in={true} key={activeStep}>
                <Box>
                  {getStepContent(activeStep)}
                </Box>
              </Fade>

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || !isStepValid(activeStep)}
                    startIcon={<Save />}
                  >
                    {loading ? 'Creating...' : 'Create Category'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(activeStep)}
                  >
                    Next Step
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Preview Section */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Live Preview</Typography>
                <CategoryPreview data={categoryData} />
              </Paper>
            </Box>
          </Grid>
        </Grid>

        {/* Notifications */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={success}
          autoHideDuration={3000}
          onClose={() => setSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
            Category created successfully! Redirecting...
          </Alert>
        </Snackbar>
      </Container>
    </VisuallyEnhancedDashboardLayout>
  );
}