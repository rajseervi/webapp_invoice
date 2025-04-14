"use client";
import React from 'react';
import { 
  Box, 
  ToggleButtonGroup, 
  ToggleButton, 
  Typography,
  useTheme,
  alpha,
  Tooltip,
  Paper
} from '@mui/material';
import { 
  ViewModule as ModernIcon, 
  ViewCompact as MinimalistIcon, 
  ViewStream as ClassicIcon 
} from '@mui/icons-material';

export type TemplateType = 'modern' | 'classic' | 'minimalist';

interface TemplateSwitcherProps {
  selectedTemplate: TemplateType;
  onTemplateChange: (template: TemplateType) => void;
  label?: string;
  showLabels?: boolean;
}

const TemplateSwitcher: React.FC<TemplateSwitcherProps> = ({ 
  selectedTemplate, 
  onTemplateChange,
  label = 'Select Template Style',
  showLabels = false
}) => {
  const theme = useTheme();
  
  const handleTemplateChange = (
    event: React.MouseEvent<HTMLElement>,
    newTemplate: TemplateType | null,
  ) => {
    if (newTemplate !== null) {
      onTemplateChange(newTemplate);
    }
  };
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 1,
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)'
      }}
    >
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      
      <ToggleButtonGroup
        value={selectedTemplate}
        exclusive
        onChange={handleTemplateChange}
        aria-label="invoice template selection"
        size="small"
      >
        <Tooltip title="Modern Template">
          <ToggleButton value="modern" aria-label="modern template">
            {showLabels ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ModernIcon fontSize="small" />
                <Typography variant="caption">Modern</Typography>
              </Box>
            ) : (
              <ModernIcon fontSize="small" />
            )}
          </ToggleButton>
        </Tooltip>
        
        <Tooltip title="Classic Template">
          <ToggleButton value="classic" aria-label="classic template">
            {showLabels ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ClassicIcon fontSize="small" />
                <Typography variant="caption">Classic</Typography>
              </Box>
            ) : (
              <ClassicIcon fontSize="small" />
            )}
          </ToggleButton>
        </Tooltip>
        
        <Tooltip title="Minimalist Template">
          <ToggleButton value="minimalist" aria-label="minimalist template">
            {showLabels ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MinimalistIcon fontSize="small" />
                <Typography variant="caption">Minimalist</Typography>
              </Box>
            ) : (
              <MinimalistIcon fontSize="small" />
            )}
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </Paper>
  );
};

export default TemplateSwitcher;