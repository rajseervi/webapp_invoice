"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { backupService } from '@/services/backupService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  retentionDays: number;
  collections: string[];
}

export default function BackupScheduler() {
  const { userId } = useCurrentUser();
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [newSchedule, setNewSchedule] = useState<Partial<BackupSchedule>>({
    name: '',
    frequency: 'daily',
    time: '02:00',
    enabled: true,
    retentionDays: 30,
    collections: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSchedules();
  }, [userId]);

  const loadSchedules = async () => {
    // In a real implementation, you would load schedules from your backend
    // For now, we'll use localStorage as a simple example
    try {
      const savedSchedules = localStorage.getItem(`backup_schedules_${userId}`);
      if (savedSchedules) {
        setSchedules(JSON.parse(savedSchedules));
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const saveSchedules = (updatedSchedules: BackupSchedule[]) => {
    try {
      localStorage.setItem(`backup_schedules_${userId}`, JSON.stringify(updatedSchedules));
      setSchedules(updatedSchedules);
    } catch (error) {
      console.error('Error saving schedules:', error);
      setError('Failed to save schedule');
    }
  };

  const handleCreateSchedule = () => {
    if (!newSchedule.name || !userId) return;

    const schedule: BackupSchedule = {
      id: `schedule_${Date.now()}`,
      name: newSchedule.name,
      frequency: newSchedule.frequency || 'daily',
      time: newSchedule.time || '02:00',
      enabled: newSchedule.enabled !== false,
      retentionDays: newSchedule.retentionDays || 30,
      collections: newSchedule.collections || [],
      nextRun: calculateNextRun(newSchedule.frequency || 'daily', newSchedule.time || '02:00')
    };

    const updatedSchedules = [...schedules, schedule];
    saveSchedules(updatedSchedules);
    
    // Reset form
    setNewSchedule({
      name: '',
      frequency: 'daily',
      time: '02:00',
      enabled: true,
      retentionDays: 30,
      collections: []
    });

    setSuccess('Backup schedule created successfully');
  };

  const handleToggleSchedule = (scheduleId: string) => {
    const updatedSchedules = schedules.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, enabled: !schedule.enabled }
        : schedule
    );
    saveSchedules(updatedSchedules);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    const updatedSchedules = schedules.filter(schedule => schedule.id !== scheduleId);
    saveSchedules(updatedSchedules);
    setSuccess('Schedule deleted successfully');
  };

  const handleRunNow = async (schedule: BackupSchedule) => {
    if (!userId) return;

    try {
      setLoading(true);
      await backupService.createAutoBackup(userId);
      
      // Update last run time
      const updatedSchedules = schedules.map(s => 
        s.id === schedule.id 
          ? { 
              ...s, 
              lastRun: new Date().toISOString(),
              nextRun: calculateNextRun(s.frequency, s.time)
            }
          : s
      );
      saveSchedules(updatedSchedules);
      
      setSuccess('Backup executed successfully');
    } catch (error) {
      setError('Failed to execute backup');
    } finally {
      setLoading(false);
    }
  };

  const calculateNextRun = (frequency: string, time: string): string => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, move to next occurrence
    if (nextRun <= now) {
      switch (frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }
    
    return nextRun.toISOString();
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'success';
      case 'weekly': return 'warning';
      case 'monthly': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Create New Schedule */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Create Backup Schedule
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Schedule Name"
              value={newSchedule.name}
              onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
              fullWidth
              size="small"
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={newSchedule.frequency}
                  label="Frequency"
                  onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value as any })}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Time"
                type="time"
                value={newSchedule.time}
                onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                label="Retention (days)"
                type="number"
                value={newSchedule.retentionDays}
                onChange={(e) => setNewSchedule({ ...newSchedule, retentionDays: parseInt(e.target.value) })}
                size="small"
                inputProps={{ min: 1, max: 365 }}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={newSchedule.enabled !== false}
                  onChange={(e) => setNewSchedule({ ...newSchedule, enabled: e.target.checked })}
                />
              }
              label="Enable schedule"
            />
            
            <Button
              variant="contained"
              onClick={handleCreateSchedule}
              disabled={!newSchedule.name || loading}
              startIcon={<ScheduleIcon />}
            >
              Create Schedule
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Existing Schedules */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Backup Schedules
          </Typography>
          
          {schedules.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No backup schedules configured. Create your first schedule above.
            </Typography>
          ) : (
            <List>
              {schedules.map((schedule, index) => (
                <React.Fragment key={schedule.id}>
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon color={schedule.enabled ? 'primary' : 'disabled'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{schedule.name}</Typography>
                          <Chip
                            label={schedule.frequency}
                            size="small"
                            color={getFrequencyColor(schedule.frequency) as any}
                          />
                          {!schedule.enabled && (
                            <Chip label="Disabled" size="small" color="default" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Time: {schedule.time} • Retention: {schedule.retentionDays} days
                          </Typography>
                          {schedule.lastRun && (
                            <Typography variant="caption" color="text.secondary">
                              Last run: {formatDateTime(schedule.lastRun)}
                            </Typography>
                          )}
                          {schedule.nextRun && schedule.enabled && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Next run: {formatDateTime(schedule.nextRun)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        onClick={() => handleToggleSchedule(schedule.id)}
                        color={schedule.enabled ? 'warning' : 'success'}
                        title={schedule.enabled ? 'Disable' : 'Enable'}
                      >
                        {schedule.enabled ? <PauseIcon /> : <PlayIcon />}
                      </IconButton>
                      <IconButton
                        onClick={() => handleRunNow(schedule)}
                        color="primary"
                        title="Run Now"
                        disabled={loading}
                      >
                        <HistoryIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        color="error"
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < schedules.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Backup schedules are stored locally and require the application to be running 
          to execute. For production use, consider implementing server-side scheduling with cron jobs or 
          cloud functions.
        </Typography>
      </Alert>
    </Box>
  );
}