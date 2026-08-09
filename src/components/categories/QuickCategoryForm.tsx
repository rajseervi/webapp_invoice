import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    CircularProgress,
} from '@mui/material';
import { Category } from '@/types/inventory';

interface QuickCategoryFormProps {
    onSubmit: (data: Omit<Category, 'id'>) => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function QuickCategoryForm({ onSubmit, onCancel, loading }: QuickCategoryFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        defaultDiscount: 0,
        isActive: true
    });

    const [errors, setErrors] = useState<{ name?: string; defaultDiscount?: string }>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        const newErrors: { name?: string; defaultDiscount?: string } = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit({
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    label="Category Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={!!errors.name}
                    helperText={errors.name}
                    sx={{ mb: 2 }}
                    autoFocus
                />

                <TextField
                    fullWidth
                    type="number"
                    label="Default Discount (%)"
                    value={formData.defaultDiscount}
                    onChange={(e) => setFormData({ ...formData, defaultDiscount: Number(e.target.value) })}
                    InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                    error={!!errors.defaultDiscount}
                    helperText={errors.defaultDiscount || 'Applied to new products in this category'}
                    sx={{ mb: 2 }}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            color="primary"
                        />
                    }
                    label="Active"
                />

            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {loading ? 'Creating...' : 'Create Category'}
                </Button>
            </Box>
        </Box>
    );
}
