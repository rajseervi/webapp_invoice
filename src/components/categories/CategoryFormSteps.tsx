'use client';
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Category as CategoryIcon,
  Palette as PaletteIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Category } from '@/types/inventory';

interface CategoryFormStepsProps {
  currentStep: number;
  data: Partial<Category>;
}

const steps = [
  {
    id: 0,
    title: 'Basic Information',
    icon: <CategoryIcon />,
    description: 'Name, description, and organization',
    fields: ['name', 'description', 'parentId', 'tags']
  },
  {
    id: 1,
    title: 'Visual Design',
    icon: <PaletteIcon />,
    description: 'Colors, icons, and appearance',
    fields: ['color', 'icon']
  },
  {
    id: 2,
    title: 'Settings & Configuration',
    icon: <SettingsIcon />,
    description: 'Defaults and final review',
    fields: ['defaultDiscount', 'isActive', 'sortOrder']
  }
];

export default function CategoryFormSteps({ currentStep, data }: CategoryFormStepsProps) {
  const getStepCompletion = (stepId: number) => {
    const step = steps[stepId];
    const completedFields = step.fields.filter(field => {
      const value = data[field as keyof Category];
      if (field === 'tags') return Array.isArray(value) && value.length > 0;
      if (field === 'isActive') return value !== undefined;
      return value !== undefined && value !== null && value !== '';
    });
    
    return {
      completed: completedFields.length,
      total: step.fields.length,
      percentage: Math.round((completedFields.length / step.fields.length) * 100)
    };
  };

  const isStepCompleted = (stepId: number) => {
    if (stepId === 0) return data.name?.trim().length > 0;
    if (stepId === 1) return true; // Visual design is optional
    if (stepId === 2) return true; // Settings are optional
    return false;
  };

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  return (
    <Card sx={{ height: 'fit-content' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Setup Progress
        </Typography>
        
        <List sx={{ p: 0 }}>
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const completion = getStepCompletion(index);
            const isCompleted = isStepCompleted(index);
            
            return (
              <React.Fragment key={step.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 2,
                    opacity: status === 'pending' ? 0.6 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 
                          status === 'completed' ? 'success.main' :
                          status === 'active' ? 'primary.main' : 'grey.300',
                        color: 'white',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {status === 'completed' ? (
                        <CheckCircleIcon sx={{ fontSize: 18 }} />
                      ) : status === 'active' ? (
                        step.icon
                      ) : (
                        <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />
                      )}
                    </Box>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {step.title}
                        </Typography>
                        {status === 'active' && (
                          <Chip 
                            label="Current" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                        {status === 'completed' && (
                          <Chip 
                            label="Complete" 
                            size="small" 
                            color="success" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {step.description}
                        </Typography>
                        
                        {status !== 'pending' && (
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {completion.completed} of {completion.total} fields
                              </Typography>
                              <Typography variant="caption" color="primary">
                                {completion.percentage}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={completion.percentage}
                              sx={{ 
                                height: 4, 
                                borderRadius: 2,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: status === 'completed' ? 'success.main' : 'primary.main'
                                }
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                
                {index < steps.length - 1 && (
                  <Divider sx={{ my: 1 }} />
                )}
              </React.Fragment>
            );
          })}
        </List>

        {/* Overall Progress */}
        <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            Overall Progress
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Step {currentStep + 1} of {steps.length}
            </Typography>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={((currentStep + 1) / steps.length) * 100}
            sx={{ 
              height: 6, 
              borderRadius: 3,
              bgcolor: 'grey.200'
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}