"use client";
import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Paper,
  Typography,
  TableCell,
  TableRow,
  Chip,
  IconButton,
  alpha,
  keyframes,
  styled,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Remove as RemoveIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import { ReportDateRange, formatINR } from '@/services/advancedReportService';

// ─── Animations & colors ─────────────────────────────────────────────────────

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const COLORS = [
  '#FF6B35', '#004E98', '#3A86FF', '#8338EC', '#FF006E', '#FB5607', '#FFBE0B', '#06D6A0',
];

// ─── Styled containers (cartoon-brutalist card language) ─────────────────────

export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  border: `2px solid ${alpha(theme.palette.common.black, 0.12)}`,
  boxShadow: `6px 6px 0px ${alpha(theme.palette.common.black, 0.08)}`,
  transition: 'all 0.25s ease',
  overflow: 'visible',
  '&:hover': {
    boxShadow: `8px 8px 0px ${alpha(theme.palette.common.black, 0.14)}`,
    transform: 'translateY(-2px)',
  },
}));

export const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  border: `2px solid ${alpha(theme.palette.common.black, 0.14)}`,
  boxShadow: `5px 5px 0px ${alpha(theme.palette.common.black, 0.1)}`,
  transition: 'all 0.25s ease',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  '&:hover': {
    boxShadow: `7px 7px 0px ${alpha(theme.palette.common.black, 0.16)}`,
    transform: 'translateY(-3px)',
  },
}));

export const FilterPanel = styled(Paper)(({ theme }) => ({
  borderRadius: 14,
  border: `2px solid ${alpha(theme.palette.common.black, 0.12)}`,
  boxShadow: `4px 4px 0px ${alpha(theme.palette.common.black, 0.08)}`,
  background: theme.palette.background.paper,
  overflow: 'hidden',
}));

export const TableHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: alpha(theme.palette.text.secondary, 0.8),
  borderBottom: `2px solid ${alpha(theme.palette.common.black, 0.1)}`,
}));

// ─── Tab panel ───────────────────────────────────────────────────────────────

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`report-tabpanel-${index}`}>
      {value === index && (
        <Box sx={{ animation: `${fadeIn} 0.35s ease-out`, pt: 3 }}>{children}</Box>
      )}
    </div>
  );
}

// ─── Small presentational helpers ────────────────────────────────────────────

export function AvatarCircle({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(color, 0.12),
        color,
        border: `2px solid ${alpha(color, 0.25)}`,
        flexShrink: 0,
        '& svg': { fontSize: 18 },
      }}
    >
      {children}
    </Box>
  );
}

export interface TrendData {
  /** Percentage change, e.g. 12.5 = +12.5% */
  value: number;
  label?: string;
  /** When true, up = bad (e.g. discounts) */
  invert?: boolean;
}

export function StatDisplay({
  label,
  value,
  sub,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: TrendData;
}) {
  const theme = useTheme();
  const trendColor = trend
    ? trend.value === 0
      ? theme.palette.text.secondary
      : trend.invert
        ? trend.value < 0
          ? theme.palette.success.main
          : theme.palette.error.main
        : trend.value > 0
          ? theme.palette.success.main
          : theme.palette.error.main
    : undefined;

  return (
    <StatCard>
      <Box sx={{ '&::before': { background: color } }} />
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block' }}
            >
              {label}
            </Typography>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                mt: 0.5,
                lineHeight: 1.1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: { xs: '1.1rem', md: '1.35rem' },
              }}
            >
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
                {sub}
              </Typography>
            )}
            {trend && trendColor && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.25,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 999,
                    bgcolor: alpha(trendColor, 0.12),
                    color: trendColor,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    lineHeight: 1.5,
                  }}
                >
                  {trend.value === 0 ? (
                    <RemoveIcon sx={{ fontSize: 12 }} />
                  ) : trend.value > 0 ? (
                    <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                  ) : (
                    <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                  )}
                  {Math.abs(trend.value).toFixed(1)}%
                </Box>
                {trend.label && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {trend.label}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          <AvatarCircle color={color}>{icon}</AvatarCircle>
        </Box>
      </CardContent>
    </StatCard>
  );
}

export function EmptyState({
  colSpan,
  message,
  icon,
}: {
  colSpan: number;
  message: string;
  icon?: React.ReactNode;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25 }}>
          {icon && <Box sx={{ display: 'flex', color: 'text.disabled' }}>{icon}</Box>}
          <Typography color="text.secondary" fontWeight={600}>
            {message}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
}

export function FilterToggleHeader({
  title,
  chip,
  open,
  onToggle,
}: {
  title: React.ReactNode;
  chip: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, cursor: 'pointer', userSelect: 'none' }}
      onClick={onToggle}
    >
      <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {title}
        {chip}
      </Typography>
      <IconButton size="small">{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
    </Box>
  );
}

// ─── Chart helpers ───────────────────────────────────────────────────────────

export function ChartEmptyState({ message = 'No data for the selected filters' }: { message?: string }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 180,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
        borderRadius: 3,
        border: `2px dashed ${alpha(theme.palette.common.black, 0.1)}`,
        bgcolor: alpha(theme.palette.grey[500], 0.045),
      }}
    >
      <ChartIcon sx={{ fontSize: 44, color: 'text.disabled' }} />
      <Typography color="text.secondary" fontWeight={600} variant="body2">
        {message}
      </Typography>
    </Box>
  );
}

interface TooltipPayloadItem {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: { color?: string; [key: string]: unknown };
}

export function ReportTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: React.ReactNode;
  format?: (value: number | string) => string;
}) {
  const theme = useTheme();
  if (!active || !payload || payload.length === 0) return null;

  const formatter =
    format ?? ((value: number | string) => (typeof value === 'number' ? formatINR(value) : String(value)));

  return (
    <Paper
      elevation={0}
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 2,
        border: `2px solid ${alpha(theme.palette.common.black, 0.14)}`,
        boxShadow: `4px 4px 0px ${alpha(theme.palette.common.black, 0.12)}`,
        bgcolor: theme.palette.background.paper,
        minWidth: 120,
      }}
    >
      {label !== undefined && label !== '' && (
        <Typography variant="caption" fontWeight={800} sx={{ display: 'block', mb: 0.5 }}>
          {String(label)}
        </Typography>
      )}
      {payload.map((entry, index) => {
        const color =
          entry.color || entry.payload?.color || COLORS[index % COLORS.length];
        const displayValue = entry.value !== undefined && entry.value !== null ? formatter(entry.value) : '—';
        return (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {entry.name !== undefined ? String(entry.name) : 'Value'}:
            </Typography>
            <Typography variant="caption" fontWeight={800}>
              {displayValue}
            </Typography>
          </Box>
        );
      })}
    </Paper>
  );
}

// ─── Date range presets ──────────────────────────────────────────────────────

export interface RangePreset {
  label: string;
  range: ReportDateRange | null;
}

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function buildRangePresets(): RangePreset[] {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  return [
    { label: 'Today', range: { startDate: fmtDate(today), endDate: fmtDate(today) } },
    { label: 'Last 7 Days', range: { startDate: fmtDate(new Date(today.getTime() - 6 * 86400000)), endDate: fmtDate(today) } },
    { label: 'Last 30 Days', range: { startDate: fmtDate(new Date(today.getTime() - 29 * 86400000)), endDate: fmtDate(today) } },
    { label: 'This Month', range: { startDate: fmtDate(startOfMonth), endDate: fmtDate(endOfMonth) } },
    { label: 'Last Month', range: { startDate: fmtDate(startOfLastMonth), endDate: fmtDate(endOfLastMonth) } },
    { label: 'This Year', range: { startDate: fmtDate(startOfYear), endDate: fmtDate(today) } },
    { label: 'All Time', range: null },
  ];
}

export function RangePresetButtons({
  value,
  onChange,
}: {
  value: ReportDateRange | null;
  onChange: (range: ReportDateRange | null) => void;
}) {
  const presets = useMemo(() => buildRangePresets(), []);
  const isEqual = (a: ReportDateRange | null, b: ReportDateRange | null) => {
    if (a === null || b === null) return a === b;
    return a.startDate === b.startDate && a.endDate === b.endDate;
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {presets.map((preset) => {
        const active = isEqual(value, preset.range);
        return (
          <Chip
            key={preset.label}
            label={preset.label}
            onClick={() => onChange(preset.range)}
            color={active ? 'primary' : 'default'}
            variant={active ? 'filled' : 'outlined'}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        );
      })}
    </Box>
  );
}
