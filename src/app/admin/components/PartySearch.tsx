"use client";
import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Button, Paper, Typography, Stack } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function PartySearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onSearch = async () => {
    if (!query || query.trim().length < 2) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search_parties', searchQuery: query.trim() })
      });
      const json = await res.json();
      if (json?.success) setResults(json.data || []);
      else setError(json?.error || 'Search failed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Typography variant="h6">Search Parties</Typography>
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, email, GST..."
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onSearch} disabled={loading} aria-label="search">
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        {error && <Typography color="error" variant="body2">{error}</Typography>}
        <List dense>
          {results.map((p) => (
            <ListItem key={p.id} divider>
              <ListItemText
                primary={p.name}
                secondary={p.phone || p.email || p.gstNumber || p.companyName || ''}
              />
              <ListItemSecondaryAction>
                <Button size="small" variant="outlined" onClick={() => router.push(`/ledger?partyId=${encodeURIComponent(p.id)}`)}>View Ledger</Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {!loading && results.length === 0 && (
            <Typography variant="body2" color="text.secondary">Enter a query to search parties</Typography>
          )}
        </List>
      </Stack>
    </Paper>
  );
}