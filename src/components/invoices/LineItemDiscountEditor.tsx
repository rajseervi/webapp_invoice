"use client";
import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Popover,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PercentOutlined as PercentIcon
} from '@mui/icons-material';

interface LineItemDiscountEditorProps {
  discount: number;
  discountType: 'none' | 'category' | 'product' | 'custom';
  categoryDiscount?: number;
  productDiscount?: number;
  onSave: (discount: number, discountType: 'none' | 'category' | 'product' | 'custom') => void;
}

const LineItemDiscountEditor: React.FC<LineItemDiscountEditorProps> = ({
  discount,
  discountType,
  categoryDiscount = 0,
  productDiscount = 0,
  onSave
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [editValue, setEditValue] = useState<number>(discount);
  const [selectedType, setSelectedType] = useState<'none' | 'category' | 'product' | 'custom'>(discountType);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setEditValue(discount);
    setSelectedType(discountType);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSave = () => {
    console.log('Saving discount:', { 
      value: editValue, 
      type: selectedType 
    });
    onSave(editValue, selectedType);
    handleClose();
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    const newType = event.target.value as 'none' | 'category' | 'product' | 'custom';
    setSelectedType(newType);
    
    // Set the appropriate discount value based on the selected type
    if (newType === 'category') {
      setEditValue(categoryDiscount);
    } else if (newType === 'product') {
      setEditValue(productDiscount);
    } else if (newType === 'none') {
      setEditValue(0);
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'discount-popover' : undefined;

  // Determine the display text and color
  let displayText = `${discount}%`;
  let textColor = 'text.secondary';
  
  if (discount > 0) {
    textColor = 'primary.main';
    
    if (discountType === 'category') {
      displayText = `${discount}% (Category)`;
    } else if (discountType === 'product') {
      displayText = `${discount}% (Product)`;
    } else if (discountType === 'custom') {
      displayText = `${discount}% (Custom)`;
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Typography 
          variant="body2" 
          color={textColor}
          sx={{ mr: 1 }}
        >
          {displayText}
        </Typography>
        
        <Tooltip title="Edit discount">
          <IconButton 
            size="small" 
            onClick={handleClick}
            aria-describedby={id}
          >
            <PercentIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Paper sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            Edit Discount
          </Typography>
          
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Discount Type</InputLabel>
            <Select
              value={selectedType}
              label="Discount Type"
              onChange={handleTypeChange}
            >
              <MenuItem value="none">No Discount</MenuItem>
              {categoryDiscount > 0 && (
                <MenuItem value="category">Category Discount ({categoryDiscount}%)</MenuItem>
              )}
              {productDiscount > 0 && (
                <MenuItem value="product">Product Discount ({productDiscount}%)</MenuItem>
              )}
              <MenuItem value="custom">Custom Discount</MenuItem>
            </Select>
          </FormControl>
          
          {selectedType === 'custom' && (
            <TextField
              label="Discount Percentage"
              type="number"
              size="small"
              fullWidth
              value={editValue}
              onChange={(e) => setEditValue(Number(e.target.value))}
              inputProps={{ min: 0, max: 100, step: 0.5 }}
              sx={{ mb: 2 }}
            />
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              size="small" 
              onClick={handleClose}
              color="inherit"
            >
              Cancel
            </Button>
            <Button 
              size="small" 
              variant="contained"
              onClick={handleSave}
            >
              Apply
            </Button>
          </Box>
        </Paper>
      </Popover>
    </Box>
  );
};

export default LineItemDiscountEditor;