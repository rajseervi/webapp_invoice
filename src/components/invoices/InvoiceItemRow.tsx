import React from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  Autocomplete,
  IconButton,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Product } from '@/types/inventory';
import { GST_RATES } from '@/services/gstService';

interface GstInvoiceItem {
  name: string;
  price: number;
  quantity: number;
  discount: number;
  discountType: 'none' | 'percentage' | 'amount';
  finalPrice: number;
  productId: string;
  category: string;
  gstRate: number;
  hsnCode: string;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxableAmount: number;
  totalTaxAmount: number;
}

interface InvoiceItemRowProps {
  item: GstInvoiceItem;
  index: number;
  products: Product[];
  isInterState: boolean;
  updateLineItem: (index: number, field: keyof GstInvoiceItem, value: any) => void;
  selectProduct: (index: number, product: Product | null) => void;
  removeLineItem: (index: number) => void;
}

export const InvoiceItemRow: React.FC<InvoiceItemRowProps> = ({
  item,
  index,
  products,
  isInterState,
  updateLineItem,
  selectProduct,
  removeLineItem,
}) => {
  return (
    <TableRow>
      <TableCell>
        <Autocomplete
          options={products.filter(p => p.isActive !== false)}
          getOptionLabel={(option) => option.name}
          value={products.find(p => p.id === item.productId) || null}
          onChange={(_, newValue) => selectProduct(index, newValue)}
          renderInput={(params) => (
            <TextField {...params} size="small" placeholder="Select product" sx={{ minWidth: 250 }} />
          )}
        />
      </TableCell>
      <TableCell>
        <TextField
          size="small"
          value={item.hsnCode}
          onChange={(e) => updateLineItem(index, 'hsnCode', e.target.value)}
          sx={{ width: 120 }}
        />
      </TableCell>
      <TableCell>
        <TextField
          size="small"
          type="number"
          value={item.quantity}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              updateLineItem(index, 'quantity', '');
            } else {
              const numericValue = Number(value);
              if (numericValue >= 0 && !isNaN(numericValue)) {
                updateLineItem(index, 'quantity', numericValue);
              }
            }
          }}
          sx={{ width: 80 }}
        />
      </TableCell>
      <TableCell>
        <TextField
          size="small"
          type="number"
          value={item.price}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              updateLineItem(index, 'price', '');
            } else {
              const numericValue = Number(value);
              if (numericValue >= 0 && !isNaN(numericValue)) {
                updateLineItem(index, 'price', numericValue);
              }
            }
          }}
          sx={{ width: 100 }}
        />
      </TableCell>
      <TableCell>
        <TextField
          size="small"
          type="number"
          value={item.discount}
          onChange={(e) => {
            const value = e.target.value;
            const numericValue = Number(value);
            if (value === '' || (numericValue >= 0 && !isNaN(numericValue))) {
              updateLineItem(index, 'discount', value === '' ? 0 : numericValue);
            }
          }}
          sx={{ width: 80 }}
        />
      </TableCell>
      <TableCell>
        <TextField
          size="small"
          select
          value={item.gstRate}
          onChange={(e) => updateLineItem(index, 'gstRate', Number(e.target.value))}
          sx={{ width: 80 }}
        >
          {GST_RATES.map((rate) => (
            <MenuItem key={rate} value={rate}>
              {rate}%
            </MenuItem>
          ))}
        </TextField>
      </TableCell>
      <TableCell>
        <Typography variant="body2">₹{item.taxableAmount.toFixed(2)}</Typography>
      </TableCell>
      {isInterState ? (
        <TableCell>
          <Typography variant="body2">₹{item.igstAmount.toFixed(2)}</Typography>
        </TableCell>
      ) : (
        <>
          <TableCell>
            <Typography variant="body2">₹{item.cgstAmount.toFixed(2)}</Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2">₹{item.sgstAmount.toFixed(2)}</Typography>
          </TableCell>
        </>
      )}
      <TableCell>
        <Typography variant="body2">₹{(item.taxableAmount + item.totalTaxAmount).toFixed(2)}</Typography>
      </TableCell>
      <TableCell>
        <IconButton onClick={() => removeLineItem(index)} color="error" size="small">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};
