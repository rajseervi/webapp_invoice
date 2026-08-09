"use client";

import React, { useState, useRef } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Upload as UploadIcon,
  FileDownload as TemplateIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { productService } from "@/services/productService";

/* ---------- types ---------- */

interface ProductExportRow {
  id: string;
  name: string;
  category: string;
  supplier: string;
  price: number;
  new_price: number | null;
  quantity: number;
  new_quantity: number | null;
  description: string;
}

interface ParsedRow {
  row: number;       // Excel row (1-based with header)
  id: string | null;
  name: string;
  currentPrice: number;
  newPrice: number | null;
  currentQty: number;
  newQty: number | null;
}

interface UpdateResult {
  row: number;
  name: string;
  status: "success" | "not-found" | "no-change" | "error";
  message: string;
}

interface BulkPriceUpdateProps {
  onSuccess: () => void;
  selectedIds?: string[];
}

/* ---------- helpers ---------- */

const numOrNull = (v: unknown): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return isNaN(n) || n < 0 ? null : n;
};

const str = (v: unknown): string => (v == null ? "" : String(v).trim());

const colName = (row: any, ...names: string[]): string => {
  for (const n of names) if (row[n] !== undefined) return String(row[n] ?? "").trim();
  return "";
};

const colNum = (row: any, ...names: string[]): number | null => {
  for (const n of names) if (row[n] !== undefined) return numOrNull(row[n]);
  return null;
};

const generateTemplate = () => {
  const rows: ProductExportRow[] = [
    { id: "abc123", name: "Wireless Headphones", category: "Electronics", supplier: "", price: 2999, new_price: "", quantity: 25, new_quantity: "", description: "Noise-cancelling" },
    { id: "def456", name: "Cotton T-Shirt", category: "Clothing", supplier: "", price: 499, new_price: "", quantity: 100, new_quantity: "", description: "Summer collection" },
    { id: "ghi789", name: "Office Chair", category: "Furniture", supplier: "", price: 8999, new_price: "", quantity: 12, new_quantity: "", description: "Ergonomic" },
  ];

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 28 }, { wch: 28 }, { wch: 18 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Products");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "product_update_template.xlsx");
};

const exportAllProducts = async () => {
  const snap = await getDocs(collection(db, "products"));
  const rows: ProductExportRow[] = [];

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    rows.push({
      id: docSnap.id,
      name: str(d.name),
      category: str(d.categoryName || d.category || ""),
      supplier: str(d.supplier || d.supplierName || d.brand || ""),
      price: d.price ?? d.salePrice ?? 0,
      new_price: d.price ?? d.salePrice ?? 0,
      quantity: d.quantity ?? 0,
      new_quantity: d.quantity ?? 0,
      description: str(d.description),
    });
  });

  if (rows.length === 0) {
    alert("No products found.");
    return;
  }

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 28 }, { wch: 28 }, { wch: 18 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "All Products");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "all_products.xlsx");
};

const exportSelectedForUpdate = async (selectedIds: string[]) => {
  if (selectedIds.length === 0) {
    alert("Please select at least one product.");
    return;
  }

  const snaps = await Promise.all(selectedIds.map((id) => getDoc(doc(db, "products", id))));
  const rows: ProductExportRow[] = [];

  for (const snap of snaps) {
    if (!snap.exists()) continue;
    const d = snap.data();
    rows.push({
      id: snap.id,
      name: str(d.name),
      category: str(d.categoryName || d.category || ""),
      supplier: str(d.supplier || d.supplierName || d.brand || ""),
      price: d.price ?? d.salePrice ?? 0,
      new_price: d.price ?? d.salePrice ?? 0,
      quantity: d.quantity ?? 0,
      new_quantity: d.quantity ?? 0,
      description: str(d.description),
    });
  }

  if (rows.length === 0) {
    alert("Could not fetch selected product data.");
    return;
  }

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 28 }, { wch: 28 }, { wch: 18 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Products");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "selected_products.xlsx");
};

const parseExcel = async (file: File): Promise<ParsedRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(sheet);
        if (json.length === 0) throw new Error("Excel file is empty");

        const rows: ParsedRow[] = json.map((r: any, i: number) => {
          const rowNum = i + 2;
          const id = colName(r, "id", "ID", "product_id");
          const name = colName(r, "name", "Name", "product_name", "Product Name", "product");
          if (!name) throw new Error(`Row ${rowNum}: Missing product name`);

          return {
            row: rowNum,
            id: id || null,
            name,
            currentPrice: colNum(r, "price", "Price", "current_price") ?? 0,
            newPrice: colNum(r, "new_price", "New Price", "New_Price", "new price"),
            currentQty: colNum(r, "quantity", "Quantity", "qty", "stock") ?? 0,
            newQty: colNum(r, "new_quantity", "New Quantity", "new quantity", "new_quantity"),
          };
        });

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};

/* ---------- component ---------- */

const BulkPriceUpdate: React.FC<BulkPriceUpdateProps> = ({ onSuccess, selectedIds = [] }) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [results, setResults] = useState<UpdateResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "parsed" | "updating" | "done">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setOpen(true);
    setError(null);
    setParsedRows([]);
    setResults([]);
    setProgress(0);
    setPhase("idle");
  };

  const handleClose = () => setOpen(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setPhase("idle");
    try {
      const rows = await parseExcel(file);
      setParsedRows(rows);
      setPhase("parsed");
    } catch (err: any) {
      setError(err.message || "Parse error");
      setParsedRows([]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleUpdate = async () => {
    if (parsedRows.length === 0) return;
    setUploading(true);
    setPhase("updating");
    setProgress(0);
    setError(null);

    const resList: UpdateResult[] = [];
    const priceBatch: { productId: string; price: number }[] = [];
    const stockBatch: { productId: string; quantity: number }[] = [];

    for (let i = 0; i < parsedRows.length; i++) {
      const p = parsedRows[i];
      setProgress(Math.round(((i + 1) / parsedRows.length) * 100));

      try {
        let product = null;

        // Match by id first, then by name
        if (p.id) {
          product = await productService.getProductById(p.id);
        }
        if (!product) {
          product = await productService.findProductByName(p.name);
        }

        if (!product || !product.id) {
          resList.push({ row: p.row, name: p.name, status: "not-found", message: `Not found` });
          continue;
        }

        const changes: string[] = [];

        if (p.newPrice !== null && p.newPrice !== p.currentPrice) {
          priceBatch.push({ productId: product.id, price: p.newPrice });
          changes.push(`Price: ₹${p.currentPrice} → ₹${p.newPrice}`);
        }
        if (p.newQty !== null && p.newQty !== p.currentQty) {
          stockBatch.push({ productId: product.id, quantity: p.newQty });
          changes.push(`Qty: ${p.currentQty} → ${p.newQty}`);
        }

        resList.push({
          row: p.row,
          name: p.name,
          status: changes.length ? "success" : "no-change",
          message: changes.length ? changes.join(" | ") : "No changes",
        });
      } catch (err: any) {
        resList.push({ row: p.row, name: p.name, status: "error", message: err.message || "Error" });
      }
    }

    try {
      if (priceBatch.length) await productService.bulkUpdatePrices(priceBatch);
      if (stockBatch.length) await productService.bulkUpdateStock(stockBatch);
    } catch (err: any) {
      setError(`Firestore write error: ${err.message}`);
      for (const r of resList) {
        if (r.status === "success") {
          r.status = "error";
          r.message = "Write failed";
        }
      }
    }

    setResults(resList);
    setPhase("done");
    setProgress(100);
    setUploading(false);
  };

  const cnt = (s: string) => results.filter((r) => r.status === s).length;
  const hasPriceChange = parsedRows.some((r) => r.newPrice !== null && r.newPrice !== r.currentPrice);
  const hasQtyChange = parsedRows.some((r) => r.newQty !== null && r.newQty !== r.currentQty);

  return (
    <>
      <Button variant="outlined" startIcon={<UploadIcon />} onClick={reset} sx={{ mr: 1 }}>
        Update Prices & Stock
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Bulk Update (Excel)
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Export selected products to Excel, edit <strong>new_price</strong> and/or{" "}
            <strong>new_quantity</strong> columns, then upload.
            Only rows where the <em>new</em> value differs from the current value will be updated.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<TemplateIcon />} onClick={generateTemplate} size="small">
              Template
            </Button>
            <Button variant="outlined" startIcon={<TemplateIcon />} onClick={exportAllProducts} size="small">
              Export All Products
            </Button>
            {selectedIds.length > 0 && (
              <Button variant="outlined" startIcon={<TemplateIcon />} onClick={() => exportSelectedForUpdate(selectedIds)} size="small">
                Export Selected ({selectedIds.length})
              </Button>
            )}
            <Button variant="contained" component="label" startIcon={<UploadIcon />} disabled={uploading} size="small">
              Select Excel File
              <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={handleFile} />
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {uploading && phase === "updating" && (
            <Box sx={{ my: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Updating…</Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {/* Preview */}
          {phase === "parsed" && parsedRows.length > 0 && (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Typography variant="subtitle1">Review Changes:</Typography>
                <Chip label={`${parsedRows.length} items`} color="primary" size="small" />
              </Box>
              <Paper variant="outlined" sx={{ maxHeight: 250, overflow: "auto", mb: 2 }}>
                <List dense>
                  {parsedRows.slice(0, 50).map((p, i) => {
                    const pc = p.newPrice !== null && p.newPrice !== p.currentPrice;
                    const qc = p.newQty !== null && p.newQty !== p.currentQty;
                    return (
                      <React.Fragment key={i}>
                        <ListItem>
                          <ListItemText
                            primary={p.name}
                            secondary={
                              <Box component="span" sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                                {pc ? (
                                  <Chip label={`₹${p.currentPrice} → ₹${p.newPrice}`} size="small" color="success" />
                                ) : (
                                  <Chip label={`Price: ₹${p.currentPrice}`} size="small" variant="outlined" />
                                )}
                                {qc ? (
                                  <Chip label={`Qty: ${p.currentQty} → ${p.newQty}`} size="small" color="info" />
                                ) : (
                                  <Chip label={`Qty: ${p.currentQty}`} size="small" variant="outlined" />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {i < Math.min(parsedRows.length - 1, 49) && <Divider />}
                      </React.Fragment>
                    );
                  })}
                  {parsedRows.length > 50 && (
                    <ListItem>
                      <ListItemText primary={`… and ${parsedRows.length - 50} more`} />
                    </ListItem>
                  )}
                </List>
              </Paper>

              <Button
                variant="contained"
                color="primary"
                onClick={handleUpdate}
                disabled={uploading || (!hasPriceChange && !hasQtyChange)}
                fullWidth
              >
                {!hasPriceChange && !hasQtyChange ? "No Changes to Apply" : `Update ${parsedRows.length} Products`}
              </Button>
            </Box>
          )}

          {/* Results */}
          {phase === "done" && results.length > 0 && (
            <Box>
              <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                <Chip icon={<SuccessIcon />} label={`${cnt("success")} Updated`} color="success" variant="filled" />
                <Chip icon={<ErrorIcon />} label={`${cnt("not-found")} Not Found`} color="warning" variant="filled" />
                {cnt("no-change") > 0 && <Chip label={`${cnt("no-change")} No Change`} variant="outlined" />}
                {cnt("error") > 0 && <Chip icon={<ErrorIcon />} label={`${cnt("error")} Errors`} color="error" variant="filled" />}
              </Box>

              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: "auto" }}>
                <List dense>
                  {results.map((r, i) => (
                    <React.Fragment key={i}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600} color={
                              r.status === "success" ? "success.main" :
                              r.status === "not-found" ? "warning.main" :
                              r.status === "error" ? "error.main" : "text.secondary"
                            }>
                              Row {r.row}: {r.name}
                            </Typography>
                          }
                          secondary={<Typography variant="caption">{r.message}</Typography>}
                        />
                      </ListItem>
                      {i < results.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>

              <Button variant="contained" color="primary" onClick={() => { onSuccess(); handleClose(); }} fullWidth sx={{ mt: 2 }}>
                Done — Refresh
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={handleClose}>Close</Button></DialogActions>
      </Dialog>
    </>
  );
};

export default BulkPriceUpdate;
