import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
} from '@mui/material';
import {
    Category as CategoryIcon,
} from '@mui/icons-material';
import { Category } from '@/types/inventory';
import CategoryForm from '@/components/CategoryForm';
import QuickCategoryForm from './QuickCategoryForm';

interface CategoryDialogProps {
    open: boolean;
    onClose: () => void;
    category: Category | null;
    onSubmit: (data: Omit<Category, 'id'>) => void;
    loading: boolean;
}

const SimplifiedCategoryDialog: React.FC<CategoryDialogProps> = ({
    open,
    onClose,
    category,
    onSubmit,
    loading,
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    borderRadius: 2,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: '8px 8px 0 0'
            }}>
                <CategoryIcon />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {category ? 'Edit Category' : 'Quick Add Category'}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                {category ? (
                    <CategoryForm
                        initialData={category}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                        loading={loading}
                    />
                ) : (
                    <QuickCategoryForm
                        onSubmit={onSubmit}
                        onCancel={onClose}
                        loading={loading}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SimplifiedCategoryDialog;
