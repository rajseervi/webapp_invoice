"use client";

import React, { useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import InventoryIcon from "@mui/icons-material/Inventory";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import CategoryIcon from "@mui/icons-material/Category";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { Product, Category } from "@/types/inventory";

// Props expected by the page usage
interface ProductDashboardProps {
  products: Product[];
  categories: Category[];
  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    totalValue: number;
    averagePrice: number;
    gstRateDistribution: Record<number, number>;
  };
  onRefresh: () => void;
}

// Simple stat card component to keep layout clean
function StatCard({
  icon,
  label,
  value,
  color = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "info"
    | "error";
}) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {label}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ProductDashboard({
  products,
  categories,
  stats,
  onRefresh,
}: ProductDashboardProps) {
  // Derived data for quick insights
  const inactiveCount = useMemo(
    () => products.filter((p) => !p.isActive).length,
    [products]
  );

  const lowStockItems = useMemo(
    () =>
      products
        .filter((p) => (p.quantity ?? 0) < (p.reorderPoint ?? 10))
        .sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0))
        .slice(0, 8),
    [products]
  );

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const cid = (p as any).categoryId || (p as any).category || "uncategorized";
      map.set(cid, (map.get(cid) || 0) + 1);
    }
    // Map category id/name to display name
    const nameById = new Map<string, string>();
    for (const c of categories) {
      const id = (c as any).id || (c as any).name;
      const name = (c as any).name || id || "Unknown";
      if (id) nameById.set(String(id), String(name));
    }
    const arr = Array.from(map.entries()).map(([id, count]) => ({
      id,
      name: nameById.get(String(id)) || id,
      count,
    }));
    return arr.sort((a, b) => b.count - a.count).slice(0, 6);
  }, [products, categories]);

  const gstDistribution = useMemo(() => {
    const entries = Object.entries(stats.gstRateDistribution || {});
    return entries
      .map(([rate, count]) => ({ rate: Number(rate), count }))
      .sort((a, b) => a.rate - b.rate);
  }, [stats.gstRateDistribution]);

  return (
    <Box>
      {/* Header with refresh */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5">Overview</Typography>
        <Tooltip title="Refresh data">
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onRefresh}>
            Refresh
          </Button>
        </Tooltip>
      </Box>

      {/* Top stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<InventoryIcon sx={{ fontSize: 40 }} color="primary" />}
            label="Total Products"
            value={stats.totalProducts}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} color="success" />}
            label="Active Products"
            value={stats.activeProducts}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<WarningIcon sx={{ fontSize: 40 }} color="warning" />}
            label="Low Stock Items"
            value={stats.lowStockProducts}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<MonetizationOnIcon sx={{ fontSize: 40 }} color="info" />}
            label="Total Inventory Value"
            value={`₹${(stats.totalValue || 0).toLocaleString()}`}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Secondary insights */}
      <Grid container spacing={3} mt={0.5}>
        {/* Category distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <CategoryIcon />
                  <Typography variant="h6">Top Categories</Typography>
                </Box>
              }
              subheader="Most populated categories"
            />
            <Divider />
            <CardContent>
              {categoryCounts.length === 0 ? (
                <Typography color="text.secondary">No category data</Typography>
              ) : (
                <List>
                  {categoryCounts.map((c) => (
                    <ListItem key={c.id} disableGutters secondaryAction={<Chip label={c.count} size="small" />}>
                      <ListItemText primary={c.name} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* GST distribution and inactive */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <AssessmentIcon />
                  <Typography variant="h6">GST Distribution & Status</Typography>
                </Box>
              }
              subheader="Rates across products"
            />
            <Divider />
            <CardContent>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  GST Rates
                </Typography>
                {gstDistribution.length === 0 ? (
                  <Typography color="text.secondary">No GST data</Typography>
                ) : (
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {gstDistribution.map((g) => (
                      <Chip key={g.rate} label={`${g.rate}% • ${g.count}`} size="small" />
                    ))}
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2">Inactive products:</Typography>
                <Chip color="warning" label={inactiveCount} size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Low stock preview */}
      <Grid container spacing={3} mt={0.5}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <WarningIcon />
                  <Typography variant="h6">Low Stock (Top {lowStockItems.length})</Typography>
                </Box>
              }
              subheader="Items below reorder point"
            />
            <Divider />
            <CardContent>
              {lowStockItems.length === 0 ? (
                <Typography color="text.secondary">No low stock items</Typography>
              ) : (
                <List>
                  {lowStockItems.map((p) => (
                    <ListItem key={p.id} disableGutters secondaryAction={<Chip color="error" label={p.quantity ?? 0} size="small" />}>
                      <ListItemText
                        primary={p.name || p.id}
                        secondary={`Reorder @ ${p.reorderPoint ?? 10}${p.unit ? ` • ${p.unit}` : ""}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}