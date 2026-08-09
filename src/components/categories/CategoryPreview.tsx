'use client';
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  Category as CategoryIcon,
  Palette as PaletteIcon,
  Discount as DiscountIcon,
  Receipt as ReceiptIcon,
  Tag as TagIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { Category } from '@/types/inventory';

interface CategoryPreviewProps {
  data: Partial<Category>;
}

export default function CategoryPreview({ data }: CategoryPreviewProps) {
  const completionPercentage = React.useMemo(() => {
    const fields = [
      data.name,
      data.description,
      data.color,
      data.icon,
      data.tags?.length,
      data.defaultDiscount !== undefined,
      data.isActive !== undefined
    ];
    
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  }, [data]);

  return (
    <Box>
      {/* Main Preview Card */}
      <Card sx={{ mb: 3, overflow: 'visible' }}>
        <CardContent sx={{ textAlign: 'center', pb: 2 }}>
          <Badge
            badgeContent={data.isActive !== false ? 'Active' : 'Inactive'}
            color={data.isActive !== false ? 'success' : 'default'}
            sx={{ 
              '& .MuiBadge-badge': { 
                top: -8, 
                right: -8,
                fontSize: '0.7rem'
              } 
            }}
          >
            <Avatar
              sx={{
                bgcolor: data.color || '#1976d2',
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                fontSize: '32px',
                boxShadow: 3
              }}
            >
              <span className="material-icons" style={{ fontSize: '32px' }}>
                {data.icon || 'category'}
              </span>
            </Avatar>
          </Badge>
          
          <Typography variant="h6" gutterBottom>
            {data.name || 'Category Name'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {data.description || 'Category description will appear here'}
          </Typography>

          {data.tags && data.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
              {data.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {data.tags.length > 3 && (
                <Chip
                  label={`+${data.tags.length - 3} more`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Completion Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Setup Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={completionPercentage}
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary">
              {completionPercentage}%
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Details List */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CategoryIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Name"
                secondary={data.name || 'Not set'}
              />
            </ListItem>

            <Divider variant="inset" component="li" />

            <ListItem>
              <ListItemIcon>
                <PaletteIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Visual Style"
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: data.color || '#1976d2',
                        borderRadius: '50%',
                        border: '1px solid #e0e0e0'
                      }}
                    />
                    <Typography variant="caption">
                      {data.icon || 'category'} icon
                    </Typography>
                  </Box>
                }
              />
            </ListItem>

            {(data.defaultDiscount !== undefined && data.defaultDiscount > 0) && (
              <>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemIcon>
                    <DiscountIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Default Discount"
                    secondary={`${data.defaultDiscount}%`}
                  />
                </ListItem>
              </>
            )}



            
            <Divider variant="inset" component="li" />

            <ListItem>
              <ListItemIcon>
                {data.isActive !== false ? (
                  <VisibilityIcon color="success" />
                ) : (
                  <VisibilityOffIcon color="disabled" />
                )}
              </ListItemIcon>
              <ListItemText
                primary="Status"
                secondary={data.isActive !== false ? 'Active' : 'Inactive'}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Quick Stats
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, textAlign: 'center' }}>
            <Box>
              <Typography variant="h6" color="primary">
                0
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Products
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="primary">
                ₹0
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Value
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}