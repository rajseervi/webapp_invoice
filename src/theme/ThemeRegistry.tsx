'use client'
import createCache from '@emotion/cache'
import { useServerInsertedHTML } from 'next/navigation'
import { CacheProvider } from '@emotion/react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme, { getTheme } from './theme'
import { useState, useEffect } from 'react'

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({
      key: 'mui',
    })
    cache.compat = true
    const prevInsert = cache.insert
    let inserted: string[] = []
    cache.insert = (...args) => {
      const serialized = args[1]
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name)
      }
      return prevInsert(...args)
    }
    const flush = () => {
      const prevInserted = inserted
      inserted = []
      return prevInserted
    }
    return { cache, flush }
  })

  useServerInsertedHTML(() => {
    const names = flush()
    if (names.length === 0) {
      return null
    }
    let styles = ''
    for (const name of names) {
      styles += cache.inserted[name]
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    )
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') || 'light';
    setCurrentTheme(getTheme(savedTheme as 'light' | 'dark'));

    const handleThemeChange = (event: CustomEvent) => {
      const newThemeMode = event.detail as 'light' | 'dark';
      setCurrentTheme(getTheme(newThemeMode));
    };

    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
    };
  }, []);

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  )
}