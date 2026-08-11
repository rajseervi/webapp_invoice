"use client";
import React from 'react';
import {
  Box, Chip, Avatar, Typography, LinearProgress, IconButton, Tooltip,
  useMediaQuery, useTheme, alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel,
  GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector,
  GridToolbarExport, GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import { Product, Category } from '@/types/inventory';

interface AdvancedProductsTableProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onSelectionChange: (ids: string[]) => void;
}

const formatCurrency = (val: number) => {
  const v = Number.isFinite(val) ? val : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(v);
};

const getStockStatus = (quantity: number, reorderPoint?: number) => {
  if (quantity === 0) return { label: 'Out of Stock', color: 'error' as const };
  if (quantity <= (reorderPoint || 10)) return { label: 'Low Stock', color: 'warning' as const };
  return { label: 'In Stock', color: 'success' as const };
};

export default function AdvancedProductsTable({
  products, categories, loading, onEdit, onDelete, onSelectionChange,
}: AdvancedProductsTableProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const categoryNameOf = (categoryId?: string) =>
    categories.find(c => c.id === categoryId)?.name || categoryId || 'Uncategorized';

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Product',
      flex: 1,
      minWidth: 190,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Avatar sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            width: 34, height: 34, fontSize: '0.8rem', fontWeight: 800,
          }}>
            {String(params.row.name || '?').charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{params.row.name}</Typography>
            {params.row.sku && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem', display: 'block' }}>
                {params.row.sku}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'categoryId',
      headerName: 'Category',
      width: 140,
      valueGetter: (_v, row) => categoryNameOf(row.categoryId),
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={String(params.value)} size="small" variant="outlined"
          sx={{ borderRadius: 1, fontSize: '0.7rem', height: 22 }} />
      ),
    },
    {
      field: 'salePrice',
      headerName: 'Sell Price',
      width: 110,
      valueGetter: (_v, row) => row.salePrice ?? row.price ?? 0,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={700}>{formatCurrency(params.value as number)}</Typography>
      ),
    },
    {
      field: 'purchasePrice',
      headerName: 'Cost Price',
      width: 110,
      valueGetter: (_v, row) => row.purchasePrice ?? 0,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" color="text.secondary">{formatCurrency(params.value as number)}</Typography>
      ),
    },
    {
      field: 'profitAmount',
      headerName: 'Profit',
      width: 95,
      valueGetter: (_v, row) => Math.max(0, (row.salePrice ?? row.price ?? 0) - (row.purchasePrice ?? 0)),
      renderCell: (params: GridRenderCellParams) => {
        const profit = params.value as number;
        return (
          <Typography variant="body2" fontWeight={600} color={profit > 0 ? 'success.main' : 'text.secondary'}>
            {formatCurrency(profit)}
          </Typography>
        );
      },
    },
    {
      field: 'quantity',
      headerName: 'Stock',
      width: 150,
      valueGetter: (_v, row) => row.quantity ?? 0,
      renderCell: (params: GridRenderCellParams) => {
        const qty = params.value as number;
        const status = getStockStatus(qty, params.row.reorderPoint);
        const pct = Math.min((qty / Math.max(params.row.reorderPoint || 50, 1)) * 100, 100);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 24 }}>{qty}</Typography>
            <LinearProgress variant="determinate" value={pct} sx={{
              flex: 1, height: 5, borderRadius: 3, minWidth: 50,
              backgroundColor: alpha(theme.palette.divider, 0.15),
              '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: theme.palette[status.color].main },
            }} />
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 125,
      valueGetter: (_v, row) => {
        const qty = row.quantity ?? 0;
        if (!row.isActive) return 'Inactive';
        return qty === 0 ? 'Out of Stock' : qty <= (row.reorderPoint || 10) ? 'Low Stock' : 'In Stock';
      },
      renderCell: (params: GridRenderCellParams) => {
        const isInactive = !params.row.isActive;
        const qty = params.row.quantity ?? 0;
        const color = isInactive ? 'default'
          : qty === 0 ? 'error'
          : qty <= (params.row.reorderPoint || 10) ? 'warning' : 'success';
        return (
          <Chip label={String(params.value)} color={color} size="small" variant="outlined"
            sx={{ borderRadius: 1, fontSize: '0.65rem', height: 20, fontWeight: 600 }} />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      sortable: false,
      filterable: false,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => onEdit(params.row)} sx={{ p: 0.5 }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => onDelete(String(params.row.id))} sx={{ p: 0.5 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // DataGrid requires unique string/number row ids — preserve real doc ids.
  const rows = products.map((p) => ({ ...p, id: p.id ?? `temp-${p.name}-${p.createdAt}` }));

  const handleSelection = (selection: GridRowSelectionModel) => {
    onSelectionChange(selection.map(String));
  };

  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        density={isMobile ? 'compact' : 'standard'}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={handleSelection}
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        slots={{
          toolbar: () => (
            <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <GridToolbarColumnsButton />
              <GridToolbarFilterButton />
              <GridToolbarDensitySelector />
              <GridToolbarExport />
              <Box sx={{ flex: 1 }} />
              <GridToolbarQuickFilter sx={{ width: { xs: '100%', sm: 220 } }} />
            </Box>
          ),
        }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          '& .MuiDataGrid-cell': { py: 0 },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
        }}
      />
    </Box>
  );
}
